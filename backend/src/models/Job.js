// Sequelize model: Job (Phase 6)
//   One row per queued background job. The worker (src/jobs/worker.js) polls
//   this table for `pending` jobs whose `runAt` has passed, claims them
//   atomically, and runs the matching handler from src/jobs/handlers.js.
//
//   id          - generated job id (primary key)
//   type        - handler key, e.g. 'email' (indexed)
//   payload     - JSON job arguments
//   status      - 'pending' | 'processing' | 'completed' | 'failed' (indexed)
//   attempts    - number of times the job has been attempted
//   maxAttempts - retry ceiling; once attempts >= maxAttempts the job fails
//   runAt       - earliest time the job is eligible to run (indexed)
//   lastError   - last error message (nullable)
//   completedAt - time the job finished successfully (nullable)
//   + timestamps

const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../config/database');
const jsonField = require('./jsonField');

const genJobId = () =>
  `job-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

const Job = sequelize.define(
  'Job',
  {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
      defaultValue: genJobId,
    },
    type: { type: DataTypes.STRING, allowNull: false },
    payload: jsonField('payload', {}),
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    runAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    lastError: { type: DataTypes.TEXT, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'jobs',
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['runAt'] },
    ],
  }
);

module.exports = Job;
