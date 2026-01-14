/**
 * @fileoverview Ponto de entrada principal do Kingdom of Aen
 * @module main
 * @author Pedro Braga, Ramon
 * @version 1.0.0
 * @see contexto.md para documentação completa do projeto
 */

// ============================================
// ===       INICIALIZAÇÃO DO JOGO         ===
// ============================================

/**
 * Inicializa o jogo com o sistema antigo (sem deck builder)
 */
function initializeGame() {
    renderHand();
    // Initialize Enemy Hand with random cards from DB
    enemyHand = [];
    for (let i = 0; i < 10; i++) {
        const randomCard = allCardsData[Math.floor(Math.random() * allCardsData.length)];
        enemyHand.push({ ...randomCard, id: `e${i}_${randomCard.id}` });
    }

    // Initialize Leaders
    initializeLeaders();

    updateScore();
    updateEnemyHandUI();
    updateTurnVisuals();
    updateLeaderVisuals();
}

/**
 * Inicializa o jogo com um deck do Deck Builder
 * @param {Array} deckIds - Array de IDs das cartas do deck
 */
function initializeGameWithDeck(deckIds) {
    console.log("=== INICIANDO JOGO COM DECK ===");
    console.log("Deck IDs:", deckIds);

    // 1. Converter IDs para objetos de carta e embaralhar
    let convertedPlayerCards = [];
    if (typeof idsToCards === 'function') {
        convertedPlayerCards = idsToCards(deckIds);
    } else {
        convertedPlayerCards = deckIds.map(id => allCardsData.find(c => c.id === id)).filter(Boolean);
        console.warn('[DEBUG initializeGameWithDeck] idsToCards() not found — using fallback mapping.');
    }
    playerDeck = shuffleArray(convertedPlayerCards || []);
    console.log("Deck embaralhado (player):", playerDeck.length, "cartas");

    // 2. Criar deck do inimigo
    const sourceCollection = (typeof CARD_COLLECTION !== 'undefined') ? CARD_COLLECTION : allCardsData;
    if (typeof CARD_COLLECTION === 'undefined') {
        console.warn('[DEBUG initializeGameWithDeck] CARD_COLLECTION not defined — falling back to allCardsData for enemy deck.');
    }
    const enemyDeckIds = (sourceCollection || [])
        .filter(c => c.category === 'unit')
        .map(c => c.id);

    let convertedEnemyCards = [];
    if (typeof idsToCards === 'function') {
        convertedEnemyCards = idsToCards(enemyDeckIds);
    } else {
        convertedEnemyCards = enemyDeckIds.map(id => (sourceCollection || allCardsData).find(c => c.id === id)).filter(Boolean);
    }
    enemyDeck = shuffleArray(convertedEnemyCards || []);
    console.log("Deck inimigo (built):", enemyDeck.length, "cartas");

    // 3. Comprar 10 cartas para a mão do jogador
    const playerStartingHand = playerDeck.splice(0, 10);

    // 4. Comprar 10 cartas para a mão do inimigo
    enemyHand = enemyDeck.splice(0, 10).map((card, i) => ({
        ...card,
        id: `e${i}_${card.id}`
    }));
    console.log('[DEBUG initializeGameWithDeck] enemyHand length after draw:', enemyHand.length);

    // 5. Inicializar Líderes
    initializeLeaders();

    // 6. INICIAR FASE DE MULLIGAN
    startMulligan(playerStartingHand);

    console.log("=== AGUARDANDO MULLIGAN ===");
}

// ============================================
// ===       CONTROLES                     ===
// ============================================

/**
 * Configura os controles do jogo (botão passar, etc.)
 */
function setupControls() {
    const passBtn = document.getElementById('pass-button');
    if (passBtn) {
        passBtn.addEventListener('click', () => {
            if (playerPassed || isProcessingTurn) return;

            playerPassed = true;
            passBtn.disabled = true;
            passBtn.textContent = "Passado";
            console.log("Jogador passou a vez.");

            // Visual update
            document.querySelector('.player-side').classList.add('passed');
            updateTurnVisuals();

            // Play button SFX
            try { audioManager.playSFX('switch'); } catch (e) { console.warn('SFX failed', e); }

            // If player passes, enemy plays until they win or pass
            if (!enemyPassed) {
                enemyTurnLoop();
            } else {
                checkEndRound();
            }
        });
    }
}

// ============================================
// ===       INICIALIZAÇÃO                 ===
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // NÃO inicializar automaticamente - esperar pelo Deck Builder
    setupDragAndDrop();
    setupControls();
    setupLeaders();

    // Start music on first user interaction (browser gesture requirement)
    document.addEventListener('click', () => {
        try { audioManager.playMusic(); } catch (e) { console.warn('Audio start failed', e); }
    }, { once: true });

    // Create mute/unmute toggle button
    try {
        const btn = document.createElement('button');
        btn.id = 'audio-toggle-btn';
        btn.title = 'Mute / Unmute Audio';
        btn.className = 'audio-toggle';
        const setLabel = (muted) => btn.textContent = muted ? '🔇' : '🔊';
        setLabel(audioManager.sfxMuted || audioManager.musicMuted);
        btn.addEventListener('click', (e) => {
            const newMuted = audioManager.toggleMute();
            setLabel(newMuted);
        });
        btn.style.position = 'fixed';
        btn.style.right = '12px';
        btn.style.top = '12px';
        btn.style.zIndex = 9999;
        btn.style.background = 'rgba(0,0,0,0.6)';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.padding = '8px 10px';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        document.body.appendChild(btn);
    } catch (e) { console.warn('Failed to create audio toggle', e); }
});
