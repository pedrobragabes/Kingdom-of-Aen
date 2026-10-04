# Validacao da integracao — 4 de outubro de 2026

## Mudanca

As branches dos PRs #23, #24 e #25 foram consolidadas sobre a main em uma worktree independente. O dominio puro, CardDefinition/CardInstance, ES Modules, descarte de sessao e acessibilidade passam a compor a mesma versao. Os documentos de escopo e multiplayer da main foram preservados como planos futuros.

O deck agora rejeita IDs desconhecidos, formato invalido e copias duplicadas do mesmo ID. A composicao nao infla unidades ou poder com entradas repetidas. Layouts nos breakpoints 480, 768 e 1024 permitem scroll em telas compactas, mantem overlays utilizaveis e reservam espaco para os controles do desktop. As tracks da colecao e do deck respeitam a altura das cartas; retornar ao builder restaura foco no inicio de batalha.

## Evidencias locais

- Node 24: lint e formatter aprovados; validador estrito confirma 39 cartas, 18 bases e referencias existentes.
- 19 testes Node aprovados: modelo, transicoes, pontuacao, ownership, zonas, deck, shuffle e cancelamento de timers.
- Seis E2E Chromium aprovados em projetos desktop (1440 x 900) e mobile (390 x 844). Incluem orientacao paisagem 844 x 390, persistencia, duas trocas, carta/fileira por teclado, rodadas, fim de partida, jogar novamente, voltar ao builder e ausencia de callbacks antigos.
- Verificacoes de layout impedem sobreposicao de linhas da colecao, corte vertical da mao e overflow horizontal involuntario. Screenshots foram inspecionadas em builder, batalha desktop e batalha mobile com animacoes finitas concluídas.
- Axe executado no builder, mulligan e batalha de ambos os projetos: nenhuma violacao critica. Todos os resultados, inclusive pendencias de outras severidades, ficam nos artefatos. A revisao de contraste e a auditoria completa de acessibilidade continuam no #22.
- `npm audit`: zero alertas no corte desta instalacao. O jogo nao recebe dependencias em runtime.

O servidor dos E2E aceita apenas GET/HEAD para index, JavaScript, CSS, imagens e audio; arquivos de configuracao, metadados Git e escritas nao sao expostos. CI publica LCOV e artefatos por sete dias, e main exige `validate` e `gitleaks`, sem bypass.

## Limites

Os testes nao comprovam autoria/licenca de imagens ou audio, distribuicao publica, dispositivos fisicos, compatibilidade em todos os navegadores ou multiplayer. A PR #26 de artes continua separada, sem aceite visual atribuido a esta integracao. Issues #10, #17, #19, #20, #21 e #22 permanecem abertas.
