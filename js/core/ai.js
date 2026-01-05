// ============================================
// ===       INTELIGÊNCIA ARTIFICIAL       ===
// ============================================

// ============================================
// ===       FUNÇÕES AUXILIARES            ===
// ============================================

/**
 * Conta quantas cartas o jogador tem na mão
 * @returns {number} Quantidade de cartas na mão
 */
function getPlayerHandCount() {
    const handContainer = document.querySelector('.hand-cards');
    if (!handContainer) return 0;
    return handContainer.querySelectorAll('.card').length;
}

/**
 * Verifica se o parceiro de uma carta está no tabuleiro do inimigo
 * @param {string} partnerName - Nome do parceiro
 * @returns {boolean} true se o parceiro está no tabuleiro
 */
function isPartnerOnBoard(partnerName) {
    const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
    for (const container of opponentRows) {
        if (container.querySelector(`.card[data-name="${partnerName}"]`)) {
            return true;
        }
    }
    return false;
}

/**
 * Verifica se o parceiro de uma carta está na mão do inimigo
 * @param {string} partnerName - Nome do parceiro
 * @returns {boolean} true se o parceiro está na mão
 */
function isPartnerInHand(partnerName) {
    return enemyHand.some(c => c.name === partnerName);
}

/**
 * Encontra espiões do jogador no lado do inimigo (para recolher com Decoy)
 * @returns {Array} Array de elementos de cartas espião
 */
function findPlayerSpiesOnEnemySide() {
    const spies = [];
    const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
    opponentRows.forEach(container => {
        const cards = Array.from(container.querySelectorAll('.card'));
        cards.forEach(card => {
            if (card.classList.contains('spy-card') && card.dataset.isHero !== "true") {
                spies.push(card);
            }
        });
    });
    return spies;
}

/**
 * Encontra alvos válidos para o Decoy no lado do inimigo
 * @returns {Array} Array de objetos com informações dos alvos
 */
function findDecoyTargets() {
    const targets = [];
    const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
    opponentRows.forEach(container => {
        const cards = Array.from(container.querySelectorAll('.card'));
        cards.forEach(card => {
            if (card.dataset.isHero !== "true" && card.dataset.ability !== 'decoy') {
                targets.push({
                    element: card,
                    basePower: parseInt(card.dataset.basePower),
                    currentPower: parseInt(card.dataset.power),
                    ability: card.dataset.ability,
                    isSpy: card.classList.contains('spy-card')
                });
            }
        });
    });
    return targets;
}

/**
 * Encontra a carta mais forte no lado do JOGADOR (para avaliar Scorch)
 * @returns {Object} Objeto com a carta e seu poder
 */
function findStrongestPlayerCard() {
    let maxPower = -1;
    let strongestCard = null;
    const playerRows = document.querySelectorAll('.row.player .cards-container');
    playerRows.forEach(container => {
        const cards = Array.from(container.querySelectorAll('.card'));
        cards.forEach(card => {
            if (card.dataset.isHero !== "true") {
                const power = parseInt(card.dataset.power);
                if (power > maxPower) {
                    maxPower = power;
                    strongestCard = card;
                }
            }
        });
    });
    return { card: strongestCard, power: maxPower };
}

/**
 * Encontra a carta mais forte no lado do INIMIGO (para evitar fogo amigo)
 * @returns {Object} Objeto com a carta e seu poder
 */
function findStrongestEnemyCard() {
    let maxPower = -1;
    let strongestCard = null;
    const opponentRows = document.querySelectorAll('.row.opponent .cards-container');
    opponentRows.forEach(container => {
        const cards = Array.from(container.querySelectorAll('.card'));
        cards.forEach(card => {
            if (card.dataset.isHero !== "true") {
                const power = parseInt(card.dataset.power);
                if (power > maxPower) {
                    maxPower = power;
                    strongestCard = card;
                }
            }
        });
    });
    return { card: strongestCard, power: maxPower };
}

/**
 * Conta o total de cartas jogadas no tabuleiro
 * @returns {number} Total de cartas no tabuleiro
 */
function getTotalCardsOnBoard() {
    let count = 0;
    const allRows = document.querySelectorAll('.row .cards-container');
    allRows.forEach(container => {
        count += container.querySelectorAll('.card').length;
    });
    return count;
}

/**
 * Determina a melhor fileira para jogar cartas Agile (row: 'all')
 * @returns {string} Tipo da melhor fileira
 */
function getBestRowForAgile() {
    const rowTypes = ['melee', 'ranged', 'siege'];
    const weatherMap = { melee: 'frost', ranged: 'fog', siege: 'rain' };

    // Priorizar fileira sem clima
    for (const type of rowTypes) {
        if (!activeWeather[weatherMap[type]]) {
            return type;
        }
    }
    return 'melee'; // Default
}

// ============================================
// ===       FUNÇÃO PRINCIPAL DA IA        ===
// ============================================

/**
 * Executa o turno do inimigo com decisões táticas
 */
function enemyTurn() {
    if (enemyPassed) return;

    const scores = updateScore();
    const playerHandCount = getPlayerHandCount();
    const totalCardsOnBoard = getTotalCardsOnBoard();
    const isEarlyGame = totalCardsOnBoard < 6;
    const scoreDifference = scores.totalOpponent - scores.totalPlayer;

    console.debug('[DEBUG enemyTurn] called', { enemyPassed, playerPassed, enemyHandLength: enemyHand.length, scores, playerHandCount, totalCardsOnBoard });
    console.log(`[IA] Pontuação: Inimigo ${scores.totalOpponent} vs Jogador ${scores.totalPlayer}`);
    console.log(`[IA] Cartas na mão: Inimigo ${enemyHand.length} vs Jogador ${playerHandCount}`);

    // ==========================================
    // VERIFICAR SE DEVE USAR O LÍDER
    // ==========================================
    if (shouldEnemyUseLeader()) {
        console.log("[IA] Decidiu usar o Líder!");
        activateLeader('opponent');
        return;
    }

    // ==========================================
    // REGRA 1: VERIFICAR SE DEVE PASSAR
    // ==========================================

    // 1.1 - Mão vazia: forçar passar
    if (enemyHand.length === 0) {
        console.log("[IA] Sem cartas na mão. Passando.");
        passTurn('opponent');
        return;
    }

    // 1.2 - Jogador passou E inimigo está ganhando: PASSAR IMEDIATAMENTE
    if (playerPassed && scores.totalOpponent > scores.totalPlayer) {
        console.log("[IA] Jogador passou e estou ganhando. Passando para economizar cartas!");
        passTurn('opponent');
        return;
    }

    // 1.3 - Vantagem >= 15 pontos E menos cartas que o jogador: passar para economizar
    if (scoreDifference >= 15 && enemyHand.length < playerHandCount) {
        console.log("[IA] Grande vantagem de pontos e menos cartas. Passando estrategicamente!");
        passTurn('opponent');
        return;
    }

    // ==========================================
    // REGRA 2-6: AVALIAR PRIORIDADES DAS CARTAS
    // ==========================================

    let bestCardIndex = -1;
    let maxPriority = -1;
    let bestDecoyTarget = null;
    let bestRowOverride = null;

    enemyHand.forEach((card, index) => {
        let priority = 0;
        let decoyTarget = null;
        let rowOverride = null;

        const ability = card.ability || 'none';

        // REGRA 2: ESPIÕES
        if (ability === 'spy' || ability === 'spy_medic') {
            if (isEarlyGame) {
                priority = 100;
                console.log(`[IA] Espião ${card.name}: Prioridade 100 (início do jogo)`);
            } else if (scores.totalOpponent < scores.totalPlayer) {
                priority = 90;
                console.log(`[IA] Espião ${card.name}: Prioridade 90 (perdendo)`);
            } else if (enemyHand.length < playerHandCount) {
                priority = 80;
                console.log(`[IA] Espião ${card.name}: Prioridade 80 (menos cartas)`);
            } else {
                priority = 30;
                console.log(`[IA] Espião ${card.name}: Prioridade 30 (padrão)`);
            }
        }

        // REGRA 3: MÉDICO
        else if (ability === 'medic') {
            const validTargets = enemyGraveyard.filter(c => !c.isHero);

            if (validTargets.length === 0) {
                priority = 0;
                console.log(`[IA] Médico ${card.name}: Prioridade 0 (cemitério vazio)`);
            } else {
                const maxGravePower = Math.max(...validTargets.map(c => c.power));
                if (maxGravePower >= 5) {
                    priority = 70 + maxGravePower;
                    console.log(`[IA] Médico ${card.name}: Prioridade ${priority} (unidade forte no cemitério)`);
                } else {
                    priority = 20 + maxGravePower;
                    console.log(`[IA] Médico ${card.name}: Prioridade ${priority} (unidade fraca no cemitério)`);
                }
            }
        }

        // REGRA 4: PARCEIROS (Bond)
        else if (ability === 'bond_partner' && card.partner) {
            const partnerOnBoard = isPartnerOnBoard(card.partner);
            const partnerInHand = isPartnerInHand(card.partner);

            if (partnerOnBoard) {
                priority = 150;
                console.log(`[IA] ${card.name}: Prioridade 150 (parceiro ${card.partner} na mesa!)`);
            } else if (partnerInHand) {
                priority = card.power + 15;
                console.log(`[IA] ${card.name}: Prioridade ${priority} (parceiro na mão, preparando combo)`);
            } else {
                priority = card.power;
                console.log(`[IA] ${card.name}: Prioridade ${priority} (sem parceiro disponível)`);
            }
        }

        // REGRA 5: ESPANTALHO (Decoy)
        else if (ability === 'decoy') {
            const targets = findDecoyTargets();

            if (targets.length === 0) {
                priority = 0;
                console.log(`[IA] Decoy: Prioridade 0 (sem alvos válidos)`);
            } else {
                const playerSpies = targets.filter(t => t.isSpy);
                if (playerSpies.length > 0) {
                    const bestSpy = playerSpies.reduce((a, b) => a.basePower > b.basePower ? a : b);
                    priority = 85;
                    decoyTarget = bestSpy.element;
                    console.log(`[IA] Decoy: Prioridade 85 (recolher espião do jogador: ${bestSpy.element.dataset.name})`);
                } else {
                    const strongWeakened = targets.filter(t =>
                        t.basePower >= 6 && t.currentPower < t.basePower && !t.isSpy
                    );

                    if (strongWeakened.length > 0) {
                        const best = strongWeakened.reduce((a, b) => a.basePower > b.basePower ? a : b);
                        priority = 45 + best.basePower;
                        decoyTarget = best.element;
                        console.log(`[IA] Decoy: Prioridade ${priority} (salvar carta forte: ${best.element.dataset.name})`);
                    } else {
                        const reusable = targets.filter(t =>
                            (t.ability === 'medic' || t.ability === 'spy' || t.ability === 'spy_medic') && !t.isSpy
                        );

                        if (reusable.length > 0) {
                            const best = reusable[0];
                            priority = 40;
                            decoyTarget = best.element;
                            console.log(`[IA] Decoy: Prioridade 40 (reutilizar habilidade: ${best.element.dataset.name})`);
                        } else {
                            const strong = targets.filter(t => t.basePower >= 6 && !t.isSpy);
                            if (strong.length > 0) {
                                const best = strong.reduce((a, b) => a.basePower > b.basePower ? a : b);
                                priority = 25;
                                decoyTarget = best.element;
                                console.log(`[IA] Decoy: Prioridade 25 (salvar carta: ${best.element.dataset.name})`);
                            } else {
                                priority = 0;
                                console.log(`[IA] Decoy: Prioridade 0 (nenhum alvo vale a pena)`);
                            }
                        }
                    }
                }
            }
        }

        // REGRA 6: SCORCH (Queima)
        else if (ability === 'scorch') {
            const strongestPlayer = findStrongestPlayerCard();
            const strongestEnemy = findStrongestEnemyCard();

            if (strongestPlayer.power > 0 && strongestPlayer.power > strongestEnemy.power) {
                priority = 60 + strongestPlayer.power;
                console.log(`[IA] Scorch: Prioridade ${priority} (destruir carta de ${strongestPlayer.power} poder)`);
            } else if (strongestPlayer.power > 0 && strongestPlayer.power === strongestEnemy.power) {
                priority = 5;
                console.log(`[IA] Scorch: Prioridade 5 (empate de poder - evitando)`);
            } else {
                priority = 0;
                console.log(`[IA] Scorch: Prioridade 0 (evitando fogo amigo)`);
            }
        }

        // CARTAS CLIMÁTICAS
        else if (card.type === 'weather') {
            priority = 10;
            console.log(`[IA] Clima ${card.name}: Prioridade 10`);
        }

        // HERÓIS E UNIDADES PADRÃO
        else {
            if (card.isHero) {
                if (activeWeather.frost || activeWeather.fog || activeWeather.rain) {
                    priority = card.power + 20;
                    console.log(`[IA] Herói ${card.name}: Prioridade ${priority} (imune ao clima)`);
                } else {
                    priority = card.power + 10;
                    console.log(`[IA] Herói ${card.name}: Prioridade ${priority}`);
                }
            } else {
                priority = card.power;

                const rowType = card.row === 'all' ? getBestRowForAgile() : card.type;
                const weatherMap = { melee: 'frost', ranged: 'fog', siege: 'rain' };
                if (activeWeather[weatherMap[rowType]]) {
                    priority = Math.max(1, priority - 3);
                    console.log(`[IA] ${card.name}: Prioridade ${priority} (penalizado por clima)`);
                } else {
                    console.log(`[IA] ${card.name}: Prioridade ${priority}`);
                }

                if (card.row === 'all') {
                    rowOverride = rowType;
                }
            }
        }

        // Atualizar melhor carta
        if (priority > maxPriority) {
            maxPriority = priority;
            bestCardIndex = index;
            bestDecoyTarget = decoyTarget;
            bestRowOverride = rowOverride;
        }
    });

    // ==========================================
    // EXECUTAR A JOGADA
    // ==========================================

    // Fallback: se não encontrou boa jogada
    if (bestCardIndex === -1 || maxPriority <= 0) {
        if (scores.totalOpponent > scores.totalPlayer) {
            console.log("[IA] Sem boas jogadas e ganhando. Passando.");
            passTurn('opponent');
            return;
        }
        let minPower = Infinity;
        enemyHand.forEach((card, index) => {
            if (card.ability !== 'decoy' && card.power < minPower) {
                minPower = card.power;
                bestCardIndex = index;
            }
        });
        if (bestCardIndex === -1) {
            console.log("[IA] Apenas Decoy sem alvo. Passando.");
            passTurn('opponent');
            return;
        }
        console.log("[IA] Jogando carta de menor valor como fallback.");
    }

    const cardToPlay = enemyHand[bestCardIndex];
    console.log(`[IA] >>> Jogando: ${cardToPlay.name} (Prioridade: ${maxPriority})`);

    // Remover da mão
    enemyHand.splice(bestCardIndex, 1);
    updateEnemyHandUI();

    // EXECUTAR DECOY
    if (cardToPlay.ability === 'decoy' && bestDecoyTarget) {
        console.log(`[IA] Decoy ativado em: ${bestDecoyTarget.dataset.name}`);

        const returnedCardObj = {
            id: bestDecoyTarget.dataset.id,
            name: bestDecoyTarget.dataset.name,
            type: bestDecoyTarget.dataset.type,
            power: parseInt(bestDecoyTarget.dataset.basePower),
            ability: bestDecoyTarget.dataset.ability,
            isHero: bestDecoyTarget.dataset.isHero === "true",
            partner: bestDecoyTarget.dataset.partner,
            row: bestDecoyTarget.dataset.row
        };
        enemyHand.push(returnedCardObj);
        updateEnemyHandUI();

        const decoyElement = createCardElement(cardToPlay);
        decoyElement.draggable = false;

        const parent = bestDecoyTarget.parentNode;
        parent.insertBefore(decoyElement, bestDecoyTarget);
        bestDecoyTarget.remove();

        updateScore();
        try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }
        return;
    }

    // EXECUTAR JOGADA PADRÃO
    let targetContainer = null;

    if (cardToPlay.type === 'weather') {
        const cardElement = createCardElement(cardToPlay);
        const dummyRow = document.querySelector('.row.opponent');
        triggerAbility(cardElement, dummyRow);
        enemyGraveyard.push(cardToPlay);
        console.log(`[IA] Clima ativado: ${cardToPlay.name}`);
        try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }
    } else {
        let rowType = cardToPlay.type;
        if (cardToPlay.row === 'all') {
            rowType = bestRowOverride || getBestRowForAgile();
        }

        targetContainer = document.querySelector(`.row.opponent[data-type="${rowType}"] .cards-container`);

        if (targetContainer) {
            const cardElement = createCardElement(cardToPlay);
            cardElement.draggable = false;
            targetContainer.appendChild(cardElement);

            const row = targetContainer.closest('.row');
            triggerAbility(cardElement, row);
            try { audioManager.playSFX('card-place'); } catch (e) { console.warn('SFX failed', e); }

            console.debug('[DEBUG enemyTurn] played card', { name: cardToPlay.name, type: cardToPlay.type, row: rowType });
            console.log(`[IA] Carta jogada: ${cardToPlay.name} na fileira ${rowType}`);
        }
    }

    updateScore();
}
