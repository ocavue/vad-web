import { expose } from 'comlink'
import { VADProcessor } from 'vad-web/processor'

const processor = new VADProcessor()

expose(processor)
