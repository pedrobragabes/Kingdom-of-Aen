# Kingdom of Aen

Kingdom of Aen e um jogo de cartas tatico inspirado em duelos por fileiras, com deck builder, mulligan, vinculos entre cartas e uma IA simples para o oponente.

O projeto e uma aplicacao web estatica feita com HTML, CSS e JavaScript puro em ES Modules. Nao ha etapa de build, bundler ou framework.

## Estado Atual

- Deck builder com persistencia em `localStorage`.
- Colecao com 39 unidades.
- Partida em melhor de 3 rodadas.
- Tabuleiro com fileiras `melee`, `ranged` e `siege`.
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

1. Monte um deck no deck builder.
2. O deck precisa ter pelo menos 22 unidades.
3. Inicie a batalha e troque ate 2 cartas no mulligan.
4. Jogue cartas nas fileiras corretas ou passe a rodada.
5. Vence a rodada quem tiver a maior pontuacao total no tabuleiro.
6. Vence a partida quem ganhar 2 rodadas.

## Estrutura

```text
.
|-- index.html
|-- css/
|   `-- style.css
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

## Observacoes Importantes

Cartas sem arte cadastrada usam o visual de fallback do proprio componente. Nenhum caminho de imagem inexistente deve ser mantido nos dados; as convencoes e a lista de artes disponiveis estao em [Assets](docs/ASSETS.md).

O MVP mantem apenas as habilidades `bond_partner` e `hero`. Novas mecanicas devem entrar acompanhadas de cartas alcancaveis, regras documentadas e testes.

## Limites e planos

O modo atual e single-player contra a IA local. Multiplayer ainda exige backend, protocolo e aceitacao separados; os documentos [Escopo](docs/SCOPE.md), [Roadmap](docs/ROADMAP.md) e [Multiplayer](docs/MULTIPLAYER.md) preservam essa visao futura. A lista antiga de sprints e melhorias e historica e deve ser lida junto da validacao atual.

## Autoria

Desenvolvido por Pedro Braga e Ramon.
