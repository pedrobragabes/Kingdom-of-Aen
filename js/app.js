/**
 * @fileoverview Ponto de entrada principal ES6 Module do Kingdom of Aen
 * @module app
 * @author Kingdom of Aen Team
 * @version 2.0.0
 * 
 * Este arquivo importa todos os módulos e os expõe globalmente
 * para manter compatibilidade com o código existente.
 */

// ============================================
// ===       IMPORTS                        ===
// ============================================

// Utils
import {
    ROW_ICONS,
    ABILITY_DESCRIPTIONS,
    shuffleArray
} from './utils/helpers.js';

// Data
import {
    leaderCardsData,
    CARD_COLLECTION,
    allCardsData,
    getCardById,
    getCardsByCategory,
    getCardsByType,
    countDeckComposition,
    validateDeck,
    idsToCards
} from './data/cards.js';

// State
import {
    gameState,
    PLAYER_FACTION,
    resetGameState,
    resetRoundState
} from './core/state.js';

// ============================================
// ===       EXPOR GLOBALMENTE              ===
// ============================================
// Para manter compatibilidade com código que ainda não foi migrado

// Utils
window.ROW_ICONS = ROW_ICONS;
window.ABILITY_DESCRIPTIONS = ABILITY_DESCRIPTIONS;
window.shuffleArray = shuffleArray;

// Data
window.leaderCardsData = leaderCardsData;
window.CARD_COLLECTION = CARD_COLLECTION;
window.allCardsData = allCardsData;
window.getCardById = getCardById;
window.getCardsByCategory = getCardsByCategory;
window.getCardsByType = getCardsByType;
window.countDeckComposition = countDeckComposition;
window.validateDeck = validateDeck;
window.idsToCards = idsToCards;

// State - Expõe o objeto de estado e cria getters/setters
window.gameState = gameState;
window.PLAYER_FACTION = PLAYER_FACTION;
window.resetGameState = resetGameState;
window.resetRoundState = resetRoundState;

// Aliases de estado para compatibilidade
Object.defineProperty(window, 'activeWeather', {
    get: () => gameState.activeWeather,
    set: (val) => gameState.activeWeather = val
});
Object.defineProperty(window, 'enemyHand', {
    get: () => gameState.enemyHand,
    set: (val) => gameState.enemyHand = val
});
Object.defineProperty(window, 'playerDeck', {
    get: () => gameState.playerDeck,
    set: (val) => gameState.playerDeck = val
});
Object.defineProperty(window, 'enemyDeck', {
    get: () => gameState.enemyDeck,
    set: (val) => gameState.enemyDeck = val
});
Object.defineProperty(window, 'playerPassed', {
    get: () => gameState.playerPassed,
    set: (val) => gameState.playerPassed = val
});
Object.defineProperty(window, 'enemyPassed', {
    get: () => gameState.enemyPassed,
    set: (val) => gameState.enemyPassed = val
});
Object.defineProperty(window, 'isProcessingTurn', {
    get: () => gameState.isProcessingTurn,
    set: (val) => gameState.isProcessingTurn = val
});
Object.defineProperty(window, 'playerWins', {
    get: () => gameState.playerWins,
    set: (val) => gameState.playerWins = val
});
Object.defineProperty(window, 'enemyWins', {
    get: () => gameState.enemyWins,
    set: (val) => gameState.enemyWins = val
});
Object.defineProperty(window, 'playerGraveyard', {
    get: () => gameState.playerGraveyard,
    set: (val) => gameState.playerGraveyard = val
});
Object.defineProperty(window, 'enemyGraveyard', {
    get: () => gameState.enemyGraveyard,
    set: (val) => gameState.enemyGraveyard = val
});
Object.defineProperty(window, 'playerLeader', {
    get: () => gameState.playerLeader,
    set: (val) => gameState.playerLeader = val
});
Object.defineProperty(window, 'enemyLeader', {
    get: () => gameState.enemyLeader,
    set: (val) => gameState.enemyLeader = val
});
Object.defineProperty(window, 'playerLeaderUsed', {
    get: () => gameState.playerLeaderUsed,
    set: (val) => gameState.playerLeaderUsed = val
});
Object.defineProperty(window, 'enemyLeaderUsed', {
    get: () => gameState.enemyLeaderUsed,
    set: (val) => gameState.enemyLeaderUsed = val
});
Object.defineProperty(window, 'mulliganHand', {
    get: () => gameState.mulliganHand,
    set: (val) => gameState.mulliganHand = val
});
Object.defineProperty(window, 'mulliganRedraws', {
    get: () => gameState.mulliganRedraws,
    set: (val) => gameState.mulliganRedraws = val
});

console.log('✅ Kingdom of Aen - ES6 Modules carregados com sucesso!');
