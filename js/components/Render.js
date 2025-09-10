// Render Component - Visual representation and rendering
class Render extends Component {
    constructor(sprite = null, color = '#ffffff') {
        super();
        this.sprite = sprite;
        this.color = color;
        this.visible = true;
        this.layer = 0;
        this.opacity = 1.0;
        this.scale = { x: 1, y: 1 };
        this.offset = { x: 0, y: 0 };
        this.flipX = false;
        this.flipY = false;
        this.tint = null;
        this.blendMode = 'source-over';
        this.shadow = null;
        this.glow = null;
        this.animation = null;
        this.currentFrame = 0;
        this.animationTime = 0;
    }

    render(ctx) {
        if (!this.visible || this.opacity <= 0) return;

        const transform = this.entity.getComponent('Transform');
        if (!transform) return;

        ctx.save();

        // Apply global alpha
        ctx.globalAlpha = this.opacity;
        ctx.globalCompositeOperation = this.blendMode;

        // Transform to entity position
        ctx.translate(transform.x + this.offset.x, transform.y + this.offset.y);
        ctx.rotate(transform.rotation);
        ctx.scale(
            this.scale.x * transform.scale.x * (this.flipX ? -1 : 1),
            this.scale.y * transform.scale.y * (this.flipY ? -1 : 1)
        );

        // Render shadow if enabled
        if (this.shadow) {
            this.renderShadow(ctx);
        }

        // Render glow if enabled
        if (this.glow) {
            this.renderGlow(ctx);
        }

        // Render main content
        if (this.sprite) {
            this.renderSprite(ctx);
        } else {
            this.renderShape(ctx);
        }

        ctx.restore();
    }

    renderSprite(ctx) {
        // For now, render as colored circle (placeholder for actual sprite system)
        ctx.fillStyle = this.color;
        if (this.tint) {
            ctx.fillStyle = this.tint;
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Add simple visual indicator for different entity types
        if (this.sprite === 'player') {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.sprite === 'enemy') {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.sprite === 'bullet') {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderShape(ctx) {
        ctx.fillStyle = this.color;
        if (this.tint) {
            ctx.fillStyle = this.tint;
        }
        
        // Default shape is a circle
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
    }

    renderShadow(ctx) {
        ctx.save();
        ctx.translate(this.shadow.offsetX, this.shadow.offsetY);
        ctx.globalAlpha = this.shadow.opacity * this.opacity;
        ctx.fillStyle = this.shadow.color;
        ctx.filter = `blur(${this.shadow.blur}px)`;
        
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    renderGlow(ctx) {
        ctx.save();
        ctx.globalAlpha = this.glow.opacity * this.opacity;
        ctx.shadowColor = this.glow.color;
        ctx.shadowBlur = this.glow.size;
        ctx.fillStyle = this.glow.color;
        
        ctx.beginPath();
        ctx.arc(0, 0, 16 + this.glow.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // Animation handling
    update(deltaTime) {
        if (this.animation) {
            this.animationTime += deltaTime;
            const frameTime = 1000 / this.animation.fps;
            
            if (this.animationTime >= frameTime) {
                this.currentFrame = (this.currentFrame + 1) % this.animation.frames.length;
                this.animationTime = 0;
                
                // Update sprite to current frame
                this.sprite = this.animation.frames[this.currentFrame];
            }
        }
    }

    // Utility methods
    setSprite(sprite) {
        this.sprite = sprite;
    }

    setColor(color) {
        this.color = color;
    }

    setOpacity(opacity) {
        this.opacity = MathUtils.clamp(opacity, 0, 1);
    }

    setScale(sx, sy = sx) {
        this.scale.x = sx;
        this.scale.y = sy;
    }

    setOffset(x, y) {
        this.offset.x = x;
        this.offset.y = y;
    }

    setTint(color) {
        this.tint = color;
    }

    setShadow(offsetX, offsetY, blur, color, opacity = 0.5) {
        this.shadow = {
            offsetX,
            offsetY,
            blur,
            color,
            opacity
        };
    }

    setGlow(size, color, opacity = 0.8) {
        this.glow = {
            size,
            color,
            opacity
        };
    }

    setAnimation(frames, fps = 10) {
        this.animation = {
            frames,
            fps
        };
        this.currentFrame = 0;
        this.animationTime = 0;
    }

    hide() {
        this.visible = false;
    }

    show() {
        this.visible = true;
    }

    toggle() {
        this.visible = !this.visible;
    }

    // Flash effect
    flash(duration = 200, color = '#ffffff') {
        const originalTint = this.tint;
        this.setTint(color);
        
        setTimeout(() => {
            this.setTint(originalTint);
        }, duration);
    }

    // Fade effects
    fadeIn(duration = 1000) {
        const startOpacity = this.opacity;
        const startTime = Date.now();
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.opacity = MathUtils.lerp(startOpacity, 1, progress);
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            }
        };
        
        fade();
    }

    fadeOut(duration = 1000) {
        const startOpacity = this.opacity;
        const startTime = Date.now();
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.opacity = MathUtils.lerp(startOpacity, 0, progress);
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                this.hide();
            }
        };
        
        fade();
    }

    // Serialization
    serialize() {
        return {
            ...super.serialize(),
            sprite: this.sprite,
            color: this.color,
            visible: this.visible,
            layer: this.layer,
            opacity: this.opacity,
            scale: { ...this.scale },
            offset: { ...this.offset },
            flipX: this.flipX,
            flipY: this.flipY,
            tint: this.tint,
            blendMode: this.blendMode
        };
    }

    static deserialize(data) {
        const render = new Render(data.sprite, data.color);
        render.active = data.active !== undefined ? data.active : true;
        render.visible = data.visible !== undefined ? data.visible : true;
        render.layer = data.layer || 0;
        render.opacity = data.opacity !== undefined ? data.opacity : 1;
        render.scale = data.scale || { x: 1, y: 1 };
        render.offset = data.offset || { x: 0, y: 0 };
        render.flipX = data.flipX || false;
        render.flipY = data.flipY || false;
        render.tint = data.tint || null;
        render.blendMode = data.blendMode || 'source-over';
        return render;
    }
}
