import {
  AutoModel,
  PretrainedConfig,
  Tensor,
  type TypedArray,
} from '@huggingface/transformers'
import cache from 'just-once'
import pLimit from 'p-limit'

import { EXIT_THRESHOLD, SAMPLE_RATE, SPEECH_THRESHOLD } from './constants'

const getModel = cache(async () => {
  const silero_vad = await AutoModel.from_pretrained(
    'onnx-community/silero-vad',
    {
      config: new PretrainedConfig({ model_type: 'custom' }),
      dtype: 'fp32', // Full-precision
    },
  )

  return silero_vad as (options: {
    input: Tensor
    sr: Tensor
    state: Tensor
  }) => Promise<{ stateN: Tensor; output: Tensor }>
})

const limit = pLimit(1)

export class SileroVAD {
  private sr: Tensor
  private state: Tensor

  constructor() {
    this.sr = new Tensor('int64', [SAMPLE_RATE], [])
    this.state = new Tensor(
      'float32',
      new Float32Array(2 * 1 * 128),
      [2, 1, 128],
    )
  }

  async process(
    audioFrame: Float32Array,
    wasSpeech: boolean,
  ): Promise<boolean> {
    const input = new Tensor('float32', audioFrame, [1, audioFrame.length])

    const { stateN, output } = await limit(async () => {
      const model = await getModel()
      return model({ input, sr: this.sr, state: this.state })
    })

    this.state = stateN

    const speechScore = (output.data as TypedArray)[0]

    // Use heuristics to determine if the buffer is speech or not
    return (
      // Case 1: We are above the threshold (definitely speech)
      speechScore > SPEECH_THRESHOLD ||
      // Case 2: We are in the process of recording, and the probability is above the negative (exit) threshold
      (wasSpeech && speechScore >= EXIT_THRESHOLD)
    )
  }
}
