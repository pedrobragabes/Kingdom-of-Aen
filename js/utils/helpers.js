import { CARD_COLLECTION } from '../data/cards.js';

// ============================================
// ===       MAPEAMENTO DE ÍCONES          ===
// ============================================
export const ROW_ICONS = {
    'melee': 'img/icons/icon-melee.png',
    'ranged': 'img/icons/icon-ranged.png',
    'siege': 'img/icons/icon-siege.png',
    'agile': 'img/icons/icon-agile.png'
};

// Mapeamento de habilidades para descrições curtas
export const ABILITY_DESCRIPTIONS = {
    'bond_partner': 'Dobra força com parceiro',
    'spy': 'Espião: Compra 2 cartas',
    'spy_medic': 'Espião: Compra 2 cartas',
    'medic': 'Revive uma carta',
    'scorch': 'Queima a mais forte',
    'decoy': 'Retorna carta à mão',
    'hero': 'Imune a efeitos',
    'weather': 'Aplica clima',
    'clear_weather': 'Limpa todo clima'
};

// ============================================
// Audio Manager (advanced)
// ============================================
export class AudioManager {
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

export const audioManager = new AudioManager('audio');

// ============================================
// ===       FUNÇÕES AUXILIARES (From cards.js)  ===
// ============================================

/** Retorna uma carta da coleção pelo ID */
export function getCardById(id) {
    return CARD_COLLECTION.find(card => card.id === id);
}

/** Retorna todas as cartas de uma categoria */
export function getCardsByCategory(category) {
    return CARD_COLLECTION.filter(card => card.category === category);
}

/** Retorna todas as cartas de um tipo (melee, ranged, siege) */
export function getCardsByType(type) {
    return CARD_COLLECTION.filter(card => card.type === type);
}

/** Conta quantas unidades e especiais existem em um array de IDs */
export function countDeckComposition(deckIds) {
    let units = 0;
    let specials = 0;
    let totalPower = 0;

    deckIds.forEach(id => {
        const card = getCardById(id);
        if (card) {
            if (card.category === 'special') {
                specials++;
            } else {
                units++;
            }
            totalPower += card.power || 0;
        }
    });

    return { units, specials, total: units + specials, totalPower };
}

/** Valida se um deck está dentro das regras (Mín 22 unidades, Máx 10 especiais) */
export function validateDeck(deckIds) {
    const { units, specials } = countDeckComposition(deckIds);

    const errors = [];
    if (units < 22) {
        errors.push(`Precisa de pelo menos 22 unidades (atual: ${units})`);
    }
    if (specials > 10) {
        errors.push(`Máximo de 10 especiais permitido (atual: ${specials})`);
    }

    return { valid: errors.length === 0, errors, units, specials };
}

/** Embaralha um array (Fisher-Yates shuffle) */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/** Converte array de IDs em array de objetos de carta (clonados) */
export function idsToCards(deckIds) {
    return deckIds.map(id => {
        const card = getCardById(id);
        return card ? { ...card } : null;
    }).filter(card => card !== null);
}
