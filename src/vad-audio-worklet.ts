/// <reference types="./audio-worklet.d.ts" />

import { concatFloat32Array } from './concat-float32-array'
import { VADAlgorithm } from './vad-algorithm'

export interface AudioVADProcessorOptions {
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

export type AudioVADPostMessage =
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

export type AudioVADGetMessage = {
  type: 'flush'
}

/**
 * AudioWorkletProcessor for Voice Activity Detection (VAD).
 *
 * Based on:
 * Moattar, Mohammad & Homayoonpoor, Mahdi. (2010).
 * A simple but efficient real-time voice activity detection algorithm.
 * European Signal Processing Conference.
 * @see https://www.researchgate.net/publication/255667085_A_simple_but_efficient_real-time_voice_activity_detection_algorithm
 */
class AudioVADProcessor extends AudioWorkletProcessor {
  private vad: VADAlgorithm
  private buffer: number[] = []
  private is_recording = false
  private recording_buffer: Float32Array[] = []
  private silent_frames_threshold: number
  private speech_frames_threshold: number

  constructor(options?: AudioWorkletNodeOptions) {
    super(options)

    const processor_options =
      options?.processorOptions as AudioVADProcessorOptions
    const sample_rate = processor_options.sampleRate
    this.silent_frames_threshold = processor_options.silentFramesThreshold ?? 20
    this.speech_frames_threshold = processor_options.speechFramesThreshold ?? 10

    this.vad = new VADAlgorithm(sample_rate)

    this.on((message) => {
      if (message.type === 'flush' && this.is_recording) {
        const audio_buffer = concatFloat32Array(this.recording_buffer)
        this.recording_buffer = []
        this.post({ type: 'audioData', audioBuffer: audio_buffer })
      }
    })
  }

  /**
   * Post a message to the main thread.
   */
  post(message: AudioVADPostMessage) {
    if (message.type === 'audioData' && message.audioBuffer) {
      const transferable = [message.audioBuffer.buffer]
      this.port.postMessage(message, transferable)
    } else {
      this.port.postMessage(message)
    }
  }

  /**
   * Add a message listener.
   */
  on(callback: (message: AudioVADGetMessage) => void) {
    this.port.addEventListener('message', (event) => {
      callback(event.data as AudioVADGetMessage)
    })
  }

  /**
   * Process audio data.
   * @param inputs - Audio input data
   * @param outputs - Audio output data
   * @param parameters - Audio parameters
   * @returns - Whether to keep the processor alive
   */
  process(inputs: Float32Array[][]): boolean {
    if (!inputs || !inputs[0] || !inputs[0][0]) {
      return true
    }

    this.buffer.push(...inputs[0][0])

    if (this.buffer.length < this.vad.frame_size) {
      return true
    }

    const frame = new Float32Array(this.buffer.slice(0, this.vad.frame_size))
    this.buffer = this.buffer.slice(this.vad.frame_size)

    const result = this.vad.process(frame)

    // Handle speech and silence detection
    if (this.is_recording) {
      if (result.is_silent_frame_counter >= this.silent_frames_threshold) {
        this.post({ type: 'silence' })
        this.is_recording = false
        const audio_buffer = concatFloat32Array(this.recording_buffer)
        this.post({ type: 'audioData', audioBuffer: audio_buffer })
        this.recording_buffer = []
      } else {
        this.recording_buffer.push(frame)
      }
    } else {
      if (result.is_speech_frame_counter >= this.speech_frames_threshold) {
        this.post({ type: 'speech' })
        this.is_recording = true
        this.recording_buffer = this.recording_buffer.slice(
          -result.is_speech_frame_counter,
        )
        this.recording_buffer.push(frame)
      } else {
        this.recording_buffer.push(frame)
      }
    }
    // Return true to keep processor alive
    return true
  }
}

registerProcessor('vad', AudioVADProcessor)
