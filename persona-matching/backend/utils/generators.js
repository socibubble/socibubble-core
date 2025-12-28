import crypto from 'crypto';
import pool from '../db/pool.js';

/**
 * Generate Root ID in format U00001
 */
export function generateRootID(number) {
  return `U${String(number).padStart(5, '0')}`;
}

/**
 * Generate Public ID in format #001
 */
export function generatePublicID(number) {
  return `#${String(number).padStart(3, '0')}`;
}

/**
 * Generate 11-character hash from name
 */
export function generateHash(name) {
  const salt = Array.from({ length: 6 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
  
  const hash = crypto.createHash('sha256').update(name + salt).digest('hex');
  return hash.substring(0, 11).toUpperCase();
}

/**
 * Get next user number for ID generation
 */
export async function getNextUserNumber() {
  const result = await pool.query('SELECT COUNT(*) FROM core.users');
  return parseInt(result.rows[0].count) + 1;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
