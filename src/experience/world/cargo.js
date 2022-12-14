import * as THREE from "three";

import Experience from "../index.js";
import { random } from "../../utils/random.js";

export default class Cargo {
	constructor() {
		this.experience = new Experience();
		this.resources = this.experience.resources;
		this.scene = this.experience.scene;
		this.scale = 0.08;
		this.debug = this.experience.debug;
		this.resource = this.resources.items.cargoModel;

		this.onCreate();
	}

	onCreate() {
		this.cargo = this.resource.scene;
		this.cargo.scale.set(this.scale, this.scale, this.scale);

		if (Math.random() > 0.6) {
			this.cargo.position.set(random(-100, 100), 1, random(-100, 100));
		} else {
			this.cargo.position.set(random(-100, 100), 1, random(-100, 100));
		}

		this.outlinedMaterial = new THREE.MeshBasicMaterial({ color: "black" });

		this.cargo.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.castShadow = true;
			}
		});

		this.scene.add(this.cargo);

		if (this.debug.active) {
			this.debugFolder = this.debug.ui.addFolder("cargo");

			this.debugFolder
				.add(this.cargo.position, "x")
				.name("x")
				.min(-100)
				.max(100)
				.step(0.1);

			this.debugFolder
				.add(this.cargo.position, "y")
				.name("y")
				.min(-100)
				.max(100)
				.step(0.1);

			this.debugFolder
				.add(this.cargo.position, "z")
				.name("z")
				.min(-100)
				.max(100)
				.step(0.1);
		}
	}

	update() {
		this.scene.updateMatrixWorld();
	}
}
