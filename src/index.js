import "./style.css";

import Experience from "./experience";
import { domSwitch } from "./utils/dom-switch";

function onFreestyle() {
	domSwitch(["main", "webgl"]);
	const experience = new Experience(document.querySelector("canvas.webgl"));
}

function onStart() {
	document
		.getElementById("freestyle-run")
		.addEventListener("click", onFreestyle);
}

onStart();
