import { SerializableStorePointer, StoreProvider } from '@massivoto/kit'
import { LocalFileStore } from './local-file-store.js'

function createStoreFromPointer(ptr: SerializableStorePointer): StoreProvider {
  if (ptr.uri.startsWith('file://')) {
    return new LocalFileStore(ptr.uri.slice(7))
  }
  if (ptr.uri.startsWith('s3://')) {
    //return new S3Store(ptr.uri);
  }
  if (ptr.uri.startsWith('memory://')) {
    //return new InMemoryStore(ptr.uri);
  }
  throw new Error('Unsupported store backend')
}
