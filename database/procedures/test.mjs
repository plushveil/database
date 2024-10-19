/**
 * @file An example of a database procedure.
 */

/**
 * Tests the database connection.
 * @param {import('../../src/database.mjs').Client} db - The database connection.
 * @returns {Promise<import('../../src/database.mjs').Result>} The result of the query.
 */
export default async function test (db) {
  return await db.query('SELECT NOW()')
}
