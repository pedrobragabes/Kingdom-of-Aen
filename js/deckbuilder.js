import { CARD_COLLECTION } from './data/cards.js';
import { getCardById, countDeckComposition, validateDeck, audioManager } from './utils/helpers.js';
import { initializeGameWithDeck } from './core/engine.js';

// ============================================
// DECK BUILDER - Kingdom of Aen
// ============================================

// Estado do Builder
let playerDeckIds = []; // IDs das cartas no deck do jogador
let currentFilter = 'all';

// Chave do LocalStorage
const DECK_STORAGE_KEY = 'kingdomOfAen_playerDeck';

// ============================================
// INICIALIZAÇÃO
// ============================================

function initDeckBuilder() {
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
        if (currentFilter === 'special') return card.category === 'special';
        // Usar o tipo da carta para filtro (melee/ranged/siege)
        return card.type === currentFilter && card.category !== 'special';
    });
    
    // Ordena: primeiro por tipo (units, depois specials), depois por poder
    cardsToShow.sort((a, b) => {
        // Especiais por último
        if (a.category === 'special' && b.category !== 'special') return 1;
        if (a.category !== 'special' && b.category === 'special') return -1;
        // Por poder (maior primeiro)
        return (b.power || 0) - (a.power || 0);
    });
    
    cardsToShow.forEach(card => {
        const cardEl = createBuilderCard(card);
        grid.appendChild(cardEl);
    });
}

function createBuilderCard(card) {
    const div = document.createElement('div');
    div.className = 'builder-card';
    div.dataset.cardId = card.id;
    
    // Adiciona classe se já está no deck
    if (playerDeckIds.includes(card.id)) {
        div.classList.add('in-deck');
    }
    
    // Classe especial para tipo
    if (card.category === 'special') {
        div.classList.add('special');
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
    const rowIcon = card.category === 'special' ? '✨' : (rowIcons[card.type] || '');
    
    // Ícone de habilidade
    const abilityIcons = {
        spy: '🕵️',
        spy_medic: '🕵️',
        medic: '💉',
        bond_partner: '🔗',
        decoy: '🎭',
        scorch: '🔥',
        weather: '🌨️',
        clear_weather: '☀️',
        hero: '👑'
    };
    const abilityIcon = abilityIcons[card.ability] || '';
    
    div.innerHTML = `
        ${card.category !== 'special' || card.power > 0 ? `<div class="card-strength-badge">${card.power}</div>` : ''}
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
        // Especiais por último
        if (a.category === 'special' && b.category !== 'special') return 1;
        if (a.category !== 'special' && b.category === 'special') return -1;
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
    const div = document.createElement('div');
    div.className = 'deck-card';
    div.dataset.cardId = card.id;
    
    if (card.category === 'special') {
        div.classList.add('special');
    }
    
    div.innerHTML = `
        ${card.category !== 'special' || card.power > 0 ? `<div class="card-strength-badge">${card.power}</div>` : ''}
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
    
    if (confirm('Tem certeza que deseja limpar o deck?')) {
        playerDeckIds = [];
        renderCollection(); // Atualiza status de "in-deck"
        renderDeck();
        updateStats();
        saveDeckToStorage();
    }
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
    document.getElementById('stat-specials').textContent = composition.specials;
    document.getElementById('stat-power').textContent = composition.totalPower;
    
    // Atualiza classes de validação
    const unitsItem = document.getElementById('stat-units').closest('.stat-item');
    const specialsItem = document.getElementById('stat-specials').closest('.stat-item');
    
    // Unidades: válido se >= 22
    if (composition.units >= 22) {
        unitsItem.classList.add('valid');
        unitsItem.classList.remove('invalid');
    } else {
        unitsItem.classList.add('invalid');
        unitsItem.classList.remove('valid');
    }
    
    // Especiais: válido se <= 10
    if (composition.specials <= 10) {
        specialsItem.classList.add('valid');
        specialsItem.classList.remove('invalid');
    } else {
        specialsItem.classList.add('invalid');
        specialsItem.classList.remove('valid');
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
    } catch (e) {
        console.warn('Não foi possível salvar o deck:', e);
    }
}

function loadDeckFromStorage() {
    try {
        const saved = localStorage.getItem(DECK_STORAGE_KEY);
        if (saved) {
            const ids = JSON.parse(saved);
            // Valida se os IDs ainda existem na coleção
            playerDeckIds = ids.filter(id => getCardById(id) !== null);
        }
    } catch (e) {
        console.warn('Não foi possível carregar o deck:', e);
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
        alert('Deck inválido! ' + validation.errors.join(' '));
        return;
    }
    // Play shuffle SFX when starting the battle
    try { audioManager.playSFX('shuffle'); } catch (e) { console.warn('SFX failed', e); }

    // Esconde o builder, mostra a batalha
    document.getElementById('scene-builder').classList.remove('active');
    document.getElementById('scene-battle').classList.add('active');
    
    // Inicia o jogo com o deck do jogador
    initializeGameWithDeck(playerDeckIds);
}

function backToBuilder() {
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
        if (card.type === 'unit') {
            defaultIds.push(card.id);
        }
    });
    
    return defaultIds;
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initDeckBuilder();
});
