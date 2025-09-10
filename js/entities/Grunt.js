// Grunt Enemy - Basic melee enemy that charges at players
class Grunt extends Enemy {
    constructor(x, y) {
        super(x, y, 'grunt');
        this.chargeSpeed = 200;
        this.chargeCooldown = 0;
        this.chargeDistance = 150;
        this.isCharging = false;
        this.chargeDirection = { x: 0, y: 0 };
    }

    seekingBehavior() {
        if (!this.target) return;
        
        const physics = this.getComponent('Physics');
        if (!physics) return;
        
        const transform = this.getComponent('Transform');
        const targetTransform = this.target.getComponent('Transform');
        if (!transform || !targetTransform) return;
        
        const distanceToTarget = transform.distanceTo(targetTransform);
        
        // Check if should charge
        if (this.chargeCooldown <= 0 && distanceToTarget <= this.chargeDistance && distanceToTarget > this.attackRange) {
            this.startCharge();
            return;
        }
        
        // Normal seeking behavior
        super.seekingBehavior();
    }

    startCharge() {
        this.isCharging = true;
        this.chargeCooldown = 3000; // 3 second cooldown
        
        // Calculate charge direction
        const transform = this.getComponent('Transform');
        const targetTransform = this.target.getComponent('Transform');
        if (transform && targetTransform) {
            this.chargeDirection = transform.directionTo(targetTransform);
        }
        
        // Visual effect for charge
        const render = this.getComponent('Render');
        if (render) {
            render.setTint('#ff0000');
            render.setGlow(15, '#ff0000', 1.0);
        }
        
        // Play charge sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('grunt_charge', {
                position: this.getPosition(),
                spatial: true
            });
        }
        
        // Stop charging after duration
        setTimeout(() => {
            this.stopCharge();
        }, 1000);
    }

    stopCharge() {
        this.isCharging = false;
        
        // Remove visual effects
        const render = this.getComponent('Render');
        if (render) {
            render.setTint(null);
            render.setGlow(8, '#ff6666', 0.6);
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update charge cooldown
        if (this.chargeCooldown > 0) {
            this.chargeCooldown -= deltaTime;
        }
        
        // Handle charging movement
        if (this.isCharging) {
            const physics = this.getComponent('Physics');
            if (physics) {
                const chargeForce = 800;
                physics.applyForce(
                    this.chargeDirection.x * chargeForce,
                    this.chargeDirection.y * chargeForce
                );
            }
        }
    }

    performAttack() {
        super.performAttack();
        
        // Grunt has a chance to knockback on attack
        if (this.target && Math.random() < 0.3) {
            const targetPhysics = this.target.getComponent('Physics');
            const transform = this.getComponent('Transform');
            const targetTransform = this.target.getComponent('Transform');
            if (targetPhysics && transform && targetTransform) {
                const knockbackForce = 300;
                const direction = transform.directionTo(targetTransform);
                targetPhysics.applyImpulse(
                    direction.x * knockbackForce,
                    direction.y * knockbackForce
                );
            }
        }
    }
}
