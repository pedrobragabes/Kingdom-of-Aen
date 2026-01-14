# 📜 Kingdom of Aen - Contexto Completo do Projeto

> **Última atualização:** 14 de Janeiro de 2026  
> **Autores:** Pedro Braga e Ramon  
> **Versão:** 1.1.0

---

## 🎮 O Que É Este Projeto?

**Kingdom of Aen (KoA)** é um jogo de cartas estratégico (TCG/CCG) inspirado no **Gwent** do universo The Witcher. O projeto é uma digitalização e evolução de um jogo de cartas físico originalmente criado e impresso manualmente.

O nome "Aen" é uma homenagem às iniciais de uma instituição (A.E.N.), recontextualizada como um antigo reino de fantasia medieval.

---

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| **HTML5** | Estrutura das páginas (index.html) |
| **CSS3** | Estilização completa (style.css - 2200+ linhas) |
| **JavaScript (Vanilla ES6+)** | Toda a lógica do jogo |
| **LocalStorage** | Persistência do deck do jogador |
| **Audio API** | Música de fundo e efeitos sonoros |
| **Jest** | Framework de testes automatizados |

> ⚠️ **NÃO usa frameworks** como React, Vue ou Angular. É 100% vanilla JavaScript.

---

## 📁 Estrutura de Arquivos

```
Kingdom-of-Aen-main/
├── index.html                 # Página única com todas as cenas
├── README.md                  # Documentação básica do projeto
├── contexto.md               # (Este arquivo) Documentação completa
├── package.json              # Configuração npm e scripts de teste
├── .gitignore                # Configuração do Git
│
├── css/
│   └── style.css             # Todos os estilos (2200+ linhas)
│                              # Inclui media queries para responsividade
│
├── js/
│   ├── main.js               # Inicialização do jogo
│   ├── deckbuilder.js        # Sistema de construção de deck
│   │
│   ├── core/                 # Núcleo do motor do jogo
│   │   ├── state.js          # Estado global (variáveis do jogo)
│   │   ├── engine.js         # Motor de pontuação e turnos
│   │   ├── ai.js             # Inteligência artificial do oponente
│   │   ├── abilities.js      # Habilidades das cartas
│   │   ├── leaders.js        # Sistema de líderes
│   │   └── audio.js          # Gerenciador de áudio
│   │
│   ├── ui/                   # Interface do usuário
│   │   ├── render.js         # Renderização de cartas/elementos
│   │   ├── interactions.js   # Drag and drop
│   │   └── mulligan.js       # Fase de troca de cartas inicial
│   │
│   ├── data/
│   │   └── cards.js          # Base de dados de todas as cartas
│   │
│   ├── modules/              # Versões ES6 Module (preparação futura)
│   │   └── cards.module.js   # Versão modular de cards.js
│   │
│   └── utils/
│       └── helpers.js        # Funções utilitárias (ES6 exports)
│
├── tests/                    # Testes automatizados (Jest)
│   ├── cards.test.js         # Testes do sistema de cartas
│   └── engine.test.js        # Testes do motor do jogo
│
├── audio/                    # Arquivos de áudio
│   ├── music_bg.mp3          # Música de fundo
│   ├── card-place-*.ogg      # Sons de jogar carta
│   └── ...                   # Outros efeitos sonoros
│
└── img/
    ├── personagens/          # Imagens das cartas com arte
    │   ├── Daniel.png, Gabriel.png, Wellington.png
    │   ├── Suelly.png, Adriano.png, Thiago.png
    │   ├── Geleia.png, Corredores.png, Cozinheiros.png
    │   └── Espantalho.png
    └── icons/                # Ícones das fileiras
        ├── icon-melee.png
        ├── icon-ranged.png
        └── icon-siege.png
```

---

## 🎯 Fluxo do Jogo

### 1. **Cena 1: Deck Builder** (`#scene-builder`)
- Jogador monta seu deck selecionando cartas da coleção
- Regras: Mínimo 22 unidades, Máximo 10 especiais
- Deck é salvo no LocalStorage

### 2. **Transição: Mulligan** (Overlay)
- Jogador pode trocar até 2 cartas da mão inicial
- Cartas trocadas voltam ao deck

### 3. **Cena 2: Batalha** (`#scene-battle`)
- Tabuleiro com 3 fileiras por lado (Melee, Ranged, Siege)
- Sistema de turnos alternados
- Objetivo: Vencer 2 de 3 rodadas

### 4. **Modal: Game Over**
- Mostra resultado final (Vitória/Derrota/Empate)
- Opção de jogar novamente ou voltar ao Deck Builder

---

## 🃏 Sistema de Cartas

### Estrutura de uma Carta (cards.js)
```javascript
{
    id: 'daniel_1',           // ID único
    baseId: 'daniel',         // ID base (para múltiplas cópias)
    name: 'Daniel',           // Nome exibido
    type: 'melee',            // Tipo: melee | ranged | siege | weather
    power: 2,                 // Força base da carta
    img: 'img/personagens/Daniel.png',  // Imagem
    ability: 'bond_partner',  // Habilidade especial
    partner: 'Gabriel',       // Parceiro do vínculo
    category: 'unit',         // Categoria: unit | special
    isHero: false            // Se é herói (imune a efeitos)
}
```

### Tipos de Fileiras
| Tipo | Ícone | Clima que Afeta |
|------|-------|-----------------|
| **Melee** | ⚔️ | Frost (Geada) |
| **Ranged** | 🏹 | Fog (Névoa) |
| **Siege** | 🏰 | Rain (Chuva) |

### Habilidades Disponíveis
| Habilidade | Descrição |
|------------|-----------|
| `bond_partner` | Dobra poder quando parceiro está na mesa |
| `tight_bond` | Dobra poder para cada cópia na mesma fileira |
| `spy` | Vai para o lado inimigo, jogador compra cartas |
| `spy_medic` | Espião + Médico combinados |
| `medic` | Revive uma carta do cemitério |
| `decoy` | Espantalho - troca lugar com carta no campo |
| `scorch` | Queima a carta mais forte da fileira inimiga |
| `hero` | Imune a todos os efeitos |

---

## 🤖 Inteligência Artificial (ai.js)

A IA segue um sistema de **prioridades** para decidir qual carta jogar:

1. **Prioridade 100+**: Espiões no início do jogo
2. **Prioridade 150**: Parceiros quando o outro já está na mesa
3. **Prioridade 85**: Usar Decoy em espiões do jogador
4. **Prioridade 70+**: Médico com boas cartas no cemitério
5. **Prioridade padrão**: Poder da carta

### Decisões de Passar
- Se a mão está vazia → Passa
- Se jogador passou E IA está ganhando → Passa
- Se vantagem ≥ 15 pontos E menos cartas que o jogador → Passa

---

## 👑 Sistema de Líderes (leaders.js)

Cada jogador tem um líder com habilidade única (uso único por partida):

| Líder | Habilidade |
|-------|------------|
| **O General** | Limpa todos os efeitos climáticos |
| **O Usurpador** | Destrói carta mais forte em Siege inimigo |
| **O Arquimago** | Compra 1 carta imediatamente |
| **O Senhor da Guerra** | +2 poder para todas unidades Melee |

---

## 🔊 Sistema de Áudio (audio.js)

Classe `AudioManager` gerencia:
- Música de fundo (loop)
- Efeitos sonoros (SFX) com variações aleatórias
- Toggle de mute (salvo no LocalStorage)

```javascript
// Uso
audioManager.playSFX('card-place');
audioManager.playMusic();
audioManager.toggleMute();
```

---

## 💾 Estado Global (state.js)

Variáveis globais que mantêm o estado do jogo:

```javascript
// Clima
let activeWeather = { frost: false, fog: false, rain: false };

// Mãos e Decks
let enemyHand = [];
let playerDeck = [];
let enemyDeck = [];

// Turnos
let playerPassed = false;
let enemyPassed = false;
let isProcessingTurn = false;

// Vitórias (melhor de 3)
let playerWins = 0;
let enemyWins = 0;

// Cemitérios
let playerGraveyard = [];
let enemyGraveyard = [];

// Líderes
let playerLeader = null;
let enemyLeader = null;
let playerLeaderUsed = false;
let enemyLeaderUsed = false;
```

---

## 🔧 Funções Importantes

### Motor do Jogo (engine.js)
```javascript
updateScore()       // Recalcula pontuação de todas as fileiras
passTurn(who)       // Passa o turno para 'player' ou 'opponent'
checkEndRound()     // Verifica se ambos passaram
endRound(winner)    // Finaliza rodada e atribui pontos
prepareNextRound()  // Prepara para próxima rodada
resetGame()         // Reseta completamente o jogo
```

### Renderização (render.js)
```javascript
createCardElement(card)   // Cria elemento DOM de uma carta
renderHand()              // Renderiza mão do jogador
renderHandFromCards(arr)  // Renderiza mão a partir de array
updateEnemyHandUI()       // Atualiza contador de cartas inimigas
updateDeckCountUI()       // Atualiza contador do deck
```

### Deck Builder (deckbuilder.js)
```javascript
initDeckBuilder()         // Inicializa o builder
addCardToDeck(cardId)     // Adiciona carta ao deck
removeCardFromDeck(cardId) // Remove carta do deck
validateDeck(deckIds)     // Valida se deck está correto
saveDeckToStorage()       // Salva no LocalStorage
startBattle()             // Inicia a batalha
```

---

## 📊 Histórico de Melhorias

### ✅ Versão 2.1.0 (14/01/2026 - Atual)
1. **Melhorias de Design (HD+)**:
   - Suporte a monitores largos (>1600px) com layout limitado a 90%
   - Aumento de tamanho de cartas, ícones e fontes em alta resolução
   - Prevenção de achatamento (`flex-shrink: 0`) nas cartas
2. **Refatoração Modular**:
   - Migração para padrão IIFE com namespace `KoA`
   - Melhora na organização do código e compatibilidade `file://`

### ✅ Versão 1.1.0 (14/01/2026)
1. ~~**Espaçamento de cartas quebrado**~~ → Corrigido CSS de `.cards-container`
2. ~~**Duplicação de código**~~ → `shuffleArray` removida de `cards.js`
3. ~~**Funções deprecated**~~ → `applyDecoy`, `applyTightBond` removidas
4. ~~**Imagens quebradas**~~ → Placeholder CSS para cartas sem imagem
5. ~~**Responsividade mobile**~~ → Media queries para tablets/celulares
6. ~~**Testes automatizados**~~ → Jest + testes para cards e engine
7. ~~**Preparação ES6 Modules**~~ → Arquivos `.module.js` criados

### ✅ Versão 1.0.0 (Inicial)
- Implementação base do jogo
- Deck Builder funcional
- Sistema de batalha completo
- IA básica

---

## 📱 Responsividade

O CSS agora inclui media queries para:

| Breakpoint | Dispositivo | Mudanças |
|------------|-------------|----------|
| `≥1600px` | Monitores Largos | Layout 90%, fontes/ícones maiores |
| `≤1024px` | Tablets | Cartas menores, layout compacto |
| `≤768px` | Mobile | Layout vertical, líderes ocultos |
| `≤480px` | Mobile pequeno | Cartas muito compactas |
| Paisagem | Mobile rotacionado | Altura reduzida |

---

## 🧪 Testes Automatizados

### Executar Testes
```bash
# Instalar dependências (primeira vez)
npm install

# Rodar todos os testes
npm test

# Rodar testes em modo watch
npm run test:watch
```

### Cobertura de Testes
- `tests/cards.test.js` - Sistema de cartas, validação de deck
- `tests/engine.test.js` - Motor do jogo, clima, pontuação

---

## 🚀 Como Rodar o Projeto

### Produção (simples)
Abra `index.html` diretamente no navegador

### Desenvolvimento
```bash
# Servidor local (recomendado)
npm run dev

# Ou com Python
python -m http.server 8000

# Ou com extensão Live Server do VS Code
```

---

## 📝 Convenções de Código

- **Nomenclatura**: camelCase para funções e variáveis
- **Comentários**: JSDoc para funções públicas
- **Organização**: Arquivos separados por responsabilidade
- **Constantes**: UPPER_SNAKE_CASE (ex: `CARD_COLLECTION`)
- **Módulos**: Arquivos `.module.js` para versões ES6

---

## �️ Imagens Faltando

As seguintes imagens precisam ser criadas (pasta `assets/`):

**Líderes:**
- `leader_general.png`
- `leader_usurper.png`
- `leader_archmage.png`
- `leader_warlord.png`

**Personagens:**
- `anderson.png`, `vanessa.png`, `pattenberg.png`
- `marcelo.png`, `clarice.png`, `jacy.png`
- `kariel.png`, `jassyhara.png`
- `eliel.png`, `ritatril.png`, `marcus.png`

> 📌 **Nota:** Cartas sem imagem exibem um placeholder visual (padrão xadrez)

---

## 📌 Notas para Desenvolvimento Futuro

1. Os arquivos em `js/modules/` estão prontos para migração ES6
2. A constante `PLAYER_FACTION` está hardcoded como 'alfredolandia'
3. O inimigo sempre usa cartas da `CARD_COLLECTION`
4. Considerar PWA com Service Worker para offline
5. Multiplayer via WebSocket seria interessante

---

*Este documento serve como referência completa para entender, manter e expandir o projeto Kingdom of Aen.*
