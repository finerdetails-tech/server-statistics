import * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import piModelUrl from '/public/models/pi_model.glb?url'
import { MAX_GLYPH_DARKNESS } from '../../const/colors'
import {
  getGlyphCanvas, getGlyphCount
} from './getGlyphCanvas'
import {
  getAsciiFragmentShader, vertexShader
} from './shaders'

type UVRect = [number, number, number, number]

class ThreeJSManager {
  readonly SEED_THROTTLE_MS = 150

  readonly DEFAULT_CELL_SIZE = 6

  readonly INITIAL_POSITION_Z = 150

  readonly INITIAL_POSITION_Y = 0

  readonly CELLS_VERTICALLY_VISIBLE_AT_MAX_ZOOM = 25

  readonly CELLS_HORIZONTALLY_VISIBLE_AT_MAX_ZOOM = 15

  camera = new THREE.OrthographicCamera()

  renderer: THREE.WebGLRenderer

  scene: THREE.Scene

  scrollElement: HTMLElement

  canvasElement: HTMLCanvasElement

  placeholderElement: HTMLElement

  model: THREE.Group

  renderTarget: THREE.WebGLRenderTarget

  asciiMaterial: THREE.ShaderMaterial

  scale: number = 1

  modelBox: THREE.Box3 | null = null

  lastSeedUpdate = 0

  postScene = new THREE.Scene()

  metricsCount: number

  maxCellSize = 32

  headerHeight: number

  postCamera = new THREE.OrthographicCamera(
    -1, 1, 1, -1, 0, 1
  )

  setMetricPadding: (padding: number) => void

  private isLandscape () {
    return window.innerWidth > window.innerHeight
  }

  private getModelAreaScrollPercent () {
    if (this.isLandscape()) {
      return Math.max(this.scrollElement.scrollLeft, 1) / Math.max(this.placeholderElement.clientWidth, 1)
    }
    return Math.max(this.scrollElement.scrollTop, 1) / Math.max(this.placeholderElement.clientHeight, 1)
  }


  private pixelsToWorldUnits (pixels: number): number {
    const frustumSize = 100
    const canvasHeight = this.renderer.domElement.height

    const pixelsPerWorldUnit = canvasHeight / frustumSize

    return pixels / pixelsPerWorldUnit
  }

  private getModelCenter (box?: THREE.Box3): THREE.Vector3 {
    const newBox = box ?? new THREE.Box3().setFromObject(this.model)
    return newBox.getCenter(new THREE.Vector3())
  }

  private getModelScale (viewportHeight: number, viewportWidth: number, box: THREE.Box3): number {
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const minViewportDim = Math.min(viewportWidth, viewportHeight)
    const modelDesiredSizeInWorldUnits = this.pixelsToWorldUnits(minViewportDim * 0.8)
    const scale = modelDesiredSizeInWorldUnits / maxDim
    return scale
  }

  private fitModelToViewport = (viewportHeight: number, viewportWidth: number) => {
    if (!this.modelBox) {
      this.modelBox = new THREE.Box3().setFromObject(this.model)
    }
    const newScale = this.getModelScale(viewportHeight, viewportWidth, this.modelBox)
    this.model.scale.set(newScale, newScale, newScale)

    const center = this.getModelCenter(this.modelBox)
    this.model.position.x = -center.x * newScale
    this.model.position.y = -center.y * newScale
    this.model.position.z = -center.z * newScale
    this.scale = newScale
  }

  /*
   *
   * MaxGlyphSizeLandscape = canvasHeight / GLYPHS_VISIBLE_AT_MAX_ZOOM_LANDSCAPE
   * MaxGlyphSizePortrait = canvasWidth / GLYPHS_VISIBLE_AT_MAX_ZOOM_PORTRAIT
   *
   * (Padding takes up one glyph)
   * Padding = this.isLandScape ? MaxGlyphSizeLandscape : MaxGlyphSizePortrait
   */

  private getCellSize () {
    const scaledCellSize = Math.round(this.DEFAULT_CELL_SIZE * (this.scale))
    const cellSize = Math.min(this.maxCellSize, scaledCellSize)
    return cellSize
  }

  private getBackgroundVectors (positions: UVRect[], count: number): THREE.Vector4[] {
    const vectors = positions.map((uv) => new THREE.Vector4(...uv))
    // Ensuring the array has consistent length to prevent crashing
    while (vectors.length < count) {
      vectors.push(new THREE.Vector4(0, 0, 0, 0))
    }
    return vectors
  }

  private findMetricBackgroundPositions (): UVRect[] {
    const metricBackgrounds = document.querySelectorAll('.metric-background')
    const uvCoords: UVRect[] = []
    metricBackgrounds.forEach((element) => {
      const rect = element.getBoundingClientRect()
      const canvasRect = this.canvasElement.getBoundingClientRect()
      const uv: UVRect = [
        (rect.left - canvasRect.left) / canvasRect.width,
        1.0 - (rect.bottom - canvasRect.top) / canvasRect.height,
        (rect.right - canvasRect.left) / canvasRect.width,
        1.0 - (rect.top - canvasRect.top) / canvasRect.height
      ]
      uvCoords.push(uv)
    })
    return uvCoords
  }

  private setMaxCellSize () {
    const newMaxCellSize = this.isLandscape()
      ? this.scrollElement.clientHeight / this.CELLS_VERTICALLY_VISIBLE_AT_MAX_ZOOM
      : this.scrollElement.clientWidth / this.CELLS_HORIZONTALLY_VISIBLE_AT_MAX_ZOOM
    this.setMetricPadding(newMaxCellSize)
    this.maxCellSize = newMaxCellSize
    console.log("Updated max cell size to:", newMaxCellSize)
  }

  private updateBackgroundUniforms (metricCount: number) {
    const metricBackgroundPositions = this.findMetricBackgroundPositions()
    this.asciiMaterial.uniforms.backgrounds.value = this.getBackgroundVectors(metricBackgroundPositions, metricCount)
  }

  resize = () => {
    const height = this.scrollElement.clientHeight
    const width = this.scrollElement.clientWidth

    const aspectRatio = width / height
    const frustumSize = 100
    this.camera.left = frustumSize * aspectRatio / -2
    this.camera.right = frustumSize * aspectRatio / 2
    this.camera.top = frustumSize / 2
    this.camera.bottom = frustumSize / -2
    this.camera.near = 0.1
    this.camera.far = 1000
    this.camera.updateProjectionMatrix()

    this.renderTarget.setSize(width, height)

    this.renderer.setSize(width, height, false)

    this.fitModelToViewport(height, width)
    this.setMaxCellSize()
    const cellSize = this.getCellSize()

    this.asciiMaterial.uniforms.cellSize.value.set(cellSize, cellSize)
    this.asciiMaterial.uniforms.resolution.value.set(width, height)
  }

  private animate = () => {
    const modelAreaScrollPercent = this.getModelAreaScrollPercent()
    const portViewRotation = 1.563

    const maxZoom = 200

    const steepness = 15
    const getZoomCurveAtPercentage = (percentage: number) => 1 / (1 + Math.exp(-steepness * (percentage - 0.75)))
    const getZoomAtPercentage = (percentage: number) => Math.min(1 + (getZoomCurveAtPercentage(percentage) * maxZoom), maxZoom)
    const getZoomedCellSizeAtPercentage = (percentage: number) => Math.round(this.getCellSize() * Math.min(getZoomAtPercentage(percentage), 10))
    const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

    const zoom = getZoomAtPercentage(modelAreaScrollPercent)
    const maxZoomedCellSize = Math.min(getZoomedCellSizeAtPercentage(1), this.maxCellSize)

    const restrictedRotation = Math.min(modelAreaScrollPercent * modelAreaScrollPercent * Math.PI * 2, portViewRotation)

    const zoomedCellSize = Math.max(getZoomedCellSizeAtPercentage(modelAreaScrollPercent), this.DEFAULT_CELL_SIZE)
    const glyphDarkness = Math.max(1 - ((zoomedCellSize - this.DEFAULT_CELL_SIZE) / (maxZoomedCellSize - this.DEFAULT_CELL_SIZE)), MAX_GLYPH_DARKNESS)
    const glyphRandomnessStartPercentage = 0.2
    const delayedRandomnessPercent = clamp01((modelAreaScrollPercent - glyphRandomnessStartPercentage) / (1 - glyphRandomnessStartPercentage))
    const delayedZoomedCellSize = Math.max(getZoomedCellSizeAtPercentage(delayedRandomnessPercent), this.DEFAULT_CELL_SIZE)
    const delayedGlyphDarkness = Math.max(
      1 - ((delayedZoomedCellSize - this.DEFAULT_CELL_SIZE) / (maxZoomedCellSize - this.DEFAULT_CELL_SIZE)),
      MAX_GLYPH_DARKNESS
    )
    const glyphRandomness = (1 - delayedGlyphDarkness) / (1 - MAX_GLYPH_DARKNESS)

    const finalCellSize = Math.min(zoomedCellSize, this.maxCellSize)

    if (this.model && this.asciiMaterial && this.scale && this.modelBox) {
      this.model.rotation.z = -restrictedRotation
      this.model.rotation.x = -restrictedRotation
      this.asciiMaterial.uniforms.randomness.value = 0

      const now = performance.now()
      if (now - this.lastSeedUpdate > this.SEED_THROTTLE_MS) {
        this.asciiMaterial.uniforms.randomSeed.value = modelAreaScrollPercent * 1000
        this.lastSeedUpdate = now
      }

      const center = this.getModelCenter()
      const modelBoxSizeX = this.modelBox.getSize(new THREE.Vector3()).x
      const xMovementFactor = 0.0225
      const scaledModelBoxSizeX = modelBoxSizeX * this.scale
      const maxCameraXmovement = scaledModelBoxSizeX * xMovementFactor
      const cameraXmovement = Math.min(getZoomCurveAtPercentage(modelAreaScrollPercent) * 100, maxCameraXmovement)

      this.camera.position.x = center.x + cameraXmovement
      this.camera.position.y = center.y + this.INITIAL_POSITION_Y
      this.camera.position.z = center.z + this.INITIAL_POSITION_Z
    }

    this.updateBackgroundUniforms(this.metricsCount)

    this.camera.zoom = zoom
    this.camera.updateProjectionMatrix()

    this.asciiMaterial.uniforms.cellSize.value.set(finalCellSize, finalCellSize)
    this.asciiMaterial.uniforms.randomness.value = glyphRandomness
    this.asciiMaterial.uniforms.glyphDarkness.value = glyphDarkness

    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.scene, this.camera)

    this.renderer.setRenderTarget(null)
    this.renderer.render(this.postScene, this.postCamera)
  }

  constructor (canvasElement: HTMLCanvasElement, placeholderElement: HTMLElement, scrollElement: HTMLElement, metricCount: number, newGlyphTexture: THREE.CanvasTexture, newScene: THREE.Scene, newModel: THREE.Group, headerHeight: number, setMetricPadding: (padding: number) => void) {
    newGlyphTexture.minFilter = THREE.LinearFilter
    newGlyphTexture.magFilter = THREE.LinearFilter
    newGlyphTexture.needsUpdate = true

    const newRenderer = new THREE.WebGLRenderer({ canvas: canvasElement })
    this.renderer = newRenderer

    this.headerHeight = headerHeight
    this.canvasElement = canvasElement
    this.placeholderElement = placeholderElement
    this.scrollElement = scrollElement
    this.metricsCount = metricCount
    this.scene = newScene
    this.model = newModel
    this.setMetricPadding = setMetricPadding


    const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
    directionalLight.position.set(5, 5, 5)

    this.scene.add(directionalLight)

    this.camera.position.z = this.INITIAL_POSITION_Z
    this.camera.position.y = this.INITIAL_POSITION_Y

    const metricBackgroundPositions = this.findMetricBackgroundPositions()

    const newRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight,
      {
        format: THREE.RGBAFormat,
        magFilter: THREE.LinearFilter,
        minFilter: THREE.LinearFilter
      })
    this.renderTarget = newRenderTarget

    const cellSize = this.getCellSize()

    const newAsciiMaterial = new THREE.ShaderMaterial({
      fragmentShader: getAsciiFragmentShader(metricCount),
      side: THREE.DoubleSide,
      uniforms: {
        backgrounds: { value: this.getBackgroundVectors(metricBackgroundPositions, metricCount) },
        cellSize: { value: new THREE.Vector2(cellSize, cellSize) },
        glyphAtlas: { value: newGlyphTexture },
        glyphCount: { value: getGlyphCount() },
        glyphDarkness: { value: 1 },
        randomness: { value: 0 },
        randomSeed: { value: 0 },
        resolution: { value: new THREE.Vector2(this.scrollElement.clientWidth, this.scrollElement.clientHeight) },
        sceneTexture: { value: newRenderTarget.texture }
      },
      vertexShader: vertexShader
    })
    this.asciiMaterial = newAsciiMaterial

    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      newAsciiMaterial
    )

    this.postScene.add(quad)

    window.addEventListener('resize', this.resize)
    this.resize()

    newRenderer.setAnimationLoop(this.animate)
  }

  static async create (canvasElement: HTMLCanvasElement, placeholderElement: HTMLElement, scrollElement: HTMLElement, metricCount: number, headerHeight: number, setMetricPadding: (padding: number) => void): Promise<ThreeJSManager> {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(
      'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/'
    )
    const newLoader = new GLTFLoader()
    newLoader.setDRACOLoader(dracoLoader)

    const modelMaterial = new THREE.MeshStandardMaterial({color: 0xFFFFFF})
    const newScene = new THREE.Scene()
    const newModel = new THREE.Group()
    await new Promise<void>((resolve) => {
      newLoader.load(piModelUrl, (gltf) => {

        gltf.scene.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            const mesh = new THREE.Mesh(child.geometry, modelMaterial)
            newModel.add(mesh)
          }
        })
        newScene.add(newModel)
        resolve()
      })
    })

    const newGlyphTexture = new THREE.CanvasTexture(await getGlyphCanvas())

    return new ThreeJSManager(canvasElement, placeholderElement, scrollElement, metricCount, newGlyphTexture, newScene, newModel, headerHeight, setMetricPadding)
  }

  cleanup () {
    window.removeEventListener('resize', this.resize)
    this.renderer.setAnimationLoop(null)
    this.renderer.dispose()
    this.renderTarget.dispose()
    this.asciiMaterial.dispose()
    this.renderer.domElement.remove()
  }
}

export default ThreeJSManager