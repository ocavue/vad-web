import pLimit from 'p-limit'

import type { DisposeFunction } from './types'
import type {
  VADAudioGetMessage,
  VADAudioPostMessage,
  VADAudioProcessorOptions,
} from './vad-audio-worklet'

export interface RecordingOptions {
  /**
   * A function that will be called when audio data is received.
   */
  onAudioData?: (audioData: Float32Array, sampleRate: number) => void

  /**
   * A function that will be called when silence is detected.
   */
  onSilence?: () => void

  /**
   * A function that will be called when speech is detected.
   */
  onSpeech?: () => void

  /**
   * The maximum duration of the a single chunk of audio data in seconds.
   */
  maxDurationSeconds: number

  /**
   * The URL of the audio worklet script.
   *
   * It is used to process audio in a separate thread with very low latency.
   *
   * If you are using [Vite](https://vite.dev/), you can use the following import:
   *
   * ```ts
   * // audioWorkletURL is a string pointing to the audio worklet script
   * import audioWorkletURL from 'vad-web/vad-audio-worklet?url'
   * ```
   *
   * If you are using other bundlers like [webpack](https://webpack.js.org/), you need copy the
   * [`vad-audio-worklet.js`](https://unpkg.com/vad-web/dist/vad-audio-worklet.js)
   * file to your public directory, then set the `audioWorkletURL` to the path of the file:
   *
   * ```ts
   * const audioWorkletURL = '/vad-audio-worklet.js'
   * ```
   */
  audioWorkletURL: string | URL
}

const disposeFunctions: DisposeFunction[] = []

async function disposeAll() {
  while (disposeFunctions.length > 0) {
    await disposeFunctions.shift()?.()
  }
}

async function start(options: RecordingOptions): Promise<void> {
  // Dispose all previous recording sessions before starting a new one.
  await disposeAll()

  const {
    onAudioData,
    onSilence,
    onSpeech,
    maxDurationSeconds,
    audioWorkletURL,
  } = options

  let mediaStream: MediaStream | undefined
  let audioContext: AudioContext | undefined
  let sourceNode: MediaStreamAudioSourceNode | undefined
  let workletNode: AudioWorkletNode | undefined

  const postMessage = (message: VADAudioGetMessage) => {
    workletNode?.port.postMessage(message)
  }

  const listenMessage = (callback: (message: VADAudioPostMessage) => void) => {
    if (!workletNode) {
      return
    }

    // eslint-disable-next-line unicorn/prefer-add-event-listener
    workletNode.port.onmessage = (event) => {
      callback(event.data as VADAudioPostMessage)
    }
  }

  // Dispose function to stop recording
  const dispose = async () => {
    postMessage({ type: 'flush' })
    workletNode?.port.close()
    sourceNode?.disconnect()
    await audioContext?.close()
    mediaStream?.getTracks().forEach((track) => track.stop())
  }
  disposeFunctions.push(dispose)

  try {
    // Get microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioTrack = mediaStream.getAudioTracks()[0]
    const settings = audioTrack.getSettings()
    const inputSampleRate = settings.sampleRate

    // Create AudioContext with the input sample rate
    const desiredSampleRate = inputSampleRate || 48000
    audioContext = new AudioContext({ sampleRate: desiredSampleRate })

    // Add VAD processor
    await audioContext.audioWorklet.addModule(audioWorkletURL)

    // Create source node from microphone
    sourceNode = audioContext.createMediaStreamSource(mediaStream)

    // Create VAD node
    const processorOptions: VADAudioProcessorOptions = {
      sampleRate: audioContext.sampleRate,
      maxDurationSeconds,
    }
    workletNode = new AudioWorkletNode(
      audioContext,
      'vad-web-audio-processor',
      { processorOptions },
    )

    // Connect nodes
    sourceNode.connect(workletNode)

    // Handle messages from VAD node
    listenMessage((message) => {
      if (message.type === 'audioData') {
        const audioBuffer = message.audioBuffer
        const sampleRate = audioContext!.sampleRate
        onAudioData?.(new Float32Array(audioBuffer), sampleRate)
      } else if (message.type === 'silence') {
        onSilence?.()
      } else if (message.type === 'speech') {
        onSpeech?.()
      }
    })
  } catch (err) {
    void dispose()
    throw new Error(`Failed to initialize recording: ${err}`, { cause: err })
  }
}

const limit = pLimit(1)

/**
 * Starts a recording session that records audio from microphone.
 *
 * @returns A function to stop the recording session.
 */
export async function startRecording(
  options: RecordingOptions,
): Promise<DisposeFunction> {
  // Use `limit` to ensure that only one action (start or stop) is running at a time.
  await limit(() => start(options))
  return () => limit(disposeAll)
}
