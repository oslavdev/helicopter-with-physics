import './style.css'

import * as CANNON from 'cannon-es'
import * as THREE from 'three'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import Experience from "./experience"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'

const experience = new Experience(document.querySelector('canvas.webgl'))

// function onCreate(){
    
//     const scene = new THREE.Scene()
//     const canvas = document.querySelector('canvas.webgl')

//     // Light
//     const light = addLight()
//     scene.add(light)

//     // Camera Helper
//     const helper = new THREE.CameraHelper(light.shadow.camera)
//     scene.add(helper)
    
//     // Camera
//     const camera = new THREE.PerspectiveCamera(
//         75,
//         window.innerWidth / window.innerHeight,
//         0.1,
//         1000
//     )

//     // Orbit Controls
//     const controls = new OrbitControls(camera, canvas)
//     controls.target.set(0, 0.75, 0)
//     controls.enableDamping = true

//     // World
//     const phongMaterial = new THREE.MeshPhongMaterial()
    
//     const world = new CANNON.World()
//     world.gravity.set(0, -9.82, 0)
    
//     // Ground
//     const groundMaterial = new CANNON.Material('groundMaterial')
//     groundMaterial.friction = 0.25
//     groundMaterial.restitution = 0.25
    
//     // Renderer
//     const renderer = new THREE.WebGLRenderer({canvas: canvas})
//     renderer.setClearColor("#1c1c1b")
//     renderer.setSize(window.innerWidth, window.innerHeight)
//     renderer.shadowMap.enabled = true
//     renderer.shadowMap.type = THREE.PCFSoftShadowMap
//     document.body.appendChild(renderer.domElement)

//     // Event listeners
//     window.addEventListener('resize', onWindowResize, false)
//     function onWindowResize() {
//         camera.aspect = window.innerWidth / window.innerHeight
//         camera.updateProjectionMatrix()
//         renderer.setSize(window.innerWidth, window.innerHeight)
//         render()
//     }

//     // Execute renderer
//     function render() {
//         renderer.render(scene, camera)
//     }

//     render()
// }

// onCreate()
