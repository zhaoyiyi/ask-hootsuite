import dotenv from 'dotenv'
import { Configuration, OpenAIApi } from 'openai'
import * as cheerio from 'cheerio'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

dotenv.config()

const docSize: number = 2000

const configuration = new Configuration({ apiKey: process.env.OPENAI_KEY })
const openAi = new OpenAIApi(configuration)

const urls: string[] = []

async function getUrls() {
  const documents = await getDocuments(urls)

  for (const { url, body } of documents) {
    const input = body.replace(/\n/g, ' ')

    console.log('\nDocument length: \n', body.length, input)
    console.log('\nURL: \n', url)

    const embeddingResponse = await openAi.createEmbedding({
      model: 'text-embedding-ada-002',
      input,
    })

    const [{ embedding }] = embeddingResponse.data.data

    const document = await prisma.documents.create({
      data: {
        content: input,
        url,
      },
    })

    await prisma.$executeRaw`
      UPDATE "Documents"
      SET "embedding" = ${embedding}::vector
      WHERE "id" = ${document.id}
    `
  }
}

async function getDocuments(urls: string[]) {
  const documents = []
  for (const url of urls) {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)
    const articleText = $('#__next > main').text()

    let start = 0
    while (start < articleText.length) {
      const end = start + docSize
      const chunk = articleText.slice(start, end)
      documents.push({ url, body: chunk })
      start = end
    }
  }
  return documents
}

getUrls()
