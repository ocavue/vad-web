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
import { recordAudio, type VADEvent } from 'vad-web'

function handler(event: VADEvent) {
  if (event.type === 'speech') {
    console.log('Speech detected')
  } else if (event.type === 'silence') {
    console.log('Silence detected')
  } else if (event.type === 'audio') {
    console.log('Speech audio data available')
    // Further processing can be done here
  }
}

const dispose = await recordAudio({ handler })
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

<dl>

<dt>

`handler: (event: VADEvent) => void`

</dt>

<dd>

A function that will be called with the VAD event.

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

<dl>

<dt>

`handler: (event: VADEvent) => void`

</dt>

<dd>

A function that will be called with the VAD event.

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

**Default**: `false`

</dd>

</dl>

### VADEvent <a id="vad-event" href="#vad-event">#</a>

**Type**: `VADSpeechEvent | VADSilenceEvent | VADAudioEvent`

### VADAudioEvent <a id="vad-audio-event" href="#vad-audio-event">#</a>

A event fired when speech audio data is available.

<dl>

<dt>

`type: "audio"`

</dt>

<dd>

</dd>

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

`audioData: Float32Array<ArrayBufferLike>`

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

### VADSilenceEvent <a id="vad-silence-event" href="#vad-silence-event">#</a>

A event fired when a speech ends.

<dl>

<dt>

`type: "silence"`

</dt>

<dd>

</dd>

</dl>

### VADSpeechEvent <a id="vad-speech-event" href="#vad-speech-event">#</a>

A event fired when a speech starts.

<dl>

<dt>

`type: "speech"`

</dt>

<dd>

</dd>

</dl>

### DisposeFunction <a id="dispose-function" href="#dispose-function">#</a>

A function that should be called to stop the recording or recognition session.

**Type**: `() => Promise<void>`
