/**
 * @file This file parses template literals in sql files.
 */

import * as fs from 'node:fs'

import semver from 'semver'

import utils from './utils.mjs'

// AsyncFunction
const AsyncFunction = (async () => {}).constructor

// get the parser context
const ctx = await getParserContext()

/**
 * Evaluates template literals in a string.
 * @param {string} content - The content of the sql file.
 * @returns {Promise<string>} The parsed content.
 */
export default async function parse (content) {
  // escape backticks in the content, but not in the variables
  content = splitByTemplateLiterals(content).reduce((content, part) => {
    if (part.type === 'static') return content + part.value.replaceAll('`', '\\`')
    return content + `\${${part.value}}`
  }, '')

  const parse = new AsyncFunction(...Object.keys(ctx), 'return `' + content + '`')
  return await parse(...Object.values(ctx))
}

/**
 * @typedef {object} ParserContext
 * @property {object} packageJson - The content of the `package.json`.
 * @property {string} major - The major version defined in the `package.json`.
 * @property {string} minor - The minor version defined in the `package.json`.
 * @property {string} patch - The patch version defined in the `package.json`.
 * @property {string} always - The string "always".
 * @property {string} before - The string "before".
 */

/**
 * Retrieves values that are available in the sql files as template literals.
 * @returns {Promise<ParserContext>} An object whose properties are available in the sql files.
 */
async function getParserContext () {
  const packageJson = JSON.parse(fs.readFileSync(utils.getPackageJson(), { encoding: 'utf-8' }))

  return {
    packageJson,
    major: semver.major(packageJson.version),
    minor: semver.minor(packageJson.version),
    patch: semver.patch(packageJson.version),
    label: packageJson.version.includes('-') ? packageJson.version.split('-').slice(1).join('-') : '',
    always: 'always',
    before: 'before'
  }
}

/**
 * Seperate a string into parts of static and dynamic parts.
 * @param {string} str - The string to split.
 * @returns {Array<{type: "static"|"dynamic", value: string}>} - The parts of the string.
 * @throws {Error} If the template literal is invalid.
 */
function splitByTemplateLiterals (str) {
  const parts = []

  let currentPart = ''
  let isDynamic = false
  let depth = 0
  for (let i = 0; i < str.length; i++) {
    const current = str.charAt(i)

    if (isDynamic) {
      if (current === '{') {
        depth = depth + 1
      } else if (current === '}') {
        depth = depth - 1
        if (depth === 0) {
          isDynamic = false
          parts.push({ type: 'dynamic', value: currentPart })
          currentPart = ''
        }
      } else {
        currentPart = currentPart + current
      }
    } else {
      const next = str.charAt(i + 1)
      if (current === '$' && next === '{') {
        isDynamic = true
        if (currentPart) {
          parts.push({ type: 'static', value: currentPart })
          currentPart = ''
        }
      } else {
        currentPart = currentPart + current
        if (i === str.length - 1) {
          parts.push({ type: 'static', value: currentPart })
          currentPart = ''
        }
      }
    }
  }

  if (currentPart) {
    if (depth > 0) throw new Error(`Invalid template literal. Missing ${depth} '}'`)
    else throw new Error(`Invalid template literal. Unknown: ${currentPart}`)
  }

  return parts
}
