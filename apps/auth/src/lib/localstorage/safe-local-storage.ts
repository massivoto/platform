import { NodeLocalStorage } from './node-local-storage.js'
import { SimpleLocalStorage } from './simple-local-storage.js'

let backupNodeLocalStorage: NodeLocalStorage | null = null

export function getSafeLocalStorage(): SimpleLocalStorage {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  } else {
    if (!backupNodeLocalStorage) {
      backupNodeLocalStorage = new NodeLocalStorage()
    }
    return backupNodeLocalStorage
  }
}
