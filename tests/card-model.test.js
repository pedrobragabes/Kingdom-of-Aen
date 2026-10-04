import assert from 'node:assert/strict';
import test from 'node:test';
import {
    CARD_ZONES,
    createCardDefinition,
    createCardInstance,
    moveCardInstance
} from '../js/domain/card.js';

test('CardDefinition e CardInstance são imutáveis e possuem identidade única', () => {
    const definition = createCardDefinition({
        id: 'daniel_1', baseId: 'daniel', name: 'Daniel', type: 'melee', power: 2,
        partner: 'Gabriel', img: 'img/personagens/Daniel.png'
    });
    const first = createCardInstance(definition, { ownerId: 'player' });
    const second = createCardInstance(definition, { ownerId: 'player' });

    assert.equal(Object.isFrozen(definition), true);
    assert.equal(Object.isFrozen(first), true);
    assert.notEqual(first.instanceId, second.instanceId);
    assert.equal(first.definition, definition);
    assert.equal(first.definitionId, 'daniel_1');
    assert.equal(first.ownerId, 'player');
    assert.equal(first.controllerId, 'player');
});

test('transições preservam definição, identidade e ownership separando controle', () => {
    const definition = createCardDefinition({
        id: 'cozinheiros_1', baseId: 'cozinheiros', name: 'Cozinheiros', type: 'melee',
        row: 'all', power: 3, img: 'img/personagens/Cozinheiros.png', category: 'unit'
    });
    const deckCard = createCardInstance(definition, {
        instanceId: 'player:cozinheiros_1:test', ownerId: 'player'
    });
    const controlled = moveCardInstance(deckCard, {
        controllerId: 'opponent', currentRow: 'ranged', zone: CARD_ZONES.BOARD
    });

    assert.equal(controlled.instanceId, deckCard.instanceId);
    assert.equal(controlled.definition, definition);
    assert.equal(controlled.ownerId, 'player');
    assert.equal(controlled.controllerId, 'opponent');
    assert.equal(controlled.zone, 'board');
    assert.equal(controlled.currentRow, 'ranged');
    assert.equal(controlled.row, 'all');
    assert.equal(controlled.img, definition.img);
    assert.equal(controlled.category, definition.category);
});
