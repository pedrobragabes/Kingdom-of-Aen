/**
 * @fileoverview Testes para o motor do jogo (engine)
 * @module tests/engine
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// ============================================
// MOCK DO ESTADO DO JOGO
// ============================================

let gameState = {
    activeWeather: { frost: false, fog: false, rain: false },
    playerWins: 0,
    enemyWins: 0,
    playerPassed: false,
    enemyPassed: false
};

// ============================================
// FUNÇÕES DO ENGINE (recriadas para teste)
// ============================================

function resetGameState() {
    gameState = {
        activeWeather: { frost: false, fog: false, rain: false },
        playerWins: 0,
        enemyWins: 0,
        playerPassed: false,
        enemyPassed: false
    };
}

function applyWeather(type) {
    if (['frost', 'fog', 'rain'].includes(type)) {
        gameState.activeWeather[type] = true;
    }
}

function clearWeather() {
    gameState.activeWeather = { frost: false, fog: false, rain: false };
}

function isRoundOver() {
    return gameState.playerPassed && gameState.enemyPassed;
}

function determineRoundWinner(playerScore, enemyScore) {
    if (playerScore > enemyScore) return 'player';
    if (enemyScore > playerScore) return 'enemy';
    return 'draw';
}

function awardRoundWin(winner) {
    if (winner === 'player') {
        gameState.playerWins++;
    } else if (winner === 'enemy') {
        gameState.enemyWins++;
    } else if (winner === 'draw') {
        gameState.playerWins++;
        gameState.enemyWins++;
    }
}

function isGameOver() {
    return gameState.playerWins >= 2 || gameState.enemyWins >= 2;
}

function determineGameWinner() {
    if (gameState.playerWins >= 2 && gameState.enemyWins >= 2) return 'draw';
    if (gameState.playerWins >= 2) return 'player';
    if (gameState.enemyWins >= 2) return 'enemy';
    return null;
}

function calculateCardPower(basePower, isHero, isWeathered, hasBond, bondMultiplier = 2) {
    if (isHero) return basePower; // Heróis são imunes ao clima

    let power = basePower;

    // Clima reduz poder para 1
    if (isWeathered) {
        power = 1;
    }

    // Bond dobra o poder
    if (hasBond && !isWeathered) {
        power *= bondMultiplier;
    }

    return power;
}

// ============================================
// TESTES
// ============================================

describe('Motor do Jogo (Engine)', () => {
    beforeEach(() => {
        resetGameState();
    });

    describe('Sistema de Clima', () => {
        test('deve aplicar frost corretamente', () => {
            applyWeather('frost');
            expect(gameState.activeWeather.frost).toBe(true);
            expect(gameState.activeWeather.fog).toBe(false);
            expect(gameState.activeWeather.rain).toBe(false);
        });

        test('deve limpar todos os climas', () => {
            applyWeather('frost');
            applyWeather('fog');
            clearWeather();

            expect(gameState.activeWeather.frost).toBe(false);
            expect(gameState.activeWeather.fog).toBe(false);
            expect(gameState.activeWeather.rain).toBe(false);
        });

        test('múltiplos climas podem estar ativos', () => {
            applyWeather('frost');
            applyWeather('rain');

            expect(gameState.activeWeather.frost).toBe(true);
            expect(gameState.activeWeather.rain).toBe(true);
        });
    });

    describe('Sistema de Turnos', () => {
        test('rodada termina quando ambos passam', () => {
            gameState.playerPassed = true;
            gameState.enemyPassed = true;

            expect(isRoundOver()).toBe(true);
        });

        test('rodada não termina se apenas um passa', () => {
            gameState.playerPassed = true;
            gameState.enemyPassed = false;

            expect(isRoundOver()).toBe(false);
        });
    });

    describe('Sistema de Pontuação', () => {
        test('deve determinar vencedor com maior pontuação', () => {
            expect(determineRoundWinner(50, 30)).toBe('player');
            expect(determineRoundWinner(30, 50)).toBe('enemy');
        });

        test('empate quando pontuação igual', () => {
            expect(determineRoundWinner(40, 40)).toBe('draw');
        });

        test('deve atribuir vitória corretamente', () => {
            awardRoundWin('player');
            expect(gameState.playerWins).toBe(1);
            expect(gameState.enemyWins).toBe(0);
        });

        test('empate dá ponto para ambos', () => {
            awardRoundWin('draw');
            expect(gameState.playerWins).toBe(1);
            expect(gameState.enemyWins).toBe(1);
        });
    });

    describe('Fim de Jogo', () => {
        test('jogo termina com 2 vitórias', () => {
            gameState.playerWins = 2;
            expect(isGameOver()).toBe(true);
        });

        test('jogo não termina com 1 vitória', () => {
            gameState.playerWins = 1;
            gameState.enemyWins = 1;
            expect(isGameOver()).toBe(false);
        });

        test('determina vencedor corretamente', () => {
            gameState.playerWins = 2;
            gameState.enemyWins = 1;
            expect(determineGameWinner()).toBe('player');
        });

        test('empate quando ambos têm 2 vitórias', () => {
            gameState.playerWins = 2;
            gameState.enemyWins = 2;
            expect(determineGameWinner()).toBe('draw');
        });
    });

    describe('Cálculo de Poder das Cartas', () => {
        test('carta normal mantém poder base', () => {
            expect(calculateCardPower(5, false, false, false)).toBe(5);
        });

        test('herói é imune ao clima', () => {
            expect(calculateCardPower(9, true, true, false)).toBe(9);
        });

        test('clima reduz poder para 1', () => {
            expect(calculateCardPower(5, false, true, false)).toBe(1);
        });

        test('bond dobra o poder', () => {
            expect(calculateCardPower(4, false, false, true)).toBe(8);
        });

        test('clima ignora bond (poder = 1)', () => {
            expect(calculateCardPower(4, false, true, true)).toBe(1);
        });
    });
});

describe('Regras Especiais', () => {
    test('melhor de 3 rodadas', () => {
        // Simulação de partida completa
        resetGameState();

        // Rodada 1: Player vence
        awardRoundWin('player');
        expect(isGameOver()).toBe(false);

        // Rodada 2: Enemy vence
        awardRoundWin('enemy');
        expect(isGameOver()).toBe(false);

        // Rodada 3: Player vence (2-1)
        awardRoundWin('player');
        expect(isGameOver()).toBe(true);
        expect(determineGameWinner()).toBe('player');
    });
});
