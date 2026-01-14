/**
 * @fileoverview Estado global do jogo Kingdom of Aen
 * @module core/state
 * @author Kingdom of Aen Team
 */

// ============================================
// ===       ESTADO DO CLIMA               ===
// ============================================

/**
 * Estado atual do clima no tabuleiro
 * @type {{frost: boolean, fog: boolean, rain: boolean}}
 */
let activeWeather = { frost: false, fog: false, rain: false };

// ============================================
// ===       ESTADO DAS MÃOS               ===
// ============================================

/**
 * Cartas na mão do inimigo
 * @type {Array<Object>}
 */
let enemyHand = [];

/**
 * Deck do jogador (cartas restantes)
 * @type {Array<Object>}
 */
let playerDeck = [];

/**
 * Deck do inimigo (cartas restantes)
 * @type {Array<Object>}
 */
let enemyDeck = [];

// ============================================
// ===       ESTADO DOS TURNOS             ===
// ============================================

/**
 * Se o jogador passou a vez
 * @type {boolean}
 */
let playerPassed = false;

/**
 * Se o inimigo passou a vez
 * @type {boolean}
 */
let enemyPassed = false;

/**
 * Se está processando um turno (aguardando animações/IA)
 * @type {boolean}
 */
let isProcessingTurn = false;

// ============================================
// ===       ESTADO DAS VITÓRIAS           ===
// ============================================

/**
 * Número de rodadas vencidas pelo jogador
 * @type {number}
 */
let playerWins = 0;

/**
 * Número de rodadas vencidas pelo inimigo
 * @type {number}
 */
let enemyWins = 0;

// ============================================
// ===       CEMITÉRIOS                    ===
// ============================================

/**
 * Cartas no cemitério do jogador
 * @type {Array<Object>}
 */
let playerGraveyard = [];

/**
 * Cartas no cemitério do inimigo
 * @type {Array<Object>}
 */
let enemyGraveyard = [];

// ============================================
// ===       LÍDERES                       ===
// ============================================

/**
 * Líder do jogador
 * @type {Object|null}
 */
let playerLeader = null;

/**
 * Líder do inimigo
 * @type {Object|null}
 */
let enemyLeader = null;

/**
 * Se o líder do jogador já foi usado
 * @type {boolean}
 */
let playerLeaderUsed = false;

/**
 * Se o líder do inimigo já foi usado
 * @type {boolean}
 */
let enemyLeaderUsed = false;

// ============================================
// ===       MULLIGAN                      ===
// ============================================

/**
 * Mão temporária durante a fase de mulligan
 * @type {Array<Object>}
 */
let mulliganHand = [];

/**
 * Trocas restantes durante o mulligan
 * @type {number}
 */
let mulliganRedraws = 2;

// ============================================
// ===       FACÇÃO                        ===
// ============================================

/**
 * Facção do jogador (afeta passivas)
 * @constant {string}
 */
const PLAYER_FACTION = 'alfredolandia';

// ============================================
// ===       FUNÇÕES DE RESET              ===
// ============================================

/**
 * Reseta todo o estado do jogo para valores iniciais
 * @returns {void}
 */
function resetGameState() {
    activeWeather = { frost: false, fog: false, rain: false };
    enemyHand = [];
    playerDeck = [];
    enemyDeck = [];
    playerPassed = false;
    enemyPassed = false;
    isProcessingTurn = false;
    playerWins = 0;
    enemyWins = 0;
    playerGraveyard = [];
    enemyGraveyard = [];
    playerLeader = null;
    enemyLeader = null;
    playerLeaderUsed = false;
    enemyLeaderUsed = false;
    mulliganHand = [];
    mulliganRedraws = 2;
}

/**
 * Reseta apenas o estado da rodada (mantém vitórias e cemitérios)
 * @returns {void}
 */
function resetRoundState() {
    activeWeather = { frost: false, fog: false, rain: false };
    playerPassed = false;
    enemyPassed = false;
    isProcessingTurn = false;
}

// ============================================
// ===       EXPORTS (Futuros ES6 Modules) ===
// ============================================
// Quando migrar para ES6 Modules, exportar o estado como objeto
// export { activeWeather, enemyHand, playerDeck, ... };
