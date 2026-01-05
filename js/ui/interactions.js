// ============================================
// ===       DRAG AND DROP                 ===
// ============================================

/**
 * Inicia o arrastar de uma carta
 * @param {DragEvent} e - Evento de drag
 */
function dragStart(e) {
    if (playerPassed || isProcessingTurn) {
        e.preventDefault();
        return;
    }

    // Decoy Validation: Check if there are valid targets
    if (e.target.dataset.ability === 'decoy') {
        const playerRows = document.querySelectorAll('.row.player .cards-container');
        let hasTarget = false;

        playerRows.forEach(container => {
            const cards = Array.from(container.querySelectorAll('.card'));
            cards.forEach(c => {
                if (c.dataset.isHero !== "true" && c.dataset.ability !== "decoy") {
                    hasTarget = true;
                }
            });
        });

        if (!hasTarget) {
            e.preventDefault();
            alert("Não há unidades para recolher!");
            return;
        }
    }

    // Store card ID and Type in dataTransfer
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.dataTransfer.setData('card-type', e.target.dataset.type);

    // Visual feedback
    e.target.classList.add('dragging');
}

/**
 * Finaliza o arrastar de uma carta
 * @param {DragEvent} e - Evento de drag
 */
function dragEnd(e) {
    e.target.classList.remove('dragging');
}

/**
 * Configura os eventos de drag and drop nas fileiras
 */
function setupDragAndDrop() {
    const playerRows = document.querySelectorAll('.row.player');

    playerRows.forEach(row => {
        row.addEventListener('dragover', dragOver);
        row.addEventListener('dragleave', dragLeave);
        row.addEventListener('drop', drop);
    });
}

/**
 * Evento de arrastar sobre uma fileira
 * @param {DragEvent} e - Evento de drag
 */
function dragOver(e) {
    e.preventDefault();
    if (playerPassed) return;
    const row = e.currentTarget;
    row.classList.add('drag-over');
}

/**
 * Evento de sair de uma fileira arrastando
 * @param {DragEvent} e - Evento de drag
 */
function dragLeave(e) {
    const row = e.currentTarget;
    row.classList.remove('drag-over');
}

/**
 * Evento de soltar uma carta em uma fileira
 * @param {DragEvent} e - Evento de drop
 */
function drop(e) {
    e.preventDefault();
    const row = e.currentTarget;
    row.classList.remove('drag-over');

    if (playerPassed || isProcessingTurn) return;

    // Debug
    const dbg_cardId = e.dataTransfer.getData('text/plain');
    const dbg_cardType = e.dataTransfer.getData('card-type');
    console.debug('[DEBUG drop] card dropped:', { id: dbg_cardId, type: dbg_cardType, row: row.dataset.type });

    // Retrieve data
    const cardId = e.dataTransfer.getData('text/plain');
    const cardType = e.dataTransfer.getData('card-type');
    const rowType = row.dataset.type;

    const card = document.querySelector(`.card[data-id="${cardId}"]`);
    if (!card) return;

    const isAgile = card.dataset.agile === 'true';

    // Validation: Card Type must match Row Type OR Card is Weather OR Card is Agile
    if (cardType === 'weather' || cardType === rowType || isAgile) {
        if (card) {
            // Decoy Check: Cannot be dropped on row (must target a card)
            if (card.dataset.ability === 'decoy') {
                console.log("Espantalho jogado no vazio. Ação cancelada.");
                return;
            }

            if (cardType === 'weather') {
                // Trigger Ability
                triggerAbility(card, row);

                // Move to graveyard
                const cardObj = {
                    id: card.dataset.id,
                    name: card.dataset.name,
                    type: card.dataset.type,
                    power: parseInt(card.dataset.basePower),
                    ability: card.dataset.ability,
                    isHero: card.dataset.isHero === "true"
                };
                playerGraveyard.push(cardObj);

                card.remove();
                updateScore();

                try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }

                // Trigger Enemy Turn
                if (!enemyPassed) {
                    isProcessingTurn = true;
                    updateTurnVisuals();
                    setTimeout(() => {
                        enemyTurn();
                        isProcessingTurn = false;
                        updateTurnVisuals();
                    }, 1500);
                }
            } else {
                // Move card to the row's card container
                const cardsContainer = row.querySelector('.cards-container');
                cardsContainer.appendChild(card);

                // Disable drag for played card
                card.draggable = false;
                card.classList.remove('dragging');

                // Trigger Ability
                triggerAbility(card, row);

                // Update Score
                updateScore();

                try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }

                // Handle Special Cards (Spells) - Remove after use
                if (card.dataset.kind === 'special') {
                    setTimeout(() => {
                        const cardObj = {
                            id: card.dataset.id,
                            name: card.dataset.name,
                            type: card.dataset.type,
                            kind: card.dataset.kind,
                            power: parseInt(card.dataset.basePower),
                            ability: card.dataset.ability,
                            isHero: card.dataset.isHero === "true"
                        };
                        playerGraveyard.push(cardObj);
                        card.remove();
                        updateScore();
                    }, 1000);
                }

                // Trigger Enemy Turn
                if (!enemyPassed) {
                    isProcessingTurn = true;
                    updateTurnVisuals();
                    setTimeout(() => {
                        enemyTurn();
                        isProcessingTurn = false;
                        updateTurnVisuals();
                    }, 1500);
                }
            }
        }
    } else {
        console.log(`Jogada Inválida: Carta ${cardType} não pode ir na fileira ${rowType}.`);
    }
}
