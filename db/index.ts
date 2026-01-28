import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema';

// Create PostgreSQL connection pool optimized for Neon
// Neon serverless PostgreSQL works best with these settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  // Connection pool settings optimized for 200 users on free tier
  max: 20, // Maximum connections (Neon free tier supports up to 100, but we limit to save resources)
  min: 0, // No minimum connections - connect on demand to avoid blocking startup
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 15000, // Longer timeout for Neon database wake-up (15 seconds)
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Handle pool errors without crashing
pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
  // Don't exit - allow reconnection attempts
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
