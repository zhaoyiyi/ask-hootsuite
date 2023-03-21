import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser'

export async function OpenAIStream(payload: any) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_KEY ?? ''}`,
    },
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return new ReadableStream({
    async start(controller) {
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === 'event') {
          const data = event.data

          if (data === '[DONE]') {
            controller.close()
            return
          }

          const json = JSON.parse(data)
          const text = json.choices[0].delta.content
          const queue = encoder.encode(text)
          controller.enqueue(queue)
        }
      }

      const parser = createParser(onParse)

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })
}
