export interface Plugin<T> {
  execute: (context: any, args?: string[]) => Promise<T | null>
  name: string
}

const pluginStore = new Map<string, Plugin<any>>()

export function registerPlugin<T>(name: string, plugin: Plugin<T>) {
  pluginStore.set(name, plugin)
}

export function getPlugin<T>(name: string): Plugin<T> | undefined {
  return pluginStore.get(name)
}
