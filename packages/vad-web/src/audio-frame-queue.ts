export class AudioFrameQueue {
  private frames: Float32Array[] = []
  private buffer: Float32Array
  private bufferPosition = 0

  constructor(private frameSize: number) {
    this.buffer = new Float32Array(frameSize)
  }

  enqueue(input: Float32Array): void {
    let inputPosition = 0

    while (inputPosition < input.length) {
      const inputRemaining = input.length - inputPosition
      const bufferRemaining = this.frameSize - this.bufferPosition
      const toCopy = Math.min(inputRemaining, bufferRemaining)

      this.buffer.set(
        input.subarray(inputPosition, inputPosition + toCopy),
        this.bufferPosition,
      )
      this.bufferPosition += toCopy
      inputPosition += toCopy

      if (this.bufferPosition >= this.frameSize) {
        this.frames.push(this.buffer)
        this.buffer = new Float32Array(this.frameSize)
        this.bufferPosition = 0
      }
    }
  }

  dequeue(): Float32Array | undefined {
    return this.frames.shift()
  }
}
