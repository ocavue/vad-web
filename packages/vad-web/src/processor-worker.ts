import { expose } from 'comlink'

import { VADProcessor } from './processor'

export function registerProcessor() {
  const processor = new VADProcessor()
  expose(processor)
}
