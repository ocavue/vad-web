import { AUDIO_FRAME_SIZE, SAMPLE_RATE } from './constants'
import { dispatchEvents } from './event'
import { processor } from './processor-main'
import type { DisposeFunction, EventHandlers } from './types'
import { sleep } from './utils/sleep'
import { waitForIdle } from './utils/wait-for-idle'

async function start(options: ReadAudioOptions): Promise<DisposeFunction> {
  const { audioData: audioDataBuffer, realTime = false, ...handlers } = options

  let disposeFlag = false
  const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })

  // Dispose function to stop recording
  const dispose = async () => {
    if (disposeFlag) return
    disposeFlag = true
    await audioContext.close()
    const messages = await processor.stop()
    dispatchEvents(messages, handlers)
  }

  try {
    const decoded: AudioBuffer =
      await audioContext.decodeAudioData(audioDataBuffer)
    const sampleRate = decoded.sampleRate

    const chunkSize = AUDIO_FRAME_SIZE

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

        const messages = await processor.process(chunk)
        dispatchEvents(messages, handlers)
      }

      await dispose()
    }

    void handle()
  } catch (err) {
    void dispose()
    throw new Error(`Failed to initialize recording: ${err}`, { cause: err })
  }

  return dispose
}

/**
 * Options for {@link readAudio}.
 */
export interface ReadAudioOptions extends EventHandlers {
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

/**
 * Reads audio data from an ArrayBuffer and calls the `onAudioData` callback with the audio data.
 *
 * @param options - The options for reading audio data.
 * @returns A function to dispose of the audio reader.
 */
export async function readAudio(
  options: ReadAudioOptions,
): Promise<DisposeFunction> {
  return start(options)
}
