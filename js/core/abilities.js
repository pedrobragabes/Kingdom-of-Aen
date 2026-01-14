// ============================================
// ===       HABILIDADES DAS CARTAS        ===
// ============================================

/**
 * Dispara a habilidade de uma carta
 * @param {HTMLElement} cardElement - Elemento da carta
 * @param {HTMLElement} rowElement - Elemento da fileira
 */
function triggerAbility(cardElement, rowElement) {
    const ability = cardElement.dataset.ability;
    const name = cardElement.dataset.name;
    const basePower = parseInt(cardElement.dataset.basePower);

    switch (ability) {
        case 'tight_bond':
            applyTightBond(rowElement, name, basePower);
            break;
        case 'spy':
            applySpy(cardElement, rowElement);
            break;
        case 'spy_medic':
            applySpy(cardElement, rowElement);
            applyMedic(cardElement, rowElement);
            break;
        case 'scorch':
            applyScorch(cardElement, rowElement);
            break;
        case 'medic':
            applyMedic(cardElement, rowElement);
            break;
        case 'weather_frost':
            applyWeather('frost');
            break;
        case 'weather_fog':
            applyWeather('fog');
            break;
        case 'weather_rain':
            applyWeather('rain');
            break;
        case 'weather_clear':
            clearWeather();
            break;
        case 'decoy':
            // Decoy logic is now handled via manual drop on target card
            break;
        default:
            break;
    }
}

// ============================================
// ===       CLIMA                         ===
// ============================================

/**
 * Aplica um efeito de clima
 * @param {string} type - Tipo de clima (frost, fog, rain)
 */
function applyWeather(type) {
    activeWeather[type] = true;
    console.log(`Clima ativado: ${type}`);
    updateWeatherVisuals();
    updateScore();
}

/**
 * Limpa todos os efeitos de clima
 */
function clearWeather() {
    activeWeather = { frost: false, fog: false, rain: false };
    console.log("Clima limpo!");
    updateWeatherVisuals();
    updateScore();
}

/**
 * Atualiza os visuais de clima nas fileiras
 */
function updateWeatherVisuals() {
    // Remove old classes
    document.querySelectorAll('.row').forEach(row => {
        row.classList.remove('weather-active-frost', 'weather-active-fog', 'weather-active-rain');
    });

    // Apply new classes
    if (activeWeather.frost) {
        document.querySelectorAll('.row.melee').forEach(row => row.classList.add('weather-active-frost'));
    }
    if (activeWeather.fog) {
        document.querySelectorAll('.row.ranged').forEach(row => row.classList.add('weather-active-fog'));
    }
    if (activeWeather.rain) {
        document.querySelectorAll('.row.siege').forEach(row => row.classList.add('weather-active-rain'));
    }
}

// ============================================
// ===       MÉDICO                        ===
// ============================================

/**
 * Aplica a habilidade de médico - revive uma carta do cemitério
 * @param {HTMLElement} cardElement - Elemento da carta médico
 * @param {HTMLElement} currentRow - Fileira atual
 */
function applyMedic(cardElement, currentRow) {
    const isPlayerSide = currentRow.classList.contains('player');
    const graveyard = isPlayerSide ? playerGraveyard : enemyGraveyard;

    if (graveyard.length === 0) {
        console.log("Nenhuma carta no cemitério para reviver.");
        return;
    }

    // Find the last non-hero card to revive (LIFO)
    let cardIndex = -1;
    for (let i = graveyard.length - 1; i >= 0; i--) {
        if (!graveyard[i].isHero) {
            cardIndex = i;
            break;
        }
    }

    if (cardIndex === -1) {
        console.log("Nenhuma carta válida (não-herói) para reviver.");
        return;
    }

    const cardToRevive = graveyard.splice(cardIndex, 1)[0];

    console.log(`Médico ativado! Revivendo: ${cardToRevive.name}`);

    // Determine where to play the revived card
    const sideClass = isPlayerSide ? 'player' : 'opponent';
    const targetRowSelector = `.row.${sideClass}[data-type="${cardToRevive.type}"] .cards-container`;
    const targetContainer = document.querySelector(targetRowSelector);

    if (targetContainer) {
        const newCardElement = createCardElement(cardToRevive);
        newCardElement.draggable = false;
        targetContainer.appendChild(newCardElement);

        // Trigger Ability of the revived card! (Chain Reaction)
        setTimeout(() => {
            triggerAbility(newCardElement, targetContainer.closest('.row'));
            updateScore();
        }, 300);
    }
}

// ============================================
// ===       ESPANTALHO (DECOY)            ===
// ============================================
// NOTA: A lógica do Espantalho foi movida para render.js (drop event nas cartas)

// ============================================
// ===       VÍNCULO (TIGHT BOND)          ===
// ============================================
// NOTA: A lógica do Tight Bond foi movida para engine.js (updateScore)

// ============================================
// ===       ESPIÃO                        ===
// ============================================

/**
 * Aplica a habilidade de espião - move carta para o lado oposto e compra cartas
 * @param {HTMLElement} cardElement - Elemento da carta espião
 * @param {HTMLElement} currentRow - Fileira atual
 */
function applySpy(cardElement, currentRow) {
    const cardType = cardElement.dataset.type;
    const isPlayerSide = currentRow.classList.contains('player');

    // Determine target side (Opposite of current)
    const targetSideClass = isPlayerSide ? 'opponent' : 'player';

    // Find the corresponding row on the other side
    const targetRowSelector = `.row.${targetSideClass}[data-type="${cardType}"] .cards-container`;
    const targetContainer = document.querySelector(targetRowSelector);

    if (targetContainer) {
        // Move the card to the opponent's field
        targetContainer.appendChild(cardElement);

        // Visual feedback for Spy
        cardElement.classList.add('spy-card');

        console.log(`Espião ativado! Carta movida para ${targetSideClass}.`);

        // Draw 1 card for the person who played the spy
        if (isPlayerSide) {
            drawCard('player', 1);
        } else {
            drawCard('opponent', 1);
        }
    }
}

// ============================================
// ===       COMPRAR CARTAS                ===
// ============================================

/**
 * Compra cartas do deck
 * @param {string} who - 'player' ou 'opponent'
 * @param {number} count - Quantidade de cartas a comprar
 */
function drawCard(who, count) {
    for (let i = 0; i < count; i++) {
        if (who === 'player') {
            if (playerDeck.length > 0) {
                const drawnCard = playerDeck.shift();
                const newCard = { ...drawnCard, id: `p_draw_${Date.now()}_${i}_${drawnCard.id}` };
                const handContainer = document.querySelector('.hand-cards');
                if (handContainer) {
                    handContainer.appendChild(createCardElement(newCard));
                }
                updateDeckCountUI();
            } else {
                console.log("[Draw] Deck do jogador vazio!");
            }
        } else {
            if (enemyDeck.length > 0) {
                const drawnCard = enemyDeck.shift();
                enemyHand.push({ ...drawnCard, id: `e_draw_${Date.now()}_${i}_${drawnCard.id}` });
                updateEnemyHandUI();
            } else {
                console.log("[Draw] Deck do inimigo vazio!");
            }
        }
    }
    console.log(`${who} comprou ${count} cartas.`);
}

// ============================================
// ===       QUEIMAR (SCORCH)              ===
// ============================================

/**
 * Aplica a habilidade de queimar - destrói as cartas mais fortes
 * @param {HTMLElement} cardElement - Elemento da carta scorch
 * @param {HTMLElement} currentRow - Fileira atual
 */
function applyScorch(cardElement, currentRow) {
    const cardType = cardElement.dataset.type;
    const isPlayerSide = currentRow.classList.contains('player');
    const targetSideClass = isPlayerSide ? 'opponent' : 'player';

    // Target the corresponding enemy row
    const targetRowSelector = `.row.${targetSideClass}[data-type="${cardType}"] .cards-container`;
    const targetContainer = document.querySelector(targetRowSelector);

    if (!targetContainer) return;

    const enemyCards = Array.from(targetContainer.querySelectorAll('.card'));
    if (enemyCards.length === 0) return;

    // Filter out Heroes (Immune to Scorch)
    const vulnerableCards = enemyCards.filter(card => card.dataset.isHero !== "true");

    if (vulnerableCards.length === 0) {
        console.log("Scorch falhou: Apenas heróis na fileira.");
        return;
    }

    // Find Max Power among vulnerable cards
    let maxPower = -1;
    vulnerableCards.forEach(card => {
        const power = parseInt(card.dataset.power);
        if (power > maxPower) {
            maxPower = power;
        }
    });

    // Identify targets
    const targets = vulnerableCards.filter(card => parseInt(card.dataset.power) === maxPower);

    if (targets.length > 0) {
        console.log(`Scorch ativado! Destruindo ${targets.length} cartas com força ${maxPower}.`);

        targets.forEach(card => {
            card.classList.add('burning');
            setTimeout(() => {
                // Add to graveyard before removing
                const cardObj = {
                    id: card.dataset.id,
                    name: card.dataset.name,
                    type: card.dataset.type,
                    power: parseInt(card.dataset.basePower),
                    ability: card.dataset.ability,
                    isHero: card.dataset.isHero === "true"
                };

                if (card.closest('.opponent-side')) {
                    enemyGraveyard.push(cardObj);
                } else {
                    playerGraveyard.push(cardObj);
                }

                if (card.parentNode) {
                    card.parentNode.removeChild(card);
                }
                updateScore();
            }, 800);
        });
    }
}
