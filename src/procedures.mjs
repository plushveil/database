/**
 * @file This file binds procedures to the database connection.
 */

import * as fs from 'node:fs'
import * as url from 'node:url'
import * as path from 'node:path'

import utils from './utils.mjs'
import parse from './parse.mjs'
import * as config from './config.mjs'

/**
 * @typedef {import('./database.mjs').Client} Client
 */

/**
 * @typedef {[string, Function<Client>][]} Procedures
 */

/**
 * Creates and updates the database schema.
 * @param {import('pg').Pool} pool - The database connection.
 */
export default async function procedures (pool) {
  const allProcedures = await getAllProcedures()
  pool.on('connect', (db) => assign(db, allProcedures))
}

/**
 * Assigns the procedures to the database connection and binds the database connection to the procedures.
 * @param {Client} db - The database connection.
 * @param {Procedures} allProcedures - A mappping of procedure names to procedure functions.
 */
function assign (db, allProcedures) {
  db.procedures = allProcedures.reduce((procedures, [name, procedure]) => Object.assign(procedures, {
    [name]: procedure.bind(null, db)
  }), {})
}

/**
 * Gets all procedures.
 * @returns {Promise<Procedures>} A mappping of procedure names to procedure functions.
 */
async function getAllProcedures () {
  const files = await utils.getDatabaseProcedureFiles()
  const allProcedures = {}

  for (const file of files) {
    const ext = path.extname(file)
    const name = path.basename(file, ext)

    if (config.PROCEDURE_EXTENSIONS.includes(ext)) {
      allProcedures[name] = (await import(url.pathToFileURL(file).href)).default
    } else {
      const content = await fs.promises.readFile(file, { encoding: 'utf-8' })
      const sql = await parse(content)
      allProcedures[name] = (db, ...args) => db.query(sql, ...args)
    }
  }

  return Object.entries(allProcedures)
}
