import audioWorkletURL from 'vad-web/vad-audio-worklet.js?url'

import Recorder from './recorder'

function App() {
  return (
    <div>
      <h1>Voice Activity Detection example with Vite</h1>
      <p>
        <a href="https://github.com/ocavue/vad-web/tree/master/examples/with-vite">
          source code
        </a>
      </p>
      <Recorder audioWorkletURL={audioWorkletURL} />
    </div>
  )
}

export default App
