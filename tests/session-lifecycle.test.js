import assert from 'node:assert/strict';
import test from 'node:test';
import { audioManager } from '../js/core/audio.js';
import { disposeGameSession, queueEnemyTurn } from '../js/core/engine.js';
import {
    gameState,
    pendingGameTimers,
    resetGameState,
    scheduleGameTask
} from '../js/core/state.js';

function createClassList(initial = []) {
    const values = new Set(initial);
    return {
        add: (...names) => names.forEach(name => values.add(name)),
        contains: name => values.has(name),
        remove: (...names) => names.forEach(name => values.delete(name))
    };
}

function createElement({ classes = [], innerHTML = 'content', textContent = '9' } = {}) {
    return { classList: createClassList(classes), disabled: true, innerHTML,
        remove() { this.removed = true; }, removed: false, textContent };
}

function loadHarness() {
    resetGameState();
    const containers = [createElement(), createElement(), createElement()];
    const gems = [createElement({ classes: ['active'] }), createElement({ classes: ['active'] })];
    const visualElements = [createElement({ classes: ['passed', 'active-turn'] }), createElement({ classes: ['drag-over'] })];
    const toast = createElement();
    const elementsById = Object.fromEntries([
        'mulligan-overlay', 'game-over-modal', 'pass-button', 'score-total-player',
        'score-total-opponent', 'enemy-hand-count', 'player-deck-count'
    ].map(id => [id, createElement()]));
    const selectors = new Map([
        ['.row .cards-container, .hand-cards, #mulligan-cards', containers],
        ['.gem', gems], ['.row, .player-side, .opponent-side', visualElements], ['.round-toast', [toast]]
    ]);
    let nextTimerId = 1;
    const timerCallbacks = new Map();
    const clearedTimers = [];
    globalThis.document = {
        getElementById: id => elementsById[id] || null,
        querySelectorAll: selector => selectors.get(selector) || []
    };
    globalThis.setTimeout = callback => { const id = nextTimerId++; timerCallbacks.set(id, callback); return id; };
    globalThis.clearTimeout = id => { clearedTimers.push(id); timerCallbacks.delete(id); };
    let stopped = false;
    audioManager.stopMusic = () => { stopped = true; };
    return {
        clearedTimers, containers, elementsById, gems, stopped: () => stopped, toast, visualElements,
        runNextTimer() {
            const next = [...timerCallbacks.entries()].sort(([a], [b]) => a - b)[0];
            assert.ok(next, 'expected a pending timer');
            timerCallbacks.delete(next[0]);
            next[1]();
        }
    };
}

test('disposeGameSession cancela timers e limpa toda a UI da partida', () => {
    const harness = loadHarness();
    scheduleGameTask(() => {}, 100);
    scheduleGameTask(() => {}, 200);
    disposeGameSession({ stopAudio: true });
    assert.deepEqual(harness.clearedTimers, [1, 2]);
    assert.equal(pendingGameTimers.size, 0);
    harness.containers.forEach(container => assert.equal(container.innerHTML, ''));
    harness.gems.forEach(gem => assert.equal(gem.classList.contains('active'), false));
    assert.equal(harness.toast.removed, true);
    assert.equal(harness.elementsById['pass-button'].disabled, false);
    assert.equal(harness.stopped(), true);
});

test('queueEnemyTurn mantém a entrada bloqueada até o efeito terminar', () => {
    const harness = loadHarness();
    queueEnemyTurn();
    assert.equal(gameState.processing, true);
    harness.runNextTimer();
    assert.equal(gameState.processing, true);
    harness.runNextTimer();
    assert.equal(gameState.processing, false);
});
