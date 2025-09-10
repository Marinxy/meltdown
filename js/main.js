// Main entry point - Initialize and start the game
let game;
let ui;

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing Arcade Meltdown...');
        
        // Create game instance
        game = new Game();
        
        // Wait for game to initialize
        await game.initialize();
        
        // Create UI manager
        ui = new UI(game);
        
        // Setup additional event listeners
        setupGlobalEventListeners();
        
        console.log('Arcade Meltdown ready!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorMessage('Failed to initialize game. Please refresh the page.');
    }
});

function setupGlobalEventListeners() {
    // Handle window focus/blur for pause functionality
    window.addEventListener('blur', () => {
        if (game && game.gameState === 'playing') {
            game.pauseGame();
        }
    });
    
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game && game.gameState === 'playing') {
            game.pauseGame();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Could implement canvas resizing here if needed
    });
    
    // Game event listeners for UI updates
    EventManager.on('wave_started', (data) => {
        ui.showWaveStart(data.wave);
        ui.showNotification(`Wave ${data.wave} - ${data.enemyCount} enemies incoming!`);
    });
    
    EventManager.on('boss_spawned', () => {
        ui.showBossWarning();
    });
    
    EventManager.on('player_died', () => {
        ui.showNotification('You have been eliminated!', 'error');
    });
    
    EventManager.on('enemy_killed', (data) => {
        // Could show kill notifications here
    });
    
    EventManager.on('chaos_level_changed', (data) => {
        if (data.level > 0.8) {
            ui.showNotification('MAXIMUM CHAOS!', 'warning', 2000);
        }
    });
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: 'Orbitron', monospace;
        text-align: center;
        z-index: 9999;
    `;
    errorDiv.innerHTML = `
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="
            background: #fff;
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Orbitron', monospace;
            margin-top: 10px;
        ">Refresh Page</button>
    `;
    document.body.appendChild(errorDiv);
}

// Debug functions (can be called from console)
window.debugGame = {
    getGame: () => game,
    getUI: () => ui,
    addScore: (amount) => { if (game) game.score += amount; },
    setWave: (wave) => { if (game) game.wave = wave; },
    setChaos: (level) => { if (game && game.chaosSystem) game.chaosSystem.setChaosLevel(level); },
    spawnEnemy: (type) => { 
        if (game && game.enemyManager) {
            game.enemyManager.spawnEnemy(type || 'grunt', 600, 100);
        }
    },
    godMode: () => {
        if (game && game.player) {
            const health = game.player.getComponent('Health');
            if (health) {
                health.max = 9999;
                health.current = 9999;
            }
        }
    }
};

console.log('Arcade Meltdown loading...');
console.log('Debug functions available at window.debugGame');
