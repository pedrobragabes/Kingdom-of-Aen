# Guia de Desenvolvimento

Este projeto nao usa framework, bundler ou dependencias externas. A aplicacao usa ES Modules nativos, com imports e exports explicitos a partir de `js/main.js`.

## Rodando Localmente

Use um servidor local; `file://` nao carrega os modulos de forma portavel:

```powershell
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Onde Mexer

| Tarefa | Arquivos principais |
| --- | --- |
| Adicionar cartas | `js/data/cards.js` |
| Ajustar modelo de carta | `js/domain/card.js` |
| Ajustar estado ou comando | `js/domain/game-state.js` |
| Ajustar regra de deck | `js/data/cards.js`, `js/deckbuilder.js` |
| Ajustar habilidade do MVP | `js/domain/game-state.js`, `js/utils/helpers.js`, `js/core/ai.js` |
| Ajustar IA | `js/core/ai.js` |
| Ajustar pontuacao | `js/domain/game-state.js` |
| Ajustar visual das cartas | `js/ui/render.js`, `css/style.css` |
| Ajustar deck builder | `js/deckbuilder.js`, `css/style.css` |
| Ajustar audio | `js/core/audio.js`, `audio/` |

## Adicionando uma Carta

1. Adicione um objeto em `CARD_COLLECTION`.
2. Use um `id` unico para cada copia.
3. Use o mesmo `baseId` para copias da mesma carta.
4. Confirme que `type` e `category` estao corretos.
5. Se tiver arte, coloque a imagem em `img/personagens/` ou atualize o caminho.
6. Se usar habilidade nova, adicione a descricao em `ABILITY_DESCRIPTIONS`.
7. Teste no deck builder, no mulligan e no tabuleiro.

Exemplo:

```js
{
  id: 'nova_carta_1',
  baseId: 'nova_carta',
  name: 'Nova Carta',
  type: 'melee',
  power: 4,
  img: 'img/personagens/Nova Carta.png',
  ability: 'bond_partner',
  partner: 'Outra Carta',
  category: 'unit'
}
```

## Alterando uma Habilidade

O MVP aceita apenas `bond_partner` e `hero`. Uma expansao desse conjunto deve incluir a regra no motor, prioridade correspondente na IA quando aplicavel, descricao na interface, dados alcancaveis e testes automatizados na mesma mudanca.

## Checklist Manual de Teste

Antes de considerar uma alteracao pronta:

- O deck builder abre sem erro no console.
- Filtros de colecao funcionam.
- O deck salva e recarrega ao atualizar a pagina.
- A validacao impede iniciar com deck invalido.
- O mulligan permite no maximo 2 trocas.
- Cartas so entram em fileiras validas.
- Vinculos de parceiros alteram a pontuacao apenas na mesma fileira.
- O botao de passar encerra a rodada quando os dois lados passam.
- O placar e as gemas atualizam corretamente.
- O modal final aparece ao atingir 2 vitorias.
- O botao de audio alterna mute sem quebrar a partida.

## Validacao Automatizada

Rode o validador para conferir dados, referencias de assets e audios:

```powershell
node .\scripts\validate-project.js
```

Para tratar avisos como erro:

```powershell
node .\scripts\validate-project.js --strict
```

## Debug Util

Limpar deck salvo:

```js
localStorage.removeItem('kingdomOfAen_playerDeck')
```

Limpar mute salvo:

```js
localStorage.removeItem('audioMuted')
```

Ver deck salvo:

```js
JSON.parse(localStorage.getItem('kingdomOfAen_playerDeck') || '[]')
```

## Cuidados

- Exponha novas dependencias com `import`/`export`; nao crie simbolos em `globalThis`.
- Evite criar novas globais quando uma funcao existente ja cobre o fluxo.
- Sempre verifique caminhos de imagens e audios.
- Nao adicione uma habilidade aos dados antes de sua regra estar implementada e testada.
- Nao consulte `document` ou `dataset` em `js/domain/` ou nas decisoes da IA.
- Toda transicao de jogo deve ser representada por um comando de `gameReducer()`.
- Se uma regra muda a pontuacao, revise `updateScore()`.
