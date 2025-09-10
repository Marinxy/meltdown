// Explosion Entity - Visual and damage effects
class Explosion extends Entity {
    constructor(x, y, radius, damage, source) {
        super();
        
        // Add components
        this.addComponent('Transform', new Transform(x, y, 0));
        this.addComponent('Render', new Render('#ff4400', radius * 2, radius * 2));
        
        // Explosion properties
        this.maxRadius = radius;
        this.damage = damage;
        this.source = source;
        this.currentRadius = 0;
        this.expandSpeed = radius * 8; // Expand quickly
        this.lifetime = 0.3; // Short lived
        this.age = 0;
        this.hasDealtDamage = false;
        
        // Visual effects
        this.particles = [];
        this.shockwaveRadius = 0;
        this.flashIntensity = 1.0;
        
        // Create initial particles
        this.createParticles();
        
        // Screen shake
        EventManager.emit('screen_shake', { intensity: radius * 0.01 });
    }

    createParticles() {
        const particleCount = Math.floor(this.maxRadius / 2);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const speed = 100 + Math.random() * 200;
            const size = 2 + Math.random() * 4;
            
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                life: 1.0,
                decay: 2 + Math.random() * 3
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.age += deltaTime;
        
        // Expand explosion
        if (this.currentRadius < this.maxRadius) {
            this.currentRadius += this.expandSpeed * deltaTime;
            if (this.currentRadius >= this.maxRadius) {
                this.currentRadius = this.maxRadius;
            }
        }
        
        // Deal damage once when fully expanded
        if (!this.hasDealtDamage && this.currentRadius >= this.maxRadius * 0.8) {
            this.dealDamage();
            this.hasDealtDamage = true;
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= particle.decay * deltaTime;
            particle.vx *= 0.95; // Drag
            particle.vy *= 0.95;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update visual effects
        this.shockwaveRadius += 300 * deltaTime;
        this.flashIntensity = Math.max(0, 1 - (this.age / this.lifetime));
        
        // Destroy when lifetime expires
        if (this.age >= this.lifetime) {
            this.destroy();
        }
    }

    dealDamage() {
        const transform = this.getComponent('Transform');
        
        // Find all entities within explosion radius
        // This would typically be done by the physics system
        EventManager.emit('explosion_damage', {
            x: transform.x,
            y: transform.y,
            radius: this.maxRadius,
            damage: this.damage,
            source: this.source
        });
    }

    render(ctx) {
        const transform = this.getComponent('Transform');
        
        ctx.save();
        ctx.translate(transform.x, transform.y);
        
        // Draw shockwave
        if (this.shockwaveRadius < this.maxRadius * 2) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * this.flashIntensity})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw main explosion
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.currentRadius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * this.flashIntensity})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 0, ${0.8 * this.flashIntensity})`);
        gradient.addColorStop(0.6, `rgba(255, 100, 0, ${0.6 * this.flashIntensity})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, ${0.2 * this.flashIntensity})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw particles
        for (const particle of this.particles) {
            const alpha = Math.max(0, particle.life);
            ctx.fillStyle = `rgba(255, ${100 + 155 * alpha}, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Flash effect
        if (this.flashIntensity > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(this.flashIntensity - 0.5) * 0.4})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.maxRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
