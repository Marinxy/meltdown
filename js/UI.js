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
            console.log('Start Game clicked!');
            // Always show class selection first
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

        document.getElementById('startFromClassSelection').addEventListener('click', () => {
            // Check if class is selected
            if (!this.selectedClass) {
                alert('Please select a class first!');
                return;
            }
            
            // Start the game
            this.game.startGame();
            this.showScreen('gameScreen');
            console.log('Game started from class selection');
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
        
        // Setup timer event listeners
        this.setupTimerEventListeners();
    }
    
    setupTimerEventListeners() {
        // Wave countdown timer
        EventManager.on('wave_countdown_update', (data) => {
            this.updateWaveCountdown(data.secondsLeft, data.waveNumber);
        });
        
        // Spawn ETA timer
        EventManager.on('spawn_eta_update', (data) => {
            this.updateSpawnETA(data.secondsLeft, data.enemiesRemaining);
        });
        
        // Boss countdown timer
        EventManager.on('boss_countdown_update', (data) => {
            this.updateBossCountdown(data.secondsLeft, data.waveNumber);
        });
        
        // Wave progress updates
        EventManager.on('wave_progress_update', (data) => {
            this.updateWaveProgress(data);
        });
        
        // Wave started - hide countdown, show progress
        EventManager.on('wave_started', (data) => {
            this.hideWaveCountdown();
            this.showWaveProgress();
            if (!data.isBossWave) {
                this.showSpawnETA();
            }
        });
        
        // Wave completed - hide all timers
        EventManager.on('wave_completed', () => {
            this.hideAllTimers();
        });
    }

    showScreen(screenName) {
        console.log(`Switching to screen: ${screenName}`);
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            console.log(`Successfully switched to ${screenName}`);
        } else {
            console.error(`Screen ${screenName} not found!`);
        }

        // Handle screen-specific logic
        if (screenName === 'mainMenu') {
            try {
                this.game.audioEngine.playMusic('menu_music');
            } catch (e) {
                console.log('Menu music not available - running silently');
            }
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
        
        // Wave countdown display
        const waveCountdownEl = document.getElementById('waveCountdown');
        const countdownTimerEl = document.getElementById('countdownTimer');
        
        if (waveCountdownEl && countdownTimerEl && this.game.waveSystem) {
            if (!this.game.waveSystem.waveActive && this.game.waveSystem.nextWaveTimer > 0) {
                const countdown = Math.ceil(this.game.waveSystem.nextWaveTimer / 1000);
                waveCountdownEl.style.display = 'block';
                countdownTimerEl.textContent = countdown;
            } else {
                waveCountdownEl.style.display = 'none';
            }
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
    
    // Timer update methods
    updateWaveCountdown(secondsLeft, waveNumber) {
        const countdownElement = document.getElementById('waveCountdown');
        const timerElement = document.getElementById('countdownTimer');
        
        if (countdownElement && timerElement) {
            countdownElement.style.display = 'block';
            timerElement.textContent = secondsLeft;
            
            // Add pulsing effect for last 3 seconds
            if (secondsLeft <= 3) {
                timerElement.style.animation = 'pulse 1s infinite';
                timerElement.style.color = '#ff0000';
            } else {
                timerElement.style.animation = 'none';
                timerElement.style.color = '#00ffff';
            }
        }
    }
    
    updateSpawnETA(secondsLeft, enemiesRemaining) {
        const etaElement = document.getElementById('spawnEta');
        const timerElement = document.getElementById('etaTimer');
        
        if (etaElement && timerElement && enemiesRemaining > 0) {
            etaElement.style.display = 'block';
            timerElement.textContent = `${secondsLeft.toFixed(1)}s`;
        } else if (etaElement) {
            etaElement.style.display = 'none';
        }
    }
    
    updateBossCountdown(secondsLeft, waveNumber) {
        const countdownElement = document.getElementById('waveCountdown');
        const timerElement = document.getElementById('countdownTimer');
        const labelElement = countdownElement?.querySelector('.countdown-label');
        
        if (countdownElement && timerElement && labelElement) {
            countdownElement.style.display = 'block';
            labelElement.textContent = 'BOSS INCOMING';
            timerElement.textContent = secondsLeft;
            timerElement.style.color = '#ff0000';
            timerElement.style.animation = 'pulse 0.5s infinite';
        }
    }
    
    updateWaveProgress(data) {
        const progressElement = document.getElementById('waveProgress');
        const fillElement = document.getElementById('progressFill');
        const textElement = document.getElementById('progressText');
        
        if (progressElement && fillElement && textElement) {
            progressElement.style.display = 'block';
            
            const progressPercent = (data.progress * 100).toFixed(1);
            fillElement.style.width = `${progressPercent}%`;
            
            textElement.textContent = `${data.enemiesSpawned}/${data.enemiesToSpawn} spawned, ${data.enemiesAlive} alive`;
        }
    }
    
    // Timer visibility methods
    hideWaveCountdown() {
        const countdownElement = document.getElementById('waveCountdown');
        if (countdownElement) {
            countdownElement.style.display = 'none';
        }
    }
    
    showWaveProgress() {
        const progressElement = document.getElementById('waveProgress');
        if (progressElement) {
            progressElement.style.display = 'block';
        }
    }
    
    showSpawnETA() {
        const etaElement = document.getElementById('spawnEta');
        if (etaElement) {
            etaElement.style.display = 'block';
        }
    }
    
    hideAllTimers() {
        const timers = ['waveCountdown', 'waveProgress', 'spawnEta'];
        timers.forEach(timerId => {
            const element = document.getElementById(timerId);
            if (element) {
                element.style.display = 'none';
            }
        });
    }
}
