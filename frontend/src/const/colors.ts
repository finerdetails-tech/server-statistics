export const MAX_GLYPH_DARKNESS = 0.1
const maxGlyphDarknessPercentage = `${Math.round(MAX_GLYPH_DARKNESS * 100)}%`

function parseHexColor (hex: string): [ number, number, number ] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [ r, g, b ]
}

export function rgbToVec3 (hex: string): string {
  const [ r, g, b ] = parseHexColor(hex)
  return `vec3(${r / 255}, ${g / 255}, ${b / 255})`
}

export function extractHSLComponents (hsl: string): {
  h: number,
  s: number,
  l: number
} {
  const matches = hsl.match(/\d+/g)
  return {
    h: matches && Number(matches[0]) / 360 || 0,
    l: matches && Number(matches[2]) / 100 || 0,
    s: matches && Number(matches[1]) / 100 || 0
  }
}

export const colors = {
  accent: '#c4e21a',
  background: '#0D0A0C',
  minGlyph: `hsl(350 5% ${maxGlyphDarknessPercentage})`,
  text: "#f9f9f9"
} as const

export function applyColorsAsCSSVariables () {
  const root = document.documentElement.style
  for (const [ key, value ] of Object.entries(colors)) {
    root.setProperty(`--color-${key}`, value)
  }
}