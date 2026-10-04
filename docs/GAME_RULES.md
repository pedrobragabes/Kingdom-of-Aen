# Regras e Sistemas

Este documento descreve o recorte jogavel do MVP.

## Objetivo

A partida e uma melhor de 3 rodadas. O primeiro lado a vencer 2 rodadas vence a partida.

## Deck

- O deck do jogador precisa ter pelo menos 22 unidades.
- Cada entrada em `CARD_COLLECTION` representa uma copia unica disponivel.
- O deck escolhido fica salvo no navegador via `localStorage`.
- A colecao atual possui 39 unidades: 16 melee, 18 ranged e 5 siege.

## Sequencia da Partida

1. O jogador monta e valida o deck.
2. Os decks do jogador e do inimigo sao embaralhados.
3. Cada lado compra 10 cartas.
4. O jogador pode trocar ate 2 cartas no mulligan.
5. Em seu turno, o jogador joga uma unidade ou passa.
6. A IA joga uma unidade ou passa.
7. Quando ambos passam, a rodada termina e o vencedor recebe uma gema.
8. Cada lado compra 1 carta antes da proxima rodada.

## Fileiras

- `melee`: combate corpo a corpo.
- `ranged`: combate a distancia.
- `siege`: cerco.
- Cartas com `row: "all"` sao agile e podem ser jogadas em qualquer fileira.

## Pontuacao e Habilidades

A pontuacao de uma fileira e a soma do poder atual das unidades nela.

| Habilidade | Efeito |
| --- | --- |
| `bond_partner` | Dobra o poder quando o parceiro indicado esta na mesma fileira. |
| `hero` | Identifica uma unidade heroica; no MVP nao altera a pontuacao. |

Clima, scorch, espiao, medico, espantalho, vinculo por copias, lideres e passivas de faccao nao fazem parte do MVP.

## IA do Oponente

A IA considera a diferenca de pontos, a quantidade de cartas nas maos e se o jogador ja passou. Ao escolher uma unidade, prioriza completar um vinculo de parceiros e depois preservar cartas quando ja possui vantagem suficiente.

## Fim da Rodada

- O maior total de pontos vence.
- Em empate, os dois lados recebem uma vitoria.
- As unidades sao removidas do tabuleiro.
- Os estados de passagem sao resetados.
- Cada lado compra 1 carta para a rodada seguinte, se o deck ainda tiver cartas.
