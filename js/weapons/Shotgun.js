// Shotgun Weapon - Engineer class weapon with spread damage
class Shotgun extends Weapon {
    constructor(owner) {
        super(owner);
        this.damage = 40; // Per pellet
        this.fireRate = 800; // Slower fire rate
        this.range = 200; // Short range
        this.spread = 45; // Wide spread
        this.bulletSpeed = 500;
        this.bulletLifetime = 800;
        this.soundName = 'shotgun_fire';
        this.ammo = 8;
        this.maxAmmo = 8;
        this.reloadTime = 2500; // Slow reload
        this.pelletCount = 5; // Multiple pellets per shot
    }

    createBullets() {
        if (!this.owner || !this.owner.transform) return [];

        const transform = this.owner.transform;
        const bullets = [];
        
        // Create multiple pellets in a spread pattern
        for (let i = 0; i < this.pelletCount; i++) {
            const spawnDistance = 25;
            const spawnX = transform.x + Math.cos(transform.rotation) * spawnDistance;
            const spawnY = transform.y + Math.sin(transform.rotation) * spawnDistance;
            
            const bullet = this.createPellet(spawnX, spawnY, transform.rotation);
            if (bullet) {
                bullets.push(bullet);
            }
        }

        return bullets;
    }

    createPellet(x, y, angle) {
        // Apply spread - more spread for outer pellets
        const spreadAngle = (Math.random() - 0.5) * this.spread * (Math.PI / 180);
        const finalAngle = angle + spreadAngle;
        
        // Create pellet
        const bullet = new Entity();
        bullet.addTag('bullet');
        bullet.addTag('pellet');
        bullet.damage = this.damage * this.damageMultiplier;
        bullet.owner = this.owner;
        bullet.weaponType = 'shotgun';
        
        // Add components
        const transform = new Transform(x, y, finalAngle);
        bullet.addComponent(transform);
        
        const physics = new Physics();
        physics.velocity.x = Math.cos(finalAngle) * this.bulletSpeed;
        physics.velocity.y = Math.sin(finalAngle) * this.bulletSpeed;
        physics.isKinematic = true;
        physics.collisionRadius = 3;
        physics.drag = 0.98; // Pellets slow down faster
        bullet.addComponent(physics);
        
        const render = new Render('bullet', this.getBulletColor());
        render.layer = 3;
        render.setGlow(4, this.getBulletColor(), 0.7);
        render.setScale(0.7); // Smaller pellets
        bullet.addComponent(render);
        
        // Pellet-specific properties
        bullet.lifetime = this.bulletLifetime;
        bullet.maxRange = this.range * this.rangeMultiplier;
        bullet.startX = x;
        bullet.startY = y;
        
        // Override bullet update for pellet behavior
        const originalUpdate = bullet.update.bind(bullet);
        bullet.update = (deltaTime) => {
            originalUpdate(deltaTime);
            
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
        
        return bullet;
    }

    getBulletColor() {
        return '#4444ff'; // Blue bullets for engineer
    }

    playFireSound() {
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound(this.soundName, {
                position: this.owner.getPosition(),
                spatial: true,
                volume: 1.0 // Loud shotgun blast
            });
        }
    }

    // Override fire to add extra screen shake for shotgun
    fire() {
        const bullets = super.fire();
        
        if (bullets.length > 0) {
            // Extra screen shake for shotgun
            if (window.gameInstance && window.gameInstance.renderSystem) {
                window.gameInstance.renderSystem.addScreenShake(8, 150);
            }
            
            // Knockback effect on owner
            const physics = this.owner.getComponent('Physics');
            if (physics) {
                const knockbackForce = 200;
                const angle = this.owner.transform.rotation + Math.PI; // Opposite direction
                physics.applyImpulse(
                    Math.cos(angle) * knockbackForce,
                    Math.sin(angle) * knockbackForce
                );
            }
        }
        
        return bullets;
    }
}
