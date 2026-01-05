// ============================================
// ===       FUNÇÕES UTILITÁRIAS           ===
// ============================================

/**
 * Mapeamento de ícones por tipo de fileira
 */
const ROW_ICONS = {
    'melee': 'img/icons/icon-melee.png',
    'ranged': 'img/icons/icon-ranged.png',
    'siege': 'img/icons/icon-siege.png',
    'agile': 'img/icons/icon-agile.png'
};

/**
 * Mapeamento de habilidades para descrições curtas
 */
const ABILITY_DESCRIPTIONS = {
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

/**
 * Embaralha um array usando o algoritmo Fisher-Yates
 * @param {Array} array - Array a ser embaralhado
 * @returns {Array} - Novo array embaralhado
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
