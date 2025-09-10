// SMG Weapon - Scout class weapon with high fire rate and mobility
class SMG extends Weapon {
    constructor(owner) {
        super(owner);
        this.damage = 20;
        this.fireRate = 150; // Fast fire rate
        this.range = 400;
        this.spread = 15; // Moderate spread
        this.bulletSpeed = 700;
        this.bulletLifetime = 1500;
        this.soundName = 'smg_fire';
        this.ammo = 30;
        this.maxAmmo = 30;
        this.reloadTime = 1500; // Fast reload
        this.burstMode = false;
        this.burstCount = 0;
        this.burstSize = 3;
        this.burstDelay = 50; // Delay between burst shots
    }

    createBullet(x, y, angle) {
        const bullet = super.createBullet(x, y, angle);
        
        if (bullet) {
            // SMG bullets are smaller and faster
            const render = bullet.getComponent('Render');
            if (render) {
                render.setScale(0.8);
                render.setGlow(3, '#44ff44', 0.6);
            }
            
            const physics = bullet.getComponent('Physics');
            if (physics) {
                physics.collisionRadius = 3;
            }
        }
        
        return bullet;
    }

    getBulletColor() {
        return '#44ff44'; // Green bullets for scout
    }

    // Burst fire mode for special ability
    activateBurstMode() {
        this.burstMode = true;
        this.burstCount = 0;
        this.originalFireRate = this.fireRate;
        this.fireRate = this.burstDelay;
    }

    deactivateBurstMode() {
        this.burstMode = false;
        this.burstCount = 0;
        if (this.originalFireRate) {
            this.fireRate = this.originalFireRate;
        }
    }

    fire() {
        if (this.burstMode) {
            return this.fireBurst();
        }
        return super.fire();
    }

    fireBurst() {
        if (!this.canFire()) return [];

        const bullets = super.fire();
        this.burstCount++;

        if (this.burstCount >= this.burstSize) {
            this.deactivateBurstMode();
        }

        return bullets;
    }

    // Override for rapid fire sound
    playFireSound() {
        if (window.gameInstance && window.gameInstance.audioSystem) {
            // Vary pitch slightly for rapid fire effect
            const pitchVariation = 0.9 + Math.random() * 0.2;
            window.gameInstance.audioSystem.playSound(this.soundName, {
                position: this.owner.getPosition(),
                spatial: true,
                pitch: pitchVariation,
                volume: 0.6 // Slightly quieter for rapid fire
            });
        }
    }
}
