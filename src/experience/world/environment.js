import * as THREE from "three";

import Experience from "../index.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { Water } from "three/examples/jsm/objects/Water.js";

export default class Environment {
	constructor() {
		this.experience = new Experience();
		this.scene = this.experience.scene;
		this.resources = this.experience.resources;
		this.debug = this.experience.debug;
		this.sun = new THREE.Vector3();
		this.parameters = {
			elevation: 2,
			azimuth: 180,
		};

		// Debug
		if (this.debug.active) {
			this.debugFolder = this.debug.ui.addFolder("environment");
		}

		this.setSunLight();
		this.setEnvironmentMap();
		this.setWater();
		this.setSky();
		this.updateSun();
	}

	setWater() {
		this.waterGeometry = new THREE.PlaneGeometry(10000, 10000);
		this.water = new Water(this.waterGeometry, {
			textureWidth: 512,
			textureHeight: 512,
			waterNormals: new THREE.TextureLoader().load(
				"textures/waternormals.jpeg",
				function (texture) {
					texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
				},
			),
			sunDirection: new THREE.Vector3(),
			sunColor: 0xffffff,
			waterColor: 0x001e0f,
			distortionScale: 3.7,
			fog: this.scene.fog !== undefined,
		});

		this.water.rotation.x = -Math.PI / 2;
		this.water.position.y = -0.09;

		this.scene.add(this.water);
	}

	setSky() {
		this.sky = new Sky();
		this.sky.scale.setScalar(10000);
		this.scene.add(this.sky);

		this.skyUniforms = this.sky.material.uniforms;

		this.skyUniforms["turbidity"].value = 10;
		this.skyUniforms["rayleigh"].value = 2;
		this.skyUniforms["mieCoefficient"].value = 0.005;
		this.skyUniforms["mieDirectionalG"].value = 0.8;

		this.pmremGenerator = new THREE.PMREMGenerator(
			this.experience.renderer.instance,
		);

		this.phi = THREE.MathUtils.degToRad(90 - this.parameters.elevation);
		this.theta = THREE.MathUtils.degToRad(this.parameters.azimuth);

		this.sun.setFromSphericalCoords(1, this.phi, this.theta);

		this.sky.material.uniforms["sunPosition"].value.copy(this.sun);
		this.water.material.uniforms["sunDirection"].value
			.copy(this.sun)
			.normalize();

		this.scene.environment = this.pmremGenerator.fromScene(this.sky).texture;
	}

	updateSun() {
		this.phi = THREE.MathUtils.degToRad(90 - this.parameters.elevation);
		this.theta = THREE.MathUtils.degToRad(this.parameters.azimuth);

		this.sun.setFromSphericalCoords(1, this.phi, this.theta);

		this.sky.material.uniforms["sunPosition"].value.copy(this.sun);
		this.water.material.uniforms["sunDirection"].value
			.copy(this.sun)
			.normalize();

		this.scene.environment = this.pmremGenerator.fromScene(this.sky).texture;
	}

	setSunLight() {
		this.sunLight = new THREE.DirectionalLight("#ffffff", 4);
		this.sunLight.castShadow = true;
		this.sunLight.shadow.camera.far = 15;
		this.sunLight.shadow.mapSize.set(1024, 1024);
		this.sunLight.shadow.normalBias = 0.05;
		this.sunLight.position.set(3.5, 2, -1.25);
		this.scene.add(this.sunLight);

		// Debug
		if (this.debug.active) {
			this.debugFolder
				.add(this.sunLight, "intensity")
				.name("sunLightIntensity")
				.min(0)
				.max(10)
				.step(0.001);

			this.debugFolder
				.add(this.sunLight.position, "x")
				.name("sunLightX")
				.min(-5)
				.max(5)
				.step(0.001);

			this.debugFolder
				.add(this.sunLight.position, "y")
				.name("sunLightY")
				.min(-5)
				.max(5)
				.step(0.001);

			this.debugFolder
				.add(this.sunLight.position, "z")
				.name("sunLightZ")
				.min(-5)
				.max(5)
				.step(0.001);
		}
	}

	setEnvironmentMap() {
		this.environmentMap = {};
		this.environmentMap.intensity = 0.4;
		this.environmentMap.texture = this.resources.items.environmentMapTexture;
		this.environmentMap.texture.encoding = THREE.sRGBEncoding;

		this.environmentMap.updateMaterials = () => {
			this.scene.traverse((child) => {
				if (
					child instanceof THREE.Mesh &&
					child.material instanceof THREE.MeshStandardMaterial
				) {
					child.material.envMap = this.environmentMap.texture;
					child.material.envMapIntensity = this.environmentMap.intensity;
					child.material.needsUpdate = true;
				}
			});
		};

		this.environmentMap.updateMaterials();
		this.environmentMap.encoding = THREE.sRGBEncoding;

		// Debug
		if (this.debug.active) {
			this.debugFolder
				.add(this.environmentMap, "intensity")
				.name("envMapIntensity")
				.min(0)
				.max(4)
				.step(0.001)
				.onChange(this.environmentMap.updateMaterials);
		}
	}

	update() {
		this.water.material.uniforms["time"].value += 1.0 / 60.0;
		this.updateSun();
	}
}
