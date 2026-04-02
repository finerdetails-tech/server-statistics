const CHARS = " .,-:;+*!?12360$W#@"

export function getGlyphCount () {
  return CHARS.length
}

export async function getGlyphCanvas () {
  const font = new FontFace(
    "GoogleSansCode",
    'url("/fonts/GoogleSansCode-VariableFont_wght.ttf")'
  )
  await font.load()
  document.fonts.add(font)

  const glyphCount = getGlyphCount()

  const glyphSize = 128
  const columns = glyphCount
  const rows = 1

  const canvas = document.createElement("canvas")
  canvas.width = columns * glyphSize
  canvas.height = rows * glyphSize

  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "transparent"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = "white"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${glyphSize}px GoogleSansCode`

  for (let i = 0; i < glyphCount; i++) {
    const x = i * glyphSize + glyphSize / 2
    const y = glyphSize / 2
    ctx.fillText(CHARS[i], x, y)
  }

  return canvas
}