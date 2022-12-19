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

		this.particlesGeometry = new THREE.BufferGeometry();
		this.count = 500;

		this.positions = new Float32Array(this.count * 3); // Multiply by 3 because each position is composed of 3 values (x, y, z)

		for (
			let i = 0;
			i < this.count * 3;
			i++ // Multiply by 3 for same reason
		) {
			this.positions[i] = (Math.random() - 0.5) * 10; // Math.random() - 0.5 to have a random value between -0.5 and +0.5
		}

		this.textureLoader = new THREE.TextureLoader();
		this.partcileTexture = this.textureLoader.load("/textures/4.png");
		this.particlesMaterial = new THREE.PointsMaterial({
			size: 0.08,
			sizeAttenuation: true,
			color: "#ff88cc",
			transparent: true,
			alphaMap: this.partcileTexture,
			alphaTest: 0.001,
			depthWrite: true,
			blending: THREE.AdditiveBlending,
			vertexColors: true,
		});
		this.particlesGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(this.positions, 3),
		);
		this.particles = new THREE.Points(
			this.particlesGeometry,
			this.particlesMaterial,
		);
		this.scene.add(this.particles);
		this.scene.add(this.cargo);
	}

	update() {
		this.scene.updateMatrixWorld();
	}
}
