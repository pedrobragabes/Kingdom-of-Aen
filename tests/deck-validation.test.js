import assert from "node:assert/strict";
import test from "node:test";
import {
  CARD_COLLECTION,
  countDeckComposition,
  idsToCards,
  validateDeck,
} from "../js/data/cards.js";
import { shuffleArray } from "../js/utils/helpers.js";
import {
  calculateGameScore,
  createGameState,
  gameReducer,
} from "../js/domain/game-state.js";

const ids = CARD_COLLECTION.slice(0, 22).map((card) => card.id);

test("deck exige 22 cópias conhecidas e distintas, sem inflar composição por duplicatas", () => {
  assert.equal(validateDeck(ids).valid, true);
  assert.equal(validateDeck(ids.slice(0, 21)).valid, false);
  assert.equal(validateDeck(Array(22).fill(ids[0])).valid, false);
  assert.equal(countDeckComposition(Array(22).fill(ids[0])).units, 1);
  assert.equal(validateDeck([...ids, "unknown-card"]).valid, false);
  assert.equal(validateDeck(null).valid, false);
  assert.equal(validateDeck({ ids }).valid, false);
  assert.equal(validateDeck([...ids, 1]).valid, false);
  assert.equal(
    countDeckComposition(ids).totalPower,
    CARD_COLLECTION.slice(0, 22).reduce((sum, card) => sum + card.power, 0),
  );
});

test("shuffle preserva todas as cópias e não modifica a entrada", () => {
  const original = [...ids];
  for (let attempt = 0; attempt < 20; attempt++) {
    const shuffled = shuffleArray(ids);
    assert.notEqual(shuffled, ids);
    assert.deepEqual([...shuffled].sort(), [...ids].sort());
    assert.deepEqual(ids, original);
  }
  assert.deepEqual(shuffleArray([]), []);
});

test("passe, vitória, reset e compra com deck vazio preservam cartas e placar", () => {
  let state = gameReducer(createGameState(), {
    type: "INITIALIZE_GAME",
    playerDeck: idsToCards(ids.slice(0, 11), "player"),
    opponentDeck: idsToCards(ids.slice(0, 11), "opponent"),
  });
  state = gameReducer(state, { type: "START_BATTLE" });
  const card = state.players.player.hand[0];
  state = gameReducer(state, {
    type: "PLAY_CARD",
    side: "player",
    instanceId: card.instanceId,
    row: card.type,
  });
  assert.equal(calculateGameScore(state).totalPlayer, card.power);
  state = gameReducer(state, { type: "PASS_SIDE", side: "player" });
  state = gameReducer(state, { type: "PASS_SIDE", side: "opponent" });
  assert.equal(state.players.player.passed, true);
  assert.equal(state.players.opponent.passed, true);
  state = gameReducer(state, { type: "AWARD_ROUND", winner: "player" });
  state = gameReducer(state, { type: "RESET_ROUND" });
  assert.equal(state.players.player.wins, 1);
  assert.equal(state.players.player.passed, false);
  assert.equal(calculateGameScore(state).totalPlayer, 0);
  state = gameReducer(state, { type: "DRAW_CARD", side: "player", count: 5 });
  assert.equal(state.players.player.deck.length, 0);
  assert.equal(state.players.player.hand.length, 10);
  const empty = state;
  state = gameReducer(state, { type: "DRAW_CARD", side: "player" });
  assert.equal(
    state.players.player.hand.length,
    empty.players.player.hand.length,
  );
});
