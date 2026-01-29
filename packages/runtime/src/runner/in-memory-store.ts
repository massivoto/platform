import lodashGet from 'lodash.get'
import lodashSet from 'lodash.set'
import { SerializableStorePointer, StoreProvider } from '@massivoto/kit'

/**
 * In-memory store implementation for testing and simple use cases.
 * Data is not persisted and will be lost when the process exits.
 */
export class InMemoryStore implements StoreProvider {
  private data: Record<string, any>

  constructor(initialData: Record<string, any> = {}) {
    this.data = structuredClone(initialData)
  }

  async get(path: string): Promise<any> {
    return lodashGet(this.data, path)
  }

  async set(path: string, value: any): Promise<void> {
    lodashSet(this.data, path, value)
  }

  toSerializable(): SerializableStorePointer {
    return {
      uri: 'memory://in-memory-store',
      name: 'in-memory-store',
      option: undefined,
    }
  }

  /**
   * Returns a copy of the current store data (for testing/debugging).
   */
  getData(): Record<string, any> {
    return structuredClone(this.data)
  }

  /**
   * Clears all data from the store.
   */
  clear(): void {
    this.data = {}
  }
}
