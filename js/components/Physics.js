// Physics Component - Velocity, acceleration, and collision
class Physics extends Component {
    constructor() {
        super();
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.mass = 1;
        this.friction = 0.98;
        this.maxSpeed = 500;
        this.drag = 0.99;
        this.bounceX = 0;
        this.bounceY = 0;
        this.collisionRadius = 16;
        this.isKinematic = false; // If true, not affected by physics forces
        this.isStatic = false; // If true, doesn't move at all
    }

    update(deltaTime) {
        if (this.isStatic) return;

        const transform = this.getComponent('Transform');
        if (!transform) return;

        if (!this.isKinematic) {
            // Apply acceleration to velocity
            this.velocity.x += this.acceleration.x * deltaTime;
            this.velocity.y += this.acceleration.y * deltaTime;

            // Apply drag
            this.velocity.x *= this.drag;
            this.velocity.y *= this.drag;

            // Apply friction
            this.velocity.x *= this.friction;
            this.velocity.y *= this.friction;

            // Clamp to max speed
            this.clampSpeed();
        }

        // Apply velocity to position
        transform.translate(
            this.velocity.x * deltaTime,
            this.velocity.y * deltaTime
        );

        // Reset acceleration (forces need to be applied each frame)
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    // Force application
    applyForce(fx, fy) {
        if (this.isStatic || this.isKinematic) return;
        
        this.acceleration.x += fx / this.mass;
        this.acceleration.y += fy / this.mass;
    }

    applyImpulse(ix, iy) {
        if (this.isStatic || this.isKinematic) return;
        
        this.velocity.x += ix / this.mass;
        this.velocity.y += iy / this.mass;
    }

    // Velocity management
    setVelocity(vx, vy) {
        this.velocity.x = vx;
        this.velocity.y = vy;
    }

    addVelocity(vx, vy) {
        this.velocity.x += vx;
        this.velocity.y += vy;
    }

    clampSpeed() {
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > this.maxSpeed) {
            const scale = this.maxSpeed / speed;
            this.velocity.x *= scale;
            this.velocity.y *= scale;
        }
    }

    getSpeed() {
        return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    }

    getDirection() {
        const speed = this.getSpeed();
        if (speed === 0) return { x: 0, y: 0 };
        return {
            x: this.velocity.x / speed,
            y: this.velocity.y / speed
        };
    }

    // Movement helpers
    moveToward(targetX, targetY, force) {
        const transform = this.getComponent('Transform');
        if (!transform) return;

        const dx = targetX - transform.x;
        const dy = targetY - transform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            this.applyForce(normalizedX * force, normalizedY * force);
        }
    }

    moveInDirection(angle, force) {
        const fx = Math.cos(angle) * force;
        const fy = Math.sin(angle) * force;
        this.applyForce(fx, fy);
    }

    // Collision detection helpers
    checkCollisionWith(other) {
        const transform = this.getComponent('Transform');
        const otherTransform = other.getComponent('Transform');
        const otherPhysics = other.getComponent('Physics');

        if (!transform || !otherTransform || !otherPhysics) return false;

        const distance = transform.distanceTo(otherTransform);
        return distance <= (this.collisionRadius + otherPhysics.collisionRadius);
    }

    // Bounce off boundaries
    bounceOffBounds(minX, minY, maxX, maxY) {
        const transform = this.getComponent('Transform');
        if (!transform) return;

        if (transform.x <= minX + this.collisionRadius) {
            transform.x = minX + this.collisionRadius;
            this.velocity.x = Math.abs(this.velocity.x) * this.bounceX;
        }
        if (transform.x >= maxX - this.collisionRadius) {
            transform.x = maxX - this.collisionRadius;
            this.velocity.x = -Math.abs(this.velocity.x) * this.bounceX;
        }
        if (transform.y <= minY + this.collisionRadius) {
            transform.y = minY + this.collisionRadius;
            this.velocity.y = Math.abs(this.velocity.y) * this.bounceY;
        }
        if (transform.y >= maxY - this.collisionRadius) {
            transform.y = maxY - this.collisionRadius;
            this.velocity.y = -Math.abs(this.velocity.y) * this.bounceY;
        }
    }

    // Wrap around boundaries
    wrapAroundBounds(minX, minY, maxX, maxY) {
        const transform = this.getComponent('Transform');
        if (!transform) return;

        if (transform.x < minX) transform.x = maxX;
        if (transform.x > maxX) transform.x = minX;
        if (transform.y < minY) transform.y = maxY;
        if (transform.y > maxY) transform.y = minY;
    }

    // Stop all movement
    stop() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    // Serialization
    serialize() {
        return {
            ...super.serialize(),
            velocity: { ...this.velocity },
            acceleration: { ...this.acceleration },
            mass: this.mass,
            friction: this.friction,
            maxSpeed: this.maxSpeed,
            drag: this.drag,
            bounceX: this.bounceX,
            bounceY: this.bounceY,
            collisionRadius: this.collisionRadius,
            isKinematic: this.isKinematic,
            isStatic: this.isStatic
        };
    }

    static deserialize(data) {
        const physics = new Physics();
        physics.active = data.active !== undefined ? data.active : true;
        physics.velocity = data.velocity || { x: 0, y: 0 };
        physics.acceleration = data.acceleration || { x: 0, y: 0 };
        physics.mass = data.mass || 1;
        physics.friction = data.friction || 0.98;
        physics.maxSpeed = data.maxSpeed || 500;
        physics.drag = data.drag || 0.99;
        physics.bounceX = data.bounceX || 0;
        physics.bounceY = data.bounceY || 0;
        physics.collisionRadius = data.collisionRadius || 16;
        physics.isKinematic = data.isKinematic || false;
        physics.isStatic = data.isStatic || false;
        return physics;
    }
}
