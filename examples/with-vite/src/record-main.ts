import { wrap } from 'comlink'
import { type VADEvent, type VADProcessor } from 'vad-web/processor'
import { recordAudio } from 'vad-web/record-audio'

const worker = new Worker(new URL('./record-worker.ts', import.meta.url), {
  type: 'module',
})
const processor = wrap<VADProcessor>(worker)

export async function startRecording(handler: (event: VADEvent) => void) {
  const dispose = await recordAudio({
    onAudioData: async (audioData) => {
      const events = await processor.process(audioData)
      events.forEach(handler)
    },
  })

  // Return a dispose callback function
  return async () => {
    await processor.stop()
    await dispose()
  }
}
