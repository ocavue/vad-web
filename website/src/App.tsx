import Recorder from './recorder'

function App() {
  return (
    <div>
      <h1>vad-web demo</h1>
      <p>
        An enterprise-grade Voice Activity Detection (VAD) library for the
        browser. Powered by{' '}
        <a href="https://github.com/snakers4/silero-vad">Silero VAD</a>.
      </p>
      <p>
        Read more on <a href="https://github.com/ocavue/vad-web">GitHub</a>.
      </p>
      <Recorder />
    </div>
  )
}

export default App
