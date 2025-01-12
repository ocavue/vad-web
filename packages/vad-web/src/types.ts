/**
 * A function that should be called to stop the recording or recognition session.
 *
 * @returns A promise that resolves when the session is stopped.
 */
export type DisposeFunction = () => Promise<void>

/**
 * @internal
 */
export type MainToWorkerMessage =
  | {
      type: 'audio'
      audioData: Float32Array
    }
  | {
      type: 'stop'
    }

/**
 * @internal
 */
export type WorkerToMainMessage =
  | {
      type: 'start'
    }
  | {
      type: 'end'
    }
  | {
      type: 'ongoing'
      data: SpeechData
    }
  | {
      type: 'available'
      data: SpeechData
    }

/**
 * @internal
 */
export interface EventHandlers {
  /**
   * Triggered when speech is detected.
   */
  onSpeechStart?: () => void

  /**
   * Triggered when silence is detected.
   */
  onSpeechEnd?: () => void

  /**
   * Triggered when a speech is finished and the audio data is available.
   *
   * @param data Contains the complete audio segment from the last silence to
   * current moment. It's useful for speech recognition or other
   * post-processing.
   */
  onSpeechAvailable?: (data: SpeechData) => void

  /**
   * Triggered periodically (once per second) while speech is ongoing.
   *
   * @param data Contains audio data from the last silence to current moment.
   * This is an incomplete speech segment, useful for real-time feedback.
   */
  onSpeechOngoing?: (data: SpeechData) => void
}

/**
 * An object representing speech data.
 */
export interface SpeechData {
  /** A timestamp in milliseconds */
  startTime: number
  /** A timestamp in milliseconds */
  endTime: number
  /** The audio data */
  audioData: Float32Array
  /** The sample rate of the audio data */
  sampleRate: number
}
