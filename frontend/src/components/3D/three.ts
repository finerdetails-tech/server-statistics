/* import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(
    'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/'
)

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)

loader.load('assets/pi_model.glb', function (gltf) {

    scene.add(gltf.scene)

}, undefined, function (error) {

    console.error(error)

})

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

function animate() {
    renderer.render(scene, camera)
}
renderer.setAnimationLoop(animate) */

import * as THREE from 'three'

export function init(canvasRef: HTMLCanvasElement | null) {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef! })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setAnimationLoop(animate)

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0xbbff00 })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    camera.position.z = 5

    function animate() {

        cube.rotation.x += 0.01
        cube.rotation.y += 0.01

        renderer.render(scene, camera)

    }
}

