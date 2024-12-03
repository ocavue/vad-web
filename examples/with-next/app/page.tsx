'use client'

import Recorder from './recorder'

const audioWorkletURL = '/vad-audio-worklet.js'

export default function Home() {
  return (
    <div>
      <h1>Voice Activity Detection example with Next.js</h1>
      <p>
        <a href="https://github.com/ocavue/vad-web/tree/master/examples/with-next">
          source code
        </a>
      </p>
      <Recorder audioWorkletURL={audioWorkletURL as string} />
    </div>
  )
}
