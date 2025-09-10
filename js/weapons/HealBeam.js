// Heal Beam Weapon - Medic class weapon for healing teammates
class HealBeam extends Weapon {
    constructor(owner) {
        super(owner);
        this.damage = -25; // Negative damage = healing
        this.fireRate = 100; // Fast healing ticks
        this.range = 300;
        this.spread = 0; // Precise beam
        this.bulletSpeed = 800;
        this.bulletLifetime = 400; // Short beam segments
        this.continuous = true;
        this.soundName = 'heal_beam';
        this.healAmount = 25; // HP per second
        this.maxTargets = 3; // Can heal multiple targets
        this.beamWidth = 20; // Width of heal beam
        this.energyCost = 1; // Energy per second (future feature)
    }

    createBullets() {
        if (!this.owner || !this.owner.transform) return [];

        // Find heal targets in range
        const targets = this.findHealTargets();
        const bullets = [];
        
        // Create heal beam for each target
        for (const target of targets) {
            const beam = this.createHealBeam(target);
            if (beam) {
                bullets.push(beam);
            }
        }

        return bullets;
    }

    findHealTargets() {
        if (!window.gameInstance || !window.gameInstance.physicsSystem) return [];

        const transform = this.owner.transform;
        const nearbyEntities = window.gameInstance.physicsSystem
            .getEntitiesInRadius(transform.x, transform.y, this.range);
        
        const targets = [];
        
        for (const entity of nearbyEntities) {
            if (this.isValidHealTarget(entity)) {
                // Check if target is in front of player (within beam angle)
                const angle = transform.angleTo(entity.transform);
                const angleDiff = Math.abs(MathUtils.angleDifference(transform.rotation, angle));
                
                if (angleDiff <= Math.PI / 6) { // 30 degree cone
                    targets.push(entity);
                }
            }
        }
        
        // Sort by distance and return closest targets
        targets.sort((a, b) => {
            const distA = transform.distanceTo(a.transform);
            const distB = transform.distanceTo(b.transform);
            return distA - distB;
        });
        
        return targets.slice(0, this.maxTargets);
    }

    isValidHealTarget(entity) {
        if (!entity.hasTag('player') || entity === this.owner) return false;
        
        const health = entity.getComponent('Health');
        if (!health || health.isDead()) return false;
        
        // Only heal if target needs healing
        return health.currentHealth < health.maxHealth;
    }

    createHealBeam(target) {
        if (!target || !target.transform) return null;

        const ownerTransform = this.owner.transform;
        const targetTransform = target.transform;
        
        // Calculate beam position (midpoint between owner and target)
        const midX = (ownerTransform.x + targetTransform.x) / 2;
        const midY = (ownerTransform.y + targetTransform.y) / 2;
        const angle = ownerTransform.angleTo(targetTransform);
        
        // Create heal beam entity
        const beam = new Entity();
        beam.addTag('heal_beam');
        beam.damage = this.healAmount * this.damageMultiplier; // Positive for healing
        beam.owner = this.owner;
        beam.target = target;
        beam.weaponType = 'heal_beam';
        
        // Add components
        const transform = new Transform(midX, midY, angle);
        beam.addComponent(transform);
        
        const physics = new Physics();
        physics.isStatic = true; // Beam doesn't move
        physics.collisionRadius = this.beamWidth / 2;
        beam.addComponent(physics);
        
        const render = new Render('heal_beam', this.getBulletColor());
        render.layer = 6; // Render above other effects
        render.setGlow(15, this.getBulletColor(), 0.8);
        render.setScale(2, 0.5); // Wide but thin beam
        beam.addComponent(render);
        
        // Beam-specific properties
        beam.lifetime = this.bulletLifetime;
        beam.healTarget = target;
        
        // Override beam update for healing behavior
        const originalUpdate = beam.update.bind(beam);
        beam.update = (deltaTime) => {
            originalUpdate(deltaTime);
            
            // Update beam position to follow target
            if (beam.healTarget && beam.healTarget.active && beam.healTarget.transform) {
                const ownerPos = this.owner.transform;
                const targetPos = beam.healTarget.transform;
                
                transform.x = (ownerPos.x + targetPos.x) / 2;
                transform.y = (ownerPos.y + targetPos.y) / 2;
                transform.rotation = ownerPos.angleTo(targetPos);
                
                // Apply healing
                this.applyHealing(beam.healTarget, deltaTime);
                
                // Check if still in range
                const distance = ownerPos.distanceTo(targetPos);
                if (distance > this.range) {
                    beam.destroy();
                    return;
                }
            } else {
                beam.destroy();
                return;
            }
            
            // Check lifetime
            beam.lifetime -= deltaTime;
            if (beam.lifetime <= 0) {
                beam.destroy();
                return;
            }
        };
        
        return beam;
    }

    applyHealing(target, deltaTime) {
        const health = target.getComponent('Health');
        if (!health || health.isDead()) return;
        
        const healAmount = (this.healAmount * this.damageMultiplier * deltaTime) / 1000;
        const actualHeal = health.heal(healAmount);
        
        if (actualHeal > 0) {
            // Visual healing effect on target
            const render = target.getComponent('Render');
            if (render) {
                render.flash('#44ffff', 100, 0.3);
            }
            
            // Healing particles effect
            this.createHealingParticles(target);
        }
    }

    createHealingParticles(target) {
        // Create small healing particle effects
        if (Math.random() < 0.3) { // 30% chance per frame
            const particle = new Entity();
            particle.addTag('particle');
            
            const targetPos = target.getPosition();
            const offsetX = (Math.random() - 0.5) * 40;
            const offsetY = (Math.random() - 0.5) * 40;
            
            const transform = new Transform(
                targetPos.x + offsetX,
                targetPos.y + offsetY,
                0
            );
            particle.addComponent(transform);
            
            const physics = new Physics();
            physics.velocity.y = -50; // Float upward
            physics.isKinematic = true;
            physics.drag = 0.95;
            particle.addComponent(physics);
            
            const render = new Render('particle', '#44ffff');
            render.layer = 7;
            render.setGlow(8, '#44ffff', 1.0);
            render.setScale(0.3);
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
    }

    getBulletColor() {
        return '#44ffff'; // Cyan heal beam
    }

    playFireSound() {
        // Only play sound when starting to heal to avoid spam
        if (!this.soundPlaying && window.gameInstance && window.gameInstance.audioSystem) {
            this.fireSound = window.gameInstance.audioSystem.playSound(this.soundName, {
                position: this.owner.getPosition(),
                spatial: true,
                loop: true,
                volume: 0.4 // Quieter healing sound
            });
            this.soundPlaying = true;
        }
    }

    stopShooting() {
        super.stopShooting();
        
        // Stop looping heal sound
        if (this.fireSound && this.fireSound.source) {
            this.fireSound.source.stop();
            this.soundPlaying = false;
        }
    }

    // Override canFire to allow healing even without traditional ammo
    canFire() {
        const currentTime = Date.now();
        const effectiveFireRate = this.fireRate / this.fireRateMultiplier;
        
        return (currentTime - this.lastFireTime >= effectiveFireRate);
    }
}
