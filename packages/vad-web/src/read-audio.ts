import { SAMPLE_RATE } from './constants'
import type { DisposeFunction } from './types'
import { sleep } from './utils/sleep'
import { waitForIdle } from './utils/wait-for-idle'

async function start(options: ReadAudioOptions): Promise<DisposeFunction> {
  const { onAudioData, audioData: audioDataBuffer, realTime = false } = options

  let disposeFlag = false
  const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })

  // Dispose function to stop recording
  const dispose = async () => {
    if (disposeFlag) return
    disposeFlag = true
    await audioContext.close()
  }

  try {
    const decoded: AudioBuffer =
      await audioContext.decodeAudioData(audioDataBuffer)
    const sampleRate = decoded.sampleRate

    // Each chunk contains 128 samples, which is same as the `AudioWorkletProcessor.process` method.
    const chunkSize = 128

    const handle = async () => {
      await waitForIdle()
      const audioData = decoded.getChannelData(0)
      await waitForIdle()

      const start = performance.now()

      for (let i = 0; i < audioData.length; i += chunkSize) {
        if (disposeFlag) break

        const chunk = audioData.slice(i, i + chunkSize)

        if (realTime) {
          await waitForIdle()

          const millisecondsPassed = performance.now() - start
          const audioMillisecondsPassed = (i / sampleRate) * 1000

          if (millisecondsPassed < audioMillisecondsPassed) {
            await sleep(audioMillisecondsPassed - millisecondsPassed)
          }
        }

        onAudioData(chunk)
      }
    }

    void handle()
  } catch (err) {
    void dispose()
    throw new Error(`Failed to initialize recording: ${err}`, { cause: err })
  }

  return dispose
}

export interface ReadAudioOptions {
  /**
   * A function that will be called when audio data is received.
   */
  onAudioData: (audioData: Float32Array) => void

  /**
   * Audio file data contained in an ArrayBuffer that is loaded from fetch(), XMLHttpRequest, or FileReader.
   */
  audioData: ArrayBuffer

  /**
   * If true, simulates real-time processing by adding delays to match the audio duration.
   *
   * @default false
   */
  realTime?: boolean
}

export async function readAudio(
  options: ReadAudioOptions,
): Promise<VoidFunction> {
  return start(options)
}
