# vad-web

## 0.4.0

### Minor Changes

- b19d419: `startRecognition` now can simulate real-time processing by adding delays to match the audio duration.

## 0.3.0

### Minor Changes

- b59d863: The `startRecording` function now returns a Promise that resolves with a cleanup function once recording begins. Call this cleanup function when you want to stop recording.

  ```ts
  // before
  const disposeFunction = startRecording({})

  // after
  const disposeFunction = await startRecording({})
  ```

- 3d20400: Remove `splitAudio()` and add `startRecognition()`.

## 0.2.0

### Minor Changes

- 624f810: Add `splitAudio` to split a given audio data into chunks.

## 0.1.1

### Patch Changes

- 07dcc77: Update README.
