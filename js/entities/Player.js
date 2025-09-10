// Player Entity - Represents a player character with class-specific abilities
class Player extends Entity {
    constructor(x, y, playerClass = 'heavy', playerId = null) {
        super();
        this.x = x;
        this.y = y;
        this.playerId = playerId || this.generatePlayerId();
        this.playerClass = playerClass;
        this.weapon = null;
        this.specialCooldown = 0;
        this.specialDuration = 0;
        this.specialActive = false;
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false };
        this.score = 0;
        this.kills = 0;
        this.deaths = 0;
        this.lastDamageTime = 0;
        
        // Add player tag
        this.addTag('player');
        
        // Initialize components based on class
        this.initializeClass();
        
        // Set up input handling
        this.setupInputHandling();
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    initializeClass() {
        const classStats = this.getClassStats();
        
        // Add Transform component
        this.addComponent(new Transform(this.x, this.y, 0));
        
        // Add Physics component
        const physics = new Physics();
        physics.maxSpeed = classStats.speed;
        physics.mass = classStats.mass;
        physics.friction = 0.85;
        physics.collisionRadius = 20;
        this.addComponent(physics);
        
        // Add Health component
        const health = new Health(classStats.health);
        health.onDeath((source) => this.onPlayerDeath(source));
        health.onDamage((damage, source) => this.onPlayerDamage(damage, source));
        this.addComponent(health);
        
        // Initialize weapon based on class
        this.initializeWeapon();
        
        // Add Render component
        const render = new Render('player', classStats.color);
        render.layer = 5; // Players render above enemies
        render.setGlow(10, classStats.color, 0.5);
        this.addComponent(render);
    }

    getClassStats() {
        const stats = {
            heavy: {
                health: 150,
                speed: 120,
                mass: 2,
                color: '#ff4444',
                weapon: 'flamethrower',
                specialCooldown: 8000,
                specialDuration: 5000
            },
            scout: {
                health: 80,
                speed: 300,
                mass: 0.8,
                color: '#44ff44',
                weapon: 'smg',
                specialCooldown: 6000,
                specialDuration: 3000
            },
            engineer: {
                health: 120,
                speed: 160,
                mass: 1.2,
                color: '#4444ff',
                weapon: 'shotgun',
                specialCooldown: 10000,
                specialDuration: 3000
            },
            medic: {
                health: 80,
                speed: 180,
                mass: 0.9,
                color: '#44ffff',
                weapon: 'heal_beam',
                specialCooldown: 12000,
                specialDuration: 8000
            }
        };
        
        return stats[this.playerClass] || stats.heavy;
    }

    initializeWeapon() {
        const classStats = this.getClassStats();
        
        switch (classStats.weapon) {
            case 'flamethrower':
                this.weapon = new Flamethrower(this);
                break;
            case 'smg':
                this.weapon = new SMG(this);
                break;
            case 'shotgun':
                this.weapon = new Shotgun(this);
                break;
            case 'heal_beam':
                this.weapon = new HealBeam(this);
                break;
            default:
                this.weapon = new SMG(this);
        }
    }

    setupInputHandling() {
        // Input will be handled by the main game loop
        // This method can be extended for specific input setup
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Handle input
        this.handleInput(deltaTime);
        
        // Update weapon
        if (this.weapon) {
            this.weapon.update(deltaTime);
        }
        
        // Update special ability cooldown
        if (this.specialCooldown > 0) {
            this.specialCooldown -= deltaTime;
        }
        
        // Update special ability duration
        if (this.specialActive && this.specialDuration > 0) {
            this.specialDuration -= deltaTime;
            if (this.specialDuration <= 0) {
                this.deactivateSpecial();
            }
        }
    }

    handleInput(deltaTime) {
        const physics = this.getComponent('Physics');
        const transform = this.getComponent('Transform');
        
        if (!physics || !transform) return;

        // Movement input
        let moveX = 0;
        let moveY = 0;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }
        
        // Apply movement force
        const moveForce = 800;
        physics.applyForce(moveX * moveForce, moveY * moveForce);
        
        // Rotation (look at mouse)
        if (this.mouse.x !== undefined && this.mouse.y !== undefined) {
            const angle = MathUtils.angle(transform.x, transform.y, this.mouse.x, this.mouse.y);
            transform.rotation = angle;
        }
        
        // Weapon firing
        if (this.mouse.pressed && this.weapon) {
            this.weapon.startShooting();
        } else if (this.weapon) {
            this.weapon.stopShooting();
        }
        
        // Special ability
        if (this.keys['Space'] && this.canUseSpecial()) {
            this.useSpecialAbility();
        }
    }

    // Special abilities
    canUseSpecial() {
        return this.specialCooldown <= 0 && !this.specialActive;
    }

    useSpecialAbility() {
        if (!this.canUseSpecial()) return;
        
        const classStats = this.getClassStats();
        this.specialCooldown = classStats.specialCooldown;
        this.specialDuration = classStats.specialDuration;
        this.specialActive = true;
        
        // Play special ability sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('player_special', {
                position: this.getPosition(),
                spatial: true
            });
        }
        
        // Class-specific special abilities
        switch (this.playerClass) {
            case 'heavy':
                this.activateBerserk();
                break;
            case 'scout':
                this.activateCloak();
                break;
            case 'engineer':
                this.activateShield();
                break;
            case 'medic':
                this.activateTeamBuff();
                break;
        }
        
        // Emit special ability event
        if (window.gameInstance) {
            EventManager.emit('player_specialAbility', this, this.playerClass);
        }
    }

    activateBerserk() {
        // Heavy: Increased damage and fire rate
        if (this.weapon) {
            this.weapon.damageMultiplier = 2.0;
            this.weapon.fireRateMultiplier = 1.5;
        }
        
        // Visual effect
        const render = this.getComponent('Render');
        if (render) {
            render.setGlow(20, '#ff0000', 1.0);
            render.setTint('#ff4444');
        }
    }

    activateCloak() {
        // Scout: Temporary invisibility and speed boost
        const render = this.getComponent('Render');
        const physics = this.getComponent('Physics');
        
        if (render) {
            render.setOpacity(0.3);
            render.setTint('#44ff44');
        }
        
        if (physics) {
            physics.maxSpeed *= 1.5;
        }
        
        // Temporary invulnerability
        const health = this.getComponent('Health');
        if (health) {
            health.setInvulnerable(this.specialDuration);
        }
    }

    activateShield() {
        // Engineer: Energy shield that absorbs damage
        const health = this.getComponent('Health');
        if (health) {
            health.setInvulnerable(this.specialDuration);
        }
        
        // Visual effect
        const render = this.getComponent('Render');
        if (render) {
            render.setGlow(25, '#4444ff', 0.8);
        }
    }

    activateTeamBuff() {
        // Medic: Buff all nearby players
        if (window.gameInstance && window.gameInstance.physicsSystem) {
            const nearbyPlayers = window.gameInstance.physicsSystem
                .getEntitiesInRadius(this.transform.x, this.transform.y, 200)
                .filter(entity => entity.hasTag('player') && entity !== this);
            
            for (const player of nearbyPlayers) {
                const health = player.getComponent('Health');
                const physics = player.getComponent('Physics');
                
                if (health) {
                    health.heal(50);
                    health.regeneration = 10; // 10 HP/sec for duration
                }
                
                if (physics) {
                    physics.maxSpeed *= 1.3;
                }
                
                // Visual effect on buffed players
                const render = player.getComponent('Render');
                if (render) {
                    render.setGlow(15, '#44ffff', 0.6);
                }
            }
        }
    }

    deactivateSpecial() {
        this.specialActive = false;
        this.specialDuration = 0;
        
        // Reset weapon modifiers
        if (this.weapon) {
            this.weapon.damageMultiplier = 1.0;
            this.weapon.fireRateMultiplier = 1.0;
        }
        
        // Reset physics
        const physics = this.getComponent('Physics');
        if (physics) {
            const classStats = this.getClassStats();
            physics.maxSpeed = classStats.speed;
        }
        
        // Reset health effects
        const health = this.getComponent('Health');
        if (health) {
            health.regeneration = 0;
        }
        
        // Reset visual effects
        const render = this.getComponent('Render');
        if (render) {
            const classStats = this.getClassStats();
            render.setOpacity(1.0);
            render.setTint(null);
            render.setGlow(10, classStats.color, 0.5);
        }
    }

    // Event handlers
    onPlayerDamage(damage, source) {
        this.lastDamageTime = Date.now();
        
        // Screen shake on damage
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(5, 200);
        }
        
        // Flash effect
        const render = this.getComponent('Render');
        if (render) {
            render.flash('#ff0000', 150);
        }
        
        // Play damage sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('player_hurt', {
                position: this.getPosition(),
                spatial: true
            });
        }
    }

    onPlayerDeath(source) {
        this.deaths++;
        
        // Create death explosion
        if (window.gameInstance) {
            window.gameInstance.createExplosion(
                this.transform.x,
                this.transform.y,
                { size: 'large', color: '#ff0000' }
            );
            
            // Play death sound
            if (window.gameInstance.audioSystem) {
                window.gameInstance.audioSystem.playSound('player_death', {
                    position: this.getPosition(),
                    spatial: true
                });
            }
            
            // Emit death event
            EventManager.emit('player_death', this, source);
        }
        
        // Respawn after delay (handled by game manager)
        setTimeout(() => {
            this.respawn();
        }, 3000);
    }

    respawn() {
        const health = this.getComponent('Health');
        if (health) {
            health.fullHeal();
            health.setInvulnerable(2000); // 2 seconds spawn protection
        }
        
        // Reset position to spawn point
        if (window.gameInstance) {
            const spawnPoint = window.gameInstance.getSpawnPoint();
            this.setPosition(spawnPoint.x, spawnPoint.y);
        }
        
        // Reset special ability
        this.deactivateSpecial();
        this.specialCooldown = 0;
        
        // Visual spawn effect
        const render = this.getComponent('Render');
        if (render) {
            render.flash('#ffffff', 500);
        }
        
        // Play respawn sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('player_spawn', {
                position: this.getPosition(),
                spatial: true
            });
        }
    }

    // Scoring
    addScore(points) {
        this.score += points;
        
        // Emit score event
        if (window.gameInstance) {
            EventManager.emit('player_score', this, points);
        }
    }

    addKill(victim) {
        this.kills++;
        this.addScore(100);
        
        // Emit kill event
        if (window.gameInstance) {
            EventManager.emit('player_kill', this, victim);
        }
    }

    // Input handling
    setKeys(keys) {
        this.keys = keys;
    }

    setMouse(mouse) {
        this.mouse = mouse;
    }

    // Weapon management
    switchWeapon(weaponType) {
        // For future weapon switching system
        this.initializeWeapon();
    }

    // Serialization for multiplayer
    serialize() {
        return {
            ...super.serialize(),
            playerId: this.playerId,
            playerClass: this.playerClass,
            score: this.score,
            kills: this.kills,
            deaths: this.deaths,
            specialCooldown: this.specialCooldown,
            specialActive: this.specialActive
        };
    }

    static deserialize(data) {
        const player = new Player(0, 0, data.playerClass, data.playerId);
        player.score = data.score || 0;
        player.kills = data.kills || 0;
        player.deaths = data.deaths || 0;
        player.specialCooldown = data.specialCooldown || 0;
        player.specialActive = data.specialActive || false;
        return player;
    }
}
