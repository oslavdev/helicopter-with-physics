import Environment from "./environment.js";
import Experience from "../index.js";
import Floor from "./floor.js";
import Platform from "./platform.js";
import Vehicle from "./vehicle.js";

export default class Universe {
	constructor() {
		this.experience = new Experience();
		this.scene = this.experience.scene;
		this.resources = this.experience.resources;
		this.environment = null;

		// Wait for resources
		this.resources.on("ready", () => {
			this.floor = new Floor();
			this.environment = new Environment();
			this.platform = new Platform();

			this.vehicle = new Vehicle();
		});
	}

	update() {
		if (this.vehicle) this.vehicle.update();
		if (this.environment) this.environment.update();
	}
}
