import { startRecording } from 'vad-web'

const audioWorkletURL = new URL('./worklet.ts', import.meta.url)

let disposeRecording: (() => void) | null = null

const startButton = document.getElementById('startButton')
if (!startButton) throw new Error('Start button not found')

startButton.addEventListener('click', () => {
  if (disposeRecording) {
    return
  }

  document.body.dataset.recording = 'true'

  disposeRecording = startRecording({
    audioWorkletURL,
    maxDurationSeconds: 5,
    onAudioData,
    onSilence,
    onSpeech,
  })

  const stopButton = document.getElementById('stopButton')
  if (!stopButton) throw new Error('Stop button not found')

  stopButton.addEventListener('click', () => {
    document.body.dataset.recording = 'false'

    if (disposeRecording) {
      disposeRecording()
      disposeRecording = null
    }
  })
})

function onAudioData(audioData: Float32Array, sampleRate: number) {
  console.log('Received audio data with sampleRate:', sampleRate)
  const duration = audioData.length / sampleRate
  console.log(`Audio data length: ${audioData.length}, Duration: ${duration}s`)

  // 将 Float32Array 转换为 Blob，并创建音频元素
  const audioBlob = encodeWAV(audioData, sampleRate)
  const audioURL = URL.createObjectURL(audioBlob)

  const audio = document.createElement('audio')
  audio.controls = true
  audio.src = audioURL

  const audioContainer = document.getElementById('audioContainer')
  if (!audioContainer) throw new Error('Audio container not found')
  audioContainer.appendChild(audio)
}

function onSilence() {
  document.body.dataset.speaking = 'false'
}

function onSpeech() {
  document.body.dataset.speaking = 'true'
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  console.log(
    'Encoding WAV with samples length:',
    samples.length,
    'and sampleRate:',
    sampleRate,
  )
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  /* RIFF identifier */
  writeString(view, 0, 'RIFF')
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true)
  /* RIFF type */
  writeString(view, 8, 'WAVE')
  /* format chunk identifier */
  writeString(view, 12, 'fmt ')
  /* format chunk length */
  view.setUint32(16, 16, true)
  /* sample format (raw) */
  view.setUint16(20, 1, true)
  /* channel count */
  view.setUint16(22, 1, true)
  /* sample rate */
  view.setUint32(24, sampleRate, true)
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true)
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true)
  /* bits per sample */
  view.setUint16(34, 16, true)
  /* data chunk identifier */
  writeString(view, 36, 'data')
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true)

  // Write the PCM samples
  floatTo16BitPCM(view, 44, samples)

  console.log('WAV encoding completed')
  return new Blob([view], { type: 'audio/wav' })
}

function floatTo16BitPCM(
  output: DataView,
  offset: number,
  input: Float32Array,
): void {
  console.log('Converting Float32Array to 16-bit PCM')
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]))
    s = s < 0 ? s * 0x8000 : s * 0x7fff
    output.setInt16(offset, s, true)
  }
  console.log('Conversion to 16-bit PCM completed')
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
