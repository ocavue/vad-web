import { describe, it, expect, beforeEach } from 'vitest'

import { AudioFrameQueue } from './audio-frame-queue'

describe('AudioFrameQueue', () => {
  let queue: AudioFrameQueue

  beforeEach(() => {
    queue = new AudioFrameQueue(4) // Using small frame size for easier testing
  })

  it('should handle exact frame size inputs', () => {
    const frame = new Float32Array([1, 2, 3, 4])
    queue.enqueue(frame)

    const result = queue.dequeue()
    expect(result).toEqual(frame)
  })

  it('should buffer partial frames', () => {
    queue.enqueue(new Float32Array([1, 2]))
    expect(queue.dequeue()).toBeUndefined()

    queue.enqueue(new Float32Array([3, 4]))
    const result = queue.dequeue()
    expect(result).toEqual(new Float32Array([1, 2, 3, 4]))
  })

  it('should handle inputs larger than frame size', () => {
    queue.enqueue(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))

    const frame1 = queue.dequeue()
    const frame2 = queue.dequeue()
    const frame3 = queue.dequeue()

    expect(frame1).toEqual(new Float32Array([1, 2, 3, 4]))
    expect(frame2).toEqual(new Float32Array([5, 6, 7, 8]))
    expect(frame3).toBeUndefined()
  })

  it('should clear queue and buffer', () => {
    queue.enqueue(new Float32Array([1, 2]))
    queue.enqueue(new Float32Array([3, 4, 5, 6]))

    queue.clear()

    expect(queue.dequeue()).toBeUndefined()
    queue.enqueue(new Float32Array([1, 2]))
    expect(queue.dequeue()).toBeUndefined() // Buffer was reset
  })

  it('should handle multiple partial pushes', () => {
    queue.enqueue(new Float32Array([1]))
    queue.enqueue(new Float32Array([2]))
    queue.enqueue(new Float32Array([3]))
    queue.enqueue(new Float32Array([4]))

    const result = queue.dequeue()
    expect(result).toEqual(new Float32Array([1, 2, 3, 4]))
  })

  it('should handle empty inputs', () => {
    queue.enqueue(new Float32Array([]))
    expect(queue.dequeue()).toBeUndefined()
  })
})
