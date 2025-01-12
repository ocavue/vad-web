import type { EventHandlers, WorkerToMainMessage } from './types'

export function dispatchEvents(
  messages: WorkerToMainMessage[],
  handlers: EventHandlers,
) {
  for (const message of messages) {
    dispatchEvent(message, handlers)
  }
}

function dispatchEvent(message: WorkerToMainMessage, handlers: EventHandlers) {
  switch (message.type) {
    case 'start':
      handlers.onSpeechStart?.()
      break
    case 'end':
      handlers.onSpeechEnd?.()
      break
    case 'ongoing':
      handlers.onSpeechOngoing?.(message.data)
      break
    case 'available':
      handlers.onSpeechAvailable?.(message.data)
      break
    default:
      message satisfies never
  }
}
