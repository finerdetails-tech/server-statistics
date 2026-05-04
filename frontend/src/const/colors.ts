export const maxGlyphDarkness = 0.1

function darken (hex: string, factor: number): string {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor)
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor)
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor)
  return `#${[ r, g, b ].map(c => Math.min(c, 255).toString(16)
    .padStart(2, '0')).join('')}`
}

const maxGlyph = '#ffffff'
export const colors = {
  accent: '#bbff00',
  background: '#000000',
  maxGlyph: maxGlyph,
  minGlyph: darken(maxGlyph, maxGlyphDarkness)

} as const

export function applyColorsAsCSSVariables () {
  const root = document.documentElement.style
  for (const [ key, value ] of Object.entries(colors)) {
    root.setProperty(`--color-${key}`, value)
  }
}