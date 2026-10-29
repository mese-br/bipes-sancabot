# SancaBot by BIPES

Esta pasta e uma copia de trabalho do BIPES customizada para o SancaBot.

Base original:
- Projeto: BIPES - Block based Integrated Platform for Embedded Systems
- Repositorio: https://github.com/BIPES/BIPES
- Licenca: GPL-3.0

## Estrategia

1. Manter `BIPES-original` como referencia limpa.
2. Customizar `BIPES-sancabot` com marca, placa padrao e templates do SancaBot.
3. Hospedar a pasta `ui/` em HTTPS como editor estatico.
4. Integrar o SancaBot Studio abrindo este editor com templates das missoes.

## Primeiras alteracoes

- Titulo: SancaBot by BIPES.
- Logo do topo com o rosto oficial do SancaBot.
- Tema escuro com cores SancaBot.
- Placa padrao adicionada: SancaBot (ESP32-C3).
- Manifesto PWA renomeado.

## Proximos passos

- Confirmar pinos reais do hardware SancaBot antes de publicar a placa.
- Criar toolbox simplificada SancaBot com blocos essenciais para as missoes.
- Criar templates: Missao 1 - ponto zero, andar reto, virar, sensor ultrassom.
- Gerar versao offline/zip com `make offline` quando o visual estiver aprovado.

## Convenção para novos blocos Blockly

Todo bloco novo do SancaBot deve ser definido em `ui/core/block_definitions_sancabot.js`
(não em `block_definitions.js`, que é o arquivo original do BIPES) e seu gerador Python
correspondente em `ui/core/generator_stubs_sancabot.js`.

Todo bloco novo entra primeiro na categoria "Experimental" em `ui/toolbox/sancabot.xml`
(colour="#94a3b8"). Só deve ser promovido para uma categoria temática definitiva
(Preparação, Movimento, Ajustes, Sensores, Repetição e decisão) depois de validado em
uma aula ou missão real.

Cores por categoria (usar exatamente estes hex, para bater com a categoria):
- Preparação: #168fd8
- Movimento: #d96a1c
- Ajustes: #f4b000
- Sensores: #00a7c7
- Repetição e decisão: #6d5bd0
- Experimental: #94a3b8
- Variável (dentro do Experimental): #a55b80

Esta convenção vale também para agentes de IA (ex: Codex) usados para gerar blocos novos.

## Pendências / ideias futuras (Missão 4 e além)

- Variável (Dist, Tempo, Tentativas): categoria "Variável" em `sancabot.xml` (renomeada de "Contador"
  em 2026-07-05), reaproveitando os blocos padrão de variável do Blockly (`custom="VARIABLE"`) — não
  precisou criar bloco novo. Tem 4 labels explicando o passo a passo de uso (criar, definir, mudar,
  encaixar). Uso pensado pra Missão 4: criar variável Dist (guarda a leitura do sensor) e Tempo (guarda
  o cronômetro), e depois mostrar cada uma no painel.
- Painel visual: hoje só tem 1 espaço (mostra 1 valor por vez, feito sob medida pra distância — barra
  de proximidade e status "perto/longe" não fazem sentido pra outros valores). Decisão de uso por
  missão: M2 mostra distância direto nesse card (como já funciona). M3 não usa painel. M4 precisa
  mostrar Distância E Tempo ao mesmo tempo — vai precisar de um segundo cartão simples (só nome+valor,
  sem barra) ao lado do card de distância existente. Ainda não implementado — é mudança de
  HTML/JS do painel (`index.html`, por volta da linha 490 e da função `updatePanel`), não de bloco.
- Bloco de operação/matemática: Marcos sugeriu que pode ser interessante no futuro (não é urgente,
  avaliar depois de publicar e testar a Missão 4). O Blockly já tem blocos de matemática prontos em
  "Laboratório Avançado"; decidir se algum deles deve ser trazido pro Experimental como os de variável.
- Blocos de leitura fixa removidos (2026-07-05): `sancabot_print_distance` ("mostrar leitura no
  console") e `sancabot_timer_print` ("mostrar tempo do cronômetro") saíram — eram versões rígidas
  (texto fixo, sem nome customizável) do que `sancabot_panel_number` já faz melhor. Removidos de
  `block_definitions_sancabot.js`, `generator_stubs_sancabot.js` e `sancabot.xml` (inclusive dos dois
  modelos de exemplo no toolbox, que agora usam `sancabot_panel_number` no lugar). Confirmado por busca
  em todo o projeto que nenhuma missão do Studio usava esses dois blocos — remoção segura. Padrão daqui
  pra frente: ler o sensor/cronômetro com o bloco de valor puro (`sancabot_distance_cm`,
  `sancabot_timer_seconds`) → opcionalmente guardar numa variável → mostrar com `sancabot_panel_number`
  (que tem campo de nome customizável, ao contrário dos blocos removidos).

## Changelog 2026-07-05 — Reorganização de blocos e cores (para o Codex ler)

Resumo do que foi feito nesta pasta, para quem for publicar/dar manutenção depois:

**1. Separação dos blocos SancaBot em arquivos próprios**
- Criados `ui/core/block_definitions_sancabot.js` e `ui/core/generator_stubs_sancabot.js`,
  com os 19 blocos SancaBot mantidos (config, motion_scene, time_seconds, angle_degrees,
  move_mode, stop, calibrate, turn_calibration, distance_sensor, distance_cm, obstacle_near,
  if_obstacle, observe_scene, explore_until, explore_forever, break_explore, panel_number,
  observe_drive, print_distance).
- Removidos 5 blocos redundantes de movimento (drive_mode, turn_mode, drive_timed,
  turn_degrees, move) — eram variantes antigas, substituídas por `sancabot_move_mode`.
  Não estão em nenhum arquivo mais; se precisar recuperá-los, ver backup abaixo.
- `ui/core/block_definitions.js` e `ui/core/generator_stubs.js` (arquivos originais do BIPES)
  tiveram toda a seção sancabot_* removida — hoje só têm blocos genéricos do BIPES.
- Backup do conteúdo original (antes da remoção) em `_backup_pre_reorg_20260705/`.
- `ui/index.html` e `ui/index_offline.html` atualizados para carregar
  `block_definitions_sancabot.js` e `generator_stubs_sancabot.js` logo após os arquivos originais.

**2. Correções de cor no toolbox**
- Categoria "Ajustes" em `ui/toolbox/sancabot.xml`: cor corrigida de `#c88a00` para `#f4b000`.
- Categoria "Experimental" nova, cor `#94a3b8`, vazia (recebe blocos novos por padrão).
- Bug de cor no menu lateral: `ui/index.html` tem um script (`applySancaBotToolboxColors`)
  que pinta o nome de cada categoria no menu adivinhando a cor por palavra-chave no texto
  (não lê o `colour=` do XML). A categoria "Repetição e decisão" caía numa regra genérica
  `/repet/i` (verde, pensada para "loop") em vez de usar a cor roxa `#6d5bd0` que os 7 blocos
  dessa categoria já usam. Corrigido adicionando `decis` à regra roxa, antes da regra genérica
  `/repet/i`, para essa categoria sempre bater na cor certa. Esse script só existe em
  `ui/index.html` (a versão offline não tem).

**3. Arquivos alterados nesta reorganização**
- `ui/core/block_definitions_sancabot.js` (novo)
- `ui/core/generator_stubs_sancabot.js` (novo)
- `ui/core/block_definitions.js` (limpo)
- `ui/core/generator_stubs.js` (limpo)
- `ui/index.html` (scripts novos + fix de cor)
- `ui/index_offline.html` (scripts novos)
- `ui/toolbox/sancabot.xml` (cor Ajustes + categoria Experimental)
- `README-SANCABOT.md` (este arquivo)

**4. Para publicar**
Sincronizar a pasta `BIPES-sancabot/ui` inteira para o servidor que serve sancabot.com.br/bipes
e, se houver cache (nginx, CDN, service worker), invalidar. Depois, confirmar no console do
navegador que `block_definitions_sancabot.js` e `generator_stubs_sancabot.js` carregam sem 404,
e visualmente que a categoria "Repetição e decisão" aparece roxa no menu lateral.

**5. Ainda pendente**
Criar os blocos técnicos novos da Missão 4 (a definir) dentro da categoria "Experimental" —
só depois que Marcos validar que esta reorganização está publicada e funcionando bem.

## Painéis laterais, código ao vivo e Referência (2026-10-22)

Arquivos novos (carregados em `ui/index.html`, depois do CodeMirror): `ui/core/sancabot_panels.js`, `ui/core/sancabot_panels.css`,
`ui/core/sancabot_reference.js` (motor) e `ui/core/sancabot_reference_data.js` (textos em português). Não alteram blocos, geradores, envio ao robô nem o trace (`SANCABOT_TRACE` / `SANCABOT_PANEL`).

- **Código ao vivo** à direita: "Meu programa" (só o que o aluno montou) ou "Código completo" (igual ao que vai para o robô).
  Copiar e "Baixar .py" (`sancabot.py`) usam sempre o código completo.
- **Painéis como camadas:** o painel de código (direita) e a caixa de blocos (esquerda) ficam **por cima** da área de desenho; abrir,
  fechar ou fixar nunca empurra nem redimensiona os blocos. **Alfinete** (só ícone: contorno inclinado = solto; preenchido, reto e azul
  = fixado). Solto, o painel abre ao passar o mouse na borda (depois de ~160 ms de intenção), desliza e esmaece, e recolhe ~650 ms
  depois de o mouse sair (Esc recolhe na hora). Painel direito redimensionável (arrastar, setas, Home/End, duplo clique). Estado em
  `localStorage` (`sancabot.panels.v1`), por faixa de tela. Tempos e curva: variáveis `--sb-*` em `sancabot_panels.css`; `prefers-reduced-motion` respeitado.
- **Responsivo:** abaixo de 1050 px os painéis começam recolhidos; abaixo de 768 px o código vira folha inferior; em telas sem
  mouse (`hover: none`) só os botões de borda.
- **Referência ligada à caixa de blocos:** ao escolher uma categoria à esquerda, a aba Referência abre o tópico equivalente
  (opção "Seguir a caixa de blocos"). É **completa por construção**: os tópicos e os blocos vêm do toolbox ativo (uma categoria
  = um tópico, um bloco = uma linha, hoje 53 categorias e 258 blocos), com descrição em português, o Python **gerado pelo gerador
  real** (nunca digitado à mão, então acompanha pinos e código reais) e busca em toda a referência. Bloco novo no toolbox aparece
  sozinho; falta só, se quiser, a descrição em `sancabot_reference_data.js` (sem ela usa o tooltip do bloco).
- **Do código para os blocos:** cada linha tem "Usar bloco" e pode ser arrastada para a área de blocos; entra o bloco (ou o
  programa pronto, com todos os blocos encaixados) equivalente ao trecho de Python mostrado. Não interpreta Python digitado livremente.
- Se houver sessão do Studio no mesmo domínio, o painel de conta mostra o nome (somente leitura, nada é gravado).

**Atribuição (GPL-3.0):** o comportamento dos painéis (zona de hover, alça de redimensionar, recolher/fixar, apresentação da
referência) foi inspirado em `obsat-oficial/satblocks` (`index.html`, `css/satblocks_theme.css`, `js/satblocks_app.js`,
`js/sat_reference.js`). O código foi escrito para o SancaBot e não copia esses arquivos. Todo arquivo novo declara
`SPDX-License-Identifier: GPL-3.0-or-later`.

**Pendências:** `ui/index_offline.html` (cópia com tudo embutido) ainda não recebeu esses arquivos; a cor da categoria "Ajustes" em
`ui/toolbox/sancabot.xml` (`#c88a00`) difere da convenção deste README (`#f4b000`), não alterada aqui.


## Blocos criados no SancaBot Studio Creator (2026-10-23)

Ferramenta do **administrador** (no repositório `sancabot-studio`, em `/studio/creator/`; não confundir com o Studio de missões nem com o Studio Pro do SatBlocks, que serviu de inspiração) para criar blocos **declarativos** (JSON: texto com `{CAMPOS}` + modelo de MicroPython, sem JavaScript digitado).

- **Experimental dinâmica:** em `ui/toolbox/sancabot.xml`, a categoria Experimental (`#94a3b8`) agora é `custom="SANCABOT_EXPERIMENTAL"`. O carregador (`ui/core/sancabot_custom_loader.js`) coloca ali os blocos **publicados**; com `?creator=1` entram também os rascunhos do navegador do administrador ("Testar no editor"). Os blocos criados têm o prefixo `sancabot_x_` e usam `sancabotTraceLine` (o destaque durante a execução funciona).
- **Mesmo código na prévia e no editor:** `ui/core/sancabot_custom_blocks.js` (validação, registro, geração). Valores dos campos nunca viram código solto (número preso à faixa, texto escapado, lista só entre as opções).
- **Promover** (convenção acima): o Creator gera `Definição`, `Gerador` e `Toolbox` no formato deste repositório; cole em `block_definitions_sancabot.js`, `generator_stubs_sancabot.js` e na categoria certa de `sancabot.xml` (com a cor da categoria) e **despublique** o bloco no Creator.
- **Atribuição:** a ideia de formulário + prévia + saídas de código + importar/exportar vem do Studio Pro do SatBlocks (`obsat-oficial/satblocks`, GPL-3.0); o código é próprio.
- Pendente: pinos (GPIO 0 a 21) a confirmar no ESP32-C3.
