import { audioManager } from "../core/audio.js";
import {
  dispatchGameCommand,
  gameState,
  scheduleGameTask,
} from "../core/state.js";
import { getCardDescription } from "../utils/helpers.js";
import {
  announce,
  closeAccessibleDialog,
  openAccessibleDialog,
} from "./accessibility.js";

// ============================================
// ===       SISTEMA DE MULLIGAN           ===
// ============================================

/**
 * Inicia a fase de mulligan (troca de cartas)
 */
export function startMulligan() {
  // Atualizar contador na UI
  const redrawCountEl = document.getElementById("redraw-count");
  if (redrawCountEl) {
    redrawCountEl.textContent = gameState.mulliganRedraws;
    redrawCountEl.classList.remove("exhausted");
  }

  // Renderizar cartas no overlay
  renderMulliganCards();

  // Mostrar overlay
  const overlay = document.getElementById("mulligan-overlay");
  if (overlay) {
    openAccessibleDialog(
      overlay,
      document.getElementById("mulligan-confirm-btn"),
    );
  }

  // Setup botão de confirmar
  const confirmBtn = document.getElementById("mulligan-confirm-btn");
  if (confirmBtn) {
    confirmBtn.onclick = finishMulligan;
  }

  // Tocar SFX de shuffle
  try {
    audioManager.playSFX("shuffle");
  } catch {
    /* Audio opcional. */
  }
}

/**
 * Renderiza as cartas do mulligan no overlay
 */
function renderMulliganCards() {
  const container = document.getElementById("mulligan-cards");
  if (!container) return;

  container.innerHTML = "";

  gameState.players.player.hand.forEach((card, index) => {
    const cardEl = createMulliganCardElement(card, index);
    container.appendChild(cardEl);
  });
}

/**
 * Cria um elemento de carta para o mulligan
 * @param {Object} card - Dados da carta
 * @param {number} index - Índice da carta na mão
 * @returns {HTMLElement} Elemento da carta
 */
function createMulliganCardElement(card, index) {
  const el = document.createElement("button");
  el.type = "button";
  el.classList.add("mulligan-card");
  el.dataset.index = index;
  el.dataset.id = card.id;
  el.setAttribute("aria-label", `Trocar ${card.name}, ${card.power} pontos`);

  // Background image
  if (card.img) {
    el.style.backgroundImage = `url('${card.img}')`;
  }

  // Overlay for readability
  const overlay = document.createElement("div");
  overlay.classList.add("card-overlay");
  el.appendChild(overlay);

  // Strength badge
  const strengthBadge = document.createElement("div");
  strengthBadge.classList.add("card-strength-badge");
  strengthBadge.textContent = card.power;
  el.appendChild(strengthBadge);

  // Info container
  const infoContainer = document.createElement("div");
  infoContainer.classList.add("card-info-container");

  // Card name
  const nameDiv = document.createElement("div");
  nameDiv.classList.add("card-name");
  nameDiv.textContent = card.name;
  infoContainer.appendChild(nameDiv);

  // Card description
  const descDiv = document.createElement("div");
  descDiv.classList.add("card-desc");
  descDiv.textContent = getCardDescription(card);
  infoContainer.appendChild(descDiv);

  el.appendChild(infoContainer);

  // Click event for redraw
  el.addEventListener("click", () => redrawCard(index));

  // Disable if no redraws left
  if (gameState.mulliganRedraws <= 0) {
    el.classList.add("disabled");
    el.disabled = true;
    el.setAttribute(
      "aria-label",
      `${card.name}, ${card.power} pontos. Trocas esgotadas.`,
    );
  }

  return el;
}

/**
 * Troca uma carta durante o mulligan
 * @param {number} index - Índice da carta a trocar
 */
function redrawCard(index) {
  // Verificar se ainda pode trocar
  if (gameState.mulliganRedraws <= 0) {
    announce("Não há mais trocas disponíveis.", "error-status");
    return;
  }

  // Verificar se o deck tem cartas
  if (gameState.players.player.deck.length === 0) {
    announce("O baralho não possui cartas para troca.", "error-status");
    return;
  }

  const oldCard = gameState.players.player.hand[index];
  dispatchGameCommand(
    { type: "MULLIGAN_REDRAW", handIndex: index },
    { render: false },
  );
  const newCardWithId = gameState.players.player.hand[index];

  // 6. Atualizar UI
  const redrawCountEl = document.getElementById("redraw-count");
  if (redrawCountEl) {
    redrawCountEl.textContent = gameState.mulliganRedraws;
    if (gameState.mulliganRedraws <= 0) {
      redrawCountEl.classList.add("exhausted");
    }
  }

  // 7. Animar e re-renderizar a carta específica
  const container = document.getElementById("mulligan-cards");
  if (container) {
    const cardEl = container.querySelector(`[data-index="${index}"]`);
    if (cardEl) {
      cardEl.classList.add("swapping");

      scheduleGameTask(() => {
        const newCardEl = createMulliganCardElement(newCardWithId, index);
        newCardEl.classList.add("swapped");
        const swappedLabel = document.createElement("span");
        swappedLabel.className = "swapped-label";
        swappedLabel.textContent = "Trocada";
        newCardEl.appendChild(swappedLabel);
        newCardEl.setAttribute(
          "aria-label",
          `${newCardWithId.name}, ${newCardWithId.power} pontos. Carta trocada. ${gameState.mulliganRedraws > 0 ? "Pode trocar novamente." : "Trocas esgotadas."}`,
        );
        cardEl.replaceWith(newCardEl);
        if (gameState.mulliganRedraws > 0) newCardEl.focus();
        else document.getElementById("mulligan-confirm-btn")?.focus();
      }, 250);
    }
  }

  // 8. Desabilitar todas as cartas se não houver mais trocas
  if (gameState.mulliganRedraws <= 0) {
    scheduleGameTask(() => {
      const allCards = container.querySelectorAll(".mulligan-card");
      allCards.forEach((card) => {
        card.classList.add("disabled");
        card.disabled = true;
        if (!card.getAttribute("aria-label").includes("Trocas esgotadas"))
          card.setAttribute(
            "aria-label",
            `${card.getAttribute("aria-label")}. Trocas esgotadas.`,
          );
      });
    }, 300);
  }

  // 9. Tocar SFX
  try {
    audioManager.playSFX("card-slide");
  } catch {
    /* Audio opcional. */
  }
  announce(
    `${oldCard.name} trocada por ${newCardWithId.name}. ${gameState.mulliganRedraws} trocas restantes.`,
  );
}

/**
 * Finaliza a fase de mulligan e inicia o jogo
 */
function finishMulligan() {
  // 1. Esconder overlay
  const overlay = document.getElementById("mulligan-overlay");
  if (overlay) {
    closeAccessibleDialog(overlay);
  }

  // 2. Entrar na batalha e reconstruir a UI a partir do estado.
  dispatchGameCommand({ type: "START_BATTLE" });

  // 4. Iniciar música de batalha
  try {
    audioManager.playMusic();
  } catch {
    /* Audio opcional. */
  }

  // 5. Tocar SFX de início
  try {
    audioManager.playSFX("switch");
  } catch {
    /* Audio opcional. */
  }
  announce("Batalha iniciada. Seu turno.");
}
