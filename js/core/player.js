// ============================================
// ===       GAME STATE (PLAYER)           ===
// ============================================

export let playerDeck = [];
export let enemyDeck = [];
export let playerGraveyard = [];
export let enemyGraveyard = [];

export let playerLeader = null;
export let enemyLeader = null;
export let playerLeaderUsed = false;
export let enemyLeaderUsed = false;

export let playerWins = 0;
export let enemyWins = 0;
export let playerPassed = false;
export let enemyPassed = false;

export let enemyHand = [];

export const PLAYER_FACTION = 'alfredolandia'; // "Reinos do Norte"

// Setters for mutable state (to allow external modification if needed by Engine)
// Note: In ES6 modules, exported "let" variables are live bindings,
// so importing modules can see updates, but cannot reassign them directly.
// We need setter functions if other modules need to reassign the arrays/values entirely.

export function setPlayerDeck(deck) { playerDeck = deck; }
export function setEnemyDeck(deck) { enemyDeck = deck; }
export function setPlayerGraveyard(grave) { playerGraveyard = grave; }
export function setEnemyGraveyard(grave) { enemyGraveyard = grave; }
export function setEnemyHand(hand) { enemyHand = hand; }

export function setPlayerLeader(leader) { playerLeader = leader; }
export function setEnemyLeader(leader) { enemyLeader = leader; }
export function setPlayerLeaderUsed(used) { playerLeaderUsed = used; }
export function setEnemyLeaderUsed(used) { enemyLeaderUsed = used; }

export function setPlayerWins(wins) { playerWins = wins; }
export function setEnemyWins(wins) { enemyWins = wins; }
export function setPlayerPassed(passed) { playerPassed = passed; }
export function setEnemyPassed(passed) { enemyPassed = passed; }
