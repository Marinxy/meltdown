// Bullet Entity - Projectiles fired by weapons
class Bullet extends Entity {
    constructor(x, y, angle, speed, damage, owner, options = {}) {
        super();
        
        // Add components
        this.addComponent('Transform', new Transform(x, y, angle));
        this.addComponent('Physics', new Physics(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            0, 0, 0.98 // slight drag
        ));
        this.addComponent('Render', new Render(options.color || '#ffff00', 4, 2));
        this.addComponent('Health', new Health(1));
        
        // Bullet properties
        this.damage = damage;
        this.owner = owner;
        this.maxDistance = options.maxDistance || 600;
        this.piercing = options.piercing || false;
        this.explosive = options.explosive || false;
        this.explosionRadius = options.explosionRadius || 0;
        this.hitTargets = new Set();
        
        // Tracking
        this.startX = x;
        this.startY = y;
        this.distanceTraveled = 0;
        
        // Visual effects
        this.trail = [];
        this.maxTrailLength = 8;
        
        // Lifetime
        this.lifetime = options.lifetime || 3.0;
        this.age = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        const transform = this.getComponent('Transform');
        const physics = this.getComponent('Physics');
        
        // Update age
        this.age += deltaTime;
        
        // Calculate distance traveled
        const dx = transform.x - this.startX;
        const dy = transform.y - this.startY;
        this.distanceTraveled = Math.sqrt(dx * dx + dy * dy);
        
        // Update trail
        this.trail.push({ x: transform.x, y: transform.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Check for destruction conditions
        if (this.age > this.lifetime || this.distanceTraveled > this.maxDistance) {
            this.destroy();
            return;
        }
        
        // Check bounds (assuming game world bounds)
        if (transform.x < -50 || transform.x > 1250 || 
            transform.y < -50 || transform.y > 850) {
            this.destroy();
            return;
        }
    }

    onCollision(other) {
        // Don't hit the owner
        if (other === this.owner) return;
        
        // Don't hit the same target multiple times unless piercing
        if (this.hitTargets.has(other) && !this.piercing) return;
        
        // Check if target can be damaged
        if (other.hasComponent('Health')) {
            const health = other.getComponent('Health');
            
            // Apply damage
            health.takeDamage(this.damage);
            this.hitTargets.add(other);
            
            // Create hit effect
            EventManager.emit('bullet_hit', {
                x: this.getComponent('Transform').x,
                y: this.getComponent('Transform').y,
                target: other,
                damage: this.damage
            });
            
            // Explosive bullets
            if (this.explosive) {
                this.explode();
            }
            
            // Destroy bullet unless piercing
            if (!this.piercing) {
                this.destroy();
            }
        }
    }

    explode() {
        const transform = this.getComponent('Transform');
        
        // Create explosion effect
        EventManager.emit('explosion', {
            x: transform.x,
            y: transform.y,
            radius: this.explosionRadius,
            damage: this.damage * 0.5, // Reduced splash damage
            source: this.owner
        });
    }

    render(ctx) {
        const transform = this.getComponent('Transform');
        const render = this.getComponent('Render');
        
        // Draw trail
        if (this.trail.length > 1) {
            ctx.save();
            ctx.strokeStyle = render.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6;
            
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw bullet
        ctx.save();
        ctx.translate(transform.x, transform.y);
        ctx.rotate(transform.rotation);
        
        // Bullet body
        ctx.fillStyle = render.color;
        ctx.fillRect(-render.width/2, -render.height/2, render.width, render.height);
        
        // Glow effect
        ctx.shadowColor = render.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(-render.width/2, -render.height/2, render.width, render.height);
        
        ctx.restore();
    }

    destroy() {
        // Create destruction effect
        const transform = this.getComponent('Transform');
        EventManager.emit('bullet_destroyed', {
            x: transform.x,
            y: transform.y
        });
        
        super.destroy();
    }
}
