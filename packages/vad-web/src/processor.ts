import {
  AUDIO_FRAME_SIZE,
  MAX_AUDIO_DURATION_SAMPLES,
  MIN_SPEECH_SAMPLES,
  SAMPLE_RATE,
  SAMPLE_RATE_MS,
  SPEECH_ACTIVE_INTERVAL_MS,
  SPEECH_PAD_SAMPLES,
} from './constants'
import { SileroVAD } from './silero-vad'
import type { SpeechData, WorkerToMainMessage } from './types'
import { AudioDataBuffer } from './utils/audio-data-buffer'
import { AudioFrameQueue } from './utils/audio-frame-queue'

/**
 * A class that processes audio data and emits events based on the VAD results.
 */
export class VADProcessor {
  private vad = new SileroVAD()
  private buffer = new AudioDataBuffer(MAX_AUDIO_DURATION_SAMPLES)
  private wasSpeech = false
  private frameQueue = new AudioFrameQueue(AUDIO_FRAME_SIZE)

  private preSpeechSamples = 0
  private speechSamples = 0
  private postSpeechSamples = 0

  private lastSpeechActiveMessageTime = 0

  /**
   * Processes the audio data.
   *
   * @returns A list of messages that occurred during the processing.
   */
  async process(audioData: Float32Array): Promise<WorkerToMainMessage[]> {
    this.frameQueue.enqueue(audioData)

    const messages: WorkerToMainMessage[] = []

    while (true) {
      const frame = this.frameQueue.dequeue()
      if (!frame) break
      await this.processFrame(frame, messages)
    }

    return messages
  }

  /**
   * Stops the VAD processor and handles the last unfinished speech if any.
   */
  stop(): WorkerToMainMessage[] {
    const messages: WorkerToMainMessage[] = []
    this.handleAudioData(messages, true)
    return messages
  }

  private async processFrame(
    audioFrame: Float32Array,
    messages: WorkerToMainMessage[],
  ): Promise<void> {
    // Detect if the current audio frame is speech
    const isSpeech = await this.vad.process(audioFrame, this.wasSpeech)

    this.buffer.write(audioFrame)

    if (isSpeech && !this.wasSpeech) {
      this.wasSpeech = true
      messages.push({ type: 'start' })
    } else if (!isSpeech && this.wasSpeech) {
      this.wasSpeech = false
      messages.push({ type: 'end' })
    }

    if (this.wasSpeech) {
      this.speechSamples += this.postSpeechSamples + audioFrame.length
      this.postSpeechSamples = 0
    } else if (this.speechSamples) {
      this.postSpeechSamples += audioFrame.length
    } else {
      this.preSpeechSamples += audioFrame.length
    }

    this.handleAudioData(messages, false)
    return
  }

  private handleAudioData(
    messages: WorkerToMainMessage[],
    force: boolean,
  ): void {
    if (this.speechSamples < MIN_SPEECH_SAMPLES) {
      return
    }

    const now = performance.now()

    let speechData: SpeechData | undefined

    if (now - this.lastSpeechActiveMessageTime > SPEECH_ACTIVE_INTERVAL_MS) {
      this.lastSpeechActiveMessageTime = now
      speechData = this.getAudioData(now)
      messages.push({ type: 'ongoing', data: speechData })
    }

    if (
      force ||
      this.postSpeechSamples > SPEECH_PAD_SAMPLES ||
      this.speechSamples + SPEECH_PAD_SAMPLES * 2 >= MAX_AUDIO_DURATION_SAMPLES
    ) {
      speechData = speechData || this.getAudioData(now)
      messages.push({ type: 'available', data: speechData })

      this.reset()
    }
  }

  private getAudioData(now: number): SpeechData {
    const pickedSamples = Math.min(
      this.buffer.length,
      Math.min(this.preSpeechSamples, SPEECH_PAD_SAMPLES) +
        this.speechSamples +
        this.postSpeechSamples,
    )

    const endIndex = this.buffer.length
    const startIndex = endIndex - pickedSamples

    const endTime = now
    const startTime = endTime - pickedSamples / SAMPLE_RATE_MS

    return {
      startTime,
      endTime,
      audioData: this.buffer.read(startIndex, endIndex),
      sampleRate: SAMPLE_RATE,
    }
  }

  private reset(): void {
    this.preSpeechSamples = 0
    this.speechSamples = 0
    this.postSpeechSamples = 0
    this.wasSpeech = false
  }
}
