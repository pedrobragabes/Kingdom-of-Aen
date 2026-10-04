import { GAME_SIDES } from '../domain/game-state.js';
import { audioManager } from '../core/audio.js';
import { queueEnemyTurn } from '../core/engine.js';
import { dispatchGameCommand, gameState } from '../core/state.js';
import { announce } from './accessibility.js';

let selectedCardId = null;

export function isCardSelected(instanceId) {
    return selectedCardId === instanceId;
}

export function activateHandCard(event) {
    const card = event.currentTarget;
    if (card.dataset.zone !== 'hand' || gameState.processing || gameState.players.player.passed) return;
    selectedCardId = selectedCardId === card.dataset.id ? null : card.dataset.id;
    document.querySelectorAll('.hand-cards .card').forEach(element => {
        const selected = element.dataset.id === selectedCardId;
        element.classList.toggle('selected', selected);
        element.setAttribute('aria-pressed', String(selected));
    });
    announce(selectedCardId ? `${card.dataset.name} selecionada. Escolha uma fileira.` : 'Seleção cancelada.');
}

export function dragStart(event) {
    if (gameState.players.player.passed || gameState.processing) {
        event.preventDefault();
        return;
    }
    event.dataTransfer.setData('text/plain', event.target.dataset.id);
    event.target.classList.add('dragging');
}

export function dragEnd(event) {
    event.target.classList.remove('dragging');
}

export function setupDragAndDrop() {
    document.querySelectorAll('.row.player').forEach(row => {
        row.addEventListener('dragover', event => {
            event.preventDefault();
            if (!gameState.players.player.passed && !gameState.processing) row.classList.add('drag-over');
        });
        row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
        row.addEventListener('drop', event => {
            event.preventDefault();
            row.classList.remove('drag-over');
            playCard(event.dataTransfer.getData('text/plain'), row);
        });
        row.addEventListener('click', () => playSelectedCard(row));
        row.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                playSelectedCard(row);
            }
        });
    });
}

function playSelectedCard(row) {
    if (!selectedCardId) {
        announce('Selecione uma carta antes de escolher a fileira.', 'error-status');
        return;
    }
    playCard(selectedCardId, row);
}

function playCard(cardId, row) {
    if (!cardId || gameState.players.player.passed || gameState.processing) return;
    try {
        selectedCardId = null;
        dispatchGameCommand({
            type: 'PLAY_CARD',
            side: GAME_SIDES.PLAYER,
            instanceId: cardId,
            row: row.dataset.type
        });
        announce('Carta jogada. Turno do oponente.');
    } catch (error) {
        announce(error.message, 'error-status');
        return;
    }
    try { audioManager.playSFX('card-place'); } catch { /* Audio opcional. */ }
    if (!gameState.players.opponent.passed) queueEnemyTurn();
}
