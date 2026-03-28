import "./style.css";

import LevelManager from "./experience/level-manager.js";
import GameManager  from "./experience/game-manager.js";

function startGame() {
    // 1. Hide tutorial, show a dark loading screen (canvas stays hidden until ready)
    document.getElementById("tutorial").classList.add("hidden");
    document.getElementById("loading-screen").classList.remove("hidden");
    document.getElementById("loading-bar").classList.remove("hidden");

    const levelManager = new LevelManager();
    const gameManager  = new GameManager();

    levelManager.onCreateLevel("FREESTYLE", "OIL_PLATFORM");

    const ready = setInterval(() => {
        const universe = window.experience?.universe;
        if (!universe?.vehicle) return;
        clearInterval(ready);

        // 2. Resources done — swap loading screen for game canvas
        document.getElementById("loading-screen").classList.add("hidden");
        document.getElementById("webgl").classList.remove("hidden");
        document.getElementById("ui").classList.remove("hidden");

        universe.vehicle.gameManager = gameManager;

        gameManager.onLevelComplete = (nextIndex) => {
            gameManager.startLevel(nextIndex);
            universe.vehicle.attachedCargo = null;
            universe.spawnCargos(gameManager.currentLevel.cargoCount);
        };

        gameManager.onGameOver = (score) => {
            console.info("[GameManager] Game over. Final score:", score);
        };

        gameManager.startLevel(0);
        universe.spawnCargos(gameManager.currentLevel.cargoCount);
    }, 100);
}

// "Start Mission" → tutorial briefing
document.getElementById("start-game").addEventListener("click", () => {
    document.getElementById("main").classList.add("hidden");
    document.getElementById("tutorial").classList.remove("hidden");
});

// "Let's Go" → game
document.getElementById("tutorial-start").addEventListener("click", startGame);
