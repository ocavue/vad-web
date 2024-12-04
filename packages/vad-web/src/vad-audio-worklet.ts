/// <reference types="./audio-worklet.d.ts" />

import {
  VADPipeline,
  type PipelineProcessResult,
  type VADPipelineOptions,
} from './vad-pipeline'

export type AudioVADProcessorOptions = VADPipelineOptions

export type AudioVADPostMessage = PipelineProcessResult

export type AudioVADGetMessage = {
  type: 'flush'
}

class AudioVADProcessor extends AudioWorkletProcessor {
  private pipeline: VADPipeline

  constructor(options?: AudioWorkletNodeOptions) {
    super(options)

    const processorOptions =
      options?.processorOptions as AudioVADProcessorOptions

    this.pipeline = new VADPipeline({
      sampleRate: processorOptions.sampleRate,
      silentFramesThreshold: processorOptions.silentFramesThreshold,
      speechFramesThreshold: processorOptions.speechFramesThreshold,
    })

    this.on((message) => {
      if (message.type === 'flush') {
        const result = this.pipeline.flush()
        if (result) {
          this.post(result)
        }
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
    // eslint-disable-next-line unicorn/prefer-add-event-listener
    this.port.onmessage = (event) => {
      callback(event.data as AudioVADGetMessage)
    }
  }

  /**
   * Process audio data.
   */
  process(inputs: Float32Array[][]): boolean {
    if (!inputs || !inputs[0] || !inputs[0][0]) {
      return true
    }

    const audioData: Float32Array = inputs[0][0]
    const results = this.pipeline.process(audioData)
    for (const result of results) {
      this.post(result)
    }

    return true
  }
}

registerProcessor('AudioVADProcessor', AudioVADProcessor)
