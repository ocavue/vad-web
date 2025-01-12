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
      type: 'speechStart'
    }
  | {
      type: 'speechEnd'
    }
  | {
      type: 'speechAvailable'
      data: SpeechData
    }
  | {
      type: 'speechActive'
      data: SpeechData
    }

/**
 * @internal
 */
export interface EventHandlers {
  /**
   * A function that will be called when a speech is detected.
   */
  onSpeechStart?: () => void

  /**
   * A function that will be called when a silence is detected.
   */
  onSpeechEnd?: () => void

  /**
   * A function that will be called when a speech is finished and the audio data
   * is available.
   */
  onSpeechAvailable?: (data: SpeechData) => void

  /**
   * A function that will be called when a speech is active. This is called
   * every 500ms during a speech. The audio data contains the speech from the
   * previous silence to the current time.
   */
  onSpeechActive?: (data: SpeechData) => void
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
