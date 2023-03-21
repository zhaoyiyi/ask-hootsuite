'use client'

import { useRef, useState } from 'react'

export default function Home() {
  const input = useRef<HTMLInputElement>(null)
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const ask = async () => {
    const question = input.current?.value

    if (!question) {
      return
    }

    setAnswer('')
    setIsLoading(true)

    const res = await fetch('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    })

    if (!res.body) {
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let done = false

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      setAnswer((prev) => prev + chunkValue)
    }

    setIsLoading(false)
  }

  return (
    <main className="w-3/4 mx-auto py-4">
      <h1 className="text-4xl font-bold my-4">Ask Hootsuite</h1>
      <form>
        <input
          ref={input}
          type="text"
          className="border-slate-600 border-2 w-full text-lg p-4 tracking-wide"
        />

        <button
          type="submit"
          disabled={isLoading}
          onClick={ask}
          className="border-2 border-slate-600 cursor-pointer text-2xl py-2 px-4 block my-4 hover:bg-slate-800 hover:text-white"
        >
          Ask
        </button>
      </form>

      {isLoading && <p className="text-xl my-4">Answering...</p>}
      <p className="h-32 py-4 tracking-wide leading-relaxed text-xl">
        {answer}
      </p>
    </main>
  )
}
