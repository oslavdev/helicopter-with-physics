export default class Controls {
	constructor() {
		this.keyMap = {
			w: false,
			s: false,
			a: false,
			d: false,
			ArrowUp: false,
			ArrowDown: false,
			ArrowLeft: false,
			ArrowRight: false,
			g: false,
		};
	}

	onDocumentKey = (e) => {
		this.keyMap[e.key] = e.type === "keydown";
	};

	onStart() {
		document.addEventListener("keydown", this.onDocumentKey, false);
		document.addEventListener("keyup", this.onDocumentKey, false);
	}

	onStop() {
		document.removeEventListener("keydown", this.onDocumentKey, false);
		document.removeEventListener("keyup", this.onDocumentKey, false);
	}
}
