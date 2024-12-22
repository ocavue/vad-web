/**
 * [![NPM version](https://img.shields.io/npm/v/vad-web?color=a1b858)](https://www.npmjs.com/package/vad-web)
 *
 * An enterprise-grade Voice Activity Detection (VAD) library for the browser.
 *
 * It is based on the [Silero VAD](https://github.com/snakers4/silero-vad) model and [Transformers.js](https://github.com/huggingface/transformers.js).
 *
 * ## Online demo
 *
 * https://vad-web.vercel.app
 *
 * [source code](https://github.com/ocavue/vad-web/tree/master/examples/with-vite)
 *
 * ## Installation
 *
 * ```bash
 * npm install vad-web
 * ```
 *
 * ## Usage
 *
 * Here is a simple example of how to use the library to record audio and process it with the VAD processor.
 *
 * `recordAudio` is responsible for recording audio, and `VADProcessor` is actually doing the VAD processing.
 *
 * ```ts
 * import { recordAudio, VADProcessor } from 'vad-web'
 *
 * export async function startRecording() {
 *   const processor = new VADProcessor()
 *
 *   const dispose = await recordAudio({
 *     onAudioData: async (audioData) => {
 *       const events = await processor.process(audioData)
 *       events.forEach((event) => {
 *         if (event.type === 'speech') {
 *           console.log('Speech detected')
 *         } else if (event.type === 'silence') {
 *           console.log('Silence detected')
 *         } else if (event.type === 'audio') {
 *           console.log('Speech audio data available')
 *           // Further processing can be done here
 *         }
 *       })
 *     },
 *   })
 *
 *   // Return a dispose callback function
 *   return async () => {
 *     processor.stop()
 *     await dispose()
 *   }
 * }
 * ```
 *
 * ### Using in web worker
 *
 * Since the VAD processing is a heavy task, it is recommended to use it in a web worker.
 *
 * Here is an example of using the library in a web worker with [Comlink](https://github.com/GoogleChromeLabs/comlink).
 *
 * ```ts
 * // main.ts
 * import { wrap } from 'comlink'
 * import type { VADProcessor } from 'vad-web/processor'
 * import { recordAudio } from 'vad-web/record-audio'
 *
 * const worker = new Worker(new URL('./worker.ts', import.meta.url), {
 *   type: 'module',
 * })
 * const processor = wrap<VADProcessor>(worker)
 *
 * export async function startRecording() {
 *   const dispose = await recordAudio({
 *     onAudioData: async (audioData) => {
 *       const events = await processor.process(audioData)
 *       events.forEach((event) => {
 *         if (event.type === 'speech') {
 *           console.log('Speech detected')
 *         } else if (event.type === 'silence') {
 *           console.log('Silence detected')
 *         } else if (event.type === 'audio') {
 *           console.log('Speech audio data available')
 *           // Further processing can be done here
 *         }
 *       })
 *     },
 *   })
 *
 *   // Return a dispose callback function
 *   return async () => {
 *     await processor.stop()
 *     await dispose()
 *   }
 * }
 * ```
 *
 * ```ts
 * // worker.ts
 * import { expose } from 'comlink'
 * import { VADProcessor } from 'vad-web/processor'
 *
 * const processor = new VADProcessor()
 *
 * expose(processor)
 * ```
 *
 * @module
 */

export { recordAudio, type RecordAudioOptions } from './record-audio'

export { readAudio, type ReadAudioOptions } from './read-audio'

export {
  VADProcessor,
  type VADEvent,
  type VADSpeechEvent as VADSpeechStartEvent,
  type VADSilenceEvent as VADSpeechEndEvent,
  type VADAudioEvent,
} from './processor'

export type { DisposeFunction } from './types'
