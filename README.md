# vad-web

[![NPM version](https://img.shields.io/npm/v/vad-web?color=a1b858)](https://www.npmjs.com/package/vad-web)

An enterprise-grade Voice Activity Detection (VAD) library for the browser.

It is based on the [Silero VAD](https://github.com/snakers4/silero-vad) model
and [Transformers.js](https://github.com/huggingface/transformers.js).

## Online demo

https://vad-web.vercel.app

[source
code](https://github.com/ocavue/vad-web/tree/master/examples/with-vite)

## Installation

```bash
npm install vad-web
```

## Usage

Call `recordAudio` to start recording audio and get a dispose function. Under
the hood, it will run the [Silero
VAD](https://github.com/snakers4/silero-vad) model in a web worker to avoid
blocking the main thread.

```ts
import { recordAudio } from 'vad-web'

const dispose = await recordAudio({
  onSpeechStart: () => {
    console.log('Speech detected')
  },
  onSpeechEnd: () => {
    console.log('Silence detected')
  },
  onSpeechAvailable: ({ audioData, sampleRate, startTime, endTime }) => {
    console.log(`Audio received with duration ${endTime - startTime}ms`)
    // Further processing can be done here
  }
})
```

## API Reference

### recordAudio <a id="record-audio" href="#record-audio">#</a>

```ts
function recordAudio(options: RecordAudioOptions): Promise<DisposeFunction>
```

Records audio from the microphone and calls the `onAudioData` callback with the audio data.

**Returns**

A function to dispose of the audio recorder.

### RecordAudioOptions <a id="record-audio-options" href="#record-audio-options">#</a>

Options for [recordAudio](README.md#record-audio).

<dl>

<dt>

`onSpeechStart?: () => void`

</dt>

<dd>

Triggered when speech is detected.

</dd>

<dt>

`onSpeechEnd?: () => void`

</dt>

<dd>

Triggered when silence is detected.

</dd>

<dt>

`onSpeechAvailable?: (data: SpeechData) => void`

</dt>

<dd>

Triggered when a speech is finished and the audio data is available.

</dd>

<dt>

`onSpeechOngoing?: (data: SpeechData) => void`

</dt>

<dd>

Triggered periodically (once per second) while speech is ongoing.

</dd>

</dl>

### readAudio <a id="read-audio" href="#read-audio">#</a>

```ts
function readAudio(options: ReadAudioOptions): Promise<DisposeFunction>
```

Reads audio data from an ArrayBuffer and calls the `onAudioData` callback with the audio data.

**Returns**

A function to dispose of the audio reader.

### ReadAudioOptions <a id="read-audio-options" href="#read-audio-options">#</a>

Options for [readAudio](README.md#read-audio).

<dl>

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

**Default**: `false`

</dd>

<dt>

`onSpeechStart?: () => void`

</dt>

<dd>

Triggered when speech is detected.

</dd>

<dt>

`onSpeechEnd?: () => void`

</dt>

<dd>

Triggered when silence is detected.

</dd>

<dt>

`onSpeechAvailable?: (data: SpeechData) => void`

</dt>

<dd>

Triggered when a speech is finished and the audio data is available.

</dd>

<dt>

`onSpeechOngoing?: (data: SpeechData) => void`

</dt>

<dd>

Triggered periodically (once per second) while speech is ongoing.

</dd>

</dl>

### SpeechData <a id="speech-data" href="#speech-data">#</a>

An object representing speech data.

<dl>

<dt>

`startTime: number`

</dt>

<dd>

A timestamp in milliseconds

</dd>

<dt>

`endTime: number`

</dt>

<dd>

A timestamp in milliseconds

</dd>

<dt>

`audioData: Float32Array`

</dt>

<dd>

The audio data

</dd>

<dt>

`sampleRate: number`

</dt>

<dd>

The sample rate of the audio data

</dd>

</dl>

### DisposeFunction <a id="dispose-function" href="#dispose-function">#</a>

A function that should be called to stop the recording or recognition session.

**Type**: `() => Promise<void>`
