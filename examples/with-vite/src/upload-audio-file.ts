export async function uploadAudioFile(): Promise<string | null> {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'audio/*'

  const file = await new Promise<File | undefined>((resolve) => {
    input.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      resolve(file)
    })
    input.click()
  })

  if (!file) return null

  return URL.createObjectURL(file)
}
