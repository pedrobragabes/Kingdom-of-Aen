import { GAME_ROWS, GAME_SIDES, calculateGameScore } from '../domain/game-state.js';
import { audioManager } from './audio.js';
import { dispatchGameCommand, gameState } from './state.js';

/** Retorna a quantidade de cartas na mão do jogador. */
export function getPlayerHandCount(state = gameState) {
    return state.players.player.hand.length;
}

/** Verifica se um parceiro já está no tabuleiro do oponente. */
export function isPartnerOnBoard(partnerName, state = gameState) {
    return GAME_ROWS.some(row => state.players.opponent.board[row]
        .some(card => card.name === partnerName));
}

/** Verifica se um parceiro ainda está na mão da IA. */
export function isPartnerInHand(partnerName, state = gameState) {
    return state.players.opponent.hand.some(card => card.name === partnerName);
}

/** Calcula uma prioridade simples e determinística para uma unidade. */
export function getCardPriority(card, state = gameState) {
    if (card.ability === 'bond_partner' && card.partner) {
        if (isPartnerOnBoard(card.partner, state)) return 100 + card.power;
        if (isPartnerInHand(card.partner, state)) return 20 + card.power;
    }
    return card.power + (card.isHero ? 5 : 0);
}

/** Decide se a IA deve economizar cartas e encerrar a rodada. */
export function shouldEnemyPass(scores, state = gameState) {
    const opponent = state.players.opponent;
    if (opponent.hand.length === 0) return true;
    if (state.players.player.passed && scores.totalOpponent > scores.totalPlayer) return true;

    const lead = scores.totalOpponent - scores.totalPlayer;
    return lead >= 12 && opponent.hand.length < getPlayerHandCount(state);
}

/** Escolhe o índice da melhor carta disponível. */
export function chooseEnemyCardIndex(state = gameState) {
    let bestIndex = -1;
    let bestPriority = -Infinity;

    state.players.opponent.hand.forEach((card, index) => {
        const priority = getCardPriority(card, state);
        if (priority > bestPriority) {
            bestPriority = priority;
            bestIndex = index;
        }
    });

    return bestIndex;
}

/** Executa exatamente uma ação da IA por comando de domínio. */
export function enemyTurn() {
    if (gameState.players.opponent.passed) return;

    const scores = calculateGameScore(gameState);
    if (shouldEnemyPass(scores, gameState)) {
        dispatchGameCommand({ type: 'PASS_SIDE', side: GAME_SIDES.OPPONENT });
        return;
    }

    const cardIndex = chooseEnemyCardIndex(gameState);
    const card = gameState.players.opponent.hand[cardIndex];
    if (!card) {
        dispatchGameCommand({ type: 'PASS_SIDE', side: GAME_SIDES.OPPONENT });
        return;
    }

    dispatchGameCommand({
        type: 'PLAY_CARD',
        side: GAME_SIDES.OPPONENT,
        instanceId: card.instanceId,
        row: card.type
    });

    try { audioManager.playSFX('card-place'); } catch { /* Audio opcional. */ }
}
