import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/vad-web-worker.js'],
    format: ['esm'],
    experimentalDts: true,
    tsconfig: 'tsconfig.build.json',
  },
])
