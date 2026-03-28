// GameManager — owns levels, score, countdown timer, HUD, and end-game flow.
// It is deliberately decoupled from Three.js: no scene/physics references.

const LEVELS = [
    { level: 1, cargoCount: 2, timeLimit: 300 },
    { level: 2, cargoCount: 3, timeLimit: 300 },
    { level: 3, cargoCount: 4, timeLimit: 240 },
    { level: 4, cargoCount: 5, timeLimit: 240 },
    { level: 5, cargoCount: 6, timeLimit: 180 },
];

const LEVEL_LABELS = [
    "Mission 1 — First Deployment",
    "Mission 2 — Hostile Waters",
    "Mission 3 — Storm Warning",
    "Mission 4 — Night Ops",
    "Mission 5 — Final Extraction",
];

// Bonus seconds awarded on each successful delivery
const DELIVERY_TIME_BONUS = 15;

export default class GameManager {
    constructor() {
        this.score           = 0;
        this._levelIndex     = 0;
        this._timeRemaining  = 0;
        this._cargoDelivered = 0;
        this._timerHandle    = null;
        this._running        = false;

        // Callbacks set by index.js
        this.onLevelComplete = null; // (nextIndex) => void
        this.onGameOver      = null; // (score) => void

        this._bindHUD();
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    get currentLevel() { return LEVELS[this._levelIndex]; }
    get isRunning()    { return this._running; }

    startLevel(index) {
        if (index >= LEVELS.length) { this._showCredits(); return; }

        this._levelIndex     = index;
        this._cargoDelivered = 0;
        this._timeRemaining  = LEVELS[index].timeLimit;
        this._running        = true;

        this._updateHUD();
        this._showBanner(LEVEL_LABELS[index]);
        this._startTimer();
    }

    /**
     * Called by Vehicle when a cargo reaches the platform.
     * @param {number} basePoints  Points before bonuses (always >= 100)
     */
    deliverCargo(basePoints) {
        this._cargoDelivered++;
        this.score += basePoints;
        this._timeRemaining = Math.min(
            this._timeRemaining + DELIVERY_TIME_BONUS,
            LEVELS[this._levelIndex].timeLimit,
        );
        this._updateHUD();

        if (this._cargoDelivered >= LEVELS[this._levelIndex].cargoCount) {
            this._completeLevel();
        }
    }

    showPickupHint(visible) {
        this._el("pickup-hint")?.classList.toggle("hidden", !visible);
    }

    showDeliverHint(visible) {
        this._el("deliver-hint")?.classList.toggle("hidden", !visible);
    }

    destroy() {
        clearInterval(this._timerHandle);
        this._running = false;
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    _bindHUD() {
        // Cache DOM references once
        this._hud = {
            score:  this._el("hud-score"),
            level:  this._el("hud-level"),
            cargo:  this._el("hud-cargo"),
            timer:  this._el("hud-timer"),
            banner: this._el("level-banner"),
        };
    }

    _el(id) { return document.getElementById(id); }

    _updateHUD() {
        const h = this._hud;
        if (h.score) h.score.textContent = this.score.toLocaleString();
        if (h.level) h.level.textContent = this._levelIndex + 1;
        if (h.cargo) h.cargo.textContent = `${this._cargoDelivered}/${LEVELS[this._levelIndex].cargoCount}`;
        if (h.timer) {
            const m = Math.floor(this._timeRemaining / 60);
            const s = this._timeRemaining % 60;
            h.timer.textContent = `${m}:${String(s).padStart(2, "0")}`;
            h.timer.classList.toggle("urgent", this._timeRemaining <= 30);
        }
    }

    _startTimer() {
        clearInterval(this._timerHandle);
        this._timerHandle = setInterval(() => {
            if (!this._running) { clearInterval(this._timerHandle); return; }
            this._timeRemaining--;
            this._updateHUD();

            if (this._timeRemaining <= 0) {
                clearInterval(this._timerHandle);
                this._running = false;
                this._showGameOver();
            }
        }, 1000);
    }

    _completeLevel() {
        this._running = false;
        clearInterval(this._timerHandle);

        // Time-remaining bonus
        this.score += this._timeRemaining * 10;
        this._updateHUD();

        const isLast = this._levelIndex >= LEVELS.length - 1;
        if (isLast) {
            setTimeout(() => this._showCredits(), 1800);
        } else {
            this.onLevelComplete?.(this._levelIndex + 1);
        }
    }

    _showBanner(text) {
        const el = this._hud.banner;
        if (!el) return;
        el.textContent = text;
        el.classList.remove("hidden");
        clearTimeout(this._bannerTimeout);
        this._bannerTimeout = setTimeout(() => el.classList.add("hidden"), 3200);
    }

    _showGameOver() {
        const screen = this._el("end-screen");
        if (!screen) return;
        this._el("end-title").textContent = "Time Up!";
        this._el("end-score").textContent = `Score: ${this.score.toLocaleString()}`;
        screen.classList.remove("hidden");
        this._el("ui")?.classList.add("hidden");
        this.onGameOver?.(this.score);
    }

    _showCredits() {
        const credits = this._el("credits-roll");
        if (!credits) return;
        const finalEl = this._el("credits-final-score");
        if (finalEl) finalEl.textContent = this.score.toLocaleString();
        credits.classList.remove("hidden");
        this._el("ui")?.classList.add("hidden");
    }
}
