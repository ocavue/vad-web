export class AudioFrameQueue {
  private buffer: number[] = []
  private frames: Float32Array[] = []

  constructor(private frameSize: number) {}

  enqueue(input: Float32Array): void {
    this.buffer.push(...input)
  }

  dequeue(): Float32Array | undefined {
    while (this.buffer.length >= this.frameSize) {
      const frame = new Float32Array(this.frameSize)
      for (let i = 0; i < this.frameSize; i++) {
        frame[i] = this.buffer[i]
      }
      this.buffer = this.buffer.slice(this.frameSize)
      this.frames.push(frame)
    }

    return this.frames.shift()
  }
}
