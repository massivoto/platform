import { readFile, writeFile } from 'fs/promises'
import lodashGet from 'lodash.get'
import lodashSet from 'lodash.set'
import { SerializableStorePointer, StoreProvider } from '@massivoto/kit'

export class LocalFileStore implements StoreProvider {
  constructor(private filePath: string) {}

  async get(path: string): Promise<any> {
    const content = await readFile(this.filePath, 'utf8')
    const raw = JSON.parse(content)
    return lodashGet(raw, path)
  }

  async set(path: string, value: any): Promise<void> {
    const content = await readFile(this.filePath, 'utf8')
    const raw = JSON.parse(content)
    lodashSet(raw, path, value)
    await writeFile(this.filePath, JSON.stringify(raw, null, 2))
  }

  toSerializable(): SerializableStorePointer {
    return {
      uri: `file://${this.filePath}`,
      name: 'local-file-store',
      option: undefined,
    }
  }
}
