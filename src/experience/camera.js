import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Experience from "./index.js";

export default class Camera {
    constructor() {
        const exp    = new Experience();
        this.sizes   = exp.sizes;
        this.scene   = exp.scene;
        this.canvas  = exp.canvas;

        this._createInstance();
        this._createControls();
    }

    _createInstance() {
        this.instance = new THREE.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.1,
            10000,
        );
        this.instance.position.set(3, 90, -10);
        this.scene.add(this.instance);
    }

    _createControls() {
        // OrbitControls are overridden during gameplay by the vehicle's chase-cam,
        // but remain useful in #debug mode for free-look.
        this.controls = new OrbitControls(this.instance, this.canvas);
        this.controls.enableDamping = true;
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height;
        this.instance.updateProjectionMatrix();
    }

    update() {
        this.controls.update();
    }
}
