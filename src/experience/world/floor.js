import * as CANNON from "cannon-es";
import Experience from "../index.js";

// Floor only provides a physical landing platform for the helicopter spawn.
// Visual ground is the water plane in Environment.
export default class Floor {
    constructor() {
        const exp  = new Experience();
        this.world = exp.world;

        this._createBody();
    }

    _createBody() {
        const material = new CANNON.Material("platform");
        material.friction    = 0.25;
        material.restitution = 0.25;

        // Box sized to approximate the oil platform deck
        this.body = new CANNON.Body({ mass: 0, material });
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(8, 1, 8)));
        // Position matches the platform model's deck height
        this.body.position.set(-48, 63, 0);

        this.world.addBody(this.body);
    }
}
