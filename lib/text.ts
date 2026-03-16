export function decodePossibleMojibake(value: string): string {
  if (!value) return value
  if (!/[ÃØÙÂâð]/.test(value)) return value

  try {
    const bytes = Uint8Array.from(
      Array.from(value).map((char) => char.charCodeAt(0) & 0xff),
    )
    const decoded = new TextDecoder("utf-8").decode(bytes)
    return decoded.includes("\ufffd") ? value : decoded
  } catch {
    return value
  }
}
