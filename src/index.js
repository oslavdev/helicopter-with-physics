import "./style.css";

import LevelManager from "./experience/level-manager";
import { domSwitch } from "./utils/dom-switch";

function onFreestyle() {
	domSwitch(["loading-bar", "main", "webgl"]);
	const levelManager = new LevelManager();
	levelManager.onCreateLevel("FREESTYLE", "OIL_PLATFORM");
}

function onStart() {
	document
		.getElementById("freestyle-run")
		.addEventListener("click", onFreestyle);
}

onStart();
