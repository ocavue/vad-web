export async function isWebGPUSupported() {
  try {
    // @ts-expect-error: navigator.gpu is not typed
    if (!navigator.gpu) return false
    // @ts-expect-error: navigator.gpu is not typed
    const adapter = (await navigator.gpu.requestAdapter()) as unknown
    return !!adapter
  } catch {
    return false
  }
}
