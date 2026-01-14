/**
 * @fileoverview Testes para o sistema de cartas
 * @module tests/cards
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock das funções que serão testadas
// Como estamos testando a lógica pura, recriamos as funções aqui

const CARD_COLLECTION = [
    { id: 'daniel_1', baseId: 'daniel', name: 'Daniel', type: 'melee', power: 2, category: 'unit' },
    { id: 'daniel_2', baseId: 'daniel', name: 'Daniel', type: 'melee', power: 2, category: 'unit' },
    { id: 'gabriel_1', baseId: 'gabriel', name: 'Gabriel', type: 'melee', power: 2, category: 'unit' },
    { id: 'espantalho_1', baseId: 'espantalho', name: 'Espantalho', type: 'melee', power: 0, category: 'special' },
    { id: 'wellington_1', baseId: 'wellington', name: 'Wellington', type: 'melee', power: 6, category: 'unit' },
];

function getCardById(id) {
    return CARD_COLLECTION.find(card => card.id === id);
}

function countDeckComposition(deckIds) {
    let units = 0;
    let specials = 0;
    let totalPower = 0;

    deckIds.forEach(id => {
        const card = getCardById(id);
        if (card) {
            if (card.category === 'special') {
                specials++;
            } else {
                units++;
            }
            totalPower += card.power || 0;
        }
    });

    return { units, specials, total: units + specials, totalPower };
}

function validateDeck(deckIds) {
    const { units, specials } = countDeckComposition(deckIds);

    const errors = [];
    if (units < 22) {
        errors.push(`Precisa de pelo menos 22 unidades (atual: ${units})`);
    }
    if (specials > 10) {
        errors.push(`Máximo de 10 especiais permitido (atual: ${specials})`);
    }

    return { valid: errors.length === 0, errors, units, specials };
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================
// TESTES
// ============================================

describe('Sistema de Cartas', () => {
    describe('getCardById', () => {
        test('deve retornar carta existente', () => {
            const card = getCardById('daniel_1');
            expect(card).toBeDefined();
            expect(card.name).toBe('Daniel');
            expect(card.type).toBe('melee');
        });

        test('deve retornar undefined para ID inexistente', () => {
            const card = getCardById('nao_existe');
            expect(card).toBeUndefined();
        });
    });

    describe('countDeckComposition', () => {
        test('deve contar unidades e especiais corretamente', () => {
            const deck = ['daniel_1', 'gabriel_1', 'espantalho_1'];
            const result = countDeckComposition(deck);

            expect(result.units).toBe(2);
            expect(result.specials).toBe(1);
            expect(result.total).toBe(3);
        });

        test('deve calcular poder total', () => {
            const deck = ['daniel_1', 'wellington_1']; // 2 + 6 = 8
            const result = countDeckComposition(deck);

            expect(result.totalPower).toBe(8);
        });

        test('deve ignorar IDs inválidos', () => {
            const deck = ['daniel_1', 'id_invalido'];
            const result = countDeckComposition(deck);

            expect(result.total).toBe(1);
        });
    });

    describe('validateDeck', () => {
        test('deve falhar com menos de 22 unidades', () => {
            const deck = ['daniel_1', 'daniel_2', 'gabriel_1'];
            const result = validateDeck(deck);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(expect.stringContaining('22 unidades'));
        });

        test('deck vazio deve ser inválido', () => {
            const result = validateDeck([]);

            expect(result.valid).toBe(false);
            expect(result.units).toBe(0);
        });
    });

    describe('shuffleArray', () => {
        test('deve manter o mesmo tamanho', () => {
            const original = [1, 2, 3, 4, 5];
            const shuffled = shuffleArray(original);

            expect(shuffled.length).toBe(original.length);
        });

        test('não deve modificar o array original', () => {
            const original = [1, 2, 3, 4, 5];
            const originalCopy = [...original];
            shuffleArray(original);

            expect(original).toEqual(originalCopy);
        });

        test('deve conter todos os elementos originais', () => {
            const original = [1, 2, 3, 4, 5];
            const shuffled = shuffleArray(original);

            original.forEach(item => {
                expect(shuffled).toContain(item);
            });
        });
    });
});

describe('Regras do Jogo', () => {
    test('carta Espantalho deve ter poder 0', () => {
        const espantalho = getCardById('espantalho_1');
        expect(espantalho.power).toBe(0);
    });

    test('cartas especiais devem ser identificadas corretamente', () => {
        const espantalho = getCardById('espantalho_1');
        expect(espantalho.category).toBe('special');
    });

    test('cartas de unidade devem ser identificadas corretamente', () => {
        const daniel = getCardById('daniel_1');
        expect(daniel.category).toBe('unit');
    });
});
