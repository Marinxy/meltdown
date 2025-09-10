// MiniBoss Enemy - Elite enemy with multiple attack patterns and phases
class MiniBoss extends Enemy {
    constructor(x, y) {
        super(x, y, 'miniboss');
        this.phase = 1; // 1, 2, or 3 based on health
        this.attackPattern = 0; // Current attack pattern
        this.patternCooldown = 0;
        this.burstCount = 0;
        this.maxBursts = 3;
        this.teleportCooldown = 0;
        this.shieldActive = false;
        this.shieldDuration = 0;
        this.summonCooldown = 0;
        this.minionsSpawned = 0;
        this.maxMinions = 2;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update phase based on health
        this.updatePhase();
        
        // Update cooldowns
        if (this.patternCooldown > 0) this.patternCooldown -= deltaTime;
        if (this.teleportCooldown > 0) this.teleportCooldown -= deltaTime;
        if (this.summonCooldown > 0) this.summonCooldown -= deltaTime;
        
        // Update shield
        if (this.shieldActive) {
            this.shieldDuration -= deltaTime;
            if (this.shieldDuration <= 0) {
                this.deactivateShield();
            }
        }
    }

    updatePhase() {
        const health = this.getComponent('Health');
        if (!health) return;
        
        const healthPercent = health.getHealthPercentage();
        let newPhase = 1;
        
        if (healthPercent <= 0.33) {
            newPhase = 3;
        } else if (healthPercent <= 0.66) {
            newPhase = 2;
        }
        
        if (newPhase !== this.phase) {
            this.phase = newPhase;
            this.onPhaseChange();
        }
    }

    onPhaseChange() {
        // Visual effect for phase change
        const render = this.getComponent('Render');
        if (render) {
            render.flash('#ffffff', 500, 1.0);
            render.setScale(2.2 + this.phase * 0.2);
        }
        
        // Screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(10, 300);
        }
        
        // Play phase change sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('miniboss_phase', {
                position: this.getPosition(),
                spatial: true,
                volume: 1.5
            });
        }
        
        // Reset attack pattern
        this.attackPattern = 0;
        this.patternCooldown = 0;
        
        // Phase-specific changes
        switch (this.phase) {
            case 2:
                this.attackRate *= 0.8; // Faster attacks
                this.aggroRange = 400; // Larger aggro range
                break;
            case 3:
                this.attackRate *= 0.6; // Even faster attacks
                this.aggroRange = 500; // Maximum aggro range
                break;
        }
    }

    attackingBehavior() {
        if (!this.target || this.patternCooldown > 0) return;
        
        // Face target
        this.transform.rotation = this.transform.angleTo(this.target.transform);
        
        // Choose attack pattern based on phase and distance
        const distanceToTarget = this.transform.distanceTo(this.target.transform);
        
        if (this.phase === 1) {
            this.basicAttackPattern(distanceToTarget);
        } else if (this.phase === 2) {
            this.advancedAttackPattern(distanceToTarget);
        } else {
            this.desperateAttackPattern(distanceToTarget);
        }
        
        // Set pattern cooldown
        this.patternCooldown = 1500 - (this.phase * 200);
    }

    basicAttackPattern(distance) {
        if (distance <= this.attackRange) {
            // Melee slam
            this.performMeleeSlam();
        } else {
            // Projectile burst
            this.performProjectileBurst();
        }
    }

    advancedAttackPattern(distance) {
        switch (this.attackPattern % 3) {
            case 0:
                this.performProjectileBurst();
                break;
            case 1:
                if (this.teleportCooldown <= 0) {
                    this.performTeleportAttack();
                } else {
                    this.performMeleeSlam();
                }
                break;
            case 2:
                this.activateShield();
                break;
        }
        this.attackPattern++;
    }

    desperateAttackPattern(distance) {
        switch (this.attackPattern % 4) {
            case 0:
                this.performProjectileBurst();
                break;
            case 1:
                if (this.teleportCooldown <= 0) {
                    this.performTeleportAttack();
                } else {
                    this.performMeleeSlam();
                }
                break;
            case 2:
                if (this.summonCooldown <= 0 && this.minionsSpawned < this.maxMinions) {
                    this.summonMinions();
                } else {
                    this.performProjectileBurst();
                }
                break;
            case 3:
                this.performSpinAttack();
                break;
        }
        this.attackPattern++;
    }

    performMeleeSlam() {
        // Similar to Bruiser but stronger
        const slamRange = 100;
        const slamDamage = 80;
        const slamForce = 600;
        
        // Visual effect
        const render = this.getComponent('Render');
        if (render) {
            render.flash('#ff00ff', 300, 1.0);
        }
        
        // Damage nearby players
        if (window.gameInstance && window.gameInstance.physicsSystem) {
            const nearbyPlayers = window.gameInstance.physicsSystem
                .getEntitiesInRadius(this.transform.x, this.transform.y, slamRange)
                .filter(entity => entity.hasTag('player'));
            
            for (const player of nearbyPlayers) {
                const health = player.getComponent('Health');
                const physics = player.getComponent('Physics');
                
                if (health && !health.isDead()) {
                    health.takeDamage(slamDamage, this);
                    
                    if (physics) {
                        const direction = this.transform.directionTo(player.transform);
                        physics.applyImpulse(
                            direction.x * slamForce,
                            direction.y * slamForce
                        );
                    }
                }
            }
        }
        
        // Screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(12, 400);
        }
    }

    performProjectileBurst() {
        const burstSize = 3 + this.phase;
        const spreadAngle = Math.PI / 3; // 60 degrees
        
        for (let i = 0; i < burstSize; i++) {
            const angle = this.transform.rotation + 
                         (i - (burstSize - 1) / 2) * (spreadAngle / (burstSize - 1));
            
            this.createProjectile(angle);
        }
        
        // Play burst sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('miniboss_burst', {
                position: this.getPosition(),
                spatial: true
            });
        }
    }

    createProjectile(angle) {
        const projectile = new Entity();
        projectile.addTag('enemy_projectile');
        projectile.damage = 25 + (this.phase * 5);
        projectile.owner = this;
        
        const startPos = this.getPosition();
        const spawnDistance = 30;
        const spawnX = startPos.x + Math.cos(angle) * spawnDistance;
        const spawnY = startPos.y + Math.sin(angle) * spawnDistance;
        
        const transform = new Transform(spawnX, spawnY, angle);
        projectile.addComponent(transform);
        
        const physics = new Physics();
        const speed = 500 + (this.phase * 50);
        physics.velocity.x = Math.cos(angle) * speed;
        physics.velocity.y = Math.sin(angle) * speed;
        physics.isKinematic = true;
        physics.collisionRadius = 8;
        projectile.addComponent(physics);
        
        const render = new Render('projectile', '#ff00ff');
        render.layer = 3;
        render.setGlow(10, '#ff00ff', 1.0);
        render.setScale(1.2);
        projectile.addComponent(render);
        
        // Projectile behavior
        projectile.lifetime = 4000;
        projectile.update = (deltaTime) => {
            Entity.prototype.update.call(projectile, deltaTime);
            
            projectile.lifetime -= deltaTime;
            if (projectile.lifetime <= 0) {
                projectile.destroy();
                return;
            }
            
            // Check collision with players
            if (window.gameInstance && window.gameInstance.physicsSystem) {
                const nearbyEntities = window.gameInstance.physicsSystem
                    .getEntitiesInRadius(transform.x, transform.y, physics.collisionRadius);
                
                for (const entity of nearbyEntities) {
                    if (entity.hasTag('player')) {
                        const health = entity.getComponent('Health');
                        if (health && !health.isDead()) {
                            health.takeDamage(projectile.damage, this);
                            projectile.destroy();
                            return;
                        }
                    }
                }
            }
        };
        
        if (window.gameInstance) {
            window.gameInstance.addEntity(projectile);
        }
    }

    performTeleportAttack() {
        if (!this.target) return;
        
        this.teleportCooldown = 8000; // 8 second cooldown
        
        // Teleport behind target
        const targetPos = this.target.getPosition();
        const teleportDistance = 80;
        const teleportAngle = this.target.transform.rotation + Math.PI; // Behind target
        
        const newX = targetPos.x + Math.cos(teleportAngle) * teleportDistance;
        const newY = targetPos.y + Math.sin(teleportAngle) * teleportDistance;
        
        // Teleport effect at old position
        this.createTeleportEffect(this.getPosition());
        
        // Move to new position
        this.transform.x = newX;
        this.transform.y = newY;
        
        // Teleport effect at new position
        this.createTeleportEffect(this.getPosition());
        
        // Immediate attack after teleport
        setTimeout(() => {
            this.performMeleeSlam();
        }, 200);
        
        // Play teleport sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('miniboss_teleport', {
                position: this.getPosition(),
                spatial: true
            });
        }
    }

    createTeleportEffect(position) {
        for (let i = 0; i < 12; i++) {
            const particle = new Entity();
            particle.addTag('particle');
            
            const angle = (i / 12) * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            
            const transform = new Transform(
                position.x + Math.cos(angle) * distance,
                position.y + Math.sin(angle) * distance,
                angle
            );
            particle.addComponent(transform);
            
            const physics = new Physics();
            physics.velocity.x = Math.cos(angle) * 100;
            physics.velocity.y = Math.sin(angle) * 100;
            physics.isKinematic = true;
            physics.drag = 0.9;
            particle.addComponent(physics);
            
            const render = new Render('particle', '#ff00ff');
            render.layer = 5;
            render.setGlow(8, '#ff00ff', 1.0);
            render.setScale(0.5);
            particle.addComponent(render);
            
            particle.lifetime = 600;
            particle.update = (deltaTime) => {
                Entity.prototype.update.call(particle, deltaTime);
                
                particle.lifetime -= deltaTime;
                const render = particle.getComponent('Render');
                if (render) {
                    render.setOpacity(particle.lifetime / 600);
                }
                
                if (particle.lifetime <= 0) {
                    particle.destroy();
                }
            };
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(particle);
            }
        }
    }

    activateShield() {
        this.shieldActive = true;
        this.shieldDuration = 3000; // 3 seconds
        
        // Visual shield effect
        const render = this.getComponent('Render');
        if (render) {
            render.setTint('#4444ff');
            render.setGlow(25, '#4444ff', 1.0);
        }
        
        // Make temporarily invulnerable
        const health = this.getComponent('Health');
        if (health) {
            health.setInvulnerable(this.shieldDuration);
        }
    }

    deactivateShield() {
        this.shieldActive = false;
        
        // Remove visual effects
        const render = this.getComponent('Render');
        if (render) {
            render.setTint(null);
            render.setGlow(8, '#ff66ff', 0.6);
        }
    }

    summonMinions() {
        this.summonCooldown = 15000; // 15 second cooldown
        
        const minionCount = 2;
        for (let i = 0; i < minionCount; i++) {
            const angle = (i / minionCount) * Math.PI * 2;
            const distance = 60;
            const pos = this.getPosition();
            
            const minionX = pos.x + Math.cos(angle) * distance;
            const minionY = pos.y + Math.sin(angle) * distance;
            
            const minion = new Grunt(minionX, minionY);
            minion.isSummoned = true;
            minion.summoner = this;
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(minion);
            }
            
            this.minionsSpawned++;
        }
        
        // Play summon sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('miniboss_summon', {
                position: this.getPosition(),
                spatial: true
            });
        }
    }

    performSpinAttack() {
        // Spinning projectile attack
        const projectileCount = 8;
        
        for (let i = 0; i < projectileCount; i++) {
            const angle = (i / projectileCount) * Math.PI * 2;
            this.createProjectile(angle);
        }
        
        // Spin visual effect
        const render = this.getComponent('Render');
        if (render) {
            render.flash('#ffff00', 400, 1.0);
        }
    }

    onEnemyDeath(source) {
        // Create massive death explosion
        for (let i = 0; i < 20; i++) {
            const particle = new Entity();
            particle.addTag('particle');
            
            const pos = this.getPosition();
            const angle = (i / 20) * Math.PI * 2;
            const speed = 150 + Math.random() * 100;
            
            const transform = new Transform(pos.x, pos.y, angle);
            particle.addComponent(transform);
            
            const physics = new Physics();
            physics.velocity.x = Math.cos(angle) * speed;
            physics.velocity.y = Math.sin(angle) * speed;
            physics.isKinematic = true;
            physics.drag = 0.95;
            particle.addComponent(physics);
            
            const render = new Render('particle', '#ff00ff');
            render.layer = 4;
            render.setGlow(15, '#ff00ff', 1.0);
            render.setScale(1.5);
            particle.addComponent(render);
            
            particle.lifetime = 2000;
            particle.update = (deltaTime) => {
                Entity.prototype.update.call(particle, deltaTime);
                
                particle.lifetime -= deltaTime;
                const render = particle.getComponent('Render');
                if (render) {
                    render.setOpacity(particle.lifetime / 2000);
                }
                
                if (particle.lifetime <= 0) {
                    particle.destroy();
                }
            };
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(particle);
            }
        }
        
        // Massive screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(25, 1000);
        }
        
        super.onEnemyDeath(source);
    }
}
