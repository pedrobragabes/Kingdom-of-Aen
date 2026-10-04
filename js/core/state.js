import { createGameState, gameReducer } from '../domain/game-state.js';

/** Estado canônico da sessão atual. */
export let gameState = createGameState();

/** Timers vinculados à sessão de jogo atual. */
const pendingGameTimers = new Set();
const gameStateListeners = new Set();

export function subscribeGameState(listener) {
    gameStateListeners.add(listener);
    return () => gameStateListeners.delete(listener);
}

/**
 * Aplica um comando puro e atualiza a projeção visual quando disponível.
 * @param {Object} command
 * @param {{render?: boolean}} options
 */
export function dispatchGameCommand(command, { render = true } = {}) {
    gameState = gameReducer(gameState, command);
    if (render) gameStateListeners.forEach(listener => listener(gameState));
    return gameState;
}

/** Agenda uma tarefa que será cancelada ao descartar a sessão. */
export function scheduleGameTask(callback, delay) {
    const timerId = setTimeout(() => {
        pendingGameTimers.delete(timerId);
        callback();
    }, delay);
    pendingGameTimers.add(timerId);
    return timerId;
}

/** Cancela todas as tarefas pendentes da sessão atual. */
export function cancelPendingGameTasks() {
    pendingGameTimers.forEach(timerId => clearTimeout(timerId));
    pendingGameTimers.clear();
}

/** Reseta todo o estado e cancela tarefas da sessão anterior. */
export function resetGameState() {
    cancelPendingGameTasks();
    gameState = createGameState();
}

/** Reseta o tabuleiro e os passes, mantendo decks, mãos e vitórias. */
export function resetRoundState() {
    dispatchGameCommand({ type: 'RESET_ROUND' });
}

export { pendingGameTimers };
