import { useRef, useState } from 'react'
import { startRecording } from 'vad-web'
import { encodeWavFileFromArrays } from 'wav-file-encoder'

export default function Recorder({
  audioWorkletURL,
}: {
  audioWorkletURL: string
}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const disposeRef = useRef<() => Promise<void>>()
  const [audioURLs, setAudioURLs] = useState<string[]>([])

  const start = async () => {
    setIsRecording(true)

    disposeRef.current = await startRecording({
      onAudioData: (audioData, sampleRate) => {
        console.log('Received audio data with sampleRate:', sampleRate)
        const duration = audioData.length / sampleRate
        console.log(
          `Audio data length: ${audioData.length}, Duration: ${duration}s`,
        )

        // Convert Float32Array to Blob and create audio element
        const audioBuffer = encodeWavFileFromArrays([audioData], sampleRate, 1)
        const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' })
        const audioURL = URL.createObjectURL(audioBlob)
        setAudioURLs((prev) => [...prev, audioURL])
      },
      onSilence: () => {
        console.log('Silence detected')
        setIsSpeaking(false)
      },
      onSpeech: () => {
        console.log('Speech detected')
        setIsSpeaking(true)
      },
      maxDurationSeconds: 5,
      audioWorkletURL,
    })
  }

  const stop = async () => {
    await disposeRef.current?.()
    disposeRef.current = undefined
    setIsRecording(false)
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
