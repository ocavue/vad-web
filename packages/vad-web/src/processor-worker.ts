import { expose } from 'comlink'

import { VADProcessor } from './processor'

export function exposeProcessor() {
  const processor = new VADProcessor()
  expose(processor)
}
