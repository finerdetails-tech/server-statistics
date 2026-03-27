import * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import piModelUrl from '/public/models/pi_model.glb?url'
import {
  getGlyphCanvas, getGlyphCount
} from './getGlyphCanvas'
import {
  fragmentShader, vertexShader
} from './shaders'

let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let scrollElement: HTMLElement | null = null
let placeholderElement: HTMLElement | null = null
let isLandscape = false
let model: THREE.Group | null = null
let renderTarget: THREE.WebGLRenderTarget | null = null
let asciiMaterial: THREE.ShaderMaterial | null = null
let scale: number | null = null
let modelBox: THREE.Box3 | null = null

const defaultCellSize = 6
const maxCellSize = 32
const postScene = new THREE.Scene()

const postCamera = new THREE.OrthographicCamera(
  -1, 1, 1, -1, 0, 1
)

const INITIAL_POSITION_Z = 150
const INITIAL_POSITION_Y = 0

const getModelAreaScrollPercent = () => {
  if (isLandscape) {
    return scrollElement.scrollLeft / placeholderElement.clientWidth
  }
  return scrollElement.scrollTop / placeholderElement.clientHeight
}

export function setScrollElements (pElement: HTMLElement, sElement: HTMLElement, landscape: boolean) {
  placeholderElement = pElement
  scrollElement = sElement
  isLandscape = landscape
}

export function setPlaceholderElement (element: HTMLElement) {
  placeholderElement = element
}

function getCellSize () {
  const scaledCellSize = Math.round(defaultCellSize * scale)
  const cellSize = Math.min(maxCellSize, scaledCellSize)
  return cellSize
}

export function resize (viewportHeight: number, viewportWidth: number) {
  if (camera) {
    const aspectRatio = viewportWidth / viewportHeight
    const frustumSize = 100
    camera.left = frustumSize * aspectRatio / -2
    camera.right = frustumSize * aspectRatio / 2
    camera.top = frustumSize / 2
    camera.bottom = frustumSize / -2
    camera.near = 0.1
    camera.far = 1000
    camera.updateProjectionMatrix()
  }

  if (renderTarget) {
    renderTarget.setSize(viewportWidth, viewportHeight)
  }

  if (renderer) {
    renderer.setSize(viewportWidth, viewportHeight, false)
  }

  if (model) {
    fitModelToViewport(model, viewportHeight, viewportWidth)

    if (asciiMaterial) {
      const cellSize = getCellSize()

      asciiMaterial.uniforms.cellSize.value.set(cellSize, cellSize)

      asciiMaterial.uniforms.resolution.value.set(viewportWidth, viewportHeight)
    }
  }
}

function pixelsToWorldUnits (pixels: number): number {
  if (!camera || !renderer) {
    return 0
  }

  const frustumSize = 100
  const canvasHeight = renderer.domElement.height

  const pixelsPerWorldUnit = (canvasHeight / frustumSize) * camera.zoom

  return pixels / pixelsPerWorldUnit
}

function getModelCenter (box?: THREE.Box3): THREE.Vector3 {
  if (!model) return new THREE.Vector3()
  const newBox = box ?? new THREE.Box3().setFromObject(model)
  return newBox.getCenter(new THREE.Vector3())
}

function getModelScale (viewportHeight: number, viewportWidth: number, box: THREE.Box3): number {
  if (!model) {
    return 1
  }
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const minViewportDim = Math.min(viewportWidth, viewportHeight)
  const modelDesiredSizeInWorldUnits = pixelsToWorldUnits(minViewportDim * 0.8)
  const scale = modelDesiredSizeInWorldUnits / maxDim
  return scale
}

function fitModelToViewport (model: THREE.Group, viewportHeight: number, viewportWidth: number) {
  if (!modelBox) {
    modelBox = new THREE.Box3().setFromObject(model)
    const newScale = getModelScale(viewportHeight, viewportWidth, modelBox)
    model.scale.set(newScale, newScale, newScale)

    const center = getModelCenter(modelBox)
    model.position.x = -center.x * newScale
    model.position.y = -center.y * newScale
    model.position.z = -center.z * newScale
    scale = newScale
  }
}

export function cleanup () {
  renderer.setAnimationLoop(null)
  renderer.dispose()
  renderTarget?.dispose()
  asciiMaterial?.dispose()
}


export async function init (canvasRef: HTMLCanvasElement | null) {
  const scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera()

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef! })

  camera.position.z = INITIAL_POSITION_Z
  camera.position.y = INITIAL_POSITION_Y

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)

  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(
    'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/'
  )

  const loader = new GLTFLoader()
  loader.setDRACOLoader(dracoLoader)

  renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight,
    {
      format: THREE.RGBAFormat,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter
    })

  const modelMaterial = new THREE.MeshStandardMaterial({color: 0xFFFFFF})
  await new Promise<void>((resolve) => {
    loader.load(piModelUrl, function (gltf) {
      model = new THREE.Group()

      gltf.scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const mesh = new THREE.Mesh(child.geometry, modelMaterial)
          model.add(mesh)
        }
      })
      scene.add(model)
      resolve()
    })
  })

  const glyphTexture = new THREE.CanvasTexture(await getGlyphCanvas())
  glyphTexture.minFilter = THREE.LinearFilter
  glyphTexture.magFilter = THREE.LinearFilter
  glyphTexture.needsUpdate = true

  resize(window.innerHeight, window.innerWidth)

  const cellSize = getCellSize()
  asciiMaterial = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      cellSize: { value: new THREE.Vector2(cellSize, cellSize) },
      glyphAtlas: { value: glyphTexture },
      glyphCount: { value: getGlyphCount() },
      glyphDarkness: { value: 1 },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      sceneTexture: { value: renderTarget.texture }
    },
    vertexShader: vertexShader
  })

  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    asciiMaterial!
  )

  postScene.add(quad)

  document.body.appendChild(renderer.domElement)

  function animate () {
    const modelAreaScrollPercent = getModelAreaScrollPercent()
    const portViewRotation = 1.563

    const maxZoom = 100

    const steepness = 15
    const getCurveAtPercentage = (percentage: number) => 1 / (1 + Math.exp(-steepness * (percentage - 0.75)))
    const getZoomAtPercentage = (percent: number) => Math.min(1 + (getCurveAtPercentage(percent) * 100), maxZoom)
    const getZoomedCellSizeAtPercentage = (percent: number) => Math.round(cellSize * Math.min(getZoomAtPercentage(percent), 10))

    const zoom = getZoomAtPercentage(modelAreaScrollPercent)
    const maxZoomedCellSize = getZoomedCellSizeAtPercentage(1)

    const rotation = Math.min(modelAreaScrollPercent * modelAreaScrollPercent * Math.PI * 2, portViewRotation)

    const zoomedCellSize = Math.max(getZoomedCellSizeAtPercentage(modelAreaScrollPercent), defaultCellSize)
    const glyphDarkness = Math.max(1 - ((zoomedCellSize - defaultCellSize) / (maxZoomedCellSize - defaultCellSize)), 0.03)

    if (model) {
      model.rotation.z = -rotation
      model.rotation.x = -rotation

      const center = getModelCenter()
      camera.position.x = center.x
      camera.position.y = center.y + INITIAL_POSITION_Y
      camera.position.z = center.z + INITIAL_POSITION_Z
    }

    camera.zoom = zoom
    camera.updateProjectionMatrix()

    asciiMaterial.uniforms.cellSize.value.set(zoomedCellSize, zoomedCellSize)
    asciiMaterial.uniforms.glyphDarkness.value = glyphDarkness

    renderer.setRenderTarget(renderTarget)
    renderer.render(scene, camera)

    renderer.setRenderTarget(null)
    renderer.render(postScene, postCamera)
  }

  renderer.setAnimationLoop(animate)
}
