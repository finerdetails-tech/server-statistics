import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import piModelUrl from '../../assets/pi_model.glb?url'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { elementToPercent } from '../../utils'

let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let scrollElement: HTMLElement | null = null
let isLandscape = false

const INITIAL_POSITION_Z = 150
const INITIAL_POSITION_Y = 2

export function setScrollElement(element: HTMLElement, landscape: boolean) {
    scrollElement = element
    isLandscape = landscape
}

function getScrollPercent(): number {
    if (!scrollElement) return 0
    const scrollPercent = elementToPercent(scrollElement)

    if (isLandscape) {
        return scrollPercent.horizontalPercent
    }
    return scrollPercent.verticalPercent
}

export function resize(viewportHeight: number, viewportWidth: number) {
    if (!camera || !renderer) return
    const aspectRatio = viewportWidth / viewportHeight
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
    renderer.setSize(viewportWidth, viewportHeight, false)
}

export function init(canvasRef: HTMLCanvasElement | null) {
    const scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
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

    let model: THREE.Group
    let composer: any
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

    renderer = new THREE.WebGLRenderer({ canvas: canvasRef! })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    //TODO: add effects

    function animate() {
        const scrollPercent = getScrollPercent()
        const rotation = scrollPercent * scrollPercent * Math.PI * 0.5

        scene.rotation.z = -rotation
        scene.rotation.x = -rotation
        composer.render(scene, camera)
    }
    renderer.setAnimationLoop(animate)
}


