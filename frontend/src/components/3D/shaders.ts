export const getAsciiFragmentShader = (MAX_BACKGROUNDS: number) => (`
  const int MAX_BACKGROUNDS = ${MAX_BACKGROUNDS};
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

  void switchColors(vec4 backgrounds[MAX_BACKGROUNDS], int MAX_BACKGROUNDS, vec2 resolution, inout vec3 color) {
    bool inside = false;

    for (int i = 0; i < MAX_BACKGROUNDS; i++) {
      vec4 r = backgrounds[i];
      vec2 screenUV = gl_FragCoord.xy / resolution;
      if (screenUV.x > r.x && screenUV.x < r.z && screenUV.y > r.y && screenUV.y < r.w) {
        inside = true;
      }
    }

    if (inside) {
      color = vec3(glyphDarkness) - color;
    }
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

    // SDF: reconstruct crisp edges at any scale
    float dist = texture(glyphAtlas, glyphUV).r;
    float edgeWidth = fwidth(dist) * 0.5;
    float alpha = smoothstep(0.5 - edgeWidth, 0.5 + edgeWidth, dist);
    vec3 glyph = vec3(alpha);

    vec3 pixelColor = glyph.rgb * glyphDarkness;
    switchColors(backgrounds, MAX_BACKGROUNDS, resolution, pixelColor);
    gl_FragColor = vec4(pixelColor, 1.0 - pixelColor);
  }
`)

export const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`