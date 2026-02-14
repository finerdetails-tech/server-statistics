function getGlyphCanvas () {
  const chars = "  .,-=+:;cba!?123456789$W#@"
  const glyphCount = chars.length

  const glyphSize = 32
  const columns = glyphCount
  const rows = 1

  const canvas = document.createElement("canvas")
  canvas.width = columns * glyphSize
  canvas.height = rows * glyphSize

  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = "white"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${glyphSize * 0.8}px monospace`

  for (let i = 0; i < glyphCount; i++) {
    const x = i * glyphSize + glyphSize / 2
    const y = glyphSize / 2
    ctx.fillText(chars[i], x, y)
  }

  return canvas
}

export default getGlyphCanvas