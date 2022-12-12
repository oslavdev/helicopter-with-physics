export function domSwitch(ids) {
	for (let i = 0; i < ids.length; i++) {
		const el = document.getElementById(ids[i]);

		if (!el) break;

		if (el.classList.contains("hidden")) {
			el.classList.remove("hidden");
		} else {
			el.classList.add("hidden");
		}
	}
}
