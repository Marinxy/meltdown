// Render System - Handles all visual rendering and effects
class RenderSystem extends System {
    constructor(ctx) {
        super();
        this.requiredComponents = ['Transform', 'Render'];
        this.priority = 10; // Render last
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.layers = new Map();
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.postProcessors = [];
        this.backgroundColor = '#0a0a0a';
        this.gridEnabled = true;
        this.gridSize = 50;
        this.gridColor = '#333333';
        this.gridOpacity = 0.3;
    }

    init() {
        // Set up canvas properties
        this.ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering
        this.setupPostProcessors();
    }

    setupPostProcessors() {
        // CRT scanlines effect
        this.addPostProcessor('scanlines', (ctx) => {
            if (window.gameInstance && window.gameInstance.chaosLevel > 0.5) {
                ctx.save();
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = 'rgba(0, 255, 0, 0.03)';
                
                for (let y = 0; y < this.canvas.height; y += 4) {
                    ctx.fillRect(0, y, this.canvas.width, 2);
                }
                ctx.restore();
            }
        });

        // Chromatic aberration effect
        this.addPostProcessor('chromatic', (ctx) => {
            if (window.gameInstance && window.gameInstance.chaosLevel > 0.7) {
                const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                const data = imageData.data;
                const aberration = Math.floor(window.gameInstance.chaosLevel * 3);
                
                // Simple chromatic aberration simulation
                for (let i = 0; i < data.length; i += 4) {
                    if (i >= aberration * 4) {
                        data[i] = data[i - aberration * 4]; // Red channel offset
                    }
                }
                
                ctx.putImageData(imageData, 0, 0);
            }
        });
    }

    update(deltaTime, entities) {
        this.entities = entities;
        
        // Update screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            const intensity = this.screenShake.intensity * (this.screenShake.duration / 1000);
            this.screenShake.x = (Math.random() - 0.5) * intensity;
            this.screenShake.y = (Math.random() - 0.5) * intensity;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }

        // Update camera (follow player if exists)
        this.updateCamera();

        // Sort entities by layer for proper rendering order
        this.sortEntitiesByLayer();
    }

    updateCamera() {
        // Find player entity to follow
        const player = this.entities.find(entity => entity.hasTag('player'));
        if (player && player.getComponent('Transform')) {
            const transform = player.getComponent('Transform');
            // Smooth camera following
            const targetX = transform.x - this.canvas.width / 2;
            const targetY = transform.y - this.canvas.height / 2;
            
            this.camera.x = MathUtils.lerp(this.camera.x, targetX, 0.1);
            this.camera.y = MathUtils.lerp(this.camera.y, targetY, 0.1);
        }
    }

    sortEntitiesByLayer() {
        this.layers.clear();
        
        for (const entity of this.entities) {
            const render = entity.getComponent('Render');
            if (render && render.visible) {
                const layer = render.layer || 0;
                if (!this.layers.has(layer)) {
                    this.layers.set(layer, []);
                }
                this.layers.get(layer).push(entity);
            }
        }
    }

    render(ctx, entities) {
        if (!this.active) return;
        
        this.entities = entities;

        // Clear canvas
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply camera transform and screen shake
        ctx.save();
        ctx.translate(
            -this.camera.x + this.screenShake.x,
            -this.camera.y + this.screenShake.y
        );
        ctx.scale(this.camera.zoom, this.camera.zoom);

        // Render background grid
        if (this.gridEnabled) {
            this.renderGrid(ctx);
        }

        // Render entities by layer
        const sortedLayers = Array.from(this.layers.keys()).sort((a, b) => a - b);
        for (const layer of sortedLayers) {
            this.renderLayer(ctx, layer);
        }

        ctx.restore();

        // Apply post-processing effects
        this.applyPostProcessors(ctx);

        // Render UI elements (not affected by camera)
        this.renderUI(ctx);
    }

    renderGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = this.gridColor;
        ctx.globalAlpha = this.gridOpacity;
        ctx.lineWidth = 1;

        const startX = Math.floor(this.camera.x / this.gridSize) * this.gridSize;
        const startY = Math.floor(this.camera.y / this.gridSize) * this.gridSize;
        const endX = startX + this.canvas.width + this.gridSize;
        const endY = startY + this.canvas.height + this.gridSize;

        // Vertical lines
        for (let x = startX; x <= endX; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    renderLayer(ctx, layer) {
        const entities = this.layers.get(layer);
        if (!entities) return;

        for (const entity of entities) {
            if (entity.active && this.isEntityVisible(entity)) {
                this.renderEntity(ctx, entity);
            }
        }
    }

    renderEntity(ctx, entity) {
        const render = entity.getComponent('Render');
        if (render && render.visible) {
            render.render(ctx);
        }
    }

    isEntityVisible(entity) {
        const transform = entity.getComponent('Transform');
        if (!transform) return false;

        // Simple frustum culling
        const margin = 100; // Extra margin for partially visible entities
        return (
            transform.x + margin >= this.camera.x &&
            transform.x - margin <= this.camera.x + this.canvas.width &&
            transform.y + margin >= this.camera.y &&
            transform.y - margin <= this.camera.y + this.canvas.height
        );
    }

    renderUI(ctx) {
        // UI elements are rendered without camera transform
        // This will be handled by the main game UI system
    }

    applyPostProcessors(ctx) {
        for (const processor of this.postProcessors) {
            if (processor.active) {
                processor.process(ctx);
            }
        }
    }

    // Screen effects
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }

    flash(color = '#ffffff', duration = 100, opacity = 0.5) {
        // Flash effect will be handled by the main game loop
        // This is a placeholder for the flash effect
    }

    // Camera controls
    setCamera(x, y, zoom = 1) {
        this.camera.x = x;
        this.camera.y = y;
        this.camera.zoom = zoom;
    }

    moveCamera(dx, dy) {
        this.camera.x += dx;
        this.camera.y += dy;
    }

    zoomCamera(factor) {
        this.camera.zoom *= factor;
        this.camera.zoom = MathUtils.clamp(this.camera.zoom, 0.5, 3);
    }

    // Coordinate conversion
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX + this.camera.x) / this.camera.zoom,
            y: (screenY + this.camera.y) / this.camera.zoom
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX * this.camera.zoom) - this.camera.x,
            y: (worldY * this.camera.zoom) - this.camera.y
        };
    }

    // Post-processor management
    addPostProcessor(name, processFunction) {
        this.postProcessors.push({
            name,
            process: processFunction,
            active: true
        });
    }

    removePostProcessor(name) {
        this.postProcessors = this.postProcessors.filter(p => p.name !== name);
    }

    togglePostProcessor(name) {
        const processor = this.postProcessors.find(p => p.name === name);
        if (processor) {
            processor.active = !processor.active;
        }
    }

    // Visual settings
    setBackgroundColor(color) {
        this.backgroundColor = color;
    }

    toggleGrid() {
        this.gridEnabled = !this.gridEnabled;
    }

    setGridProperties(size, color, opacity) {
        this.gridSize = size;
        this.gridColor = color;
        this.gridOpacity = opacity;
    }

    // Chaos visual effects
    applyChaosEffects(ctx, chaosLevel) {
        // Color inversion at high chaos
        if (chaosLevel > 0.8) {
            ctx.save();
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();
        }

        // Screen distortion
        if (chaosLevel > 0.6) {
            const distortion = (chaosLevel - 0.6) * 10;
            this.addScreenShake(distortion, 100);
        }
    }

    // Debug rendering
    renderDebugInfo(ctx) {
        ctx.save();
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px monospace';
        
        let y = 20;
        ctx.fillText(`Entities: ${this.entities ? this.entities.length : 0}`, 10, y);
        y += 15;
        ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 10, y);
        y += 15;
        ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}`, 10, y);
        
        ctx.restore();
    }
}
