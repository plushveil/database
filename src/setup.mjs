/**
 * @file This file exports a function that creates and updates the database schema.
 */

import * as fs from 'node:fs'
import * as url from 'node:url'

import semver from 'semver'

import utils from './utils.mjs'
import parse from './parse.mjs'

const __filename = url.fileURLToPath(import.meta.url)

/**
 * @typedef {import('./database.mjs').Client} Client
 */

/**
 * Creates and updates the database schema.
 * @param {import('pg').Pool} pool - The database connection.
 */
export default async function setup (pool) {
  /**
   * @type {Client}
   */
  const client = await pool.connect()

  // get the database version
  const packageJsonFile = utils.getPackageJson()
  const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'))
  const packageVersion = packageJson.version
  const dbVersion = await getDatabaseVersion(client)

  if (dbVersion === null) {
    await updateDatabaseTables(client, { to: packageVersion })
  } else if (semver.gt(dbVersion, packageVersion)) {
    // the database is newer than the package version, this should never happen
    // either the app is missing an update or the database was manually updated
    // unfortunately the schema format is only incremental, so rolling back is not possible
    throw new Error(`Database version "${dbVersion}" is newer than package version "${packageVersion}"`)
  } else {
    await updateDatabaseTables(client, { from: dbVersion, to: packageVersion })
  }

  client.release()
}

/**
 * Gets the database version.
 * @param {Client} client - The database connection.
 * @returns {Promise<string|null>} The database version or null if it doesn't exist.
 */
async function getDatabaseVersion (client) {
  try {
    if (!(process.env.PGSCHEMA)) throw new Error('Environment variable "PGSCHEMA" is not set')
    const version = (await client.query(`SELECT * FROM "${process.env.PGSCHEMA}".info ORDER BY updated_at DESC LIMIT 1`)).rows[0]
    if (version) return `${version.major}.${version.minor}.${version.patch}${version.label ? `-${version.label}` : ''}`
  } catch (err) {}
  return null
}

/**
 * Updates the database schema.
 * @param {Client} client - The database connection.
 * @param {object} [options] - The optional parameters.
 * @param {string} [options.from] - The version to update from.
 * @param {string} [options.to] - The version to update to.
 */
async function updateDatabaseTables (client, options = {}) {
  // retrieve the sql queries
  const files = await getFiles()

  // split the queries into versions
  const versionToQueries = split(files)

  // create the schema if it doesn't exist and change default schema to PGSCHEMA
  if (!(process.env.PGSCHEMA)) throw new Error('Environment variable "PGSCHEMA" is not set')
  versionToQueries.before = versionToQueries.before || []
  versionToQueries.before.push({ file: __filename, query: `CREATE SCHEMA IF NOT EXISTS "${process.env.PGSCHEMA}";` })
  versionToQueries.before.push({ file: __filename, query: `SET search_path TO "${process.env.PGSCHEMA}";` })

  // filter and sort the versions
  const versions = getVersions(Object.keys(versionToQueries), options)

  // start a transaction
  let err = false
  await client.query('BEGIN')

  // execute the queries
  for (const version of ['before', ...versions, 'always']) {
    const queries = versionToQueries[version] || []
    for (const { file, query } of queries) {
      try {
        await client.query(query)
      } catch (error) {
        error.message = `Executing query in "${file}" failed:\n\n${query}\n\n${error.message}`
        err = error
        break
      }
    }

    if (err) break
  }

  // commit or rollback the transaction
  if (err) {
    await client.query('ROLLBACK')
    throw err
  } else {
    await client.query('COMMIT')
  }
}

/**
 * Filters and sorts the versions.
 * @param {string[]} versions - The map of version to queries.
 * @param {object} [options] - The optional parameters.
 * @param {string} [options.from] - The version to update from.
 * @param {string} [options.to] - The version to update to.
 * @returns {string[]} The filtered and sorted versions.
 */
export function getVersions (versions, options = {}) {
  const isTest = (options.to?.includes('-') && options.from !== options.to)
  const to = options.to?.includes('-') ? options.to.slice(0, options.to.indexOf('-')) : options.to
  const from = options.from?.includes('-') ? options.from.slice(0, options.from.indexOf('-')) : options.from

  let start = false
  const isMinVersion = (version) => {
    if (!from) return true
    if (start) return true
    if (semver.gt(version, from)) return true
    return false
  }

  let stop = false
  const isAboveMaxVersion = (version) => {
    if (!to) return false
    if (stop) return true
    if (semver.gt(version, to)) return true
    return false
  }

  return versions
    .filter((version) => semver.valid(version))
    .sort((a, b) => {
      // beta versions should be sorted after the stable versions of the same version
      if (a.includes('-') && !b.includes('-') && a.slice(0, a.indexOf('-')) === b) return 1
      if (!a.includes('-') && b.includes('-') && a === b.slice(0, b.indexOf('-'))) return -1
      return semver.compare(a, b)
    })
    .filter((version) => {
      if (isTest && version === options.to) return true
      if (isMinVersion(version)) start = true
      if (isAboveMaxVersion(version)) stop = true
      if (!start) return false
      if (stop) return false
      return true
    })
}

/**
 * @typedef {object} File
 * @property {string} file - The full path to the file.
 * @property {string} content - The content of the file.
 */

/**
 * Retrieves the contents of the sql files.
 * @returns {Promise<File[]>} - The parsed contents of the sql files.
 */
async function getFiles () {
  const dbfiles = await utils.getDatabaseFiles()
  const files = []
  for (const file of dbfiles) {
    const raw = await fs.promises.readFile(file, { encoding: 'utf-8' })
    const content = await parse(raw)
    files.push({ file, content })
  }
  return files
}

/**
 * @typedef Query
 * @property {string} file - The full path of the file the query is in.
 * @property {string} query - The query string.
 */

/**
 * Map of the semantic version value of the JSDOC version tag to a list of queries.
 * @param {File[]} files - The parsed contents of the sql files.
 * @returns {{[key: string]: Query[]}} The map of version to queries.
 */
function split (files) {
  const regex = /\* @version\s+([^\s]+)/

  return files.reduce((versionToQueries, { file, content }) => {
    content = `/* @version 0.0.1 */${content}`

    while (content.match(regex)) {
      // parse the file content to get the query
      const start = content.indexOf('* @version')
      let end = content.indexOf('* @version', start + '* @version'.length)
      if (end === -1) end = undefined
      const query = `/**\n ${content.slice(start, end)}${end ? '\n */' : ''}`
      const version = query.match(regex)[1]

      // add the query to the list of queries for the version
      if (versionToQueries[version] === undefined) versionToQueries[version] = []
      versionToQueries[version].push({ file, query })

      // end the loop
      if (end === undefined) content = ''
      else content = content.slice(end)
    }

    return versionToQueries
  }, {})
}
