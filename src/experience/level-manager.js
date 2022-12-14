import Experience from ".";

const MAPS = {
	OIL_PLATFORM: "oil-platform",
	SNOW_FOREST: "snow-forest",
};

const MODES = {
	FREESTYLE: "freestyle",
	SINGLE: "single",
	MULTIPLYAER: "multiplayer",
};

export default class LevelManager {
	constructor() {
		this.map = "";
		this.mode = "";
		this.score = 0;
	}

	onCreateLevel(mode, map) {
		if (!MODES[mode]) {
			throw new Error("The given mode does not exist!");
		}

		if (!MAPS[map]) {
			throw new Error("The given map does not exist!");
		}

		this.map = MAPS[map];
		this.mode = MODES[mode];

		// TODO: Load differen maps in different modes
		const experience = new Experience(document.querySelector("canvas.webgl"));
	}

	onDestoryLevel() {
		this.map = "";
		this.mode = "";
	}
}
