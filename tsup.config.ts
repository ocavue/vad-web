import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/vad-audio-worklet.ts'],
  format: ['esm'],
  clean: true,
  dts: true,
})
