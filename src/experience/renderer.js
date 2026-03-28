import * as THREE from "three";
import Experience from "./index.js";

export default class Renderer {
    constructor() {
        const exp = new Experience();
        this.canvas  = exp.canvas;
        this.sizes   = exp.sizes;
        this.scene   = exp.scene;
        this.camera  = exp.camera;

        this._setup();
    }

    _setup() {
        this.instance = new THREE.WebGLRenderer({
            canvas:    this.canvas,
            antialias: true,
            alpha:     true,
        });

        this.instance.useLegacyLights     = false;
        this.instance.outputColorSpace    = THREE.SRGBColorSpace;
        this.instance.toneMapping         = THREE.ReinhardToneMapping;
        this.instance.toneMappingExposure = 1.75;
        this.instance.shadowMap.enabled   = true;
        this.instance.shadowMap.type      = THREE.PCFSoftShadowMap;

        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2));
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2));
    }

    update() {
        this.instance.render(this.scene, this.camera.instance);
    }
}
