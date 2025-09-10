// Bruiser Enemy - Heavy tank enemy with slam attacks and high health
class Bruiser extends Enemy {
    constructor(x, y) {
        super(x, y, 'bruiser');
        this.slamCooldown = 0;
        this.slamRange = 80;
        this.slamDamage = 60;
        this.slamForce = 500;
        this.isSlammingDown = false;
        this.slamWindupTime = 800; // Wind-up time before slam
        this.slamWindupTimer = 0;
        this.originalY = 0;
        this.jumpHeight = 30;
    }

    attackingBehavior() {
        if (!this.target || this.attackCooldown > 0) return;
        
        const distanceToTarget = this.transform.distanceTo(this.target.transform);
        
        // Face target
        this.transform.rotation = this.transform.angleTo(this.target.transform);
        
        // Use slam attack if close enough
        if (distanceToTarget <= this.slamRange && this.slamCooldown <= 0) {
            this.startSlamAttack();
        } else {
            // Regular melee attack
            super.performAttack();
        }
        
        // Set attack cooldown
        this.attackCooldown = this.attackRate;
    }

    startSlamAttack() {
        this.slamCooldown = 5000; // 5 second cooldown
        this.slamWindupTimer = this.slamWindupTime;
        this.originalY = this.transform.y;
        
        // Visual wind-up effect
        const render = this.getComponent('Render');
        if (render) {
            render.setTint('#ffff00');
            render.setGlow(20, '#ffff00', 1.0);
            render.setScale(1.8); // Grow larger during windup
        }
        
        // Play windup sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('bruiser_windup', {
                position: this.getPosition(),
                spatial: true
            });
        }
        
        // Jump up during windup
        this.transform.y -= this.jumpHeight;
        
        // Execute slam after windup
        setTimeout(() => {
            this.executeSlamAttack();
        }, this.slamWindupTime);
    }

    executeSlamAttack() {
        // Return to ground
        this.transform.y = this.originalY;
        this.isSlammingDown = true;
        
        // Create slam area effect
        this.createSlamEffect();
        
        // Damage all players in range
        if (window.gameInstance && window.gameInstance.physicsSystem) {
            const nearbyPlayers = window.gameInstance.physicsSystem
                .getEntitiesInRadius(this.transform.x, this.transform.y, this.slamRange)
                .filter(entity => entity.hasTag('player'));
            
            for (const player of nearbyPlayers) {
                const health = player.getComponent('Health');
                const physics = player.getComponent('Physics');
                
                if (health && !health.isDead()) {
                    // Deal damage
                    health.takeDamage(this.slamDamage, this);
                    
                    // Knockback effect
                    if (physics) {
                        const direction = this.transform.directionTo(player.transform);
                        physics.applyImpulse(
                            direction.x * this.slamForce,
                            direction.y * this.slamForce
                        );
                    }
                }
            }
        }
        
        // Reset visual effects
        const render = this.getComponent('Render');
        if (render) {
            render.setTint(null);
            render.setGlow(8, '#6666ff', 0.6);
            render.setScale(1.5);
        }
        
        // Play slam sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('bruiser_slam', {
                position: this.getPosition(),
                spatial: true,
                volume: 1.2
            });
        }
        
        // Major screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(15, 500);
        }
        
        this.isSlammingDown = false;
    }

    createSlamEffect() {
        // Create shockwave particles
        for (let i = 0; i < 16; i++) {
            const particle = new Entity();
            particle.addTag('particle');
            
            const angle = (i / 16) * Math.PI * 2;
            const startDistance = 20;
            const pos = this.getPosition();
            
            const transform = new Transform(
                pos.x + Math.cos(angle) * startDistance,
                pos.y + Math.sin(angle) * startDistance,
                angle
            );
            particle.addComponent(transform);
            
            const physics = new Physics();
            const speed = 200 + Math.random() * 100;
            physics.velocity.x = Math.cos(angle) * speed;
            physics.velocity.y = Math.sin(angle) * speed;
            physics.isKinematic = true;
            physics.drag = 0.95;
            particle.addComponent(physics);
            
            const render = new Render('particle', '#ffaa00');
            render.layer = 4;
            render.setGlow(12, '#ffaa00', 1.0);
            render.setScale(0.8);
            particle.addComponent(render);
            
            // Particle lifetime
            particle.lifetime = 800;
            particle.update = (deltaTime) => {
                Entity.prototype.update.call(particle, deltaTime);
                
                particle.lifetime -= deltaTime;
                const render = particle.getComponent('Render');
                if (render) {
                    render.setOpacity(particle.lifetime / 800);
                    render.setScale(render.scale.x * 1.02); // Grow over time
                }
                
                if (particle.lifetime <= 0) {
                    particle.destroy();
                }
            };
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(particle);
            }
        }
        
        // Create dust cloud
        for (let i = 0; i < 8; i++) {
            const dust = new Entity();
            dust.addTag('particle');
            
            const pos = this.getPosition();
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 60;
            
            const transform = new Transform(pos.x + offsetX, pos.y + offsetY, 0);
            dust.addComponent(transform);
            
            const physics = new Physics();
            physics.velocity.y = -20 - Math.random() * 30; // Float upward
            physics.isKinematic = true;
            physics.drag = 0.98;
            dust.addComponent(physics);
            
            const render = new Render('particle', '#888888');
            render.layer = 3;
            render.setOpacity(0.6);
            render.setScale(1.5 + Math.random() * 1.0);
            dust.addComponent(render);
            
            // Dust lifetime
            dust.lifetime = 2000;
            dust.update = (deltaTime) => {
                Entity.prototype.update.call(dust, deltaTime);
                
                dust.lifetime -= deltaTime;
                const render = dust.getComponent('Render');
                if (render) {
                    render.setOpacity((dust.lifetime / 2000) * 0.6);
                    render.setScale(render.scale.x * 1.005); // Grow slowly
                }
                
                if (dust.lifetime <= 0) {
                    dust.destroy();
                }
            };
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(dust);
            }
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update slam cooldown
        if (this.slamCooldown > 0) {
            this.slamCooldown -= deltaTime;
        }
        
        // Update slam windup
        if (this.slamWindupTimer > 0) {
            this.slamWindupTimer -= deltaTime;
            
            // Pulsing effect during windup
            const render = this.getComponent('Render');
            if (render) {
                const pulseIntensity = 0.3 + 0.2 * Math.sin(Date.now() * 0.01);
                render.setGlow(20 + pulseIntensity * 10, '#ffff00', 1.0);
            }
        }
    }

    // Bruisers are slower but more persistent
    seekingBehavior() {
        super.seekingBehavior();
        
        // Bruisers don't give up easily - extend aggro range when damaged
        const health = this.getComponent('Health');
        if (health && health.getHealthPercentage() < 0.8) {
            this.aggroRange = 400; // Increased from base 200
        }
    }

    // Override flee behavior - bruisers don't flee
    updateBehaviorState() {
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
        // Note: Bruisers never flee
    }
}
