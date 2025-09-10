// Audio System - Handles dynamic music and sound effects
class AudioSystem extends System {
    constructor() {
        super();
        this.requiredComponents = []; // Audio system doesn't require specific components
        this.priority = 5;
        this.context = null;
        this.masterGain = null;
        this.musicBus = null;
        this.sfxBus = null;
        this.uiBus = null;
        
        // Audio effects nodes
        this.compressor = null;
        this.distortionNode = null;
        this.lowPassFilter = null;
        this.highPassFilter = null;
        this.reverbNode = null;
        this.reverbGain = null;
        
        // Sound management
        this.sounds = new Map();
        this.activeSources = new Map();
        this.maxConcurrentSounds = 32;
        
        // Music system
        this.musicStems = new Map();
        this.activeMusicSources = new Map();
        this.currentMusic = null;
        this.currentIntensity = 0;
        this.isPlaying = false;
        
        // State
        this.initialized = false;
        
        // Initialize audio context
        this.initialize();
    }

    async initialize() {
        try {
            // Create audio context
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain and buses
            this.masterGain = this.context.createGain();
            this.musicBus = this.context.createGain();
            this.sfxBus = this.context.createGain();
            this.uiBus = this.context.createGain();
            
            // Set initial volumes
            this.masterGain.gain.value = 0.7;
            this.musicBus.gain.value = 0.6;
            this.sfxBus.gain.value = 0.8;
            this.uiBus.gain.value = 0.9;
            
            // Create audio effects chain
            await this.createEffectsChain();
            
            // Connect buses to master
            this.musicBus.connect(this.masterGain);
            this.sfxBus.connect(this.masterGain);
            this.uiBus.connect(this.masterGain);
            
            // Connect master to destination
            this.masterGain.connect(this.context.destination);
            
            this.initialized = true;
            console.log('AudioSystem initialized successfully');
            
            // Preload common sounds
            await this.preloadSounds();
            
        } catch (error) {
            console.error('Failed to initialize AudioSystem:', error);
        }
    }

    async createEffectsChain() {
        // Create compressor for dynamic range control
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        
        // Create distortion for chaos effects
        this.distortionNode = this.context.createWaveShaper();
        this.distortionNode.curve = this.makeDistortionCurve(0);
        this.distortionNode.oversample = '2x';
        
        // Create filters
        this.lowPassFilter = this.context.createBiquadFilter();
        this.lowPassFilter.type = 'lowpass';
        this.lowPassFilter.frequency.value = 20000;
        this.lowPassFilter.Q.value = 1;
        
        this.highPassFilter = this.context.createBiquadFilter();
        this.highPassFilter.type = 'highpass';
        this.highPassFilter.frequency.value = 20;
        this.highPassFilter.Q.value = 1;
        
        // Create reverb
        this.reverbNode = this.context.createConvolver();
        this.reverbGain = this.context.createGain();
        this.reverbGain.gain.value = 0;
        
        // Create impulse response for reverb
        this.reverbNode.buffer = this.createImpulseResponse(2, 2);
        
        // Connect effects chain: input -> compressor -> distortion -> filters -> reverb -> output
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.distortionNode);
        this.distortionNode.connect(this.lowPassFilter);
        this.lowPassFilter.connect(this.highPassFilter);
        
        // Reverb send/return
        this.highPassFilter.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.context.destination);
        
        // Dry signal
        this.highPassFilter.connect(this.context.destination);
    }

    update(deltaTime, entities) {
        if (!this.initialized) return;
        
        // Update spatial audio for entities with position and audio components
        for (const entity of entities) {
            if (entity.hasComponent('Position') && entity.hasComponent('Audio')) {
                const position = entity.getComponent('Position');
                const audio = entity.getComponent('Audio');
                
                // Update listener position (could be player position)
                // For now, we'll assume a fixed listener position
                if (this.context.listener && this.context.listener.setPosition) {
                    this.context.listener.setPosition(0, 0, 0);
                }
            }
        }
        
        // Clean up finished sources
        for (const [source, data] of this.activeSources) {
            if (source.playbackState === source.FINISHED_STATE) {
                this.activeSources.delete(source);
            }
        }
    }

    // Event handlers
    onEvent(event) {
        switch (event.type) {
            case 'chaos_level_changed':
                this.applyChaosEffects(event.data.level);
                this.updateMusicIntensity(event.data.level);
                break;
            case 'wave_started':
                this.playSound('wave_start', { bus: 'ui' });
                break;
            case 'boss_spawned':
                this.playSound('boss_spawn', { bus: 'ui', volume: 1.2 });
                break;
            case 'player_died':
                this.playSound('player_death', { bus: 'sfx' });
                break;
        }
    }

    // Sound loading and management
    async loadSound(name, url, options = {}) {
        if (!this.initialized) return;

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            
            this.sounds.set(name, {
                buffer: audioBuffer,
                volume: options.volume || 1.0,
                pitch: options.pitch || 1.0,
                spatial: options.spatial || false,
                loop: options.loop || false
            });
            
            console.log(`Loaded sound: ${name}`);
        } catch (error) {
            console.warn(`Failed to load sound '${name}':`, error);
            // Create placeholder sound data
            this.sounds.set(name, {
                buffer: null,
                volume: options.volume || 1.0,
                pitch: options.pitch || 1.0,
                spatial: options.spatial || false,
                loop: options.loop || false
            });
        }
    }

    playSound(name, options = {}) {
        if (!this.initialized || !this.sounds.has(name)) return null;

        const soundDef = this.sounds.get(name);
        if (!soundDef.buffer) return null; // Placeholder sound

        // Limit concurrent sounds
        if (this.activeSources.size >= this.maxConcurrentSounds) {
            this.cullOldestSource();
        }

        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        
        source.buffer = soundDef.buffer;
        source.loop = options.loop || soundDef.loop;
        source.playbackRate.value = options.pitch || soundDef.pitch;
        gainNode.gain.value = (options.volume || soundDef.volume) * 0.5;

        // Determine which bus to use
        let outputBus = this.sfxBus;
        if (options.bus === 'music') outputBus = this.musicBus;
        else if (options.bus === 'ui') outputBus = this.uiBus;

        // Spatial audio setup
        if (options.position && soundDef.spatial) {
            const panner = this.context.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 100;
            panner.maxDistance = 1000;
            panner.rolloffFactor = 1;
            panner.setPosition(options.position.x, options.position.y, 0);
            
            source.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(outputBus);
        } else {
            source.connect(gainNode);
            gainNode.connect(outputBus);
        }

        // Start playback
        source.start();
        
        // Track active source for cleanup
        this.activeSources.set(source, {
            startTime: this.context.currentTime,
            gainNode: gainNode
        });

        // Auto-cleanup when sound ends
        source.onended = () => {
            this.activeSources.delete(source);
        };

        return source;
    }

    stopSound(source) {
        if (source && this.activeSources.has(source)) {
            source.stop();
            this.activeSources.delete(source);
        }
    }

    cullOldestSource() {
        let oldestSource = null;
        let oldestTime = Infinity;

        for (const [source, data] of this.activeSources) {
            if (data.startTime < oldestTime) {
                oldestTime = data.startTime;
                oldestSource = source;
            }
        }

        if (oldestSource) {
            this.stopSound(oldestSource);
        }
    }

    // Music system with layered stems
    async loadMusicStems(baseName, stemNames = ['base', 'melody', 'harmony', 'percussion']) {
        const stems = {};
        
        for (const stemName of stemNames) {
            const url = `audio/music/${baseName}_${stemName}.ogg`;
            await this.loadSound(`${baseName}_${stemName}`, url, { 
                loop: true, 
                bus: 'music' 
            });
            stems[stemName] = `${baseName}_${stemName}`;
        }
        
        this.musicStems.set(baseName, stems);
        console.log(`Loaded music stems for: ${baseName}`);
    }

    playMusic(baseName, intensity = 0.0) {
        if (!this.musicStems.has(baseName)) {
            console.warn(`Music stems not found: ${baseName}`);
            return;
        }

        this.stopMusic();
        
        const stems = this.musicStems.get(baseName);
        this.currentMusic = baseName;
        this.currentIntensity = intensity;
        this.isPlaying = true;

        // Start all stems
        for (const [stemType, stemName] of Object.entries(stems)) {
            const source = this.playSound(stemName, { 
                loop: true, 
                bus: 'music',
                volume: this.getStemVolume(stemType, intensity)
            });
            
            if (source) {
                this.activeMusicSources.set(stemType, source);
            }
        }

        console.log(`Started music: ${baseName} at intensity ${intensity}`);
    }

    getStemVolume(stemType, intensity) {
        // Base stem always plays
        if (stemType === 'base') return 0.6;
        
        // Other stems fade in based on intensity
        switch (stemType) {
            case 'melody': return Math.max(0, (intensity - 0.2) * 1.25);
            case 'harmony': return Math.max(0, (intensity - 0.5) * 2.0);
            case 'percussion': return Math.max(0, (intensity - 0.7) * 3.33);
            default: return intensity;
        }
    }

    updateMusicIntensity(newIntensity) {
        if (!this.isPlaying || !this.currentMusic) return;

        this.currentIntensity = newIntensity;
        
        // Update stem volumes
        for (const [stemType, source] of this.activeMusicSources) {
            const sourceData = this.activeSources.get(source);
            if (sourceData && sourceData.gainNode) {
                const targetVolume = this.getStemVolume(stemType, newIntensity);
                sourceData.gainNode.gain.linearRampToValueAtTime(
                    targetVolume, 
                    this.context.currentTime + 0.5
                );
            }
        }
    }

    stopMusic() {
        for (const source of this.activeMusicSources.values()) {
            this.stopSound(source);
        }
        this.activeMusicSources.clear();
        this.currentMusic = null;
        this.isPlaying = false;
    }

    // Audio effects for chaos system
    applyChaosEffects(chaosLevel) {
        if (!this.initialized) return;

        // Update master effects based on chaos
        this.updateDistortion(chaosLevel);
        this.updateFilters(chaosLevel);
        this.updateReverb(chaosLevel);
        this.updateCompression(chaosLevel);
    }

    updateDistortion(chaosLevel) {
        if (this.distortionNode) {
            // Increase distortion with chaos
            const distortionAmount = Math.min(chaosLevel * 50, 100);
            this.distortionNode.curve = this.makeDistortionCurve(distortionAmount);
            this.distortionNode.oversample = chaosLevel > 0.7 ? '4x' : '2x';
        }
    }

    updateFilters(chaosLevel) {
        if (this.lowPassFilter && this.highPassFilter) {
            // Chaos affects frequency range
            const lowPassFreq = 20000 - (chaosLevel * 15000); // 20kHz to 5kHz
            const highPassFreq = chaosLevel * 200; // 0Hz to 200Hz
            
            this.lowPassFilter.frequency.linearRampToValueAtTime(
                lowPassFreq, this.context.currentTime + 0.1
            );
            this.highPassFilter.frequency.linearRampToValueAtTime(
                highPassFreq, this.context.currentTime + 0.1
            );
        }
    }

    updateReverb(chaosLevel) {
        if (this.reverbGain) {
            // More reverb with higher chaos
            const reverbLevel = chaosLevel * 0.4;
            this.reverbGain.gain.linearRampToValueAtTime(
                reverbLevel, this.context.currentTime + 0.2
            );
        }
    }

    updateCompression(chaosLevel) {
        if (this.compressor) {
            // Aggressive compression at high chaos
            this.compressor.threshold.value = -24 + (chaosLevel * 20); // -24dB to -4dB
            this.compressor.ratio.value = 1 + (chaosLevel * 19); // 1:1 to 20:1
            this.compressor.attack.value = 0.003 - (chaosLevel * 0.002); // 3ms to 1ms
            this.compressor.release.value = 0.25 - (chaosLevel * 0.2); // 250ms to 50ms
        }
    }

    // Utility methods
    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        
        return curve;
    }

    createImpulseResponse(duration, decay) {
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.context.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const n = length - i;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
            }
        }
        
        return impulse;
    }

    // Volume controls
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(volume, this.context.currentTime);
        }
    }

    setMusicVolume(volume) {
        if (this.musicBus) {
            this.musicBus.gain.setValueAtTime(volume, this.context.currentTime);
        }
    }

    setSFXVolume(volume) {
        if (this.sfxBus) {
            this.sfxBus.gain.setValueAtTime(volume, this.context.currentTime);
        }
    }

    setUIVolume(volume) {
        if (this.uiBus) {
            this.uiBus.gain.setValueAtTime(volume, this.context.currentTime);
        }
    }

    // Cleanup
    destroy() {
        // Stop all active sounds
        for (const source of this.activeSources.keys()) {
            source.stop();
        }
        this.activeSources.clear();
        
        // Close audio context
        if (this.context) {
            this.context.close();
        }
        
        this.initialized = false;
    }

    // Preload common sounds with placeholders
    async preloadSounds() {
        // Create placeholder sounds immediately - no files needed
        const placeholderSounds = [
            'player_shoot', 'enemy_death', 'explosion_small', 'explosion_large',
            'wave_start', 'wave_complete', 'boss_spawn', 'boss_death',
            'chaos_intense', 'player_death', 'pickup_health', 'pickup_ammo',
            'flamethrower_fire', 'smg_fire', 'shotgun_fire', 'heal_beam',
            'enemy_grunt_attack', 'enemy_spitter_shoot', 'enemy_bruiser_slam',
            'miniboss_teleport', 'boss_laser', 'boss_meteor'
        ];

        for (const soundName of placeholderSounds) {
            // Create placeholder sound data (no actual audio buffer)
            this.sounds.set(soundName, {
                buffer: null, // Will be silent
                volume: 1.0,
                pitch: 1.0,
                spatial: false,
                loop: false
            });
        }

        console.log('Audio placeholders created - game will run silently until audio files are added');
    }

    // Serialization
    serialize() {
        return {
            masterVolume: this.masterGain ? this.masterGain.gain.value : 0.7,
            musicVolume: this.musicBus ? this.musicBus.gain.value : 0.6,
            sfxVolume: this.sfxBus ? this.sfxBus.gain.value : 0.8,
            currentIntensity: this.currentIntensity,
            isPlaying: this.isPlaying
        };
    }
}
