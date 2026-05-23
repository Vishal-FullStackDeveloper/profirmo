// Background-job worker for the Profirmo backend (Phase 6).
//
// startWorker() runs a setInterval poll loop that:
//   1. Selects up to ~10 `pending` jobs whose runAt has passed.
//   2. ATOMICALLY claims each one (UPDATE ... WHERE id=? AND status='pending')
//      — only the process that flips the row to 'processing' runs it, so the
//      same job is never executed twice even with multiple workers.
//   3. Runs the matching handler in try/catch.
//      - success -> status:'completed', completedAt:now
//      - failure -> attempts += 1; if attempts < maxAttempts the job is
//        re-queued with an exponential-ish backoff, otherwise it is 'failed'.
//
// A handler error is always caught and logged: it must never crash the
// process or stop the poll loop.

const { Op } = require('sequelize');
const { Job } = require('../models');
const env = require('../config/env');
const { getHandler } = require('./handlers');

// Max jobs claimed per poll tick.
const BATCH_SIZE = 10;
// Retry backoff: attempts * RETRY_BASE_MS before a job becomes eligible again.
const RETRY_BASE_MS = 30 * 1000;

// Guards against overlapping ticks if a batch takes longer than the interval.
let ticking = false;
let timer = null;

/**
 * Process a single claimed job (its status is already 'processing').
 * @param {object} job - the claimed Job row
 */
async function runJob(job) {
  const handler = getHandler(job.type);
  try {
    if (typeof handler !== 'function') {
      throw new Error(`No handler registered for job type "${job.type}"`);
    }
    await handler(job.payload || {});
    await job.update({
      status: 'completed',
      completedAt: new Date(),
      lastError: null,
    });
  } catch (err) {
    const message = (err && (err.message || String(err))) || 'Unknown error';
    const attempts = (job.attempts || 0) + 1;
    if (attempts < job.maxAttempts) {
      await job.update({
        status: 'pending',
        attempts,
        runAt: new Date(Date.now() + attempts * RETRY_BASE_MS),
        lastError: message,
      });
      console.warn(
        `[Worker] job ${job.id} (${job.type}) failed, retry ` +
          `${attempts}/${job.maxAttempts}: ${message}`
      );
    } else {
      await job.update({ status: 'failed', attempts, lastError: message });
      console.error(
        `[Worker] job ${job.id} (${job.type}) FAILED permanently ` +
          `after ${attempts} attempt(s): ${message}`
      );
    }
  }
}

/**
 * One poll tick: claim and run a batch of eligible jobs. Never throws.
 */
async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const candidates = await Job.findAll({
      where: { status: 'pending', runAt: { [Op.lte]: new Date() } },
      order: [['runAt', 'ASC']],
      limit: BATCH_SIZE,
    });

    for (const candidate of candidates) {
      // Atomic claim: only proceed if THIS update flipped the row.
      const [affected] = await Job.update(
        { status: 'processing' },
        { where: { id: candidate.id, status: 'pending' } }
      );
      if (affected !== 1) continue; // another worker claimed it first

      // Reload so the in-memory row reflects status:'processing'.
      const job = await Job.findByPk(candidate.id);
      if (job) await runJob(job);
    }
  } catch (err) {
    // A poll-loop error must never crash the process.
    console.error('[Worker] poll tick error:', (err && err.message) || err);
  } finally {
    ticking = false;
  }
}

/**
 * Start the background-job worker. Idempotent — calling it twice is a no-op.
 * @returns {object} the interval handle
 */
function startWorker() {
  if (timer) return timer;
  console.log(
    `[Worker] background-job worker started (poll every ${env.jobPollMs}ms).`
  );
  timer = setInterval(() => {
    tick().catch((err) =>
      console.error('[Worker] unexpected tick rejection:', err)
    );
  }, env.jobPollMs);
  // Do not keep the event loop alive solely for the worker.
  if (typeof timer.unref === 'function') timer.unref();
  return timer;
}

/**
 * Stop the worker (used by tests / graceful shutdown).
 */
function stopWorker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startWorker, stopWorker };
