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
    vadNode.port.addEventListener('message', (event) => {
      callback(event.data as AudioVADPostMessage)
    })
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
      console.log('mediaStream:', mediaStream)
      const audioTrack = mediaStream.getAudioTracks()[0]
      const settings = audioTrack.getSettings()
      const inputSampleRate = settings.sampleRate
      console.log('Input sample rate:', inputSampleRate)

      // Create AudioContext with the input sample rate
      const desiredSampleRate = inputSampleRate || 48000
      audioContext = new AudioContext({ sampleRate: desiredSampleRate })
      console.log('AudioContext sampleRate:', audioContext.sampleRate)

      // Add VAD processor
      await audioContext.audioWorklet.addModule(audioWorkletURL)

      // Create source node from microphone
      sourceNode = audioContext.createMediaStreamSource(mediaStream)

      // Create VAD node
      vadNode = new AudioWorkletNode(audioContext, 'vad', {
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
          console.log('Received audioBuffer in main thread:', audioBuffer)

          if (audioBuffer instanceof Float32Array) {
            const float32Array = new Float32Array(audioBuffer)
            console.log('Converted Float32Array:', float32Array)

            // Check data validity
            let hasValidData = false
            for (const element of float32Array) {
              if (element !== 0) {
                hasValidData = true
                break
              }
            }
            console.log('float32Array has valid data:', hasValidData)

            onAudioData?.(float32Array, audioContext.sampleRate)
          } else {
            console.error('audioBuffer is not an Float32Array:', audioBuffer)
          }
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
      console.error('Error initializing recording:', err)
      dispose()
    }
  }

  void init()

  return dispose
}
