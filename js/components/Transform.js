// Transform Component - Position, rotation, and scale
class Transform extends Component {
    constructor(x = 0, y = 0, rotation = 0) {
        super();
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scale = { x: 1, y: 1 };
        this.lastX = x;
        this.lastY = y;
        this.lastRotation = rotation;
    }

    // Movement methods
    translate(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    rotate(angle) {
        this.rotation += angle;
        this.rotation = MathUtils.wrapAngle(this.rotation);
    }

    setScale(sx, sy = sx) {
        this.scale.x = sx;
        this.scale.y = sy;
    }

    // Position utilities
    getWorldPosition() {
        return { x: this.x, y: this.y };
    }

    getDirection() {
        return {
            x: Math.cos(this.rotation),
            y: Math.sin(this.rotation)
        };
    }

    getForwardVector() {
        return this.getDirection();
    }

    getRightVector() {
        return {
            x: Math.cos(this.rotation + Math.PI / 2),
            y: Math.sin(this.rotation + Math.PI / 2)
        };
    }

    // Distance and angle calculations
    distanceTo(other) {
        if (other instanceof Transform) {
            return MathUtils.distance(this.x, this.y, other.x, other.y);
        }
        return MathUtils.distance(this.x, this.y, other.x, other.y);
    }

    angleTo(other) {
        if (other instanceof Transform) {
            return MathUtils.angle(this.x, this.y, other.x, other.y);
        }
        return MathUtils.angle(this.x, this.y, other.x, other.y);
    }

    lookAt(target) {
        if (target instanceof Transform) {
            this.rotation = this.angleTo(target);
        } else {
            this.rotation = MathUtils.angle(this.x, this.y, target.x, target.y);
        }
    }

    // Interpolation for smooth movement
    lerpTo(target, t) {
        this.x = MathUtils.lerp(this.x, target.x, t);
        this.y = MathUtils.lerp(this.y, target.y, t);
        
        // Handle angle interpolation properly
        const angleDiff = MathUtils.angleDifference(this.rotation, target.rotation);
        this.rotation += angleDiff * t;
        this.rotation = MathUtils.wrapAngle(this.rotation);
    }

    // Update method to track previous position
    update(deltaTime) {
        this.lastX = this.x;
        this.lastY = this.y;
        this.lastRotation = this.rotation;
    }

    // Get velocity based on position change
    getVelocity(deltaTime) {
        if (deltaTime <= 0) return { x: 0, y: 0 };
        
        return {
            x: (this.x - this.lastX) / deltaTime,
            y: (this.y - this.lastY) / deltaTime
        };
    }

    // Serialization
    serialize() {
        return {
            ...super.serialize(),
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            scale: { ...this.scale }
        };
    }

    static deserialize(data) {
        const transform = new Transform(data.x, data.y, data.rotation);
        transform.active = data.active !== undefined ? data.active : true;
        if (data.scale) {
            transform.scale = { ...data.scale };
        }
        return transform;
    }
}
