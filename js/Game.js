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
        // Create core systems
        this.physicsSystem = new PhysicsSystem();
        this.systems.push(this.physicsSystem);
        this.systems.push(new RenderSystem(this.ctx));
        this.audioSystem = new AudioSystem();
        this.systems.push(this.audioSystem);
        
        // Create game systems
        this.enemyManager = new EnemyManager();
        this.waveSystem = new WaveSystem();
        this.chaosSystem = new ChaosSystem();
        this.particleSystem = new ParticleSystem();
        
        // Initialize enemy manager with canvas dimensions
        this.enemyManager.initialize(this.canvas.width, this.canvas.height);
        
        // Set global reference for WaveSystem
        window.enemyManager = this.enemyManager;
        
        this.systems.push(this.enemyManager);
        this.systems.push(this.waveSystem);
        this.systems.push(this.chaosSystem);
        this.systems.push(this.particleSystem);
        
        // Sort systems by priority
        this.systems.sort((a, b) => (a.priority || 0) - (b.priority || 0));
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
        this.waveSystem.startGame();
        this.chaosSystem.resetChaos();
        
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
        // Update entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update(deltaTime);
            
            // Remove destroyed entities
            if (entity.destroyed) {
                this.entities.splice(i, 1);
            }
        }
        
        // Update systems
        for (const system of this.systems) {
            system.update(deltaTime, this.entities);
        }
        
        // Handle collisions
        this.handleCollisions();
        
        // Update UI
        this.updateUI();
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
        
        // Render systems handle entity rendering
        for (const system of this.systems) {
            if (system.render) {
                system.render(this.ctx, this.entities);
            }
        }
        
        // Render entities that have custom render methods
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(this.ctx);
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
        
        document.getElementById('waveNumber').textContent = this.wave;
        document.getElementById('score').textContent = this.score;
        
        // Update chaos meter
        const chaosLevel = this.chaosSystem ? this.chaosSystem.chaosLevel : 0;
        document.getElementById('chaosFill').style.width = `${chaosLevel * 100}%`;
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

    setSelectedClass(className) {
        this.selectedClass = className;
    }
}
