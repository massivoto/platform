import { SimpleLocalStorage } from './simple-local-storage.js'

export class NodeLocalStorage implements SimpleLocalStorage {
  private data: { [key: string]: string | undefined } = {}

  getItem(key: string): string | null {
    return this.data[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.data[key] = value
  }

  removeItem(key: string): void {
    delete this.data[key]
  }

  clear(): void {
    this.data = {}
  }
}
