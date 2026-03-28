import * as CANNON from "cannon-es";
import * as THREE from "three";

import Camera from "./camera.js";
import Debug from "../utils/debug.js";
import { OIL_PLATFORM } from "./sources.js";
import Renderer from "./renderer.js";
import Resources from "../utils/resources.js";
import Sizes from "../utils/sizes.js";
import Time from "../utils/time.js";
import Universe from "./world/universe.js";

// Singleton instance — one Experience per page lifetime
let instance = null;

export default class Experience {
    constructor(_canvas) {
        if (instance) return instance;

        instance = this;
        window.experience = this;

        // Core systems must be created before anything that depends on them
        this.canvas  = _canvas;
        this.debug   = new Debug();
        this.sizes   = new Sizes();
        this.time    = new Time();
        this.scene   = new THREE.Scene();

        // Physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        // Broadphase improves perf with many bodies
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true;

        // Rendering & camera
        this.camera   = new Camera();
        this.renderer = new Renderer();

        // Resources & world objects — depend on scene/world/camera being ready
        this.resources = new Resources(OIL_PLATFORM);
        this.universe  = new Universe();

        this.sizes.on("resize", () => this.resize());
        this.time.on("tick",    () => this.update());
    }

    resize() {
        this.camera.resize();
        this.renderer.resize();
    }

    update() {
        this.camera.update();
        this.universe.update();
        this.renderer.update();
    }

    destroy() {
        this.sizes.off("resize");
        this.time.off("tick");

        this.scene.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            child.geometry.dispose();
            // Material can be an array (multi-material) or a single material
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            for (const mat of materials) {
                for (const value of Object.values(mat)) {
                    if (value?.dispose) value.dispose();
                }
            }
        });

        this.camera.controls.dispose();
        this.renderer.instance.dispose();
        if (this.debug.active) this.debug.ui.destroy();

        instance = null;
    }
}
