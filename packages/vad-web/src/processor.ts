import {
  AUDIO_FRAME_SIZE,
  MAX_AUDIO_DURATION_SAMPLES,
  MIN_SILENCE_SAMPLES,
  MIN_SPEECH_SAMPLES,
  SAMPLE_RATE,
  SAMPLE_RATE_MS,
  SPEECH_PAD_SAMPLES,
} from './constants'
import { SileroVAD } from './silero-vad'
import type { VADEvent } from './types'
import { AudioDataBuffer } from './utils/audio-data-buffer'
import { AudioFrameQueue } from './utils/audio-frame-queue'

/**
 * A class that processes audio data and emits events based on the VAD results.
 */
export class VADProcessor {
  private vad = new SileroVAD()
  private buffer = new AudioDataBuffer(MAX_AUDIO_DURATION_SAMPLES)
  private wasSpeech = false
  private speechSamples = 0
  private postSpeechSamples = 0
  private frameQueue = new AudioFrameQueue(AUDIO_FRAME_SIZE)

  /**
   * Processes the audio data.
   *
   * @returns A list of events that occurred during the processing.
   */
  async process(audioData: Float32Array): Promise<VADEvent[]> {
    this.frameQueue.enqueue(audioData)

    let frame: Float32Array | undefined

    const events: VADEvent[] = []

    while ((frame = this.frameQueue.dequeue())) {
      events.push(...(await this.processFrame(frame)))
    }

    return events
  }

  /**
   * Stops the VAD processor and handles the last unfinished speech if any.
   */
  stop(): VADEvent[] {
    return this.handleAudioData()
  }

  private async processFrame(audioFrame: Float32Array): Promise<VADEvent[]> {
    // Detect if the current audio frame is speech
    const isSpeech = await this.vad.process(audioFrame, this.wasSpeech)

    if (!this.wasSpeech && !isSpeech) {
      this.buffer.write(audioFrame)
      return []
    }

    if (
      SPEECH_PAD_SAMPLES + this.speechSamples + audioFrame.length >
      MAX_AUDIO_DURATION_SAMPLES
    ) {
      this.handleAudioData()
    }

    this.buffer.write(audioFrame)

    if (isSpeech) {
      const events: VADEvent[] = []
      if (!this.wasSpeech) {
        events.push({ type: 'speech' })
      }
      this.wasSpeech = true
      // If postSpeechSamples is not zero, it means there was a short pause between
      // two speech frames, which is considered as part of the current speech chunk.
      this.speechSamples += this.postSpeechSamples + audioFrame.length
      this.postSpeechSamples = 0
      return events
    }

    // At this point, isSpeech is false and wasSpeech is true, which means we detected
    // a silence after a speech chunk.

    this.postSpeechSamples += audioFrame.length

    if (this.postSpeechSamples < MIN_SILENCE_SAMPLES) {
      // There was a short pause, but not long enough to consider the end of a speech chunk
      // (e.g., the speaker took a breath), so we continue recording
      return []
    }

    this.wasSpeech = false
    const events: VADEvent[] = [{ type: 'silence' }]
    events.push(...this.handleAudioData())
    return events
  }

  private handleAudioData(): VADEvent[] {
    if (this.speechSamples < MIN_SPEECH_SAMPLES) {
      this.reset()
      return []
    }

    const dropSamples = Math.max(0, this.postSpeechSamples - SPEECH_PAD_SAMPLES)
    const pickSamples = Math.min(
      this.buffer.length,
      // The pad before the speech
      SPEECH_PAD_SAMPLES +
        // The speech samples
        this.speechSamples +
        // The pad after the speech
        Math.min(this.postSpeechSamples, SPEECH_PAD_SAMPLES),
    )

    const endIndex = this.buffer.length - dropSamples
    const startIndex = endIndex - pickSamples

    const now = Date.now()
    const endTime = now - dropSamples / SAMPLE_RATE_MS
    const startTime = endTime - pickSamples / SAMPLE_RATE_MS

    const audioData = this.buffer.read(startIndex, endIndex)

    this.reset()

    const event: VADEvent = {
      type: 'audio',
      startTime,
      endTime,
      audioData,
      sampleRate: SAMPLE_RATE,
    }
    return [event]
  }

  private reset() {
    this.buffer.clear()
    this.speechSamples = 0
    this.postSpeechSamples = 0
  }
}
