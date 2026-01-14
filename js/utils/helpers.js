/**
 * @fileoverview Utilitários e constantes globais para o jogo Kingdom of Aen
 * @module utils/helpers
 * @author Kingdom of Aen Team
 * 
 * Padrão IIFE para encapsulamento sem precisar de servidor HTTP
 */

// Namespace global do jogo
window.KoA = window.KoA || {};

(function (KoA) {
    'use strict';

    // ============================================
    // ===       ÍCONES DAS FILEIRAS           ===
    // ============================================

    const ROW_ICONS = {
        melee: 'img/icons/icon-melee.png',
        ranged: 'img/icons/icon-ranged.png',
        siege: 'img/icons/icon-siege.png',
        agile: 'img/icons/icon-ranged.png'
    };

    // ============================================
    // ===       DESCRIÇÕES DAS HABILIDADES    ===
    // ============================================

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
        weather_clear: 'Limpar Clima',
        hero: 'Herói'
    };

    // ============================================
    // ===       FUNÇÕES UTILITÁRIAS           ===
    // ============================================

    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // ============================================
    // ===       EXPORTS PARA NAMESPACE         ===
    // ============================================

    KoA.ROW_ICONS = ROW_ICONS;
    KoA.ABILITY_DESCRIPTIONS = ABILITY_DESCRIPTIONS;
    KoA.shuffleArray = shuffleArray;

    // Também expõe globalmente para compatibilidade
    window.ROW_ICONS = ROW_ICONS;
    window.ABILITY_DESCRIPTIONS = ABILITY_DESCRIPTIONS;
    window.shuffleArray = shuffleArray;

})(window.KoA);
