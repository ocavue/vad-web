export class AudioFrameQueue {
  private buffer: Float32Array
  private writePosition = 0
  private frames: Float32Array[] = []

  constructor(private frameSize: number) {
    // Pre-allocate a reasonably sized buffer
    this.buffer = new Float32Array(frameSize * 2)
  }

  enqueue(input: Float32Array): void {
    // Resize buffer if needed
    if (this.writePosition + input.length > this.buffer.length) {
      const newBuffer = new Float32Array(
        Math.max(this.buffer.length * 2, this.writePosition + input.length),
      )
      newBuffer.set(this.buffer)
      this.buffer = newBuffer
    }

    this.buffer.set(input, this.writePosition)
    this.writePosition += input.length
  }

  dequeue(): Float32Array | undefined {
    if (this.writePosition >= this.frameSize) {
      let readPosition = 0
      while (this.writePosition - readPosition >= this.frameSize) {
        const frame = new Float32Array(this.frameSize)
        frame.set(
          this.buffer.subarray(readPosition, readPosition + this.frameSize),
        )
        this.frames.push(frame)
        readPosition += this.frameSize
      }

      this.buffer.copyWithin(0, readPosition, this.writePosition)
      this.writePosition -= readPosition
    }
    return this.frames.shift()
  }
}
