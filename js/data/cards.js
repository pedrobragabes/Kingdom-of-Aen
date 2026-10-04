import { CARD_ZONES, createCardDefinition, createCardInstance } from '../domain/card.js';

// ============================================
// ===       COLEÇÃO COMPLETA DE CARTAS    ===
// ============================================
// Cada carta tem um ID único para permitir múltiplas cópias no deck

export const CARD_COLLECTION = Object.freeze([
    // =========================================
    // MELEE - COMBOS (3 Cópias cada)
    // =========================================
    
    // Daniel x3 (Bond Partner com Gabriel)
    { id: 'daniel_1', baseId: 'daniel', name: 'Daniel', type: 'melee', power: 2, img: 'img/personagens/Daniel.png', ability: 'bond_partner', partner: 'Gabriel', category: 'unit' },
    { id: 'daniel_2', baseId: 'daniel', name: 'Daniel', type: 'melee', power: 2, img: 'img/personagens/Daniel.png', ability: 'bond_partner', partner: 'Gabriel', category: 'unit' },
    { id: 'daniel_3', baseId: 'daniel', name: 'Daniel', type: 'melee', power: 2, img: 'img/personagens/Daniel.png', ability: 'bond_partner', partner: 'Gabriel', category: 'unit' },
    
    // Gabriel x3 (Bond Partner com Daniel)
    { id: 'gabriel_1', baseId: 'gabriel', name: 'Gabriel', type: 'melee', power: 2, img: 'img/personagens/Gabriel.png', ability: 'bond_partner', partner: 'Daniel', category: 'unit' },
    { id: 'gabriel_2', baseId: 'gabriel', name: 'Gabriel', type: 'melee', power: 2, img: 'img/personagens/Gabriel.png', ability: 'bond_partner', partner: 'Daniel', category: 'unit' },
    { id: 'gabriel_3', baseId: 'gabriel', name: 'Gabriel', type: 'melee', power: 2, img: 'img/personagens/Gabriel.png', ability: 'bond_partner', partner: 'Daniel', category: 'unit' },

    // =========================================
    // MELEE - INFANTARIA (2 Cópias cada)
    // =========================================
    { id: 'anderson_1', baseId: 'anderson', name: 'Anderson', type: 'melee', power: 4, category: 'unit' },
    { id: 'anderson_2', baseId: 'anderson', name: 'Anderson', type: 'melee', power: 4, category: 'unit' },
    
    { id: 'vanessa_1', baseId: 'vanessa', name: 'Vanessa', type: 'melee', power: 3, category: 'unit' },
    { id: 'vanessa_2', baseId: 'vanessa', name: 'Vanessa', type: 'melee', power: 3, category: 'unit' },
    
    { id: 'wellington_1', baseId: 'wellington', name: 'Wellington O Gigante', type: 'melee', power: 6, img: 'img/personagens/Wellington.png', category: 'unit' },
    { id: 'wellington_2', baseId: 'wellington', name: 'Wellington O Gigante', type: 'melee', power: 6, img: 'img/personagens/Wellington.png', category: 'unit' },
    
    { id: 'pattenberg_1', baseId: 'pattenberg', name: 'Pattenberg', type: 'melee', power: 6, category: 'unit' },
    { id: 'pattenberg_2', baseId: 'pattenberg', name: 'Pattenberg', type: 'melee', power: 6, category: 'unit' },

    // =========================================
    // RANGED - COMBOS (3 Cópias cada)
    // =========================================
    { id: 'marcelo_1', baseId: 'marcelo', name: 'Marcelo', type: 'ranged', power: 5, ability: 'bond_partner', partner: 'Suelly', category: 'unit' },
    { id: 'marcelo_2', baseId: 'marcelo', name: 'Marcelo', type: 'ranged', power: 5, ability: 'bond_partner', partner: 'Suelly', category: 'unit' },
    { id: 'marcelo_3', baseId: 'marcelo', name: 'Marcelo', type: 'ranged', power: 5, ability: 'bond_partner', partner: 'Suelly', category: 'unit' },
    
    { id: 'suelly_1', baseId: 'suelly', name: 'Suelly', type: 'ranged', power: 2, img: 'img/personagens/Suelly.png', ability: 'bond_partner', partner: 'Marcelo', category: 'unit' },
    { id: 'suelly_2', baseId: 'suelly', name: 'Suelly', type: 'ranged', power: 2, img: 'img/personagens/Suelly.png', ability: 'bond_partner', partner: 'Marcelo', category: 'unit' },
    { id: 'suelly_3', baseId: 'suelly', name: 'Suelly', type: 'ranged', power: 2, img: 'img/personagens/Suelly.png', ability: 'bond_partner', partner: 'Marcelo', category: 'unit' },

    // =========================================
    // RANGED - SUPORTE (2 Cópias cada)
    // =========================================
    { id: 'adr14no_1', baseId: 'adr14no', name: 'Adr14no', type: 'ranged', power: 5, img: 'img/personagens/Adriano.png', category: 'unit' },
    { id: 'adr14no_2', baseId: 'adr14no', name: 'Adr14no', type: 'ranged', power: 5, img: 'img/personagens/Adriano.png', category: 'unit' },
    
    { id: 'clarice_1', baseId: 'clarice', name: 'Clarice', type: 'ranged', power: 4, category: 'unit' },
    { id: 'clarice_2', baseId: 'clarice', name: 'Clarice', type: 'ranged', power: 4, category: 'unit' },
    
    { id: 'jacy_1', baseId: 'jacy', name: 'Jacy', type: 'ranged', power: 3, category: 'unit' },
    { id: 'jacy_2', baseId: 'jacy', name: 'Jacy', type: 'ranged', power: 3, category: 'unit' },
    
    { id: 'thiago_1', baseId: 'thiago', name: 'Thiago', type: 'ranged', power: 2, img: 'img/personagens/Thiago.png', category: 'unit' },
    { id: 'thiago_2', baseId: 'thiago', name: 'Thiago', type: 'ranged', power: 2, img: 'img/personagens/Thiago.png', category: 'unit' },
    
    { id: 'kariel_1', baseId: 'kariel', name: 'Kariel', type: 'ranged', power: 2, category: 'unit' },
    { id: 'kariel_2', baseId: 'kariel', name: 'Kariel', type: 'ranged', power: 2, category: 'unit' },
    
    { id: 'jassyhara_1', baseId: 'jassyhara', name: 'Jassyhara', type: 'ranged', power: 4, category: 'unit' },
    { id: 'jassyhara_2', baseId: 'jassyhara', name: 'Jassyhara', type: 'ranged', power: 4, category: 'unit' },

    // =========================================
    // SIEGE - UNIDADES
    // =========================================
    { id: 'eliel_1', baseId: 'eliel', name: 'Eliel', type: 'siege', power: 6, category: 'unit' },
    { id: 'eliel_2', baseId: 'eliel', name: 'Eliel', type: 'siege', power: 6, category: 'unit' },
    
    { id: 'ritatril_1', baseId: 'ritatril', name: 'Ritatril', type: 'siege', power: 3, category: 'unit' },
    { id: 'ritatril_2', baseId: 'ritatril', name: 'Ritatril', type: 'siege', power: 3, category: 'unit' },

    // =========================================
    // HERÓI (1 Cópia - Única)
    // =========================================
    { id: 'marcus_1', baseId: 'marcus', name: 'Sir Marcus O Rei', type: 'siege', power: 9, ability: 'hero', description: 'O rei da Alfredolândia.', isHero: true, category: 'unit' },

    // =========================================
    // UNIDADES AGILE (Row: 'all')
    // =========================================
    { id: 'cozinheiros_1', baseId: 'cozinheiros', name: 'Cozinheiros', type: 'melee', row: 'all', power: 3, img: 'img/personagens/Cozinheiros.png', category: 'unit' },
    { id: 'cozinheiros_2', baseId: 'cozinheiros', name: 'Cozinheiros', type: 'melee', row: 'all', power: 3, img: 'img/personagens/Cozinheiros.png', category: 'unit' }
].map(createCardDefinition));

// ============================================
// ===       FUNÇÕES AUXILIARES            ===
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

/** Conta unidades e poder total em um array de IDs */
export function countDeckComposition(deckIds) {
    let units = 0;
    let totalPower = 0;
    
    deckIds.forEach(id => {
        const card = getCardById(id);
        if (card) {
            units++;
            totalPower += card.power || 0;
        }
    });
    
    return { units, total: units, totalPower };
}
/** Valida se um deck possui pelo menos 22 unidades. */
export function validateDeck(deckIds) {
    const { units } = countDeckComposition(deckIds);
    
    const errors = [];
    if (units < 22) {
        errors.push(`Precisa de pelo menos 22 unidades (atual: ${units})`);
    }

    return { valid: errors.length === 0, errors, units };
}

/** Converte IDs de definições em instâncias canônicas. */
export function idsToCards(deckIds, ownerId, zone = CARD_ZONES.DECK) {
    return deckIds.map(id => {
        const definition = getCardById(id);
        return definition ? createCardInstance(definition, { ownerId, zone }) : null;
    }).filter(card => card !== null);
}
// End of card catalog.
