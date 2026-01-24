import { writeFileSync } from 'fs'
import { resolve } from 'path'

export function writeParserLogs(logs: any[], file = 'parser.logs.json') {
  const fileName = resolve(process.cwd(), file)
  console.log(`Writing ${logs.length} logs to ${fileName}`)
  writeFileSync(fileName, JSON.stringify(logs, null, 2), { encoding: 'utf8' })
  console.log(`Wrote ${fileName}`)
}
