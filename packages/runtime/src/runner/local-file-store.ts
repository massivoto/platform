import { readFileSync, writeFileSync } from 'fs'
import lodashGet from 'lodash.get'
import lodashSet from 'lodash.set'
import { SerializableStorePointer, StoreProvider } from '../domain/store.js'

export class LocalFileStore implements StoreProvider {
  constructor(private filePath: string) {}

  get(path: string): any {
    const raw = JSON.parse(readFileSync(this.filePath, 'utf8'))
    return lodashGet(raw, path)
  }

  set(path: string, value: any): void {
    const raw = JSON.parse(readFileSync(this.filePath, 'utf8'))
    // implémentation set possible via lodash.set
    lodashSet(raw, path, value)
    writeFileSync(this.filePath, JSON.stringify(raw, null, 2))
  }

  toSerializable(): SerializableStorePointer {
    return {
      uri: `file://${this.filePath}`,
      name: 'local-file-store',
      option: undefined,
    }
  }
}
