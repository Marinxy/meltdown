// Asset Manager - Handles loading and caching of game assets
class AssetManager {
    constructor() {
        this.assets = new Map();
        this.loadPromises = new Map();
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    async loadImage(name, url) {
        if (this.assets.has(name)) {
            return this.assets.get(name);
        }

        if (this.loadPromises.has(name)) {
            return this.loadPromises.get(name);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets.set(name, img);
                this.loadedCount++;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${name}`);
                // Create placeholder canvas
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(0, 0, 32, 32);
                this.assets.set(name, canvas);
                this.loadedCount++;
                resolve(canvas);
            };
            img.src = url;
        });

        this.loadPromises.set(name, promise);
        this.totalCount++;
        return promise;
    }

    async loadAudio(name, url) {
        if (this.assets.has(name)) {
            return this.assets.get(name);
        }

        if (this.loadPromises.has(name)) {
            return this.loadPromises.get(name);
        }

        const promise = new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.assets.set(name, audio);
                this.loadedCount++;
                resolve(audio);
            };
            audio.onerror = () => {
                console.warn(`Failed to load audio: ${name}`);
                this.assets.set(name, null);
                this.loadedCount++;
                resolve(null);
            };
            audio.src = url;
        });

        this.loadPromises.set(name, promise);
        this.totalCount++;
        return promise;
    }

    getAsset(name) {
        return this.assets.get(name);
    }

    getLoadProgress() {
        return this.totalCount > 0 ? this.loadedCount / this.totalCount : 1;
    }

    createPlaceholderImage(width = 32, height = 32, color = '#ff00ff', label = '') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        // Label
        if (label) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, width / 2, height / 2 + 3);
        }
        
        return canvas;
    }

    async preloadAssets() {
        // Create placeholder images immediately - no network requests needed
        this.assets.set('player_heavy', this.createPlaceholderImage(32, 32, '#ff4400', 'H'));
        this.assets.set('player_scout', this.createPlaceholderImage(32, 32, '#00ff44', 'S'));
        this.assets.set('player_engineer', this.createPlaceholderImage(32, 32, '#4400ff', 'E'));
        this.assets.set('player_medic', this.createPlaceholderImage(32, 32, '#ff0044', 'M'));
        this.assets.set('enemy_grunt', this.createPlaceholderImage(24, 24, '#880000', 'G'));
        this.assets.set('enemy_spitter', this.createPlaceholderImage(24, 24, '#008800', 'SP'));
        this.assets.set('enemy_bruiser', this.createPlaceholderImage(40, 40, '#000088', 'B'));
        this.assets.set('enemy_miniboss', this.createPlaceholderImage(48, 48, '#880088', 'MB'));
        this.assets.set('boss', this.createPlaceholderImage(64, 64, '#ff8800', 'BOSS'));
        this.assets.set('bullet', this.createPlaceholderImage(8, 4, '#ffff00', ''));
        this.assets.set('explosion', this.createPlaceholderImage(32, 32, '#ff4400', 'X'));
        this.assets.set('particle', this.createPlaceholderImage(4, 4, '#ffffff', ''));
        this.assets.set('flame', this.createPlaceholderImage(16, 16, '#ff6600', 'F'));
        this.assets.set('heal_beam', this.createPlaceholderImage(16, 16, '#00ff88', 'H'));
        
        // Audio placeholders (null - will be handled by AudioSystem)
        this.assets.set('menu_music', null);
        this.assets.set('game_music', null);
        this.assets.set('shoot_sound', null);
        this.assets.set('explosion_sound', null);
        
        console.log('Placeholder assets created - game ready to run without external files');
    }
}
