import { sleep } from "./sleep"



export function waitForIdle(timeout = 100): Promise<void> {
    if (typeof requestIdleCallback !== 'undefined') {
        return new Promise<void>((resolve) => requestIdleCallback(() => resolve(), { timeout }))
    }

    return sleep(0)
}

