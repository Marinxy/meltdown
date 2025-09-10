// Audio Engine - Simple wrapper for basic audio functionality
class AudioEngine {
    constructor() {
        this.sounds = new Map();
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.currentMusic = null;
    }

    loadSound(name, url) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.sounds.set(name, audio);
        return audio;
    }

    playSound(name, volume = 1.0) {
        const sound = this.sounds.get(name);
        if (sound) {
            const clone = sound.cloneNode();
            clone.volume = volume * this.sfxVolume;
            clone.play().catch(e => console.warn('Audio play failed:', e));
            return clone;
        }
    }

    playMusic(name, loop = true) {
        this.stopMusic();
        const music = this.sounds.get(name);
        if (music) {
            music.loop = loop;
            music.volume = this.musicVolume;
            music.play().catch(e => console.warn('Music play failed:', e));
            this.currentMusic = music;
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.currentMusic) {
            this.currentMusic.volume = volume;
        }
    }

    setSFXVolume(volume) {
        this.sfxVolume = volume;
    }
}
