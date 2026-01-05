import { CARD_COLLECTION, leaderCardsData } from '../data/cards.js';
import { idsToCards, shuffleArray, audioManager } from '../utils/helpers.js';
import * as Player from './player.js';

// ============================================
// ===           ENGINE CORE               ===
// ============================================

// State
export let activeWeather = { frost: false, fog: false, rain: false };
export let isProcessingTurn = false;
export let mulliganHand = [];
export let mulliganRedraws = 2;

export function setIsProcessingTurn(val) { isProcessingTurn = val; }

// UI Adapter - Injected Dependencies
let UI = {
    renderHandFromCards: () => {},
    createCardElement: () => document.createElement('div'), // fallback
    renderMulliganCards: () => {},
    renderLeaderCards: () => {},
    updateLeaderVisuals: () => {},
    updateTurnVisuals: () => {},
    updateEnemyHandUI: () => {},
    updateDeckCountUI: () => {},
    updateWeatherVisuals: () => {},
    updateGems: () => {},
    updateScore: () => ({ totalPlayer: 0, totalOpponent: 0 }),
    showRoundMessage: () => {},
    showGameOverModal: () => {},
    createMulliganCardElement: () => document.createElement('div')
};

export function setUIAdapter(adapter) {
    UI = { ...UI, ...adapter };
}

// ============================================
// ===       GAME INITIALIZATION           ===
// ============================================

export function initializeGameWithDeck(deckIds) {
    console.log("=== INICIANDO JOGO COM DECK ===");
    console.log("Deck IDs:", deckIds);

    // 1. Converter IDs para objetos de carta e embaralhar
    let convertedPlayerCards = idsToCards(deckIds);
    Player.setPlayerDeck(shuffleArray(convertedPlayerCards || []));
    console.log("Deck embaralhado (player):", Player.playerDeck.length, "cartas");

    // 2. Criar deck do inimigo (usa CARD_COLLECTION)
    const enemyDeckIds = CARD_COLLECTION
        .filter(c => c.category === 'unit')
        .map(c => c.id);

    let convertedEnemyCards = idsToCards(enemyDeckIds);
    Player.setEnemyDeck(shuffleArray(convertedEnemyCards || []));
    console.log("Deck inimigo (built):", Player.enemyDeck.length, "cartas");

    // 3. Comprar 10 cartas para a mão do jogador (NÃO renderiza ainda - vai para Mulligan)
    // We need to modify the exported array directly, but since we can't reassign imported 'let',
    // we use methods on the array or re-set it via setter if we create a new array.
    // Splice modifies in place.
    const playerStartingHand = Player.playerDeck.splice(0, 10);
    // Trigger setter just in case some observer needs it (though here it's ref)
    // Actually Player.playerDeck is the array.

    // 4. Comprar 10 cartas para a mão do inimigo
    const enemyStartingHand = Player.enemyDeck.splice(0, 10).map((card, i) => ({
        ...card,
        id: `e${i}_${card.id}` // ID único
    }));
    Player.setEnemyHand(enemyStartingHand);
    console.log('[DEBUG initializeGameWithDeck] enemyHand length after draw:', Player.enemyHand.length);

    // 5. Inicializar Líderes
    initializeLeaders();

    // 6. INICIAR FASE DE MULLIGAN (ao invés de começar o jogo diretamente)
    startMulligan(playerStartingHand);

    console.log("=== AGUARDANDO MULLIGAN ===");
}

// ============================================
// ===     SISTEMA DE MULLIGAN (Troca)     ===
// ============================================

export function startMulligan(playerHand) {
    console.log("[Mulligan] Iniciando fase de troca...");

    // Resetar estado
    mulliganHand = playerHand.map((card, i) => ({
        ...card,
        id: `p${i}_${card.id}` // ID único para a instância
    }));
    mulliganRedraws = 2;

    // Atualizar contador na UI (Direct DOM manipulation here as per original script, or move to UI?)
    // "Zero Logic Change". Original script did direct DOM manipulation in logic functions.
    // I should probably move DOM updates to UI adapter functions.
    // But original script mixed them.
    // I will try to keep DOM manipulation here if it's simple, or use UI helper.
    const redrawCountEl = document.getElementById('redraw-count');
    if (redrawCountEl) {
        redrawCountEl.textContent = mulliganRedraws;
        redrawCountEl.classList.remove('exhausted');
    }

    // Renderizar cartas no overlay
    UI.renderMulliganCards(mulliganHand, mulliganRedraws);

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

export function redrawCard(index) {
    // Verificar se ainda pode trocar
    if (mulliganRedraws <= 0) {
        console.log("[Mulligan] Sem trocas restantes!");
        return;
    }

    // Verificar se o deck tem cartas
    if (Player.playerDeck.length === 0) {
        console.log("[Mulligan] Deck vazio!");
        return;
    }

    const oldCard = mulliganHand[index];
    console.log(`[Mulligan] Trocando carta: ${oldCard.name}`);

    // 1. Devolver carta antiga ao deck (sem o ID único)
    const cardToReturn = { ...oldCard };
    delete cardToReturn.id; // Remover ID único para reinserir
    // Reinserir com o id original
    const originalCard = CARD_COLLECTION.find(c => oldCard.id.includes(c.id));
    if (originalCard) {
        Player.playerDeck.push({ ...originalCard });
    } else {
        Player.playerDeck.push(cardToReturn);
    }

    // 2. Embaralhar o deck
    Player.setPlayerDeck(shuffleArray(Player.playerDeck));

    // 3. Comprar nova carta do topo
    const newCard = Player.playerDeck.shift();
    const newCardWithId = {
        ...newCard,
        id: `p${index}_${newCard.id}` // Novo ID único
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
    // This part is heavy DOM.
    const container = document.getElementById('mulligan-cards');
    if (container) {
        const cardEl = container.querySelector(`[data-index="${index}"]`);
        if (cardEl) {
            cardEl.classList.add('swapping');

            setTimeout(() => {
                // Substituir o elemento
                const newCardEl = UI.createMulliganCardElement(newCardWithId, index, mulliganRedraws);
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

export function finishMulligan() {
    console.log("[Mulligan] Finalizando fase de troca...");

    // 1. Esconder overlay
    const overlay = document.getElementById('mulligan-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }

    // 2. Renderizar mão final no rodapé
    UI.renderHandFromCards(mulliganHand);

    // 3. Atualizar UI
    UI.updateScore(activeWeather);
    UI.updateEnemyHandUI();
    UI.updateDeckCountUI();
    UI.updateTurnVisuals();
    UI.updateLeaderVisuals();

    // 4. Iniciar música de batalha (se não estiver tocando)
    try { audioManager.playMusic(); } catch (e) { console.warn('Music failed', e); }

    // 5. Tocar SFX de início
    try { audioManager.playSFX('switch'); } catch (e) { console.warn('SFX failed', e); }

    console.log("=== JOGO INICIADO ===");
}

// ============================================
// ===       SISTEMA DE LÍDERES            ===
// ============================================

export function initializeLeaders() {
    // Assign leaders - Player gets O General, Enemy gets random
    Player.setPlayerLeader(leaderCardsData.find(l => l.id === 'leader_general') || leaderCardsData[0]);

    // Enemy gets a different random leader
    const availableEnemyLeaders = leaderCardsData.filter(l => l.id !== Player.playerLeader.id);
    Player.setEnemyLeader(availableEnemyLeaders[Math.floor(Math.random() * availableEnemyLeaders.length)] || leaderCardsData[1]);

    Player.setPlayerLeaderUsed(false);
    Player.setEnemyLeaderUsed(false);

    UI.renderLeaderCards();
}

export function activateLeader(who) {
    const leader = who === 'player' ? Player.playerLeader : Player.enemyLeader;
    const isUsed = who === 'player' ? Player.playerLeaderUsed : Player.enemyLeaderUsed;

    if (!leader || isUsed) return;

    console.log(`[Líder] ${who} ativou: ${leader.name}`);

    // Execute ability
    executeLeaderAbility(leader.ability, who);

    // Mark as used
    if (who === 'player') {
        Player.setPlayerLeaderUsed(true);
    } else {
        Player.setEnemyLeaderUsed(true);
    }

    UI.updateLeaderVisuals();
    UI.updateScore(activeWeather);
}

export function executeLeaderAbility(ability, who) {
    switch (ability) {
        case 'leader_clear_weather':
            clearWeather();
            console.log(`[Líder] Clima limpo por ${who}!`);
            break;

        case 'leader_scorch_siege':
            // Destrói a carta mais forte na fileira de Cerco inimiga
            const targetSide = who === 'player' ? 'opponent' : 'player';
            const siegeRow = document.querySelector(`.row.${targetSide}[data-type="siege"] .cards-container`);
            if (siegeRow) {
                const cards = Array.from(siegeRow.querySelectorAll('.card'));
                const vulnerable = cards.filter(c => c.dataset.isHero !== "true");
                if (vulnerable.length > 0) {
                    let maxPower = -1;
                    vulnerable.forEach(c => {
                        const p = parseInt(c.dataset.power);
                        if (p > maxPower) maxPower = p;
                    });
                    const targets = vulnerable.filter(c => parseInt(c.dataset.power) === maxPower);
                    targets.forEach(card => {
                        card.classList.add('burning');
                        setTimeout(() => {
                            const cardObj = {
                                id: card.dataset.id,
                                name: card.dataset.name,
                                type: card.dataset.type,
                                power: parseInt(card.dataset.basePower),
                                ability: card.dataset.ability,
                                isHero: card.dataset.isHero === "true"
                            };
                            if (targetSide === 'opponent') {
                                Player.enemyGraveyard.push(cardObj);
                            } else {
                                Player.playerGraveyard.push(cardObj);
                            }
                            card.remove();
                            UI.updateScore(activeWeather);
                        }, 800);
                    });
                    console.log(`[Líder] Destruiu ${targets.length} carta(s) de cerco!`);
                }
            }
            break;

        case 'leader_draw_card':
            // Compra 1 carta
            drawCard(who === 'player' ? 'player' : 'opponent', 1);
            console.log(`[Líder] ${who} comprou 1 carta!`);
            break;

        case 'leader_boost_melee':
            // Adiciona +2 a todas unidades Melee do lado de quem ativou
            const meleeSide = who === 'player' ? 'player' : 'opponent';
            const meleeRow = document.querySelector(`.row.${meleeSide}[data-type="melee"] .cards-container`);
            if (meleeRow) {
                const cards = meleeRow.querySelectorAll('.card');
                cards.forEach(card => {
                    if (card.dataset.isHero !== "true") {
                        const currentBase = parseInt(card.dataset.basePower);
                        card.dataset.basePower = currentBase + 2;
                    }
                });
                console.log(`[Líder] +2 poder para ${cards.length} unidades Melee!`);
            }
            break;
    }
}

// ============================================
// ===           GAME LOGIC                ===
// ============================================

export function passTurn(who) {
    if (who === 'opponent') {
        Player.setEnemyPassed(true);
        document.querySelector('.opponent-side').classList.add('passed');
        UI.updateTurnVisuals();
        checkEndRound();
    }
}

export function checkEndRound() {
    if (Player.playerPassed && Player.enemyPassed) {
        const scores = UI.updateScore(activeWeather);
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

export function endRound(winner) {
    let message = "";
    if (winner === "player") {
        Player.setPlayerWins(Player.playerWins + 1);
        message = "Você venceu a rodada!";
        UI.updateGems("player", Player.playerWins);

        // Passiva de Facção
        if (Player.PLAYER_FACTION === 'alfredolandia') {
            console.log("[Passiva] Alfredolândia: Comprando 1 carta extra por vencer a rodada!");
            drawCard('player', 1);
            message += "\n🃏 Passiva de Facção: +1 carta!";
        }

    } else if (winner === "opponent") {
        Player.setEnemyWins(Player.enemyWins + 1);
        message = "Oponente venceu a rodada!";
        UI.updateGems("opponent", Player.enemyWins);
    } else {
        Player.setPlayerWins(Player.playerWins + 1);
        Player.setEnemyWins(Player.enemyWins + 1);
        message = "Empate! Ambos pontuam.";
        UI.updateGems("player", Player.playerWins);
        UI.updateGems("opponent", Player.enemyWins);
    }

    if (Player.playerWins >= 2 || Player.enemyWins >= 2) {
        UI.showGameOverModal(Player.playerWins, Player.enemyWins);
    } else {
        UI.showRoundMessage(message);
    }
}

export function prepareNextRound() {
    // 1. Clear Board (Visual & Logic)
    const allRows = document.querySelectorAll('.row .cards-container');
    allRows.forEach(container => {
        const cards = container.querySelectorAll('.card');
        cards.forEach(card => {
            const cardObj = {
                id: card.dataset.id,
                name: card.dataset.name,
                type: card.dataset.type,
                power: parseInt(card.dataset.basePower),
                ability: card.dataset.ability,
                isHero: card.dataset.isHero === "true"
            };

            if (container.closest('.opponent-side')) {
                Player.enemyGraveyard.push(cardObj);
            } else {
                Player.playerGraveyard.push(cardObj);
            }
        });
        container.innerHTML = '';
    });

    // 2. Reset States
    Player.setPlayerPassed(false);
    Player.setEnemyPassed(false);
    isProcessingTurn = false;
    document.querySelector('.player-side').classList.remove('passed');
    document.querySelector('.opponent-side').classList.remove('passed');
    UI.updateTurnVisuals();

    activeWeather = { frost: false, fog: false, rain: false };
    UI.updateWeatherVisuals(activeWeather);

    // 3. Reset UI Controls
    const passBtn = document.getElementById('pass-button');
    if (passBtn) {
        passBtn.disabled = false;
        passBtn.textContent = "Passar Rodada";
    }

    // 4. Draw 1 Card for Player
    drawCard('player', 1);

    // 5. Draw 1 Card for Enemy
    drawCard('opponent', 1);

    // 6. Update Scores (to 0)
    UI.updateScore(activeWeather);

    alert("Nova Rodada Iniciada! +1 Carta para cada.");
}

export function resetGame() {
    console.log("=== REINICIANDO JOGO ===");

    Player.setPlayerWins(0);
    Player.setEnemyWins(0);
    Player.setPlayerPassed(false);
    Player.setEnemyPassed(false);
    isProcessingTurn = false;
    activeWeather = { frost: false, fog: false, rain: false };
    Player.setPlayerGraveyard([]);
    Player.setEnemyGraveyard([]);
    Player.setEnemyHand([]);
    Player.setPlayerDeck([]);
    Player.setEnemyDeck([]);

    Player.setPlayerLeaderUsed(false);
    Player.setEnemyLeaderUsed(false);

    const allRows = document.querySelectorAll('.row .cards-container');
    allRows.forEach(container => {
        container.innerHTML = '';
    });

    const handContainer = document.querySelector('.hand-cards');
    if (handContainer) {
        handContainer.innerHTML = '';
    }

    document.querySelectorAll('.gem').forEach(gem => {
        gem.classList.remove('active');
    });

    document.querySelector('.player-side')?.classList.remove('passed');
    document.querySelector('.opponent-side')?.classList.remove('passed');

    const passBtn = document.getElementById('pass-button');
    if (passBtn) {
        passBtn.disabled = false;
        passBtn.textContent = "Passar Rodada";
    }

    UI.updateWeatherVisuals(activeWeather);

    // We need to re-initialize with the deck from localStorage (since playerDeckIds was a global)
    // Here we can read localStorage directly.
    try {
        const saved = localStorage.getItem('kingdomOfAen_playerDeck');
        if (saved) {
            const ids = JSON.parse(saved);
            initializeGameWithDeck(ids);
        } else {
            // Fallback? Or just wait for builder.
            console.warn("No saved deck found on reset.");
        }
    } catch (e) {
        console.warn("Error loading deck on reset:", e);
    }

    console.log("=== JOGO REINICIADO ===");
}

// ============================================
// ===           ABILITIES                 ===
// ============================================

export function triggerAbility(cardElement, rowElement) {
    const ability = cardElement.dataset.ability;
    // const name = cardElement.dataset.name;
    // const basePower = parseInt(cardElement.dataset.basePower);

    switch (ability) {
        case 'tight_bond':
            // applyTightBond(rowElement, name, basePower); // Deprecated
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
            // Decoy logic is handled via manual drop on target card
            break;
        default:
            break;
    }
}

export function applyWeather(type) {
    activeWeather[type] = true;
    console.log(`Clima ativado: ${type}`);
    UI.updateWeatherVisuals(activeWeather);
    UI.updateScore(activeWeather);
}

export function clearWeather() {
    activeWeather = { frost: false, fog: false, rain: false };
    console.log("Clima limpo!");
    UI.updateWeatherVisuals(activeWeather);
    UI.updateScore(activeWeather);
}

export function applyMedic(cardElement, currentRow) {
    const isPlayerSide = currentRow.classList.contains('player');
    const graveyard = isPlayerSide ? Player.playerGraveyard : Player.enemyGraveyard;

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
        const newCardElement = UI.createCardElement(cardToRevive);

        if (!isPlayerSide) {
            newCardElement.draggable = false;
        } else {
            newCardElement.draggable = false;
        }

        targetContainer.appendChild(newCardElement);

        setTimeout(() => {
            triggerAbility(newCardElement, targetContainer.closest('.row'));
            UI.updateScore(activeWeather);
        }, 300);
    }
}

export function applySpy(cardElement, currentRow) {
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

export function drawCard(who, count) {
    for (let i = 0; i < count; i++) {
        if (who === 'player') {
            if (Player.playerDeck.length > 0) {
                const drawnCard = Player.playerDeck.shift();
                const newCard = { ...drawnCard, id: `p_draw_${Date.now()}_${i}_${drawnCard.id}` };
                const handContainer = document.querySelector('.hand-cards');
                if (handContainer) {
                    handContainer.appendChild(UI.createCardElement(newCard));
                }
                UI.updateDeckCountUI();
            } else {
                console.log("[Draw] Deck do jogador vazio!");
            }
        } else {
            if (Player.enemyDeck.length > 0) {
                const drawnCard = Player.enemyDeck.shift();
                Player.enemyHand.push({ ...drawnCard, id: `e_draw_${Date.now()}_${i}_${drawnCard.id}` });
                UI.updateEnemyHandUI();
            } else {
                console.log("[Draw] Deck do inimigo vazio!");
            }
        }
    }
    console.log(`${who} comprou ${count} cartas.`);
}

export function applyScorch(cardElement, currentRow) {
    const cardType = cardElement.dataset.type;
    const isPlayerSide = currentRow.classList.contains('player');
    const targetSideClass = isPlayerSide ? 'opponent' : 'player';

    const targetRowSelector = `.row.${targetSideClass}[data-type="${cardType}"] .cards-container`;
    const targetContainer = document.querySelector(targetRowSelector);

    if (!targetContainer) return;

    const enemyCards = Array.from(targetContainer.querySelectorAll('.card'));
    if (enemyCards.length === 0) return;

    const vulnerableCards = enemyCards.filter(card => card.dataset.isHero !== "true");

    if (vulnerableCards.length === 0) {
        console.log("Scorch falhou: Apenas heróis na fileira.");
        return;
    }

    let maxPower = -1;
    vulnerableCards.forEach(card => {
        const power = parseInt(card.dataset.power);
        if (power > maxPower) {
            maxPower = power;
        }
    });

    const targets = vulnerableCards.filter(card => parseInt(card.dataset.power) === maxPower);

    if (targets.length > 0) {
        console.log(`Scorch ativado! Destruindo ${targets.length} cartas com força ${maxPower}.`);

        targets.forEach(card => {
            card.classList.add('burning');
            setTimeout(() => {
                const cardObj = {
                    id: card.dataset.id,
                    name: card.dataset.name,
                    type: card.dataset.type,
                    power: parseInt(card.dataset.basePower),
                    ability: card.dataset.ability,
                    isHero: card.dataset.isHero === "true"
                };

                if (card.closest('.opponent-side')) {
                    Player.enemyGraveyard.push(cardObj);
                } else {
                    Player.playerGraveyard.push(cardObj);
                }

                if (card.parentNode) {
                    card.parentNode.removeChild(card);
                }
                UI.updateScore(activeWeather);
            }, 800);
        });
    }
}

// ============================================
// ===           AI LOGIC                  ===
// ============================================

function getPlayerHandCount() {
    const handContainer = document.querySelector('.hand-cards');
    if (!handContainer) return 0;
    return handContainer.querySelectorAll('.card').length;
}

function isPartnerOnBoard(partnerName) {
    const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
    for (const container of opponentRows) {
        if (container.querySelector(`.card[data-name="${partnerName}"]`)) {
            return true;
        }
    }
    return false;
}

function isPartnerInHand(partnerName) {
    return Player.enemyHand.some(c => c.name === partnerName);
}

function findDecoyTargets() {
    const targets = [];
    const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
    opponentRows.forEach(container => {
        const cards = Array.from(container.querySelectorAll('.card'));
        cards.forEach(card => {
            if (card.dataset.isHero !== "true" && card.dataset.ability !== 'decoy') {
                targets.push({
                    element: card,
                    basePower: parseInt(card.dataset.basePower),
                    currentPower: parseInt(card.dataset.power),
                    ability: card.dataset.ability,
                    isSpy: card.classList.contains('spy-card')
                });
            }
        });
    });
    return targets;
}

function findStrongestPlayerCard() {
    let maxPower = -1;
    let strongestCard = null;
    const playerRows = document.querySelectorAll('.row.player .cards-container');
    playerRows.forEach(container => {
        const cards = Array.from(container.querySelectorAll('.card'));
        cards.forEach(card => {
            if (card.dataset.isHero !== "true") {
                const power = parseInt(card.dataset.power);
                if (power > maxPower) {
                    maxPower = power;
                    strongestCard = card;
                }
            }
        });
    });
    return { card: strongestCard, power: maxPower };
}

function findStrongestEnemyCard() {
    let maxPower = -1;
    let strongestCard = null;
    const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
    opponentRows.forEach(container => {
        const cards = Array.from(container.querySelectorAll('.card'));
        cards.forEach(card => {
            if (card.dataset.isHero !== "true") {
                const power = parseInt(card.dataset.power);
                if (power > maxPower) {
                    maxPower = power;
                    strongestCard = card;
                }
            }
        });
    });
    return { card: strongestCard, power: maxPower };
}

function getTotalCardsOnBoard() {
    let count = 0;
    const allRows = document.querySelectorAll('.row .cards-container');
    allRows.forEach(container => {
        count += container.querySelectorAll('.card').length;
    });
    return count;
}

function getBestRowForAgile() {
    const rowTypes = ['melee', 'ranged', 'siege'];
    const weatherMap = { melee: 'frost', ranged: 'fog', siege: 'rain' };

    for (const type of rowTypes) {
        if (!activeWeather[weatherMap[type]]) {
            return type;
        }
    }
    return 'melee';
}

function shouldEnemyUseLeader() {
    if (Player.enemyLeaderUsed || !Player.enemyLeader) return false;

    const ability = Player.enemyLeader.ability;

    switch (ability) {
        case 'leader_clear_weather':
            const enemyAffected = (activeWeather.frost || activeWeather.fog || activeWeather.rain);
            if (enemyAffected) {
                const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
                let affectedCount = 0;
                opponentRows.forEach(container => {
                    const cards = container.querySelectorAll('.card');
                    cards.forEach(card => {
                        if (card.dataset.isHero !== "true") {
                            const current = parseInt(card.dataset.power);
                            const base = parseInt(card.dataset.basePower);
                            if (current < base) affectedCount++;
                        }
                    });
                });
                return affectedCount >= 2;
            }
            return false;

        case 'leader_scorch_siege':
            const playerSiege = document.querySelector('.row.player[data-type="siege"] .cards-container');
            if (playerSiege) {
                const cards = Array.from(playerSiege.querySelectorAll('.card'));
                const strong = cards.filter(c => c.dataset.isHero !== "true" && parseInt(c.dataset.power) >= 6);
                return strong.length > 0;
            }
            return false;

        case 'leader_draw_card':
            return Player.enemyHand.length <= 3;

        case 'leader_boost_melee':
            const enemyMelee = document.querySelector('.row.opponent[data-type="melee"] .cards-container');
            if (enemyMelee) {
                return enemyMelee.querySelectorAll('.card').length >= 3;
            }
            return false;
    }

    return false;
}

export function enemyTurn() {
    if (Player.enemyPassed) return;

    const scores = UI.updateScore(activeWeather);
    const playerHandCount = getPlayerHandCount();
    const totalCardsOnBoard = getTotalCardsOnBoard();
    const isEarlyGame = totalCardsOnBoard < 6;
    const scoreDifference = scores.totalOpponent - scores.totalPlayer;

    console.debug('[DEBUG enemyTurn] called', { enemyPassed: Player.enemyPassed, playerPassed: Player.playerPassed, enemyHandLength: Player.enemyHand.length, scores, playerHandCount, totalCardsOnBoard });
    console.log(`[IA] Pontuação: Inimigo ${scores.totalOpponent} vs Jogador ${scores.totalPlayer}`);
    console.log(`[IA] Cartas na mão: Inimigo ${Player.enemyHand.length} vs Jogador ${playerHandCount}`);

    if (shouldEnemyUseLeader()) {
        console.log("[IA] Decidiu usar o Líder!");
        activateLeader('opponent');
        return;
    }

    // REGRA 1: VERIFICAR SE DEVE PASSAR
    if (Player.enemyHand.length === 0) {
        console.log("[IA] Sem cartas na mão. Passando.");
        passTurn('opponent');
        return;
    }

    if (Player.playerPassed && scores.totalOpponent > scores.totalPlayer) {
        console.log("[IA] Jogador passou e estou ganhando. Passando para economizar cartas!");
        passTurn('opponent');
        return;
    }

    if (scoreDifference >= 15 && Player.enemyHand.length < playerHandCount) {
        console.log("[IA] Grande vantagem de pontos e menos cartas. Passando estrategicamente!");
        passTurn('opponent');
        return;
    }

    // REGRA 2-6: AVALIAR PRIORIDADES DAS CARTAS
    let bestCardIndex = -1;
    let maxPriority = -1;
    let bestDecoyTarget = null;
    let bestRowOverride = null;

    Player.enemyHand.forEach((card, index) => {
        let priority = 0;
        let decoyTarget = null;
        let rowOverride = null;

        const ability = card.ability || 'none';

        if (ability === 'spy' || ability === 'spy_medic') {
            if (isEarlyGame) {
                priority = 100;
            } else if (scores.totalOpponent < scores.totalPlayer) {
                priority = 90;
            } else if (Player.enemyHand.length < playerHandCount) {
                priority = 80;
            } else {
                priority = 30;
            }
        }
        else if (ability === 'medic') {
            const validTargets = Player.enemyGraveyard.filter(c => !c.isHero);

            if (validTargets.length === 0) {
                priority = 0;
            } else {
                const maxGravePower = Math.max(...validTargets.map(c => c.power));
                if (maxGravePower >= 5) {
                    priority = 70 + maxGravePower;
                } else {
                    priority = 20 + maxGravePower;
                }
            }
        }
        else if (ability === 'bond_partner' && card.partner) {
            const partnerOnBoard = isPartnerOnBoard(card.partner);
            const partnerInHand = isPartnerInHand(card.partner);

            if (partnerOnBoard) {
                priority = 150;
            } else if (partnerInHand) {
                priority = card.power + 15;
            } else {
                priority = card.power;
            }
        }
        else if (ability === 'decoy') {
            const targets = findDecoyTargets();

            if (targets.length === 0) {
                priority = 0;
            } else {
                const playerSpies = targets.filter(t => t.isSpy);
                if (playerSpies.length > 0) {
                    const bestSpy = playerSpies.reduce((a, b) => a.basePower > b.basePower ? a : b);
                    priority = 85;
                    decoyTarget = bestSpy.element;
                }
                else {
                    const strongWeakened = targets.filter(t =>
                        t.basePower >= 6 && t.currentPower < t.basePower && !t.isSpy
                    );

                    if (strongWeakened.length > 0) {
                        const best = strongWeakened.reduce((a, b) => a.basePower > b.basePower ? a : b);
                        priority = 45 + best.basePower;
                        decoyTarget = best.element;
                    }
                    else {
                        const reusable = targets.filter(t =>
                            (t.ability === 'medic' || t.ability === 'spy' || t.ability === 'spy_medic') && !t.isSpy
                        );

                        if (reusable.length > 0) {
                            const best = reusable[0];
                            priority = 40;
                            decoyTarget = best.element;
                        }
                        else {
                            const strong = targets.filter(t => t.basePower >= 6 && !t.isSpy);
                            if (strong.length > 0) {
                                const best = strong.reduce((a, b) => a.basePower > b.basePower ? a : b);
                                priority = 25;
                                decoyTarget = best.element;
                            } else {
                                priority = 0;
                            }
                        }
                    }
                }
            }
        }
        else if (ability === 'scorch') {
            const strongestPlayer = findStrongestPlayerCard();
            const strongestEnemy = findStrongestEnemyCard();

            if (strongestPlayer.power > 0 && strongestPlayer.power > strongestEnemy.power) {
                priority = 60 + strongestPlayer.power;
            } else if (strongestPlayer.power > 0 && strongestPlayer.power === strongestEnemy.power) {
                priority = 5;
            } else {
                priority = 0;
            }
        }
        else if (card.type === 'weather') {
            priority = 10;
        }
        else {
            if (card.isHero) {
                if (activeWeather.frost || activeWeather.fog || activeWeather.rain) {
                    priority = card.power + 20;
                } else {
                    priority = card.power + 10;
                }
            } else {
                priority = card.power;
                const rowType = card.row === 'all' ? getBestRowForAgile() : card.type;
                const weatherMap = { melee: 'frost', ranged: 'fog', siege: 'rain' };
                if (activeWeather[weatherMap[rowType]]) {
                    priority = Math.max(1, priority - 3);
                }
                if (card.row === 'all') {
                    rowOverride = rowType;
                }
            }
        }

        if (priority > maxPriority) {
            maxPriority = priority;
            bestCardIndex = index;
            bestDecoyTarget = decoyTarget;
            bestRowOverride = rowOverride;
        }
    });

    if (bestCardIndex === -1 || maxPriority <= 0) {
        if (scores.totalOpponent > scores.totalPlayer) {
            console.log("[IA] Sem boas jogadas e ganhando. Passando.");
            passTurn('opponent');
            return;
        }
        let minPower = Infinity;
        Player.enemyHand.forEach((card, index) => {
            if (card.ability !== 'decoy' && card.power < minPower) {
                minPower = card.power;
                bestCardIndex = index;
            }
        });
        if (bestCardIndex === -1) {
            console.log("[IA] Apenas Decoy sem alvo. Passando.");
            passTurn('opponent');
            return;
        }
        console.log("[IA] Jogando carta de menor valor como fallback.");
    }

    const cardToPlay = Player.enemyHand[bestCardIndex];
    console.log(`[IA] >>> Jogando: ${cardToPlay.name} (Prioridade: ${maxPriority})`);

    Player.enemyHand.splice(bestCardIndex, 1);
    UI.updateEnemyHandUI();

    if (cardToPlay.ability === 'decoy' && bestDecoyTarget) {
        console.log(`[IA] Decoy ativado em: ${bestDecoyTarget.dataset.name}`);

        const returnedCardObj = {
            id: bestDecoyTarget.dataset.id,
            name: bestDecoyTarget.dataset.name,
            type: bestDecoyTarget.dataset.type,
            power: parseInt(bestDecoyTarget.dataset.basePower),
            ability: bestDecoyTarget.dataset.ability,
            isHero: bestDecoyTarget.dataset.isHero === "true",
            partner: bestDecoyTarget.dataset.partner,
            row: bestDecoyTarget.dataset.row
        };
        Player.enemyHand.push(returnedCardObj);
        UI.updateEnemyHandUI();

        const decoyElement = UI.createCardElement(cardToPlay);
        decoyElement.draggable = false;

        const parent = bestDecoyTarget.parentNode;
        parent.insertBefore(decoyElement, bestDecoyTarget);
        bestDecoyTarget.remove();

        UI.updateScore(activeWeather);
        try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }
        return;
    }

    let targetContainer = null;

    if (cardToPlay.type === 'weather') {
        const cardElement = UI.createCardElement(cardToPlay);
        const dummyRow = document.querySelector('.row.opponent');
        triggerAbility(cardElement, dummyRow);
        Player.enemyGraveyard.push(cardToPlay);
        console.log(`[IA] Clima ativado: ${cardToPlay.name}`);
        try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }
    } else {
        let rowType = cardToPlay.type;
        if (cardToPlay.row === 'all') {
            rowType = bestRowOverride || getBestRowForAgile();
        }

        targetContainer = document.querySelector(`.row.opponent[data-type="${rowType}"] .cards-container`);

        if (targetContainer) {
            const cardElement = UI.createCardElement(cardToPlay);
            cardElement.draggable = false;
            targetContainer.appendChild(cardElement);

            const row = targetContainer.closest('.row');
            triggerAbility(cardElement, row);
            try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }

            console.log(`[IA] Carta jogada: ${cardToPlay.name} na fileira ${rowType}`);
        }
    }

    UI.updateScore(activeWeather);
}

export function enemyTurnLoop() {
    if (Player.enemyPassed) return;

    console.debug('[DEBUG enemyTurnLoop] starting loop iteration; enemyPassed=', Player.enemyPassed);

    isProcessingTurn = true;
    UI.updateTurnVisuals();

    setTimeout(() => {
        enemyTurn();
        if (!Player.enemyPassed) {
            console.debug('[DEBUG enemyTurnLoop] scheduling next iteration (enemy still active)');
            enemyTurnLoop();
        } else {
            console.debug('[DEBUG enemyTurnLoop] enemy passed — stopping loop');
            isProcessingTurn = false;
            UI.updateTurnVisuals();
        }
    }, 1500);
}
