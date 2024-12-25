import pLimit from 'p-limit'
import {
  addRecorderAudioWorkletModule,
  createRecorderAudioWorkletNode,
} from 'recorder-audio-worklet'

import { AUDIO_FRAME_SIZE, SAMPLE_RATE } from './constants'
import { dispatchEvents } from './event'
import { processor } from './processor-main'
import type { DisposeFunction, EventHandlers } from './types'
import { AudioFrameQueue } from './utils/audio-frame-queue'

const ERROR_MESSAGE =
  'Missing AudioWorklet support. Maybe this is not running in a secure context.'

const disposeFunctions: DisposeFunction[] = []

const limit = pLimit(1)

async function disposeAll() {
  while (disposeFunctions.length > 0) {
    const disposeFunction = disposeFunctions.shift()
    await disposeFunction?.()
  }
}

async function start(handlers: EventHandlers): Promise<void> {
  await disposeAll()

  if (typeof AudioWorkletNode === 'undefined') {
    throw new TypeError(ERROR_MESSAGE)
  }

  // Get microphone access
  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })

  await addRecorderAudioWorkletModule(async (url) => {
    await audioContext.audioWorklet.addModule(url)
  })

  const workletNode = createRecorderAudioWorkletNode(
    AudioWorkletNode,
    audioContext,
    { channelCount: 1 },
  )

  const sourceNode = audioContext.createMediaStreamSource(mediaStream)

  sourceNode.connect(workletNode)

  const channel = new MessageChannel()
  const { port1, port2 } = channel
  const queue = new AudioFrameQueue(AUDIO_FRAME_SIZE)

  // eslint-disable-next-line unicorn/prefer-add-event-listener
  port2.onmessage = async (event) => {
    const data = event.data as Float32Array[]
    const audioData: Float32Array = data?.[0]

    if (!(audioData instanceof Float32Array)) {
      return
    }

    queue.enqueue(audioData)

    while (true) {
      const frame = queue.dequeue()
      if (!frame) break
      const messages = await processor.process(frame)
      dispatchEvents(messages, handlers)
    }
  }

  await workletNode.record(port1)

  disposeFunctions.push(async () => {
    await workletNode.stop()
    sourceNode.disconnect()
    workletNode.disconnect()
    port1.close()
    port2.close()
    mediaStream?.getTracks().forEach((track) => track.stop())
    await audioContext.close()
    const messages = await processor.stop()
    dispatchEvents(messages, handlers)
  })
}

export interface RecordAudioOptions extends EventHandlers {}

/**
 * Records audio from the microphone and calls the `onAudioData` callback with the audio data.
 *
 * @param options - The options for recording audio.
 * @returns A function to dispose of the audio recorder.
 */
export async function recordAudio(
  options: RecordAudioOptions,
): Promise<DisposeFunction> {
  await limit(() => start(options))
  return () => limit(disposeAll)
}
