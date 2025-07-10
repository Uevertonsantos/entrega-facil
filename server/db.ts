import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced PostgreSQL configuration for Render compatibility
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false,
    sslmode: 'require'
  } : false,
  max: 10, // Reduced for Render free tier
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Increased timeout for Render
  maxUses: 7500,
};

// Log connection attempt for debugging
console.log("Database connection config:", {
  hasUrl: !!process.env.DATABASE_URL,
  environment: process.env.NODE_ENV,
  ssl: connectionConfig.ssl,
  max: connectionConfig.max
});

export const pool = new Pool(connectionConfig);

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });