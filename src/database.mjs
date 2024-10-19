/**
 * @file This file exports a database connection.
 * First it uses the default arguments to connect to the database.
 * That means you should set up the environment variables in the .env file properly.
 *
 * Then it uses that connection to create and update the database schema.
 * The update compares the version stored in the databases with the version defined in the `package.json`.
 *
 * Finally it exports the connection so that it can be used in other files.
 *
 * When you're done, you need to close the connection.
 */

/**
 * @example <summary>Example usage of the database connection.</summary>
 * ```js
 *    import pool from '@plushveil/database'
 *    const db = await pool.connect()
 *    db.query('SELECT * FROM info WHERE environment = $1', [process.env.NODE_ENV])
 *    db.release()
 *    pool.end()
 * ```
 */

import pg from 'pg'

import procedures from './procedures.mjs'
import setupDatabase from './setup.mjs'

/**
 * @typedef {import('../node_modules/pg/lib/client')} Client
 */

/**
 * @typedef {import('../node_modules/pg/lib/result')} Result
 */

// create the default connection
const pool = new pg.Pool()

// bind procedures to the connection
await procedures(pool)

// create and update the database schema
await setupDatabase(pool)

// always use the schema from environment
const connect = pool.connect.bind(pool)
pool.connect = async () => {
  const db = await connect()
  if (process.env.PGSCHEMA) await db.query(`SET search_path TO "${process.env.PGSCHEMA}";`)
  return db
}

// export the connection
export default pool
