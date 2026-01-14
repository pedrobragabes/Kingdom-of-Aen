// ============================================
// ===       SISTEMA DE MULLIGAN           ===
// ============================================

/**
 * Inicia a fase de mulligan (troca de cartas)
 * @param {Array} playerHand - Mão inicial do jogador
 */
function startMulligan(playerHand) {
    console.log("[Mulligan] Iniciando fase de troca...");

    // Resetar estado
    mulliganHand = playerHand.map((card, i) => ({
        ...card,
        id: `p${i}_${card.id}`
    }));
    mulliganRedraws = 2;

    // Atualizar contador na UI
    const redrawCountEl = document.getElementById('redraw-count');
    if (redrawCountEl) {
        redrawCountEl.textContent = mulliganRedraws;
        redrawCountEl.classList.remove('exhausted');
    }

    // Renderizar cartas no overlay
    renderMulliganCards();

    // Mostrar overlay
    const overlay = document.getElementById('mulligan-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }

    // Setup botão de confirmar
    const confirmBtn = document.getElementById('mulligan-confirm-btn');
    if (confirmBtn) {
        confirmBtn.onclick = finishMulligan;
    }

    // Tocar SFX de shuffle
    try { audioManager.playSFX('shuffle'); } catch (e) { console.warn('SFX failed', e); }
}

/**
 * Renderiza as cartas do mulligan no overlay
 */
function renderMulliganCards() {
    const container = document.getElementById('mulligan-cards');
    if (!container) return;

    container.innerHTML = '';

    mulliganHand.forEach((card, index) => {
        const cardEl = createMulliganCardElement(card, index);
        container.appendChild(cardEl);
    });
}

/**
 * Cria um elemento de carta para o mulligan
 * @param {Object} card - Dados da carta
 * @param {number} index - Índice da carta na mão
 * @returns {HTMLElement} Elemento da carta
 */
function createMulliganCardElement(card, index) {
    const el = document.createElement('div');
    el.classList.add('mulligan-card');
    el.dataset.index = index;
    el.dataset.id = card.id;

    // Background image
    if (card.img) {
        el.style.backgroundImage = `url('${card.img}')`;
    }

    // Overlay for readability
    const overlay = document.createElement('div');
    overlay.classList.add('card-overlay');
    el.appendChild(overlay);

    // Strength badge
    const strengthBadge = document.createElement('div');
    strengthBadge.classList.add('card-strength-badge');
    strengthBadge.textContent = card.power;
    el.appendChild(strengthBadge);

    // Info container
    const infoContainer = document.createElement('div');
    infoContainer.classList.add('card-info-container');

    // Card name
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('card-name');
    nameDiv.textContent = card.name;
    infoContainer.appendChild(nameDiv);

    // Card description
    const descDiv = document.createElement('div');
    descDiv.classList.add('card-desc');
    if (card.ability && card.ability !== 'none') {
        descDiv.textContent = ABILITY_DESCRIPTIONS[card.ability] || card.ability;
    } else {
        descDiv.textContent = card.type ? card.type.charAt(0).toUpperCase() + card.type.slice(1) : '';
    }
    infoContainer.appendChild(descDiv);

    el.appendChild(infoContainer);

    // Click event for redraw
    el.addEventListener('click', () => redrawCard(index));

    // Disable if no redraws left
    if (mulliganRedraws <= 0) {
        el.classList.add('disabled');
    }

    return el;
}

/**
 * Troca uma carta durante o mulligan
 * @param {number} index - Índice da carta a trocar
 */
function redrawCard(index) {
    // Verificar se ainda pode trocar
    if (mulliganRedraws <= 0) {
        console.log("[Mulligan] Sem trocas restantes!");
        return;
    }

    // Verificar se o deck tem cartas
    if (playerDeck.length === 0) {
        console.log("[Mulligan] Deck vazio!");
        return;
    }

    const oldCard = mulliganHand[index];
    console.log(`[Mulligan] Trocando carta: ${oldCard.name}`);

    // 1. Devolver carta antiga ao deck
    const cardToReturn = { ...oldCard };
    delete cardToReturn.id;
    const originalCard = CARD_COLLECTION.find(c => oldCard.id.includes(c.id));
    if (originalCard) {
        playerDeck.push({ ...originalCard });
    } else {
        playerDeck.push(cardToReturn);
    }

    // 2. Embaralhar o deck
    playerDeck = shuffleArray(playerDeck);

    // 3. Comprar nova carta do topo
    const newCard = playerDeck.shift();
    const newCardWithId = {
        ...newCard,
        id: `p${index}_${newCard.id}`
    };

    // 4. Substituir na mão
    mulliganHand[index] = newCardWithId;

    // 5. Decrementar contador
    mulliganRedraws--;

    // 6. Atualizar UI
    const redrawCountEl = document.getElementById('redraw-count');
    if (redrawCountEl) {
        redrawCountEl.textContent = mulliganRedraws;
        if (mulliganRedraws <= 0) {
            redrawCountEl.classList.add('exhausted');
        }
    }

    // 7. Animar e re-renderizar a carta específica
    const container = document.getElementById('mulligan-cards');
    if (container) {
        const cardEl = container.querySelector(`[data-index="${index}"]`);
        if (cardEl) {
            cardEl.classList.add('swapping');

            setTimeout(() => {
                const newCardEl = createMulliganCardElement(newCardWithId, index);
                newCardEl.classList.add('swapped');
                cardEl.replaceWith(newCardEl);
            }, 250);
        }
    }

    // 8. Desabilitar todas as cartas se não houver mais trocas
    if (mulliganRedraws <= 0) {
        setTimeout(() => {
            const allCards = container.querySelectorAll('.mulligan-card');
            allCards.forEach(card => {
                if (!card.classList.contains('swapped')) {
                    card.classList.add('disabled');
                }
            });
        }, 300);
    }

    // 9. Tocar SFX
    try { audioManager.playSFX('card-slide'); } catch (e) { console.warn('SFX failed', e); }

    console.log(`[Mulligan] Nova carta: ${newCardWithId.name}. Trocas restantes: ${mulliganRedraws}`);
}

/**
 * Finaliza a fase de mulligan e inicia o jogo
 */
function finishMulligan() {
    console.log("[Mulligan] Finalizando fase de troca...");

    // 1. Esconder overlay
    const overlay = document.getElementById('mulligan-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }

    // 2. Renderizar mão final no rodapé
    renderHandFromCards(mulliganHand);

    // 3. Atualizar UI
    updateScore();
    updateEnemyHandUI();
    updateDeckCountUI();
    updateTurnVisuals();
    updateLeaderVisuals();

    // 4. Iniciar música de batalha
    try { audioManager.playMusic(); } catch (e) { console.warn('Music failed', e); }

    // 5. Tocar SFX de início
    try { audioManager.playSFX('switch'); } catch (e) { console.warn('SFX failed', e); }

    console.log("=== JOGO INICIADO ===");
}
