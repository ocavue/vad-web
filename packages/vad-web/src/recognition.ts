import type { DisposeFunction } from './types'
import { sleep } from './utils/sleep'
import { waitForIdle } from './utils/wait-for-idle'
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
export async function startRecognition(
  options: RecognitionOptions,
): Promise<DisposeFunction> {
  const {
    onAudioData,
    onSilence,
    onSpeech,
    maxDurationSeconds,
    audioData: audioDataBuffer,
  } = options

  let disposeFlag = false
  const audioContext = new AudioContext()

  // Dispose function to stop recording
  const dispose = async () => {
    disposeFlag = true
    await audioContext.close()
  }

  try {
    const decoded: AudioBuffer =
      await audioContext.decodeAudioData(audioDataBuffer)
    const sampleRate = decoded.sampleRate

    // Each chunk contains 128 samples, which is same as the `AudioWorkletProcessor.process` method.
    const chunkSize = 128

    const pipeline = new VADPipeline({
      sampleRate,
      maxDurationSeconds,
    })

    const handle = async () => {
      await waitForIdle()
      const audioData = decoded.getChannelData(0)
      await waitForIdle()

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
        if (results.length > 0) {
          await waitForIdle()
        }
      }
    }

    void handle()
  } catch (err) {
    void dispose()
    throw new Error(`Failed to initialize recording: ${err}`, { cause: err })
  }

  return dispose
}
