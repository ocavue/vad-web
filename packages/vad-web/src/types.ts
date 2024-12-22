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
 * A event fired when a speech starts.
 */
export interface VADSpeechEvent {
  type: 'speech'
}

/**
 * A event fired when a speech ends.
 */
export interface VADSilenceEvent {
  type: 'silence'
}

/**
 * A event fired when speech audio data is available.
 */
export interface VADAudioEvent {
  type: 'audio'
  /** A timestamp in milliseconds */
  startTime: number
  /** A timestamp in milliseconds */
  endTime: number
  /** The audio data */
  audioData: Float32Array
  /** The sample rate of the audio data */
  sampleRate: number
}

export type VADEvent = VADSpeechEvent | VADSilenceEvent | VADAudioEvent
