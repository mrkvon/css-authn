export const toBase64 = (str: string): string => {
  if (globalThis.Buffer) return globalThis.Buffer.from(str).toString('base64')
  if (globalThis.btoa) return globalThis.btoa(str)
  throw new Error(
    'Base64 encoding in css-authn for your environment is not supported. Please open an issue!',
  )
}
