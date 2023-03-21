import GPT3Tokenizer from 'gpt3-tokenizer'
import { oneLine, stripIndent } from 'common-tags'
import { supabase } from '../../utils/supabase'
import { OpenAIStream } from '../../utils/OpenAIStream'
import { NextRequest } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function POST(req: NextRequest) {
  const { question } = (await req.json()) as {
    question?: string
  }
  if (!question) {
    return new Response('No prompt in the request', { status: 400 })
  }

  const query = question
  const input = query.replace(/\n/g, ' ')
  const apiKey = process.env.OPENAI_KEY
  const embeddingResponse = await fetch(
    'https://api.openai.com/v1/embeddings',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        model: 'text-embedding-ada-002',
      }),
    }
  )
  const embeddingData = await embeddingResponse.json()

  const [{ embedding }] = embeddingData.data

  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    similarity_threshold: 0.5,
    match_count: 3,
  })

  if (error) {
    throw error
  }

  const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
  let tokenCount = 0
  let contextText = ''
  // console.log('documents: ', documents)

  if (documents) {
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i]
      const content = document.content
      const url = document.url
      const encoded = tokenizer.encode(content)
      tokenCount += encoded.text.length

      if (tokenCount > 2000) {
        break
      }
      contextText += `${content.trim()}\nSOURCE: ${url}\n---\n`
    }
  }

  // console.log('contextText: ', contextText)

  const systemContent = stripIndent(oneLine`
    You are a helpful Hootsuite representative who loves
    to help people! Given the following sections from the Hootsuite website,
    answer the question using ONLY that information.
    If the answer is not explicitly written in the website,
    say "Sorry, I don't know how to help with that." and nothing else.

    Context sections:
    ${contextText}

    Question: """
    ${query}
    """

    Answer:
  `)

  const stream = await OpenAIStream({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: systemContent }],
    stream: true,
    temperature: 0.5,
  })

  return new Response(stream)
}
