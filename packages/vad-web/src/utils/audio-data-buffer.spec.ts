import { describe, it, expect } from 'vitest'

import { AudioDataBuffer } from './audio-data-buffer'

describe('AudioDataBuffer', () => {
  it('should create buffer with given capacity', () => {
    const buffer = new AudioDataBuffer(1000)
    expect(buffer.capacity).toBe(1000)
  })

  it('should check capacity correctly', () => {
    const buffer = new AudioDataBuffer(100)
    expect(buffer.hasCapacity(50)).toBe(true)
    expect(buffer.hasCapacity(101)).toBe(false)
  })

  describe('write', () => {
    it('should write data within capacity', () => {
      const buffer = new AudioDataBuffer(100)
      const data = new Float32Array([1, 2, 3])
      buffer.write(data)
      expect(buffer.read()).toEqual(new Float32Array([1, 2, 3]))
    })

    it('should handle data larger than capacity', () => {
      const buffer = new AudioDataBuffer(3)
      const data = new Float32Array([1, 2, 3, 4, 5])
      buffer.write(data)
      expect(buffer.read()).toEqual(new Float32Array([3, 4, 5]))
    })

    it('should overwrite old data when full', () => {
      const buffer = new AudioDataBuffer(3)
      buffer.write(new Float32Array([1, 2, 3]))
      buffer.write(new Float32Array([4, 5]))
      expect(buffer.read()).toEqual(new Float32Array([3, 4, 5]))
    })
  })

  describe('read', () => {
    it('should read all samples when length not specified', () => {
      const buffer = new AudioDataBuffer(100)
      buffer.write(new Float32Array([1, 2, 3]))
      expect(buffer.read()).toEqual(new Float32Array([1, 2, 3]))
    })

    it('should handle wrapped reads', () => {
      const buffer = new AudioDataBuffer(4)
      buffer.write(new Float32Array([1, 2]))
      buffer.write(new Float32Array([3, 4]))
      buffer.write(new Float32Array([5]))

      expect(buffer.read()).toEqual(new Float32Array([2, 3, 4, 5]))

      expect(buffer.read(0, 0)).toEqual(new Float32Array([]))
      expect(buffer.read(0, 1)).toEqual(new Float32Array([2]))
      expect(buffer.read(0, 2)).toEqual(new Float32Array([2, 3]))
      expect(buffer.read(0, 3)).toEqual(new Float32Array([2, 3, 4]))
      expect(buffer.read(0, 4)).toEqual(new Float32Array([2, 3, 4, 5]))
      expect(buffer.read(0, 5)).toEqual(new Float32Array([2, 3, 4, 5]))

      expect(buffer.read(1, 1)).toEqual(new Float32Array([]))
      expect(buffer.read(1, 2)).toEqual(new Float32Array([3]))
      expect(buffer.read(1, 3)).toEqual(new Float32Array([3, 4]))
      expect(buffer.read(1, 4)).toEqual(new Float32Array([3, 4, 5]))
      expect(buffer.read(1, 5)).toEqual(new Float32Array([3, 4, 5]))

      expect(buffer.read(2, 2)).toEqual(new Float32Array([]))
      expect(buffer.read(2, 3)).toEqual(new Float32Array([4]))
      expect(buffer.read(2, 4)).toEqual(new Float32Array([4, 5]))
      expect(buffer.read(2, 5)).toEqual(new Float32Array([4, 5]))
    })

    it('should return empty array if start >= end', () => {
      const buffer = new AudioDataBuffer(100)
      buffer.write(new Float32Array([1, 2, 3, 4, 5]))
      expect(buffer.read(3, 2)).toEqual(new Float32Array(0))
    })

    it('should handle start and end beyond buffer size', () => {
      const buffer = new AudioDataBuffer(100)
      buffer.write(new Float32Array([1, 2, 3]))
      expect(buffer.read(0, 5)).toEqual(new Float32Array([1, 2, 3]))
    })

    it('should maintain backward compatibility when no params provided', () => {
      const buffer = new AudioDataBuffer(100)
      buffer.write(new Float32Array([1, 2, 3]))
      expect(buffer.read()).toEqual(new Float32Array([1, 2, 3]))
    })
  })
})
