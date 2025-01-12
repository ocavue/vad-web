/**
 * Sample rate (i.e. samples per second) of the audio required by Silero VAD model
 */
export const SAMPLE_RATE = 16000

/**
 * Samples per millisecond
 */
export const SAMPLE_RATE_MS = SAMPLE_RATE / 1000

/**
 * Probabilities ABOVE this value are considered as SPEECH
 */
export const SPEECH_THRESHOLD = 0.3

/**
 * If current state is SPEECH, and the probability of the next state
 * is below this value, it is considered as NON-SPEECH.
 */
export const EXIT_THRESHOLD = 0.1

/**
 * The sample size of the audio frame to be processed by the VAD model
 *
 * https://github.com/snakers4/silero-vad/blob/3f9fffc26121fe0bb819370d50443389d0b7c8c6/examples/cpp/silero-vad-onnx.cpp#L345
 */
export const AUDIO_FRAME_SIZE = 512

/**
 * Maximum duration of a speech audio chunk
 */
export const MAX_AUDIO_DURATION_SECONDS = 30
export const MAX_AUDIO_DURATION_SAMPLES =
  MAX_AUDIO_DURATION_SECONDS * SAMPLE_RATE

/**
 * Pad the speech chunk with this amount each side
 */
export const SPEECH_PAD_SECONDS = 0.8
export const SPEECH_PAD_SAMPLES = SPEECH_PAD_SECONDS * SAMPLE_RATE

/**
 * Speech below this duration are discarded
 */
export const MIN_SPEECH_SECONDS = 0.2
export const MIN_SPEECH_SAMPLES = MIN_SPEECH_SECONDS * SAMPLE_RATE

/**
 * The interval at which the speechActive event is emitted
 */
export const SPEECH_ACTIVE_INTERVAL_MS = 500
