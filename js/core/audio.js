// ============================================
// ===       AUDIO MANAGER                 ===
// ============================================

class AudioManager {
    constructor(basePath = 'audio/') {
        this.basePath = basePath.endsWith('/') ? basePath : basePath + '/';

        // Music (use provided background filename)
        this.musicFile = this.basePath + 'music_bg.mp3';
        this.music = new Audio(this.musicFile);
        this.music.loop = true;
        this.music.volume = 0.4;
        this.isMusicPlaying = false;
        this.sfxMuted = false;
        this.musicMuted = false;
        this.storageKey = 'kingdom_audio_muted';

        // Load persisted mute state
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved === 'true') {
                this.sfxMuted = true;
                this.musicMuted = true;
                this.music.muted = true;
            }
        } catch (e) { /* ignore */ }

        // SFX sets
        this.sfx = {
            'card-place': [
                this.basePath + 'card-place-1.ogg',
                this.basePath + 'card-place-2.ogg',
                this.basePath + 'card-place-3.ogg',
                this.basePath + 'card-place-4.ogg'
            ],
            'card-slide': [this.basePath + 'card-slide-1.ogg'],
            'shuffle': [this.basePath + 'card-shuffle.ogg'],
            'mouseclick': [this.basePath + 'mouseclick1.ogg'],
            'switch': [this.basePath + 'switch4.ogg']
        };

        // Preload Audio elements for low-latency
        this._preloaded = {};
        this._preloadAll();
    }

    _preloadAll() {
        // Preload music (do not autoplay)
        try {
            this.music.preload = 'auto';
            this.music.load();
        } catch (e) { /* ignore */ }

        // Preload SFX (create Audio objects but don't reuse for playing to avoid locking)
        Object.keys(this.sfx).forEach(key => {
            this._preloaded[key] = this.sfx[key].map(src => {
                try {
                    const a = new Audio(src);
                    a.preload = 'auto';
                    a.load();
                    return src;
                } catch (e) {
                    return src; // keep src even if Audio creation fails now
                }
            });
        });
    }

    playMusic() {
        if (this.isMusicPlaying) return;
        if (this.musicMuted) this.music.muted = true;
        this.music.play().then(() => {
            this.isMusicPlaying = true;
        }).catch(err => {
            console.warn('[AudioManager] playMusic blocked:', err);
        });
    }

    stopMusic() {
        try {
            this.music.pause();
            this.music.currentTime = 0;
            this.isMusicPlaying = false;
        } catch (e) {
            console.warn('[AudioManager] stopMusic error', e);
        }
    }

    setMute(muted) {
        this.sfxMuted = !!muted;
        this.musicMuted = !!muted;
        try {
            this.music.muted = !!muted;
            localStorage.setItem(this.storageKey, muted ? 'true' : 'false');
        } catch (e) { /* ignore */ }
    }

    toggleMute() {
        const newState = !this.sfxMuted;
        this.setMute(newState);
        return newState;
    }

    _randomFrom(key) {
        const arr = this._preloaded[key] || this.sfx[key] || [];
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    playSFX(type) {
        try {
            if (this.sfxMuted) return;
            const src = this._randomFrom(type);
            if (!src) return;
            // Create a fresh Audio to allow overlapping
            const sfx = new Audio(src);
            sfx.volume = 1.0;
            sfx.muted = this.sfxMuted;
            sfx.play().catch(err => {
                // Silently ignore play errors (autoplay policies, etc.)
                console.warn('[AudioManager] SFX play blocked', err);
            });
        } catch (e) {
            console.warn('[AudioManager] playSFX error', e);
        }
    }
}

// Create global instance
const audioManager = new AudioManager('audio');
