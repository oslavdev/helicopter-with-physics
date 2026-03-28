/**
 * Toggle the `hidden` class on each element by ID.
 * Silently skips missing elements instead of breaking on first null.
 */
export function domSwitch(ids) {
    for (const id of ids) {
        document.getElementById(id)?.classList.toggle("hidden");
    }
}
