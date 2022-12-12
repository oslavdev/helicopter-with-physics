export function domSwitch(ids) {
	console.log(ids);
	for (let i = 0; i < ids.length; i++) {
		const el = document.getElementById(ids[i]);

		console.log(i);
		console.log(el);

		if (!el) break;

		if (el.classList.contains("hidden")) {
			console.log("Add");
			console.log(el);
			el.classList.remove("hidden");
		} else {
			el.classList.add("hidden");
		}
	}
}
