import { useRef, useState } from 'react'
import { readAudio, recordAudio, type SpeechData } from 'vad-web'
import { encodeWavFileFromArrays } from 'wav-file-encoder'

import { uploadAudioFile } from './upload-audio-file'

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

  const handleSpeechStart = () => {
    console.log('Speech detected')
    setIsSpeaking(true)
  }
  const handleSpeechEnd = () => {
    console.log('Silence detected')
    setIsSpeaking(false)
  }
  const handleSpeechAvailable = ({
    audioData,
    sampleRate,
    startTime,
    endTime,
  }: SpeechData) => {
    console.log(`Audio received with duration ${endTime - startTime}ms`)
    const audioBuffer = encodeWavFileFromArrays([audioData], sampleRate, 1)
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' })
    const url = URL.createObjectURL(audioBlob)
    addAudioChunk({ url, startTime, endTime })
  }

  const handleStartRecording = async () => {
    setIsRecording(true)

    disposeRef.current = await recordAudio({
      onSpeechStart: handleSpeechStart,
      onSpeechEnd: handleSpeechEnd,
      onSpeechAvailable: handleSpeechAvailable,
    })
  }

  const handleUploadAudioFile = async () => {
    setIsRecording(true)

    const audioFileURL = await uploadAudioFile()
    if (!audioFileURL) return

    const audioData = await fetch(audioFileURL).then((res) => res.arrayBuffer())

    disposeRef.current = await readAudio({
      onSpeechStart: handleSpeechStart,
      onSpeechEnd: handleSpeechEnd,
      onSpeechAvailable: handleSpeechAvailable,
      audioData,
      // realTime: true,
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
          <>
            <button onClick={handleStartRecording}>Start Recording</button>
            <button onClick={handleUploadAudioFile}>Upload file</button>
          </>
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
