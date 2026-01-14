/**
 * @fileoverview Estado global do jogo Kingdom of Aen
 * @module core/state
 * @author Kingdom of Aen Team
 * 
 * Padrão IIFE para encapsulamento sem precisar de servidor HTTP
 */

window.KoA = window.KoA || {};

(function (KoA) {
    'use strict';

    // ============================================
    // ===       ESTADO DO JOGO                ===
    // ============================================

    // Clima
    let activeWeather = { frost: false, fog: false, rain: false };

    // Mãos e Decks
    let enemyHand = [];
    let playerDeck = [];
    let enemyDeck = [];

    // Turnos
    let playerPassed = false;
    let enemyPassed = false;
    let isProcessingTurn = false;

    // Vitórias
    let playerWins = 0;
    let enemyWins = 0;

    // Cemitérios
    let playerGraveyard = [];
    let enemyGraveyard = [];

    // Líderes
    let playerLeader = null;
    let enemyLeader = null;
    let playerLeaderUsed = false;
    let enemyLeaderUsed = false;

    // Mulligan
    let mulliganHand = [];
    let mulliganRedraws = 2;

    // Facção
    const PLAYER_FACTION = 'alfredolandia';

    // ============================================
    // ===       FUNÇÕES DE RESET              ===
    // ============================================

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

        // Atualiza os globais
        syncToGlobal();
    }

    function resetRoundState() {
        activeWeather = { frost: false, fog: false, rain: false };
        playerPassed = false;
        enemyPassed = false;
        isProcessingTurn = false;

        // Atualiza os globais
        window.activeWeather = activeWeather;
        window.playerPassed = playerPassed;
        window.enemyPassed = enemyPassed;
        window.isProcessingTurn = isProcessingTurn;
    }

    function syncToGlobal() {
        window.activeWeather = activeWeather;
        window.enemyHand = enemyHand;
        window.playerDeck = playerDeck;
        window.enemyDeck = enemyDeck;
        window.playerPassed = playerPassed;
        window.enemyPassed = enemyPassed;
        window.isProcessingTurn = isProcessingTurn;
        window.playerWins = playerWins;
        window.enemyWins = enemyWins;
        window.playerGraveyard = playerGraveyard;
        window.enemyGraveyard = enemyGraveyard;
        window.playerLeader = playerLeader;
        window.enemyLeader = enemyLeader;
        window.playerLeaderUsed = playerLeaderUsed;
        window.enemyLeaderUsed = enemyLeaderUsed;
        window.mulliganHand = mulliganHand;
        window.mulliganRedraws = mulliganRedraws;
    }

    // ============================================
    // ===       EXPORTS PARA NAMESPACE         ===
    // ============================================

    KoA.state = {
        get activeWeather() { return activeWeather; },
        set activeWeather(val) { activeWeather = val; window.activeWeather = val; },
        get enemyHand() { return enemyHand; },
        set enemyHand(val) { enemyHand = val; window.enemyHand = val; },
        get playerDeck() { return playerDeck; },
        set playerDeck(val) { playerDeck = val; window.playerDeck = val; },
        get enemyDeck() { return enemyDeck; },
        set enemyDeck(val) { enemyDeck = val; window.enemyDeck = val; },
        get playerPassed() { return playerPassed; },
        set playerPassed(val) { playerPassed = val; window.playerPassed = val; },
        get enemyPassed() { return enemyPassed; },
        set enemyPassed(val) { enemyPassed = val; window.enemyPassed = val; },
        get isProcessingTurn() { return isProcessingTurn; },
        set isProcessingTurn(val) { isProcessingTurn = val; window.isProcessingTurn = val; },
        get playerWins() { return playerWins; },
        set playerWins(val) { playerWins = val; window.playerWins = val; },
        get enemyWins() { return enemyWins; },
        set enemyWins(val) { enemyWins = val; window.enemyWins = val; },
        get playerGraveyard() { return playerGraveyard; },
        set playerGraveyard(val) { playerGraveyard = val; window.playerGraveyard = val; },
        get enemyGraveyard() { return enemyGraveyard; },
        set enemyGraveyard(val) { enemyGraveyard = val; window.enemyGraveyard = val; },
        get playerLeader() { return playerLeader; },
        set playerLeader(val) { playerLeader = val; window.playerLeader = val; },
        get enemyLeader() { return enemyLeader; },
        set enemyLeader(val) { enemyLeader = val; window.enemyLeader = val; },
        get playerLeaderUsed() { return playerLeaderUsed; },
        set playerLeaderUsed(val) { playerLeaderUsed = val; window.playerLeaderUsed = val; },
        get enemyLeaderUsed() { return enemyLeaderUsed; },
        set enemyLeaderUsed(val) { enemyLeaderUsed = val; window.enemyLeaderUsed = val; },
        get mulliganHand() { return mulliganHand; },
        set mulliganHand(val) { mulliganHand = val; window.mulliganHand = val; },
        get mulliganRedraws() { return mulliganRedraws; },
        set mulliganRedraws(val) { mulliganRedraws = val; window.mulliganRedraws = val; }
    };

    KoA.PLAYER_FACTION = PLAYER_FACTION;
    KoA.resetGameState = resetGameState;
    KoA.resetRoundState = resetRoundState;

    // Expõe globalmente para compatibilidade
    window.PLAYER_FACTION = PLAYER_FACTION;
    window.resetGameState = resetGameState;
    window.resetRoundState = resetRoundState;

    // Inicializa os globais
    syncToGlobal();

})(window.KoA);
