/**
 * @file This file exports constants.
 */

import * as path from 'node:path'
import * as url from 'node:url'

import utils from './utils.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * The root folders of the project.
 * @type {string[]}
 */
export const ROOTS = [
  path.dirname(utils.getPackageJson()),
  path.resolve(__dirname, '..')
].filter((folder, index, self) => self.indexOf(folder) === index)

/**
 * The database folder.
 * @type {string[]}
 */
export const DB_FOLDERS = ['database', 'db']

/**
 * The database procedures folder.
 * @type {string[]}
 */
export const DB_PROCEDURES_FOLDERS = ['procedures']

/**
 * The database file extensions.
 * @type {string[]}
 */
export const FILE_EXTENSIONS = ['.pgsql', '.psql', '.sql']

/**
 * The database procedure file extensions.
 * @type {string[]}
 */
export const PROCEDURE_EXTENSIONS = ['.mjs', '.js']
