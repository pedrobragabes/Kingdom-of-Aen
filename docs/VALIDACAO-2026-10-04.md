# Validacao da integracao — 4 de outubro de 2026

## Mudanca

As branches dos PRs #23, #24 e #25 foram consolidadas sobre a main em uma worktree independente. O dominio puro, CardDefinition/CardInstance, ES Modules, descarte de sessao e acessibilidade passam a compor a mesma versao. Os documentos de escopo e multiplayer da main foram preservados como planos futuros.

O deck agora rejeita IDs desconhecidos, formato invalido e copias duplicadas do mesmo ID. A composicao nao infla unidades ou poder com entradas repetidas. Layouts nos breakpoints 480, 768 e 1024 permitem scroll em telas compactas, mantem overlays utilizaveis e reservam espaco para os controles do desktop. As tracks da colecao e do deck respeitam a altura das cartas; retornar ao builder restaura foco no inicio de batalha.

## Evidencias locais

- Node 24: lint e formatter aprovados; validador estrito confirma 39 cartas, 18 bases e referencias existentes.
- 19 testes Node aprovados: modelo, transicoes, pontuacao, ownership, zonas, deck, shuffle e cancelamento de timers.
- Seis E2E Chromium aprovados em projetos desktop (1440 x 900) e mobile (390 x 844). Incluem orientacao paisagem 844 x 390, persistencia, duas trocas, carta/fileira por teclado, rodadas, fim de partida, jogar novamente, voltar ao builder e ausencia de callbacks antigos.
- Verificacoes de layout impedem sobreposicao de linhas da colecao, corte vertical da mao e overflow horizontal involuntario. Screenshots foram inspecionadas em builder, batalha desktop e batalha mobile com animacoes finitas concluídas.
- Na integracao inicial, Axe executado no builder, mulligan e batalha de ambos os projetos: nenhuma violacao critica. As pendencias de outras severidades deram origem a revisao de UX descrita abaixo.
- `npm audit`: zero alertas no corte desta instalacao. O jogo nao recebe dependencias em runtime.

O servidor dos E2E aceita apenas GET/HEAD para index, JavaScript, CSS, imagens e audio; arquivos de configuracao, metadados Git e escritas nao sao expostos. CI publica LCOV e artefatos por sete dias, e main exige `validate` e `gitleaks`, sem bypass.

## Limites

Os testes nao comprovam autoria/licenca de imagens ou audio, distribuicao publica, dispositivos fisicos, compatibilidade em todos os navegadores ou multiplayer. A PR #26 de artes continua separada, sem aceite visual atribuido a esta integracao. Issues #10, #17, #19, #20 e #21 permanecem abertas.

## Revisao de UX — issue #22

O idioma principal da interface e portugues. Fileiras, lados, mensagens e instrucoes usam Corpo a corpo, À distância, Cerco, Você, Oponente e baralho. O nome exibido Adriano acompanha o arquivo de arte existente `Adriano.png`; os IDs `adr14no_1`, `adr14no_2` e `adr14no` foram conservados para manter os baralhos salvos.

Turno, erro de jogada, rodadas vencidas, habilidades, cartas adicionadas e trocas realizadas possuem texto visivel. Mensagens tambem continuam nas regioes de leitores de tela. A tentativa em fileira incorreta mantem a carta selecionada; o jogador pode corrigir a fileira sem selecionar novamente. O filtro Disponiveis apresenta instrucoes quando toda a colecao esta no baralho, e o baralho vazio informa o minimo de 22 unidades. A ordenacao voltou a colocar Corpo a corpo antes de À distância e Cerco.

Contraste corrigido nos indicadores, botao de passe e placar final; passar a rodada nao reduz mais a opacidade dos textos. A pagina possui landmark principal e titulo na batalha. A area de cartas da troca pode receber foco para rolagem por teclado mesmo quando todas as trocas acabam. Filtros expõem o estado pressionado, e as dez cartas ficam realmente desabilitadas ao esgotar as trocas.

- 19 testes Node e oito E2E Chromium aprovados em desktop e mobile, incluindo retrato/paisagem.
- 18 auditorias Axe sem violacoes de qualquer severidade: montagem, troca inicial, trocas esgotadas, batalha, fileira invalida, fim de partida, baralho vazio, colecao esgotada e limpeza, em ambos os projetos de viewport.
- Os E2E respeitam a preferencia de movimento reduzido para auditar os estados estaveis; nao se usa uma animacao de entrada parcialmente transparente como estado final.
- Screenshots de montagem, batalha e fim de partida foram inspecionadas. Indicadores nao cobrem o poder das cartas; o controle de audio nao cobre a contagem no celular.
- Lint, formatter, validacao estrita e audit de dependencias aprovados. As verificacoes Axe nao certificam conformidade completa com WCAG, navegadores adicionais ou dispositivos fisicos.
