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

  constructor(options: VADPipelineOptions) {
    const sampleRate = options.sampleRate
    this.silentFramesThreshold = options.silentFramesThreshold ?? 20
    this.speechFramesThreshold = options.speechFramesThreshold ?? 10
    this.vad = new VADAlgorithm(sampleRate)
    this.inputBuffer = new AudioFrameQueue(this.vad.frame_size)
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

      if (this.isRecording) {
        if (result.is_silent_frame_counter >= this.silentFramesThreshold) {
          results.push({ type: 'silence' })
          this.isRecording = false
          const audioBuffer = concatFloat32Array(this.frames)
          this.frames = []
          results.push({ type: 'audioData', audioBuffer })
        } else {
          this.frames.push(frame)
        }
      } else {
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

  flush(): PipelineProcessResult | undefined {
    if (this.frames.length === 0) {
      return undefined
    }

    const audioBuffer = concatFloat32Array(this.frames)
    this.frames = []
    return { type: 'audioData', audioBuffer }
  }
}
