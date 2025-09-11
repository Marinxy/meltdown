// Main Game Class - Core game loop and state management
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.entities = [];
        this.systems = [];
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.selectedClass = 'heavy';
        this.player = null;
        
        // Game stats
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.startTime = 0;
        
        // Special ability system
        this.specialAbility = {
            cooldown: 0,
            maxCooldown: 5000, // 5 seconds
            isReady: true
        };
        
        // Managers
        this.assetManager = new AssetManager();
        this.audioEngine = new AudioEngine();
        this.enemyManager = null;
        this.waveSystem = null;
        this.chaosSystem = null;
        this.particleSystem = null;
        this.audioSystem = null;
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        
        // Game loop
        this.lastTime = 0;
        this.running = false;
        
        // Don't call initialize in constructor - it will be called by main.js
    }

    async initialize() {
        // Get canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Setup input
        this.setupInput();
        
        // Load assets
        await this.assetManager.preloadAssets();
        
        // Initialize systems
        this.initializeSystems();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Set global game instance for other systems to access
        window.gameInstance = this;
        
        console.log('Game initialized');
    }

    initializeSystems() {
        // Initialize core systems
        this.renderSystem = new RenderSystem(this.ctx);
        this.physicsSystem = new PhysicsSystem();
        this.audioSystem = new AudioSystem(this.audioEngine);
        this.particleSystem = new ParticleSystem();
        this.chaosSystem = new ChaosSystem();
        this.waveSystem = new WaveSystem();
        
        // Add new systems
        this.inputSystem = new InputSystem();
        this.cameraSystem = new CameraSystem(this.canvas);
        this.minimapSystem = new MinimapSystem();
        this.minimapSystem.initialize();
        
        // Initialize managers
        this.enemyManager = new EnemyManager();
        this.enemyManager.initialize(this.canvas.width, this.canvas.height);
        
        // Set global references for systems to access
        window.enemyManager = this.enemyManager;
        window.gameInstance = this;
        
        // Add systems to update list
        this.systems = [
            this.inputSystem,
            this.physicsSystem,
            this.cameraSystem,
            this.waveSystem,
            this.chaosSystem,
            this.particleSystem,
            this.audioSystem,
            this.minimapSystem,
            this.renderSystem
        ];
    }

    setupInput() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle special keys
            if (e.code === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
            
            if (e.code === 'Space' && this.gameState === 'playing' && this.specialAbility.isReady) {
                this.useSpecialAbility();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse input
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.pressed = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.pressed = false;
        });
    }

    setupEventListeners() {
        // Game events
        EventManager.on('player_died', () => {
            this.gameOver();
        });

        EventManager.on('wave_completed', (data) => {
            this.wave = data.wave;
            this.score += data.bonus;
        });

        EventManager.on('enemy_killed', (data) => {
            this.enemiesKilled++;
            this.score += data.points;
        });

        EventManager.on('explosion_damage', (data) => {
            this.handleExplosionDamage(data);
        });
    }

    startGame() {
        console.log('Game.startGame() called - gameState changing to playing');
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        
        // Clear entities
        this.entities = [];
        
        // Create player
        this.createPlayer();
        
        // Start systems
        console.log('Game: Starting wave system...');
        this.waveSystem.startGame();
        console.log('Game: Starting chaos system...');
        this.chaosSystem.resetChaos();
        
        // Show debug display
        const debugDisplay = document.getElementById('debugDisplay');
        if (debugDisplay) {
            debugDisplay.style.display = 'block';
        }
        
        // Start game loop
        this.running = true;
        this.gameLoop();
        
        // Play game music (if available)
        try {
            this.audioEngine.playMusic('game_music');
        } catch (e) {
            console.log('Game music not available - running silently');
        }
        
        console.log('Game started');
    }

    createPlayer() {
        // Create player at center of screen
        this.player = new Player(600, 400, this.selectedClass);
        this.entities.push(this.player);
        
        // Setup player input
        this.player.setKeys(this.keys);
        this.player.setMouse(this.mouse);
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseMenu').style.display = 'flex';
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseMenu').style.display = 'none';
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.running = false;
        
        // Show game over screen
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('finalEnemies').textContent = this.enemiesKilled;
        
        // Stop music
        this.audioEngine.stopMusic();
        
        console.log('Game over');
    }

    gameLoop(currentTime = 0) {
        if (!this.running) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Skip large delta times (tab switching, etc.)
        if (deltaTime > 0.1) {
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        // Update game
        if (this.gameState === 'playing') {
            this.update(deltaTime);
        }
        
        // Render game
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update special ability cooldown
        if (!this.specialAbility.isReady) {
            this.specialAbility.cooldown -= deltaTime * 1000;
            if (this.specialAbility.cooldown <= 0) {
                this.specialAbility.isReady = true;
                this.specialAbility.cooldown = 0;
            }
        }
        
        // Update entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update(deltaTime);
            
            // Remove destroyed entities
            if (entity.destroyed) {
                this.entities.splice(i, 1);
            }
        }
        
        // Update systems (convert deltaTime back to milliseconds)
        for (const system of this.systems) {
            system.update(deltaTime * 1000, this.entities);
        }
        
        // Handle collisions
        this.handleCollisions();
        
        // Update UI
        this.updateUI();
        
        // Update debug display
        this.updateDebugDisplay();
    }

    handleCollisions() {
        // Simple collision detection between entities
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const entityA = this.entities[i];
                const entityB = this.entities[j];
                
                if (this.checkCollision(entityA, entityB)) {
                    entityA.onCollision?.(entityB);
                    entityB.onCollision?.(entityA);
                }
            }
        }
    }

    checkCollision(entityA, entityB) {
        const transformA = entityA.getComponent('Transform');
        const transformB = entityB.getComponent('Transform');
        const renderA = entityA.getComponent('Render');
        const renderB = entityB.getComponent('Render');
        
        if (!transformA || !transformB || !renderA || !renderB) return false;
        
        const dx = transformA.x - transformB.x;
        const dy = transformA.y - transformB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (renderA.width + renderB.width) / 4; // Simple radius-based collision
        
        return distance < minDistance;
    }

    handleExplosionDamage(data) {
        // Apply explosion damage to entities in radius
        for (const entity of this.entities) {
            if (!entity.hasComponent('Transform') || !entity.hasComponent('Health')) continue;
            
            const transform = entity.getComponent('Transform');
            const dx = transform.x - data.x;
            const dy = transform.y - data.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= data.radius && entity !== data.source) {
                const health = entity.getComponent('Health');
                const damageRatio = 1 - (distance / data.radius);
                const damage = data.damage * damageRatio;
                health.takeDamage(damage);
            }
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply camera transform
        this.cameraSystem.applyTransform(this.ctx);
        
        // Render all entities
        this.renderSystem.render(this.ctx, this.entities);
        
        // Reset camera transform
        this.cameraSystem.resetTransform(this.ctx);
        
        // Render UI elements (not affected by camera)
        this.renderUI();
    }

    renderUI() {
        // Basic HUD rendering
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '20px Orbitron';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Wave: ${this.wave}`, 20, 60);
        
        if (this.player) {
            const health = this.player.getComponent('Health');
            if (health) {
                this.ctx.fillText(`Health: ${health.current}/${health.max}`, 20, 90);
            }
        }
    }

    updateUI() {
        if (!this.player) return;
        
        const health = this.player.getComponent('Health');
        if (health) {
            const healthPercent = (health.current / health.max) * 100;
            document.getElementById('healthFill').style.width = `${healthPercent}%`;
            document.getElementById('healthText').textContent = `${health.current}/${health.max}`;
        }
        
        // Update class info display
        const classInfo = document.getElementById('classInfo');
        if (classInfo && this.player.playerClass) {
            classInfo.textContent = this.player.playerClass.toUpperCase();
        }
        
        // Update player statistics
        const killCountElement = document.getElementById('killCount');
        const deathCountElement = document.getElementById('deathCount');
        const speedStatElement = document.getElementById('speedStat');
        
        if (killCountElement) {
            killCountElement.textContent = this.player.kills || 0;
        }
        if (deathCountElement) {
            deathCountElement.textContent = this.player.deaths || 0;
        }
        if (speedStatElement) {
            const physics = this.player.getComponent('Physics');
            const currentSpeed = physics ? Math.round(physics.maxSpeed) : 0;
            speedStatElement.textContent = currentSpeed;
        }
        
        document.getElementById('waveNumber').textContent = this.wave;
        document.getElementById('score').textContent = this.score;
        document.getElementById('enemiesLeft').textContent = this.enemiesRemaining;
        
        // Update chaos meter
        const chaosLevel = this.chaosSystem ? this.chaosSystem.chaosLevel : 0;
        document.getElementById('chaosFill').style.width = `${chaosLevel * 100}%`;
        
        // Update special ability cooldown
        const abilityCooldownElement = document.getElementById('abilityCooldown');
        if (abilityCooldownElement) {
            if (this.specialAbility.isReady) {
                abilityCooldownElement.style.transform = 'scaleY(0)';
                abilityCooldownElement.textContent = '';
            } else {
                const cooldownPercent = this.specialAbility.cooldown / this.specialAbility.maxCooldown;
                abilityCooldownElement.style.transform = `scaleY(${cooldownPercent})`;
                const secondsLeft = Math.ceil(this.specialAbility.cooldown / 1000);
                abilityCooldownElement.textContent = secondsLeft > 0 ? secondsLeft : '';
            }
        }
    }
    
    updateDebugDisplay() {
        const gameStateEl = document.getElementById('debugGameState');
        const waveActiveEl = document.getElementById('debugWaveActive');
        const currentWaveEl = document.getElementById('debugCurrentWave');
        const nextWaveTimerEl = document.getElementById('debugNextWaveTimer');
        const waveStartCountdownEl = document.getElementById('debugWaveStartCountdown');
        
        if (gameStateEl) gameStateEl.textContent = this.state;
        if (waveActiveEl) waveActiveEl.textContent = this.waveSystem ? 'YES' : 'NO';
        if (currentWaveEl && this.waveSystem) currentWaveEl.textContent = this.waveSystem.currentWave;
        if (nextWaveTimerEl && this.waveSystem) nextWaveTimerEl.textContent = Math.ceil(this.waveSystem.nextWaveTimer / 1000);
        if (waveStartCountdownEl && this.waveSystem) waveStartCountdownEl.textContent = Math.ceil(this.waveSystem.waveStartCountdown / 1000);
    }

    addEntity(entity) {
        this.entities.push(entity);
        console.log(`Added entity to game: ${entity.constructor.name}, total entities: ${this.entities.length}`);
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    createExplosion(x, y, options = {}) {
        const radius = options.size === 'small' ? 20 : options.radius || 30;
        const damage = options.damage || 0;
        const explosion = new Explosion(x, y, radius, damage, null);
        this.addEntity(explosion);
        return explosion;
    }

    setSelectedClass(className) {
        this.selectedClass = className;
    }
    
    useSpecialAbility() {
        if (!this.player || !this.specialAbility.isReady) return;
        
        const playerTransform = this.player.getComponent('Transform');
        if (!playerTransform) return;
        
        // Create large explosion at player position
        this.createExplosion(playerTransform.x, playerTransform.y, {
            radius: 100,
            damage: 150
        });
        
        // Start cooldown
        this.specialAbility.isReady = false;
        this.specialAbility.cooldown = this.specialAbility.maxCooldown;
        
        // Play special ability sound
        try {
            this.audioEngine.playSound('special_ability');
        } catch (e) {
            console.log('Special ability sound not available');
        }
    }
}
