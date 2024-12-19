/**
 * [![NPM version](https://img.shields.io/npm/v/vad-web?color=a1b858)](https://www.npmjs.com/package/vad-web)
 *
 * A lightweight, browser-based Voice Activity Detection (VAD) library that
 * detects speech in real-time audio streams.
 *
 *
 * ## Installation
 *
 * ```bash
 * npm install vad-web
 * ```
 *
 * ## Credits
 *
 * - This package bundles the [`fft.js`](https://github.com/indutny/fft.js) library, 
 *   which is licensed under the [MIT License](https://github.com/indutny/fft.js?tab=readme-ov-file#license).
 *
 * - The VAD algorithm is based on the paper:
 *
 *   Moattar, Mohammad & Homayoonpoor, Mahdi. (2010). A simple but efficient
 *   real-time voice activity detection algorithm. European Signal Processing
 *   Conference.
 *
 *   https://www.researchgate.net/publication/255667085_A_simple_but_efficient_real-time_voice_activity_detection_algorithm
 *
 * - The VAD algorithm implementation is based on the [`vad-audio-worklet`](https://github.com/thurti/vad-audio-worklet) library,
 *   which is licensed under the [MIT License](https://github.com/thurti/vad-audio-worklet/blob/main/LICENSE).
 *
 * @module
 */

export { startRecognition, type RecognitionOptions } from './recognition'
export { startRecording, type RecordingOptions } from './recording'
export type { DisposeFunction } from './types'
