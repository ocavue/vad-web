import audioWorkletURL from 'vad-web/vad-audio-worklet?url'

import Recorder from './recorder'

function App() {
  return (
    <div>
      <h1>VAD example with Vite</h1>
      <Recorder audioWorkletURL={audioWorkletURL} />
    </div>
  )
}

export default App
