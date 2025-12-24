export function getRandomProxy(): string {
  const proxiesEnv = process.env.PROXIES

  if (!proxiesEnv) {
    throw new Error('PROXIES environment variable is not defined')
  }

  const proxies = proxiesEnv
    .split(',')
    .map((proxy) => proxy.trim())
    .filter(Boolean)

  if (proxies.length === 0) {
    throw new Error('No proxies found in PROXIES environment variable')
  }

  const randomIndex = Math.floor(Math.random() * proxies.length)
  return proxies[randomIndex]
}

const favouriteProxy = 2
export function getFavouriteProxy(): string {
  return getProxyAtIndex(favouriteProxy)
}

export function getProxyAtIndex(index: number): string {
  const proxiesEnv = process.env.PROXIES

  if (!proxiesEnv) {
    throw new Error('PROXIES environment variable is not defined')
  }

  const proxies = proxiesEnv
    .split(',')
    .map((proxy) => proxy.trim())
    .filter(Boolean)

  if (index < 0 || index >= proxies.length) {
    throw new Error(`Index ${index} is out of bounds for the available proxies`)
  }

  return proxies[index]
}
