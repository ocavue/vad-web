# vad-web

[![NPM version](https://img.shields.io/npm/v/vad-web?color=a1b858)](https://www.npmjs.com/package/vad-web)

A lightweight, browser-based Voice Activity Detection (VAD) library that
detects speech in real-time audio streams.

## Installation

```bash
npm install vad-web
```

## Credits

- This package bundles the [`fft.js`](https://github.com/indutny/fft.js) library,
  which is licensed under the [MIT License](https://github.com/indutny/fft.js?tab=readme-ov-file#license).

- The VAD algorithm is based on the paper:

  Moattar, Mohammad & Homayoonpoor, Mahdi. (2010). A simple but efficient
  real-time voice activity detection algorithm. European Signal Processing
  Conference.

  https://www.researchgate.net/publication/255667085\_A\_simple\_but\_efficient\_real-time\_voice\_activity\_detection\_algorithm

- The VAD algorithm implementation is based on the [`vad-audio-worklet`](https://github.com/thurti/vad-audio-worklet) library,
  which is licensed under the [MIT License](https://github.com/thurti/vad-audio-worklet/blob/main/LICENSE).

## startRecording <a id="start-recording" href="#start-recording">#</a>

```ts
function startRecording(options: RecordingOptions): Promise<DisposeFunction>
```

Starts a recording session that records audio from microphone.

**Returns**

A function to stop the recording session.

## startRecognition <a id="start-recognition" href="#start-recognition">#</a>

```ts
function startRecognition(options: RecognitionOptions): Promise<DisposeFunction>
```

Starts a recognition session that processes the given audio data.

**Returns**

A function to stop the recognition session.

## RecordingOptions <a id="recording-options" href="#recording-options">#</a>

<dl>

<dt>

`onAudioData?: (audioData: Float32Array<ArrayBufferLike>, sampleRate: number) => void`

</dt>

<dd>

A function that will be called when audio data is received.

</dd>

<dt>

`onSilence?: () => void`

</dt>

<dd>

A function that will be called when silence is detected.

</dd>

<dt>

`onSpeech?: () => void`

</dt>

<dd>

A function that will be called when speech is detected.

</dd>

<dt>

`maxDurationSeconds: number`

</dt>

<dd>

The maximum duration of the a single chunk of audio data in seconds.

</dd>

<dt>

`audioWorkletURL: string | URL`

</dt>

<dd>

The URL of the audio worklet script.

It is used to process audio in a separate thread with very low latency.

If you are using Vite, you can use the following import:

```ts
// audioWorkletURL is a string pointing to the audio worklet script
import audioWorkletURL from 'vad-web/vad-audio-worklet?url'
```

If you are using other bundlers like WebPack, you need copy the
[`vad-audio-worklet.js`](https://unpkg.com/vad-web/dist/vad-audio-worklet.js)
file to your public directory, then set the `audioWorkletURL` to the path of the file:

```ts
const audioWorkletURL = '/vad-audio-worklet.js'
```

</dd>

</dl>

## RecognitionOptions <a id="recognition-options" href="#recognition-options">#</a>

<dl>

<dt>

`onAudioData?: (audioData: Float32Array<ArrayBufferLike>, sampleRate: number) => void`

</dt>

<dd>

A function that will be called when audio data is received.

</dd>

<dt>

`onSilence?: () => void`

</dt>

<dd>

A function that will be called when silence is detected.

</dd>

<dt>

`onSpeech?: () => void`

</dt>

<dd>

A function that will be called when speech is detected.

</dd>

<dt>

`maxDurationSeconds: number`

</dt>

<dd>

The maximum duration of the a single chunk of audio data in seconds.

</dd>

<dt>

`audioData: ArrayBuffer`

</dt>

<dd>

Audio file data contained in an ArrayBuffer that is loaded from fetch(), XMLHttpRequest, or FileReader.

</dd>

<dt>

`realTime?: boolean`

</dt>

<dd>

If true, simulates real-time processing by adding delays to match the audio duration.

</dd>

</dl>

## DisposeFunction <a id="dispose-function" href="#dispose-function">#</a>

A function that should be called to stop the recording or recognition session.

**Type**: `() => Promise<void>`
