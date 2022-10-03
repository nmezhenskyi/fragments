const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory')

describe('memory store strategy', () => {
  test('writeFragment() returns void', async () => {
    const result = await writeFragment({ ownerId: 'abcd', id: '1234' })
    expect(result).toBe(undefined)
  })

  test('readFragment() returns metadata written in writeFragment()', async () => {
    const fragment = { ownerId: 'abcd', id: '1234', size: 1024 }
    await writeFragment(fragment)
    const result = await readFragment(fragment.ownerId, fragment.id)
    expect(result).toEqual(fragment)
  })

  test('writeFragmentData() returns void', async () => {
    const result = await writeFragmentData('abcd', '1234', 'some value')
    expect(result).toBe(undefined)
  })

  test('readFragmentData() returns data written in writeFragmentData()', async () => {
    const payload = '8N5xWFj80a'
    await writeFragmentData('abcd', '1234', payload)
    const result = await readFragmentData('abcd', '1234')
    expect(result).toEqual(payload)
  })

  test('writeFragmentData() & readFragmentData() work with Buffers', async () => {
    const payload = Buffer.from('8N5xWFj80a')
    await writeFragmentData('abcd', '1234', payload)
    const result = await readFragmentData('abcd', '1234')
    expect(result).toEqual(payload)
  })

  test('listFragments() returns ids when not expanded', async () => {
    const ids = ['1234', '5678', '9012']
    await Promise.all(
      ids.map(async (id, idx) => {
        await writeFragment({ ownerId: 'abcd', id, size: idx * 1024 })
      })
    )
    const result = await listFragments('abcd')
    expect(result).toEqual(ids)
  })

  test('listFragments() returns all metadata when expanded', async () => {
    const fragments = [
      { ownerId: 'abcd', id: '1234', size: 1024 },
      { ownerId: 'abcd', id: '5678', size: 2048 },
      { ownerId: 'abcd', id: '9012', size: 4096 },
    ]
    await Promise.all(
      fragments.map(async (curr) => {
        await writeFragment(curr)
      })
    )
    const result = await listFragments('abcd', true)
    expect(result).toEqual(fragments)
  })

  test("deleteFragment() removes the fragment's metadata and data", async () => {
    await writeFragment({ ownerId: 'abcd', id: '1234', size: 10 })
    await writeFragmentData('abcd', '1234', '8N5xWFj80a')
    await deleteFragment('abcd', '1234')
    const metadata = await readFragment('abcd', '1234')
    const data = await readFragmentData('abcd', '1234')
    expect(metadata).toBe(undefined)
    expect(data).toBe(undefined)
  })
})
