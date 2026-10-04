export const CARD_ZONES = Object.freeze({
    DECK: 'deck',
    HAND: 'hand',
    MULLIGAN: 'mulligan',
    BOARD: 'board'
});

let nextCardInstanceSequence = 0;

/** Cria a definição imutável compartilhada por todas as instâncias da carta. */
export function createCardDefinition(input) {
    if (!input?.id || !input?.name || !input?.type || !Number.isFinite(input?.power)) {
        throw new TypeError('CardDefinition requer id, name, type e power válido.');
    }

    return Object.freeze({
        ...input,
        category: input.category || 'unit'
    });
}

/** Cria uma instância imutável com identidade, ownership e controle explícitos. */
export function createCardInstance(definition, options = {}) {
    if (!Object.isFrozen(definition)) {
        throw new TypeError('CardInstance requer uma CardDefinition imutável.');
    }

    const ownerId = options.ownerId;
    if (!ownerId) throw new TypeError('CardInstance requer ownerId.');

    const instanceId = options.instanceId
        || `${ownerId}:${definition.id}:${++nextCardInstanceSequence}`;

    return Object.freeze({
        ...definition,
        id: instanceId,
        instanceId,
        definitionId: definition.id,
        definition,
        ownerId,
        controllerId: options.controllerId || ownerId,
        zone: options.zone || CARD_ZONES.DECK,
        currentRow: options.currentRow || null
    });
}

/** Move uma instância sem alterar sua identidade, definição ou ownership. */
export function moveCardInstance(instance, transition) {
    if (!instance?.definition || !transition?.zone) {
        throw new TypeError('A transição requer CardInstance e zone.');
    }

    return Object.freeze({
        ...instance,
        controllerId: transition.controllerId || instance.controllerId,
        zone: transition.zone,
        currentRow: transition.currentRow ?? null
    });
}
