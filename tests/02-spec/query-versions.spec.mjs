/**
 * @file This file ensures that the versions are filtered and sorted according to the specification.
 */

import * as assert from 'node:assert'

import { getVersions } from '../../src/setup.mjs'

/**
 * This section describes the query versioning.
 */
describe('Versioning queries', function () {
  it('should include all versions if no options are provided', async function () {
    const from = undefined
    const to = undefined
    const versions = ['2.0.0', '1.0.0']
    const filtered = getVersions(versions, { from, to })
    assert.strict.deepEqual(filtered, ['1.0.0', '2.0.0'])
  })

  it('should exclude versions before the "from" version', async function () {
    const from = '2.0.0'
    const to = undefined
    const versions = ['3.0.0', '2.0.0', '1.0.0']
    const filtered = getVersions(versions, { from, to })
    assert.strict.deepEqual(filtered, ['3.0.0'])
  })

  it('should exclude versions after the "to" version', async function () {
    const from = undefined
    const to = '1.0.0'
    const versions = ['2.0.0', '1.0.0']
    const filtered = getVersions(versions, { from, to })
    assert.strict.deepEqual(filtered, ['1.0.0'])
  })

  it('should include equal versions only if it is labeled', async function () {
    const from = '2.0.0'
    const to = '2.0.0-beta.1'
    const versions = ['2.0.0', '2.0.0-beta.1', '1.0.0']
    const filtered = getVersions(versions, { from, to })
    assert.strict.deepEqual(filtered, ['2.0.0-beta.1'])
  })

  it('should not include "from" versions even if they are labeled ', async function () {
    const from = '2.0.0-beta.1'
    const to = undefined
    const versions = ['2.0.0-beta.1']
    const filtered = getVersions(versions, { from, to })
    assert.strict.deepEqual(filtered, [])
  })

  it('should treat labeled versions as more recent than unlabeled versions ', async function () {
    const from = '2.0.0-beta.1'
    const to = undefined
    const versions = ['2.0.0', '2.0.0-beta.1']
    const filtered = getVersions(versions, { from, to })
    assert.strict.deepEqual(filtered, [])
  })

  it('should do "0.0.0" first', async function () {
    const from = undefined
    const to = undefined
    const versions = ['0.0.0-alpha', '0.0.1', '0.0.0', '1.0.0']
    const filtered = getVersions(versions, { from, to })
    assert.strict.deepEqual(filtered, ['0.0.0', '0.0.0-alpha', '0.0.1', '1.0.0'])
  })
})
