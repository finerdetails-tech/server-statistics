import {
  colors, extractHSLComponents, rgbToVec3
} from "../../const/colors"

const {minGlyph} = colors

const {
  h: MINGLYPH_HUE, s: MINGLYPH_SATURATION
} = extractHSLComponents(minGlyph)

export const getAsciiFragmentShader = (MAX_BACKGROUNDS: number) => (`
  const int MAX_BACKGROUNDS = ${MAX_BACKGROUNDS};
  const float MINGLYPH_HUE = ${MINGLYPH_HUE};
  const float MINGLYPH_SATURATION = ${MINGLYPH_SATURATION};
  const vec3 BACKGROUND = ${rgbToVec3(colors.background)};
  uniform vec4 backgrounds[MAX_BACKGROUNDS]; // (u0, v0, u1, v1)
  uniform sampler2D sceneTexture;
  uniform sampler2D glyphAtlas;
  uniform vec2 resolution;
  uniform vec2 cellSize;
  uniform float glyphCount;
  uniform float glyphDarkness;
  uniform float randomness;
  uniform float randomSeed; // Updating glyphs on scroll

  float random(vec2 seed) {
    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void switchColors(vec4 backgrounds[MAX_BACKGROUNDS], int MAX_BACKGROUNDS, vec2 resolution, vec3 glyphColor, float coverage, inout vec3 color) {
    bool inside = false;
    vec2 screenUV = gl_FragCoord.xy / resolution;

    for (int i = 0; i < MAX_BACKGROUNDS; i++) {
      vec4 r = backgrounds[i];
      if (screenUV.x > r.x && screenUV.x < r.z && screenUV.y > r.y && screenUV.y < r.w) {
        inside = true;
      }
    }

    if (inside) {
      // Swap glyph and background: glyph cells take the background color while
      // the surrounding background takes the (dynamic) glyph color.
      color = mix(glyphColor, BACKGROUND, coverage);
    }
  }

  vec3 hsl2rgb(vec3 hsl) {
    // hsl.x = hue in [0,1], hsl.y = saturation in [0,1], hsl.z = lightness in [0,1]
    vec3 rgb = clamp(abs(mod(hsl.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    float c = (1.0 - abs(2.0 * hsl.z - 1.0)) * hsl.y;
    return (rgb - 0.5) * c + hsl.z;
  }

  void main() {
    // Offset grid so remainder is split evenly on both sides
    vec2 gridOffset = mod(resolution, cellSize) * 29.8;
    vec2 offsetCoord = gl_FragCoord.xy - gridOffset;

    // Which ASCII cell are we in?
    vec2 cellCoord = floor(offsetCoord / cellSize);

    // Center of that cell
    vec2 cellCenter = (cellCoord + 0.5) * cellSize + gridOffset;

    // Snap sceneUV to the nearest texel to avoid rounding artifacts
    vec2 texelSize = 1.0 / resolution;
    vec2 sceneUV = floor(cellCenter / texelSize) * texelSize / resolution;

    // Sample the rasterized scene
    vec3 color = texture(sceneTexture, sceneUV).rgb;

    // Convert to luminance
    float luma = dot(color, vec3(0.299, 0.587, 0.114));

    // Pick a glyph
    float index = min(floor(luma * glyphCount), glyphCount - 1.0);

    // Apply randomness
    if (glyphCount > 1.0 && randomness > 0.0 && index > 0.0) {
      if (random(cellCoord + vec2(randomSeed)) < randomness) {
        float pick = step(0.5, random(cellCoord + vec2(19.19, 73.73) + vec2(randomSeed)));
        index = mix(10.0, 14.0, pick);
      }
    }

    // Position inside the cell
    vec2 localUV = fract(offsetCoord / cellSize);

    // Compute glyph atlas UVs
    float glyphX = mod(index, glyphCount);
    float glyphY = 0.0; // Single row atlas
    vec2 glyphUV = vec2((glyphX + localUV.x) / glyphCount, localUV.y);

    // SDF: reconstruct crisp edges at any scale
    float dist = texture(glyphAtlas, glyphUV).r;
    float edgeWidth = fwidth(dist) * 0.5;
    float alpha = smoothstep(0.5 - edgeWidth, 0.5 + edgeWidth, dist);
    vec3 glyph = vec3(alpha);

    // Glyph coverage from the SDF (0 = empty cell, 1 = solid glyph)
    float coverage = glyph.r;

    // Full-strength glyph color. Its lightness tracks glyphDarkness, so it is
    // computed here every frame instead of being hardcoded.
    vec3 glyphColor = hsl2rgb(vec3(MINGLYPH_HUE, MINGLYPH_SATURATION, glyphDarkness));

    // Default: glyph painted over the background color.
    vec3 outColor = mix(BACKGROUND, glyphColor, coverage);

    // Inside the marked regions this swaps the glyph and background colors.
    switchColors(backgrounds, MAX_BACKGROUNDS, resolution, glyphColor, coverage, outColor);

    gl_FragColor = vec4(outColor, 1.0);
  }
`)

export const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`