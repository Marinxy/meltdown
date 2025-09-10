// Particle System - Manages visual effects, explosions, and particles
class ParticleSystem extends System {
    constructor() {
        super();
        this.particles = [];
        this.explosions = [];
        this.maxParticles = 500;
        this.particlePool = [];
        this.explosionPool = [];
        
        // Particle types and their properties
        this.particleTypes = {
            spark: {
                lifetime: 800,
                size: 0.3,
                color: '#ffaa00',
                glow: 6,
                drag: 0.95,
                gravity: 0.2
            },
            smoke: {
                lifetime: 2000,
                size: 1.5,
                color: '#888888',
                glow: 0,
                drag: 0.98,
                gravity: -0.1,
                opacity: 0.6
            },
            fire: {
                lifetime: 600,
                size: 0.8,
                color: '#ff4400',
                glow: 10,
                drag: 0.92,
                gravity: -0.3
            },
            blood: {
                lifetime: 1500,
                size: 0.4,
                color: '#ff0000',
                glow: 2,
                drag: 0.9,
                gravity: 0.5
            },
            energy: {
                lifetime: 1000,
                size: 0.5,
                color: '#44ffff',
                glow: 8,
                drag: 0.96,
                gravity: 0
            },
            debris: {
                lifetime: 3000,
                size: 0.6,
                color: '#666666',
                glow: 0,
                drag: 0.85,
                gravity: 0.8
            },
            muzzleFlash: {
                lifetime: 100,
                size: 1.2,
                color: '#ffff88',
                glow: 15,
                drag: 0.8,
                gravity: 0
            }
        };
        
        // Explosion types
        this.explosionTypes = {
            small: {
                radius: 50,
                duration: 500,
                particleCount: 15,
                damage: 25,
                force: 300
            },
            medium: {
                radius: 80,
                duration: 800,
                particleCount: 25,
                damage: 50,
                force: 500
            },
            large: {
                radius: 120,
                duration: 1200,
                particleCount: 40,
                damage: 100,
                force: 800
            },
            massive: {
                radius: 200,
                duration: 2000,
                particleCount: 60,
                damage: 200,
                force: 1200
            }
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (window.gameInstance && window.gameInstance.eventManager) {
            // Listen for events that should create particles
            window.gameInstance.eventManager.on('weapon:fired', (weapon, position) => {
                this.createMuzzleFlash(position, weapon.type);
            });
            
            window.gameInstance.eventManager.on('enemy:damaged', (enemy, damage, source) => {
                this.createBloodSplatter(enemy.getPosition(), damage);
            });
            
            window.gameInstance.eventManager.on('player:damaged', (player, damage, source) => {
                this.createBloodSplatter(player.getPosition(), damage);
            });
            
            window.gameInstance.eventManager.on('enemy:killed', (enemy, killer) => {
                this.createDeathExplosion(enemy.getPosition(), enemy.enemyType);
            });
            
            window.gameInstance.eventManager.on('projectile:hit', (projectile, target) => {
                this.createImpactEffect(projectile.getPosition(), projectile.type);
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update explosions
        this.updateExplosions(deltaTime);
        
        // Clean up dead particles
        this.cleanupParticles();
        
        // Manage particle count
        this.manageParticleCount();
    }

    updateParticles(deltaTime) {
        for (const particle of this.particles) {
            if (!particle.active) continue;
            
            // Update lifetime
            particle.lifetime -= deltaTime;
            if (particle.lifetime <= 0) {
                particle.active = false;
                continue;
            }
            
            // Update physics
            this.updateParticlePhysics(particle, deltaTime);
            
            // Update visual properties
            this.updateParticleVisuals(particle);
        }
    }

    updateParticlePhysics(particle, deltaTime) {
        const dt = deltaTime / 1000;
        
        // Apply gravity
        if (particle.gravity) {
            particle.velocity.y += particle.gravity * dt * 100;
        }
        
        // Apply drag
        if (particle.drag) {
            particle.velocity.x *= particle.drag;
            particle.velocity.y *= particle.drag;
        }
        
        // Update position
        particle.position.x += particle.velocity.x * dt;
        particle.position.y += particle.velocity.y * dt;
        
        // Update rotation if applicable
        if (particle.angularVelocity) {
            particle.rotation += particle.angularVelocity * dt;
        }
    }

    updateParticleVisuals(particle) {
        const lifeRatio = particle.lifetime / particle.maxLifetime;
        
        // Fade out over time
        particle.opacity = particle.baseOpacity * lifeRatio;
        
        // Scale changes
        if (particle.scaleOverTime) {
            particle.scale = particle.baseScale * (1 + (1 - lifeRatio) * particle.scaleOverTime);
        }
        
        // Color transitions
        if (particle.colorTransition) {
            particle.color = this.interpolateColor(
                particle.startColor,
                particle.endColor,
                1 - lifeRatio
            );
        }
    }

    updateExplosions(deltaTime) {
        for (const explosion of this.explosions) {
            if (!explosion.active) continue;
            
            explosion.timer += deltaTime;
            
            // Update explosion visuals
            const progress = explosion.timer / explosion.duration;
            explosion.currentRadius = explosion.maxRadius * Math.min(1, progress * 2);
            explosion.opacity = Math.max(0, 1 - progress);
            
            if (explosion.timer >= explosion.duration) {
                explosion.active = false;
            }
        }
    }

    cleanupParticles() {
        // Move inactive particles back to pool
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            if (!particle.active) {
                this.particlePool.push(particle);
                this.particles.splice(i, 1);
            }
        }
        
        // Clean up explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            if (!explosion.active) {
                this.explosionPool.push(explosion);
                this.explosions.splice(i, 1);
            }
        }
    }

    manageParticleCount() {
        // Remove oldest particles if over limit
        while (this.particles.length > this.maxParticles) {
            const oldestParticle = this.particles.shift();
            this.particlePool.push(oldestParticle);
        }
    }

    // Particle creation methods
    createParticle(type, position, velocity = {x: 0, y: 0}, options = {}) {
        const particleType = this.particleTypes[type] || this.particleTypes.spark;
        
        let particle = this.particlePool.pop();
        if (!particle) {
            particle = this.createNewParticle();
        }
        
        // Reset particle properties
        particle.active = true;
        particle.type = type;
        particle.position = { x: position.x, y: position.y };
        particle.velocity = { x: velocity.x, y: velocity.y };
        particle.rotation = options.rotation || 0;
        particle.angularVelocity = options.angularVelocity || 0;
        
        // Set type-specific properties
        particle.lifetime = particleType.lifetime * (0.8 + Math.random() * 0.4);
        particle.maxLifetime = particle.lifetime;
        particle.scale = particleType.size * (0.8 + Math.random() * 0.4);
        particle.baseScale = particle.scale;
        particle.color = options.color || particleType.color;
        particle.glow = particleType.glow;
        particle.drag = particleType.drag;
        particle.gravity = particleType.gravity;
        particle.opacity = options.opacity || 1.0;
        particle.baseOpacity = particle.opacity;
        
        // Optional properties
        particle.scaleOverTime = options.scaleOverTime || 0;
        particle.colorTransition = options.colorTransition || false;
        if (particle.colorTransition) {
            particle.startColor = particle.color;
            particle.endColor = options.endColor || '#000000';
        }
        
        this.particles.push(particle);
        return particle;
    }

    createNewParticle() {
        return {
            active: false,
            type: 'spark',
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            rotation: 0,
            angularVelocity: 0,
            lifetime: 0,
            maxLifetime: 0,
            scale: 1,
            baseScale: 1,
            color: '#ffffff',
            glow: 0,
            drag: 1,
            gravity: 0,
            opacity: 1,
            baseOpacity: 1,
            scaleOverTime: 0,
            colorTransition: false,
            startColor: '#ffffff',
            endColor: '#000000'
        };
    }

    // Explosion creation
    createExplosion(type, position, options = {}) {
        const explosionType = this.explosionTypes[type] || this.explosionTypes.small;
        
        let explosion = this.explosionPool.pop();
        if (!explosion) {
            explosion = this.createNewExplosion();
        }
        
        // Set explosion properties
        explosion.active = true;
        explosion.type = type;
        explosion.position = { x: position.x, y: position.y };
        explosion.maxRadius = explosionType.radius;
        explosion.currentRadius = 0;
        explosion.duration = explosionType.duration;
        explosion.timer = 0;
        explosion.opacity = 1.0;
        explosion.damage = explosionType.damage;
        explosion.force = explosionType.force;
        explosion.owner = options.owner || null;
        
        this.explosions.push(explosion);
        
        // Create explosion particles
        this.createExplosionParticles(position, explosionType.particleCount, type);
        
        // Apply explosion effects
        this.applyExplosionEffects(explosion);
        
        // Emit explosion event
        if (window.gameInstance) {
            window.gameInstance.eventManager.emit('explosion:created', explosion);
        }
        
        return explosion;
    }

    createNewExplosion() {
        return {
            active: false,
            type: 'small',
            position: { x: 0, y: 0 },
            maxRadius: 0,
            currentRadius: 0,
            duration: 0,
            timer: 0,
            opacity: 1,
            damage: 0,
            force: 0,
            owner: null
        };
    }

    createExplosionParticles(position, count, explosionType) {
        const particleTypes = ['fire', 'spark', 'smoke', 'debris'];
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const speed = 100 + Math.random() * 200;
            const particleType = MathUtils.randomChoice(particleTypes);
            
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            const options = {
                scaleOverTime: particleType === 'smoke' ? 2.0 : 0.5,
                colorTransition: particleType === 'fire',
                endColor: particleType === 'fire' ? '#440000' : undefined,
                angularVelocity: (Math.random() - 0.5) * 10
            };
            
            this.createParticle(particleType, position, velocity, options);
        }
    }

    applyExplosionEffects(explosion) {
        if (!window.gameInstance || !window.gameInstance.physicsSystem) return;
        
        // Get entities in explosion radius
        const nearbyEntities = window.gameInstance.physicsSystem
            .getEntitiesInRadius(explosion.position.x, explosion.position.y, explosion.maxRadius);
        
        for (const entity of nearbyEntities) {
            const distance = MathUtils.distance(
                explosion.position.x, explosion.position.y,
                entity.transform.x, entity.transform.y
            );
            
            if (distance <= explosion.maxRadius) {
                // Calculate damage and force falloff
                const falloff = 1 - (distance / explosion.maxRadius);
                const damage = explosion.damage * falloff;
                const force = explosion.force * falloff;
                
                // Apply damage
                const health = entity.getComponent('Health');
                if (health && entity !== explosion.owner) {
                    health.takeDamage(damage, explosion.owner);
                }
                
                // Apply knockback
                const physics = entity.getComponent('Physics');
                if (physics) {
                    const angle = MathUtils.angle(
                        explosion.position.x, explosion.position.y,
                        entity.transform.x, entity.transform.y
                    );
                    
                    physics.applyImpulse(
                        Math.cos(angle) * force,
                        Math.sin(angle) * force
                    );
                }
            }
        }
        
        // Screen shake
        if (window.gameInstance.renderSystem) {
            const shakeIntensity = Math.min(20, explosion.maxRadius / 10);
            const shakeDuration = explosion.duration / 2;
            window.gameInstance.renderSystem.addScreenShake(shakeIntensity, shakeDuration);
        }
        
        // Play explosion sound
        if (window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('explosion_' + explosion.type, {
                position: explosion.position,
                spatial: true,
                volume: Math.min(1.0, explosion.maxRadius / 100)
            });
        }
    }

    // Specific effect creation methods
    createMuzzleFlash(position, weaponType) {
        const flashCount = weaponType === 'shotgun' ? 8 : 4;
        
        for (let i = 0; i < flashCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            this.createParticle('muzzleFlash', position, velocity, {
                scaleOverTime: -0.5,
                colorTransition: true,
                endColor: '#ff4400'
            });
        }
    }

    createBloodSplatter(position, damage) {
        const particleCount = Math.min(10, Math.floor(damage / 5));
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 70;
            
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            this.createParticle('blood', position, velocity);
        }
    }

    createDeathExplosion(position, enemyType) {
        let explosionType = 'small';
        
        switch (enemyType) {
            case 'bruiser':
                explosionType = 'medium';
                break;
            case 'miniboss':
                explosionType = 'large';
                break;
            case 'boss':
                explosionType = 'massive';
                break;
        }
        
        this.createExplosion(explosionType, position);
    }

    createImpactEffect(position, projectileType) {
        const sparkCount = 5;
        
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 60;
            
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            this.createParticle('spark', position, velocity);
        }
    }

    createHealingEffect(position) {
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const speed = 20 + Math.random() * 30;
            
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed - 50 // Float upward
            };
            
            this.createParticle('energy', position, velocity, {
                color: '#44ffff',
                scaleOverTime: 1.0
            });
        }
    }

    createTrailEffect(startPos, endPos, particleType = 'spark', count = 5) {
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const position = {
                x: startPos.x + (endPos.x - startPos.x) * t,
                y: startPos.y + (endPos.y - startPos.y) * t
            };
            
            const velocity = {
                x: (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 20
            };
            
            this.createParticle(particleType, position, velocity, {
                scaleOverTime: -0.3
            });
        }
    }

    // Utility methods
    interpolateColor(color1, color2, t) {
        // Simple color interpolation (assumes hex colors)
        // This is a simplified version - a full implementation would handle RGB properly
        return color1; // Placeholder
    }

    getParticleCount() {
        return this.particles.length;
    }

    getExplosionCount() {
        return this.explosions.length;
    }

    clearAllEffects() {
        // Move all active particles and explosions to pools
        for (const particle of this.particles) {
            particle.active = false;
            this.particlePool.push(particle);
        }
        
        for (const explosion of this.explosions) {
            explosion.active = false;
            this.explosionPool.push(explosion);
        }
        
        this.particles = [];
        this.explosions = [];
    }

    // Rendering integration (called by RenderSystem)
    renderParticles(ctx, camera) {
        // Render explosions first (background)
        for (const explosion of this.explosions) {
            this.renderExplosion(ctx, camera, explosion);
        }
        
        // Render particles
        for (const particle of this.particles) {
            this.renderParticle(ctx, camera, particle);
        }
    }

    renderParticle(ctx, camera, particle) {
        if (!particle.active) return;
        
        const screenX = particle.position.x - camera.x;
        const screenY = particle.position.y - camera.y;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.opacity;
        
        // Apply glow effect
        if (particle.glow > 0) {
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.glow;
        }
        
        // Draw particle
        ctx.fillStyle = particle.color;
        const size = particle.scale * 4;
        ctx.fillRect(-size/2, -size/2, size, size);
        
        ctx.restore();
    }

    renderExplosion(ctx, camera, explosion) {
        if (!explosion.active) return;
        
        const screenX = explosion.position.x - camera.x;
        const screenY = explosion.position.y - camera.y;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.globalAlpha = explosion.opacity;
        
        // Create radial gradient for explosion
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, explosion.currentRadius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.6)');
        gradient.addColorStop(0.7, 'rgba(255, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, explosion.currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // Serialization
    serialize() {
        return {
            particleCount: this.particles.length,
            explosionCount: this.explosions.length
        };
    }
}
