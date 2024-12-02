# vad-web

[![NPM version](https://img.shields.io/npm/v/vad-web?color=a1b858&label=)](https://www.npmjs.com/package/vad-web)

A lightweight, browser-based Voice Activity Detection (VAD) library that detects speech in real-time audio streams.

## Installation

```bash
npm install vad-web
```

## Usage

```ts
import { startRecording } from 'vad-web'
import audioWorkletURL from 'vad-web/vad-audio-worklet?url'

// Start recording
const dispose = startRecording({
  // The URL of the audio worklet script. More on this below.
  audioWorkletURL,

  // The maximum duration of `audioData` received by `onAudioData`.
  maxDurationSeconds: 5,

  // Called when audio data is received.
  onAudioData: (audioData: Float32Array, sampleRate: number) => {
    // Handle recorded audio data
    console.log(`Received audio: ${audioData.length} samples @ ${sampleRate}Hz`)
  },

  // Called when silence is detected.
  onSilence: () => {
    console.log('Silence detected')
  },

  // Called when speech is detected.
  onSpeech: () => {
    console.log('Speech detected')
  },
})

// Stop recording
dispose()
```

### audioWorkletURL

The `audioWorkletURL` is the URL of the audio worklet script. It is used to load the VAD algorithm into the browser's audio context.

If you are using Vite, you can use the following import:

```ts
import audioWorkletURL from 'vad-web/vad-audio-worklet?url'
```

If you are using WebPack, you need copy the [`vad-audio-worklet.js`](https://unpkg.com/vad-web/dist/vad-audio-worklet.js) file to your public directory, then you can use the following import:

```ts
const audioWorkletURL = '/vad-audio-worklet.js'
```

## Credits

- This package bundles the [`fft.js`](https://github.com/indutny/fft.js) library, which is licensed under the [MIT License](https://github.com/indutny/fft.js?tab=readme-ov-file#license).

- The VAD algorithm is based on the paper:

  Moattar, Mohammad & Homayoonpoor, Mahdi. (2010). A simple but efficient real-time voice activity detection algorithm. European Signal Processing Conference.

  https://www.researchgate.net/publication/255667085_A_simple_but_efficient_real-time_voice_activity_detection_algorithm

- The VAD algorithm implementation is based on the [`vad-audio-worklet`](https://github.com/thurti/vad-audio-worklet) library, which is licensed under the [MIT License](https://github.com/thurti/vad-audio-worklet/blob/main/LICENSE).

## License

MIT
