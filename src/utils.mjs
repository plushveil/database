/**
 * @file This file exports all utility functions.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  getPackageJson,
  getDatabaseFolders,
  getDatabaseFiles,
  getDatabaseProceduresFolders,
  getDatabaseProcedureFiles
}

/**
 * Gets the package version.
 * @throws {Error} If the package.json can't be found.
 * @returns {string} The version defined in the callee's `package.json`.
 */
export function getPackageJson () {
  const cwd = process.cwd()
  const cwdPackageJson = path.join(cwd, 'package.json')
  if (fs.existsSync(cwdPackageJson)) return cwdPackageJson

  // find the very first package json in the current directory tree
  const cdtPackageJson = findPackageJson(__dirname)
  if (cdtPackageJson) return cdtPackageJson

  // The package.json is used to determine the version the database should be on.
  // If it can't be found, we can't create or update the database.
  throw new Error('Could not find package.json')
}

/**
 * Finds the first (starting at the root) package.json in the given folder tree, up until the highest level.
 * @param {string} folder - The folder to end the search at.
 * @returns {string} The path to the package json.
 */
function findPackageJson (folder) {
  const root = path.parse(folder).root
  const folders = [root, ...(folder.slice(root.length).split(path.sep))]
  let packageJson
  for (let i = 1; i <= folders.length; i++) {
    try {
      const currentPackageJson = path.resolve(...(folders.slice(0, i)), 'package.json')
      if (fs.existsSync(currentPackageJson)) {
        packageJson = currentPackageJson
        break
      }
    } catch (err) {
      // ignore
    }
  }

  return packageJson
}

/**
 * Gets all existing folders that can contain database schema files.
 * @returns {Promise<string[]>} The database folders.
 */
export async function getDatabaseFolders () {
  const config = await import('./config.mjs')
  const roots = config.ROOTS
  const folders = []
  for (const root of roots) {
    for (const dbfolder of config.DB_FOLDERS) {
      if (fs.existsSync(path.resolve(root, dbfolder))) folders.push(path.resolve(root, dbfolder))
    }
  }
  return folders
}

/**
 * Gets all existing database schema files.
 * @returns {Promise<string[]>} The database files.
 */
export async function getDatabaseFiles () {
  const config = await import('./config.mjs')
  const dbfolders = await getDatabaseFolders()
  const files = []
  for (const dbfolder of dbfolders) {
    for (const extension of config.FILE_EXTENSIONS) {
      const folderFiles = fs.readdirSync(dbfolder).filter((file) => file.endsWith(extension))
      for (const file of folderFiles) {
        files.push(path.resolve(dbfolder, file))
      }
    }
  }
  return files
}

/**
 * Gets all existing folders that can contain database procedures files.
 * @returns {Promise<string[]>} The database procedures folders.
 */
export async function getDatabaseProceduresFolders () {
  const config = await import('./config.mjs')
  const dbfolders = await getDatabaseFolders()
  const folders = []
  for (const dbfolder of dbfolders) {
    for (const proceduresfolder of config.DB_PROCEDURES_FOLDERS) {
      if (fs.existsSync(path.resolve(dbfolder, proceduresfolder))) folders.push(path.resolve(dbfolder, proceduresfolder))
    }
  }
  return folders
}

/**
 * Gets all existing database schema files.
 * @returns {Promise<string[]>} The database files.
 */
export async function getDatabaseProcedureFiles () {
  const config = await import('./config.mjs')
  const dbproceduresfolders = await getDatabaseProceduresFolders()
  const files = []
  for (const dbproceduresfolder of dbproceduresfolders) {
    const folderFiles = fs.readdirSync(dbproceduresfolder)
    for (const extension of [...config.FILE_EXTENSIONS, ...config.PROCEDURE_EXTENSIONS]) {
      for (const file of folderFiles.filter((file) => file.endsWith(extension))) {
        files.push(path.resolve(dbproceduresfolder, file))
      }
    }
  }
  return files
}
