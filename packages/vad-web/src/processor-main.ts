import { wrap } from 'comlink'

import type { VADProcessor } from './processor'
import type { VADEvent } from './types'

// function createWorker() {
//   const worker = new Worker(new URL('./vad-web-worker.js', import.meta.url), {
//     type: 'module',
//   })

//   return worker
// }

// function createProcessor() {
//   const worker = createWorker()
//   const processor = wrap<VADProcessor>(worker)
//   return processor
// }

// const getProcessor = memoize(createProcessor)

const worker = new Worker(new URL('./vad-web-worker.js', import.meta.url), {
  type: 'module',
})

const processorInner = wrap<VADProcessor>(worker)

export const processor = {
  process: async (audioData: Float32Array): Promise<VADEvent[]> => {
    console.debug('[processor-main] process')
    // const processor = getProcessor()
    return processorInner.process(audioData)
  },
  stop: async (): Promise<VADEvent[]> => {
    // const processor = getProcessor()
    return processorInner.stop()
  },
}
