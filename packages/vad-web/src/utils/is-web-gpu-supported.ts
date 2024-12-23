export async function isWebGPUSupported(): Promise<boolean> {
  try {
    // @ts-expect-error: navigator.gpu is not typed
    if (!navigator.gpu) return false
    // @ts-expect-error: navigator.gpu is not typed
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const adapter = (await navigator.gpu.requestAdapter()) as unknown
    return !!adapter
  } catch {
    return false
  }
}
