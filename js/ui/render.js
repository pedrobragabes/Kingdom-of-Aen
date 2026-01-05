import { ROW_ICONS, ABILITY_DESCRIPTIONS, audioManager } from '../utils/helpers.js';
import * as Player from '../core/player.js';
import * as Engine from '../core/engine.js';
// Engine import is needed for "redrawCard" in createMulliganCardElement if we use it directly,
// but to avoid cycle we might need to inject it or use the module namespace if Engine doesn't import Render.
// Engine DOES NOT import Render (we will ensure this).
// So Render CAN import Engine.
// However, Render uses Player state heavily.

// We need to access state variables.
// Since Player exports live bindings, we can read them.

// Note: createCardElement needs drag events from interactions.js
import { dragStart, dragEnd, dragOver, dragLeave, drop } from './interactions.js';

// ============================================
// ===           UI RENDERING              ===
// ============================================

export function renderHand() {
    // This function was present in original but seems unused if using initializeGameWithDeck
    // Kept for compatibility if needed or legacy.
    // It used "allCardsData" global.
    // We'll skip implementation or just log warning as we focus on DeckBuilder flow.
    console.warn("renderHand (legacy) called. Use renderHandFromCards.");
}

export function renderHandFromCards(cards) {
    const handContainer = document.querySelector('.hand-cards');
    if (!handContainer) return;

    handContainer.innerHTML = '';

    cards.forEach((card, index) => {
        // Clonar para evitar modificar o original
        const cardWithUniqueId = {
            ...card,
            id: `p${index}_${card.id}` // ID único para a instância na mão
        };
        const cardElement = createCardElement(cardWithUniqueId);
        handContainer.appendChild(cardElement);
    });
}

export function createCardElement(card) {
    const el = document.createElement('div');
    el.classList.add('card');
    el.draggable = true;

    // Data attributes
    el.dataset.id = card.id;
    el.dataset.type = card.type; // melee, ranged, siege
    el.dataset.category = card.category || "unit";
    el.dataset.power = card.power;
    el.dataset.basePower = card.power;
    el.dataset.name = card.name;
    el.dataset.ability = card.ability || "none";
    el.dataset.isHero = card.isHero || "false";
    if (card.partner) el.dataset.partner = card.partner;
    if (card.row === 'all') el.dataset.agile = "true";
    if (card.kind) el.dataset.kind = card.kind;

    // Classes especiais
    if (card.isHero) el.classList.add('hero-card');
    if (card.ability === 'spy' || card.ability === 'spy_medic') el.classList.add('spy-card');
    if (card.row === 'all') el.classList.add('agile-card');

    // ========================================
    // NOVA ESTRUTURA VISUAL DA CARTA
    // ========================================

    // Imagem de fundo do personagem
    if (card.img) {
        el.style.backgroundImage = `url('${card.img}')`;
    }

    // Overlay escuro para legibilidade
    const overlay = document.createElement('div');
    overlay.classList.add('card-overlay');
    el.appendChild(overlay);

    // Badge de Força (canto superior esquerdo)
    const strengthBadge = document.createElement('div');
    // Visual badge for power (used by updateScore())
    strengthBadge.classList.add('card-strength-badge');
    strengthBadge.textContent = card.power;
    el.appendChild(strengthBadge);

    // Container de informações (parte inferior)
    const infoContainer = document.createElement('div');
    infoContainer.classList.add('card-info-container');

    // Nome da carta (banner amarelo)
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('card-name');
    nameDiv.textContent = card.name;
    infoContainer.appendChild(nameDiv);

    // Descrição/Habilidade (banner laranja)
    const descDiv = document.createElement('div');
    descDiv.classList.add('card-desc');
    if (card.ability && card.ability !== 'none') {
        let descText = ABILITY_DESCRIPTIONS[card.ability] || '';
        if (card.ability === 'bond_partner' && card.partner) {
            descText = `Bond: ${card.partner}`;
        }
        descDiv.textContent = descText;
    } else {
        descDiv.textContent = card.type ? card.type.charAt(0).toUpperCase() + card.type.slice(1) : '';
    }
    infoContainer.appendChild(descDiv);

    el.appendChild(infoContainer);

    // Ícone da Fileira (canto inferior direito)
    const rowIconImg = document.createElement('img');
    rowIconImg.classList.add('card-row-icon-img');

    // Determinar qual ícone usar
    let iconKey = card.type; // melee, ranged, siege
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
    });

    el.addEventListener('dragleave', function (e) {
        e.currentTarget.classList.remove('valid-target');
    });

    el.addEventListener('drop', drop); // Reuse general drop handler, it has logic to distinguish

    return el;
}

export function renderMulliganCards(mulliganHand, mulliganRedraws) {
    const container = document.getElementById('mulligan-cards');
    if (!container) return;

    container.innerHTML = '';

    mulliganHand.forEach((card, index) => {
        const cardEl = createMulliganCardElement(card, index, mulliganRedraws);
        container.appendChild(cardEl);
    });
}

export function createMulliganCardElement(card, index, mulliganRedraws) {
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

    // Click event for redraw - CALLING ENGINE
    el.addEventListener('click', () => Engine.redrawCard(index));

    // Disable if no redraws left
    if (mulliganRedraws <= 0) {
        el.classList.add('disabled');
    }

    return el;
}

export function renderLeaderCards() {
    // Player Leader
    const playerLeaderCard = document.getElementById('player-leader-card');
    if (playerLeaderCard && Player.playerLeader) {
        playerLeaderCard.querySelector('.leader-name').textContent = Player.playerLeader.name;
        playerLeaderCard.querySelector('.leader-ability-text').textContent = getLeaderAbilityDescription(Player.playerLeader.ability);
    }

    // Enemy Leader
    const enemyLeaderCard = document.getElementById('enemy-leader-card');
    if (enemyLeaderCard && Player.enemyLeader) {
        enemyLeaderCard.querySelector('.leader-name').textContent = Player.enemyLeader.name;
        enemyLeaderCard.querySelector('.leader-ability-text').textContent = getLeaderAbilityDescription(Player.enemyLeader.ability);
    }
}

export function getLeaderAbilityDescription(ability) {
    const descriptions = {
        'leader_clear_weather': '☀️ Limpar Clima',
        'leader_scorch_siege': '🔥 Queimar Cerco',
        'leader_draw_card': '🃏 Comprar Carta',
        'leader_boost_melee': '⚔️ +2 Melee'
    };
    return descriptions[ability] || 'Habilidade';
}

export function updateLeaderVisuals() {
    const playerSlot = document.getElementById('player-leader');
    const enemySlot = document.getElementById('enemy-leader');
    const playerCard = document.getElementById('player-leader-card');
    const enemyCard = document.getElementById('enemy-leader-card');

    // Player Leader
    if (playerSlot && playerCard) {
        if (Player.playerLeaderUsed) {
            playerSlot.classList.add('used');
            playerCard.classList.add('used');
            playerCard.classList.remove('clickable', 'my-turn');
        } else {
            playerSlot.classList.remove('used');
            playerCard.classList.remove('used');

            // Show clickable indicator when it's player's turn
            // Need 'isProcessingTurn' from Engine
            if (!Player.playerPassed && !Engine.isProcessingTurn) {
                playerCard.classList.add('clickable', 'my-turn');
            } else {
                playerCard.classList.remove('clickable', 'my-turn');
            }
        }
    }

    // Enemy Leader
    if (enemySlot && enemyCard) {
        if (Player.enemyLeaderUsed) {
            enemySlot.classList.add('used');
            enemyCard.classList.add('used');
        } else {
            enemySlot.classList.remove('used');
            enemyCard.classList.remove('used');
        }
    }
}

export function updateTurnVisuals() {
    const playerSide = document.querySelector('.player-side');
    const opponentSide = document.querySelector('.opponent-side');

    if (!playerSide || !opponentSide) return;

    playerSide.classList.remove('active-turn');
    opponentSide.classList.remove('active-turn');

    if (Engine.isProcessingTurn && !Player.enemyPassed) {
        opponentSide.classList.add('active-turn');
    } else if (!Player.playerPassed) {
        playerSide.classList.add('active-turn');
    }

    // Atualizar visuais dos líderes também
    updateLeaderVisuals();
}

export function updateEnemyHandUI() {
    const el = document.getElementById('enemy-hand-count');
    if (el) {
        el.textContent = Player.enemyHand.length;
    }
}

export function updateDeckCountUI() {
    const deckCountEl = document.getElementById('player-deck-count');
    if (deckCountEl) {
        deckCountEl.textContent = Player.playerDeck.length;
    }
}

export function updateWeatherVisuals(activeWeather) {
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

export function updateScore(activeWeather) {
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

            // Update Visuals - ensure badge exists (.card-strength-badge)
            let badge = card.querySelector('.card-strength-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.classList.add('card-strength-badge');
                card.appendChild(badge);
            }
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

export function updateGems(who, count) {
    const containerId = who === "player" ? "player-gems" : "opponent-gems";
    const container = document.getElementById(containerId);
    if (!container) return;
    const gems = container.querySelectorAll('.gem');

    for (let i = 0; i < count; i++) {
        if (gems[i]) gems[i].classList.add('active');
    }
}

export function showRoundMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'round-toast';
    toast.innerHTML = `<span>${message.replace(/\n/g, '<br>')}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            // Call prepareNextRound from Engine
            Engine.prepareNextRound();
        }, 300);
    }, 2500);
}

export function showGameOverModal(playerWins, enemyWins) {
    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const playerScore = document.getElementById('final-player-wins');
    const enemyScore = document.getElementById('final-enemy-wins');

    // Atualizar placar
    playerScore.textContent = playerWins;
    enemyScore.textContent = enemyWins;

    // Determinar resultado
    if (playerWins >= 2 && enemyWins >= 2) {
        title.textContent = "EMPATE!";
        title.className = "modal-title draw";
        subtitle.textContent = "Uma batalha digna de lendas!";
        icon.textContent = "⚖️";
    } else if (playerWins >= 2) {
        title.textContent = "VITÓRIA!";
        title.className = "modal-title victory";
        subtitle.textContent = "Você dominou o campo de batalha!";
        icon.textContent = "👑";
        try { audioManager.playSFX('switch'); } catch (e) { console.warn('SFX failed', e); }
    } else {
        title.textContent = "DERROTA";
        title.className = "modal-title defeat";
        subtitle.textContent = "O inimigo prevaleceu desta vez...";
        icon.textContent = "💀";
        try { audioManager.playSFX('switch'); } catch (e) { console.warn('SFX failed', e); }
    }

    // Mostrar modal
    modal.classList.remove('hidden');

    // Setup botão de jogar novamente
    const playAgainBtn = document.getElementById('play-again-btn');
    playAgainBtn.onclick = () => {
        try { audioManager.playSFX('mouseclick'); } catch (e) { }
        modal.classList.add('hidden');
        Engine.resetGame();
    };
}
