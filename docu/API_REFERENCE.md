# 📚 Arcade Meltdown - API Reference

**Version:** 1.0  
**Date:** 2025  
**Target:** Developers & Modders  

---

## 📋 Table of Contents

1. [Core Classes](#1-core-classes)
2. [Component System](#2-component-system)
3. [Game Systems](#3-game-systems)
4. [Utility Functions](#4-utility-functions)
5. [Event System](#5-event-system)
6. [Configuration API](#6-configuration-api)
7. [Networking API](#7-networking-api)
8. [Modding API](#8-modding-api)

---

## 1. Core Classes

### 1.1 Game Class

The main game engine controller.

```javascript
class Game {
    constructor(canvasId: string)
    
    // Core Methods
    start(): void
    pause(): void
    resume(): void
    stop(): void
    
    // Game State
    getState(): GameState
    setState(state: GameState): void
    
    // Player Management
    addPlayer(playerClass: string): Player
    removePlayer(playerId: string): void
    getPlayer(playerId: string): Player
    
    // Wave Management
    startWave(waveNumber: number): void
    endWave(): void
    spawnEnemy(type: string, x: number, y: number): Enemy
    
    // Effects
    createExplosion(x: number, y: number, config: ExplosionConfig): void
    addScreenShake(intensity: number, duration: number): void
    setChaosLevel(level: number): void
    
    // Events
    on(event: string, callback: Function): void
    off(event: string, callback: Function): void
    emit(event: string, data: any): void
}
```

**Example Usage:**
```javascript
const game = new Game('gameCanvas');

game.on('playerDeath', (player) => {
    console.log(`Player ${player.id} died!`);
});

game.on('waveComplete', (waveNumber) => {
    console.log(`Wave ${waveNumber} completed!`);
});

game.start();
```

### 1.2 Player Class

Represents a player character with class-specific abilities.

```javascript
class Player extends Entity {
    constructor(x: number, y: number, playerClass: string)
    
    // Properties
    id: string
    class: string
    health: number
    maxHealth: number
    speed: number
    weapon: Weapon
    specialCooldown: number
    
    // Methods
    update(deltaTime: number, keys: object, mouse: object): void
    takeDamage(damage: number): void
    heal(amount: number): void
    useSpecialAbility(): void
    startShooting(): void
    stopShooting(): void
    
    // Class-specific methods
    getClassStats(): ClassStats
    upgradeWeapon(upgradeType: string): void
    
    // Serialization
    serialize(): object
    static deserialize(data: object): Player
}
```

**Example Usage:**
```javascript
const player = new Player(400, 300, 'heavy');

// Check player status
if (player.health < player.maxHealth * 0.3) {
    player.heal(25);
}

// Use special ability if available
if (player.specialCooldown <= 0) {
    player.useSpecialAbility();
}
```

### 1.3 Enemy Class

Base class for all enemy types.

```javascript
class Enemy extends Entity {
    constructor(x: number, y: number, wave: number)
    
    // Properties
    type: string
    health: number
    maxHealth: number
    speed: number
    damage: number
    points: number
    
    // AI Behavior
    update(deltaTime: number, player: Player): void
    setTarget(target: Entity): void
    getTarget(): Entity
    
    // Combat
    attack(target: Entity): void
    takeDamage(damage: number): void
    die(): void
    
    // Factory Methods
    static createGrunt(x: number, y: number, wave: number): Enemy
    static createSpitter(x: number, y: number, wave: number): Enemy
    static createBruiser(x: number, y: number, wave: number): Enemy
    static createBoss(x: number, y: number, wave: number): Enemy
}
```

**Example Usage:**
```javascript
// Spawn different enemy types
const grunt = Enemy.createGrunt(100, 100, 1);
const spitter = Enemy.createSpitter(200, 200, 2);
const boss = Enemy.createBoss(300, 300, 5);

// Custom enemy behavior
grunt.setTarget(player);
grunt.update(deltaTime, player);
```

### 1.4 Weapon Class

Handles weapon behavior and bullet creation.

```javascript
class Weapon {
    constructor(playerClass: string)
    
    // Properties
    playerClass: string
    damage: number
    fireRate: number
    bulletType: string
    spread: number
    ammo: number
    maxAmmo: number
    
    // Methods
    update(deltaTime: number, x: number, y: number, angle: number): void
    fire(x: number, y: number, angle: number): Bullet[]
    reload(): void
    startShooting(): void
    stopShooting(): void
    
    // Upgrades
    addUpgrade(upgrade: WeaponUpgrade): void
    removeUpgrade(upgradeId: string): void
    getUpgrades(): WeaponUpgrade[]
}
```

**Example Usage:**
```javascript
const weapon = new Weapon('scout');

// Upgrade weapon
weapon.addUpgrade({
    id: 'damage_boost',
    type: 'damage',
    value: 1.5,
    duration: 30000
});

// Fire weapon
const bullets = weapon.fire(player.x, player.y, player.angle);
game.addBullets(bullets);
```

---

## 2. Component System

### 2.1 Entity Class

Base class for all game objects using Entity-Component-System architecture.

```javascript
class Entity {
    constructor(id?: string)
    
    // Properties
    id: string
    active: boolean
    components: Map<string, Component>
    
    // Component Management
    addComponent(component: Component): Entity
    removeComponent(componentType: string): Entity
    getComponent<T>(componentType: new() => T): T
    hasComponent(componentType: string): boolean
    
    // Lifecycle
    update(deltaTime: number): void
    render(ctx: CanvasRenderingContext2D): void
    destroy(): void
}
```

### 2.2 Core Components

#### Transform Component
```javascript
class Transform extends Component {
    constructor(x: number = 0, y: number = 0, rotation: number = 0)
    
    // Properties
    x: number
    y: number
    rotation: number
    scale: { x: number, y: number }
    
    // Methods
    translate(dx: number, dy: number): void
    rotate(angle: number): void
    setScale(sx: number, sy: number): void
    getWorldPosition(): { x: number, y: number }
}
```

#### Physics Component
```javascript
class Physics extends Component {
    constructor()
    
    // Properties
    velocity: { x: number, y: number }
    acceleration: { x: number, y: number }
    mass: number
    friction: number
    maxSpeed: number
    
    // Methods
    applyForce(fx: number, fy: number): void
    applyImpulse(ix: number, iy: number): void
    setVelocity(vx: number, vy: number): void
    clampSpeed(): void
}
```

#### Health Component
```javascript
class Health extends Component {
    constructor(maxHealth: number)
    
    // Properties
    maxHealth: number
    currentHealth: number
    invulnerable: boolean
    invulnerabilityTime: number
    
    // Methods
    takeDamage(damage: number): boolean
    heal(amount: number): void
    setInvulnerable(duration: number): void
    isDead(): boolean
    getHealthPercentage(): number
}
```

#### Render Component
```javascript
class Render extends Component {
    constructor(sprite?: string, color?: string)
    
    // Properties
    sprite: string
    color: string
    visible: boolean
    layer: number
    opacity: number
    scale: { x: number, y: number }
    
    // Methods
    setSprite(sprite: string): void
    setColor(color: string): void
    setOpacity(opacity: number): void
    hide(): void
    show(): void
}
```

---

## 3. Game Systems

### 3.1 System Base Class

```javascript
abstract class System {
    constructor()
    
    // Properties
    entities: Set<Entity>
    requiredComponents: string[]
    priority: number
    
    // Methods
    addEntity(entity: Entity): void
    removeEntity(entity: Entity): void
    hasRequiredComponents(entity: Entity): boolean
    
    // Abstract Methods
    abstract update(deltaTime: number): void
    abstract render?(ctx: CanvasRenderingContext2D): void
}
```

### 3.2 Physics System

```javascript
class PhysicsSystem extends System {
    constructor()
    
    // Properties
    gravity: { x: number, y: number }
    spatialGrid: SpatialGrid
    
    // Methods
    update(deltaTime: number): void
    checkCollisions(): CollisionPair[]
    resolveCollision(entityA: Entity, entityB: Entity): void
    
    // Collision Detection
    checkCircleCollision(a: Entity, b: Entity): boolean
    checkRectCollision(a: Entity, b: Entity): boolean
    checkPointInCircle(point: Point, circle: Entity): boolean
}
```

### 3.3 Render System

```javascript
class RenderSystem extends System {
    constructor(canvas: HTMLCanvasElement)
    
    // Properties
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    camera: Camera
    layers: Map<number, Entity[]>
    
    // Methods
    render(deltaTime: number): void
    renderEntity(entity: Entity): void
    renderLayer(layer: number): void
    
    // Camera Control
    setCamera(camera: Camera): void
    screenToWorld(screenX: number, screenY: number): Point
    worldToScreen(worldX: number, worldY: number): Point
    
    // Effects
    addPostProcessor(processor: PostProcessor): void
    removePostProcessor(processorId: string): void
}
```

### 3.4 Audio System

```javascript
class AudioSystem extends System {
    constructor()
    
    // Properties
    context: AudioContext
    masterGain: GainNode
    musicGain: GainNode
    sfxGain: GainNode
    
    // Methods
    loadSound(name: string, url: string): Promise<void>
    playSound(name: string, options?: AudioOptions): AudioSource
    stopSound(source: AudioSource): void
    
    // Music Management
    playMusic(name: string, loop?: boolean): void
    stopMusic(): void
    setMusicVolume(volume: number): void
    
    // Spatial Audio
    playSpatialSound(name: string, x: number, y: number, options?: SpatialAudioOptions): AudioSource
    updateListenerPosition(x: number, y: number): void
}
```

---

## 4. Utility Functions

### 4.1 Math Utilities

```javascript
namespace MathUtils {
    // Distance and angles
    function distance(x1: number, y1: number, x2: number, y2: number): number
    function angle(x1: number, y1: number, x2: number, y2: number): number
    function angleDifference(a1: number, a2: number): number
    
    // Vector operations
    function normalize(x: number, y: number): { x: number, y: number }
    function dot(x1: number, y1: number, x2: number, y2: number): number
    function cross(x1: number, y1: number, x2: number, y2: number): number
    
    // Interpolation
    function lerp(a: number, b: number, t: number): number
    function smoothstep(a: number, b: number, t: number): number
    function clamp(value: number, min: number, max: number): number
    
    // Random
    function random(min?: number, max?: number): number
    function randomInt(min: number, max: number): number
    function randomChoice<T>(array: T[]): T
    
    // Geometry
    function pointInCircle(px: number, py: number, cx: number, cy: number, radius: number): boolean
    function pointInRect(px: number, py: number, rx: number, ry: number, width: number, height: number): boolean
    function circleIntersect(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean
}
```

### 4.2 Color Utilities

```javascript
namespace ColorUtils {
    // Color conversion
    function hexToRgb(hex: string): { r: number, g: number, b: number }
    function rgbToHex(r: number, g: number, b: number): string
    function hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number }
    
    // Color manipulation
    function lighten(color: string, amount: number): string
    function darken(color: string, amount: number): string
    function saturate(color: string, amount: number): string
    function desaturate(color: string, amount: number): string
    
    // Color interpolation
    function lerpColor(colorA: string, colorB: string, t: number): string
    function randomColor(): string
    function complementaryColor(color: string): string
}
```

### 4.3 Asset Manager

```javascript
class AssetManager {
    constructor()
    
    // Loading
    loadImage(name: string, url: string): Promise<HTMLImageElement>
    loadSound(name: string, url: string): Promise<AudioBuffer>
    loadJSON(name: string, url: string): Promise<object>
    
    // Retrieval
    getImage(name: string): HTMLImageElement
    getSound(name: string): AudioBuffer
    getJSON(name: string): object
    
    // Management
    preloadAssets(assetList: AssetDefinition[]): Promise<void>
    unloadAsset(name: string): void
    getLoadProgress(): number
    
    // Events
    on(event: 'loaded' | 'progress' | 'error', callback: Function): void
}
```

---

## 5. Event System

### 5.1 Event Manager

```javascript
class EventManager {
    constructor()
    
    // Event Registration
    on(event: string, callback: Function, context?: object): void
    once(event: string, callback: Function, context?: object): void
    off(event: string, callback?: Function, context?: object): void
    
    // Event Emission
    emit(event: string, ...args: any[]): void
    emitAsync(event: string, ...args: any[]): Promise<void>
    
    // Event Queuing
    queue(event: string, ...args: any[]): void
    processQueue(): void
    clearQueue(): void
}
```

### 5.2 Game Events

```javascript
// Player Events
interface PlayerEvents {
    'player:spawn': (player: Player) => void
    'player:death': (player: Player, cause: string) => void
    'player:damage': (player: Player, damage: number, source: Entity) => void
    'player:heal': (player: Player, amount: number) => void
    'player:levelUp': (player: Player, newLevel: number) => void
    'player:specialAbility': (player: Player, abilityType: string) => void
}

// Game Events
interface GameEvents {
    'game:start': () => void
    'game:pause': () => void
    'game:resume': () => void
    'game:end': (reason: string) => void
    'wave:start': (waveNumber: number) => void
    'wave:complete': (waveNumber: number, score: number) => void
    'chaos:change': (oldLevel: number, newLevel: number) => void
}

// Combat Events
interface CombatEvents {
    'enemy:spawn': (enemy: Enemy) => void
    'enemy:death': (enemy: Enemy, killer: Player) => void
    'bullet:fire': (bullet: Bullet, shooter: Entity) => void
    'explosion:create': (x: number, y: number, radius: number) => void
}
```

---

## 6. Configuration API

### 6.1 Config Manager

```javascript
class ConfigManager {
    constructor()
    
    // Configuration Access
    get(path: string): any
    set(path: string, value: any): void
    has(path: string): boolean
    delete(path: string): void
    
    // Persistence
    save(): void
    load(): void
    reset(): void
    
    // Validation
    validate(schema: ConfigSchema): boolean
    getErrors(): ValidationError[]
    
    // Events
    on(event: 'change' | 'save' | 'load', callback: Function): void
}
```

### 6.2 Configuration Schema

```javascript
interface GameConfig {
    game: {
        maxPlayers: number
        waveScaling: number
        chaosDecayRate: number
        respawnTime: number
        friendlyFire: boolean
    }
    
    graphics: {
        targetFPS: number
        particleLimit: number
        effectQuality: 'low' | 'medium' | 'high'
        screenShakeIntensity: number
        enableBloom: boolean
        enableScanlines: boolean
    }
    
    audio: {
        masterVolume: number
        musicVolume: number
        sfxVolume: number
        spatialAudio: boolean
        dynamicMusic: boolean
    }
    
    controls: {
        mouseSensitivity: number
        keyBindings: KeyBindings
        gamepadEnabled: boolean
    }
    
    network: {
        maxLatency: number
        interpolationDelay: number
        predictionEnabled: boolean
    }
}
```

---

## 7. Networking API

### 7.1 Network Manager

```javascript
class NetworkManager {
    constructor()
    
    // Connection Management
    createRoom(): Promise<string>
    joinRoom(roomCode: string): Promise<void>
    leaveRoom(): void
    
    // Messaging
    sendMessage(message: NetworkMessage, target?: string): void
    broadcastMessage(message: NetworkMessage): void
    
    // State Synchronization
    syncGameState(state: GameState): void
    requestStateSync(): void
    
    // Events
    on(event: NetworkEvent, callback: Function): void
    
    // Properties
    isHost: boolean
    roomCode: string
    peers: Map<string, PeerConnection>
    latency: number
}
```

### 7.2 Network Messages

```javascript
interface NetworkMessage {
    type: string
    timestamp: number
    senderId: string
    data: any
}

// Message Types
interface PlayerInputMessage extends NetworkMessage {
    type: 'player_input'
    data: {
        playerId: string
        keys: object
        mouse: { x: number, y: number, pressed: boolean }
    }
}

interface GameStateMessage extends NetworkMessage {
    type: 'game_state'
    data: {
        wave: number
        score: number
        chaosLevel: number
        players: PlayerState[]
        enemies: EnemyState[]
    }
}

interface ChatMessage extends NetworkMessage {
    type: 'chat'
    data: {
        playerId: string
        message: string
    }
}
```

---

## 8. Modding API

### 8.1 Mod Manager

```javascript
class ModManager {
    constructor()
    
    // Mod Loading
    loadMod(modPath: string): Promise<Mod>
    unloadMod(modId: string): void
    reloadMod(modId: string): Promise<void>
    
    // Mod Registry
    registerMod(mod: Mod): void
    getMod(modId: string): Mod
    getLoadedMods(): Mod[]
    
    // Hooks
    registerHook(hookName: string, callback: Function): void
    executeHook(hookName: string, ...args: any[]): any[]
    
    // Asset Override
    overrideAsset(assetName: string, newAsset: any): void
    restoreAsset(assetName: string): void
}
```

### 8.2 Mod Interface

```javascript
interface Mod {
    id: string
    name: string
    version: string
    author: string
    description: string
    
    // Lifecycle
    onLoad(): void
    onUnload(): void
    onEnable(): void
    onDisable(): void
    
    // Game Hooks
    onPlayerSpawn?(player: Player): void
    onEnemySpawn?(enemy: Enemy): void
    onWaveStart?(waveNumber: number): void
    onGameStart?(): void
    onGameEnd?(): void
    
    // Custom Content
    registerPlayerClass?(classDefinition: PlayerClassDefinition): void
    registerWeapon?(weaponDefinition: WeaponDefinition): void
    registerEnemy?(enemyDefinition: EnemyDefinition): void
    registerPowerup?(powerupDefinition: PowerupDefinition): void
}
```

### 8.3 Custom Content Definitions

```javascript
interface PlayerClassDefinition {
    id: string
    name: string
    description: string
    stats: {
        health: number
        speed: number
        damage: number
    }
    weapon: string
    specialAbility: SpecialAbilityDefinition
    sprite: string
}

interface WeaponDefinition {
    id: string
    name: string
    damage: number
    fireRate: number
    bulletType: string
    spread: number
    range: number
    ammo?: number
    special?: WeaponSpecialDefinition
}

interface EnemyDefinition {
    id: string
    name: string
    health: number
    speed: number
    damage: number
    points: number
    behavior: EnemyBehaviorDefinition
    sprite: string
}
```

---

## Usage Examples

### Creating a Custom Player Class

```javascript
// Register a new player class
game.modManager.registerHook('registerPlayerClass', {
    id: 'ninja',
    name: 'Ninja',
    description: 'Fast and stealthy assassin',
    stats: {
        health: 60,
        speed: 350,
        damage: 30
    },
    weapon: 'throwing_stars',
    specialAbility: {
        id: 'shadow_clone',
        cooldown: 15000,
        duration: 5000,
        effect: (player) => {
            // Create shadow clone logic
            const clone = new ShadowClone(player.x, player.y);
            game.addEntity(clone);
        }
    },
    sprite: 'ninja_sprite'
});
```

### Custom Enemy AI

```javascript
class CustomEnemy extends Enemy {
    constructor(x, y, wave) {
        super(x, y, wave);