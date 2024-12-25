import { wrap } from 'comlink'
import memoize from 'just-memoize'

import type { VADProcessor } from './processor'
import type { WorkerToMainMessage } from './types'

function createProcessor() {
  const worker = new Worker(new URL('./vad-web-worker.js', import.meta.url), {
    type: 'module',
    name: 'vad-web-worker',
  })
  const processor = wrap<VADProcessor>(worker)
  return processor
}

const getProcessor = memoize(createProcessor)

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
