'use client'

import { useRef, useState } from 'react'

export default function Home() {
  const input = useRef<HTMLInputElement>(null)
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const ask = async (question: string) => {
    setAnswer('')
    setIsLoading(true)

    const res = await fetch('/ask', {
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

  const handleAskClick = () => {
    const question = input.current?.value

    if (!question) {
      return
    }

    ask(question)
  }

  const askPredefinedQuestion = (question: string) => {
    input.current!.value = question
    ask(question)
  }

  return (
    <main className="w-3/4 mx-auto py-4">
      <h1 className="text-4xl font-bold my-4">Ask Hootsuite</h1>
      <p className="text-lg mb-4">
        Ask any question and get an answer from the information available on{' '}
        <a href="www.hootsuite.com" className="underline">
          Hootsuite&apos;s website
        </a>
        .
      </p>
      <p className="text-lg mb-4">
        For example, try asking:
        <button
          className="underline italic p-1"
          onClick={() => askPredefinedQuestion('What is Hootsuite?')}
        >
          What is Hootsuite?
        </button>{' '}
        or
        <button
          className="underline italic p-1"
          onClick={() => askPredefinedQuestion('What is OwlyWriter AI?')}
        >
          What is OwlyWriter AI?
        </button>
      </p>
      <form>
        <input
          ref={input}
          type="text"
          className="border-slate-600 border-2 w-full text-lg p-4 tracking-wide"
        />

        <button
          type="submit"
          disabled={isLoading}
          onClick={handleAskClick}
          className="inline-block border-2 border-slate-600 cursor-pointer text-2xl py-2 px-4 my-4 hover:bg-slate-800 hover:text-white"
        >
          Ask
        </button>

        {isLoading && <span className="text-xl m-4">Answering...</span>}
      </form>

      <p className="h-32 py-4 tracking-wide leading-relaxed text-xl">
        {answer}
      </p>
    </main>
  )
}
