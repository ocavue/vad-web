import { wrap } from 'comlink'
import cache from 'just-once'

import type { VADProcessor } from './processor'
import type { WorkerToMainMessage } from './types'

const getProcessor = cache(() => {
  const worker = new Worker(new URL('./vad-web-worker.js', import.meta.url), {
    type: 'module',
    name: 'vad-web-worker',
  })
  return wrap<VADProcessor>(worker)
})

export const processor = {
  process: async (audioData: Float32Array): Promise<WorkerToMainMessage[]> => {
    const processor = getProcessor()
    return processor.process(audioData)
  },
  stop: async (): Promise<WorkerToMainMessage[]> => {
    const processor = getProcessor()
    return processor.stop()
  },
}
