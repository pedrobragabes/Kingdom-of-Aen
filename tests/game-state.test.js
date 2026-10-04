import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { CARD_ZONES, createCardDefinition, createCardInstance } from '../js/domain/card.js';
import { calculateGameScore, createGameState, gameReducer } from '../js/domain/game-state.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function makeDeck(ownerId, count = 12) {
    return Array.from({ length: count }, (_, index) => {
        const partner = index === 0 ? 'Gabriel' : index === 1 ? 'Daniel' : undefined;
        const name = index === 0 ? 'Daniel' : index === 1 ? 'Gabriel' : `Unit ${index}`;
        return createCardInstance(createCardDefinition({
            id: `${ownerId}_${index}`, name, type: 'melee', power: 2,
            ability: partner ? 'bond_partner' : undefined, partner
        }), { ownerId });
    });
}

test('reducer executa sessão, mulligan, jogada e pontuação sem DOM', () => {
    let state = gameReducer(createGameState(), {
        type: 'INITIALIZE_GAME', playerDeck: makeDeck('player'), opponentDeck: makeDeck('opponent')
    });
    assert.equal(state.phase, 'mulligan');
    assert.equal(state.players.player.hand.length, 10);
    assert.equal(state.players.player.deck.length, 2);
    assert.equal(state.players.player.hand[0].zone, CARD_ZONES.MULLIGAN);

    const returnedId = state.players.player.hand[2].instanceId;
    state = gameReducer(state, { type: 'MULLIGAN_REDRAW', handIndex: 2 });
    assert.notEqual(state.players.player.hand[2].instanceId, returnedId);
    assert.equal(state.players.player.deck.at(-1).instanceId, returnedId);

    state = gameReducer(state, { type: 'START_BATTLE' });
    for (const name of ['Gabriel', 'Daniel']) {
        const card = state.players.player.hand.find(candidate => candidate.name === name);
        state = gameReducer(state, { type: 'PLAY_CARD', side: 'player', instanceId: card.instanceId, row: 'melee' });
    }
    assert.equal(calculateGameScore(state).totalPlayer, 8);
    assert.equal(Object.isFrozen(state), true);
});

test('estado pode ser serializado e recriado sem consultar document', () => {
    let state = gameReducer(createGameState(), {
        type: 'INITIALIZE_GAME', playerDeck: makeDeck('player'), opponentDeck: makeDeck('opponent')
    });
    state = gameReducer(state, { type: 'START_BATTLE' });
    const snapshot = JSON.parse(JSON.stringify(state));
    assert.equal(snapshot.players.player.hand.length, 10);
    assert.equal(snapshot.players.opponent.deck.length, 2);
    assert.equal(snapshot.phase, 'battle');
});

test('domínio e decisões da IA não dependem de DOM ou dataset', () => {
    ['js/domain/card.js', 'js/domain/game-state.js', 'js/core/ai.js'].forEach(relativePath => {
        const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
        assert.doesNotMatch(source, /\b(?:document|dataset)\b/, relativePath);
    });
});
