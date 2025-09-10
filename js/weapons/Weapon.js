// Base Weapon Class - Foundation for all weapon types
class Weapon {
    constructor(owner) {
        this.owner = owner;
        this.damage = 25;
        this.fireRate = 300; // milliseconds between shots
        this.lastFireTime = 0;
        this.isShooting = false;
        this.bulletType = 'normal';
        this.spread = 0; // degrees
        this.range = 400;
        this.ammo = -1; // -1 for infinite
        this.maxAmmo = -1;
        this.reloadTime = 0;
        this.isReloading = false;
        this.damageMultiplier = 1.0;
        this.fireRateMultiplier = 1.0;
        this.spreadMultiplier = 1.0;
        this.rangeMultiplier = 1.0;
        this.bulletSpeed = 600;
        this.bulletLifetime = 2000; // milliseconds
        this.muzzleFlashDuration = 0;
        this.soundName = 'generic_fire';
        this.continuous = false; // For weapons like flamethrower
    }

    update(deltaTime) {
        // Update reload timer
        if (this.isReloading && this.reloadTime > 0) {
            this.reloadTime -= deltaTime;
            if (this.reloadTime <= 0) {
                this.finishReload();
            }
        }

        // Update muzzle flash
        if (this.muzzleFlashDuration > 0) {
            this.muzzleFlashDuration -= deltaTime;
        }

        // Handle continuous firing
        if (this.isShooting && this.continuous) {
            this.fire();
        }
    }

    startShooting() {
        this.isShooting = true;
        if (!this.continuous) {
            this.fire();
        }
    }

    stopShooting() {
        this.isShooting = false;
    }

    canFire() {
        const currentTime = Date.now();
        const effectiveFireRate = this.fireRate / this.fireRateMultiplier;
        
        return !this.isReloading && 
               (this.ammo !== 0) && 
               (currentTime - this.lastFireTime >= effectiveFireRate);
    }

    fire() {
        if (!this.canFire()) return [];

        this.lastFireTime = Date.now();
        
        // Check ammo
        if (this.ammo > 0) {
            this.ammo--;
            if (this.ammo === 0 && this.maxAmmo > 0) {
                this.startReload();
                return [];
            }
        }

        // Create bullets
        const bullets = this.createBullets();
        
        // Add bullets to game
        if (window.gameInstance && bullets.length > 0) {
            console.log(`Firing ${bullets.length} bullets`);
            for (const bullet of bullets) {
                window.gameInstance.addEntity(bullet);
            }
        } else {
            console.log('No bullets created or gameInstance not available');
        }

        // Play sound effect
        this.playFireSound();
        
        // Muzzle flash
        this.muzzleFlashDuration = 100;
        
        // Screen shake
        if (window.gameInstance && window.gameInstance.renderSystem) {
            window.gameInstance.renderSystem.addScreenShake(2, 50);
        }

        return bullets;
    }

    createBullets() {
        if (!this.owner || !this.owner.transform) return [];

        const transform = this.owner.transform;
        const bullets = [];
        
        // Calculate bullet spawn position (slightly in front of player)
        const spawnDistance = 25;
        const spawnX = transform.x + Math.cos(transform.rotation) * spawnDistance;
        const spawnY = transform.y + Math.sin(transform.rotation) * spawnDistance;
        
        // Create single bullet (override in subclasses for multiple bullets)
        const bullet = this.createBullet(spawnX, spawnY, transform.rotation);
        if (bullet) {
            bullets.push(bullet);
        }

        return bullets;
    }

    createBullet(x, y, angle) {
        // Apply spread
        const effectiveSpread = this.spread * this.spreadMultiplier;
        const spreadAngle = (Math.random() - 0.5) * effectiveSpread * (Math.PI / 180);
        const finalAngle = angle + spreadAngle;
        
        // Create bullet entity
        const bullet = new Entity();
        bullet.addTag('bullet');
        bullet.damage = this.damage * this.damageMultiplier;
        bullet.owner = this.owner;
        bullet.weaponType = this.constructor.name;
        
        // Add components
        const transform = new Transform(x, y, finalAngle);
        bullet.addComponent(transform);
        
        const physics = new Physics();
        physics.velocity.x = Math.cos(finalAngle) * this.bulletSpeed;
        physics.velocity.y = Math.sin(finalAngle) * this.bulletSpeed;
        physics.isKinematic = true; // Bullets aren't affected by forces
        physics.collisionRadius = 4;
        bullet.addComponent(physics);
        
        const render = new Render('bullet', this.getBulletColor());
        render.layer = 3;
        render.setGlow(5, this.getBulletColor(), 0.8);
        bullet.addComponent(render);
        
        // Add bullet lifetime
        bullet.lifetime = this.bulletLifetime;
        bullet.maxRange = this.range * this.rangeMultiplier;
        bullet.startX = x;
        bullet.startY = y;
        
        // Override bullet update to handle lifetime and range
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
        return '#ffff00'; // Default yellow bullets
    }

    playFireSound() {
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound(this.soundName, {
                position: this.owner.getPosition(),
                spatial: true
            });
        }
    }

    startReload() {
        if (this.maxAmmo <= 0 || this.isReloading) return;
        
        this.isReloading = true;
        this.reloadTime = 2000; // 2 seconds default reload time
        
        // Play reload sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            const reloadSound = this.soundName.replace('_fire', '_reload');
            window.gameInstance.audioSystem.playSound(reloadSound, {
                position: this.owner.getPosition(),
                spatial: true
            });
        }
    }

    finishReload() {
        this.isReloading = false;
        this.ammo = this.maxAmmo;
        this.reloadTime = 0;
    }

    // Upgrade system
    addUpgrade(upgrade) {
        switch (upgrade.type) {
            case 'damage':
                this.damageMultiplier *= upgrade.value;
                break;
            case 'fireRate':
                this.fireRateMultiplier *= upgrade.value;
                break;
            case 'spread':
                this.spreadMultiplier *= upgrade.value;
                break;
            case 'range':
                this.rangeMultiplier *= upgrade.value;
                break;
        }
    }

    removeUpgrade(upgrade) {
        switch (upgrade.type) {
            case 'damage':
                this.damageMultiplier /= upgrade.value;
                break;
            case 'fireRate':
                this.fireRateMultiplier /= upgrade.value;
                break;
            case 'spread':
                this.spreadMultiplier /= upgrade.value;
                break;
            case 'range':
                this.rangeMultiplier /= upgrade.value;
                break;
        }
    }

    // Status checks
    isOnCooldown() {
        const currentTime = Date.now();
        const effectiveFireRate = this.fireRate / this.fireRateMultiplier;
        return (currentTime - this.lastFireTime) < effectiveFireRate;
    }

    needsReload() {
        return this.ammo === 0 && this.maxAmmo > 0;
    }

    getAmmoPercentage() {
        if (this.maxAmmo <= 0) return 1; // Infinite ammo
        return this.ammo / this.maxAmmo;
    }

    // Serialization
    serialize() {
        return {
            damage: this.damage,
            fireRate: this.fireRate,
            ammo: this.ammo,
            maxAmmo: this.maxAmmo,
            damageMultiplier: this.damageMultiplier,
            fireRateMultiplier: this.fireRateMultiplier,
            spreadMultiplier: this.spreadMultiplier,
            rangeMultiplier: this.rangeMultiplier
        };
    }

    static deserialize(data, owner) {
        const weapon = new this(owner);
        weapon.damage = data.damage || weapon.damage;
        weapon.fireRate = data.fireRate || weapon.fireRate;
        weapon.ammo = data.ammo !== undefined ? data.ammo : weapon.ammo;
        weapon.maxAmmo = data.maxAmmo || weapon.maxAmmo;
        weapon.damageMultiplier = data.damageMultiplier || 1.0;
        weapon.fireRateMultiplier = data.fireRateMultiplier || 1.0;
        weapon.spreadMultiplier = data.spreadMultiplier || 1.0;
        weapon.rangeMultiplier = data.rangeMultiplier || 1.0;
        return weapon;
    }
}
