import { expose } from 'comlink'

import { VADProcessor } from './processor'

export function exposeProcessor() {
  const processor = new VADProcessor()
  expose({
    process: (audioData: Float32Array) => {
      console.debug('[processor-worker] process')
      return processor.process(audioData)
    },
    stop: () => {
      return processor.stop()
    },
  })
}
