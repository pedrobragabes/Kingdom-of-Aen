# Kingdom of Aen

Kingdom of Aen e um jogo de cartas tatico inspirado em duelos por fileiras, com montagem de baralho, troca inicial de cartas, vinculos entre cartas e uma IA simples para o oponente.

O projeto e uma aplicacao web estatica feita com HTML, CSS e JavaScript puro em ES Modules. Nao ha etapa de build, bundler ou framework.

## Estado Atual

- Deck builder com persistencia em `localStorage`.
- Colecao com 39 unidades.
- Partida em melhor de 3 rodadas.
- Interface em portugues: fileiras Corpo a corpo, À distância e Cerco; os IDs internos `melee`, `ranged` e `siege` permanecem estaveis.
- Estados de turno, erros, cartas no baralho, trocas e rodadas vencidas tambem aparecem em texto.
- IA baseada em prioridades para passar, administrar cartas e completar vinculos de parceiros.
- Audio de fundo e efeitos sonoros locais.

## Como Rodar

Sirva o diretorio por HTTP para que o navegador carregue os modulos:

```powershell
python -m http.server 8080
```

Depois abra:

```text
http://localhost:8080
```

Abrir `index.html` diretamente por `file://` nao e suportado por causa das regras de carregamento de ES Modules do navegador.

## Como Jogar

1. Monte um baralho na colecao. O filtro Disponiveis mostra as cartas ainda nao adicionadas.
2. O baralho precisa ter pelo menos 22 unidades.
3. Inicie a batalha e troque ate 2 cartas na preparacao inicial.
4. Selecione uma carta com clique, Enter ou Espaco e ative a fileira correta. Arrastar tambem funciona. Uma fileira incorreta apresenta uma instrucao e mantem a selecao para tentar novamente.
5. Vence a rodada quem tiver a maior pontuacao total no tabuleiro.
6. Vence a partida quem ganhar 2 rodadas.

## Estrutura

```text
.
|-- index.html
|-- css/
|   |-- style.css
|   `-- responsive.css
|-- js/
|   |-- core/
|   |-- data/
|   |-- ui/
|   |-- utils/
|   |-- deckbuilder.js
|   `-- main.js
|-- img/
|-- audio/
`-- docs/
```

## Documentacao

- [Arquitetura](docs/ARCHITECTURE.md)
- [Regras e Sistemas](docs/GAME_RULES.md)
- [Guia de Desenvolvimento](docs/DEVELOPMENT.md)
- [Assets](docs/ASSETS.md)
- [Melhorias Recomendadas](docs/IMPROVEMENTS.md)
- [Plano de Sprints](docs/SPRINTS.md)
- [Validacao da integracao em outubro de 2026](docs/VALIDACAO-2026-10-04.md)

## Verificacoes

As ferramentas de desenvolvimento usam Node 24 ou posterior; o jogo continua sem dependencias em runtime e sem build.

```powershell
npm ci
npm run lint
npm run format:check
npm run validate
npm test
npx playwright install chromium
npm run test:e2e
```

Os testes de navegador iniciam automaticamente um servidor restrito a arquivos do jogo em loopback. O CI executa esses comandos e publica coverage, screenshots, traces de falhas e resultados Axe. A protecao da main exige os checks `validate` e `gitleaks`.

## Observacoes Importantes

Cartas sem arte cadastrada usam o visual de fallback do proprio componente. Nenhum caminho de imagem inexistente deve ser mantido nos dados; as convencoes e a lista de artes disponiveis estao em [Assets](docs/ASSETS.md).

O MVP mantem apenas as habilidades `bond_partner` e `hero`. Novas mecanicas devem entrar acompanhadas de cartas alcancaveis, regras documentadas e testes.

## Limites e planos

O modo atual e single-player contra a IA local. Multiplayer ainda exige backend, protocolo e aceitacao separados; os documentos [Escopo](docs/SCOPE.md), [Roadmap](docs/ROADMAP.md) e [Multiplayer](docs/MULTIPLAYER.md) preservam essa visao futura. A lista antiga de sprints e melhorias e historica e deve ser lida junto da validacao atual.

## Autoria

Desenvolvido por Pedro Braga e Ramon.
