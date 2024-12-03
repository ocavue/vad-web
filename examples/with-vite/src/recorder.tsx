import { useState } from 'react'
import { startRecording } from 'vad-web'

export default function Recorder({
  audioWorkletURL,
}: {
  audioWorkletURL: string
}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [dispose, setDispose] = useState<() => void>()
  const isRecording = !!dispose
  const [audioURLs, setAudioURLs] = useState<string[]>([])

  const start = () => {
    const dispose = startRecording({
      onAudioData: (audioData, sampleRate) => {
        console.log('Received audio data with sampleRate:', sampleRate)
        const duration = audioData.length / sampleRate
        console.log(
          `Audio data length: ${audioData.length}, Duration: ${duration}s`,
        )

        // Convert Float32Array to Blob and create audio element
        const audioBlob = encodeWAV(audioData, sampleRate)
        const audioURL = URL.createObjectURL(audioBlob)
        setAudioURLs((prev) => [...prev, audioURL])
      },
      onSilence: () => setIsSpeaking(false),
      onSpeech: () => setIsSpeaking(true),
      maxDurationSeconds: 5,
      audioWorkletURL,
    })
    setDispose(() => dispose)
  }

  const stop = () => {
    dispose?.()
    setDispose(undefined)
  }

  return (
    <div>
      <div>
        {isRecording ? (
          <button onClick={stop}>Stop Recording</button>
        ) : (
          <button onClick={start}>Start Recording</button>
        )}{' '}
        {isRecording ? (
          <>
            <span>Current state: </span>
            <span>
              {isSpeaking ? <span>Speaking</span> : <span>Silence</span>}
            </span>
          </>
        ) : null}
      </div>
      <div>
        {audioURLs.map((url) => (
          <audio key={url} src={url} controls />
        ))}
      </div>
    </div>
  )
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
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

  return new Blob([view], { type: 'audio/wav' })
}

function floatTo16BitPCM(
  output: DataView,
  offset: number,
  input: Float32Array,
): void {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]))
    s = s < 0 ? s * 0x8000 : s * 0x7fff
    output.setInt16(offset, s, true)
  }
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
