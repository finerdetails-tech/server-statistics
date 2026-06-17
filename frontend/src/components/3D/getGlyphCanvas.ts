import TinySDF from '@mapbox/tiny-sdf'
const CHARS = " .,-:;+*!?12360$W#@"

export function getGlyphCount () {
  return CHARS.length
}

let cachedCanvas: HTMLCanvasElement | null = null

export async function getGlyphCanvas (): Promise<HTMLCanvasElement> {
  if (cachedCanvas) return cachedCanvas

  await document.fonts.ready

  const glyphCount = getGlyphCount()

  const glyphSize = 128

  const canvas = document.createElement("canvas")
  canvas.width = glyphCount * glyphSize
  canvas.height = glyphSize

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get 2D context for glyph atlas canvas")

  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${glyphSize}px GoogleSansCode`

  const sdf = new TinySDF({
    buffer: 16,
    fontFamily: 'GoogleSansCode',
    fontSize: glyphSize
  })

  for (let i = 0; i < glyphCount; i++) {
    const {
      data, height, width
    } = sdf.draw(CHARS[i])
    // data is a Uint8ClampedArray of alpha/distance values
    const imageData = new ImageData(width, height)
    for (let j = 0; j < data.length; j++) {
      imageData.data[j * 4] = data[j] // R
      imageData.data[j * 4 + 1] = data[j] // G
      imageData.data[j * 4 + 2] = data[j] // B
      imageData.data[j * 4 + 3] = 255 // A
    }
    ctx.putImageData(imageData, i * glyphSize, 0)
  }

  cachedCanvas = canvas
  return canvas
}