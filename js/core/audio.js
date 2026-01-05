/**
 * @fileoverview Gerenciador de áudio para o jogo Kingdom of Aen
 * @module core/audio
 * @author Kingdom of Aen Team
 */

// ============================================
// ===       CLASSE AUDIOMANAGER           ===
// ============================================

/**
 * Gerenciador de áudio para música de fundo e efeitos sonoros
 * @class
 */
class AudioManager {
    /**
     * Cria uma nova instância do AudioManager
     * @param {string} [basePath='audio/'] - Caminho base para os arquivos de áudio
     */
    constructor(basePath = 'audio/') {
        /** @type {string} Caminho base dos arquivos de áudio */
        this.basePath = basePath;

        /** @type {HTMLAudioElement|null} Elemento de áudio da música de fundo */
        this.bgMusic = null;

        /** @type {boolean} Se os efeitos sonoros estão mutados */
        this.sfxMuted = this._loadMuteState();

        /** @type {boolean} Se a música está mutada */
        this.musicMuted = this.sfxMuted;

        /**
         * Efeitos sonoros disponíveis
         * @type {Object.<string, string[]>}
         */
        this.sfx = {
            'card-place': ['card-place-1.ogg', 'card-place-2.ogg', 'card-place-3.ogg', 'card-place-4.ogg'],
            'card-slide': ['card-slide-1.ogg', 'card-slide-2.ogg'],
            'card-fan': ['card-fan-1.ogg', 'card-fan-2.ogg'],
            'shuffle': ['card-shuffle.ogg'],
            'dice': ['dice-throw-3.ogg', 'die-throw-3.ogg'],
            'switch': ['switch4.ogg'],
            'mouseclick': ['mouseclick1.ogg'],
            'shove': ['card-shove-1.ogg']
        };

        /** @type {Object.<string, HTMLAudioElement[]>} Cache de áudios pré-carregados */
        this.preloaded = {};

        this._preloadAll();
    }

    /**
     * Carrega o estado de mute do localStorage
     * @private
     * @returns {boolean}
     */
    _loadMuteState() {
        try {
            return localStorage.getItem('audioMuted') === 'true';
        } catch (e) {
            return false;
        }
    }

    /**
     * Salva o estado de mute no localStorage
     * @private
     * @param {boolean} muted
     */
    _saveMuteState(muted) {
        try {
            localStorage.setItem('audioMuted', muted ? 'true' : 'false');
        } catch (e) {
            // Ignore storage errors
        }
    }

    /**
     * Pré-carrega todos os efeitos sonoros
     * @private
     */
    _preloadAll() {
        for (const key in this.sfx) {
            this.preloaded[key] = this.sfx[key].map(file => {
                const audio = new Audio(this.basePath + file);
                audio.preload = 'auto';
                audio.volume = 0.5;
                return audio;
            });
        }
    }

    /**
     * Inicia a música de fundo
     * @param {string} [track='music_bg.mp3'] - Nome do arquivo da música
     */
    playMusic(track = 'music_bg.mp3') {
        if (this.bgMusic) return;

        this.bgMusic = new Audio(this.basePath + track);
        this.bgMusic.loop = true;
        this.bgMusic.volume = this.musicMuted ? 0 : 0.3;
        this.bgMusic.play().catch(e => {
            console.warn('Autoplay blocked. Music will play after user interaction.', e);
        });
    }

    /**
     * Para a música de fundo
     */
    stopMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
            this.bgMusic = null;
        }
    }

    /**
     * Toca um efeito sonoro
     * @param {string} type - Tipo do SFX (ex: 'card-place', 'shuffle')
     */
    playSFX(type) {
        if (this.sfxMuted) return;

        const sounds = this.preloaded[type];
        if (!sounds || sounds.length === 0) return;

        const sound = sounds[Math.floor(Math.random() * sounds.length)];
        const clone = sound.cloneNode();
        clone.volume = 0.5;
        clone.play().catch(() => { });
    }

    /**
     * Alterna o estado de mute de todo o áudio
     * @returns {boolean} Novo estado de mute
     */
    toggleMute() {
        this.sfxMuted = !this.sfxMuted;
        this.musicMuted = this.sfxMuted;

        if (this.bgMusic) {
            this.bgMusic.volume = this.musicMuted ? 0 : 0.3;
        }

        this._saveMuteState(this.sfxMuted);
        return this.sfxMuted;
    }
}

// ============================================
// ===       INSTÂNCIA GLOBAL              ===
// ============================================

/**
 * Instância global do gerenciador de áudio
 * @type {AudioManager}
 */
const audioManager = new AudioManager();

// ============================================
// ===       EXPORTS (Futuros ES6 Modules) ===
// ============================================
// export { AudioManager, audioManager };
