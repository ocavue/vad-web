/// <reference types="./audio-worklet.d.ts" />

import { VADAudioProcessor } from './vad-audio-processor'

registerProcessor('vad-web-audio-processor', VADAudioProcessor)
