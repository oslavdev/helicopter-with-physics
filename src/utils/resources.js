import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import EventEmitter from "./event-emitter.js";

export default class Resources extends EventEmitter {
    constructor(sources) {
        super();

        this.sources = sources;
        this.items   = {};
        this.toLoad  = sources.length;
        this.loaded  = 0;

        this._setupLoaders();
        this._startLoading();
    }

    _setupLoaders() {
        const manager = new THREE.LoadingManager(
            // All loaded
            () => {
                const bar = document.querySelector(".loading-bar");
                if (bar) {
                    bar.classList.add("ended");
                    bar.style.transform = "";
                }
                // Resources ready — universe._onReady will fire via trigger("ready")
                this.trigger("ready");
            },
            // Progress
            (_url, loaded, total) => {
                const bar = document.querySelector(".loading-bar");
                if (bar) bar.style.transform = `scaleX(${loaded / total})`;
            },
            // Error
            (url) => {
                console.error(`[Resources] Failed to load: ${url}`);
            }
        );

        this.loaders = {
            gltf:    new GLTFLoader(manager),
            texture: new THREE.TextureLoader(manager),
            cube:    new THREE.CubeTextureLoader(manager),
        };
    }

    _startLoading() {
        const LOADERS = {
            gltfModel:   (src) => this.loaders.gltf.load(src.path,    (f) => this._onLoaded(src, f)),
            texture:     (src) => this.loaders.texture.load(src.path, (f) => this._onLoaded(src, f)),
            cubeTexture: (src) => this.loaders.cube.load(src.path,    (f) => this._onLoaded(src, f)),
        };

        for (const source of this.sources) {
            const loader = LOADERS[source.type];
            if (loader) {
                loader(source);
            } else {
                console.warn(`[Resources] Unknown source type: "${source.type}"`);
                this.toLoad--;
            }
        }
    }

    _onLoaded(source, file) {
        this.items[source.name] = file;
        this.loaded++;
        if (this.loaded === this.toLoad) this.trigger("ready");
    }
}
