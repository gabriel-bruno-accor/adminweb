import { drizzle } from "drizzle-orm/node-postgres";
import pg from 'pg';
import * as schema from "../shared/schema";

const { Pool } = pg;

// Initialize connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Test the database connection
pool.connect()
  .then(client => {
    console.log("PostgreSQL database connection has been established successfully.");
    client.release();
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

// Initialize Drizzle with the connection pool and schema
export const db = drizzle(pool, { schema });

export { pool };
