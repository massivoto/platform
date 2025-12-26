import { BaseClient } from '../base-client.js'

export class FetchClient extends BaseClient {
  constructor() {
    super('fetch')

    this.client.onclose = () => {
      console.log('### Fetch Client closed')
    }
  }

  async fetch(url: string, maxLength: number, start: number, raw: boolean) {
    await this.prepareCommand('fetch')
    const result = (await this.client.callTool({
      name: 'fetch',
      arguments: {
        url,
        max_length: maxLength,
        start,
        raw,
      },
    })) as { content: any }
    if (typeof result.content === 'string') {
      return result.content
    }
    if (Array.isArray(result.content)) {
      return result.content.map((item) => item.text).join('\n')
    }
    throw new Error(
      `Unexpected content type: ${typeof result.content}. Expected string or array.`,
    )
  }
}
