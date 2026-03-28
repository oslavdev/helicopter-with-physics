import Experience from "../index.js";

export default class Platform {
    constructor() {
        const exp      = new Experience();
        this.world     = exp.world;
        this.scene     = exp.scene;
        this.resources = exp.resources;

        this._scale = 0.6;
        this._onCreate();
    }

    _onCreate() {
        this.model = this.resources.items.oilPlatformModel.scene;
        this.model.scale.setScalar(this._scale);
        this.model.position.y = -90;

        this.model.traverse((child) => {
            if (child.isMesh) child.receiveShadow = true;
        });

        this.scene.add(this.model);
        // Physics body lives in Floor — no duplicate body here
    }
}
