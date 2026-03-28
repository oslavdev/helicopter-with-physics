import Cargo       from "./cargo.js";
import Environment from "./environment.js";
import Experience  from "../index.js";
import Floor       from "./floor.js";
import Platform    from "./platform.js";
import Vehicle     from "./vehicle.js";

export default class Universe {
    constructor() {
        const exp      = new Experience();
        this.scene     = exp.scene;
        this.resources = exp.resources;

        this.floor       = null;
        this.environment = null;
        this.platform    = null;
        this.vehicle     = null;
        this.cargos      = [];

        this.resources.on("ready", () => this._onReady());
    }

    _onReady() {
        this.floor       = new Floor();
        this.platform    = new Platform();
        this.environment = new Environment();
        // Vehicle must come after floor — it reads floor.body.position in its constructor
        this.vehicle     = new Vehicle();
    }

    /**
     * Replace all cargos with a fresh set of `count` items.
     * Called by index.js when a new level starts.
     */
    spawnCargos(count) {
        for (const c of this.cargos) c.destroy();
        this.cargos = Array.from({ length: count }, (_, i) => new Cargo(i));
    }

    update() {
        const elapsed = new Experience().time?.elapsed * 0.001 ?? 0;

        if (this.vehicle)     this.vehicle.update(this.cargos);
        if (this.environment) this.environment.update();
        for (const cargo of this.cargos) cargo.update(elapsed);
    }
}
