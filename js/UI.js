// UI Manager - Handles menu navigation and UI interactions
class UI {
    constructor(game) {
        this.game = game;
        this.currentScreen = 'mainMenu';
        this.selectedClass = 'heavy';
        
        this.setupEventListeners();
        this.showScreen('mainMenu');
    }

    setupEventListeners() {
        // Main Menu buttons
        document.getElementById('startGame').addEventListener('click', () => {
            this.game.startGame();
            this.showScreen('gameScreen');
        });

        document.getElementById('classSelect').addEventListener('click', () => {
            this.showScreen('classSelection');
        });

        // Class Selection
        document.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
                
                // Select new class
                card.classList.add('selected');
                this.selectedClass = card.dataset.class;
                this.game.setSelectedClass(this.selectedClass);
                
                // Update UI
                this.updateClassInfo();
            });
        });

        document.getElementById('backToMenu').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });

        // Pause Menu
        document.getElementById('resumeGame').addEventListener('click', () => {
            this.game.resumeGame();
        });

        document.getElementById('restartGame').addEventListener('click', () => {
            this.game.startGame();
            document.getElementById('pauseMenu').style.display = 'none';
        });

        document.getElementById('quitGame').addEventListener('click', () => {
            this.game.gameState = 'menu';
            this.game.running = false;
            this.showScreen('mainMenu');
            document.getElementById('pauseMenu').style.display = 'none';
        });

        // Game Over Screen
        document.getElementById('playAgain').addEventListener('click', () => {
            this.game.startGame();
            document.getElementById('gameOverScreen').style.display = 'none';
            this.showScreen('gameScreen');
        });

        document.getElementById('backToMenuFromGame').addEventListener('click', () => {
            this.showScreen('mainMenu');
            document.getElementById('gameOverScreen').style.display = 'none';
        });

        // Initial class selection
        document.querySelector(`[data-class="${this.selectedClass}"]`).classList.add('selected');
        this.updateClassInfo();
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(screenName).classList.add('active');
        this.currentScreen = screenName;

        // Handle screen-specific logic
        if (screenName === 'mainMenu') {
            this.game.audioEngine.playMusic('menu_music');
        }
    }

    updateClassInfo() {
        const classData = {
            heavy: { icon: '🔥', name: 'HEAVY' },
            scout: { icon: '⚡', name: 'SCOUT' },
            engineer: { icon: '🔧', name: 'ENGINEER' },
            medic: { icon: '💚', name: 'MEDIC' }
        };

        const data = classData[this.selectedClass];
        if (data) {
            document.getElementById('classInfo').textContent = data.name;
            
            // Update special ability icon
            const abilityIcon = document.querySelector('.ability-icon');
            if (abilityIcon) {
                abilityIcon.textContent = data.icon;
            }
        }
    }

    updateGameUI(gameData) {
        // Update health bar
        if (gameData.health) {
            const healthPercent = (gameData.health.current / gameData.health.max) * 100;
            document.getElementById('healthFill').style.width = `${healthPercent}%`;
            document.getElementById('healthText').textContent = `${gameData.health.current}/${gameData.health.max}`;
        }

        // Update wave info
        if (gameData.wave !== undefined) {
            document.getElementById('waveNumber').textContent = gameData.wave;
        }

        // Update score
        if (gameData.score !== undefined) {
            document.getElementById('score').textContent = gameData.score;
        }

        // Update enemies left
        if (gameData.enemiesLeft !== undefined) {
            document.getElementById('enemiesLeft').textContent = gameData.enemiesLeft;
        }

        // Update chaos meter
        if (gameData.chaosLevel !== undefined) {
            const chaosPercent = gameData.chaosLevel * 100;
            document.getElementById('chaosFill').style.width = `${chaosPercent}%`;
            
            // Update chaos meter color based on level
            const chaosFill = document.getElementById('chaosFill');
            if (gameData.chaosLevel < 0.3) {
                chaosFill.style.backgroundColor = '#00ff00';
            } else if (gameData.chaosLevel < 0.6) {
                chaosFill.style.backgroundColor = '#ffff00';
            } else if (gameData.chaosLevel < 0.8) {
                chaosFill.style.backgroundColor = '#ff8800';
            } else {
                chaosFill.style.backgroundColor = '#ff0000';
            }
        }

        // Update special ability cooldown
        if (gameData.abilityCooldown !== undefined) {
            const cooldownElement = document.getElementById('abilityCooldown');
            if (gameData.abilityCooldown > 0) {
                cooldownElement.style.display = 'block';
                cooldownElement.style.height = `${(gameData.abilityCooldown / gameData.abilityMaxCooldown) * 100}%`;
            } else {
                cooldownElement.style.display = 'none';
            }
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 5px;
            border-left: 4px solid ${type === 'error' ? '#ff0000' : type === 'warning' ? '#ffaa00' : '#00ff00'};
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    showWaveStart(waveNumber) {
        const waveAnnouncement = document.createElement('div');
        waveAnnouncement.className = 'wave-announcement';
        waveAnnouncement.innerHTML = `
            <div class="wave-text">WAVE ${waveNumber}</div>
            <div class="wave-subtext">INCOMING HOSTILES</div>
        `;
        
        waveAnnouncement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #00ffff;
            font-family: 'Orbitron', monospace;
            font-weight: 900;
            text-shadow: 0 0 20px #00ffff;
            z-index: 999;
            animation: waveAnnounce 2s ease-out;
        `;

        document.body.appendChild(waveAnnouncement);

        setTimeout(() => {
            if (waveAnnouncement.parentNode) {
                waveAnnouncement.parentNode.removeChild(waveAnnouncement);
            }
        }, 2000);
    }

    showBossWarning() {
        this.showNotification('⚠️ BOSS INCOMING ⚠️', 'warning', 5000);
        
        // Screen flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.3);
            z-index: 998;
            pointer-events: none;
            animation: bossFlash 0.5s ease-out;
        `;
        
        document.body.appendChild(flash);
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 500);
    }
}
