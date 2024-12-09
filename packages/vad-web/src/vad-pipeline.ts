import { AudioFrameQueue } from './audio-frame-queue'
import { concatFloat32Array } from './concat-float32-array'
import { VADAlgorithm } from './vad-algorithm'

export interface VADPipelineOptions {
  sampleRate: number

  /**
   * The minimum number of silent frames before a speech is considered to be over.
   */
  silentFramesThreshold?: number

  /**
   * The minimum number of speech frames before a speech is considered to be started.
   */
  speechFramesThreshold?: number

  /**
   * The maximum duration of the a single chunk of audio data in seconds.
   */
  maxDurationSeconds: number
}

export type PipelineProcessResult =
  | {
      type: 'speech'
    }
  | {
      type: 'silence'
    }
  | {
      type: 'audioData'
      audioBuffer: Float32Array
    }

export class VADPipeline {
  private vad: VADAlgorithm
  private isRecording = false
  private inputBuffer: AudioFrameQueue
  private frames: Float32Array[] = []
  private silentFramesThreshold: number
  private speechFramesThreshold: number
  private maxFramesLength: number

  constructor(options: VADPipelineOptions) {
    const sampleRate = options.sampleRate
    this.silentFramesThreshold = options.silentFramesThreshold ?? 20
    this.speechFramesThreshold = options.speechFramesThreshold ?? 10
    this.vad = new VADAlgorithm(sampleRate)
    this.inputBuffer = new AudioFrameQueue(this.vad.frame_size)
    this.maxFramesLength =
      (options.maxDurationSeconds * sampleRate) / this.vad.frame_size
  }

  process(input: Float32Array): PipelineProcessResult[] {
    this.inputBuffer.enqueue(input)

    const results: PipelineProcessResult[] = []

    while (true) {
      const frame = this.inputBuffer.dequeue()
      if (!frame) {
        break
      }

      const result = this.vad.process(frame)

      // If we are recording.
      if (this.isRecording) {
        // Check if we have enough silent frames to consider the speech over, and if so, send the audio data.
        if (result.is_silent_frame_counter >= this.silentFramesThreshold) {
          results.push({ type: 'silence' })
          this.isRecording = false
          results.push(this.flush())
        } else {
          this.frames.push(frame)
        }

        // Check if we have reached the maximum duration, and if so, send the audio data.
        if (this.frames.length >= this.maxFramesLength) {
          results.push(this.flush())
        }
      }

      // If we are not recording
      else {
        // Check if we have enough speech frames to consider the speech started
        if (result.is_speech_frame_counter >= this.speechFramesThreshold) {
          results.push({ type: 'speech' })
          this.isRecording = true
          // Keep some buffer to avoid cutting off the speech at the beginning
          this.frames = this.frames.slice(-this.speechFramesThreshold * 2)
          this.frames.push(frame)
        } else {
          this.frames.push(frame)
        }
      }
    }

    return results
  }

  flush() {
    const audioBuffer = concatFloat32Array(this.frames)
    this.frames = []
    return { type: 'audioData', audioBuffer } satisfies PipelineProcessResult
  }
}
