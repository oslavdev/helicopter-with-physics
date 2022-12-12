import * as THREE from "three";

import EventEmitter from "./event-emitter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";

const loadingManager = new THREE.LoadingManager(
	// Loaded
	() => {
		const loadingBarElement = document.querySelector(".loading-bar");

		loadingBarElement.classList.add("ended");
		loadingBarElement.style.transform = "";
	},

	// Progress
	(_, itemsLoaded, itemsTotal) => {
		const progressRatio = itemsLoaded / itemsTotal;
		document.querySelector(
			".loading-bar",
		).style.transform = `scaleX(${progressRatio})`;
	},
);

export default class Resources extends EventEmitter {
	constructor(sources) {
		super();

		this.sources = sources;
		this.items = {};
		this.toLoad = this.sources.length;
		this.loaded = 0;

		this.setLoaders();
		this.startLoading();
	}

	setLoaders() {
		this.loaders = {};
		this.loaders.gltfLoader = new GLTFLoader(loadingManager);
		this.loaders.textureLoader = new THREE.TextureLoader();
		this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader();
	}

	startLoading() {
		// Load each source
		for (const source of this.sources) {
			if (source.type === "gltfModel") {
				this.loaders.gltfLoader.load(source.path, (file) => {
					this.sourceLoaded(source, file);
				});
			} else if (source.type === "texture") {
				this.loaders.textureLoader.load(source.path, (file) => {
					this.sourceLoaded(source, file);
				});
			} else if (source.type === "cubeTexture") {
				this.loaders.cubeTextureLoader.load(source.path, (file) => {
					this.sourceLoaded(source, file);
				});
			}
		}
	}

	sourceLoaded(source, file) {
		this.items[source.name] = file;

		this.loaded++;

		if (this.loaded === this.toLoad) {
			this.trigger("ready");
		}
	}
}
