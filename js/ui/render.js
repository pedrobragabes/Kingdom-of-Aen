import { GAME_ROWS, GAME_SIDES, calculateGameScore } from '../domain/game-state.js';
import { ABILITY_DESCRIPTIONS, ROW_ICONS } from '../utils/helpers.js';
import { activateHandCard, dragEnd, dragStart, isCardSelected } from './interactions.js';

// ============================================
// ===       RENDERIZAÇÃO DE ELEMENTOS     ===
// ============================================

/** Reconstrói toda a interface de batalha exclusivamente a partir do GameState. */
export function renderGameState(state) {
    document.querySelectorAll('.row .cards-container, .hand-cards')
        .forEach(container => { container.innerHTML = ''; });

    if (state.phase === 'battle') {
        const handContainer = document.querySelector('.hand-cards');
        state.players.player.hand.forEach(card => {
            handContainer?.appendChild(createCardElement(card));
        });
    }

    [GAME_SIDES.PLAYER, GAME_SIDES.OPPONENT].forEach(sideId => {
        GAME_ROWS.forEach(row => {
            const container = document.querySelector(`.row.${sideId}[data-type="${row}"] .cards-container`);
            state.players[sideId].board[row].forEach(card => {
                const element = createCardElement(card);
                element.draggable = false;
                container?.appendChild(element);
            });
        });
    });

    const scores = calculateGameScore(state);
    [GAME_SIDES.PLAYER, GAME_SIDES.OPPONENT].forEach(sideId => {
        GAME_ROWS.forEach(row => {
            const score = document.querySelector(`.row.${sideId}[data-type="${row}"] .row-score`);
            if (score) score.textContent = scores.rows[sideId][row];
        });
    });

    const totals = {
        'score-total-player': scores.totalPlayer,
        'score-total-opponent': scores.totalOpponent,
        'enemy-hand-count': state.players.opponent.hand.length,
        'player-deck-count': state.players.player.deck.length
    };
    Object.entries(totals).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const playerSide = document.querySelector('.player-side');
    const opponentSide = document.querySelector('.opponent-side');
    playerSide?.classList.toggle('passed', state.players.player.passed);
    opponentSide?.classList.toggle('passed', state.players.opponent.passed);
    playerSide?.classList.toggle('active-turn', !state.processing && !state.players.player.passed);
    opponentSide?.classList.toggle('active-turn', state.processing && !state.players.opponent.passed);

    const passButton = document.getElementById('pass-button');
    if (passButton) {
        passButton.disabled = state.processing || state.players.player.passed;
        passButton.textContent = state.players.player.passed ? 'Passado' : 'Passar Rodada';
    }

    renderGems('player', state.players.player.wins);
    renderGems('opponent', state.players.opponent.wins);
}

function renderGems(sideId, count) {
    const containerId = sideId === 'player' ? 'player-gems' : 'opponent-gems';
    const gems = document.getElementById(containerId)?.querySelectorAll('.gem') || [];
    gems.forEach((gem, index) => gem.classList.toggle('active', index < count));
}

/**
 * Atualiza o contador de cartas na mão do inimigo
 */
function updateEnemyHandUI() {
    const el = document.getElementById('enemy-hand-count');
    if (el) {
        el.textContent = gameState.players.opponent.hand.length;
    }
}

/**
 * Atualiza o contador de cartas no deck do jogador
 */
function updateDeckCountUI() {
    const deckCountEl = document.getElementById('player-deck-count');
    if (deckCountEl) {
        deckCountEl.textContent = gameState.players.player.deck.length;
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
export function createCardElement(card) {
    const el = document.createElement('button');
    el.type = 'button';
    el.classList.add('card');
    el.draggable = true;
    el.setAttribute('aria-label', `${card.name}, ${card.power} pontos, ${card.type}`);
    el.setAttribute('aria-pressed', String(isCardSelected(card.instanceId)));
    el.addEventListener('click', activateHandCard);

    syncCardElementInstance(el, card);

    // Data attributes usados somente pela apresentação durante a migração do estado.
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
    if (card.row === 'all') el.classList.add('agile-card');

    // Imagem de fundo do personagem
    if (card.img) {
        el.style.backgroundImage = `url('${card.img}')`;
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

    return el;
}

/** Mantém a referência canônica da instância associada ao elemento visual. */
export function syncCardElementInstance(element, instance) {
    element.cardInstance = instance;
    element.dataset.id = instance.instanceId;
    element.dataset.definitionId = instance.definitionId;
    element.dataset.ownerId = instance.ownerId;
    element.dataset.controllerId = instance.controllerId;
    element.dataset.zone = instance.zone;
    element.dataset.currentRow = instance.currentRow || '';
}
