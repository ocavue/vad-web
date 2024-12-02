import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
  },
  {
    entry: ['src/vad-audio-worklet.ts'],
    format: ['esm'],
    dts: true,
    minify: true,
  },
])
