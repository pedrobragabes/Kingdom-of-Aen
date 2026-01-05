import { audioManager } from '../utils/helpers.js';
import * as Player from '../core/player.js';
import * as Engine from '../core/engine.js';
// We import Engine to call functions like passTurn, activateLeader
// Render is imported to update visuals directly if needed, but usually Engine handles logic updates
// which trigger UI updates. But drag events update UI classes.
import * as Render from './render.js';

// ============================================
// ===           INTERACTIONS              ===
// ============================================

export function setupDragAndDrop() {
    // Select only Player rows for drop targets
    const playerRows = document.querySelectorAll('.row.player');

    playerRows.forEach(row => {
        row.addEventListener('dragover', dragOver);
        row.addEventListener('dragleave', dragLeave);
        row.addEventListener('drop', drop);
    });
}

export function dragStart(e) {
    if (Player.playerPassed || Engine.isProcessingTurn) {
        e.preventDefault();
        return;
    }

    // Decoy Validation: Check if there are valid targets
    if (e.target.dataset.ability === 'decoy') {
        const playerRows = document.querySelectorAll('.row.player .cards-container');
        let hasTarget = false;

        playerRows.forEach(container => {
            const cards = Array.from(container.querySelectorAll('.card'));
            cards.forEach(c => {
                if (c.dataset.isHero !== "true" && c.dataset.ability !== "decoy") {
                    hasTarget = true;
                }
            });
        });

        if (!hasTarget) {
            e.preventDefault();
            alert("Não há unidades para recolher!");
            return;
        }
    }

    // Store card ID and Type in dataTransfer
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.dataTransfer.setData('card-type', e.target.dataset.type);

    // Visual feedback
    e.target.classList.add('dragging');
}

export function dragEnd(e) {
    e.target.classList.remove('dragging');
}

export function dragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
    if (Player.playerPassed) return;
    const row = e.currentTarget;
    row.classList.add('drag-over');
}

export function dragLeave(e) {
    const row = e.currentTarget;
    row.classList.remove('drag-over');
}

export function drop(e) {
    e.preventDefault();
    const row = e.currentTarget;
    row.classList.remove('drag-over');

    if (Player.playerPassed || Engine.isProcessingTurn) return;

    // Retrieve data
    const cardId = e.dataTransfer.getData('text/plain');
    const cardType = e.dataTransfer.getData('card-type');
    const rowType = row.dataset.type;

    const card = document.querySelector(`.card[data-id="${cardId}"]`);
    if (!card) return;

    const isAgile = card.dataset.agile === 'true';

    // Validation: Card Type must match Row Type OR Card is Weather OR Card is Agile
    if (cardType === 'weather' || cardType === rowType || isAgile) {
        if (card) {
            // Decoy Check: Cannot be dropped on row (must target a card)
            if (card.dataset.ability === 'decoy') {
                console.log("Espantalho jogado no vazio. Ação cancelada.");
                return;
            }

            if (cardType === 'weather') {
                // Trigger Ability
                Engine.triggerAbility(card, row);

                // Move to graveyard immediately (visual discard)
                const cardObj = {
                    id: card.dataset.id,
                    name: card.dataset.name,
                    type: card.dataset.type,
                    power: parseInt(card.dataset.basePower),
                    ability: card.dataset.ability,
                    isHero: card.dataset.isHero === "true"
                };
                Player.playerGraveyard.push(cardObj);

                card.remove(); // Remove from hand/drag source

                // Update Score (Weather effect applied)
                // Engine updateScore will be called inside triggerAbility usually?
                // Or we call it explicitly.
                Render.updateScore(Engine.activeWeather);

                // Play SFX for playing a card (weather)
                try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }

                // Trigger Enemy Turn (apenas UMA carta)
                if (!Player.enemyPassed) {
                    Engine.setIsProcessingTurn(true);
                    Render.updateTurnVisuals();
                    setTimeout(() => {
                        Engine.enemyTurn();
                        Engine.setIsProcessingTurn(false);
                        Render.updateTurnVisuals();
                    }, 1500);
                }
            } else {
                // Move card to the row's card container
                const cardsContainer = row.querySelector('.cards-container');
                cardsContainer.appendChild(card);

                // Disable drag for played card
                card.draggable = false;
                card.classList.remove('dragging');

                // Trigger Ability
                Engine.triggerAbility(card, row);

                // Update Score
                Render.updateScore(Engine.activeWeather);

                // Play SFX for playing a card (normal)
                try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }

                // Handle Special Cards (Spells) - Remove after use
                if (card.dataset.kind === 'special') {
                    setTimeout(() => {
                        // Move to graveyard
                        const cardObj = {
                            id: card.dataset.id,
                            name: card.dataset.name,
                            type: card.dataset.type,
                            kind: card.dataset.kind,
                            power: parseInt(card.dataset.basePower),
                            ability: card.dataset.ability,
                            isHero: card.dataset.isHero === "true"
                        };
                        Player.playerGraveyard.push(cardObj);

                        // Remove from board
                        card.remove();
                        Render.updateScore(Engine.activeWeather); // Update again after removal
                    }, 1000); // Wait for animation/effect
                }

                // Trigger Enemy Turn (apenas UMA carta)
                if (!Player.enemyPassed) {
                    Engine.setIsProcessingTurn(true);
                    Render.updateTurnVisuals();
                    setTimeout(() => {
                        Engine.enemyTurn();
                        Engine.setIsProcessingTurn(false);
                        Render.updateTurnVisuals();
                    }, 1500);
                }
            }
        }
    } else {
        console.log(`Jogada Inválida: Carta ${cardType} não pode ir na fileira ${rowType}.`);
    }
}

export function setupControls() {
    const passBtn = document.getElementById('pass-button');
    if (passBtn) {
        passBtn.addEventListener('click', () => {
            if (Player.playerPassed || Engine.isProcessingTurn) return;

            Player.setPlayerPassed(true);
            passBtn.disabled = true;
            passBtn.textContent = "Passado";
            console.log("Jogador passou a vez.");

            // Visual update
            document.querySelector('.player-side').classList.add('passed');
            Render.updateTurnVisuals();

            // Play button SFX
            try { audioManager.playSFX('switch'); } catch (e) { console.warn('SFX failed', e); }

            // If player passes, enemy plays until they win or pass
            if (!Player.enemyPassed) {
                Engine.enemyTurnLoop();
            } else {
                Engine.checkEndRound();
            }
        });
    }
}

export function setupLeaders() {
    const playerLeaderSlot = document.getElementById('player-leader');
    if (playerLeaderSlot) {
        playerLeaderSlot.addEventListener('click', () => {
            if (Player.playerLeaderUsed || Player.playerPassed || Engine.isProcessingTurn) {
                console.log("[Líder] Não pode usar agora.");
                return;
            }
            Engine.activateLeader('player');
        });
    }
}
