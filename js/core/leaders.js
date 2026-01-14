// ============================================
// ===       SISTEMA DE LÍDERES            ===
// ============================================

/**
 * Inicializa os líderes para o jogador e inimigo
 */
function initializeLeaders() {
    // Assign leaders - Player gets O General, Enemy gets random
    playerLeader = leaderCardsData.find(l => l.id === 'leader_general') || leaderCardsData[0];

    // Enemy gets a different random leader
    const availableEnemyLeaders = leaderCardsData.filter(l => l.id !== playerLeader.id);
    enemyLeader = availableEnemyLeaders[Math.floor(Math.random() * availableEnemyLeaders.length)] || leaderCardsData[1];

    playerLeaderUsed = false;
    enemyLeaderUsed = false;

    renderLeaderCards();
}

/**
 * Renderiza os cards dos líderes na UI
 */
function renderLeaderCards() {
    // Player Leader
    const playerLeaderCard = document.getElementById('player-leader-card');
    if (playerLeaderCard && playerLeader) {
        playerLeaderCard.querySelector('.leader-name').textContent = playerLeader.name;
        playerLeaderCard.querySelector('.leader-ability-text').textContent = getLeaderAbilityDescription(playerLeader.ability);
    }

    // Enemy Leader
    const enemyLeaderCard = document.getElementById('enemy-leader-card');
    if (enemyLeaderCard && enemyLeader) {
        enemyLeaderCard.querySelector('.leader-name').textContent = enemyLeader.name;
        enemyLeaderCard.querySelector('.leader-ability-text').textContent = getLeaderAbilityDescription(enemyLeader.ability);
    }
}

/**
 * Retorna a descrição de uma habilidade de líder
 * @param {string} ability - ID da habilidade
 * @returns {string} Descrição da habilidade
 */
function getLeaderAbilityDescription(ability) {
    const descriptions = {
        'leader_clear_weather': '☀️ Limpar Clima',
        'leader_scorch_siege': '🔥 Queimar Cerco',
        'leader_draw_card': '🃏 Comprar Carta',
        'leader_boost_melee': '⚔️ +2 Melee'
    };
    return descriptions[ability] || 'Habilidade';
}

/**
 * Configura os eventos de clique nos líderes
 */
function setupLeaders() {
    const playerLeaderSlot = document.getElementById('player-leader');
    if (playerLeaderSlot) {
        playerLeaderSlot.addEventListener('click', () => {
            if (playerLeaderUsed || playerPassed || isProcessingTurn) {
                console.log("[Líder] Não pode usar agora.");
                return;
            }
            activateLeader('player');
        });
    }
}

/**
 * Ativa a habilidade de um líder
 * @param {string} who - 'player' ou 'opponent'
 */
function activateLeader(who) {
    const leader = who === 'player' ? playerLeader : enemyLeader;
    const isUsed = who === 'player' ? playerLeaderUsed : enemyLeaderUsed;

    if (!leader || isUsed) return;

    console.log(`[Líder] ${who} ativou: ${leader.name}`);

    // Execute ability
    executeLeaderAbility(leader.ability, who);

    // Mark as used
    if (who === 'player') {
        playerLeaderUsed = true;
    } else {
        enemyLeaderUsed = true;
    }

    updateLeaderVisuals();
    updateScore();
}

/**
 * Executa a habilidade específica de um líder
 * @param {string} ability - ID da habilidade
 * @param {string} who - 'player' ou 'opponent'
 */
function executeLeaderAbility(ability, who) {
    switch (ability) {
        case 'leader_clear_weather':
            // Limpa todo o clima
            clearWeather();
            console.log(`[Líder] Clima limpo por ${who}!`);
            break;

        case 'leader_scorch_siege':
            // Destrói a carta mais forte na fileira de Cerco inimiga
            const targetSide = who === 'player' ? 'opponent' : 'player';
            const siegeRow = document.querySelector(`.row.${targetSide}[data-type="siege"] .cards-container`);
            if (siegeRow) {
                const cards = Array.from(siegeRow.querySelectorAll('.card'));
                const vulnerable = cards.filter(c => c.dataset.isHero !== "true");
                if (vulnerable.length > 0) {
                    let maxPower = -1;
                    vulnerable.forEach(c => {
                        const p = parseInt(c.dataset.power);
                        if (p > maxPower) maxPower = p;
                    });
                    const targets = vulnerable.filter(c => parseInt(c.dataset.power) === maxPower);
                    targets.forEach(card => {
                        card.classList.add('burning');
                        setTimeout(() => {
                            const cardObj = {
                                id: card.dataset.id,
                                name: card.dataset.name,
                                type: card.dataset.type,
                                power: parseInt(card.dataset.basePower),
                                ability: card.dataset.ability,
                                isHero: card.dataset.isHero === "true"
                            };
                            if (targetSide === 'opponent') {
                                enemyGraveyard.push(cardObj);
                            } else {
                                playerGraveyard.push(cardObj);
                            }
                            card.remove();
                            updateScore();
                        }, 800);
                    });
                    console.log(`[Líder] Destruiu ${targets.length} carta(s) de cerco!`);
                }
            }
            break;

        case 'leader_draw_card':
            // Compra 1 carta
            drawCard(who === 'player' ? 'player' : 'opponent', 1);
            console.log(`[Líder] ${who} comprou 1 carta!`);
            break;

        case 'leader_boost_melee':
            // Adiciona +2 a todas unidades Melee do lado de quem ativou
            const meleeSide = who === 'player' ? 'player' : 'opponent';
            const meleeRow = document.querySelector(`.row.${meleeSide}[data-type="melee"] .cards-container`);
            if (meleeRow) {
                const cards = meleeRow.querySelectorAll('.card');
                cards.forEach(card => {
                    if (card.dataset.isHero !== "true") {
                        const currentBase = parseInt(card.dataset.basePower);
                        card.dataset.basePower = currentBase + 2;
                    }
                });
                console.log(`[Líder] +2 poder para ${cards.length} unidades Melee!`);
            }
            break;
    }
}

/**
 * Atualiza os visuais dos líderes (usado/disponível)
 */
function updateLeaderVisuals() {
    const playerSlot = document.getElementById('player-leader');
    const enemySlot = document.getElementById('enemy-leader');
    const playerCard = document.getElementById('player-leader-card');
    const enemyCard = document.getElementById('enemy-leader-card');

    // Player Leader
    if (playerSlot && playerCard) {
        if (playerLeaderUsed) {
            playerSlot.classList.add('used');
            playerCard.classList.add('used');
            playerCard.classList.remove('clickable', 'my-turn');
        } else {
            playerSlot.classList.remove('used');
            playerCard.classList.remove('used');

            // Show clickable indicator when it's player's turn
            if (!playerPassed && !isProcessingTurn) {
                playerCard.classList.add('clickable', 'my-turn');
            } else {
                playerCard.classList.remove('clickable', 'my-turn');
            }
        }
    }

    // Enemy Leader
    if (enemySlot && enemyCard) {
        if (enemyLeaderUsed) {
            enemySlot.classList.add('used');
            enemyCard.classList.add('used');
        } else {
            enemySlot.classList.remove('used');
            enemyCard.classList.remove('used');
        }
    }
}

/**
 * IA: Decide se o inimigo deve usar o líder
 * @returns {boolean} true se deve usar o líder
 */
function shouldEnemyUseLeader() {
    if (enemyLeaderUsed || !enemyLeader) return false;

    const ability = enemyLeader.ability;

    switch (ability) {
        case 'leader_clear_weather':
            // Usar se clima está afetando negativamente o inimigo
            const enemyAffected = (activeWeather.frost || activeWeather.fog || activeWeather.rain);
            if (enemyAffected) {
                const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
                let affectedCount = 0;
                opponentRows.forEach(container => {
                    const cards = container.querySelectorAll('.card');
                    cards.forEach(card => {
                        if (card.dataset.isHero !== "true") {
                            const current = parseInt(card.dataset.power);
                            const base = parseInt(card.dataset.basePower);
                            if (current < base) affectedCount++;
                        }
                    });
                });
                return affectedCount >= 2;
            }
            return false;

        case 'leader_scorch_siege':
            // Usar se jogador tem carta forte em siege
            const playerSiege = document.querySelector('.row.player[data-type="siege"] .cards-container');
            if (playerSiege) {
                const cards = Array.from(playerSiege.querySelectorAll('.card'));
                const strong = cards.filter(c => c.dataset.isHero !== "true" && parseInt(c.dataset.power) >= 6);
                return strong.length > 0;
            }
            return false;

        case 'leader_draw_card':
            // Usar se está com poucas cartas na mão
            return enemyHand.length <= 3;

        case 'leader_boost_melee':
            // Usar se tem 3+ cartas em melee
            const enemyMelee = document.querySelector('.row.opponent[data-type="melee"] .cards-container');
            if (enemyMelee) {
                return enemyMelee.querySelectorAll('.card').length >= 3;
            }
            return false;
    }

    return false;
}
