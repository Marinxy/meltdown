// Physics System - Handles movement, collision detection, and physics simulation
class PhysicsSystem extends System {
    constructor(worldBounds = { x: 0, y: 0, width: 1200, height: 800 }) {
        super();
        this.requiredComponents = ['Transform', 'Physics'];
        this.priority = 1;
        this.worldBounds = worldBounds;
        this.spatialGrid = new Map(); // Simple spatial partitioning
        this.gridSize = 100;
        this.collisionPairs = [];
    }

    updateEntity(entity, deltaTime) {
        const physics = entity.getComponent('Physics');
        const transform = entity.getComponent('Transform');
        
        if (!physics || !transform) return;

        // Update physics component (handles velocity, acceleration, etc.)
        physics.update(deltaTime);

        // Handle world boundaries
        this.handleWorldBounds(entity);

        // Update spatial grid for collision detection
        this.updateSpatialGrid(entity);
    }

    handleWorldBounds(entity) {
        const transform = entity.getComponent('Transform');
        const physics = entity.getComponent('Physics');
        
        if (!transform || !physics) return;

        const bounds = this.worldBounds;
        const radius = physics.collisionRadius;

        // Bounce off boundaries or wrap around based on entity type
        if (entity.hasTag('player') || entity.hasTag('enemy')) {
            // Keep players and enemies within bounds
            if (transform.x < radius) {
                transform.x = radius;
                physics.velocity.x = Math.abs(physics.velocity.x) * physics.bounceX;
            }
            if (transform.x > bounds.width - radius) {
                transform.x = bounds.width - radius;
                physics.velocity.x = -Math.abs(physics.velocity.x) * physics.bounceX;
            }
            if (transform.y < radius) {
                transform.y = radius;
                physics.velocity.y = Math.abs(physics.velocity.y) * physics.bounceY;
            }
            if (transform.y > bounds.height - radius) {
                transform.y = bounds.height - radius;
                physics.velocity.y = -Math.abs(physics.velocity.y) * physics.bounceY;
            }
        } else if (entity.hasTag('bullet')) {
            // Remove bullets that go out of bounds
            if (transform.x < -radius || transform.x > bounds.width + radius ||
                transform.y < -radius || transform.y > bounds.height + radius) {
                entity.destroy();
            }
        }
    }

    updateSpatialGrid(entity) {
        const transform = entity.getComponent('Transform');
        if (!transform) return;

        const gridX = Math.floor(transform.x / this.gridSize);
        const gridY = Math.floor(transform.y / this.gridSize);
        const key = `${gridX},${gridY}`;

        if (!this.spatialGrid.has(key)) {
            this.spatialGrid.set(key, new Set());
        }
        
        this.spatialGrid.get(key).add(entity);
    }

    update(deltaTime) {
        // Clear spatial grid
        this.spatialGrid.clear();
        this.collisionPairs = [];

        // Update all entities
        super.update(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Process collision responses
        this.processCollisions();
    }

    checkCollisions() {
        const checkedPairs = new Set();

        // Check collisions within each grid cell and adjacent cells
        for (const [key, entities] of this.spatialGrid) {
            const entitiesArray = Array.from(entities);
            
            // Check collisions within this cell
            for (let i = 0; i < entitiesArray.length; i++) {
                for (let j = i + 1; j < entitiesArray.length; j++) {
                    const entityA = entitiesArray[i];
                    const entityB = entitiesArray[j];
                    
                    const pairKey = this.getPairKey(entityA, entityB);
                    if (checkedPairs.has(pairKey)) continue;
                    checkedPairs.add(pairKey);

                    if (this.shouldCheckCollision(entityA, entityB)) {
                        const collision = this.checkEntityCollision(entityA, entityB);
                        if (collision) {
                            this.collisionPairs.push(collision);
                        }
                    }
                }
            }
        }
    }

    getPairKey(entityA, entityB) {
        return entityA.id < entityB.id ? `${entityA.id}-${entityB.id}` : `${entityB.id}-${entityA.id}`;
    }

    shouldCheckCollision(entityA, entityB) {
        // Define collision rules based on entity tags
        const tagsA = Array.from(entityA.tags);
        const tagsB = Array.from(entityB.tags);

        // Bullets collide with enemies and players (but not other bullets)
        if (tagsA.includes('bullet') && tagsB.includes('enemy')) return true;
        if (tagsA.includes('enemy') && tagsB.includes('bullet')) return true;
        if (tagsA.includes('bullet') && tagsB.includes('player')) return true;
        if (tagsA.includes('player') && tagsB.includes('bullet')) return true;

        // Players collide with enemies
        if (tagsA.includes('player') && tagsB.includes('enemy')) return true;
        if (tagsA.includes('enemy') && tagsB.includes('player')) return true;

        // Enemies collide with each other (for separation)
        if (tagsA.includes('enemy') && tagsB.includes('enemy')) return true;

        // Players collide with power-ups
        if (tagsA.includes('player') && tagsB.includes('powerup')) return true;
        if (tagsA.includes('powerup') && tagsB.includes('player')) return true;

        return false;
    }

    checkEntityCollision(entityA, entityB) {
        const physicsA = entityA.getComponent('Physics');
        const physicsB = entityB.getComponent('Physics');
        const transformA = entityA.getComponent('Transform');
        const transformB = entityB.getComponent('Transform');

        if (!physicsA || !physicsB || !transformA || !transformB) return null;

        const distance = transformA.distanceTo(transformB);
        const combinedRadius = physicsA.collisionRadius + physicsB.collisionRadius;

        if (distance <= combinedRadius) {
            return {
                entityA,
                entityB,
                distance,
                combinedRadius,
                overlap: combinedRadius - distance,
                normal: this.getCollisionNormal(transformA, transformB)
            };
        }

        return null;
    }

    getCollisionNormal(transformA, transformB) {
        const dx = transformB.x - transformA.x;
        const dy = transformB.y - transformA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return { x: 1, y: 0 };
        
        return {
            x: dx / distance,
            y: dy / distance
        };
    }

    processCollisions() {
        for (const collision of this.collisionPairs) {
            this.resolveCollision(collision);
        }
    }

    resolveCollision(collision) {
        const { entityA, entityB, overlap, normal } = collision;
        const physicsA = entityA.getComponent('Physics');
        const physicsB = entityB.getComponent('Physics');
        const transformA = entityA.getComponent('Transform');
        const transformB = entityB.getComponent('Transform');

        // Handle different collision types
        this.handleCollisionEffects(entityA, entityB);

        // Physical separation (only for non-static entities)
        if (!physicsA.isStatic && !physicsB.isStatic) {
            const totalMass = physicsA.mass + physicsB.mass;
            const separationA = (physicsB.mass / totalMass) * overlap * 0.5;
            const separationB = (physicsA.mass / totalMass) * overlap * 0.5;

            transformA.x -= normal.x * separationA;
            transformA.y -= normal.y * separationA;
            transformB.x += normal.x * separationB;
            transformB.y += normal.y * separationB;
        } else if (!physicsA.isStatic) {
            transformA.x -= normal.x * overlap;
            transformA.y -= normal.y * overlap;
        } else if (!physicsB.isStatic) {
            transformB.x += normal.x * overlap;
            transformB.y += normal.y * overlap;
        }
    }

    handleCollisionEffects(entityA, entityB) {
        // Bullet hits
        if (entityA.hasTag('bullet') && entityB.hasTag('enemy')) {
            this.handleBulletHit(entityA, entityB);
        } else if (entityB.hasTag('bullet') && entityA.hasTag('enemy')) {
            this.handleBulletHit(entityB, entityA);
        } else if (entityA.hasTag('bullet') && entityB.hasTag('player')) {
            this.handleBulletHit(entityA, entityB);
        } else if (entityB.hasTag('bullet') && entityA.hasTag('player')) {
            this.handleBulletHit(entityB, entityA);
        }

        // Player-enemy collision
        else if (entityA.hasTag('player') && entityB.hasTag('enemy')) {
            this.handlePlayerEnemyCollision(entityA, entityB);
        } else if (entityB.hasTag('player') && entityA.hasTag('enemy')) {
            this.handlePlayerEnemyCollision(entityB, entityA);
        }

        // Power-up collection
        else if (entityA.hasTag('player') && entityB.hasTag('powerup')) {
            this.handlePowerupCollection(entityA, entityB);
        } else if (entityB.hasTag('player') && entityA.hasTag('powerup')) {
            this.handlePowerupCollection(entityB, entityA);
        }
    }

    handleBulletHit(bullet, target) {
        const bulletDamage = bullet.damage || 25;
        const targetHealth = target.getComponent('Health');
        
        if (targetHealth) {
            targetHealth.takeDamage(bulletDamage, bullet);
        }

        // Create impact effect
        if (window.gameInstance) {
            const bulletTransform = bullet.getComponent('Transform');
            if (bulletTransform) {
                window.gameInstance.createExplosion(
                    bulletTransform.x,
                    bulletTransform.y,
                    { size: 'small', color: '#ffff00' }
                );
            }
        }

        // Destroy bullet
        bullet.destroy();
    }

    handlePlayerEnemyCollision(player, enemy) {
        const playerHealth = player.getComponent('Health');
        const enemyDamage = enemy.damage || 15;
        
        if (playerHealth && !playerHealth.invulnerable) {
            playerHealth.takeDamage(enemyDamage, enemy);
            playerHealth.setInvulnerable(1000); // 1 second invulnerability
        }
    }

    handlePowerupCollection(player, powerup) {
        // Apply powerup effect
        if (powerup.effect && window.gameInstance) {
            powerup.effect(player);
        }

        // Destroy powerup
        powerup.destroy();

        // Play collection sound
        if (window.gameInstance && window.gameInstance.audioSystem) {
            window.gameInstance.audioSystem.playSound('powerup_pickup');
        }
    }

    // Utility methods
    getEntitiesInRadius(centerX, centerY, radius) {
        const result = [];
        const gridRadius = Math.ceil(radius / this.gridSize);
        const centerGridX = Math.floor(centerX / this.gridSize);
        const centerGridY = Math.floor(centerY / this.gridSize);

        for (let x = centerGridX - gridRadius; x <= centerGridX + gridRadius; x++) {
            for (let y = centerGridY - gridRadius; y <= centerGridY + gridRadius; y++) {
                const key = `${x},${y}`;
                const entities = this.spatialGrid.get(key);
                
                if (entities) {
                    for (const entity of entities) {
                        const transform = entity.getComponent('Transform');
                        if (transform && MathUtils.distance(centerX, centerY, transform.x, transform.y) <= radius) {
                            result.push(entity);
                        }
                    }
                }
            }
        }

        return result;
    }

    setWorldBounds(x, y, width, height) {
        this.worldBounds = { x, y, width, height };
    }
}
