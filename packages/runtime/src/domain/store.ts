import { Serializable } from '@massivoto/kit'
import { SerializableObject } from '@massivoto/kit/dist'

/**
 * Interface allowing the Store to read and write data.
 * The get() method is async to support remote stores (databases, APIs, etc.)
 */
export interface StoreProvider {
  get(path: string): Promise<any>
  set?(path: string, value: any): Promise<void> | void
  toSerializable(): SerializableStorePointer
}

/**
 * Inspired by Java jndi
 * // e.g. file://store.json, db://team/123, memory://demo-store
 *
 * Will be transferred from the interpreter to the Runner in another machine,
 * so it needs to be serializable.
 */
export interface SerializableStorePointer extends SerializableObject {
  uri: string // e.g. file://store.json, db://team/123, memory://demo-store, jdbc:mysql://localhost/myDataSource
  name: string // jdbc/myDataSource, file/store, memory/demo-store
  option: string | undefined // free, depends on the provider implementation
}

export function fakeStorePointer(): SerializableStorePointer {
  return {
    uri: 'memory://fake-store',
    name: 'fake-store',
  } as SerializableStorePointer
}
