import { useRef, useState } from 'react'
import { recordAudio } from 'vad-web'
import { encodeWavFileFromArrays } from 'wav-file-encoder'

interface AudioChunk {
  url: string
  startTime: number
  endTime: number
}

export default function Recorder() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const disposeRef = useRef<() => Promise<void>>()
  const [audioChunks, setAudioChunks] = useState<AudioChunk[]>([])

  const addAudioChunk = (chunk: AudioChunk) => {
    setAudioChunks((prev) => [...prev, chunk])
  }

  const start = async () => {
    setIsRecording(true)

    disposeRef.current = await recordAudio({
      handler: (event) => {
        if (event.type === 'audio') {
          console.log(
            `Audio received with duration ${event.endTime - event.startTime}ms`,
          )
          const { audioData, sampleRate, startTime, endTime } = event
          const audioBuffer = encodeWavFileFromArrays(
            [audioData],
            sampleRate,
            1,
          )
          const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' })
          const url = URL.createObjectURL(audioBlob)
          addAudioChunk({ url, startTime, endTime })
        } else if (event.type === 'speech') {
          console.log('Speech start detected')
          setIsSpeaking(true)
        } else if (event.type === 'silence') {
          console.log('Speech end detected')
          setIsSpeaking(false)
        }
      },
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
        {audioChunks.map((chunk) => (
          <div key={chunk.url}>
            <hr />
            <div className="flex gap-2 items-center">
              <audio src={chunk.url} controls />
              <div>
                {new Date(chunk.startTime).toLocaleTimeString()} -{' '}
                {new Date(chunk.endTime).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
