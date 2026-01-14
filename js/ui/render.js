// ============================================
// ===       RENDERIZAÇÃO DE ELEMENTOS     ===
// ============================================

/**
 * Renderiza a mão do jogador usando allCardsData
 */
function renderHand() {
    const handContainer = document.querySelector('.hand-cards');
    if (!handContainer) return;

    handContainer.innerHTML = '';

    allCardsData.forEach(card => {
        const cardElement = createCardElement(card);
        handContainer.appendChild(cardElement);
    });
}

/**
 * Renderiza a mão do jogador a partir de um array de cartas
 * @param {Array} cards - Array de objetos de carta
 */
function renderHandFromCards(cards) {
    const handContainer = document.querySelector('.hand-cards');
    if (!handContainer) return;

    handContainer.innerHTML = '';

    cards.forEach((card, index) => {
        const cardWithUniqueId = {
            ...card,
            id: `p${index}_${card.id}`
        };
        const cardElement = createCardElement(cardWithUniqueId);
        handContainer.appendChild(cardElement);
    });
}

/**
 * Atualiza o contador de cartas na mão do inimigo
 */
function updateEnemyHandUI() {
    const el = document.getElementById('enemy-hand-count');
    if (el) {
        el.textContent = enemyHand.length;
    }
}

/**
 * Atualiza o contador de cartas no deck do jogador
 */
function updateDeckCountUI() {
    const deckCountEl = document.getElementById('player-deck-count');
    if (deckCountEl) {
        deckCountEl.textContent = playerDeck.length;
    }
}

// ============================================
// ===       CRIAÇÃO DE ELEMENTOS DE CARTA ===
// ============================================

/**
 * Cria um elemento DOM para uma carta
 * @param {Object} card - Dados da carta
 * @returns {HTMLElement} Elemento da carta
 */
function createCardElement(card) {
    const el = document.createElement('div');
    el.classList.add('card');
    el.draggable = true;

    // Data attributes
    el.dataset.id = card.id;
    el.dataset.type = card.type;
    el.dataset.category = card.category || "unit";
    el.dataset.power = card.power;
    el.dataset.basePower = card.power;
    el.dataset.name = card.name;
    el.dataset.ability = card.ability || "none";
    el.dataset.isHero = card.isHero || "false";
    if (card.partner) el.dataset.partner = card.partner;
    if (card.row === 'all') el.dataset.agile = "true";

    // Classes especiais
    if (card.isHero) el.classList.add('hero-card');
    if (card.ability === 'spy' || card.ability === 'spy_medic') el.classList.add('spy-card');
    if (card.row === 'all') el.classList.add('agile-card');

    // Imagem de fundo do personagem
    if (card.img) {
        el.style.backgroundImage = `url('${card.img}')`;
        // Fallback para imagens que não existem (assets/ folder)
        if (card.img.startsWith('assets/')) {
            el.classList.add('missing-image');
        }
    }

    // Overlay escuro para legibilidade
    const overlay = document.createElement('div');
    overlay.classList.add('card-overlay');
    el.appendChild(overlay);

    // Badge de Força
    const strengthBadge = document.createElement('div');
    strengthBadge.classList.add('card-strength-badge');
    strengthBadge.textContent = card.power;
    el.appendChild(strengthBadge);

    // Container de informações
    const infoContainer = document.createElement('div');
    infoContainer.classList.add('card-info-container');

    // Nome da carta
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('card-name');
    nameDiv.textContent = card.name;
    infoContainer.appendChild(nameDiv);

    // Descrição/Habilidade
    const descDiv = document.createElement('div');
    descDiv.classList.add('card-desc');
    if (card.ability && card.ability !== 'none') {
        let descText = ABILITY_DESCRIPTIONS[card.ability] || '';
        if (card.ability === 'bond_partner' && card.partner) {
            descText = `Bond: ${card.partner}`;
        }
        descDiv.textContent = descText;
    } else {
        descDiv.textContent = card.type.charAt(0).toUpperCase() + card.type.slice(1);
    }
    infoContainer.appendChild(descDiv);

    el.appendChild(infoContainer);

    // Ícone da Fileira
    const rowIconImg = document.createElement('img');
    rowIconImg.classList.add('card-row-icon-img');

    let iconKey = card.type;
    if (card.row === 'all') {
        iconKey = 'agile';
    }
    rowIconImg.src = ROW_ICONS[iconKey] || ROW_ICONS['melee'];
    rowIconImg.alt = `Ícone ${iconKey}`;
    rowIconImg.draggable = false;
    el.appendChild(rowIconImg);

    // Drag Events
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragend', dragEnd);

    // Drop Events for Decoy Interaction
    el.addEventListener('dragover', function (e) {
        const draggingCard = document.querySelector('.dragging');
        if (!draggingCard) return;

        const isDecoy = draggingCard.dataset.ability === 'decoy';
        if (!isDecoy) return;

        const targetCard = e.currentTarget;

        const row = targetCard.closest('.row');
        if (!row || !row.classList.contains('player')) return;

        if (targetCard.dataset.isHero === "true") return;
        if (targetCard.dataset.ability === 'decoy') return;

        e.preventDefault();
        e.stopPropagation();
        targetCard.classList.add('valid-target');
    });

    el.addEventListener('dragleave', function (e) {
        e.currentTarget.classList.remove('valid-target');
    });

    el.addEventListener('drop', function (e) {
        const targetCard = e.currentTarget;
        targetCard.classList.remove('valid-target');

        const draggingCard = document.querySelector('.dragging');
        if (!draggingCard) return;

        const isDecoy = draggingCard.dataset.ability === 'decoy';
        if (!isDecoy) return;

        const row = targetCard.closest('.row');
        if (!row || !row.classList.contains('player')) return;
        if (targetCard.dataset.isHero === "true") return;
        if (targetCard.dataset.ability === 'decoy') return;

        e.preventDefault();
        e.stopPropagation();

        console.log(`Decoy (Manual) ativado! Trocando com: ${targetCard.dataset.name}`);

        // 1. Return Target to Hand
        const returnedCardObj = {
            id: targetCard.dataset.id,
            name: targetCard.dataset.name,
            type: targetCard.dataset.type,
            power: parseInt(targetCard.dataset.basePower),
            ability: targetCard.dataset.ability,
            isHero: targetCard.dataset.isHero === "true",
            partner: targetCard.dataset.partner,
            row: targetCard.dataset.row
        };

        const handContainer = document.querySelector('.hand-cards');
        if (handContainer) {
            const newHandCard = createCardElement(returnedCardObj);
            handContainer.appendChild(newHandCard);
        }

        // 2. Place Decoy in Target's Spot
        const parent = targetCard.parentNode;
        parent.insertBefore(draggingCard, targetCard);
        targetCard.remove();

        // 3. Finalize Decoy State
        draggingCard.draggable = false;
        draggingCard.classList.remove('dragging');

        // 4. Update Game State
        updateScore();

        try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }

        // 5. Trigger Enemy Turn
        if (!enemyPassed) {
            isProcessingTurn = true;
            updateTurnVisuals();
            setTimeout(() => {
                enemyTurn();
                isProcessingTurn = false;
                updateTurnVisuals();
            }, 1500);
        }
    });

    return el;
}

// Deprecated functions (logic moved inline)
function cardDragOver(e) { }
function cardDragLeave(e) { }
function cardDrop(e) { }
