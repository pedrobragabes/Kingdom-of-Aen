/**
 * @fileoverview Versão ES6 Module dos utilitários
 * @module modules/helpers
 * 
 * Este arquivo é para uso FUTURO quando o projeto migrar para ES6 modules.
 * O arquivo atual usado pelo jogo é: js/utils/helpers.js (funções globais)
 */

export const ROW_ICONS = {
    melee: 'img/icons/icon-melee.png',
    ranged: 'img/icons/icon-ranged.png',
    siege: 'img/icons/icon-siege.png',
    agile: 'img/icons/icon-ranged.png'
};

export const ABILITY_DESCRIPTIONS = {
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
    weather_clear: 'Limpar Clima',
    hero: 'Herói'
};

export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
