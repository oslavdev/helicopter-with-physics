import EventEmitter from "./event-emitter.js";

export default class Time extends EventEmitter {
    constructor() {
        super();

        this.start   = performance.now(); // higher resolution than Date.now()
        this.current = this.start;
        this.elapsed = 0;
        this.delta   = 16;

        // Kick off the loop on the next frame so listeners can be registered first
        requestAnimationFrame(() => this._tick());
    }

    _tick() {
        const now    = performance.now();
        this.delta   = now - this.current;
        this.current = now;
        this.elapsed = now - this.start;

        this.trigger("tick");
        requestAnimationFrame(() => this._tick());
    }
}
