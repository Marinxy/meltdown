// Wave System - Manages wave-based enemy spawning with escalating difficulty
class WaveSystem extends System {
    constructor() {
        super();
        this.currentWave = 0;
        this.waveActive = false;
        this.waveStartTime = 0;
        this.waveDuration = 60000; // 60 seconds per wave
        this.timeBetweenWaves = 10000; // 10 seconds between waves
        this.nextWaveTimer = 0;
        this.waveComplete = false;
        
        // Wave configuration
        this.baseEnemiesPerWave = 8;
        this.enemyIncreasePerWave = 2;
        this.difficultyMultiplier = 1.0;
        this.bossWaveInterval = 5; // Boss every 5 waves
        this.maxConcurrentEnemies = 25;
        
        // Spawn timing
        this.spawnTimer = 0;
        this.baseSpawnInterval = 3000; // 3 seconds between spawns
        this.spawnVariation = 1000; // ±1 second variation
        
        // Wave composition (percentages)
        this.waveComposition = {
            1: { grunt: 100, spitter: 0, bruiser: 0, miniboss: 0 },
            2: { grunt: 80, spitter: 20, bruiser: 0, miniboss: 0 },
            3: { grunt: 70, spitter: 25, bruiser: 5, miniboss: 0 },
            4: { grunt: 60, spitter: 30, bruiser: 10, miniboss: 0 },
            5: { grunt: 40, spitter: 30, bruiser: 20, miniboss: 10 }, // First boss wave
            6: { grunt: 50, spitter: 35, bruiser: 15, miniboss: 0 },
            7: { grunt: 45, spitter: 35, bruiser: 20, miniboss: 0 },
            8: { grunt: 40, spitter: 30, bruiser: 25, miniboss: 5 },
            9: { grunt: 35, spitter: 35, bruiser: 25, miniboss: 5 },
            10: { grunt: 20, spitter: 30, bruiser: 30, miniboss: 20 } // Major boss wave
        };
        
        // Statistics
        this.enemiesSpawnedThisWave = 0;
        this.enemiesToSpawnThisWave = 0;
        this.totalEnemiesKilled = 0;
        this.waveStartDelay = 3000; // 3 second countdown before wave starts
        this.waveStartCountdown = 0;
        
        // Events
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (window.gameInstance && window.gameInstance.eventManager) {
            // Listen for enemy deaths
            window.gameInstance.eventManager.on('enemy:killed', (enemy, killer) => {
                this.onEnemyKilled(enemy, killer);
            });
            
            // Listen for boss defeats
            window.gameInstance.eventManager.on('boss:defeated', (boss, killer) => {
                this.onBossDefeated(boss, killer);
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.waveActive && this.nextWaveTimer > 0) {
            // Countdown to next wave
            this.nextWaveTimer -= deltaTime;
            
            if (this.waveStartCountdown > 0) {
                this.waveStartCountdown -= deltaTime;
                this.updateWaveStartCountdown();
            }
            
            if (this.nextWaveTimer <= 0) {
                this.startNextWave();
            }
        } else if (this.waveActive) {
            // Update active wave
            this.updateActiveWave(deltaTime);
        }
    }

    startGame() {
        this.currentWave = 0;
        this.totalEnemiesKilled = 0;
        this.difficultyMultiplier = 1.0;
        this.prepareNextWave();
    }

    prepareNextWave() {
        this.currentWave++;
        this.waveActive = false;
        this.waveComplete = false;
        this.nextWaveTimer = this.timeBetweenWaves;
        this.waveStartCountdown = this.waveStartDelay;
        
        // Calculate wave parameters
        this.calculateWaveParameters();
        
        // Emit wave preparation event
        if (window.gameInstance) {
            EventManager.emit('wave_preparing', {
                waveNumber: this.currentWave,
                timeUntilStart: this.nextWaveTimer,
                enemyCount: this.enemiesToSpawnThisWave,
                isBossWave: this.isBossWave()
            });
        }
        
        // Update UI
        this.updateWaveUI();
    }

    calculateWaveParameters() {
        // Calculate number of enemies for this wave
        this.enemiesToSpawnThisWave = this.baseEnemiesPerWave + 
            (this.currentWave - 1) * this.enemyIncreasePerWave;
        
        // Apply difficulty scaling
        this.difficultyMultiplier = 1.0 + (this.currentWave - 1) * 0.15;
        this.difficultyMultiplier = Math.min(this.difficultyMultiplier, 4.0); // Cap at 4x
        
        // Adjust spawn timing based on wave
        const spawnSpeedMultiplier = 1.0 + (this.currentWave - 1) * 0.1;
        this.currentSpawnInterval = Math.max(
            1000, // Minimum 1 second between spawns
            this.baseSpawnInterval / spawnSpeedMultiplier
        );
        
        // Reset wave counters
        this.enemiesSpawnedThisWave = 0;
        this.spawnTimer = 0;
    }

    startNextWave() {
        this.waveActive = true;
        this.waveStartTime = Date.now();
        this.nextWaveTimer = 0;
        this.waveStartCountdown = 0;
        
        // Clear any remaining enemies from previous wave
        if (window.enemyManager) {
            // Don't clear bosses, let them carry over
            this.clearNonBossEnemies();
        }
        
        // Emit wave start event
        if (window.gameInstance) {
            EventManager.emit('wave_started', {
                waveNumber: this.currentWave,
                enemyCount: this.enemiesToSpawnThisWave,
                isBossWave: this.isBossWave(),
                difficultyMultiplier: this.difficultyMultiplier
            });
        }
        
        // Special handling for boss waves
        if (this.isBossWave()) {
            this.handleBossWave();
        }
        
        // Play wave start sound
        this.playWaveStartSound();
        
        // Update UI
        this.updateWaveUI();
    }

    updateActiveWave(deltaTime) {
        // Update spawn timer
        this.spawnTimer -= deltaTime;
        
        // Spawn enemies if needed
        if (this.shouldSpawnEnemy()) {
            this.spawnWaveEnemy();
            this.resetSpawnTimer();
        }
        
        // Check wave completion conditions
        this.checkWaveCompletion();
    }

    shouldSpawnEnemy() {
        return this.spawnTimer <= 0 && 
               this.enemiesSpawnedThisWave < this.enemiesToSpawnThisWave &&
               this.getCurrentEnemyCount() < this.maxConcurrentEnemies &&
               this.hasActivePlayers();
    }

    spawnWaveEnemy() {
        const enemyType = this.selectEnemyTypeForWave();
        
        if (window.enemyManager) {
            const spawnPoint = window.enemyManager.selectSpawnPoint();
            if (spawnPoint) {
                const enemy = window.enemyManager.createEnemy(enemyType, spawnPoint.x, spawnPoint.y);
                if (enemy) {
                    // Apply wave-specific scaling
                    this.applyWaveScaling(enemy);
                    
                    window.enemyManager.activeEnemies.push(enemy);
                    if (window.gameInstance) {
                        window.gameInstance.addEntity(enemy);
                    }
                    
                    this.enemiesSpawnedThisWave++;
                    
                    // Emit spawn event
                    if (window.gameInstance) {
                        EventManager.emit('enemy_spawned', {
                            enemy: enemy,
                            waveNumber: this.currentWave,
                            spawnIndex: this.enemiesSpawnedThisWave
                        });
                    }
                }
            }
        }
    }

    selectEnemyTypeForWave() {
        const composition = this.getWaveComposition();
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const [enemyType, percentage] of Object.entries(composition)) {
            cumulative += percentage;
            if (random <= cumulative) {
                return enemyType;
            }
        }
        
        return 'grunt'; // Fallback
    }

    getWaveComposition() {
        // Use predefined composition or calculate for higher waves
        if (this.waveComposition[this.currentWave]) {
            return this.waveComposition[this.currentWave];
        }
        
        // For waves beyond predefined, use scaling formula
        const waveLevel = Math.min(this.currentWave, 20); // Cap scaling at wave 20
        return {
            grunt: Math.max(20, 60 - waveLevel * 2),
            spitter: Math.min(40, 20 + waveLevel * 1),
            bruiser: Math.min(30, waveLevel * 1.5),
            miniboss: Math.min(10, Math.max(0, waveLevel - 5) * 0.5)
        };
    }

    applyWaveScaling(enemy) {
        const health = enemy.getComponent('Health');
        const physics = enemy.getComponent('Physics');
        
        if (health) {
            health.maxHealth *= this.difficultyMultiplier;
            health.currentHealth = health.maxHealth;
        }
        
        if (physics) {
            physics.maxSpeed *= (1 + (this.difficultyMultiplier - 1) * 0.3);
        }
        
        enemy.damage *= this.difficultyMultiplier;
        enemy.scoreValue = Math.floor(enemy.scoreValue * this.difficultyMultiplier);
        
        // Visual indicator for scaled enemies
        const render = enemy.getComponent('Render');
        if (render && this.difficultyMultiplier > 2.0) {
            render.setTint('#ff4444'); // Red tint for high-difficulty enemies
        }
    }

    resetSpawnTimer() {
        const variation = (Math.random() - 0.5) * this.spawnVariation;
        this.spawnTimer = this.currentSpawnInterval + variation;
    }

    checkWaveCompletion() {
        // Wave is complete when all enemies are spawned and killed
        const allEnemiesSpawned = this.enemiesSpawnedThisWave >= this.enemiesToSpawnThisWave;
        const noEnemiesRemaining = this.getCurrentEnemyCount() === 0;
        
        if (allEnemiesSpawned && noEnemiesRemaining && !this.waveComplete) {
            this.completeWave();
        }
    }

    completeWave() {
        this.waveComplete = true;
        this.waveActive = false;
        
        // Calculate wave completion stats
        const waveTime = Date.now() - this.waveStartTime;
        const waveStats = {
            waveNumber: this.currentWave,
            completionTime: waveTime,
            enemiesKilled: this.enemiesToSpawnThisWave,
            isBossWave: this.isBossWave()
        };
        
        // Emit wave completion event
        if (window.gameInstance) {
            EventManager.emit('wave_completed', waveStats);
        }
        
        // Award wave completion bonus
        this.awardWaveCompletionBonus();
        
        // Play wave complete sound
        this.playWaveCompleteSound();
        
        // Prepare next wave
        setTimeout(() => {
            this.prepareNextWave();
        }, 2000); // 2 second delay before preparing next wave
    }

    handleBossWave() {
        // Spawn boss after a delay
        setTimeout(() => {
            if (window.enemyManager) {
                const bossType = this.currentWave % 10 === 0 ? 'boss' : 'miniboss';
                window.enemyManager.spawnBoss(bossType);
            }
        }, 5000); // 5 second delay for dramatic effect
        
        // Reduce regular enemy spawns for boss waves
        this.enemiesToSpawnThisWave = Math.floor(this.enemiesToSpawnThisWave * 0.5);
    }

    isBossWave() {
        return this.currentWave % this.bossWaveInterval === 0;
    }

    getCurrentEnemyCount() {
        return window.enemyManager ? window.enemyManager.getEnemyCount() : 0;
    }

    hasActivePlayers() {
        if (!window.gameInstance || !window.gameInstance.physicsSystem) return false;
        
        return window.gameInstance.physicsSystem.entities
            .some(entity => entity.hasTag('player') && !entity.getComponent('Health').isDead());
    }

    clearNonBossEnemies() {
        if (!window.enemyManager) return;
        
        const enemiesToRemove = window.enemyManager.activeEnemies.filter(enemy => 
            enemy.enemyType !== 'boss' && enemy.enemyType !== 'miniboss'
        );
        
        for (const enemy of enemiesToRemove) {
            enemy.destroy();
        }
        
        window.enemyManager.activeEnemies = window.enemyManager.activeEnemies.filter(enemy =>
            enemy.enemyType === 'boss' || enemy.enemyType === 'miniboss'
        );
    }

    awardWaveCompletionBonus() {
        if (!window.gameInstance || !window.gameInstance.physicsSystem) return;
        
        const players = window.gameInstance.physicsSystem.entities
            .filter(entity => entity.hasTag('player'));
        
        const bonusScore = 100 * this.currentWave;
        
        for (const player of players) {
            player.score += bonusScore;
            
            // Emit score bonus event
            if (window.gameInstance) {
                EventManager.emit('player_scoreBonus', {
                    player: player,
                    bonus: bonusScore,
                    reason: 'wave_completion'
                });
            }
        }
    }

    updateWaveStartCountdown() {
        const secondsLeft = Math.ceil(this.waveStartCountdown / 1000);
        
        if (window.gameInstance) {
            EventManager.emit('wave_countdown', {
                secondsLeft: secondsLeft,
                waveNumber: this.currentWave
            });
        }
    }

    updateWaveUI() {
        if (window.gameInstance) {
            EventManager.emit('ui_updateWave', {
                currentWave: this.currentWave,
                enemiesRemaining: this.enemiesToSpawnThisWave - this.enemiesSpawnedThisWave,
                enemiesAlive: this.getCurrentEnemyCount(),
                waveActive: this.waveActive,
                nextWaveIn: Math.ceil(this.nextWaveTimer / 1000)
            });
        }
    }

    playWaveStartSound() {
        if (window.gameInstance && window.gameInstance.audioSystem) {
            const soundName = this.isBossWave() ? 'wave_boss_start' : 'wave_start';
            window.gameInstance.audioSystem.playSound(soundName, {
                spatial: false,
                volume: 1.0
            });
        }
    }

    playWaveCompleteSound() {
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('wave_complete', {
                spatial: false,
                volume: 1.0
            });
        }
    }

    // Event handlers
    onEnemyKilled(enemy, killer) {
        this.totalEnemiesKilled++;
        
        // Update chaos meter based on kills
        if (window.gameInstance && window.gameInstance.chaosSystem) {
            window.gameInstance.chaosSystem.addChaos(10);
        }
    }

    onBossDefeated(boss, killer) {
        // Boss defeats provide major chaos increase
        if (window.gameInstance && window.gameInstance.chaosSystem) {
            window.gameInstance.chaosSystem.addChaos(100);
        }
        
        // Award special boss defeat bonus
        if (killer && killer.hasTag && killer.hasTag('player')) {
            const bossBonus = 1000 * this.currentWave;
            killer.score += bossBonus;
            
            if (window.gameInstance) {
                EventManager.emit('player_scoreBonus', {
                    player: killer,
                    bonus: bossBonus,
                    reason: 'boss_defeat'
                });
            }
        }
    }

    // Utility methods
    getWaveProgress() {
        if (!this.waveActive) return 1.0;
        
        const enemiesProgress = this.enemiesSpawnedThisWave / this.enemiesToSpawnThisWave;
        const aliveEnemies = this.getCurrentEnemyCount();
        const killProgress = aliveEnemies === 0 ? 1.0 : 0.5;
        
        return Math.min(1.0, enemiesProgress * 0.5 + killProgress * 0.5);
    }

    getWaveStats() {
        return {
            currentWave: this.currentWave,
            waveActive: this.waveActive,
            enemiesSpawned: this.enemiesSpawnedThisWave,
            enemiesToSpawn: this.enemiesToSpawnThisWave,
            enemiesAlive: this.getCurrentEnemyCount(),
            totalKilled: this.totalEnemiesKilled,
            difficultyMultiplier: this.difficultyMultiplier,
            nextWaveIn: Math.ceil(this.nextWaveTimer / 1000),
            isBossWave: this.isBossWave()
        };
    }

    // Serialization
    serialize() {
        return {
            currentWave: this.currentWave,
            waveActive: this.waveActive,
            totalEnemiesKilled: this.totalEnemiesKilled,
            difficultyMultiplier: this.difficultyMultiplier,
            enemiesSpawnedThisWave: this.enemiesSpawnedThisWave,
            enemiesToSpawnThisWave: this.enemiesToSpawnThisWave
        };
    }

    deserialize(data) {
        this.currentWave = data.currentWave || 0;
        this.waveActive = data.waveActive || false;
        this.totalEnemiesKilled = data.totalEnemiesKilled || 0;
        this.difficultyMultiplier = data.difficultyMultiplier || 1.0;
        this.enemiesSpawnedThisWave = data.enemiesSpawnedThisWave || 0;
        this.enemiesToSpawnThisWave = data.enemiesToSpawnThisWave || 0;
    }
}
