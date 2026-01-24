import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import piModelUrl from '../../assets/pi_model.glb?url'

let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer


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
    camera.position.z = 150
    camera.position.y = 2

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(
        'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/'
    )

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    let model: THREE.Group

    loader.load(piModelUrl, function (gltf) {
        model = gltf.scene
        scene.add(model)

    }, undefined, function (error) {

        console.error(error)

    })

    renderer = new THREE.WebGLRenderer({ canvas: canvasRef! })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    function animate() {
        if (model) {
            model.rotation.y += 0.01
        }
        renderer.render(scene, camera)
    }
    renderer.setAnimationLoop(animate)

}

//TODO:
/*
- Dynamic aspect ratio?
- Use model for geometry only, apply own material?
*/


