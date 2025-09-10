// Render System - Handles all visual rendering and effects
class RenderSystem extends System {
    constructor(canvas) {
        super();
        this.requiredComponents = ['Transform', 'Render'];
        this.priority = 10; // Render last
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
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

    update(deltaTime) {
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
        const player = Array.from(this.entities).find(entity => entity.hasTag('player'));
        if (player && player.transform) {
            // Smooth camera following
            const targetX = player.transform.x - this.canvas.width / 2;
            const targetY = player.transform.y - this.canvas.height / 2;
            
            this.camera.x = MathUtils.lerp(this.camera.x, targetX, 0.1);
            this.camera.y = MathUtils.lerp(this.camera.y, targetY, 0.1);
        }
    }

    sortEntitiesByLayer() {
        this.layers.clear();
        
        for (const entity of this.entities) {
            const render = entity.getComponent('Render');
            if (render && render.visible) {
                const layer = render.layer;
                if (!this.layers.has(layer)) {
                    this.layers.set(layer, []);
                }
                this.layers.get(layer).push(entity);
            }
        }
    }

    render() {
        if (!this.active) return;

        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply camera transform and screen shake
        this.ctx.save();
        this.ctx.translate(
            -this.camera.x + this.screenShake.x,
            -this.camera.y + this.screenShake.y
        );
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Render background grid
        if (this.gridEnabled) {
            this.renderGrid();
        }

        // Render entities by layer
        const sortedLayers = Array.from(this.layers.keys()).sort((a, b) => a - b);
        for (const layer of sortedLayers) {
            this.renderLayer(layer);
        }

        this.ctx.restore();

        // Apply post-processing effects
        this.applyPostProcessors();

        // Render UI elements (not affected by camera)
        this.renderUI();
    }

    renderGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.globalAlpha = this.gridOpacity;
        this.ctx.lineWidth = 1;

        const startX = Math.floor(this.camera.x / this.gridSize) * this.gridSize;
        const startY = Math.floor(this.camera.y / this.gridSize) * this.gridSize;
        const endX = startX + this.canvas.width + this.gridSize;
        const endY = startY + this.canvas.height + this.gridSize;

        // Vertical lines
        for (let x = startX; x <= endX; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    renderLayer(layer) {
        const entities = this.layers.get(layer);
        if (!entities) return;

        for (const entity of entities) {
            if (entity.active && this.isEntityVisible(entity)) {
                this.renderEntity(entity);
            }
        }
    }

    renderEntity(entity) {
        const render = entity.getComponent('Render');
        if (render && render.visible) {
            render.render(this.ctx);
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

    renderUI() {
        // UI elements are rendered without camera transform
        // This will be handled by the main game UI system
    }

    applyPostProcessors() {
        for (const processor of this.postProcessors) {
            if (processor.active) {
                processor.process(this.ctx);
            }
        }
    }

    // Screen effects
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }

    flash(color = '#ffffff', duration = 100, opacity = 0.5) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        setTimeout(() => {
            // Flash effect is temporary, no cleanup needed
        }, duration);
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
    applyChaosEffects(chaosLevel) {
        // Color inversion at high chaos
        if (chaosLevel > 0.8) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'difference';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        // Screen distortion
        if (chaosLevel > 0.6) {
            const distortion = (chaosLevel - 0.6) * 10;
            this.addScreenShake(distortion, 100);
        }
    }

    // Debug rendering
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        
        let y = 20;
        this.ctx.fillText(`Entities: ${this.entities.size}`, 10, y);
        y += 15;
        this.ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 10, y);
        y += 15;
        this.ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}`, 10, y);
        
        this.ctx.restore();
    }
}
