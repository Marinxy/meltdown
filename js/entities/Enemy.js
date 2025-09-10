// Base Enemy Class - Foundation for all enemy types
class Enemy extends Entity {
    constructor(x, y, enemyType = 'grunt') {
        super();
        this.enemyType = enemyType;
        this.target = null;
        this.lastTargetUpdate = 0;
        this.targetUpdateInterval = 500; // Update target every 500ms
        this.attackCooldown = 0;
        this.lastAttackTime = 0;
        this.behaviorState = 'idle'; // idle, seeking, attacking, fleeing
        this.pathfinding = [];
        this.currentPathIndex = 0;
        this.stuckTimer = 0;
        this.maxStuckTime = 2000;
        this.lastPosition = { x: 0, y: 0 };
        this.aggroRange = 300;
        this.attackRange = 50;
        this.fleeThreshold = 0.2; // Flee when health below 20%
        this.scoreValue = 10;
        
        // Add enemy tag
        this.addTag('enemy');
        
        // Initialize enemy based on type
        this.initializeEnemyType();
        
        // Set up AI behavior
        this.setupAI();
    }

    initializeEnemyType() {
        const enemyStats = this.getEnemyStats();
        
        // Add Transform component
        const transform = new Transform(0, 0, 0);
        this.addComponent(transform);
        
        // Add Physics component
        const physics = new Physics();
        physics.maxSpeed = enemyStats.speed;
        physics.mass = enemyStats.mass;
        physics.friction = 0.8;
        physics.collisionRadius = enemyStats.size;
        this.addComponent(physics);
        
        // Add Health component
        const health = new Health(enemyStats.health);
        health.onDeath((source) => this.onEnemyDeath(source));
        health.onDamage((damage, source) => this.onEnemyDamage(damage, source));
        this.addComponent(health);
        
        // Add Render component
        const render = new Render('enemy', enemyStats.color);
        render.layer = 2; // Enemies render below players
        render.setGlow(8, enemyStats.color, 0.6);
        render.setScale(enemyStats.scale || 1.0);
        this.addComponent(render);
        
        // Set enemy-specific properties
        this.damage = enemyStats.damage;
        this.attackRate = enemyStats.attackRate;
        this.aggroRange = enemyStats.aggroRange;
        this.attackRange = enemyStats.attackRange;
        this.scoreValue = enemyStats.scoreValue;
    }

    getEnemyStats() {
        const stats = {
            grunt: {
                health: 50,
                speed: 100,
                mass: 1,
                size: 15,
                color: '#ff6666',
                damage: 20,
                attackRate: 1000,
                aggroRange: 250,
                attackRange: 40,
                scoreValue: 10,
                scale: 1.0
            },
            spitter: {
                health: 30,
                speed: 80,
                mass: 0.8,
                size: 12,
                color: '#66ff66',
                damage: 15,
                attackRate: 2000,
                aggroRange: 400,
                attackRange: 200,
                scoreValue: 15,
                scale: 0.8
            },
            bruiser: {
                health: 120,
                speed: 60,
                mass: 3,
                size: 25,
                color: '#6666ff',
                damage: 40,
                attackRate: 1500,
                aggroRange: 200,
                attackRange: 60,
                scoreValue: 25,
                scale: 1.5
            },
            miniboss: {
                health: 300,
                speed: 80,
                mass: 5,
                size: 35,
                color: '#ff66ff',
                damage: 60,
                attackRate: 800,
                aggroRange: 350,
                attackRange: 80,
                scoreValue: 100,
                scale: 2.0
            },
            boss: {
                health: 800,
                speed: 120,
                mass: 10,
                size: 50,
                color: '#ffff66',
                damage: 100,
                attackRate: 500,
                aggroRange: 500,
                attackRange: 100,
                scoreValue: 500,
                scale: 3.0
            }
        };
        
        return stats[this.enemyType] || stats.grunt;
    }

    setupAI() {
        // AI will be updated in the update method
        this.aiUpdateInterval = 100; // Update AI every 100ms
        this.lastAIUpdate = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update AI behavior
        this.updateAI(deltaTime);
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Check if stuck and handle
        this.handleStuckDetection(deltaTime);
    }

    updateAI(deltaTime) {
        const currentTime = Date.now();
        
        // Throttle AI updates for performance
        if (currentTime - this.lastAIUpdate < this.aiUpdateInterval) {
            return;
        }
        this.lastAIUpdate = currentTime;
        
        // Update target
        this.updateTarget();
        
        // Execute behavior based on current state
        switch (this.behaviorState) {
            case 'idle':
                this.idleBehavior();
                break;
            case 'seeking':
                this.seekingBehavior();
                break;
            case 'attacking':
                this.attackingBehavior();
                break;
            case 'fleeing':
                this.fleeingBehavior();
                break;
        }
        
        // Update behavior state
        this.updateBehaviorState();
    }

    updateTarget() {
        const currentTime = Date.now();
        
        // Throttle target updates
        if (currentTime - this.lastTargetUpdate < this.targetUpdateInterval) {
            return;
        }
        this.lastTargetUpdate = currentTime;
        
        // Find nearest player
        if (window.gameInstance && window.gameInstance.physicsSystem) {
            const nearbyPlayers = window.gameInstance.physicsSystem
                .getEntitiesInRadius(this.transform.x, this.transform.y, this.aggroRange)
                .filter(entity => entity.hasTag('player') && !entity.getComponent('Health').isDead());
            
            if (nearbyPlayers.length > 0) {
                // Find closest player
                let closestPlayer = null;
                let closestDistance = Infinity;
                
                for (const player of nearbyPlayers) {
                    const distance = this.transform.distanceTo(player.transform);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPlayer = player;
                    }
                }
                
                this.target = closestPlayer;
            } else {
                this.target = null;
            }
        }
    }

    updateBehaviorState() {
        const health = this.getComponent('Health');
        
        // Check if should flee
        if (health && health.getHealthPercentage() < this.fleeThreshold) {
            this.behaviorState = 'fleeing';
            return;
        }
        
        if (!this.target) {
            this.behaviorState = 'idle';
            return;
        }
        
        const distanceToTarget = this.transform.distanceTo(this.target.transform);
        
        if (distanceToTarget <= this.attackRange) {
            this.behaviorState = 'attacking';
        } else if (distanceToTarget <= this.aggroRange) {
            this.behaviorState = 'seeking';
        } else {
            this.behaviorState = 'idle';
        }
    }

    idleBehavior() {
        // Wander around randomly
        const physics = this.getComponent('Physics');
        if (physics && Math.random() < 0.1) { // 10% chance to move randomly
            const randomAngle = Math.random() * Math.PI * 2;
            const wanderForce = 100;
            physics.applyForce(
                Math.cos(randomAngle) * wanderForce,
                Math.sin(randomAngle) * wanderForce
            );
        }
    }

    seekingBehavior() {
        if (!this.target) return;
        
        const physics = this.getComponent('Physics');
        if (!physics) return;
        
        // Move toward target
        const direction = this.transform.directionTo(this.target.transform);
        const seekForce = 300;
        
        physics.applyForce(
            direction.x * seekForce,
            direction.y * seekForce
        );
        
        // Face target
        this.transform.rotation = this.transform.angleTo(this.target.transform);
    }

    attackingBehavior() {
        if (!this.target || this.attackCooldown > 0) return;
        
        // Face target
        this.transform.rotation = this.transform.angleTo(this.target.transform);
        
        // Attack based on enemy type
        this.performAttack();
        
        // Set attack cooldown
        this.attackCooldown = this.attackRate;
        this.lastAttackTime = Date.now();
    }

    fleeingBehavior() {
        if (!this.target) return;
        
        const physics = this.getComponent('Physics');
        if (!physics) return;
        
        // Move away from target
        const direction = this.target.transform.directionTo(this.transform);
        const fleeForce = 400;
        
        physics.applyForce(
            direction.x * fleeForce,
            direction.y * fleeForce
        );
    }

    performAttack() {
        // Override in subclasses for specific attack behaviors
        if (this.target) {
            const health = this.target.getComponent('Health');
            if (health) {
                health.takeDamage(this.damage, this);
                
                // Visual attack effect
                this.createAttackEffect();
                
                // Play attack sound
                this.playAttackSound();
            }
        }
    }

    createAttackEffect() {
        // Create visual attack effect
        const render = this.getComponent('Render');
        if (render) {
            render.flash('#ffffff', 200, 0.8);
        }
        
        // Screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(3, 100);
        }
    }

    playAttackSound() {
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('enemy_attack', {
                position: this.getPosition(),
                spatial: true,
                pitch: 0.8 + Math.random() * 0.4
            });
        }
    }

    handleStuckDetection(deltaTime) {
        const currentPos = this.getPosition();
        const distance = MathUtils.distance(
            currentPos.x, currentPos.y,
            this.lastPosition.x, this.lastPosition.y
        );
        
        if (distance < 5 && this.behaviorState === 'seeking') {
            this.stuckTimer += deltaTime;
            
            if (this.stuckTimer > this.maxStuckTime) {
                // Unstuck by applying random force
                const physics = this.getComponent('Physics');
                if (physics) {
                    const randomAngle = Math.random() * Math.PI * 2;
                    const unstuckForce = 500;
                    physics.applyImpulse(
                        Math.cos(randomAngle) * unstuckForce,
                        Math.sin(randomAngle) * unstuckForce
                    );
                }
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }
        
        this.lastPosition = { x: currentPos.x, y: currentPos.y };
    }

    onEnemyDamage(damage, source) {
        // Flash red when damaged
        const render = this.getComponent('Render');
        if (render) {
            render.flash('#ff0000', 150, 0.6);
        }
        
        // Set target to damage source if it's a player
        if (source && source.hasTag && source.hasTag('player')) {
            this.target = source;
            this.behaviorState = 'seeking';
        }
        
        // Play damage sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('enemy_damage', {
                position: this.getPosition(),
                spatial: true,
                pitch: 0.9 + Math.random() * 0.2
            });
        }
    }

    onEnemyDeath(source) {
        // Award score to killer
        if (source && source.hasTag && source.hasTag('player')) {
            source.score += this.scoreValue;
            source.kills++;
            
            // Emit kill event
            if (window.gameInstance) {
                window.gameInstance.eventManager.emit('enemy:killed', this, source);
            }
        }
        
        // Create death effect
        this.createDeathEffect();
        
        // Play death sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('enemy_death', {
                position: this.getPosition(),
                spatial: true,
                pitch: 0.7 + Math.random() * 0.6
            });
        }
        
        // Remove from game
        this.destroy();
    }

    createDeathEffect() {
        // Create explosion particles
        for (let i = 0; i < 8; i++) {
            const particle = new Entity();
            particle.addTag('particle');
            
            const pos = this.getPosition();
            const angle = (i / 8) * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            
            const transform = new Transform(pos.x, pos.y, angle);
            particle.addComponent(transform);
            
            const physics = new Physics();
            physics.velocity.x = Math.cos(angle) * speed;
            physics.velocity.y = Math.sin(angle) * speed;
            physics.isKinematic = true;
            physics.drag = 0.9;
            particle.addComponent(physics);
            
            const render = new Render('particle', '#ff4400');
            render.layer = 4;
            render.setGlow(10, '#ff4400', 1.0);
            render.setScale(0.5);
            particle.addComponent(render);
            
            // Particle lifetime
            particle.lifetime = 1000;
            particle.update = (deltaTime) => {
                Entity.prototype.update.call(particle, deltaTime);
                
                particle.lifetime -= deltaTime;
                const render = particle.getComponent('Render');
                if (render) {
                    render.setOpacity(particle.lifetime / 1000);
                }
                
                if (particle.lifetime <= 0) {
                    particle.destroy();
                }
            };
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(particle);
            }
        }
        
        // Screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(5, 200);
        }
    }

    // Serialization
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            enemyType: this.enemyType,
            behaviorState: this.behaviorState,
            scoreValue: this.scoreValue
        };
    }

    static deserialize(data) {
        const enemy = new Enemy(0, 0, data.enemyType);
        enemy.deserializeComponents(data);
        enemy.behaviorState = data.behaviorState || 'idle';
        enemy.scoreValue = data.scoreValue || 10;
        return enemy;
    }
}
