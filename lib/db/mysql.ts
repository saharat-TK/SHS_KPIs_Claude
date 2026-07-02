import mysql from "mysql2/promise";

// Server-only: never import this from a "use client" component. Cache the
// pool on globalThis in dev so Next.js Fast Refresh doesn't spin up a new
// pool (and eventually exhaust connections) on every module re-evaluation.
declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });
}

export const pool = global._mysqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global._mysqlPool = pool;
}
