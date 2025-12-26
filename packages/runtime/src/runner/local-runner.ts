import { Interpreter } from '../compiler/index.js'
import { ExecutionContext } from '../domain/index.js'
import { SerializableStorePointer, StoreProvider } from '../domain/store.js'
import { LocalFileStore } from './local-file-store.js'
import { Runner } from './runner.js'

export class LocalRunner implements Runner {
  initialized = false
  private storeProvider: StoreProvider | undefined

  constructor(
    private context: ExecutionContext,
    private interpreter: Interpreter,
  ) {}

  async initialize(): Promise<void> {
    this.storeProvider = await this.createStoreFromPointer(this.context.store)
    this.initialized = true
  }

  async createStoreFromPointer(
    pointer: SerializableStorePointer,
  ): Promise<StoreProvider> {
    return new LocalFileStore('local-store.to-delete.json')
  }

  async runStep() {
    if (!this.storeProvider) {
      throw new Error('StoreProvider is not initialized')
    }
    // Here you would implement the logic to run a step using the interpreter
    // and the store, for example:
    // const result = await this.exec.execute(instruction, this.context)
    // return result
  }
}
