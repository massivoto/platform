import path from 'path'

// R-FILE-01
export interface FileReference {
  type: 'file-ref'
  relativePath: string
  absolutePath: string
}

// R-FILE-02
export function isFileReference(value: unknown): value is FileReference {
  if (value === null || value === undefined || typeof value !== 'object') {
    return false
  }
  const obj = value as Record<string, unknown>
  return (
    obj.type === 'file-ref' &&
    typeof obj.relativePath === 'string' &&
    typeof obj.absolutePath === 'string'
  )
}

// R-FILE-03
export function resolveFilePath(relativePath: string, projectRoot: string): string {
  let cleaned = relativePath
  if (cleaned.startsWith('~/')) {
    cleaned = cleaned.slice(2)
  }

  const resolved = path.resolve(projectRoot, cleaned)
  const normalizedRoot = path.resolve(projectRoot)

  if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
    throw new Error(
      `Path "${relativePath}" resolves outside projectRoot "${projectRoot}". This is a security violation.`,
    )
  }

  return resolved
}
