/// <reference types="./audio-worklet.d.ts" />

/// <reference types="./audio-worklet.d.ts" />

import {
    VADPipeline,
    type PipelineProcessResult,
    type VADPipelineOptions,
  } from './vad-pipeline'
  
  export type VADAudioProcessorOptions = VADPipelineOptions
  
  export type VADAudioPostMessage = PipelineProcessResult
  
  export type VADAudioGetMessage = {
    type: 'flush'
  }
  
  export class VADAudioProcessor extends AudioWorkletProcessor {
    private pipeline: VADPipeline
  
    constructor(options?: AudioWorkletNodeOptions) {
      super(options)
  
      const processorOptions =
        options?.processorOptions as VADAudioProcessorOptions
  
      this.pipeline = new VADPipeline(processorOptions)
  
      this.on((message) => {
        if (message.type === 'flush') {
          const result = this.pipeline.flush()
          if (result.audioBuffer.length > 0) {
            this.post(result)
          }
        }
      })
    }
  
    /**
     * Post a message to the main thread.
     */
    post(message: VADAudioPostMessage) {
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
    on(callback: (message: VADAudioGetMessage) => void) {
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      this.port.onmessage = (event) => {
        callback(event.data as VADAudioGetMessage)
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
  

registerProcessor('vad-web-audio-processor', VADAudioProcessor)
