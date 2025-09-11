class MinimapSystem extends System {
    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
        this.scale = 0.1; // Scale factor for world to minimap
        this.worldWidth = 1200;
        this.worldHeight = 800;
        this.minimapWidth = 150;
        this.minimapHeight = 150;
        this.centerX = this.minimapWidth / 2;
        this.centerY = this.minimapHeight / 2;
        this.playerRadius = 4;
        this.enemyRadius = 3;
        this.spawnRadius = 2;
        
        this.spawnPoints = [
            { x: 100, y: 100 },
            { x: 1100, y: 100 },
            { x: 100, y: 700 },
            { x: 1100, y: 700 },
            { x: 600, y: 50 },
            { x: 600, y: 750 },
            { x: 50, y: 400 },
            { x: 1150, y: 400 }
        ];
    }

    initialize() {
        this.canvas = document.getElementById('minimap');
        if (!this.canvas) {
            console.error('Minimap canvas not found');
            return;
        }
        
        // Set canvas dimensions
        this.canvas.width = this.minimapWidth;
        this.canvas.height = this.minimapHeight;
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        console.log('MinimapSystem initialized');
    }

    update(deltaTime, entities) {
        if (!this.ctx) return;
        
        this.render(entities);
    }

    render(entities) {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.minimapWidth, this.minimapHeight);
        
        // Draw border
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, this.minimapWidth - 2, this.minimapHeight - 2);
        
        // Draw world bounds
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        const worldRect = this.worldToMinimap(0, 0, this.worldWidth, this.worldHeight);
        this.ctx.strokeRect(worldRect.x, worldRect.y, worldRect.width, worldRect.height);
        
        // Draw spawn points
        this.ctx.fillStyle = '#ffff00';
        for (const spawn of this.spawnPoints) {
            const pos = this.worldToMinimap(spawn.x, spawn.y);
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.spawnRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add pulsing effect for active spawn points
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 3) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 0, ${pulse * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.spawnRadius + 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#ffff00';
        }
        
        // Draw entities
        for (const entity of entities) {
            if (!entity.transform) continue;
            
            const pos = this.worldToMinimap(entity.transform.x, entity.transform.y);
            
            if (entity.constructor.name === 'Player') {
                this.drawPlayer(pos.x, pos.y, entity.transform.rotation);
            } else if (entity.constructor.name.includes('Enemy') || 
                      ['Grunt', 'Spitter', 'Bruiser', 'MiniBoss', 'Boss'].includes(entity.constructor.name)) {
                this.drawEnemy(pos.x, pos.y, entity.constructor.name);
            }
        }
        
        // Draw directional indicators for off-screen enemies
        this.drawOffScreenIndicators(entities);
    }

    drawPlayer(x, y, rotation) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        
        // Player triangle pointing in facing direction
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.moveTo(this.playerRadius, 0);
        this.ctx.lineTo(-this.playerRadius, -this.playerRadius);
        this.ctx.lineTo(-this.playerRadius, this.playerRadius);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Player outline
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawEnemy(x, y, enemyType) {
        let color = '#ff0000';
        let size = this.enemyRadius;
        
        // Different colors/sizes for different enemy types
        switch (enemyType) {
            case 'Grunt':
                color = '#ff4444';
                size = 2;
                break;
            case 'Spitter':
                color = '#ff8844';
                size = 2.5;
                break;
            case 'Bruiser':
                color = '#ff0044';
                size = 3.5;
                break;
            case 'MiniBoss':
                color = '#ff0088';
                size = 4;
                break;
            case 'Boss':
                color = '#ff00ff';
                size = 5;
                break;
            default:
                color = '#ff0000';
                break;
        }
        
        // Enemy dot
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pulsing effect for bosses
        if (enemyType === 'Boss' || enemyType === 'MiniBoss') {
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 4) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(255, 0, 255, ${pulse * 0.4})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size + 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawOffScreenIndicators(entities) {
        const player = entities.find(e => e.constructor.name === 'Player');
        if (!player || !player.transform) return;
        
        const playerPos = { x: player.transform.x, y: player.transform.y };
        
        for (const entity of entities) {
            if (!entity.transform) continue;
            if (!entity.constructor.name.includes('Enemy') && 
                !['Grunt', 'Spitter', 'Bruiser', 'MiniBoss', 'Boss'].includes(entity.constructor.name)) continue;
            
            const enemyPos = { x: entity.transform.x, y: entity.transform.y };
            const distance = Math.sqrt(
                Math.pow(enemyPos.x - playerPos.x, 2) + 
                Math.pow(enemyPos.y - playerPos.y, 2)
            );
            
            // Only show indicators for enemies outside a certain range
            if (distance > 400) {
                const angle = Math.atan2(enemyPos.y - playerPos.y, enemyPos.x - playerPos.x);
                const indicatorDistance = 85; // Distance from center
                const indicatorX = this.centerX + Math.cos(angle) * indicatorDistance;
                const indicatorY = this.centerY + Math.sin(angle) * indicatorDistance;
                
                // Draw directional arrow
                this.ctx.save();
                this.ctx.translate(indicatorX, indicatorY);
                this.ctx.rotate(angle);
                
                this.ctx.fillStyle = '#ff6600';
                this.ctx.beginPath();
                this.ctx.moveTo(6, 0);
                this.ctx.lineTo(-3, -3);
                this.ctx.lineTo(-3, 3);
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.restore();
            }
        }
    }

    worldToMinimap(worldX, worldY, worldWidth = 0, worldHeight = 0) {
        if (worldWidth && worldHeight) {
            // Converting a rectangle
            return {
                x: (worldX / this.worldWidth) * this.minimapWidth,
                y: (worldY / this.worldHeight) * this.minimapHeight,
                width: (worldWidth / this.worldWidth) * this.minimapWidth,
                height: (worldHeight / this.worldHeight) * this.minimapHeight
            };
        } else {
            // Converting a point
            return {
                x: (worldX / this.worldWidth) * this.minimapWidth,
                y: (worldY / this.worldHeight) * this.minimapHeight
            };
        }
    }

    updateSpawnPoints(spawnPoints) {
        this.spawnPoints = spawnPoints || this.spawnPoints;
    }
}