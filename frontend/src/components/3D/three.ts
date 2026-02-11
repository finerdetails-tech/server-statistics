import * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import piModelUrl from '../../assets/pi_model.glb?url'

let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let scrollElement: HTMLElement | null = null
let placeholderElement: HTMLElement | null = null
let isLandscape = false
let model: THREE.Group | null = null

const INITIAL_POSITION_Z = 150
const INITIAL_POSITION_Y = 8

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
  if (renderer) {
    renderer.setSize(viewportWidth, viewportHeight, false)
  }

  if (model) {
    fitModelToViewport(model, viewportHeight, viewportWidth)
  }
}

function pixelsToWorldUnits (pixels: number): number {
  if (!camera || !renderer) return 0

  const frustumSize = 100
  const canvasHeight = renderer.domElement.height

  const pixelsPerWorldUnit = (canvasHeight / frustumSize) * camera.zoom

  return pixels / pixelsPerWorldUnit
}

function fitModelToViewport (model: THREE.Group, viewportHeight: number, viewportWidth: number) {
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const minViewportDim = Math.min(viewportWidth, viewportHeight)
  const modelDesiredSizeInWorldUnits = pixelsToWorldUnits(minViewportDim * 0.8)

  const scale = modelDesiredSizeInWorldUnits / maxDim
  model.scale.set(scale, scale, scale)

  const center = box.getCenter(new THREE.Vector3())
  model.position.x = -center.x * scale
  model.position.y = -center.y * scale
  model.position.z = -center.z * scale
}


export function init (canvasRef: HTMLCanvasElement | null) {
  const scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera()
  resize(window.innerHeight, window.innerWidth)
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

    fitModelToViewport(model, window.innerHeight, window.innerWidth)
    scene.add(model)
  })

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef! })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  // TODO: add effects

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
    }
    camera.zoom = zoom
    camera.updateProjectionMatrix()
    composer.render()
  }
  renderer.setAnimationLoop(animate)
}


