import type {
  AudioVADGetMessage,
  AudioVADPostMessage,
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
   */
  audioWorkletURL: string | URL
}

/**
 * Starts a recording session.
 *
 * @returns A function to stop the recording session.
 */
export function startRecording(options: RecordingOptions): () => void {
  const {
    onAudioData,
    onSilence,
    onSpeech,
    maxDurationSeconds,
    audioWorkletURL,
  } = options

  let mediaStream: MediaStream
  let audioContext: AudioContext
  let sourceNode: MediaStreamAudioSourceNode
  let vadNode: AudioWorkletNode
  let disposeFlag = false
  let recordingTimeout: ReturnType<typeof setTimeout> | null = null

  const post = (message: AudioVADGetMessage) => {
    vadNode.port.postMessage(message)
  }

  const on = (callback: (message: AudioVADPostMessage) => void) => {
    // eslint-disable-next-line unicorn/prefer-add-event-listener
    vadNode.port.onmessage = (event) => {
      callback(event.data as AudioVADPostMessage)
    }
  }

  // Dispose function to stop recording
  const dispose = () => {
    disposeFlag = true
    if (vadNode) {
      post({ type: 'flush' })
      vadNode.port.close()
    }
    sourceNode?.disconnect()
    void audioContext?.close()
    mediaStream?.getTracks().forEach((track) => track.stop())
    if (recordingTimeout) {
      clearTimeout(recordingTimeout)
    }
  }

  async function init() {
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
      vadNode = new AudioWorkletNode(audioContext, 'AudioVADProcessor', {
        processorOptions: {
          sampleRate: audioContext.sampleRate,
        },
      })

      // Connect nodes
      sourceNode.connect(vadNode)

      // Handle messages from VAD node
      on((message) => {
        if (message.type === 'audioData') {
          const audioBuffer = message.audioBuffer
          onAudioData?.(new Float32Array(audioBuffer), audioContext.sampleRate)
        } else if (message.type === 'silence') {
          onSilence?.()
        } else if (message.type === 'speech') {
          onSpeech?.()
        }

        // Set a timeout to stop recording after maxDurationSeconds
        if (recordingTimeout) {
          clearTimeout(recordingTimeout)
        }
        recordingTimeout = setTimeout(() => {
          if (disposeFlag) return

          // Stop recording
          post({ type: 'flush' })
        }, maxDurationSeconds * 1000)
      })
    } catch (err) {
      dispose()
      throw new Error(`Failed to initialize recording: ${err}`, { cause: err })
    }
  }

  void init()

  return dispose
}
