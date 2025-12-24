import { Serializable } from '@massivoto/kit'

const storeSavers: StoreSaver[] = []

export function registerStoreSaver(saver: StoreSaver) {
  storeSavers.push(saver)
}

export interface StoreSaver {
  save: (data: Serializable, path: string) => Promise<void>
}

export async function saveToStore(
  data: Serializable,
  path: string,
): Promise<void> {
  for (const saver of storeSavers) {
    await saver.save(data, path)
  }
}
