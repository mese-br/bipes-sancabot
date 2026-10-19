# Trace Flow v2 — highlight de blocos na execução (2026-07-06)

Handoff para o Codex: mudanças já aplicadas nesta pasta (BIPES-sancabot). Objetivo: fazer o
"bloco iluminado" funcionar visivelmente em loops e em programas rápidos. Se o repositório
que o Codex mantém divergir desta pasta, aplicar as mesmas mudanças lá (os trechos abaixo
identificam cada ponto).

## Problema original

1. O highlight trocava de bloco instantaneamente — em programas rápidos, imperceptível.
2. O runtime no ESP32 deduplicava traces repetidos por 800ms — em loops, as repetições
   eram suprimidas ("não dá para ver que está entrando no loop").
3. Os blocos de repetição (`sancabot_exp_repeat_*`) emitiam o trace UMA vez, ANTES do
   `for`/`while` — o bloco de loop nunca reacendia a cada iteração.

## Mudanças por arquivo

### 1. `ui/core/generator_stubs_sancabot.js`

**a) `sancabotTraceRuntimeDefinition()` reescrita.** Novo runtime MicroPython:

- `SANCABOT_TRACE_COUNTS = {}` — contador de execuções POR BLOCO (substitui a dedup de 800ms).
- Print com 4º campo: `SANCABOT_TRACE|<block_id>|<label>|<count>`.
- Rate limit global de 120ms entre prints (protege a serial), mas a 1ª execução de cada
  bloco sempre imprime. O count é cumulativo, então nada se perde — o próximo print
  carrega o total.
- `SANCABOT_TRACE_SLEEP` — pausa em ms após cada trace. Valor definido NA GERAÇÃO do
  código a partir de `window.sancabotSlowMode` (350ms se ativo, 0 se não). É o "modo
  passo a passo / tartaruga".

**b) Nova função `sancabotLoopIterationTraceLine(block, label)`** — igual a
`sancabotTraceLine`, mas com indentação (`Blockly.Python.INDENT`) para ser inserida
DENTRO do corpo do loop.

**c) Geradores de loop alterados** (`sancabot_exp_repeat_times`, `_repeat_while`,
`_repeat_until`, `_repeat_condition`): o trace saiu de antes do loop e passou a ser a
1ª linha do corpo — o bloco de repetição reacende a cada volta e o contador ×N sobe.
Obs.: `sancabot_explore_until`/`sancabot_explore_forever` já tinham trace dentro do
corpo ('medir e explorar'/'medir sensor') — não foram alterados.

### 2. `ui/index.html`

**a) `initSancaBotTraceFlow()` reescrita** (fila de exibição):

- Constantes: `MIN_DISPLAY_MS = 300` (tempo mínimo de cada bloco aceso) e
  `MAX_QUEUE = 6` (acima disso, pula para o trace mais recente e marca os pulados só
  como `sancabot-trace-seen`).
- `markTrace(blockId, label, count)` agora enfileira; `displayNext()` consome a fila
  com `setTimeout` respeitando o tempo mínimo.
- Selo de repetição: div flutuante `#sancabotTraceBadge` mostra "×N" ao lado do bloco
  quando count ≥ 2 (posicionada via `getBoundingClientRect()` do SVG do bloco).
- Regex do parser atualizada para o 4º campo opcional:
  `/SANCABOT_TRACE\|([^|\r\n]+)\|([^|\r\n]*)(?:\|(\d+))?/g`
  (atenção: o label agora NÃO pode conter `|` — nenhum label atual contém).
- Comportamentos mantidos: label 'preparar motores' limpa o trace anterior (novo run);
  último bloco fica aceso 6500ms após a fila esvaziar; `stripTraceText` continua
  ocultando as linhas SANCABOT_TRACE do terminal.

**b) Nova função `initSancaBotSlowModeToggle()`** (logo após `initSancaBotTraceFlow()`):
cria o botão 🐢 `#sancabotSlowToggle` ao lado do `#runButton`. Toggle de
`window.sancabotSlowMode`, persistido em `localStorage['sancabot_slow_mode']`
('1'/'0'). Como a geração do Python acontece no clique do play, o flag é lido na hora.

### 3. `ui/style.css`

Ao final (após `@keyframes sancabotTracePulse`): estilos de `#sancabotTraceBadge`
(pílula amarela ×N, `position: fixed`, z-index 100001) e de `#sancabotSlowToggle`
(incl. estado `.active`).

## Compatibilidade

- Frontend aceita traces SEM o campo count (formato antigo) — conta localmente.
- Runtime novo + frontend antigo: o frontend antigo leria o count como parte do label —
  deployar os três arquivos juntos.

## v2.1 — Fix: trace vazando no console e quebrando o painel (mesma data)

Sintoma: linhas/fragmentos de `SANCABOT_TRACE` apareciam no console e as leituras do
painel (`SANCABOT_PANEL` / "Distancia:") paravam de chegar quando vinham no mesmo chunk.

Causas: (a) o filtro antigo (`stripTraceText`) era por chunk — o BLE/serial fatia as
linhas e os pedaços vazavam; (b) `inspectConsoleText` descartava o chunk INTEIRO se
contivesse trace, perdendo as leituras de painel que vinham junto; (c) o hook do
terminal só tentava instalar por 6s após o load.

Mudanças (todas em `ui/index.html`):

1. Novo `filterTraceStream(data)` em `initSancaBotTraceFlow` (exportado em
   `window.sancabotTraceFlow`): filtro de stream COM ESTADO — remove linhas completas
   com `SANCABOT_TRACE|` e segura no buffer (`streamState.tail`) o final de chunk que
   ainda pode virar uma linha de trace, até ela completar. Fast path devolve o dado
   original intocado (preserva tipo p/ writeUtf8); cap de 300 chars evita prender texto.
2. O wrapper de `term.write/writeUtf8/writeln` usa `filterTraceStream` em vez de
   `stripTraceText` (que foi mantido por compatibilidade).
3. `inspectConsoleText`: em vez de descartar o chunk com trace, remove só os trechos
   `SANCABOT_TRACE|...` via regex e segue alimentando o buffer do painel.
4. Hook do terminal: janela de retry ampliada de 6s para 60s + re-tentativa a cada
   clique no `#runButton` (cobre conexão tardia).

Testado com chunks fatiados (trace em 3 pedaços, painel+trace no mesmo chunk, prompt
REPL, `SANCABOT_P` parcial): console limpo e painel recebendo tudo.

## Checklist de teste (com robô físico)

1. Programa linear rápido (3–4 blocos): cada bloco acende ≥300ms, em sequência.
2. `repetir 10 vezes` com 1 bloco dentro: o bloco do loop e o interno reacendem a cada
   volta; selo ×N sobe (pode pular números por causa do rate limit de 120ms — esperado).
3. Botão 🐢 ativo: execução visivelmente mais lenta (~350ms/bloco), bom para demonstração.
   Conferir que o estado persiste após recarregar a página.
4. `while True` (explorar): terminal não é inundado (rate limit) e o robô não trava.
5. Rodar de novo (play): highlight anterior limpa no 'preparar motores'.
6. Ajustes finos, se necessário: MIN_DISPLAY_MS (index.html), 120ms e 350ms
   (generator_stubs_sancabot.js).
