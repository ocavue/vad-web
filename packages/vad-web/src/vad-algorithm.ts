import FFT from 'fft.js'

/**
 * Voice Activity Detection (VAD) algorithm.
 *
 * Based on:
 * Moattar, Mohammad & Homayoonpoor, Mahdi. (2010).
 * A simple but efficient real-time voice activity detection algorithm.
 * European Signal Processing Conference.
 * @see https://www.researchgate.net/publication/255667085_A_simple_but_efficient_real-time_voice_activity_detection_algorithm
 */
export class VADAlgorithm {
  // Thresholds for VAD detection
  private prim_thresh_e = 40
  private prim_thresh_f_hz = 185
  private prim_thresh_sfm = 5
  private frame_size_ms = 10

  // Frame counters
  private is_speech_frame_counter = 0
  private is_silent_frame_counter = 0

  // Minimum values
  private e_min: number | null = null
  private f_min: number | null = null
  private sfm_min: number | null = null

  // Audio processing parameters
  private fft: FFT
  readonly frame_size: number
  private frame_counter = 0

  constructor(
    private sample_rate: number,
    private fft_size = 128,
  ) {
    this.fft = new FFT(this.fft_size)
    this.frame_size = (this.sample_rate * this.frame_size_ms) / 1000
  }

  public process(time_data: Float32Array): {
    is_speech: boolean
    is_speech_frame_counter: number
    is_silent_frame_counter: number
  } {
    const frequency_data = this.getSpectrum(Array.from(time_data))
    frequency_data[0] = 0 // Set DC offset to zero

    this.frame_counter++

    // Calculate energy
    let energy = 0
    for (const time_datum of time_data) {
      energy += time_datum * time_datum
    }

    // Get frequency with highest amplitude and spectral flatness
    let f_max = 0
    let f_max_index = 0
    let sfm_sum_geo = 0
    let sfm_sum_ari = 0

    for (const [i, frequency_datum] of frequency_data.entries()) {
      if (frequency_datum > f_max) {
        f_max = frequency_datum
        f_max_index = i
      }

      const f_geo = frequency_datum > 0 ? frequency_datum : 1
      sfm_sum_geo += Math.log(f_geo)
      sfm_sum_ari += f_geo
    }

    const f_max_hz = (f_max_index * this.sample_rate) / this.fft_size
    const sfm =
      -10 *
      Math.log10(
        Math.exp(sfm_sum_geo / frequency_data.length) /
          (sfm_sum_ari / frequency_data.length),
      )
    const sfm_safe = Number.isFinite(sfm) ? sfm : 0

    // Set initial minimum values from first 30 frames
    if (this.e_min === null || this.frame_counter < 30) {
      this.e_min =
        this.e_min !== null && this.e_min > energy && energy !== 0
          ? this.e_min
          : energy
      this.f_min =
        this.f_min !== null && this.f_min > f_max_hz ? f_max_hz : this.f_min
      this.sfm_min =
        this.sfm_min !== null && this.sfm_min > sfm_safe
          ? sfm_safe
          : this.sfm_min
    }

    // VAD decision
    let count = 0
    const current_thresh_e = this.prim_thresh_e * Math.log10(this.e_min || 1)

    if (energy - (this.e_min || 0) >= current_thresh_e) count++
    if (f_max > 1 && f_max_hz - (this.f_min || 0) >= this.prim_thresh_f_hz)
      count++
    if (sfm_safe > 0 && sfm_safe - (this.sfm_min || 0) <= this.prim_thresh_sfm)
      count++

    const is_speech = count > 1

    if (is_speech) {
      this.is_speech_frame_counter++
      this.is_silent_frame_counter = 0
    } else {
      this.is_silent_frame_counter++
      this.e_min =
        (this.is_silent_frame_counter * (this.e_min || 0) + energy) /
        (this.is_silent_frame_counter + 1)
      this.is_speech_frame_counter = 0
    }

    return {
      is_speech,
      is_speech_frame_counter: this.is_speech_frame_counter,
      is_silent_frame_counter: this.is_silent_frame_counter,
    }
  }

  private getSpectrum(data: number[]): number[] {
    while (data.length < this.fft_size) {
      data.push(0)
    }

    const input = this.fft.toComplexArray(data, undefined) as number[]
    const output = this.fft.createComplexArray() as number[]
    this.fft.realTransform(output, input)

    const spectrum = new Array<number>(output.length >>> 1)
    for (let i = 0; i < output.length; i += 2) {
      const real = output[i]
      const imag = output[i + 1]
      spectrum[i >>> 1] = Math.sqrt(real * real + imag * imag)
    }

    return spectrum.slice(0, spectrum.length / 2 - 1)
  }
}
