import { SerializableStorePointer } from '../domain/store.js'

/**
 * function createStoreFromPointer(pointer: SerializableStorePointer): StoreProvider {
 *   if (pointer.uri.startsWith("file://")) {
 *     return new LocalFileStore(pointer.uri.slice(7));
 *   }
 *   if (pointer.uri.startsWith("s3://")) {
 *     return new S3Store(pointer.uri);
 *   }
 *   if (pointer.uri.startsWith("memory://")) {
 *     return new InMemoryStore(pointer.uri);
 *   }
 *   throw new Error("Unsupported store backend");
 * }
 */
export interface Runner {
  createStoreFromPointer(pointer: SerializableStorePointer): Promise<any>
}
