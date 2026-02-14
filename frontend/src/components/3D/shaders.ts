export const fragmentShader = `
  uniform sampler2D sceneTexture;
  uniform sampler2D glyphAtlas;
  uniform vec2 resolution;
  uniform vec2 cellSize;
  uniform float glyphCount;

  void main() {
    // Which ASCII cell are we in?
    vec2 cellCoord = floor(gl_FragCoord.xy / cellSize);

    // Center of that cell
    vec2 cellCenter = (cellCoord + 0.5) * cellSize;
    vec2 sceneUV = cellCenter / resolution;

    // Sample the rasterized scene
    vec3 color = texture(sceneTexture, sceneUV).rgb;

    // Convert to luminance
    float luma = dot(color, vec3(0.299, 0.587, 0.114));

    // Pick a glyph
    float index = floor(luma * glyphCount);

    // Position inside the cell
    vec2 localUV = fract(gl_FragCoord.xy / cellSize);

    // Compute glyph atlas UVs
    float glyphX = mod(index, glyphCount);
    float glyphY = 0.0; // Single row atlas
    vec2 glyphUV = vec2((glyphX + localUV.x) / glyphCount, localUV.y);

    gl_FragColor = texture(glyphAtlas, glyphUV);
  }
`

export const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`