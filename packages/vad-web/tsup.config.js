import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    experimentalDts: true,
    tsconfig: 'tsconfig.build.json',
  },
  {
    entry: ['src/vad-audio-worklet.ts'],
    format: ['esm'],
    minify: true,
  },
])
