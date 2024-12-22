export class AudioDataBuffer {
  private buffer: Float32Array
  private size = 0
  private writeIndex = 0

  /**
   * Creates an AudioDataBuffer with a given capacity.
   * @param capacity The maximum number of samples the buffer can hold.
   */
  constructor(readonly capacity: number) {
    this.buffer = new Float32Array(capacity)
  }

  /**
   * Checks if the buffer has enough space to store `len` additional samples
   * without discarding existing ones.
   * @param len The number of samples to check.
   * @returns True if `len` samples can fit, false otherwise.
   */
  hasCapacity(len: number): boolean {
    return this.size + len <= this.capacity
  }

  /**
   * Writes audio data to the buffer. If the data size exceeds the buffer's capacity,
   * older samples will be discarded.
   * @param audioData The audio samples to write.
   */
  write(audioData: Float32Array): void {
    const len = audioData.length

    if (len > this.capacity) {
      // If the data is larger than the total capacity,
      // only the last `capacity` samples are kept.
      const startIdx = len - this.capacity
      this.buffer.set(audioData.subarray(startIdx))
      this.size = this.capacity
      this.writeIndex = 0
      return
    }

    if (this.writeIndex + len <= this.capacity) {
      // There is enough space at the end of the buffer.
      this.buffer.set(audioData, this.writeIndex)
      this.writeIndex = (this.writeIndex + len) % this.capacity
    } else {
      // The data wraps around the end of the buffer.
      const firstPartLength = this.capacity - this.writeIndex
      this.buffer.set(audioData.subarray(0, firstPartLength), this.writeIndex)
      this.buffer.set(audioData.subarray(firstPartLength), 0)
      this.writeIndex = len - firstPartLength
    }

    this.size = Math.min(this.capacity, this.size + len)
  }

  /**
   * Reads samples from the buffer within the specified range.
   *
   * @param start Starting position from the most recent sample (0 is most recent)
   * @param end Ending position from the most recent sample (exclusive)
   * @returns A Float32Array containing the requested samples.
   */
  read(start = 0, end?: number): Float32Array {
    end = Math.min(end ?? this.size, this.size)
    start = Math.min(start, end)
    const readLen = end - start

    const result = new Float32Array(readLen)


    const readIndex =
      (this.writeIndex - this.size + start + this.capacity) % this.capacity


    if (readIndex + readLen <= this.capacity) {
      // Data is contiguous
      result.set(this.buffer.subarray(readIndex, readIndex + readLen))
    } else {
      // Data wraps around buffer end
      const firstPartLen = this.capacity - readIndex
      const secondPartLen = readLen - firstPartLen
      result.set(this.buffer.subarray(readIndex, this.capacity))
      result.set(this.buffer.subarray(0, secondPartLen), firstPartLen)
    }

    return result
  }

  /**
   * Clears the buffer.
   */
  clear(): void {
    this.size = 0
    this.writeIndex = 0
  }


  get length(): number {
    return this.size
  }
}
