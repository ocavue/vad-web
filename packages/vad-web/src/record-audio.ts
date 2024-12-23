import pLimit from 'p-limit'
import {
  addRecorderAudioWorkletModule,
  createRecorderAudioWorkletNode,
} from 'recorder-audio-worklet'

import { SAMPLE_RATE } from './constants'
import { processor } from './processor-main'
import type { DisposeFunction, VADEvent } from './types'

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

async function start(handler: (event: VADEvent) => void): Promise<void> {
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

  // eslint-disable-next-line unicorn/prefer-add-event-listener
  port2.onmessage = async (event) => {
    const data = event.data as Float32Array[]
    const audioData: Float32Array = data?.[0]

    if (audioData instanceof Float32Array) {
      const events = await processor.process(audioData)
      for (const event of events) {
        handler(event)
      }
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
    const events = await processor.stop()
    for (const event of events) {
      handler(event)
    }
  })
}

export interface RecordAudioOptions {
  /**
   * A function that will be called with the VAD event.
   */
  handler: (event: VADEvent) => void
}

/**
 * Records audio from the microphone and calls the `onAudioData` callback with the audio data.
 *
 * @param options - The options for recording audio.
 * @returns A function to dispose of the audio recorder.
 */
export async function recordAudio({
  handler,
}: RecordAudioOptions): Promise<DisposeFunction> {
  await limit(() => start(handler))
  return () => limit(disposeAll)
}
