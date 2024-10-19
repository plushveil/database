/**
 * @file This file contains a test suite to enforce a standard of documentation that encourages collaboration.
 */

import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __root = path.resolve(__dirname, '..', '..')

const packageJsonFile = path.resolve(__root, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, { encoding: 'utf-8' }))
const readme = path.resolve(__root, 'docs', 'README.md')

/**
 * This section of the test suite enforces the existence of a README.md file in the docs directory.
 * @see https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
 */
describe('README.md', function () {
  it('should exist', function () { assert.strict.equal(fs.existsSync(readme), true) })

  it('should be a file', function () { assert.strict.equal(fs.statSync(readme).isFile(), true) })

  it('should be a markdown file', function () { assert.strict.equal(path.extname(readme), '.md') })

  it('should contain the package name', function () { assert.strict.equal(fs.readFileSync(readme, { encoding: 'utf-8' }).includes(packageJson.name), true) })
})
