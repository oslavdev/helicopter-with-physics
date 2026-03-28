import * as THREE from "three";
import { Sky }   from "three/examples/jsm/objects/Sky.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import Experience from "../index.js";

export default class Environment {
    constructor() {
        const exp      = new Experience();
        this.scene     = exp.scene;
        this.resources = exp.resources;
        this.debug     = exp.debug;
        this.renderer  = exp.renderer;

        this._sun = new THREE.Vector3();
        this._sunParams = { elevation: 2, azimuth: 180 };
        this._waterTime = 0;

        this._setupSunLight();
        this._setupEnvironmentMap();
        this._setupWater();
        this._setupSky();
        this._updateSun();

        if (this.debug.active) this._setupDebug();
    }

    _setupSunLight() {
        this._sunLight = new THREE.DirectionalLight("#ffffff", 4);
        this._sunLight.castShadow = true;
        this._sunLight.shadow.camera.far   = 15;
        this._sunLight.shadow.mapSize.set(1024, 1024);
        this._sunLight.shadow.normalBias   = 0.05;
        this._sunLight.position.set(3.5, 2, -1.25);
        this.scene.add(this._sunLight);
    }

    _setupEnvironmentMap() {
        this._envMap = this.resources.items.environmentMapTexture;
        // colorSpace replaces deprecated .encoding in Three r152+
        this._envMap.colorSpace = THREE.SRGBColorSpace;
        this.scene.environment = this._envMap;
        this._applyEnvMap();
    }

    _applyEnvMap(intensity = 0.4) {
        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh &&
                child.material instanceof THREE.MeshStandardMaterial) {
                child.material.envMap          = this._envMap;
                child.material.envMapIntensity = intensity;
                child.material.needsUpdate     = true;
            }
        });
    }

    _setupWater() {
        this._water = new Water(new THREE.PlaneGeometry(10000, 10000), {
            textureWidth:  512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(
                "textures/waternormals.jpeg",
                (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; },
            ),
            sunDirection: new THREE.Vector3(),
            sunColor:     0xffffff,
            waterColor:   0x001e0f,
            distortionScale: 3.7,
            fog: this.scene.fog !== undefined,
        });
        this._water.rotation.x = -Math.PI / 2;
        this._water.position.y = -0.09;
        this.scene.add(this._water);
    }

    _setupSky() {
        this._sky = new Sky();
        this._sky.scale.setScalar(10000);
        this.scene.add(this._sky);

        const u = this._sky.material.uniforms;
        u.turbidity.value       = 10;
        u.rayleigh.value        = 2;
        u.mieCoefficient.value  = 0.005;
        u.mieDirectionalG.value = 0.8;

        this._pmrem = new THREE.PMREMGenerator(this.renderer.instance);
    }

    _updateSun() {
        const phi   = THREE.MathUtils.degToRad(90 - this._sunParams.elevation);
        const theta = THREE.MathUtils.degToRad(this._sunParams.azimuth);
        this._sun.setFromSphericalCoords(1, phi, theta);

        this._sky.material.uniforms.sunPosition.value.copy(this._sun);
        this._water.material.uniforms.sunDirection.value.copy(this._sun).normalize();
        this.scene.environment = this._pmrem.fromScene(this._sky).texture;
    }

    _setupDebug() {
        const folder = this.debug.ui.addFolder("environment");
        folder.add(this._sunParams, "elevation", -90, 90, 0.1).onChange(() => this._updateSun());
        folder.add(this._sunParams, "azimuth",     0, 360, 1).onChange(() => this._updateSun());
        folder.add(this._sunLight, "intensity", 0, 10, 0.01).name("sunIntensity");
    }

    update() {
        // Water needs a continuous time uniform
        this._water.material.uniforms.time.value += 1 / 60;
    }
}
