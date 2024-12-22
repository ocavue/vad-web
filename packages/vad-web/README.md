# vad-web

[![NPM version](https://img.shields.io/npm/v/vad-web?color=a1b858)](https://www.npmjs.com/package/vad-web)

An enterprise-grade Voice Activity Detection (VAD) library for the browser.

It is based on the [Silero VAD](https://github.com/snakers4/silero-vad) model and [Transformers.js](https://github.com/huggingface/transformers.js).

## Online demo

https://vad-web.vercel.app

[source code](https://github.com/ocavue/vad-web/tree/master/examples/with-vite)

## Installation

```bash
npm install vad-web
```

## Usage

Here is a simple example of how to use the library to record audio and process it with the VAD processor.

`recordAudio` is responsible for recording audio, and `VADProcessor` is actually doing the VAD processing.

```ts
import { recordAudio, VADProcessor } from 'vad-web'

export async function startRecording() {
  const processor = new VADProcessor()

  const dispose = await recordAudio({
    onAudioData: async (audioData) => {
      const events = await processor.process(audioData)
      events.forEach((event) => {
        if (event.type === 'speech') {
          console.log('Speech detected')
        } else if (event.type === 'silence') {
          console.log('Silence detected')
        } else if (event.type === 'audio') {
          console.log('Speech audio data available')
          // Further processing can be done here
        }
      })
    },
  })

  // Return a dispose callback function
  return async () => {
    processor.stop()
    await dispose()
  }
}
```

### Using in web worker

Since the VAD processing is a heavy task, it is recommended to use it in a web worker.

Here is an example of using the library in a web worker with [Comlink](https://github.com/GoogleChromeLabs/comlink).

```ts
// main.ts
import { wrap } from 'comlink'
import type { VADProcessor } from 'vad-web/processor'
import { recordAudio } from 'vad-web/record-audio'

const worker = new Worker(new URL('./worker.ts', import.meta.url), {
  type: 'module',
})
const processor = wrap<VADProcessor>(worker)

export async function startRecording() {
  const dispose = await recordAudio({
    onAudioData: async (audioData) => {
      const events = await processor.process(audioData)
      events.forEach((event) => {
        if (event.type === 'speech') {
          console.log('Speech detected')
        } else if (event.type === 'silence') {
          console.log('Silence detected')
        } else if (event.type === 'audio') {
          console.log('Speech audio data available')
          // Further processing can be done here
        }
      })
    },
  })

  // Return a dispose callback function
  return async () => {
    await processor.stop()
    await dispose()
  }
}
```

```ts
// worker.ts
import { expose } from 'comlink'
import { VADProcessor } from 'vad-web/processor'

const processor = new VADProcessor()

expose(processor)
```

## API Reference

### recordAudio <a id="record-audio" href="#record-audio">#</a>

```ts
function recordAudio(options: RecordAudioOptions): Promise<DisposeFunction>
```

### RecordAudioOptions <a id="record-audio-options" href="#record-audio-options">#</a>

<dl>

<dt>

`onAudioData: (audioData: Float32Array<ArrayBufferLike>) => void`

</dt>

<dd>

</dd>

</dl>

### readAudio <a id="read-audio" href="#read-audio">#</a>

```ts
function readAudio(options: ReadAudioOptions): Promise<VoidFunction>
```

### ReadAudioOptions <a id="read-audio-options" href="#read-audio-options">#</a>

<dl>

<dt>

`onAudioData: (audioData: Float32Array<ArrayBufferLike>) => void`

</dt>

<dd>

A function that will be called when audio data is received.

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

### VADProcessor <a id="vad-processor" href="#vad-processor">#</a>

<dl>

<dt>

`constructor`

</dt>

<dd>

```
new VADProcessor(): VADProcessor
```

</dd>

<dt>

`process`

</dt>

<dd>

Processes the audio data.

**Returns**

A list of events that occurred during the processing.

```ts
const process: (audioData: Float32Array<ArrayBufferLike>) => Promise<VADEvent[]>
```

</dd>

<dt>

`stop`

</dt>

<dd>

Stops the VAD processor and handles the last unfinished speech if any.

```ts
const stop: () => void
```

</dd>

</dl>

### VADEvent <a id="vad-event" href="#vad-event">#</a>

**Type**: `VADSpeechStartEvent | VADSpeechEndEvent | VADAudioEvent`

### VADSpeechStartEvent <a id="vad-speech-start-event" href="#vad-speech-start-event">#</a>

A event fired when a speech starts.

<dl>

<dt>

`type: "speech"`

</dt>

<dd>

</dd>

</dl>

### VADSpeechEndEvent <a id="vad-speech-end-event" href="#vad-speech-end-event">#</a>

A event fired when a speech ends.

<dl>

<dt>

`type: "silence"`

</dt>

<dd>

</dd>

</dl>

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

### DisposeFunction <a id="dispose-function" href="#dispose-function">#</a>

A function that should be called to stop the recording or recognition session.

**Type**: `() => Promise<void>`
