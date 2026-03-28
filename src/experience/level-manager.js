import Experience from "./index.js";

// LevelManager's sole job: bootstrap the Three.js experience for a given map/mode.
// Game progression (score, timer, cargo) lives in GameManager.

const MAPS = {
    OIL_PLATFORM: "oil-platform",
    SNOW_FOREST:  "snow-forest",
};

const MODES = {
    FREESTYLE:   "freestyle",
    SINGLE:      "single",
    MULTIPLAYER: "multiplayer", // fixed typo: MULTIPLYAER → MULTIPLAYER
};

export default class LevelManager {
    constructor() {
        this.map  = "";
        this.mode = "";
    }

    onCreateLevel(mode, map) {
        if (!MODES[mode]) throw new Error(`Unknown mode: "${mode}"`);
        if (!MAPS[map])   throw new Error(`Unknown map: "${map}"`);

        this.map  = MAPS[map];
        this.mode = MODES[mode];

        // Instantiates the singleton; safe to call multiple times
        new Experience(document.querySelector("canvas.webgl"));
    }

    onDestroyLevel() { // fixed typo: onDestoryLevel → onDestroyLevel
        this.map  = "";
        this.mode = "";
    }
}
