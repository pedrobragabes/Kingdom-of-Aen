/**
 * @fileoverview Utilitários e constantes globais para o jogo Kingdom of Aen
 * @module utils/helpers
 * @author Kingdom of Aen Team
 */

// ============================================
// ===       ÍCONES DAS FILEIRAS           ===
// ============================================

/**
 * Mapeamento de tipos de fileira para seus ícones
 * @constant {Object.<string, string>}
 */
const ROW_ICONS = {
    melee: 'img/icons/icon-melee.png',
    ranged: 'img/icons/icon-ranged.png',
    siege: 'img/icons/icon-siege.png',
    agile: 'img/icons/icon-ranged.png' // Agile usa ícone de ranged por padrão
};

// ============================================
// ===       DESCRIÇÕES DAS HABILIDADES    ===
// ============================================

/**
 * Descrições legíveis das habilidades das cartas
 * @constant {Object.<string, string>}
 */
const ABILITY_DESCRIPTIONS = {
    spy: 'Espião',
    spy_medic: 'Espião Médico',
    medic: 'Médico',
    bond_partner: 'Vínculo',
    tight_bond: 'Vínculo Forte',
    decoy: 'Espantalho',
    scorch: 'Queimar',
    weather_frost: 'Geada',
    weather_fog: 'Névoa',
    weather_rain: 'Chuva',
    weather_clear: 'Limpar Clima'
};

// ============================================
// ===       FUNÇÕES UTILITÁRIAS           ===
// ============================================

/**
 * Embaralha um array usando o algoritmo Fisher-Yates
 * @param {Array} array - Array a ser embaralhado
 * @returns {Array} Novo array embaralhado (não modifica o original)
 * @example
 * const deck = [1, 2, 3, 4, 5];
 * const shuffled = shuffleArray(deck);
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================
// ===       EXPORTS (Futuros ES6 Modules) ===
// ============================================
// Quando migrar para ES6 Modules, descomentar:
// export { ROW_ICONS, ABILITY_DESCRIPTIONS, shuffleArray };
