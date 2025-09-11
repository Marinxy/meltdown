class CameraSystem extends System {
    constructor(canvas) {
        super();
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.smoothing = 0.1;
        this.zoom = 1;
    }

    update(deltaTime, entities) {
        // Find player to follow
        const player = entities.find(entity => entity.hasTag('player'));
        if (player) {
            const transform = player.getComponent('Transform');
            if (transform) {
                // Center camera on player
                this.targetX = transform.x - this.canvas.width / 2;
                this.targetY = transform.y - this.canvas.height / 2;
            }
        }

        // Smooth camera movement
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;

        // Keep camera within bounds (optional)
        const margin = 100;
        this.x = Math.max(-margin, Math.min(this.x, 1200 + margin - this.canvas.width));
        this.y = Math.max(-margin, Math.min(this.y, 800 + margin - this.canvas.height));
    }

    applyTransform(ctx) {
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    resetTransform(ctx) {
        ctx.restore();
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.zoom + this.x,
            y: screenY / this.zoom + this.y
        };
    }
}