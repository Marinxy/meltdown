class InputSystem extends System {
    constructor() {
        super();
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false };
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });

        // Mouse events
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
            });

            canvas.addEventListener('mousedown', (e) => {
                this.mouse.pressed = true;
                e.preventDefault();
            });

            canvas.addEventListener('mouseup', (e) => {
                this.mouse.pressed = false;
                e.preventDefault();
            });
        }
    }

    update(deltaTime, entities) {
        // Find player entity
        const player = entities.find(entity => entity.hasTag('player'));
        if (!player) return;

        const transform = player.getComponent('Transform');
        const physics = player.getComponent('Physics');
        const playerComp = player.getComponent('Player');
        
        if (!transform || !physics || !playerComp) return;

        // Handle movement input
        let moveX = 0;
        let moveY = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707; // 1/sqrt(2)
            moveY *= 0.707;
        }

        // Apply movement based on player class speed
        const speed = physics.maxSpeed || 200;
        physics.velocityX = moveX * speed;
        physics.velocityY = moveY * speed;

        // Handle shooting
        if (this.mouse.pressed && playerComp.weapon) {
            const weapon = playerComp.weapon;
            if (weapon.canFire()) {
                // Convert mouse screen coordinates to world coordinates
                let worldMouseX = this.mouse.x;
                let worldMouseY = this.mouse.y;
                
                // Check if render system exists for coordinate conversion
                if (window.gameInstance && window.gameInstance.renderSystem) {
                    const worldPos = window.gameInstance.renderSystem.screenToWorld(this.mouse.x, this.mouse.y);
                    worldMouseX = worldPos.x;
                    worldMouseY = worldPos.y;
                }
                
                // Calculate aim direction using world coordinates
                const aimX = worldMouseX - transform.x;
                const aimY = worldMouseY - transform.y;
                const aimLength = Math.sqrt(aimX * aimX + aimY * aimY);
                
                if (aimLength > 0) {
                    const dirX = aimX / aimLength;
                    const dirY = aimY / aimLength;
                    
                    weapon.fire(transform.x, transform.y, dirX, dirY);
                }
            }
        }

        // Handle special abilities
        if (this.keys['Space'] && playerComp.canUseSpecial()) {
            playerComp.useSpecial();
        }

        // Handle reload
        if (this.keys['KeyR'] && playerComp.weapon) {
            playerComp.weapon.reload();
        }
    }

    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    isMousePressed() {
        return this.mouse.pressed;
    }
}