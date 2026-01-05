// ============================================
// ===       ESTADO GLOBAL DO JOGO         ===
// ============================================

// Game State - Clima
let activeWeather = { frost: false, fog: false, rain: false };

// Game State - Mãos e Turnos
let enemyHand = [];
let playerPassed = false;
let enemyPassed = false;
let isProcessingTurn = false;

// Game State - Vitórias e Cemitérios
let playerWins = 0;
let enemyWins = 0;
let playerGraveyard = [];
let enemyGraveyard = [];

// Deck State
let playerDeck = []; // Deck embaralhado do jogador (objetos de carta)
let enemyDeck = [];  // Deck embaralhado do inimigo (objetos de carta)

// Leader State
let playerLeader = null;
let enemyLeader = null;
let playerLeaderUsed = false;
let enemyLeaderUsed = false;

// Mulligan State
let mulliganHand = []; // Mão temporária durante o mulligan
let mulliganRedraws = 2; // Trocas restantes

// Faction Passive State
const PLAYER_FACTION = 'alfredolandia'; // "Reinos do Norte" - Compra carta ao vencer rodada

// ============================================
// ===       FUNÇÕES DE RESET              ===
// ============================================

/**
 * Reseta o estado do jogo para valores iniciais
 */
function resetGameState() {
    activeWeather = { frost: false, fog: false, rain: false };
    enemyHand = [];
    playerPassed = false;
    enemyPassed = false;
    isProcessingTurn = false;
    playerWins = 0;
    enemyWins = 0;
    playerGraveyard = [];
    enemyGraveyard = [];
    playerDeck = [];
    enemyDeck = [];
    playerLeader = null;
    enemyLeader = null;
    playerLeaderUsed = false;
    enemyLeaderUsed = false;
    mulliganHand = [];
    mulliganRedraws = 2;
}

/**
 * Reseta apenas o estado de uma rodada (mantém vitórias e líderes)
 */
function resetRoundState() {
    activeWeather = { frost: false, fog: false, rain: false };
    playerPassed = false;
    enemyPassed = false;
    isProcessingTurn = false;
}
