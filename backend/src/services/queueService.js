// Background-job queue service for the Profirmo backend (Phase 6).
//
// enqueue() inserts a `Job` row; the worker (src/jobs/worker.js) polls the
// table and runs the matching handler. The queue is database-backed so it
// needs no extra infrastructure (no Redis) and survives restarts.

const { Job } = require('../models');

/**
 * Enqueue a background job.
 *
 * @param {string} type - handler key, e.g. 'email'
 * @param {object} payload - JSON arguments passed to the handler
 * @param {object} [opts]
 * @param {number} [opts.maxAttempts=3] - retry ceiling
 * @param {Date}   [opts.runAt=now]     - earliest eligible run time
 * @returns {Promise<object>} the created Job row
 */
async function enqueue(type, payload = {}, opts = {}) {
  if (!type) throw new Error('enqueue: job "type" is required');
  const maxAttempts =
    Number(opts.maxAttempts) > 0 ? Math.floor(Number(opts.maxAttempts)) : 3;
  const runAt = opts.runAt instanceof Date ? opts.runAt : new Date();

  const job = await Job.create({
    type,
    payload: payload || {},
    status: 'pending',
    attempts: 0,
    maxAttempts,
    runAt,
  });
  return job;
}

module.exports = { enqueue };
