---
'vad-web': minor
---


The `startRecording` function now returns a Promise that resolves with a cleanup function once recording begins. Call this cleanup function when you want to stop recording.

```ts
// before
const disposeFunction = startRecording({})

// after
const disposeFunction = await startRecording({})
```
