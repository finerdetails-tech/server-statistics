const CHARS = " .,-:;+*!?12360$W#@"

export function getGlyphCount () {
  return CHARS.length
}

let cachedCanvas: HTMLCanvasElement | null = null

export async function getGlyphCanvas (): Promise<HTMLCanvasElement> {
  if (cachedCanvas) return cachedCanvas

  const font = new FontFace(
    "GoogleSansCode",
    'url("/fonts/GoogleSansCode-VariableFont_wght.ttf")'
  )
  await font.load()
  document.fonts.add(font)

  const glyphCount = getGlyphCount()

  const glyphSize = 128

  const canvas = document.createElement("canvas")
  canvas.width = glyphCount * glyphSize
  canvas.height = glyphSize

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get 2D context for glyph atlas canvas")

  ctx.fillStyle = "transparent"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = "white"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${glyphSize}px GoogleSansCode`

  for (let i = 0; i < glyphCount; i++) {
    ctx.fillText(CHARS[i], i * glyphSize + glyphSize / 2, glyphSize / 2)
  }

  cachedCanvas = canvas
  return canvas
}