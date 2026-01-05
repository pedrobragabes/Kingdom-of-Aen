// ============================================
// ===       CARTAS DE LÍDER               ===
// ============================================
const leaderCardsData = [
    {
        id: 'leader_general',
        name: 'O General',
        img: 'assets/leader_general.png',
        ability: 'leader_clear_weather',
        description: 'Limpa todos os efeitos climáticos do campo de batalha.',
        faction: 'alfredolandia',
        isLeader: true
    },
    {
        id: 'leader_usurper',
        name: 'O Usurpador',
        img: 'assets/leader_usurper.png',
        ability: 'leader_scorch_siege',
        description: 'Destrói a carta mais forte na fileira de Cerco inimiga.',
        faction: 'reinos_sombrios',
        isLeader: true
    },
    {
        id: 'leader_archmage',
        name: 'O Arquimago',
        img: 'assets/leader_archmage.png',
        ability: 'leader_draw_card',
        description: 'Compra 1 carta do deck imediatamente.',
        faction: 'torre_arcana',
        isLeader: true
    },
    {
        id: 'leader_warlord',
        name: 'O Senhor da Guerra',
        img: 'assets/leader_warlord.png',
        ability: 'leader_boost_melee',
        description: 'Adiciona +2 de poder a todas as unidades na fileira Melee.',
        faction: 'horda_selvagem',
        isLeader: true
    }
];

// ============================================
// ===       COLEÇÃO COMPLETA DE CARTAS    ===
// ============================================
// Cada carta tem um ID único para permitir múltiplas cópias no deck

const CARD_COLLECTION = [
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
    { id: 'anderson_1', baseId: 'anderson', name: 'Anderson', type: 'melee', power: 4, img: 'assets/anderson.png', category: 'unit' },
    { id: 'anderson_2', baseId: 'anderson', name: 'Anderson', type: 'melee', power: 4, img: 'assets/anderson.png', category: 'unit' },

    { id: 'vanessa_1', baseId: 'vanessa', name: 'Vanessa', type: 'melee', power: 3, img: 'assets/vanessa.png', category: 'unit' },
    { id: 'vanessa_2', baseId: 'vanessa', name: 'Vanessa', type: 'melee', power: 3, img: 'assets/vanessa.png', category: 'unit' },

    { id: 'wellington_1', baseId: 'wellington', name: 'Wellington O Gigante', type: 'melee', power: 6, img: 'img/personagens/Wellington.png', category: 'unit' },
    { id: 'wellington_2', baseId: 'wellington', name: 'Wellington O Gigante', type: 'melee', power: 6, img: 'img/personagens/Wellington.png', category: 'unit' },

    { id: 'pattenberg_1', baseId: 'pattenberg', name: 'Pattenberg', type: 'melee', power: 6, img: 'assets/pattenberg.png', category: 'unit' },
    { id: 'pattenberg_2', baseId: 'pattenberg', name: 'Pattenberg', type: 'melee', power: 6, img: 'assets/pattenberg.png', category: 'unit' },

    // =========================================
    // RANGED - COMBOS (3 Cópias cada)
    // =========================================
    { id: 'marcelo_1', baseId: 'marcelo', name: 'Marcelo', type: 'ranged', power: 5, img: 'assets/marcelo.png', ability: 'bond_partner', partner: 'Suelly', category: 'unit' },
    { id: 'marcelo_2', baseId: 'marcelo', name: 'Marcelo', type: 'ranged', power: 5, img: 'assets/marcelo.png', ability: 'bond_partner', partner: 'Suelly', category: 'unit' },
    { id: 'marcelo_3', baseId: 'marcelo', name: 'Marcelo', type: 'ranged', power: 5, img: 'assets/marcelo.png', ability: 'bond_partner', partner: 'Suelly', category: 'unit' },

    { id: 'suelly_1', baseId: 'suelly', name: 'Suelly', type: 'ranged', power: 2, img: 'img/personagens/Suelly.png', ability: 'bond_partner', partner: 'Marcelo', category: 'unit' },
    { id: 'suelly_2', baseId: 'suelly', name: 'Suelly', type: 'ranged', power: 2, img: 'img/personagens/Suelly.png', ability: 'bond_partner', partner: 'Marcelo', category: 'unit' },
    { id: 'suelly_3', baseId: 'suelly', name: 'Suelly', type: 'ranged', power: 2, img: 'img/personagens/Suelly.png', ability: 'bond_partner', partner: 'Marcelo', category: 'unit' },

    // =========================================
    // RANGED - SUPORTE (2 Cópias cada)
    // =========================================
    { id: 'adr14no_1', baseId: 'adr14no', name: 'Adr14no', type: 'ranged', power: 5, img: 'img/personagens/Adriano.png', category: 'unit' },
    { id: 'adr14no_2', baseId: 'adr14no', name: 'Adr14no', type: 'ranged', power: 5, img: 'img/personagens/Adriano.png', category: 'unit' },

    { id: 'clarice_1', baseId: 'clarice', name: 'Clarice', type: 'ranged', power: 4, img: 'assets/clarice.png', category: 'unit' },
    { id: 'clarice_2', baseId: 'clarice', name: 'Clarice', type: 'ranged', power: 4, img: 'assets/clarice.png', category: 'unit' },

    { id: 'jacy_1', baseId: 'jacy', name: 'Jacy', type: 'ranged', power: 3, img: 'assets/jacy.png', category: 'unit' },
    { id: 'jacy_2', baseId: 'jacy', name: 'Jacy', type: 'ranged', power: 3, img: 'assets/jacy.png', category: 'unit' },

    { id: 'thiago_1', baseId: 'thiago', name: 'Thiago', type: 'ranged', power: 2, img: 'img/personagens/Thiago.png', category: 'unit' },
    { id: 'thiago_2', baseId: 'thiago', name: 'Thiago', type: 'ranged', power: 2, img: 'img/personagens/Thiago.png', category: 'unit' },

    { id: 'kariel_1', baseId: 'kariel', name: 'Kariel', type: 'ranged', power: 2, img: 'assets/kariel.png', category: 'unit' },
    { id: 'kariel_2', baseId: 'kariel', name: 'Kariel', type: 'ranged', power: 2, img: 'assets/kariel.png', category: 'unit' },

    { id: 'jassyhara_1', baseId: 'jassyhara', name: 'Jassyhara', type: 'ranged', power: 4, img: 'assets/jassyhara.png', category: 'unit' },
    { id: 'jassyhara_2', baseId: 'jassyhara', name: 'Jassyhara', type: 'ranged', power: 4, img: 'assets/jassyhara.png', category: 'unit' },

    // =========================================
    // SIEGE - UNIDADES
    // =========================================
    { id: 'eliel_1', baseId: 'eliel', name: 'Eliel', type: 'siege', power: 6, img: 'assets/eliel.png', category: 'unit' },
    { id: 'eliel_2', baseId: 'eliel', name: 'Eliel', type: 'siege', power: 6, img: 'assets/eliel.png', category: 'unit' },

    { id: 'ritatril_1', baseId: 'ritatril', name: 'Ritatril', type: 'siege', power: 3, img: 'assets/ritatril.png', ability: 'medic', category: 'unit' },
    { id: 'ritatril_2', baseId: 'ritatril', name: 'Ritatril', type: 'siege', power: 3, img: 'assets/ritatril.png', ability: 'medic', category: 'unit' },

    // =========================================
    // HERÓI (1 Cópia - Única)
    // =========================================
    { id: 'marcus_1', baseId: 'marcus', name: 'Sir Marcus O Rei', type: 'siege', power: 9, img: 'assets/marcus.png', ability: 'hero', description: 'O rei da Alfredolândia. Imune a efeitos.', isHero: true, category: 'unit' },

    // =========================================
    // ESPECIAIS - AGILE (Row: 'all')
    // =========================================
    { id: 'geleia_1', baseId: 'geleia', name: 'Geleia Espião', type: 'melee', row: 'all', power: 3, img: 'img/personagens/Geleia.png', ability: 'spy_medic', category: 'special' },
    { id: 'corredores_1', baseId: 'corredores', name: 'Corredores Espião', type: 'melee', row: 'all', power: 5, img: 'img/personagens/Corredores.png', ability: 'spy_medic', category: 'special' },

    { id: 'cozinheiros_1', baseId: 'cozinheiros', name: 'Cozinheiros', type: 'melee', row: 'all', power: 3, img: 'img/personagens/Cozinheiros.png', category: 'unit' },
    { id: 'cozinheiros_2', baseId: 'cozinheiros', name: 'Cozinheiros', type: 'melee', row: 'all', power: 3, img: 'img/personagens/Cozinheiros.png', category: 'unit' },

    { id: 'espantalho_1', baseId: 'espantalho', name: 'Espantalho', type: 'melee', row: 'all', power: 0, img: 'img/personagens/Espantalho.png', ability: 'decoy', category: 'special' },
    { id: 'espantalho_2', baseId: 'espantalho', name: 'Espantalho', type: 'melee', row: 'all', power: 0, img: 'img/personagens/Espantalho.png', ability: 'decoy', category: 'special' }
];

export const allCardsData = CARD_COLLECTION;

// Named exports for backward compatibility and flexibility
export { CARD_COLLECTION, leaderCardsData };

// Default export as requested by architecture
export default CARD_COLLECTION;
