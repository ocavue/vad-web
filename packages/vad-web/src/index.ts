/**
 * [![NPM version](https://img.shields.io/npm/v/vad-web?color=a1b858)](https://www.npmjs.com/package/vad-web)
 *
 * An enterprise-grade Voice Activity Detection (VAD) library for the browser.
 *
 * It is based on the [Silero VAD](https://github.com/snakers4/silero-vad) model
 * and [Transformers.js](https://github.com/huggingface/transformers.js).
 *
 * ## Online demo
 *
 * https://vad-web.vercel.app
 *
 * [source
 * code](https://github.com/ocavue/vad-web/tree/master/examples/with-vite)
 *
 * ## Installation
 *
 * ```bash
 * npm install vad-web
 * ```
 *
 * ## Usage
 *
 * Call `recordAudio` to start recording audio and get a dispose function. Under
 * the hood, it will run the [Silero
 * VAD](https://github.com/snakers4/silero-vad) model in a web worker to avoid
 * blocking the main thread.
 *
 * ```ts
 * import { recordAudio } from 'vad-web'
 *
 * const dispose = await recordAudio({
 *   onSpeechStart: () => {
 *     console.log('Speech detected')
 *   },
 *   onSpeechEnd: () => {
 *     console.log('Silence detected')
 *   },
 *   onSpeechAvailable: ({ audioData, sampleRate, startTime, endTime }) => {
 *     console.log(`Audio received with duration ${endTime - startTime}ms`)
 *     // Further processing can be done here
 *   }
 * })
 * ```
 *
 * @module
 */

export { recordAudio, type RecordAudioOptions } from './record-audio'

export { readAudio, type ReadAudioOptions } from './read-audio'

export type { SpeechData } from './types'

export type { DisposeFunction } from './types'
