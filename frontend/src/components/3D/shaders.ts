export const fragmentShader = `
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

  void main() {
    // Which ASCII cell are we in?
    vec2 cellCoord = floor(gl_FragCoord.xy / cellSize);

    // Center of that cell
    vec2 cellCenter = (cellCoord + 0.5) * cellSize;

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
    vec2 localUV = fract(gl_FragCoord.xy / cellSize);

    // Compute glyph atlas UVs
    float glyphX = mod(index, glyphCount);
    float glyphY = 0.0; // Single row atlas
    vec2 glyphUV = vec2((glyphX + localUV.x) / glyphCount, localUV.y);

    vec4 glyph = texture(glyphAtlas, glyphUV);
    gl_FragColor = vec4(glyph.rgb * glyphDarkness, glyph.a);
  }
`

export const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`