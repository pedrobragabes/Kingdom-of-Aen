import { audioManager } from './core/audio.js';
import { disposeGameSession } from './core/engine.js';
import { announce } from './ui/accessibility.js';
import {
    CARD_COLLECTION,
    countDeckComposition,
    getCardById,
    validateDeck
} from './data/cards.js';

// ============================================
// DECK BUILDER - Kingdom of Aen
// ============================================

// Estado do Builder
let playerDeckIds = []; // IDs das cartas no deck do jogador
let currentFilter = 'all';
let startGameHandler = null;
let clearConfirmationPending = false;

export function configureDeckBuilder({ startGame }) {
    startGameHandler = startGame;
}
export function getPlayerDeckIds() {
    return [...playerDeckIds];
}

// Chave do LocalStorage
const DECK_STORAGE_KEY = 'kingdomOfAen_playerDeck';

// ============================================
// INICIALIZAÇÃO
// ============================================

export function initDeckBuilder() {
    loadDeckFromStorage();
    renderCollection();
    renderDeck();
    updateStats();
    setupBuilderEvents();
}

// ============================================
// RENDERIZAÇÃO DA COLEÇÃO
// ============================================

function renderCollection() {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Filtra e ordena as cartas
    let cardsToShow = CARD_COLLECTION.filter(card => {
        if (currentFilter === 'all') return true;
        return card.type === currentFilter;
    });
    
    // Ordena: primeiro por tipo (units, depois specials), depois por poder
    cardsToShow.sort((a, b) => {
        return (b.power || 0) - (a.power || 0);
    });
    
    cardsToShow.forEach(card => {
        const cardEl = createBuilderCard(card);
        grid.appendChild(cardEl);
    });
}

function createBuilderCard(card) {
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'builder-card';
    div.dataset.cardId = card.id;
    div.setAttribute('aria-label', `Adicionar ${card.name}, ${card.power} pontos ao deck`);

    if (card.img) {
        div.style.backgroundImage = `url('${card.img}')`;
        div.classList.add('has-art');
    }
    
    // Adiciona classe se já está no deck
    if (playerDeckIds.includes(card.id)) {
        div.classList.add('in-deck');
    }
    
    if (card.isHero) {
        div.classList.add('hero');
    }
    
    // Ícone da fileira
    const rowIcons = {
        melee: '⚔️',
        ranged: '🏹',
        siege: '🏰'
    };
    const rowIcon = rowIcons[card.type] || '';
    
    // Ícone de habilidade
    const abilityIcons = {
        bond_partner: '🔗',
        hero: '👑'
    };
    const abilityIcon = abilityIcons[card.ability] || '';
    
    div.innerHTML = `
        <div class="card-strength-badge">${card.power}</div>
        <div class="row-icon">${rowIcon}</div>
        <div class="card-img-placeholder"></div>
        <div class="card-name">${card.name}</div>
        ${abilityIcon ? `<div class="ability-badge">${abilityIcon}</div>` : ''}
    `;
    
    // Evento de clique para adicionar ao deck
    div.addEventListener('click', () => addCardToDeck(card.id));
    
    return div;
}

// ============================================
// RENDERIZAÇÃO DO DECK
// ============================================

function renderDeck() {
    const grid = document.getElementById('deck-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Converte IDs para cards e ordena
    const deckCards = playerDeckIds.map(id => getCardById(id)).filter(c => c);
    
    // Ordena por fileira e poder
    deckCards.sort((a, b) => {
        // Por tipo (melee, ranged, siege)
        const rowOrder = { melee: 0, ranged: 1, siege: 2 };
        const rowDiff = (rowOrder[a.type] || 3) - (rowOrder[b.type] || 3);
        if (rowDiff !== 0) return rowDiff;
        // Por poder
        return (b.power || 0) - (a.power || 0);
    });
    
    deckCards.forEach(card => {
        const cardEl = createDeckCard(card);
        grid.appendChild(cardEl);
    });
}

function createDeckCard(card) {
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'deck-card';
    div.dataset.cardId = card.id;
    div.setAttribute('aria-label', `Remover ${card.name} do deck`);

    if (card.img) {
        div.style.backgroundImage = `url('${card.img}')`;
        div.classList.add('has-art');
    }
    
    div.innerHTML = `
        <div class="card-strength-badge">${card.power}</div>
        <div class="card-name">${card.name}</div>
        <div class="remove-hint">✕</div>
    `;
    
    // Evento de clique para remover do deck
    div.addEventListener('click', () => removeCardFromDeck(card.id));
    
    return div;
}

// ============================================
// LÓGICA DE ADICIONAR/REMOVER
// ============================================

function addCardToDeck(cardId) {
    // Verifica se já está no deck
    if (playerDeckIds.includes(cardId)) {
        return;
    }
    
    // Adiciona ao deck
    playerDeckIds.push(cardId);
    
    // Atualiza visual
    const collectionCard = document.querySelector(`.builder-card[data-card-id="${cardId}"]`);
    if (collectionCard) {
        collectionCard.classList.add('in-deck', 'adding');
        setTimeout(() => collectionCard.classList.remove('adding'), 300);
    }
    
    renderDeck();
    updateStats();
    saveDeckToStorage();
}

function removeCardFromDeck(cardId) {
    const index = playerDeckIds.indexOf(cardId);
    if (index === -1) return;
    
    // Animação de remoção
    const deckCard = document.querySelector(`.deck-card[data-card-id="${cardId}"]`);
    if (deckCard) {
        deckCard.classList.add('removing');
    }
    
    setTimeout(() => {
        // Remove do array
        playerDeckIds.splice(index, 1);
        
        // Atualiza visual da coleção
        const collectionCard = document.querySelector(`.builder-card[data-card-id="${cardId}"]`);
        if (collectionCard) {
            collectionCard.classList.remove('in-deck');
        }
        
        renderDeck();
        updateStats();
        saveDeckToStorage();
    }, 250);
}

function clearDeck() {
    if (playerDeckIds.length === 0) return;

    const clearButton = document.getElementById('clear-deck-btn');
    if (!clearConfirmationPending) {
        clearConfirmationPending = true;
        clearButton.textContent = 'Confirmar limpeza';
        announce('Pressione novamente para confirmar a limpeza do deck.', 'error-status');
        setTimeout(() => {
            clearConfirmationPending = false;
            clearButton.textContent = '🗑️ Limpar';
        }, 5000);
        return;
    }

    clearConfirmationPending = false;
    clearButton.textContent = '🗑️ Limpar';
    playerDeckIds = [];
    renderCollection();
    renderDeck();
    updateStats();
    saveDeckToStorage();
    announce('Deck limpo.');
}

// ============================================
// ESTATÍSTICAS E VALIDAÇÃO
// ============================================

function updateStats() {
    const composition = countDeckComposition(playerDeckIds);
    const validation = validateDeck(playerDeckIds);
    
    // Atualiza valores
    document.getElementById('stat-total').textContent = composition.total;
    document.getElementById('stat-units').textContent = composition.units;
    document.getElementById('stat-power').textContent = composition.totalPower;
    
    // Atualiza classes de validação
    const unitsItem = document.getElementById('stat-units').closest('.stat-item');
    
    // Unidades: válido se >= 22
    if (composition.units >= 22) {
        unitsItem.classList.add('valid');
        unitsItem.classList.remove('invalid');
    } else {
        unitsItem.classList.add('invalid');
        unitsItem.classList.remove('valid');
    }
    
    // Mensagem de validação
    const msgEl = document.getElementById('validation-message');
    const playBtn = document.getElementById('start-game-btn');
    
    if (validation.valid) {
        msgEl.textContent = '✓ Deck válido! Pronto para batalha.';
        msgEl.classList.add('valid');
        playBtn.disabled = false;
    } else {
        msgEl.textContent = validation.errors.join(' • ');
        msgEl.classList.remove('valid');
        playBtn.disabled = true;
    }
}

// ============================================
// PERSISTÊNCIA (LocalStorage)
// ============================================

function saveDeckToStorage() {
    try {
        localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(playerDeckIds));
    } catch { /* Storage indisponível: a sessão continua em memória. */ }
}

function loadDeckFromStorage() {
    try {
        const saved = localStorage.getItem(DECK_STORAGE_KEY);
        if (saved) {
            const ids = JSON.parse(saved);
            // Valida se os IDs ainda existem na coleção
            playerDeckIds = ids.filter(id => getCardById(id) !== null);
        }
    } catch {
        playerDeckIds = [];
    }
}

// ============================================
// EVENTOS DO BUILDER
// ============================================

function setupBuilderEvents() {
    // Filtros
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderCollection();
        });
    });
    
    // Botão Limpar
    const clearBtn = document.getElementById('clear-deck-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => { try { audioManager.playSFX('mouseclick'); } catch (err) {} ; clearDeck(); });
    }
    
    // Botão Iniciar Batalha
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.addEventListener('click', (e) => { try { audioManager.playSFX('mouseclick'); } catch (err) {} ; startBattle(); });
    }
    
    // Botão Voltar ao Builder (no modal de fim de jogo)
    const backBtn = document.getElementById('back-to-builder-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => { try { audioManager.playSFX('mouseclick'); } catch (err) {} ; backToBuilder(); });
    }
}

// ============================================
// TRANSIÇÃO ENTRE CENAS
// ============================================

function startBattle() {
    const validation = validateDeck(playerDeckIds);
    if (!validation.valid) {
        announce(`Deck inválido. ${validation.errors.join(' ')}`, 'error-status');
        return;
    }

    disposeGameSession();

    // Play shuffle SFX when starting the battle
    try { audioManager.playSFX('shuffle'); } catch { /* Audio opcional. */ }

    // Esconde o builder, mostra a batalha
    document.getElementById('scene-builder').classList.remove('active');
    document.getElementById('scene-battle').classList.add('active');
    
    // Inicia o jogo com o deck do jogador
    startGameHandler?.([...playerDeckIds]);
}

export function backToBuilder() {
    disposeGameSession({ stopAudio: true });

    // Esconde a batalha e o modal
    document.getElementById('scene-battle').classList.remove('active');
    document.getElementById('game-over-modal').classList.add('hidden');
    
    // Mostra o builder
    document.getElementById('scene-builder').classList.add('active');
    
    // Atualiza a coleção (para refletir estado atual do deck)
    renderCollection();
    updateStats();
}

// Função auxiliar para criar um deck inicial padrão
function createDefaultDeck() {
    // Seleciona automaticamente cartas para um deck mínimo válido
    const defaultIds = [];
    
    // Adiciona todas as cartas de unidade disponíveis
    CARD_COLLECTION.forEach(card => {
        if (card.category === 'unit') {
            defaultIds.push(card.id);
        }
    });
    
    return defaultIds;
}
// End of deck builder.
