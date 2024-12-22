import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/processor.ts', 'src/read-audio.ts', 'src/record-audio.ts'],
    format: ['esm'],
    experimentalDts: true,
    tsconfig: 'tsconfig.build.json',
  },
])
