export const maxGlyphDarkness = 0.05

export const colors = {
  accent: '#bbff00',
  background: '#000000',
  maxGlyph: '#ffffff',
  minGlyph: `color-mix(in srgb, var(--color-maxGlyph) ${maxGlyphDarkness * 100}%, black)`

} as const

export function applyColorsAsCSSVariables () {
  const root = document.documentElement.style
  for (const [ key, value ] of Object.entries(colors)) {
    root.setProperty(`--color-${key}`, value)
  }
}