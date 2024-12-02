'use client'

import Recorder from './recorder'

const audioWorkletURL = '/vad-audio-worklet.js'

export default function Home() {
  return (
    <div>
      <h1>VAD example with Next.js</h1>
      <Recorder audioWorkletURL={audioWorkletURL as string} />
    </div>
  )
}
