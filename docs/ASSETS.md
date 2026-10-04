# Assets

Este documento registra os assets usados e a convencao para cartas sem arte propria.

## Estrutura Atual

```text
audio/
img/
├── icons/
└── personagens/
```

Nao existe uma pasta `assets/`. Imagens do jogo ficam exclusivamente em `img/`.

## Imagens Existentes

Icones:

- `img/icons/icon-melee.png`
- `img/icons/icon-ranged.png`
- `img/icons/icon-siege.png`

Personagens referenciados por cartas e encontrados:

- `img/personagens/Adriano.png`
- `img/personagens/Cozinheiros.png`
- `img/personagens/Daniel.png`
- `img/personagens/Gabriel.png`
- `img/personagens/Suelly.png`
- `img/personagens/Thiago.png`
- `img/personagens/Wellington.png`

Personagens existentes, mas ainda nao referenciados diretamente na colecao atual:

- `img/personagens/Ana Rita.png`
- `img/personagens/Carol.png`
- `img/personagens/Corredores.png`
- `img/personagens/Ciça.png`
- `img/personagens/Espantalho.png`
- `img/personagens/Geleia.png`
- `img/personagens/Marco.png`
- `img/personagens/Paty.png`
- `img/personagens/Renata.png`

## Cartas sem arte

Cartas sem um arquivo de imagem aprovado nao declaram a propriedade `img`. A interface aplica automaticamente o gradiente padrao, evitando requisicoes quebradas e associacoes incorretas de personagens.

Novas artes so devem ser cadastradas quando o arquivo existir no repositorio e sua licenca estiver documentada.

## Audio

Audios usados pelo `AudioManager`:

- `audio/card-place-1.ogg`
- `audio/card-place-2.ogg`
- `audio/card-place-3.ogg`
- `audio/card-place-4.ogg`
- `audio/card-slide-1.ogg`
- `audio/card-slide-2.ogg`
- `audio/card-fan-1.ogg`
- `audio/card-fan-2.ogg`
- `audio/card-shuffle.ogg`
- `audio/dice-throw-3.ogg`
- `audio/die-throw-3.ogg`
- `audio/switch4.ogg`
- `audio/mouseclick1.ogg`
- `audio/card-shove-1.ogg`
- `audio/music_bg.mp3`

Tambem existe:

- `audio/Medieval_Way__Knight_Mix_Original - Copia.mp3`

Esse arquivo parece ser uma copia da musica de fundo e pode ser removido ou documentado como alternativa, se a duplicacao for intencional.

## Convencoes Recomendadas

- Usar `img/personagens/` para artes de cartas.
- Usar `img/icons/` para icones de fileira e UI.
- Nao usar caminhos em `assets/`.
- Preferir nomes sem acentos em novos arquivos para reduzir risco em sistemas diferentes.
- Manter o caminho do `img` igual ao valor usado em `CARD_COLLECTION`.
- Ao renomear uma imagem, atualizar `js/data/cards.js` na mesma mudanca.
