const cardDatabase = [
  // --- TIPO: MELEE (Curta) ---
  {
    id: "m1",
    name: "Infantaria de Temeria",
    type: "melee",
    power: 4,
    img: "assets/infantry.png",
    ability: "tight_bond"
  },
  
  // --- TIPO: RANGED (Média) ---
  {
    id: "r1",
    name: "Arqueiro Nilfgaardiano",
    type: "ranged",
    power: 6,
    img: "assets/archer.png",
    ability: "none"
  },

  // --- TIPO: SIEGE (Longa) ---
  {
    id: "s1",
    name: "Balista Pesada",
    type: "siege",
    power: 8,
    img: "assets/ballista.png",
    description: "Artilharia pesada.",
    ability: "none"
  },
  {
    id: "s2",
    name: "Torre de Cerco",
    type: "siege",
    power: 6,
    img: "assets/tower.png",
    ability: "none"
  },
  // --- TIPO: SPY (Teste) ---
  {
    id: "spy1",
    name: "Espião de Dijkstra",
    type: "melee",
    power: 7,
    img: "assets/spy.png",
    ability: "spy"
  },
  // --- TIPO: SCORCH (Teste) ---
  {
    id: "sc1",
    name: "Villentretenmerth",
    type: "melee",
    power: 7,
    img: "assets/dragon.png",
    ability: "scorch"
  },
  // --- TIPO: MEDIC (Teste) ---
  {
    id: "med1",
    name: "Médica de Campo",
    type: "siege",
    power: 1,
    img: "assets/medic.png",
    ability: "medic"
  },
  // --- TIPO: WEATHER (Teste) ---
  {
    id: "w_frost",
    name: "Geada Mordaz",
    type: "weather",
    power: 0,
    img: "assets/frost.png",
    ability: "weather_frost"
  },
  {
    id: "w_clear",
    name: "Luz do Dia",
    type: "weather",
    power: 0,
    img: "assets/sun.png",
    ability: "weather_clear"
  }
];

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
        const randomCard = cardDatabase[Math.floor(Math.random() * cardDatabase.length)];
        // Clone object to avoid reference issues if we modify it later
        enemyHand.push({ ...randomCard, id: `e${i}_${randomCard.id}` });
    }
    
    updateScore();
    updateEnemyHandUI();
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

    cardDatabase.forEach(card => {
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
    el.dataset.power = card.power; // Current power
    el.dataset.basePower = card.power; // Original power for resets/calculations
    el.dataset.name = card.name;
    el.dataset.ability = card.ability || "none";

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
        if (card.ability === 'spy') {
            abilityIcon.textContent = "👁️"; // Eye for Spy
        } else if (card.ability === 'scorch') {
            abilityIcon.textContent = "🔥"; // Fire for Scorch
        } else if (card.ability === 'medic') {
            abilityIcon.textContent = "⚕️"; // Medical symbol
        } else {
            abilityIcon.textContent = "★"; // Star for others
        }
        el.appendChild(abilityIcon);
    }

    // Drag Events
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragend', dragEnd);

    return el;
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

    // Simple Logic: Revive the last card added (LIFO)
    // In a real game, we would filter out heroes or special cards if needed
    const cardToRevive = graveyard.pop();
    
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

        // Draw 2 cards for the person who played the spy
        if (isPlayerSide) {
            drawCard('player', 2);
        } else {
            drawCard('opponent', 2);
        }
    }
}

function drawCard(who, count) {
    for (let i = 0; i < count; i++) {
        if (who === 'player') {
            const randomCard = cardDatabase[Math.floor(Math.random() * cardDatabase.length)];
            const newCard = { ...randomCard, id: `p_draw_${Date.now()}_${i}_${randomCard.id}` };
            const handContainer = document.querySelector('.hand-cards');
            if (handContainer) {
                handContainer.appendChild(createCardElement(newCard));
            }
        } else {
            // Add to enemy hand array
            const randomCard = cardDatabase[Math.floor(Math.random() * cardDatabase.length)];
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

    // Find Max Power
    let maxPower = -1;
    enemyCards.forEach(card => {
        const power = parseInt(card.dataset.power);
        if (power > maxPower) {
            maxPower = power;
        }
    });

    // Identify targets (only if maxPower > 0)
    const targets = enemyCards.filter(card => parseInt(card.dataset.power) === maxPower);

    if (targets.length > 0) {
        console.log(`Scorch ativado! Destruindo ${targets.length} cartas com força ${maxPower}.`);
        
        targets.forEach(card => {
            card.classList.add('scorched');
            // Remove after animation
            setTimeout(() => {
                // Add to graveyard before removing
                const cardObj = {
                    id: card.dataset.id,
                    name: card.dataset.name,
                    type: card.dataset.type,
                    power: parseInt(card.dataset.basePower),
                    ability: card.dataset.ability
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
            }, 500);
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

            // Apply Weather
            if (isWeathered) {
                power = 1;
            }

            // Apply Tight Bond
            // Only if the card HAS the tight_bond ability AND there are others
            if (ability === 'tight_bond' && nameCounts[name] > 1) {
                power *= 2;
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

    // 3. Play a Card
    // Simple AI: Play random card
    const cardIndex = Math.floor(Math.random() * enemyHand.length);
    const cardToPlay = enemyHand[cardIndex];
    
    // Remove from hand (CRITICAL: Must happen before playing)
    enemyHand.splice(cardIndex, 1);
    updateEnemyHandUI();

    // Find correct row
    let targetRow = null;
    if (cardToPlay.type === 'weather') {
        // Weather can be played "anywhere", but for logic we just need to trigger it.
        // We'll just use the first opponent row as a dummy container to pass to triggerAbility if needed,
        // but applyWeather doesn't use the row element.
        targetRow = document.querySelector('.row.opponent'); 
    } else {
        targetRow = document.querySelector(`.row.opponent[data-type="${cardToPlay.type}"] .cards-container`);
    }

    if (targetRow) {
        const cardElement = createCardElement(cardToPlay);
        
        if (cardToPlay.type === 'weather') {
             triggerAbility(cardElement, targetRow);
             // Add to enemy graveyard
             enemyGraveyard.push(cardToPlay);
             console.log(`Inimigo jogou Clima: ${cardToPlay.name}`);
        } else {
            cardElement.draggable = false; // Enemy cards shouldn't be draggable by player
            targetRow.appendChild(cardElement);
            
            // Trigger Ability
            triggerAbility(cardElement, targetRow);
            
            console.log(`Inimigo jogou: ${cardToPlay.name}`);
        }
    }

    updateScore();
}

function passTurn(who) {
    if (who === 'opponent') {
        enemyPassed = true;
        checkEndRound();
    }
}

function enemyTurnLoop() {
    if (enemyPassed) return;

    isProcessingTurn = true;
    setTimeout(() => {
        enemyTurn();
        if (!enemyPassed && playerPassed) {
            enemyTurnLoop(); // Continue playing if player passed
        } else {
            isProcessingTurn = false;
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
                ability: card.dataset.ability
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

    // Validation: Card Type must match Row Type OR Card is Weather
    if (cardType === 'weather' || cardType === rowType) {
        const card = document.querySelector(`.card[data-id="${cardId}"]`);
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
                    ability: card.dataset.ability
                };
                playerGraveyard.push(cardObj);
                
                card.remove(); // Remove from hand/drag source
                
                // Update Score (Weather effect applied)
                updateScore();

                // Trigger Enemy Turn
                if (!enemyPassed) {
                    isProcessingTurn = true;
                    setTimeout(() => {
                        enemyTurn();
                        isProcessingTurn = false;
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

                // Trigger Enemy Turn
                if (!enemyPassed) {
                    isProcessingTurn = true;
                    setTimeout(() => {
                        enemyTurn();
                        isProcessingTurn = false;
                    }, 1500);
                }
            }
        }
    } else {
        console.log(`Jogada Inválida: Carta ${cardType} não pode ir na fileira ${rowType}.`);
    }
}
