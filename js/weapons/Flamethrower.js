// Flamethrower Weapon - Heavy class weapon with continuous fire and area damage
class Flamethrower extends Weapon {
    constructor(owner) {
        super(owner);
        this.damage = 15; // Per tick
        this.fireRate = 100; // Very fast ticks for continuous damage
        this.range = 250;
        this.spread = 30; // Wide cone
        this.bulletSpeed = 300;
        this.bulletLifetime = 500; // Short-lived flame particles
        this.continuous = true;
        this.soundName = 'flamethrower_fire';
        this.particleCount = 5; // Multiple flame particles per fire
        this.burnDuration = 2000; // Burn effect duration
        this.burnDamage = 5; // Damage per second while burning
    }

    createBullets() {
        if (!this.owner || !this.owner.transform) return [];

        const transform = this.owner.transform;
        const bullets = [];
        
        // Create multiple flame particles in a cone
        for (let i = 0; i < this.particleCount; i++) {
            const spawnDistance = 30 + Math.random() * 20;
            const spawnX = transform.x + Math.cos(transform.rotation) * spawnDistance;
            const spawnY = transform.y + Math.sin(transform.rotation) * spawnDistance;
            
            const bullet = this.createFlameBullet(spawnX, spawnY, transform.rotation);
            if (bullet) {
                bullets.push(bullet);
            }
        }

        return bullets;
    }

    createFlameBullet(x, y, angle) {
        // Apply wide spread for flame cone
        const spreadAngle = (Math.random() - 0.5) * this.spread * (Math.PI / 180);
        const finalAngle = angle + spreadAngle;
        
        // Create flame particle
        const bullet = new Entity();
        bullet.addTag('bullet');
        bullet.addTag('flame');
        bullet.damage = this.damage * this.damageMultiplier;
        bullet.owner = this.owner;
        bullet.weaponType = 'flamethrower';
        
        // Add components
        const transform = new Transform(x, y, finalAngle);
        bullet.addComponent(transform);
        
        const physics = new Physics();
        // Variable speed for more organic flame effect
        const speed = this.bulletSpeed * (0.7 + Math.random() * 0.6);
        physics.velocity.x = Math.cos(finalAngle) * speed;
        physics.velocity.y = Math.sin(finalAngle) * speed;
        physics.isKinematic = true;
        physics.collisionRadius = 8; // Larger collision for flames
        physics.drag = 0.95; // Flames slow down over time
        bullet.addComponent(physics);
        
        const render = new Render('bullet', this.getFlameColor());
        render.layer = 4; // Render above normal bullets
        render.setGlow(12, this.getFlameColor(), 1.0);
        render.setScale(1.5 + Math.random() * 0.5); // Variable size
        bullet.addComponent(render);
        
        // Flame-specific properties
        bullet.lifetime = this.bulletLifetime * (0.8 + Math.random() * 0.4);
        bullet.maxRange = this.range * this.rangeMultiplier;
        bullet.startX = x;
        bullet.startY = y;
        bullet.burnDuration = this.burnDuration;
        bullet.burnDamage = this.burnDamage;
        
        // Override bullet update for flame behavior
        const originalUpdate = bullet.update.bind(bullet);
        bullet.update = (deltaTime) => {
            originalUpdate(deltaTime);
            
            // Fade out over time
            const render = bullet.getComponent('Render');
            if (render) {
                const lifetimeRatio = bullet.lifetime / this.bulletLifetime;
                render.setOpacity(lifetimeRatio);
                render.setScale(render.scale.x * 0.998); // Shrink slightly
            }
            
            // Check lifetime
            bullet.lifetime -= deltaTime;
            if (bullet.lifetime <= 0) {
                bullet.destroy();
                return;
            }
            
            // Check range
            const distance = MathUtils.distance(bullet.startX, bullet.startY, transform.x, transform.y);
            if (distance > bullet.maxRange) {
                bullet.destroy();
                return;
            }
        };
        
        // Custom collision handler for burn effect
        bullet.onHit = (target) => {
            this.applyBurnEffect(target);
        };
        
        return bullet;
    }

    getFlameColor() {
        // Random flame colors from yellow to red
        const colors = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00'];
        return MathUtils.randomChoice(colors);
    }

    applyBurnEffect(target) {
        const health = target.getComponent('Health');
        if (!health || target.hasTag('player')) return; // No friendly fire for burn
        
        // Apply immediate damage
        health.takeDamage(this.damage * this.damageMultiplier, this.owner);
        
        // Apply burn effect if not already burning
        if (!target.burning) {
            target.burning = true;
            target.burnTimeLeft = this.burnDuration;
            target.burnDamage = this.burnDamage;
            target.burnSource = this.owner;
            
            // Visual burn effect
            const render = target.getComponent('Render');
            if (render) {
                render.setTint('#ff4400');
            }
            
            // Burn damage over time
            const burnInterval = setInterval(() => {
                if (!target.active || target.burnTimeLeft <= 0) {
                    clearInterval(burnInterval);
                    target.burning = false;
                    if (render) render.setTint(null);
                    return;
                }
                
                const health = target.getComponent('Health');
                if (health) {
                    health.takeDamage(target.burnDamage, target.burnSource);
                }
                
                target.burnTimeLeft -= 100;
            }, 100);
        } else {
            // Refresh burn duration
            target.burnTimeLeft = Math.max(target.burnTimeLeft, this.burnDuration);
        }
    }

    getBulletColor() {
        return this.getFlameColor();
    }

    playFireSound() {
        // Only play sound when starting to fire to avoid spam
        if (!this.soundPlaying && window.gameInstance && window.gameInstance.audioSystem) {
            this.fireSound = window.gameInstance.audioSystem.playSound(this.soundName, {
                position: this.owner.getPosition(),
                spatial: true,
                loop: true
            });
            this.soundPlaying = true;
        }
    }

    stopShooting() {
        super.stopShooting();
        
        // Stop looping fire sound
        if (this.fireSound && this.fireSound.source) {
            this.fireSound.source.stop();
            this.soundPlaying = false;
        }
    }
}
