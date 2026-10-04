import { CARD_ZONES, moveCardInstance } from './card.js';

export const GAME_SIDES = Object.freeze({ PLAYER: 'player', OPPONENT: 'opponent' });
export const GAME_ROWS = Object.freeze(['melee', 'ranged', 'siege']);

function createBoard() {
    return { melee: [], ranged: [], siege: [] };
}

function createSideState() {
    return {
        deck: [],
        hand: [],
        board: createBoard(),
        passed: false,
        wins: 0
    };
}

function freezeSide(side) {
    const board = Object.freeze(Object.fromEntries(
        GAME_ROWS.map(row => [row, Object.freeze([...side.board[row]])])
    ));
    return Object.freeze({
        ...side,
        deck: Object.freeze([...side.deck]),
        hand: Object.freeze([...side.hand]),
        board
    });
}

function freezeGameState(state) {
    return Object.freeze({
        ...state,
        players: Object.freeze({
            player: freezeSide(state.players.player),
            opponent: freezeSide(state.players.opponent)
        })
    });
}

/** Cria o estado puro e vazio de uma sessão. */
export function createGameState() {
    return freezeGameState({
        phase: 'idle',
        processing: false,
        mulliganRedraws: 2,
        players: {
            player: createSideState(),
            opponent: createSideState()
        }
    });
}

function replaceSide(state, sideId, side) {
    return {
        ...state,
        players: { ...state.players, [sideId]: side }
    };
}

function initializeSide(deck, sideId) {
    return {
        ...createSideState(),
        deck: deck.slice(10),
        hand: deck.slice(0, 10).map(card => moveCardInstance(card, {
            zone: sideId === GAME_SIDES.PLAYER ? CARD_ZONES.MULLIGAN : CARD_ZONES.HAND
        }))
    };
}

function drawFromDeck(side, count) {
    const drawn = side.deck.slice(0, count)
        .map(card => moveCardInstance(card, { zone: CARD_ZONES.HAND }));
    return {
        ...side,
        deck: side.deck.slice(drawn.length),
        hand: [...side.hand, ...drawn]
    };
}

function playFromHand(side, instanceId, row) {
    const card = side.hand.find(candidate => candidate.instanceId === instanceId);
    if (!card) throw new RangeError(`Carta ${instanceId} não está na mão.`);
    if (!GAME_ROWS.includes(row)) throw new RangeError(`Fileira inválida: ${row}.`);
    if (card.row !== 'all' && card.type !== row) {
        throw new RangeError(`${card.name} não pode ser jogada em ${row}.`);
    }

    return {
        ...side,
        hand: side.hand.filter(candidate => candidate.instanceId !== instanceId),
        board: {
            ...side.board,
            [row]: [...side.board[row], moveCardInstance(card, {
                zone: CARD_ZONES.BOARD,
                currentRow: row
            })]
        }
    };
}

/** Reducer puro de todos os comandos do núcleo jogável. */
export function gameReducer(state, command) {
    let next = state;

    switch (command.type) {
        case 'INITIALIZE_GAME':
            next = {
                ...createGameState(),
                phase: 'mulligan',
                players: {
                    player: initializeSide(command.playerDeck, GAME_SIDES.PLAYER),
                    opponent: initializeSide(command.opponentDeck, GAME_SIDES.OPPONENT)
                }
            };
            break;

        case 'MULLIGAN_REDRAW': {
            const side = state.players.player;
            if (state.phase !== 'mulligan' || state.mulliganRedraws <= 0 || !side.deck.length) return state;
            const returned = side.hand[command.handIndex];
            if (!returned) return state;
            const replacement = moveCardInstance(side.deck[0], { zone: CARD_ZONES.MULLIGAN });
            const hand = [...side.hand];
            hand[command.handIndex] = replacement;
            next = replaceSide({ ...state, mulliganRedraws: state.mulliganRedraws - 1 }, 'player', {
                ...side,
                hand,
                deck: [...side.deck.slice(1), moveCardInstance(returned, { zone: CARD_ZONES.DECK })]
            });
            break;
        }

        case 'START_BATTLE': {
            const player = state.players.player;
            next = replaceSide({ ...state, phase: 'battle' }, 'player', {
                ...player,
                hand: player.hand.map(card => moveCardInstance(card, { zone: CARD_ZONES.HAND }))
            });
            break;
        }

        case 'DRAW_CARD':
            next = replaceSide(state, command.side, drawFromDeck(
                state.players[command.side],
                command.count || 1
            ));
            break;

        case 'PLAY_CARD':
            next = replaceSide(state, command.side, playFromHand(
                state.players[command.side],
                command.instanceId,
                command.row
            ));
            break;

        case 'PASS_SIDE':
            next = replaceSide(state, command.side, {
                ...state.players[command.side],
                passed: true
            });
            break;

        case 'SET_PROCESSING':
            next = { ...state, processing: Boolean(command.value) };
            break;

        case 'AWARD_ROUND': {
            const winners = command.winner === 'draw'
                ? [GAME_SIDES.PLAYER, GAME_SIDES.OPPONENT]
                : [command.winner];
            const players = { ...state.players };
            winners.forEach(sideId => {
                players[sideId] = { ...players[sideId], wins: players[sideId].wins + 1 };
            });
            next = { ...state, players };
            break;
        }

        case 'RESET_ROUND':
            next = {
                ...state,
                processing: false,
                players: Object.fromEntries(Object.entries(state.players).map(([sideId, side]) => [sideId, {
                    ...side,
                    board: createBoard(),
                    passed: false
                }]))
            };
            break;

        default:
            return state;
    }

    return freezeGameState(next);
}

/** Calcula uma fileira sem qualquer dependência de DOM. */
export function calculateRowScore(cards) {
    const names = new Set(cards.map(card => card.name));
    return cards.reduce((total, card) => {
        const bonded = !card.isHero
            && card.ability === 'bond_partner'
            && card.partner
            && names.has(card.partner);
        return total + card.power * (bonded ? 2 : 1);
    }, 0);
}

/** Calcula totais e fileiras exclusivamente a partir de GameState. */
export function calculateGameScore(state) {
    const rows = { player: {}, opponent: {} };
    const totals = { player: 0, opponent: 0 };

    Object.keys(totals).forEach(sideId => {
        GAME_ROWS.forEach(row => {
            rows[sideId][row] = calculateRowScore(state.players[sideId].board[row]);
            totals[sideId] += rows[sideId][row];
        });
    });

    return Object.freeze({
        rows: Object.freeze(rows),
        totalPlayer: totals.player,
        totalOpponent: totals.opponent
    });
}
