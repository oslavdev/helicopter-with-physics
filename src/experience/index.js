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

let instance = null;

export default class Experience {
	constructor(_canvas) {
		if (instance) {
			return instance;
		}

		instance = this;
		window.experience = this;

		this.resources = new Resources(OIL_PLATFORM);
		this.universe = new Universe();
		this.canvas = _canvas;
		this.ready = false;
		this.debug = new Debug();
		this.sizes = new Sizes();
		this.time = new Time();
		this.scene = new THREE.Scene();
		this.camera = new Camera();
		this.renderer = new Renderer();

		this.world = new CANNON.World();
		this.world.gravity.set(0, -9.82, 0);

		// Resize event
		this.sizes.on("resize", () => {
			this.resize();
		});

		// Time tick event
		this.time.on("tick", () => {
			this.update();
		});
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

		// Traverse the whole scene
		this.scene.traverse((child) => {
			// Test if it's a mesh
			if (child instanceof THREE.Mesh) {
				child.geometry.dispose();

				// Loop through the material properties
				for (const key in child.material) {
					const value = child.material[key];

					// Test if there is a dispose function
					if (value && typeof value.dispose === "function") {
						value.dispose();
					}
				}
			}
		});

		this.camera.controls.dispose();
		this.renderer.instance.dispose();

		if (this.debug.active) this.debug.ui.destroy();
	}
}
