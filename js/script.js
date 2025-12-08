// cardDatabase is now loaded from cards.js as allCardsData

// Game State
let activeWeather = { frost: false, fog: false, rain: false };
let enemyHand = [];
let playerPassed = false;
let enemyPassed = false;
let isProcessingTurn = false;
let playerWins = 0;
let enemyWins = 0;
let playerGraveyard = [];
let enemyGraveyard = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupDragAndDrop();
    setupControls();
});

function initializeGame() {
    renderHand();
    // Initialize Enemy Hand with random cards from DB (simulating a deck)
    enemyHand = []; // Reset to ensure clean start
    for (let i = 0; i < 10; i++) { 
        const randomCard = allCardsData[Math.floor(Math.random() * allCardsData.length)];
        // Clone object to avoid reference issues if we modify it later
        enemyHand.push({ ...randomCard, id: `e${i}_${randomCard.id}` });
    }
    
    updateScore();
    updateEnemyHandUI();
    updateTurnVisuals();
}

function updateEnemyHandUI() {
    const el = document.getElementById('enemy-hand-count');
    if (el) {
        el.textContent = enemyHand.length;
    }
}

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

            // If player passes, enemy plays until they win or pass
            if (!enemyPassed) {
                enemyTurnLoop();
            } else {
                checkEndRound();
            }
        });
    }
}

function renderHand() {
    const handContainer = document.querySelector('.hand-cards');
    if (!handContainer) return;

    handContainer.innerHTML = ''; // Clear existing content

    allCardsData.forEach(card => {
        const cardElement = createCardElement(card);
        handContainer.appendChild(cardElement);
    });
}

function createCardElement(card) {
    const el = document.createElement('div');
    el.classList.add('card');
    el.draggable = true; // Enable native drag
    el.dataset.id = card.id;
    el.dataset.type = card.type;
    el.dataset.kind = card.kind || "unit"; // Default to unit
    el.dataset.power = card.power; // Current power
    el.dataset.basePower = card.power; // Original power for resets/calculations
    el.dataset.name = card.name;
    el.dataset.ability = card.ability || "none";
    el.dataset.isHero = card.isHero || "false";
    if (card.partner) el.dataset.partner = card.partner;
    if (card.row) el.dataset.row = card.row;

    if (card.isHero) {
        el.classList.add('hero-card');
    }

    // Power Badge
    const power = document.createElement('div');
    power.classList.add('card-power');
    power.textContent = card.power;
    el.appendChild(power);

    // Image Placeholder
    const img = document.createElement('div');
    img.classList.add('card-img');
    // img.style.backgroundImage = `url(${card.img})`; 
    el.appendChild(img);

    // Name
    const name = document.createElement('div');
    name.classList.add('card-name');
    name.textContent = card.name;
    el.appendChild(name);

    // Ability Icon (Optional visual indicator)
    if (card.ability && card.ability !== "none") {
        const abilityIcon = document.createElement('div');
        abilityIcon.classList.add('card-ability-icon');
        if (card.ability === 'spy' || card.ability === 'spy_medic') {
            abilityIcon.textContent = "👁️"; // Eye for Spy
        } else if (card.ability === 'scorch') {
            abilityIcon.textContent = "🔥"; // Fire for Scorch
        } else if (card.ability === 'medic') {
            abilityIcon.textContent = "⚕️"; // Medical symbol
        } else if (card.ability === 'bond_partner') {
            abilityIcon.textContent = "🤝"; // Handshake for Bond
        } else if (card.ability === 'decoy') {
            abilityIcon.textContent = "🔄"; // Arrows for Decoy
        } else {
            abilityIcon.textContent = "★"; // Star for others
        }
        el.appendChild(abilityIcon);
    }

    // Drag Events
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragend', dragEnd);

    // Drop Events for Decoy Interaction (Only if it's on the board)
    // We add these to ALL cards, but logic inside will filter
    el.addEventListener('dragover', cardDragOver);
    el.addEventListener('dragleave', cardDragLeave);
    el.addEventListener('drop', cardDrop);

    return el;
}

// --- Card Drop Logic (for Decoy) ---

function cardDragOver(e) {
    // Only allow if dragging a Decoy
    // We need to know what is being dragged. 
    // Since dataTransfer data is not available in dragover (security),
    // we rely on a global state or class check if possible, OR we just allow it and check in drop.
    // However, to show visual feedback (valid-target), we need to know.
    // A common trick is to check a global variable set on dragStart.
    
    const draggingCard = document.querySelector('.dragging');
    if (!draggingCard) return;

    const isDecoy = draggingCard.dataset.ability === 'decoy';
    if (!isDecoy) return;

    const targetCard = e.currentTarget;
    
    // Validate Target:
    // 1. Must be on Player Side (we can check parent row class)
    const row = targetCard.closest('.row');
    if (!row || !row.classList.contains('player')) return;

    // 2. Must NOT be Hero
    if (targetCard.dataset.isHero === "true") return;

    // 3. Must NOT be another Decoy
    if (targetCard.dataset.ability === 'decoy') return;

    // Valid Target!
    e.preventDefault(); // Allow drop
    e.stopPropagation(); // Stop bubbling to row
    targetCard.classList.add('valid-target');
}

function cardDragLeave(e) {
    e.currentTarget.classList.remove('valid-target');
}

function cardDrop(e) {
    const targetCard = e.currentTarget;
    targetCard.classList.remove('valid-target');

    const draggingCard = document.querySelector('.dragging');
    if (!draggingCard) return;

    const isDecoy = draggingCard.dataset.ability === 'decoy';
    if (!isDecoy) return;

    // Validate Target again (security)
    const row = targetCard.closest('.row');
    if (!row || !row.classList.contains('player')) return;
    if (targetCard.dataset.isHero === "true") return;
    if (targetCard.dataset.ability === 'decoy') return;

    e.preventDefault();
    e.stopPropagation(); // CRITICAL: Stop row drop handler

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
    // We want to insert the decoy exactly where the target is.
    // Since draggingCard is currently in the hand (or source), we move it.
    
    // Remove target from DOM
    const parent = targetCard.parentNode;
    parent.insertBefore(draggingCard, targetCard);
    targetCard.remove();

    // 3. Finalize Decoy State
    draggingCard.draggable = false;
    draggingCard.classList.remove('dragging');
    
    // 4. Update Game State
    updateScore();

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
}

// --- Ability Logic ---

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
        // Future abilities can be added here
        default:
            break;
    }
}

function applyWeather(type) {
    activeWeather[type] = true;
    console.log(`Clima ativado: ${type}`);
    updateWeatherVisuals();
    updateScore();
}

function clearWeather() {
    activeWeather = { frost: false, fog: false, rain: false };
    console.log("Clima limpo!");
    updateWeatherVisuals();
    updateScore();
}

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
    // It goes to the row matching its type on the same side
    const sideClass = isPlayerSide ? 'player' : 'opponent';
    const targetRowSelector = `.row.${sideClass}[data-type="${cardToRevive.type}"] .cards-container`;
    const targetContainer = document.querySelector(targetRowSelector);

    if (targetContainer) {
        const newCardElement = createCardElement(cardToRevive);
        
        // If it's enemy side, ensure it's not draggable
        if (!isPlayerSide) {
            newCardElement.draggable = false;
        } else {
            // If player revived it, it should be locked in place (played), not draggable back to hand
            newCardElement.draggable = false; 
        }

        targetContainer.appendChild(newCardElement);
        
        // Trigger Ability of the revived card! (Chain Reaction)
        // Use setTimeout to allow DOM to update and visual effect to be distinct
        setTimeout(() => {
            triggerAbility(newCardElement, targetContainer.closest('.row'));
            updateScore();
        }, 300);
    }
}

function applyDecoy(cardElement, currentRow) {
    // Deprecated: Logic moved to manual drop on card
}

function applyTightBond(row, name, basePower) {
    // Deprecated: Logic moved to updateScore() to handle dynamic weather changes
    // Keeping function signature to avoid breaking calls, but it does nothing now.
}

function applySpy(cardElement, currentRow) {
    const cardType = cardElement.dataset.type;
    const isPlayerSide = currentRow.classList.contains('player');
    
    // Determine target side (Opposite of current)
    const targetSideClass = isPlayerSide ? 'opponent' : 'player';
    
    // Find the corresponding row on the other side
    // Selector looks for .row.{targetSide}.{cardType} .cards-container
    const targetRowSelector = `.row.${targetSideClass}[data-type="${cardType}"] .cards-container`;
    const targetContainer = document.querySelector(targetRowSelector);

    if (targetContainer) {
        // Move the card to the opponent's field
        targetContainer.appendChild(cardElement);
        
        // Visual feedback for Spy (maybe an eye icon or color change)
        cardElement.classList.add('spy-card');
        
        console.log(`Espião ativado! Carta movida para ${targetSideClass}.`);

        // Draw 1 card for the person who played the spy (Nerfed from 2)
        if (isPlayerSide) {
            drawCard('player', 1);
        } else {
            drawCard('opponent', 1);
        }
    }
}

function drawCard(who, count) {
    for (let i = 0; i < count; i++) {
        if (who === 'player') {
            const randomCard = allCardsData[Math.floor(Math.random() * allCardsData.length)];
            const newCard = { ...randomCard, id: `p_draw_${Date.now()}_${i}_${randomCard.id}` };
            const handContainer = document.querySelector('.hand-cards');
            if (handContainer) {
                handContainer.appendChild(createCardElement(newCard));
            }
        } else {
            // Add to enemy hand array
            const randomCard = allCardsData[Math.floor(Math.random() * allCardsData.length)];
            enemyHand.push({ ...randomCard, id: `e_draw_${Date.now()}_${i}_${randomCard.id}` });
            updateEnemyHandUI();
        }
    }
    console.log(`${who} comprou ${count} cartas.`);
}

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

    // Identify targets (only if maxPower > 0)
    const targets = vulnerableCards.filter(card => parseInt(card.dataset.power) === maxPower);

    if (targets.length > 0) {
        console.log(`Scorch ativado! Destruindo ${targets.length} cartas com força ${maxPower}.`);
        
        targets.forEach(card => {
            card.classList.add('burning'); // Use new animation class
            // Remove after animation (0.8s defined in CSS)
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
            }, 800); // Wait for animation
        });
    }
}

// --- Game Logic ---

function updateScore() {
    let totalPlayer = 0;
    let totalOpponent = 0;

    const allRows = document.querySelectorAll('.row');
    
    allRows.forEach(row => {
        const rowType = row.dataset.type;
        const cards = Array.from(row.querySelectorAll('.card'));
        
        // 1. Check Weather
        let isWeathered = false;
        if (rowType === 'melee' && activeWeather.frost) isWeathered = true;
        if (rowType === 'ranged' && activeWeather.fog) isWeathered = true;
        if (rowType === 'siege' && activeWeather.rain) isWeathered = true;

        // 2. Check Tight Bonds
        // Count occurrences of each name
        const nameCounts = {};
        cards.forEach(card => {
            const name = card.dataset.name;
            nameCounts[name] = (nameCounts[name] || 0) + 1;
        });

        let rowScore = 0;

        cards.forEach(card => {
            let power = parseInt(card.dataset.basePower);
            const name = card.dataset.name;
            const ability = card.dataset.ability;
            const isHero = card.dataset.isHero === "true";

            // Apply Weather (Heroes are immune)
            if (isWeathered && !isHero) {
                power = 1;
            }

            // Apply Tight Bond
            // Only if the card HAS the tight_bond ability AND there are others
            // Heroes usually don't bond, but if they did, they might be immune to buffs too?
            // Classic Gwent: Heroes don't get buffed by Horns/Bonds.
            // Let's assume Heroes are immune to ALL modifications (positive or negative).
            if (!isHero && ability === 'tight_bond' && nameCounts[name] > 1) {
                power *= 2;
            }

            // Apply Bond Partner
            const partner = card.dataset.partner;
            if (!isHero && ability === 'bond_partner' && partner) {
                 if (nameCounts[partner] && nameCounts[partner] > 0) {
                    power *= 2;
                }
            }

            // Update Visuals
            const badge = card.querySelector('.card-power');
            badge.textContent = power;
            if (power > parseInt(card.dataset.basePower)) {
                badge.classList.add('buffed');
                badge.classList.remove('nerfed');
            } else if (power < parseInt(card.dataset.basePower)) {
                badge.classList.add('nerfed');
                badge.classList.remove('buffed');
            } else {
                badge.classList.remove('buffed', 'nerfed');
            }
            
            // Update dataset for other logic (like Scorch) to use current power
            card.dataset.power = power;

            rowScore += power;
        });

        row.querySelector('.row-score').textContent = rowScore;

        if (row.classList.contains('player')) {
            totalPlayer += rowScore;
        } else {
            totalOpponent += rowScore;
        }
    });

    // Update Totals
    document.getElementById('score-total-player').textContent = totalPlayer;
    document.getElementById('score-total-opponent').textContent = totalOpponent;

    return { totalPlayer, totalOpponent };
}

function enemyTurn() {
    if (enemyPassed) return;

    const scores = updateScore();
    
    // --- AI LOGIC ---

    // 1. Check if hand is empty
    if (enemyHand.length === 0) {
        console.log("Inimigo sem cartas. Forçando passar.");
        passTurn('opponent');
        return;
    }

    // 2. Strategic Pass: If Player passed AND Enemy is winning
    if (playerPassed && scores.totalOpponent > scores.totalPlayer) {
        console.log("Inimigo está ganhando e jogador passou. Inimigo passa para economizar.");
        passTurn('opponent');
        return;
    }

    // 3. Evaluate Hand and Assign Priorities
    let bestCardIndex = -1;
    let maxPriority = -1;
    let bestTargetForDecoy = null;

    enemyHand.forEach((card, index) => {
        let priority = 0;
        let decoyTarget = null;

        // --- Heuristics ---

        // A. Spies (High Priority if losing or early game)
        if (card.ability === 'spy' || card.ability === 'spy_medic') {
            if (scores.totalOpponent < scores.totalPlayer) {
                priority += 50; // Desperate for cards/advantage
            } else {
                priority += 20; // Good to play early
            }
        }

        // B. Medics (High Priority if graveyard has strong units)
        else if (card.ability === 'medic' || card.ability === 'spy_medic') {
            // Check graveyard for non-hero units
            const validTargets = enemyGraveyard.filter(c => !c.isHero);
            if (validTargets.length > 0) {
                // Find max power in graveyard
                const maxGravePower = Math.max(...validTargets.map(c => c.power));
                priority += 10 + maxGravePower; // Base 10 + Power of revived unit
            } else {
                priority = 1; // Very low priority if nothing to revive
            }
        }

        // C. Bond Partners (High Priority if partner is on board)
        else if (card.ability === 'bond_partner' && card.partner) {
            // Check if partner is on board (Opponent side)
            const partnerName = card.partner;
            // We need to check all opponent rows
            const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
            let partnerFound = false;
            opponentRows.forEach(container => {
                if (container.querySelector(`.card[data-name="${partnerName}"]`)) {
                    partnerFound = true;
                }
            });

            if (partnerFound) {
                priority += 40; // Huge priority for combo
            } else {
                priority += card.power; // Normal priority based on power
            }
        }

        // D. Decoy (Strategic Swap)
        else if (card.ability === 'decoy') {
            // Look for targets on Opponent side
            const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
            let bestTarget = null;
            let maxTargetValue = -1;

            opponentRows.forEach(container => {
                const cards = Array.from(container.querySelectorAll('.card'));
                cards.forEach(c => {
                    if (c.dataset.isHero === "true" || c.dataset.ability === 'decoy') return;
                    
                    const currentPower = parseInt(c.dataset.power);
                    const basePower = parseInt(c.dataset.basePower);
                    
                    // Value 1: Save high base power unit (to replay later)
                    // Value 2: Save weakened unit (current < base) to reset it
                    // Value 3: Save Medic/Spy to reuse ability? (Advanced)
                    
                    let value = 0;
                    if (currentPower < basePower) {
                        value += (basePower - currentPower) * 2; // Heal value
                    }
                    value += basePower; // Save value

                    if (value > maxTargetValue) {
                        maxTargetValue = value;
                        bestTarget = c;
                    }
                });
            });

            if (bestTarget && maxTargetValue > 5) { // Threshold to make it worth it
                priority += 15 + maxTargetValue;
                decoyTarget = bestTarget;
            } else {
                priority = 0; // Don't play decoy if no good target
            }
        }

        // E. Standard Units / Weather / Scorch
        else {
            priority += card.power;
            
            // Scorch logic could be added here (check if it kills enemy units)
            if (card.ability === 'scorch') {
                // Simple check: does player have high cards?
                // For now, treat as high power card
                priority += 5; 
            }
        }

        // Update Best Card
        if (priority > maxPriority) {
            maxPriority = priority;
            bestCardIndex = index;
            bestTargetForDecoy = decoyTarget;
        }
    });

    // 4. Execute Play
    if (bestCardIndex === -1 || maxPriority === 0) {
        // No good moves? Pass or play random low value?
        // If we have cards but priority is 0 (e.g. only Decoy with no target), we might be forced to pass or burn a card.
        // Let's try to play the lowest power card if we can't find a "good" move, or pass if we are winning.
        if (scores.totalOpponent > scores.totalPlayer) {
            console.log("IA: Sem boas jogadas e ganhando. Passar.");
            passTurn('opponent');
            return;
        } else {
            // Play random (fallback) to avoid getting stuck
            console.log("IA: Sem jogadas prioritárias. Jogando aleatório.");
            bestCardIndex = Math.floor(Math.random() * enemyHand.length);
        }
    }

    const cardToPlay = enemyHand[bestCardIndex];
    
    // Remove from hand
    enemyHand.splice(bestCardIndex, 1);
    updateEnemyHandUI();

    // Handle Decoy Special Case
    if (cardToPlay.ability === 'decoy' && bestTargetForDecoy) {
        console.log(`IA jogou Decoy em ${bestTargetForDecoy.dataset.name}`);
        
        // 1. Return Target to Enemy Hand (Logic only, no UI needed for enemy hand really, but we update array)
        const returnedCardObj = {
            id: bestTargetForDecoy.dataset.id,
            name: bestTargetForDecoy.dataset.name,
            type: bestTargetForDecoy.dataset.type,
            power: parseInt(bestTargetForDecoy.dataset.basePower),
            ability: bestTargetForDecoy.dataset.ability,
            isHero: bestTargetForDecoy.dataset.isHero === "true",
            partner: bestTargetForDecoy.dataset.partner,
            row: bestTargetForDecoy.dataset.row
        };
        enemyHand.push(returnedCardObj);
        updateEnemyHandUI();

        // 2. Replace on Board
        const decoyElement = createCardElement(cardToPlay);
        decoyElement.draggable = false;
        
        const parent = bestTargetForDecoy.parentNode;
        parent.insertBefore(decoyElement, bestTargetForDecoy);
        bestTargetForDecoy.remove();
        
        updateScore();
        return;
    }

    // Standard Play Logic
    let targetRow = null;
    if (cardToPlay.type === 'weather') {
        targetRow = document.querySelector('.row.opponent'); 
    } else {
        // Handle Agile (row: 'all') for AI - Prefer Melee for now or random?
        // Let's default to Melee for Agile units if type is generic, or use their default type
        let type = cardToPlay.type;
        if (cardToPlay.row === 'all') {
            type = 'melee'; // AI default preference
        }
        targetRow = document.querySelector(`.row.opponent[data-type="${type}"] .cards-container`);
    }

    if (targetRow) {
        const cardElement = createCardElement(cardToPlay);
        
        if (cardToPlay.type === 'weather') {
             triggerAbility(cardElement, targetRow);
             enemyGraveyard.push(cardToPlay);
             console.log(`Inimigo jogou Clima: ${cardToPlay.name}`);
        } else {
            cardElement.draggable = false;
            targetRow.appendChild(cardElement);
            triggerAbility(cardElement, targetRow);
            console.log(`Inimigo jogou: ${cardToPlay.name}`);
        }
    }

    updateScore();
}

function passTurn(who) {
    if (who === 'opponent') {
        enemyPassed = true;
        document.querySelector('.opponent-side').classList.add('passed');
        updateTurnVisuals();
        checkEndRound();
    }
}

function updateTurnVisuals() {
    const playerSide = document.querySelector('.player-side');
    const opponentSide = document.querySelector('.opponent-side');
    
    if (!playerSide || !opponentSide) return;

    playerSide.classList.remove('active-turn');
    opponentSide.classList.remove('active-turn');

    if (isProcessingTurn && !enemyPassed) {
        opponentSide.classList.add('active-turn');
    } else if (!playerPassed) {
        playerSide.classList.add('active-turn');
    }
}

function enemyTurnLoop() {
    if (enemyPassed) return;

    isProcessingTurn = true;
    updateTurnVisuals();

    setTimeout(() => {
        enemyTurn();
        if (!enemyPassed && playerPassed) {
            enemyTurnLoop(); // Continue playing if player passed
        } else {
            isProcessingTurn = false;
            updateTurnVisuals();
        }
    }, 1500);
}

function checkEndRound() {
    if (playerPassed && enemyPassed) {
        const scores = updateScore();
        setTimeout(() => {
            let winner = "";
            if (scores.totalPlayer > scores.totalOpponent) {
                winner = "player";
            } else if (scores.totalOpponent > scores.totalPlayer) {
                winner = "opponent";
            } else {
                winner = "draw";
            }
            endRound(winner);
        }, 500);
    }
}

function endRound(winner) {
    let message = "";
    if (winner === "player") {
        playerWins++;
        message = "Você venceu a rodada!";
        updateGems("player", playerWins);
    } else if (winner === "opponent") {
        enemyWins++;
        message = "Oponente venceu a rodada!";
        updateGems("opponent", enemyWins);
    } else {
        // Draw: Both get a win point (Gwent classic rule variant or just replay)
        // For simplicity here: Both get a point
        playerWins++;
        enemyWins++;
        message = "Empate! Ambos pontuam.";
        updateGems("player", playerWins);
        updateGems("opponent", enemyWins);
    }

    alert(`${message}\nPlacar da Partida: Jogador ${playerWins} - ${enemyWins} Oponente`);

    if (playerWins >= 2 || enemyWins >= 2) {
        if (playerWins >= 2 && enemyWins >= 2) {
             alert("A Partida terminou em EMPATE GERAL!");
        } else if (playerWins >= 2) {
            alert("PARABÉNS! VOCÊ VENCEU A PARTIDA!");
        } else {
            alert("GAME OVER! O Oponente venceu a partida.");
        }
        location.reload(); // Reset Game
    } else {
        prepareNextRound();
    }
}

function updateGems(who, count) {
    const containerId = who === "player" ? "player-gems" : "opponent-gems";
    const container = document.getElementById(containerId);
    const gems = container.querySelectorAll('.gem');
    
    for (let i = 0; i < count; i++) {
        if (gems[i]) gems[i].classList.add('active');
    }
}

function prepareNextRound() {
    // 1. Clear Board (Visual & Logic)
    const allRows = document.querySelectorAll('.row .cards-container');
    allRows.forEach(container => {
        const cards = container.querySelectorAll('.card');
        cards.forEach(card => {
            // Reconstruct card object from dataset
            const cardObj = {
                id: card.dataset.id,
                name: card.dataset.name,
                type: card.dataset.type,
                power: parseInt(card.dataset.basePower),
                ability: card.dataset.ability,
                isHero: card.dataset.isHero === "true"
            };

            // Determine owner based on row class (simplified logic)
            // In a real game, we'd track owner more explicitly, but here row tells us side
            // Note: Spies are on opponent side but belong to the player who played them? 
            // For simplicity, if it's on opponent side, it goes to opponent graveyard.
            // Gwent rules: Spies go to the graveyard of the player on whose side they are.
            if (container.closest('.opponent-side')) {
                enemyGraveyard.push(cardObj);
            } else {
                playerGraveyard.push(cardObj);
            }
        });
        container.innerHTML = '';
    });

    console.log("Cemitério Jogador:", playerGraveyard);
    console.log("Cemitério Inimigo:", enemyGraveyard);

    // 2. Reset States
    playerPassed = false;
    enemyPassed = false;
    isProcessingTurn = false;
    document.querySelector('.player-side').classList.remove('passed');
    document.querySelector('.opponent-side').classList.remove('passed');
    updateTurnVisuals();

    activeWeather = { frost: false, fog: false, rain: false };
    updateWeatherVisuals();

    // 3. Reset UI Controls
    const passBtn = document.getElementById('pass-button');
    passBtn.disabled = false;
    passBtn.textContent = "Passar Rodada";

    // 4. Draw 1 Card for Player
    drawCard('player', 1);

    // 5. Draw 1 Card for Enemy
    drawCard('opponent', 1);

    // 6. Update Scores (to 0)
    updateScore();

    alert("Nova Rodada Iniciada! +1 Carta para cada.");
}

// --- Drag and Drop Logic ---

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

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function setupDragAndDrop() {
    // Select only Player rows for drop targets
    const playerRows = document.querySelectorAll('.row.player');

    playerRows.forEach(row => {
        row.addEventListener('dragover', dragOver);
        row.addEventListener('dragleave', dragLeave);
        row.addEventListener('drop', drop);
    });
}

function dragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    if (playerPassed) return;
    const row = e.currentTarget;
    row.classList.add('drag-over');
}

function dragLeave(e) {
    const row = e.currentTarget;
    row.classList.remove('drag-over');
}

function drop(e) {
    e.preventDefault();
    const row = e.currentTarget;
    row.classList.remove('drag-over');

    if (playerPassed || isProcessingTurn) return;

    // Retrieve data
    const cardId = e.dataTransfer.getData('text/plain');
    const cardType = e.dataTransfer.getData('card-type');
    const rowType = row.dataset.type;

    const card = document.querySelector(`.card[data-id="${cardId}"]`);
    if (!card) return;

    const cardRow = card.dataset.row;

    // Validation: Card Type must match Row Type OR Card is Weather OR Card Row is 'all'
    if (cardType === 'weather' || cardType === rowType || cardRow === 'all') {
        if (card) {
            if (cardType === 'weather') {
                // Trigger Ability
                triggerAbility(card, row);
                
                // Move to graveyard immediately (visual discard)
                const cardObj = {
                    id: card.dataset.id,
                    name: card.dataset.name,
                    type: card.dataset.type,
                    power: parseInt(card.dataset.basePower),
                    ability: card.dataset.ability,
                    isHero: card.dataset.isHero === "true"
                };
                playerGraveyard.push(cardObj);
                
                card.remove(); // Remove from hand/drag source
                
                // Update Score (Weather effect applied)
                updateScore();

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

                // Handle Special Cards (Spells) - Remove after use
                if (card.dataset.kind === 'special') {
                    setTimeout(() => {
                        // Move to graveyard
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
                        
                        // Remove from board
                        card.remove();
                        updateScore(); // Update again after removal
                    }, 1000); // Wait for animation/effect
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
