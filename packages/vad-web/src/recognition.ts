import { VADPipeline } from './vad-pipeline'

export interface RecognitionOptions {
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
   * Audio file data contained in an ArrayBuffer that is loaded from fetch(), XMLHttpRequest, or FileReader.
   */
  audioData: ArrayBuffer
}

/**
 * Starts a recognition session.
 *
 * @returns A function to stop the recognition session.
 */
export function startRecognition(options: RecognitionOptions): () => void {
  const {
    onAudioData,
    onSilence,
    onSpeech,
    // maxDurationSeconds,
    audioData: audioDataBuffer,
  } = options

  let disposeFlag = false
  const audioContext = new AudioContext()

  // Dispose function to stop recording
  const dispose = () => {
    disposeFlag = true
    void audioContext.close()
  }

  async function init() {
    try {
      const decoded: AudioBuffer =
        await audioContext.decodeAudioData(audioDataBuffer)
      const sampleRate = decoded.sampleRate

      const audioData = decoded.getChannelData(0)

      // Each chunk contains 128 samples, which is same as the `AudioWorkletProcessor.process` method.
      const chunkSize = 128

      const pipeline = new VADPipeline({
        sampleRate: sampleRate,
      })

      // TODO: handle maxDurationFrames
      for (let i = 0; i < audioData.length; i += chunkSize) {
        if (disposeFlag) break

        const chunk = audioData.slice(i, i + chunkSize)
        const results = pipeline.process(new Float32Array(chunk))
        for (const result of results) {
          if (result.type === 'audioData') {
            onAudioData?.(new Float32Array(result.audioBuffer), sampleRate)
          } else if (result.type === 'silence') {
            onSilence?.()
          } else if (result.type === 'speech') {
            onSpeech?.()
          }
        }
      }
    } catch (err) {
      dispose()
      throw new Error(`Failed to initialize recording: ${err}`, { cause: err })
    }
  }

  void init()

  return dispose
}