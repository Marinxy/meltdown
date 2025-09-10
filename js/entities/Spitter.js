// Spitter Enemy - Ranged enemy that shoots projectiles at players
class Spitter extends Enemy {
    constructor(x, y) {
        super(x, y, 'spitter');
        this.projectileSpeed = 400;
        this.projectileDamage = 15;
        this.keepDistance = 120; // Preferred distance from target
        this.lastShotTime = 0;
        this.aimAccuracy = 0.8; // 80% accuracy
    }

    seekingBehavior() {
        if (!this.target) return;
        
        const physics = this.getComponent('Physics');
        if (!physics) return;
        
        const transform = this.getComponent('Transform');
        const targetTransform = this.target.getComponent('Transform');
        if (!transform || !targetTransform) return;
        
        const distanceToTarget = transform.distanceTo(targetTransform);
        
        // Maintain optimal distance
        if (distanceToTarget < this.keepDistance) {
            // Move away from target
            const direction = targetTransform.directionTo(transform);
            const retreatForce = 250;
            physics.applyForce(
                direction.x * retreatForce,
                direction.y * retreatForce
            );
        } else if (distanceToTarget > this.attackRange) {
            // Move closer to target
            const direction = transform.directionTo(targetTransform);
            const approachForce = 200;
            physics.applyForce(
                direction.x * approachForce,
                direction.y * approachForce
            );
        }
        
        // Always face target
        transform.rotation = transform.angleTo(targetTransform);
    }

    performAttack() {
        if (!this.target || this.attackCooldown > 0) return;
        
        // Create projectile
        this.fireProjectile();
        
        // Visual muzzle flash
        const render = this.getComponent('Render');
        if (render) {
            render.flash('#66ff66', 150, 0.8);
        }
        
        // Play shoot sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('spitter_shoot', {
                position: this.getPosition(),
                spatial: true,
                pitch: 0.9 + Math.random() * 0.2
            });
        }
        
        // Set attack cooldown
        this.attackCooldown = this.attackRate;
        this.lastShotTime = Date.now();
    }

    fireProjectile() {
        if (!this.target) return;
        
        const startPos = this.getPosition();
        const targetPos = this.target.getPosition();
        
        // Calculate aim with some inaccuracy
        const enemyTransform = this.getComponent('Transform');
        const targetTransform = this.target.getComponent('Transform');
        if (!enemyTransform || !targetTransform) return;
        
        let aimAngle = enemyTransform.angleTo(targetTransform);
        
        // Add inaccuracy based on accuracy stat
        const maxInaccuracy = (1 - this.aimAccuracy) * Math.PI / 4; // Up to 45 degrees
        const inaccuracy = (Math.random() - 0.5) * maxInaccuracy;
        aimAngle += inaccuracy;
        
        // Create projectile entity
        const projectile = new Entity();
        projectile.addTag('enemy_projectile');
        projectile.damage = this.projectileDamage;
        projectile.owner = this;
        
        // Spawn slightly in front of spitter
        const spawnDistance = 20;
        const spawnX = enemyTransform.x + Math.cos(aimAngle) * spawnDistance;
        const spawnY = enemyTransform.y + Math.sin(aimAngle) * spawnDistance;
        
        const transform = new Transform(spawnX, spawnY, aimAngle);
        projectile.addComponent(transform);
        
        const physics = new Physics();
        physics.velocity.x = Math.cos(aimAngle) * this.projectileSpeed;
        physics.velocity.y = Math.sin(aimAngle) * this.projectileSpeed;
        physics.isKinematic = true;
        physics.collisionRadius = 6;
        projectile.addComponent(physics);
        
        const render = new Render('projectile', '#66ff66');
        render.layer = 3;
        render.setGlow(8, '#66ff66', 0.8);
        render.setScale(0.8);
        projectile.addComponent(render);
        
        // Projectile properties
        projectile.lifetime = 3000; // 3 seconds
        projectile.startX = spawnX;
        projectile.startY = spawnY;
        projectile.maxRange = this.attackRange * 1.5;
        
        // Projectile update behavior
        projectile.update = (deltaTime) => {
            Entity.prototype.update.call(projectile, deltaTime);
            
            // Check lifetime
            projectile.lifetime -= deltaTime;
            if (projectile.lifetime <= 0) {
                projectile.destroy();
                return;
            }
            
            // Check range
            const distance = MathUtils.distance(
                projectile.startX, projectile.startY,
                transform.x, transform.y
            );
            if (distance > projectile.maxRange) {
                projectile.destroy();
                return;
            }
            
            // Check collision with players
            if (window.gameInstance && window.gameInstance.physicsSystem) {
                const nearbyEntities = window.gameInstance.physicsSystem
                    .getEntitiesInRadius(transform.x, transform.y, physics.collisionRadius);
                
                for (const entity of nearbyEntities) {
                    if (entity.hasTag('player') && entity !== this.owner) {
                        // Hit player
                        const health = entity.getComponent('Health');
                        if (health && !health.isDead()) {
                            health.takeDamage(projectile.damage, this);
                            
                            // Create hit effect
                            this.createHitEffect(entity);
                            
                            projectile.destroy();
                            return;
                        }
                    }
                }
            }
        };
        
        // Add projectile to game
        if (window.gameInstance) {
            window.gameInstance.addEntity(projectile);
        }
    }

    createHitEffect(target) {
        // Create hit particles
        for (let i = 0; i < 4; i++) {
            const particle = new Entity();
            particle.addTag('particle');
            
            const targetPos = target.getPosition();
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            
            const transform = new Transform(targetPos.x, targetPos.y, angle);
            particle.addComponent(transform);
            
            const physics = new Physics();
            physics.velocity.x = Math.cos(angle) * speed;
            physics.velocity.y = Math.sin(angle) * speed;
            physics.isKinematic = true;
            physics.drag = 0.9;
            particle.addComponent(physics);
            
            const render = new Render('particle', '#66ff66');
            render.layer = 4;
            render.setGlow(6, '#66ff66', 1.0);
            render.setScale(0.3);
            particle.addComponent(render);
            
            // Particle lifetime
            particle.lifetime = 500;
            particle.update = (deltaTime) => {
                Entity.prototype.update.call(particle, deltaTime);
                
                particle.lifetime -= deltaTime;
                const render = particle.getComponent('Render');
                if (render) {
                    render.setOpacity(particle.lifetime / 500);
                }
                
                if (particle.lifetime <= 0) {
                    particle.destroy();
                }
            };
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(particle);
            }
        }
        
        // Play hit sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('projectile_hit', {
                position: target.getPosition(),
                spatial: true
            });
        }
    }

    // Override idle behavior to be more alert
    idleBehavior() {
        // Spitters are more alert, slowly rotate to scan for targets
        const transform = this.getComponent('Transform');
        if (transform) {
            transform.rotation += 0.5 * (Math.PI / 180); // Rotate 0.5 degrees per frame
        }
    }
}
