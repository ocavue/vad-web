import { VADPipeline } from './vad-pipeline'

export interface SplittingOptions {
  sampleRate: number

  audioData: Float32Array
}

/**
 * Splits the given audio data into chunks of speech audio data.
 */
export function splitAudio(options: SplittingOptions): Float32Array[] {
  const { sampleRate, audioData } = options

  const pipeline = new VADPipeline({
    sampleRate,
  })

  const results = pipeline.process(audioData)

  return results
    .map((result) => {
      if (result.type === 'audioData') {
        return result.audioBuffer
      }
    })
    .filter((buffer) => !!buffer)
}
