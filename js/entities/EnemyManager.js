// Enemy Manager - Handles enemy creation, spawning, and management
class EnemyManager {
    constructor() {
        this.enemyClasses = {
            'grunt': Grunt,
            'spitter': Spitter,
            'bruiser': Bruiser,
            'miniboss': MiniBoss,
            'boss': Boss
        };
        
        this.spawnPoints = [];
        this.activeEnemies = [];
        this.maxEnemies = 50;
        this.spawnCooldown = 0;
        this.baseSpawnRate = 2000; // milliseconds
        this.currentWave = 1;
        this.enemiesPerWave = 10;
        this.waveMultiplier = 1.2;
        this.bossWaveInterval = 5; // Boss every 5 waves
        this.difficultyScale = 1.0;
    }

    initialize(gameWidth, gameHeight) {
        // Create spawn points around the map edges
        this.createSpawnPoints(gameWidth, gameHeight);
    }

    createSpawnPoints(width, height) {
        const margin = 100;
        const pointsPerSide = 5;
        
        // Top edge
        for (let i = 0; i < pointsPerSide; i++) {
            this.spawnPoints.push({
                x: (i / (pointsPerSide - 1)) * width,
                y: -margin
            });
        }
        
        // Bottom edge
        for (let i = 0; i < pointsPerSide; i++) {
            this.spawnPoints.push({
                x: (i / (pointsPerSide - 1)) * width,
                y: height + margin
            });
        }
        
        // Left edge
        for (let i = 0; i < pointsPerSide; i++) {
            this.spawnPoints.push({
                x: -margin,
                y: (i / (pointsPerSide - 1)) * height
            });
        }
        
        // Right edge
        for (let i = 0; i < pointsPerSide; i++) {
            this.spawnPoints.push({
                x: width + margin,
                y: (i / (pointsPerSide - 1)) * height
            });
        }
    }

    update(deltaTime) {
        // Update spawn cooldown
        if (this.spawnCooldown > 0) {
            this.spawnCooldown -= deltaTime;
        }
        
        // Clean up dead enemies
        this.activeEnemies = this.activeEnemies.filter(enemy => enemy.active);
        
        // Check if should spawn enemies
        if (this.shouldSpawnEnemy()) {
            this.spawnRandomEnemy();
        }
        
        // Update difficulty based on current wave
        this.updateDifficulty();
    }

    shouldSpawnEnemy() {
        // Don't auto-spawn if WaveSystem is managing spawning
        if (window.gameInstance && window.gameInstance.waveSystem && window.gameInstance.waveSystem.waveActive) {
            return false;
        }
        
        return this.spawnCooldown <= 0 && 
               this.activeEnemies.length < this.maxEnemies &&
               this.getActivePlayers().length > 0;
    }

    getActivePlayers() {
        if (!window.gameInstance) return [];
        
        return window.gameInstance.entities
            .filter(entity => entity.hasTag('player') && entity.getComponent('Health') && !entity.getComponent('Health').isDead());
    }

    spawnRandomEnemy() {
        const enemyType = this.selectEnemyType();
        const spawnPoint = this.selectSpawnPoint();
        
        if (spawnPoint) {
            const enemy = this.createEnemy(enemyType, spawnPoint.x, spawnPoint.y);
            if (enemy) {
                this.activeEnemies.push(enemy);
                
                if (window.gameInstance) {
                    window.gameInstance.addEntity(enemy);
                }
                
                // Set spawn cooldown
                const spawnRate = this.baseSpawnRate / this.difficultyScale;
                this.spawnCooldown = spawnRate * (0.8 + Math.random() * 0.4);
            }
        }
    }

    selectEnemyType() {
        // Check if boss wave
        if (this.currentWave % this.bossWaveInterval === 0) {
            return Math.random() < 0.3 ? 'boss' : 'miniboss';
        }
        
        // Weight enemies based on wave number
        const weights = {
            grunt: Math.max(1, 10 - this.currentWave * 0.5),
            spitter: Math.min(8, this.currentWave * 0.3),
            bruiser: Math.min(5, Math.max(0, this.currentWave - 3) * 0.2),
            miniboss: Math.min(2, Math.max(0, this.currentWave - 8) * 0.1)
        };
        
        return this.weightedRandomChoice(weights);
    }

    weightedRandomChoice(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }
        
        return 'grunt'; // Fallback
    }

    selectSpawnPoint() {
        if (this.spawnPoints.length === 0) return null;
        
        const players = this.getActivePlayers();
        if (players.length === 0) return MathUtils.randomChoice(this.spawnPoints);
        
        // Find spawn points that are far from all players
        const validSpawnPoints = this.spawnPoints.filter(point => {
            return players.every(player => {
                const transform = player.getComponent('Transform');
                if (!transform) return true;
                const distance = MathUtils.distance(
                    point.x, point.y,
                    transform.x, transform.y
                );
                return distance > 200; // Minimum distance from players
            });
        });
        
        if (validSpawnPoints.length > 0) {
            return MathUtils.randomChoice(validSpawnPoints);
        }
        
        // If no valid points, use any spawn point
        return MathUtils.randomChoice(this.spawnPoints);
    }

    createEnemy(enemyType, x, y) {
        const EnemyClass = this.enemyClasses[enemyType];
        if (!EnemyClass) {
            console.warn(`Unknown enemy type: ${enemyType}`);
            return null;
        }
        
        const enemy = new EnemyClass(x, y);
        
        // Apply difficulty scaling
        this.applyDifficultyScaling(enemy);
        
        return enemy;
    }

    applyDifficultyScaling(enemy) {
        const health = enemy.getComponent('Health');
        const physics = enemy.getComponent('Physics');
        
        if (health) {
            health.max *= this.difficultyScale;
            health.current = health.max;
        }
        
        if (physics) {
            physics.maxSpeed *= (1 + (this.difficultyScale - 1) * 0.5);
        }
        
        if (enemy.damage) {
            enemy.damage *= this.difficultyScale;
        }
        if (enemy.scoreValue) {
            enemy.scoreValue = Math.floor(enemy.scoreValue * this.difficultyScale);
        }
    }

    updateDifficulty() {
        // Increase difficulty based on wave number
        this.difficultyScale = 1 + (this.currentWave - 1) * 0.1;
        
        // Cap difficulty scaling
        this.difficultyScale = Math.min(this.difficultyScale, 3.0);
    }

    spawnWave(waveNumber) {
        this.currentWave = waveNumber;
        
        // Clear existing enemies for new wave
        this.clearAllEnemies();
        
        // Calculate enemies for this wave
        const enemyCount = Math.floor(this.enemiesPerWave * Math.pow(this.waveMultiplier, waveNumber - 1));
        
        // Spawn wave enemies over time
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                this.spawnRandomEnemy();
            }, i * 500); // Spawn every 0.5 seconds
        }
        
        // Emit wave start event
        if (window.gameInstance) {
            EventManager.emit('wave_started', { wave: waveNumber, enemyCount: enemyCount });
        }
    }

    spawnBoss(bossType = 'boss') {
        // Find center of map or safe spawn location
        const spawnPoint = this.findBossSpawnPoint();
        
        const boss = this.createEnemy(bossType, spawnPoint.x, spawnPoint.y);
        if (boss) {
            this.activeEnemies.push(boss);
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(boss);
            }
            
            // Emit boss spawn event
            if (window.gameInstance) {
                EventManager.emit('boss_spawned', { boss: boss });
            }
        }
        
        return boss;
    }

    findBossSpawnPoint() {
        // Try to spawn boss at center of map
        const centerX = window.gameInstance ? window.gameInstance.canvas.width / 2 : 400;
        const centerY = window.gameInstance ? window.gameInstance.canvas.height / 2 : 300;
        
        const players = this.getActivePlayers();
        
        // If center is too close to players, find alternative
        const tooClose = players.some(player => {
            const transform = player.getComponent('Transform');
            if (!transform) return false;
            const distance = MathUtils.distance(
                centerX, centerY,
                transform.x, transform.y
            );
            return distance < 150;
        });
        
        if (tooClose && this.spawnPoints.length > 0) {
            return MathUtils.randomChoice(this.spawnPoints);
        }
        
        return { x: centerX, y: centerY };
    }

    clearAllEnemies() {
        for (const enemy of this.activeEnemies) {
            if (enemy.active) {
                enemy.destroy();
            }
        }
        this.activeEnemies = [];
    }

    getEnemyCount() {
        return this.activeEnemies.length;
    }

    getEnemyCountByType(enemyType) {
        return this.activeEnemies.filter(enemy => enemy.enemyType === enemyType).length;
    }

    hasActiveBoss() {
        return this.activeEnemies.some(enemy => 
            enemy.enemyType === 'boss' || enemy.enemyType === 'miniboss'
        );
    }

    // Event handlers
    onEnemyKilled(enemy, killer) {
        // Remove from active enemies list
        const index = this.activeEnemies.indexOf(enemy);
        if (index !== -1) {
            this.activeEnemies.splice(index, 1);
        }
        
        // Emit enemy killed event
        if (window.gameInstance) {
            EventManager.emit('enemy_killed', { enemy: enemy, killer: killer, points: enemy.scoreValue || 10 });
        }
        
        // Check if wave is complete
        if (this.activeEnemies.length === 0) {
            this.onWaveComplete();
        }
    }

    onWaveComplete() {
        // Emit wave complete event
        if (window.gameInstance) {
            EventManager.emit('wave_completed', { wave: this.currentWave, bonus: 100 });
        }
        
        // Start next wave after delay
        setTimeout(() => {
            this.spawnWave(this.currentWave + 1);
        }, 3000); // 3 second break between waves
    }

    // Utility methods
    getEnemiesInRadius(x, y, radius) {
        return this.activeEnemies.filter(enemy => {
            const transform = enemy.getComponent('Transform');
            if (!transform) return false;
            const distance = MathUtils.distance(x, y, transform.x, transform.y);
            return distance <= radius;
        });
    }

    getNearestEnemyToPoint(x, y) {
        if (this.activeEnemies.length === 0) return null;
        
        let nearest = null;
        let nearestDistance = Infinity;
        
        for (const enemy of this.activeEnemies) {
            const transform = enemy.getComponent('Transform');
            if (!transform) continue;
            const distance = MathUtils.distance(x, y, transform.x, transform.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = enemy;
            }
        }
        
        return nearest;
    }

    // Serialization
    serialize() {
        return {
            currentWave: this.currentWave,
            difficultyScale: this.difficultyScale,
            activeEnemyCount: this.activeEnemies.length
        };
    }

    deserialize(data) {
        this.currentWave = data.currentWave || 1;
        this.difficultyScale = data.difficultyScale || 1.0;
    }
}

// Global enemy manager instance
window.enemyManager = new EnemyManager();
