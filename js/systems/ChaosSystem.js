// Chaos System - Manages dynamic chaos meter that affects visuals and audio
class ChaosSystem extends System {
    constructor() {
        super();
        this.chaosLevel = 0; // 0-100 chaos level
        this.maxChaos = 100;
        this.chaosDecayRate = 5; // Chaos decreases by 5 per second when not building
        this.chaosThresholds = {
            calm: 0,      // 0-20: Calm state
            tense: 20,    // 20-40: Tension building
            intense: 40,  // 40-60: Intense action
            chaotic: 60,  // 60-80: Chaotic state
            meltdown: 80  // 80-100: Complete meltdown
        };
        
        this.currentState = 'calm';
        this.lastStateChange = 0;
        this.stateChangeCooldown = 1000; // Minimum time between state changes
        
        // Visual effects influenced by chaos
        this.baseScreenShakeIntensity = 1.0;
        this.chaosScreenShakeMultiplier = 1.0;
        this.chromaticAberrationIntensity = 0;
        this.glitchEffectIntensity = 0;
        this.colorSaturationMultiplier = 1.0;
        this.particleSpawnMultiplier = 1.0;
        
        // Audio effects influenced by chaos
        this.musicIntensityLevel = 1; // 1-4 music layers
        this.audioDistortionLevel = 0;
        this.bassBoostLevel = 0;
        this.reverbLevel = 0;
        
        // Chaos building factors
        this.chaosFactors = {
            enemyKill: 5,
            playerDamage: 8,
            playerDeath: 25,
            bossSpawn: 30,
            bossKill: 50,
            specialAbility: 10,
            multiKill: 15,
            closeCall: 12, // Near-death experience
            explosions: 8,
            rapidFire: 3
        };
        
        // Chaos events tracking
        this.recentEvents = [];
        this.eventWindow = 5000; // 5 second window for event tracking
        this.comboMultiplier = 1.0;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (window.gameInstance && window.gameInstance.eventManager) {
            // Listen for chaos-generating events
            window.gameInstance.eventManager.on('enemy:killed', (enemy, killer) => {
                this.onEnemyKilled(enemy, killer);
            });
            
            window.gameInstance.eventManager.on('player:damaged', (player, damage, source) => {
                this.onPlayerDamaged(player, damage, source);
            });
            
            window.gameInstance.eventManager.on('player:death', (player, killer) => {
                this.onPlayerDeath(player, killer);
            });
            
            window.gameInstance.eventManager.on('boss:spawned', (boss) => {
                this.onBossSpawned(boss);
            });
            
            window.gameInstance.eventManager.on('boss:defeated', (boss, killer) => {
                this.onBossDefeated(boss, killer);
            });
            
            window.gameInstance.eventManager.on('player:specialAbility', (player, abilityType) => {
                this.onSpecialAbility(player, abilityType);
            });
            
            window.gameInstance.eventManager.on('explosion:created', (explosion) => {
                this.onExplosion(explosion);
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Decay chaos over time
        this.decayChaos(deltaTime);
        
        // Clean up old events
        this.cleanupOldEvents();
        
        // Update combo multiplier
        this.updateComboMultiplier();
        
        // Update chaos state
        this.updateChaosState();
        
        // Apply chaos effects
        this.applyChaosEffects();
        
        // Update audio system
        this.updateAudioEffects();
        
        // Update visual effects
        this.updateVisualEffects();
    }

    addChaos(amount, eventType = 'generic') {
        // Apply combo multiplier
        const adjustedAmount = amount * this.comboMultiplier;
        
        // Add chaos with cap
        this.chaosLevel = Math.min(this.maxChaos, this.chaosLevel + adjustedAmount);
        
        // Record event for combo tracking
        this.recordEvent(eventType, adjustedAmount);
        
        // Emit chaos change event
        if (window.gameInstance) {
            window.gameInstance.eventManager.emit('chaos:changed', {
                level: this.chaosLevel,
                state: this.currentState,
                amount: adjustedAmount,
                eventType: eventType
            });
        }
    }

    decayChaos(deltaTime) {
        if (this.chaosLevel > 0) {
            const decayAmount = (this.chaosDecayRate * deltaTime) / 1000;
            this.chaosLevel = Math.max(0, this.chaosLevel - decayAmount);
        }
    }

    recordEvent(eventType, amount) {
        const event = {
            type: eventType,
            amount: amount,
            timestamp: Date.now()
        };
        
        this.recentEvents.push(event);
    }

    cleanupOldEvents() {
        const currentTime = Date.now();
        this.recentEvents = this.recentEvents.filter(event => 
            currentTime - event.timestamp < this.eventWindow
        );
    }

    updateComboMultiplier() {
        // Calculate combo multiplier based on recent event density
        const eventCount = this.recentEvents.length;
        
        if (eventCount >= 10) {
            this.comboMultiplier = 2.5; // Insane combo
        } else if (eventCount >= 7) {
            this.comboMultiplier = 2.0; // High combo
        } else if (eventCount >= 4) {
            this.comboMultiplier = 1.5; // Medium combo
        } else if (eventCount >= 2) {
            this.comboMultiplier = 1.2; // Low combo
        } else {
            this.comboMultiplier = 1.0; // No combo
        }
    }

    updateChaosState() {
        const currentTime = Date.now();
        
        // Prevent rapid state changes
        if (currentTime - this.lastStateChange < this.stateChangeCooldown) {
            return;
        }
        
        let newState = this.currentState;
        
        if (this.chaosLevel >= this.chaosThresholds.meltdown) {
            newState = 'meltdown';
        } else if (this.chaosLevel >= this.chaosThresholds.chaotic) {
            newState = 'chaotic';
        } else if (this.chaosLevel >= this.chaosThresholds.intense) {
            newState = 'intense';
        } else if (this.chaosLevel >= this.chaosThresholds.tense) {
            newState = 'tense';
        } else {
            newState = 'calm';
        }
        
        if (newState !== this.currentState) {
            const oldState = this.currentState;
            this.currentState = newState;
            this.lastStateChange = currentTime;
            
            // Emit state change event
            if (window.gameInstance) {
                window.gameInstance.eventManager.emit('chaos:stateChanged', {
                    oldState: oldState,
                    newState: newState,
                    chaosLevel: this.chaosLevel
                });
            }
            
            // Play state transition sound
            this.playStateTransitionSound(newState);
        }
    }

    applyChaosEffects() {
        const chaosRatio = this.chaosLevel / this.maxChaos;
        
        // Calculate effect intensities based on chaos level
        this.chaosScreenShakeMultiplier = 1.0 + chaosRatio * 2.0;
        this.chromaticAberrationIntensity = chaosRatio * 5.0;
        this.glitchEffectIntensity = Math.max(0, chaosRatio - 0.4) * 2.0;
        this.colorSaturationMultiplier = 1.0 + chaosRatio * 0.5;
        this.particleSpawnMultiplier = 1.0 + chaosRatio * 3.0;
        
        // Audio effect intensities
        this.audioDistortionLevel = chaosRatio * 0.3;
        this.bassBoostLevel = chaosRatio * 0.4;
        this.reverbLevel = chaosRatio * 0.2;
        
        // Determine music intensity level (1-4)
        if (this.chaosLevel >= this.chaosThresholds.meltdown) {
            this.musicIntensityLevel = 4;
        } else if (this.chaosLevel >= this.chaosThresholds.chaotic) {
            this.musicIntensityLevel = 3;
        } else if (this.chaosLevel >= this.chaosThresholds.intense) {
            this.musicIntensityLevel = 2;
        } else {
            this.musicIntensityLevel = 1;
        }
    }

    updateAudioEffects() {
        if (!window.gameInstance || !window.gameInstance.audioSystem) return;
        
        const audioSystem = window.gameInstance.audioSystem;
        
        // Update music layers based on intensity
        audioSystem.setMusicIntensity(this.musicIntensityLevel);
        
        // Apply audio effects
        audioSystem.setDistortion(this.audioDistortionLevel);
        audioSystem.setBassBoost(this.bassBoostLevel);
        audioSystem.setReverb(this.reverbLevel);
        
        // Chaos-specific audio modulations
        switch (this.currentState) {
            case 'meltdown':
                audioSystem.setLowPassFilter(0.3); // Muffle audio
                audioSystem.setPitchShift(0.95); // Slightly lower pitch
                break;
            case 'chaotic':
                audioSystem.setLowPassFilter(0.7);
                audioSystem.setPitchShift(0.98);
                break;
            case 'intense':
                audioSystem.setLowPassFilter(0.9);
                audioSystem.setPitchShift(1.0);
                break;
            default:
                audioSystem.setLowPassFilter(1.0);
                audioSystem.setPitchShift(1.0);
                break;
        }
    }

    updateVisualEffects() {
        if (!window.gameInstance || !window.gameInstance.renderSystem) return;
        
        const renderSystem = window.gameInstance.renderSystem;
        
        // Apply chaos-based visual effects
        renderSystem.setChaosEffects({
            screenShakeMultiplier: this.chaosScreenShakeMultiplier,
            chromaticAberration: this.chromaticAberrationIntensity,
            glitchIntensity: this.glitchEffectIntensity,
            colorSaturation: this.colorSaturationMultiplier,
            particleMultiplier: this.particleSpawnMultiplier
        });
        
        // State-specific visual effects
        switch (this.currentState) {
            case 'meltdown':
                renderSystem.setPostProcessing({
                    scanlines: 0.8,
                    vignette: 0.6,
                    colorShift: 0.4,
                    noise: 0.3
                });
                break;
            case 'chaotic':
                renderSystem.setPostProcessing({
                    scanlines: 0.6,
                    vignette: 0.4,
                    colorShift: 0.2,
                    noise: 0.2
                });
                break;
            case 'intense':
                renderSystem.setPostProcessing({
                    scanlines: 0.4,
                    vignette: 0.2,
                    colorShift: 0.1,
                    noise: 0.1
                });
                break;
            case 'tense':
                renderSystem.setPostProcessing({
                    scanlines: 0.2,
                    vignette: 0.1,
                    colorShift: 0.05,
                    noise: 0.05
                });
                break;
            default: // calm
                renderSystem.setPostProcessing({
                    scanlines: 0.1,
                    vignette: 0.0,
                    colorShift: 0.0,
                    noise: 0.0
                });
                break;
        }
    }

    // Event handlers
    onEnemyKilled(enemy, killer) {
        let chaosAmount = this.chaosFactors.enemyKill;
        
        // Bonus chaos for special enemy types
        switch (enemy.enemyType) {
            case 'bruiser':
                chaosAmount *= 1.5;
                break;
            case 'miniboss':
                chaosAmount *= 2.0;
                break;
            case 'boss':
                chaosAmount *= 3.0;
                break;
        }
        
        // Check for multi-kill bonus
        const recentKills = this.recentEvents.filter(event => 
            event.type === 'enemy_kill' && 
            Date.now() - event.timestamp < 2000
        ).length;
        
        if (recentKills >= 2) {
            chaosAmount += this.chaosFactors.multiKill;
        }
        
        this.addChaos(chaosAmount, 'enemy_kill');
    }

    onPlayerDamaged(player, damage, source) {
        const health = player.getComponent('Health');
        if (!health) return;
        
        let chaosAmount = this.chaosFactors.playerDamage;
        
        // More chaos for near-death experiences
        if (health.getHealthPercentage() < 0.2) {
            chaosAmount += this.chaosFactors.closeCall;
        }
        
        // Scale with damage amount
        chaosAmount *= Math.min(2.0, damage / 50);
        
        this.addChaos(chaosAmount, 'player_damage');
    }

    onPlayerDeath(player, killer) {
        this.addChaos(this.chaosFactors.playerDeath, 'player_death');
    }

    onBossSpawned(boss) {
        this.addChaos(this.chaosFactors.bossSpawn, 'boss_spawn');
    }

    onBossDefeated(boss, killer) {
        this.addChaos(this.chaosFactors.bossKill, 'boss_kill');
    }

    onSpecialAbility(player, abilityType) {
        this.addChaos(this.chaosFactors.specialAbility, 'special_ability');
    }

    onExplosion(explosion) {
        this.addChaos(this.chaosFactors.explosions, 'explosion');
    }

    onRapidFire(weapon) {
        // Called when weapons fire rapidly
        this.addChaos(this.chaosFactors.rapidFire, 'rapid_fire');
    }

    playStateTransitionSound(newState) {
        if (!window.gameInstance || !window.gameInstance.audioSystem) return;
        
        const soundMap = {
            calm: 'chaos_calm',
            tense: 'chaos_tense',
            intense: 'chaos_intense',
            chaotic: 'chaos_chaotic',
            meltdown: 'chaos_meltdown'
        };
        
        const soundName = soundMap[newState];
        if (soundName) {
            window.gameInstance.audioSystem.playSound(soundName, {
                spatial: false,
                volume: 0.7
            });
        }
    }

    // Utility methods
    getChaosLevel() {
        return this.chaosLevel;
    }

    getChaosState() {
        return this.currentState;
    }

    getChaosRatio() {
        return this.chaosLevel / this.maxChaos;
    }

    getComboMultiplier() {
        return this.comboMultiplier;
    }

    getRecentEventCount() {
        return this.recentEvents.length;
    }

    // Manual chaos control (for testing or special events)
    setChaosLevel(level) {
        this.chaosLevel = Math.max(0, Math.min(this.maxChaos, level));
    }

    resetChaos() {
        this.chaosLevel = 0;
        this.currentState = 'calm';
        this.recentEvents = [];
        this.comboMultiplier = 1.0;
    }

    // Visual feedback for UI
    getChaosColor() {
        const colors = {
            calm: '#44ff44',     // Green
            tense: '#ffff44',    // Yellow
            intense: '#ff8844',  // Orange
            chaotic: '#ff4444',  // Red
            meltdown: '#ff44ff'  // Magenta
        };
        
        return colors[this.currentState] || colors.calm;
    }

    getChaosDescription() {
        const descriptions = {
            calm: 'All is quiet...',
            tense: 'Tension rising...',
            intense: 'Intense action!',
            chaotic: 'CHAOS UNLEASHED!',
            meltdown: 'TOTAL MELTDOWN!'
        };
        
        return descriptions[this.currentState] || descriptions.calm;
    }

    // Serialization
    serialize() {
        return {
            chaosLevel: this.chaosLevel,
            currentState: this.currentState,
            comboMultiplier: this.comboMultiplier,
            recentEventCount: this.recentEvents.length
        };
    }

    deserialize(data) {
        this.chaosLevel = data.chaosLevel || 0;
        this.currentState = data.currentState || 'calm';
        this.comboMultiplier = data.comboMultiplier || 1.0;
        // Note: Recent events are not serialized as they're temporary
        this.recentEvents = [];
    }
}
