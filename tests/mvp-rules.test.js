import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getCardPriority, shouldEnemyPass } from '../js/core/ai.js';
import { CARD_COLLECTION, validateDeck } from '../js/data/cards.js';
import { calculateRowScore } from '../js/domain/game-state.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('coleção e validação expõem somente as regras do MVP', () => {
    const abilities = new Set(CARD_COLLECTION.map(card => card.ability).filter(Boolean));
    assert.deepEqual([...abilities].sort(), ['bond_partner', 'hero']);
    assert.ok(CARD_COLLECTION.every(card => card.category === 'unit'));
    const ids = CARD_COLLECTION.map(card => card.id);
    assert.equal(validateDeck(ids.slice(0, 21)).valid, false);
    assert.equal(validateDeck(ids.slice(0, 22)).valid, true);
});

test('fim de rodada não mantém transições de cemitério sem consumidor', () => {
    const lifecycleSource = ['js/core/state.js', 'js/core/engine.js']
        .map(relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')).join('\n');
    assert.doesNotMatch(lifecycleSource, /playerGraveyard|enemyGraveyard/);
});

test('bond_partner dobra somente parceiros presentes na mesma fileira', () => {
    const daniel = { name: 'Daniel', partner: 'Gabriel', ability: 'bond_partner', power: 2 };
    const gabriel = { name: 'Gabriel', partner: 'Daniel', ability: 'bond_partner', power: 2 };
    assert.equal(calculateRowScore([daniel, gabriel]), 8);
    assert.equal(calculateRowScore([daniel]), 2);
});

test('IA prioriza parceiros e preserva cartas quando a rodada já está ganha', () => {
    const emptyBoard = () => ({ melee: [], ranged: [], siege: [] });
    const makeState = ({ partnerOnBoard = false, playerPassed = false } = {}) => ({
        players: {
            player: { hand: Array(5).fill({}), board: emptyBoard(), passed: playerPassed },
            opponent: {
                hand: [{ name: 'Gabriel', power: 2 }, { name: 'Daniel', power: 2, ability: 'bond_partner', partner: 'Gabriel' }],
                board: { ...emptyBoard(), melee: partnerOnBoard ? [{ name: 'Gabriel' }] : [] },
                passed: false
            }
        }
    });
    const card = { power: 2, ability: 'bond_partner', partner: 'Gabriel' };
    assert.equal(getCardPriority(card, makeState()), 22);
    assert.equal(getCardPriority(card, makeState({ partnerOnBoard: true })), 102);
    assert.equal(shouldEnemyPass({ totalOpponent: 8, totalPlayer: 7 }, makeState({ playerPassed: true })), true);
});
