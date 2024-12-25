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
    case 'speechStart':
      handlers.onSpeechStart?.()
      break
    case 'speechEnd':
      handlers.onSpeechEnd?.()
      break
    case 'speechAvailable':
      handlers.onSpeechAvailable?.(message.data)
      break
  }
}
