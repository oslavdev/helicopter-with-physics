import * as THREE from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import Experience from "./index.js";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

export default class Renderer {
	constructor() {
		this.experience = new Experience();
		this.canvas = this.experience.canvas;
		this.sizes = this.experience.sizes;
		this.scene = this.experience.scene;
		this.camera = this.experience.camera;

		this.setInstance();
	}

	setInstance() {
		this.instance = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
			alpha: true,
		});
		this.instance.physicallyCorrectLights = true;
		this.instance.outputEncoding = THREE.sRGBEncoding;
		this.instance.toneMapping = THREE.ReinhardToneMapping;
		this.instance.toneMappingExposure = 1.75;
		this.instance.shadowMap.enabled = true;
		this.instance.shadowMap.type = THREE.PCFSoftShadowMap;

		this.instance.setClearColor("#211d20");
		this.instance.setSize(this.sizes.width, this.sizes.height);
		this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2));

		this.effectComposer = new EffectComposer(this.instance);
		this.effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.effectComposer.setSize(window.innerWidth, window.innerHeight);

		const renderPass = new RenderPass(this.scene, this.camera.instance);
		this.effectComposer.addPass(renderPass);

		this.glitchPass = new GlitchPass();
		this.glitchPass.enabled = false;
		this.effectComposer.addPass(this.glitchPass);
	}

	resize() {
		this.instance.setSize(this.sizes.width, this.sizes.height);
		this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2));

		this.effectComposer.setSize(this.sizes.width, this.sizes.height);
		this.effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	}

	update() {
		this.instance.render(this.scene, this.camera.instance);
		this.effectComposer.render();
	}
}
