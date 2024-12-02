import { basic, markdown } from '@ocavue/eslint-config'

export default [
  ...basic(),
  ...markdown(),
  {
    ignores: ['**/public/vad-audio-worklet.js'],
  },
]
