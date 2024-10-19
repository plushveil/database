/**
 * @file This file contains a test suite to enforce a standard of documentation that encourages collaboration.
 */

import * as assert from 'node:assert'
import * as path from 'node:path'
import * as url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __root = path.resolve(__dirname, '..', '..')

/**
 * This section describes the database connection.
 */
describe('Database', function () {
  let pool
  let db

  it('should be able import the package', async function () {
    pool = (await import(path.resolve(__root, 'src', 'database.mjs'))).default
    assert.strict.equal(typeof pool, 'object')
  })

  it('should be able to connect to the database', async function () {
    if (!pool) return assert.fail('"pool" is not defined')
    db = await pool.connect()
    assert.strict.equal(typeof db, 'object')
  })

  it('should be able to perform procedures', async function () {
    if (!db) return assert.fail('"db" is not defined')
    const now = (await db.procedures.test()).rows?.[0]?.now
    assert.strict.equal(now instanceof Date, true)
  })

  after(async function () {
    if (db) await db.release()
    if (pool) await pool.end()
  })
})
