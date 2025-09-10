// Boss Enemy - Ultimate challenge with multiple phases and complex attack patterns
class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 'boss');
        this.phase = 1; // 1-4 phases based on health
        this.phaseTransitioning = false;
        this.attackPattern = 0;
        this.patternCooldown = 0;
        this.specialAttackCooldown = 0;
        this.enrageMode = false;
        this.shieldCharges = 3;
        this.currentShieldCharges = 3;
        this.laserCharging = false;
        this.laserChargeDuration = 0;
        this.meteorCooldown = 0;
        this.summonedMinions = [];
        this.maxMinions = 4;
        this.originalSpeed = 120;
        this.invulnerabilityFrames = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update phase based on health
        this.updatePhase();
        
        // Update cooldowns
        if (this.patternCooldown > 0) this.patternCooldown -= deltaTime;
        if (this.specialAttackCooldown > 0) this.specialAttackCooldown -= deltaTime;
        if (this.meteorCooldown > 0) this.meteorCooldown -= deltaTime;
        if (this.invulnerabilityFrames > 0) this.invulnerabilityFrames -= deltaTime;
        
        // Update laser charging
        if (this.laserCharging) {
            this.laserChargeDuration -= deltaTime;
            if (this.laserChargeDuration <= 0) {
                this.fireLaser();
            }
        }
        
        // Clean up dead minions
        this.summonedMinions = this.summonedMinions.filter(minion => minion.active);
    }

    updatePhase() {
        if (this.phaseTransitioning) return;
        
        const health = this.getComponent('Health');
        if (!health) return;
        
        const healthPercent = health.getHealthPercentage();
        let newPhase = 1;
        
        if (healthPercent <= 0.25) {
            newPhase = 4;
        } else if (healthPercent <= 0.5) {
            newPhase = 3;
        } else if (healthPercent <= 0.75) {
            newPhase = 2;
        }
        
        if (newPhase !== this.phase) {
            this.phase = newPhase;
            this.onPhaseTransition();
        }
    }

    onPhaseTransition() {
        this.phaseTransitioning = true;
        this.invulnerabilityFrames = 3000; // 3 seconds of invulnerability
        
        // Massive visual effect
        const render = this.getComponent('Render');
        if (render) {
            render.flash('#ffffff', 1000, 1.0);
            render.setScale(3.0 + this.phase * 0.3);
            render.setGlow(30 + this.phase * 10, '#ffff00', 1.0);
        }
        
        // Massive screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(20, 800);
        }
        
        // Phase transition effects
        this.createPhaseTransitionEffect();
        
        // Play phase music
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('boss_phase_transition', {
                position: this.getPosition(),
                spatial: false,
                volume: 1.5
            });
        }
        
        // Phase-specific changes
        switch (this.phase) {
            case 2:
                this.attackRate *= 0.8;
                this.aggroRange = 600;
                break;
            case 3:
                this.attackRate *= 0.6;
                this.aggroRange = 800;
                this.enrageMode = true;
                break;
            case 4:
                this.attackRate *= 0.4;
                this.aggroRange = 1000;
                this.enrageMode = true;
                // Restore some shield charges
                this.currentShieldCharges = Math.min(2, this.shieldCharges);
                break;
        }
        
        // Reset attack pattern and cooldowns
        this.attackPattern = 0;
        this.patternCooldown = 0;
        this.specialAttackCooldown = 0;
        
        setTimeout(() => {
            this.phaseTransitioning = false;
        }, 3000);
    }

    createPhaseTransitionEffect() {
        // Massive explosion effect
        for (let i = 0; i < 30; i++) {
            const particle = new Entity();
            particle.addTag('particle');
            
            const pos = this.getPosition();
            const angle = (i / 30) * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const speed = 200 + Math.random() * 200;
            
            const transform = new Transform(
                pos.x + Math.cos(angle) * distance,
                pos.y + Math.sin(angle) * distance,
                angle
            );
            particle.addComponent(transform);
            
            const physics = new Physics();
            physics.velocity.x = Math.cos(angle) * speed;
            physics.velocity.y = Math.sin(angle) * speed;
            physics.isKinematic = true;
            physics.drag = 0.9;
            particle.addComponent(physics);
            
            const colors = ['#ff0000', '#ff8800', '#ffff00', '#ffffff'];
            const color = MathUtils.randomChoice(colors);
            const render = new Render('particle', color);
            render.layer = 6;
            render.setGlow(20, color, 1.0);
            render.setScale(2.0);
            particle.addComponent(render);
            
            particle.lifetime = 3000;
            particle.update = (deltaTime) => {
                Entity.prototype.update.call(particle, deltaTime);
                
                particle.lifetime -= deltaTime;
                const render = particle.getComponent('Render');
                if (render) {
                    render.setOpacity(particle.lifetime / 3000);
                    render.setScale(render.scale.x * 1.01);
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

    attackingBehavior() {
        if (!this.target || this.patternCooldown > 0 || this.phaseTransitioning) return;
        
        // Check invulnerability
        if (this.invulnerabilityFrames > 0) return;
        
        // Face target
        this.transform.rotation = this.transform.angleTo(this.target.transform);
        
        // Choose attack pattern based on phase
        switch (this.phase) {
            case 1:
                this.phase1Attacks();
                break;
            case 2:
                this.phase2Attacks();
                break;
            case 3:
                this.phase3Attacks();
                break;
            case 4:
                this.phase4Attacks();
                break;
        }
        
        // Set pattern cooldown
        this.patternCooldown = Math.max(500, 2000 - (this.phase * 300));
    }

    phase1Attacks() {
        const patterns = ['projectileBurst', 'meleeSlam', 'shockwave'];
        const pattern = patterns[this.attackPattern % patterns.length];
        
        switch (pattern) {
            case 'projectileBurst':
                this.performProjectileBurst(5);
                break;
            case 'meleeSlam':
                this.performMeleeSlam();
                break;
            case 'shockwave':
                this.performShockwave();
                break;
        }
        this.attackPattern++;
    }

    phase2Attacks() {
        const patterns = ['projectileBurst', 'laserBeam', 'summonMinions', 'teleportSlam'];
        const pattern = patterns[this.attackPattern % patterns.length];
        
        switch (pattern) {
            case 'projectileBurst':
                this.performProjectileBurst(8);
                break;
            case 'laserBeam':
                if (!this.laserCharging) this.chargeLaser();
                break;
            case 'summonMinions':
                if (this.summonedMinions.length < this.maxMinions) {
                    this.summonMinions();
                } else {
                    this.performShockwave();
                }
                break;
            case 'teleportSlam':
                this.performTeleportSlam();
                break;
        }
        this.attackPattern++;
    }

    phase3Attacks() {
        const patterns = ['meteorStrike', 'spiralBurst', 'chargeAttack', 'areaBlast'];
        const pattern = patterns[this.attackPattern % patterns.length];
        
        switch (pattern) {
            case 'meteorStrike':
                if (this.meteorCooldown <= 0) {
                    this.performMeteorStrike();
                } else {
                    this.performProjectileBurst(10);
                }
                break;
            case 'spiralBurst':
                this.performSpiralBurst();
                break;
            case 'chargeAttack':
                this.performChargeAttack();
                break;
            case 'areaBlast':
                this.performAreaBlast();
                break;
        }
        this.attackPattern++;
    }

    phase4Attacks() {
        // Desperate phase - all attacks available
        const patterns = ['ultimateBlast', 'meteorStorm', 'laserSweep', 'berserkerRush'];
        const pattern = patterns[this.attackPattern % patterns.length];
        
        switch (pattern) {
            case 'ultimateBlast':
                this.performUltimateBlast();
                break;
            case 'meteorStorm':
                this.performMeteorStorm();
                break;
            case 'laserSweep':
                this.performLaserSweep();
                break;
            case 'berserkerRush':
                this.performBerserkerRush();
                break;
        }
        this.attackPattern++;
    }

    performProjectileBurst(count) {
        const spreadAngle = Math.PI / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = this.transform.rotation + 
                         (i - (count - 1) / 2) * (spreadAngle / (count - 1));
            
            this.createBossProjectile(angle, 600, 40 + this.phase * 10);
        }
        
        this.playAttackSound('boss_projectile_burst');
    }

    performMeleeSlam() {
        const slamRange = 120;
        const slamDamage = 100 + (this.phase * 25);
        
        if (window.gameInstance && window.gameInstance.physicsSystem) {
            const nearbyPlayers = window.gameInstance.physicsSystem
                .getEntitiesInRadius(this.transform.x, this.transform.y, slamRange)
                .filter(entity => entity.hasTag('player'));
            
            for (const player of nearbyPlayers) {
                const health = player.getComponent('Health');
                if (health && !health.isDead()) {
                    health.takeDamage(slamDamage, this);
                    
                    const physics = player.getComponent('Physics');
                    if (physics) {
                        const direction = this.transform.directionTo(player.transform);
                        physics.applyImpulse(direction.x * 800, direction.y * 800);
                    }
                }
            }
        }
        
        // Massive screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(18, 600);
        }
        
        this.playAttackSound('boss_slam');
    }

    performShockwave() {
        // Create expanding shockwave
        const shockwave = new Entity();
        shockwave.addTag('boss_attack');
        shockwave.damage = 60 + (this.phase * 15);
        shockwave.owner = this;
        
        const pos = this.getPosition();
        const transform = new Transform(pos.x, pos.y, 0);
        shockwave.addComponent(transform);
        
        const physics = new Physics();
        physics.isStatic = true;
        physics.collisionRadius = 20;
        shockwave.addComponent(physics);
        
        const render = new Render('shockwave', '#ff4400');
        render.layer = 4;
        render.setGlow(25, '#ff4400', 0.8);
        render.setScale(0.5);
        shockwave.addComponent(render);
        
        shockwave.expansionRate = 300; // pixels per second
        shockwave.maxRadius = 400;
        shockwave.hitTargets = new Set();
        
        shockwave.update = (deltaTime) => {
            Entity.prototype.update.call(shockwave, deltaTime);
            
            // Expand shockwave
            const render = shockwave.getComponent('Render');
            const physics = shockwave.getComponent('Physics');
            
            if (render && physics) {
                const newScale = render.scale.x + (shockwave.expansionRate * deltaTime / 1000);
                render.setScale(newScale);
                physics.collisionRadius = newScale * 20;
                
                // Check for player hits
                if (window.gameInstance && window.gameInstance.physicsSystem) {
                    const nearbyPlayers = window.gameInstance.physicsSystem
                        .getEntitiesInRadius(transform.x, transform.y, physics.collisionRadius)
                        .filter(entity => entity.hasTag('player') && !shockwave.hitTargets.has(entity));
                    
                    for (const player of nearbyPlayers) {
                        const health = player.getComponent('Health');
                        if (health && !health.isDead()) {
                            health.takeDamage(shockwave.damage, this);
                            shockwave.hitTargets.add(player);
                            
                            const playerPhysics = player.getComponent('Physics');
                            if (playerPhysics) {
                                const direction = transform.directionTo(player.transform);
                                playerPhysics.applyImpulse(direction.x * 600, direction.y * 600);
                            }
                        }
                    }
                }
                
                // Destroy when max size reached
                if (newScale >= shockwave.maxRadius / 20) {
                    shockwave.destroy();
                }
            }
        };
        
        if (window.gameInstance) {
            window.gameInstance.addEntity(shockwave);
        }
        
        this.playAttackSound('boss_shockwave');
    }

    chargeLaser() {
        this.laserCharging = true;
        this.laserChargeDuration = 2000; // 2 second charge time
        
        // Visual charging effect
        const render = this.getComponent('Render');
        if (render) {
            render.setTint('#ff0000');
            render.setGlow(40, '#ff0000', 1.0);
        }
        
        this.playAttackSound('boss_laser_charge');
    }

    fireLaser() {
        this.laserCharging = false;
        
        if (!this.target) return;
        
        // Create laser beam
        const laserLength = 800;
        const laserWidth = 40;
        const laserDamage = 80 + (this.phase * 20);
        
        const startPos = this.getPosition();
        const angle = this.transform.angleTo(this.target.transform);
        
        // Create multiple laser segments
        const segmentCount = 20;
        const segmentLength = laserLength / segmentCount;
        
        for (let i = 0; i < segmentCount; i++) {
            const segmentX = startPos.x + Math.cos(angle) * (i * segmentLength);
            const segmentY = startPos.y + Math.sin(angle) * (i * segmentLength);
            
            const laserSegment = new Entity();
            laserSegment.addTag('boss_attack');
            laserSegment.damage = laserDamage;
            laserSegment.owner = this;
            
            const transform = new Transform(segmentX, segmentY, angle);
            laserSegment.addComponent(transform);
            
            const physics = new Physics();
            physics.isStatic = true;
            physics.collisionRadius = laserWidth / 2;
            laserSegment.addComponent(physics);
            
            const render = new Render('laser', '#ff0000');
            render.layer = 5;
            render.setGlow(20, '#ff0000', 1.0);
            render.setScale(2, 0.5);
            laserSegment.addComponent(render);
            
            laserSegment.lifetime = 500; // 0.5 second duration
            laserSegment.hitTargets = new Set();
            
            laserSegment.update = (deltaTime) => {
                Entity.prototype.update.call(laserSegment, deltaTime);
                
                laserSegment.lifetime -= deltaTime;
                
                // Check for player hits
                if (window.gameInstance && window.gameInstance.physicsSystem) {
                    const nearbyPlayers = window.gameInstance.physicsSystem
                        .getEntitiesInRadius(transform.x, transform.y, physics.collisionRadius)
                        .filter(entity => entity.hasTag('player') && !laserSegment.hitTargets.has(entity));
                    
                    for (const player of nearbyPlayers) {
                        const health = player.getComponent('Health');
                        if (health && !health.isDead()) {
                            health.takeDamage(laserSegment.damage, this);
                            laserSegment.hitTargets.add(player);
                        }
                    }
                }
                
                if (laserSegment.lifetime <= 0) {
                    laserSegment.destroy();
                }
            };
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(laserSegment);
            }
        }
        
        // Reset visual effects
        const render = this.getComponent('Render');
        if (render) {
            render.setTint(null);
            render.setGlow(8, '#ffff66', 0.6);
        }
        
        this.playAttackSound('boss_laser_fire');
        
        // Massive screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(15, 800);
        }
    }

    summonMinions() {
        const minionCount = Math.min(2, this.maxMinions - this.summonedMinions.length);
        
        for (let i = 0; i < minionCount; i++) {
            const angle = (i / minionCount) * Math.PI * 2;
            const distance = 100;
            const pos = this.getPosition();
            
            const minionX = pos.x + Math.cos(angle) * distance;
            const minionY = pos.y + Math.sin(angle) * distance;
            
            // Randomly choose minion type
            const minionTypes = [Grunt, Spitter];
            const MinionClass = MathUtils.randomChoice(minionTypes);
            const minion = new MinionClass(minionX, minionY);
            
            minion.isSummoned = true;
            minion.summoner = this;
            this.summonedMinions.push(minion);
            
            if (window.gameInstance) {
                window.gameInstance.addEntity(minion);
            }
        }
        
        this.playAttackSound('boss_summon');
    }

    createBossProjectile(angle, speed, damage) {
        const projectile = new Entity();
        projectile.addTag('enemy_projectile');
        projectile.damage = damage;
        projectile.owner = this;
        
        const startPos = this.getPosition();
        const spawnDistance = 40;
        const spawnX = startPos.x + Math.cos(angle) * spawnDistance;
        const spawnY = startPos.y + Math.sin(angle) * spawnDistance;
        
        const transform = new Transform(spawnX, spawnY, angle);
        projectile.addComponent(transform);
        
        const physics = new Physics();
        physics.velocity.x = Math.cos(angle) * speed;
        physics.velocity.y = Math.sin(angle) * speed;
        physics.isKinematic = true;
        physics.collisionRadius = 10;
        projectile.addComponent(physics);
        
        const render = new Render('projectile', '#ffff00');
        render.layer = 3;
        render.setGlow(12, '#ffff00', 1.0);
        render.setScale(1.5);
        projectile.addComponent(render);
        
        projectile.lifetime = 5000;
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

    playAttackSound(soundName) {
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound(soundName, {
                position: this.getPosition(),
                spatial: true,
                volume: 1.5
            });
        }
    }

    onEnemyDeath(source) {
        // Epic boss death sequence
        this.createMassiveExplosion();
        
        // Award massive score
        if (source && source.hasTag && source.hasTag('player')) {
            source.score += this.scoreValue;
            source.kills++;
        }
        
        // Trigger victory condition
        if (window.gameInstance) {
            EventManager.emit('boss_defeated', this, source);
        }
        
        super.onEnemyDeath(source);
    }

    createMassiveExplosion() {
        // Create the most epic explosion effect
        for (let wave = 0; wave < 5; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 40; i++) {
                    const particle = new Entity();
                    particle.addTag('particle');
                    
                    const pos = this.getPosition();
                    const angle = (i / 40) * Math.PI * 2;
                    const distance = wave * 30;
                    const speed = 300 + Math.random() * 200;
                    
                    const transform = new Transform(
                        pos.x + Math.cos(angle) * distance,
                        pos.y + Math.sin(angle) * distance,
                        angle
                    );
                    particle.addComponent(transform);
                    
                    const physics = new Physics();
                    physics.velocity.x = Math.cos(angle) * speed;
                    physics.velocity.y = Math.sin(angle) * speed;
                    physics.isKinematic = true;
                    physics.drag = 0.9;
                    particle.addComponent(physics);
                    
                    const colors = ['#ff0000', '#ff8800', '#ffff00', '#ffffff', '#ff00ff'];
                    const color = MathUtils.randomChoice(colors);
                    const render = new Render('particle', color);
                    render.layer = 6;
                    render.setGlow(25, color, 1.0);
                    render.setScale(3.0);
                    particle.addComponent(render);
                    
                    particle.lifetime = 4000;
                    particle.update = (deltaTime) => {
                        Entity.prototype.update.call(particle, deltaTime);
                        
                        particle.lifetime -= deltaTime;
                        const render = particle.getComponent('Render');
                        if (render) {
                            render.setOpacity(particle.lifetime / 4000);
                        }
                        
                        if (particle.lifetime <= 0) {
                            particle.destroy();
                        }
                    };
                    
                    if (window.gameInstance) {
                        window.gameInstance.addEntity(particle);
                    }
                }
                
                // Screen shake for each wave
                if (window.gameInstance && window.gameInstance.renderSystem) {
                    window.gameInstance.renderSystem.addScreenShake(30 - wave * 5, 400);
                }
            }, wave * 200);
        }
    }

    // Additional phase 3 and 4 attacks would be implemented here
    performMeteorStrike() { /* Implementation */ }
    performSpiralBurst() { /* Implementation */ }
    performChargeAttack() { /* Implementation */ }
    performAreaBlast() { /* Implementation */ }
    performUltimateBlast() { /* Implementation */ }
    performMeteorStorm() { /* Implementation */ }
    performLaserSweep() { /* Implementation */ }
    performBerserkerRush() { /* Implementation */ }
    performTeleportSlam() { /* Implementation */ }
}
