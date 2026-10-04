// ============================================
// ===       ENGINE DO JOGO                ===
// ============================================

import { GAME_SIDES, calculateGameScore } from '../domain/game-state.js';
import { audioManager } from './audio.js';
import { enemyTurn } from './ai.js';
import { announce, closeAccessibleDialog, openAccessibleDialog } from '../ui/accessibility.js';
import {
    dispatchGameCommand,
    gameState,
    resetGameState,
    scheduleGameTask
} from './state.js';

let restartGameHandler = null;

export function configureEngine({ restartGame }) {
    restartGameHandler = restartGame;
}

// ============================================
// ===       PONTUAÇÃO                     ===
// ============================================

/**
 * Compra cartas do deck.
 * @param {'player'|'opponent'} who
 * @param {number} count
 */
export function drawCard(who, count) {
    dispatchGameCommand({ type: 'DRAW_CARD', side: who, count });
}

/**
 * Atualiza a pontuação de todas as fileiras e retorna os totais
 * @returns {Object} { totalPlayer, totalOpponent }
 */
export function updateScore() {
    return calculateGameScore(gameState);
}

// ============================================
// ===       CONTROLE DE TURNOS            ===
// ============================================

const ENEMY_TURN_DELAY_MS = 1500;
const ENEMY_EFFECT_SETTLE_MS = 850;

/**
 * Passa o turno para um jogador
 * @param {string} who - 'player' ou 'opponent'
 */
export function passTurn(who) {
    if (who === 'opponent') {
        dispatchGameCommand({ type: 'PASS_SIDE', side: GAME_SIDES.OPPONENT });
        checkEndRound();
    }
}

/**
 * Atualiza os visuais de turno ativo
 */
/** Finaliza a ação da IA e devolve o controle ao jogador. */
function finishEnemyAction() {
    dispatchGameCommand({ type: 'SET_PROCESSING', value: false });
}

/**
 * Agenda uma jogada da IA. No modo contínuo, a IA segue jogando até passar.
 * @param {boolean} continuous
 */
function scheduleEnemyAction(continuous) {
    scheduleGameTask(() => {
        enemyTurn();
        if (gameState.players.opponent.passed) checkEndRound();

        if (continuous && !gameState.players.opponent.passed) {
            scheduleEnemyAction(true);
            return;
        }

        scheduleGameTask(finishEnemyAction, ENEMY_EFFECT_SETTLE_MS);
    }, ENEMY_TURN_DELAY_MS);
}

/**
 * Solicita uma ação da IA e bloqueia novas entradas até a conclusão.
 * @param {{continuous?: boolean}} options
 */
export function queueEnemyTurn({ continuous = false } = {}) {
    if (gameState.players.opponent.passed || gameState.processing) return;

    dispatchGameCommand({ type: 'SET_PROCESSING', value: true });
    scheduleEnemyAction(continuous);
}

/** Loop da IA usado depois que o jogador passa a rodada. */
export function enemyTurnLoop() {
    queueEnemyTurn({ continuous: true });
}

// ============================================
// ===       FIM DE RODADA                 ===
// ============================================

/**
 * Verifica se a rodada terminou (ambos passaram)
 */
export function checkEndRound() {
    if (gameState.players.player.passed && gameState.players.opponent.passed) {
        const scores = updateScore();
        scheduleGameTask(() => {
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

/**
 * Finaliza a rodada e atribui pontos
 * @param {string} winner - 'player', 'opponent' ou 'draw'
 */
function endRound(winner) {
    let message = "";
    dispatchGameCommand({ type: 'AWARD_ROUND', winner });
    if (winner === "player") {
        message = "Você venceu a rodada!";

    } else if (winner === "opponent") {
        message = "Oponente venceu a rodada!";
    } else {
        message = "Empate! Ambos pontuam.";
    }

    // Verificar se a partida acabou
    if (gameState.players.player.wins >= 2 || gameState.players.opponent.wins >= 2) {
        showGameOverModal();
    } else {
        showRoundMessage(message);
    }
}

/**
 * Mostra mensagem de fim de rodada
 * @param {string} message - Mensagem a mostrar
 */
function showRoundMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'round-toast';
    toast.innerHTML = `<span>${message.replace(/\n/g, '<br>')}</span>`;
    document.body.appendChild(toast);

    scheduleGameTask(() => {
        toast.classList.add('show');
    }, 100);

    scheduleGameTask(() => {
        toast.classList.remove('show');
        scheduleGameTask(() => {
            toast.remove();
            prepareNextRound();
        }, 300);
    }, 2500);
}

// ============================================
// ===       FIM DE JOGO                   ===
// ============================================

/**
 * Mostra o modal de fim de jogo
 */
function showGameOverModal() {
    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const playerScore = document.getElementById('final-player-wins');
    const enemyScore = document.getElementById('final-enemy-wins');

    // Atualizar placar
    playerScore.textContent = gameState.players.player.wins;
    enemyScore.textContent = gameState.players.opponent.wins;

    // Determinar resultado
    if (gameState.players.player.wins >= 2 && gameState.players.opponent.wins >= 2) {
        title.textContent = "EMPATE!";
        title.className = "modal-title draw";
        subtitle.textContent = "Uma batalha digna de lendas!";
        icon.textContent = "⚖️";
    } else if (gameState.players.player.wins >= 2) {
        title.textContent = "VITÓRIA!";
        title.className = "modal-title victory";
        subtitle.textContent = "Você dominou o campo de batalha!";
        icon.textContent = "👑";
        try { audioManager.playSFX('switch'); } catch { /* Audio opcional. */ }
    } else {
        title.textContent = "DERROTA";
        title.className = "modal-title defeat";
        subtitle.textContent = "O inimigo prevaleceu desta vez...";
        icon.textContent = "💀";
        try { audioManager.playSFX('switch'); } catch { /* Audio opcional. */ }
    }

    // Setup botão de jogar novamente
    const playAgainBtn = document.getElementById('play-again-btn');
    playAgainBtn.onclick = () => {
        try { audioManager.playSFX('mouseclick'); } catch (e) { }
        closeAccessibleDialog(modal);
        resetGame();
    };
    openAccessibleDialog(modal, playAgainBtn);
}

/**
 * Reseta o jogo completamente
 */
function resetGame() {
    disposeGameSession();

    restartGameHandler?.();

}

/**
 * Descarta a sessão atual sem alterar o deck salvo no builder.
 * @param {{stopAudio?: boolean}} options
 */
export function disposeGameSession({ stopAudio = false } = {}) {
    resetGameState();

    document.querySelectorAll('.row .cards-container, .hand-cards, #mulligan-cards')
        .forEach(container => { container.innerHTML = ''; });

    document.querySelectorAll('.gem').forEach(gem => gem.classList.remove('active'));
    document.querySelectorAll('.row, .player-side, .opponent-side')
        .forEach(element => element.classList.remove(
            'passed',
            'active-turn',
            'drag-over',
            'valid-target'
        ));

    document.querySelectorAll('.round-toast').forEach(toast => toast.remove());
    ['mulligan-overlay', 'game-over-modal'].forEach(id => {
        const dialog = document.getElementById(id);
        if (dialog && !dialog.classList.contains('hidden')) closeAccessibleDialog(dialog);
    });

    const passBtn = document.getElementById('pass-button');
    if (passBtn) {
        passBtn.disabled = false;
        passBtn.textContent = 'Passar Rodada';
    }

    const counters = {
        'score-total-player': '0',
        'score-total-opponent': '0',
        'enemy-hand-count': '0',
        'player-deck-count': '0'
    };
    Object.entries(counters).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    if (stopAudio) audioManager.stopMusic();
}

/**
 * Atualiza as gemas de vitória
 * @param {string} who - 'player' ou 'opponent'
 * @param {number} count - Quantidade de vitórias
 */
function updateGems(who, count) {
    const containerId = who === "player" ? "player-gems" : "opponent-gems";
    const container = document.getElementById(containerId);
    const gems = container.querySelectorAll('.gem');

    gems.forEach(gem => gem.classList.remove('active'));
    for (let i = 0; i < count; i++) {
        if (gems[i]) gems[i].classList.add('active');
    }
}

/**
 * Prepara a próxima rodada
 */
function prepareNextRound() {
    dispatchGameCommand({ type: 'RESET_ROUND' });
    drawCard('player', 1);
    drawCard('opponent', 1);

    announce('Nova rodada iniciada. Uma carta comprada por cada lado.');
}
