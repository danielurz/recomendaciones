/**
 * Inactivity reputation decay script.
 * Run once per week via cron or task scheduler.
 *
 * Rule: users inactive for 90+ days lose 0.5% of their reputation_score
 * per execution, down to a floor of 1.0.
 *
 * Example cron (every Monday at 3am):
 *   0 3 * * 1 node /path/to/backend/src/config/reputation-decay.js
 */
import 'dotenv/config';
import pool from './db.js';
import ReputationService from '../services/reputation.service.js';

const affected = await ReputationService.applyInactivityDecay();
console.log(`Reputation decay applied to ${affected} users.`);
await pool.end();
