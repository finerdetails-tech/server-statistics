import * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import piModelUrl from '../../assets/pi_model.glb?url'
import getGlyphCanvas from './getGlyphCanvas'
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
  }

  if (asciiMaterial) {
    asciiMaterial.uniforms.resolution.value.set(viewportWidth, viewportHeight)
  }
}

function pixelsToWorldUnits (pixels: number): number {
  if (!camera || !renderer) return 0

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


function fitModelToViewport (model: THREE.Group, viewportHeight: number, viewportWidth: number) {
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const minViewportDim = Math.min(viewportWidth, viewportHeight)
  const modelDesiredSizeInWorldUnits = pixelsToWorldUnits(minViewportDim * 0.8)

  const scale = modelDesiredSizeInWorldUnits / maxDim
  model.scale.set(scale, scale, scale)

  const center = getModelCenter(box)
  model.position.x = -center.x * scale
  model.position.y = -center.y * scale
  model.position.z = -center.z * scale
}


export function init (canvasRef: HTMLCanvasElement | null) {
  const scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera()

  camera.position.z = INITIAL_POSITION_Z
  camera.position.y = INITIAL_POSITION_Y

  const directionalLight = new THREE.DirectionalLight(0xffffff, 5)
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

  const modelMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    metalness: 0.5,
    roughness: 0.5
  })

  loader.load(piModelUrl, function (gltf) {
    model = new THREE.Group()

    gltf.scene.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const mesh = new THREE.Mesh(child.geometry, modelMaterial)
        model.add(mesh)
      }
    })

    scene.add(model)
  })

  const glyphTexture = new THREE.CanvasTexture(getGlyphCanvas())
  glyphTexture.minFilter = THREE.LinearFilter
  glyphTexture.magFilter = THREE.LinearFilter
  glyphTexture.needsUpdate = true

  asciiMaterial = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      cellSize: { value: new THREE.Vector2(4, 8) },
      glyphAtlas: { value: glyphTexture },
      glyphCount: { value: 16 },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      sceneTexture: { value: renderTarget.texture }
    },
    vertexShader: vertexShader
  })

  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    asciiMaterial!
  )

  resize(window.innerHeight, window.innerWidth)

  postScene.add(quad)

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef! })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  function animate () {
    const modelAreaScrollPercent = getModelAreaScrollPercent()
    const portViewRotation = 1.563
    const rotation = Math.min(modelAreaScrollPercent * modelAreaScrollPercent * Math.PI * 2, portViewRotation)
    const zoom = 1 + ((modelAreaScrollPercent > 0.4)
      ? (modelAreaScrollPercent - 0.4)
      : 0) * 10
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

    renderer.setRenderTarget(renderTarget)
    renderer.render(scene, camera)

    renderer.setRenderTarget(null)
    renderer.render(postScene, postCamera)
  }
  renderer.setAnimationLoop(animate)
}
