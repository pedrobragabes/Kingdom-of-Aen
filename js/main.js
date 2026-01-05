import * as Engine from './core/engine.js';
import * as Render from './ui/render.js';
import * as Interactions from './ui/interactions.js';
import { audioManager } from './utils/helpers.js';
// We also need to expose initializeGameWithDeck for DeckBuilder
import { initializeGameWithDeck } from './core/engine.js';
// And maybe playCard if requested, though not in target architecture explicitly as a separate file.
// The prompt said "Ex: window.playCard = playCard;" as example of hotfix.
// But we don't have playCard function. We have drag and drop.

// Wire up dependencies
// Inject UI functions into Engine
Engine.setUIAdapter({
    renderHandFromCards: Render.renderHandFromCards,
    createCardElement: Render.createCardElement,
    renderMulliganCards: Render.renderMulliganCards,
    renderLeaderCards: Render.renderLeaderCards,
    updateLeaderVisuals: Render.updateLeaderVisuals,
    updateTurnVisuals: Render.updateTurnVisuals,
    updateEnemyHandUI: Render.updateEnemyHandUI,
    updateDeckCountUI: Render.updateDeckCountUI,
    updateWeatherVisuals: Render.updateWeatherVisuals,
    updateGems: Render.updateGems,
    updateScore: Render.updateScore,
    showRoundMessage: Render.showRoundMessage,
    showGameOverModal: Render.showGameOverModal,
    createMulliganCardElement: Render.createMulliganCardElement
});

document.addEventListener('DOMContentLoaded', () => {
    // NÃO inicializar automaticamente - esperar pelo Deck Builder
    Interactions.setupDragAndDrop();
    Interactions.setupControls();
    Interactions.setupLeaders();

    // Start music on first user interaction
    document.addEventListener('click', () => {
        try { audioManager.playMusic(); } catch (e) { console.warn('Audio start failed', e); }
    }, { once: true });

    // Create mute/unmute toggle button (Logic copied from script.js)
    try {
        const btn = document.createElement('button');
        btn.id = 'audio-toggle-btn';
        btn.title = 'Mute / Unmute Audio';
        btn.className = 'audio-toggle';
        const setLabel = (muted) => btn.textContent = muted ? '🔇' : '🔊';
        setLabel(audioManager.sfxMuted || audioManager.musicMuted);
        btn.addEventListener('click', (e) => {
            const newMuted = audioManager.toggleMute();
            setLabel(newMuted);
        });
        btn.style.position = 'fixed';
        btn.style.right = '12px';
        btn.style.top = '12px';
        btn.style.zIndex = 9999;
        btn.style.background = 'rgba(0,0,0,0.6)';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.padding = '8px 10px';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        document.body.appendChild(btn);
    } catch (e) { console.warn('Failed to create audio toggle', e); }
});

// EXPOSE GLOBALS FOR COMPATIBILITY
window.initializeGameWithDeck = initializeGameWithDeck;
window.audioManager = audioManager;
// Expose interaction functions to window for legacy HTML attribute compatibility
window.dragStart = Interactions.dragStart;
window.dragEnd = Interactions.dragEnd;
window.dragOver = Interactions.dragOver;
window.dragLeave = Interactions.dragLeave;
window.drop = Interactions.drop;
window.passTurn = Engine.passTurn;
