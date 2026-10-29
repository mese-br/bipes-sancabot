/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4: RASTRO DOS BLOCOS. O programa do robô imprime linhas SANCABOT_TRACE|id|rótulo|n; este módulo as tira do Console
   (o aluno não as vê) e acende, no Blockly, o bloco que está rodando. Expõe window.sancabotTraceFlow (usado por core/channel.js).
   (F4) Movido sem mudança de comportamento do <script> do index.html. */
'use strict';
function initSancaBotTraceFlow() {
  const MIN_DISPLAY_MS = 300;   // tempo minimo que cada bloco fica destacado
  const MAX_QUEUE = 6;          // acima disso, pula para o mais recente (execucao muito rapida)
  const state = {
    currentId: null,
    currentTimer: null,
    executed: new Set(),
    traceBuffer: '',
    queue: [],
    displaying: false,
    counts: {},
  };

  const traceDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

  function normalizeTraceData(data) {
    if (data == null) return '';
    if (typeof data === 'string') return data;
    if (data instanceof ArrayBuffer && traceDecoder) return traceDecoder.decode(new Uint8Array(data));
    if (ArrayBuffer.isView(data) && traceDecoder) return traceDecoder.decode(data);
    if (Array.isArray(data)) return String.fromCharCode.apply(null, data);
    return String(data || '');
  }

  function getWorkspace() {
    return (window.Code && Code.workspace) || (window.Blockly && Blockly.getMainWorkspace && Blockly.getMainWorkspace()) || null;
  }

  function getBlockSvg(blockId) {
    const workspace = getWorkspace();
    if (!workspace || !blockId) return null;
    const block = workspace.getBlockById(blockId);
    if (!block || typeof block.getSvgRoot !== 'function') return null;
    return block.getSvgRoot();
  }

  function clearCurrent() {
    if (!state.currentId) return;
    const oldSvg = getBlockSvg(state.currentId);
    if (oldSvg) oldSvg.classList.remove('sancabot-trace-current');
    state.currentId = null;
  }

  function getBadge() {
    let badge = document.getElementById('sancabotTraceBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'sancabotTraceBadge';
      document.body.appendChild(badge);
    }
    return badge;
  }

  function showBadge(blockId, count) {
    const badge = getBadge();
    if (!count || count < 2) { badge.style.display = 'none'; return; }
    const svg = getBlockSvg(blockId);
    if (!svg) { badge.style.display = 'none'; return; }
    const rect = svg.getBoundingClientRect();
    badge.textContent = '×' + count;
    badge.style.display = 'block';
    badge.style.left = Math.round(rect.right - 8) + 'px';
    badge.style.top = Math.round(rect.top - 10) + 'px';
  }

  function hideBadge() {
    const badge = document.getElementById('sancabotTraceBadge');
    if (badge) badge.style.display = 'none';
  }

  // Exibe um item da fila por pelo menos MIN_DISPLAY_MS antes de passar ao proximo.
  function displayNext() {
    if (!state.queue.length) { state.displaying = false; return; }
    state.displaying = true;
    // Execucao muito rapida: mantem apenas o mais recente, marca os pulados como "vistos".
    if (state.queue.length > MAX_QUEUE) {
      const skipped = state.queue.splice(0, state.queue.length - 1);
      skipped.forEach((item) => {
        const svg = getBlockSvg(item.blockId);
        if (svg) svg.classList.add('sancabot-trace-seen');
        state.executed.add(item.blockId);
      });
    }
    const item = state.queue.shift();
    if (state.currentTimer) clearTimeout(state.currentTimer);
    clearCurrent();
    const svg = getBlockSvg(item.blockId);
    if (svg) {
      svg.classList.add('sancabot-trace-seen');
      svg.classList.add('sancabot-trace-current');
      state.executed.add(item.blockId);
      state.currentId = item.blockId;
      showBadge(item.blockId, item.count);
      window.sancabotLastTrace = { blockId: item.blockId, label: item.label || '', at: Date.now() };
    }
    setTimeout(() => {
      if (state.queue.length) { displayNext(); return; }
      state.displaying = false;
      // Fila vazia: mantem o ultimo bloco aceso por mais um tempo.
      state.currentTimer = setTimeout(() => {
        const currentSvg = getBlockSvg(item.blockId);
        if (currentSvg) currentSvg.classList.remove('sancabot-trace-current');
        if (state.currentId === item.blockId) state.currentId = null;
        hideBadge();
      }, 6500);
    }, MIN_DISPLAY_MS);
  }

  function markTrace(blockId, label, count) {
    if (!blockId) return;
    if ((label || '').toLowerCase().indexOf('preparar motores') !== -1) clearTrace();
    const parsedCount = Number(count);
    state.counts[blockId] = Number.isFinite(parsedCount) && parsedCount > 0
      ? parsedCount
      : (state.counts[blockId] || 0) + 1;
    state.queue.push({ blockId, label: label || '', count: state.counts[blockId] });
    if (!state.displaying) displayNext();
  }

  function clearTrace() {
    if (state.currentTimer) clearTimeout(state.currentTimer);
    clearCurrent();
    state.executed.forEach((blockId) => {
      const svg = getBlockSvg(blockId);
      if (svg) svg.classList.remove('sancabot-trace-seen', 'sancabot-trace-current');
    });
    state.executed.clear();
    state.queue.length = 0;
    state.displaying = false;
    state.counts = {};
    hideBadge();
  }

  function inspectTraceText(text) {
    const clean = normalizeTraceData(text).replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, ' ');
    if (!clean) return;
    state.traceBuffer = (state.traceBuffer + clean).slice(-2400);
    const matches = [...state.traceBuffer.matchAll(/SANCABOT_TRACE\|([^|\r\n]+)\|([^|\r\n]*)(?:\|(\d+))?/gi)];
    matches.forEach((match) => markTrace(match[1], match[2] || '', match[3]));
    const lastBreak = Math.max(state.traceBuffer.lastIndexOf('\n'), state.traceBuffer.lastIndexOf('\r'));
    if (lastBreak >= 0) state.traceBuffer = state.traceBuffer.slice(lastBreak + 1);
  }

  function stripTraceText(text) {
    if (text == null) return text;
    const normalized = normalizeTraceData(text);
    if (!normalized || !/SANCABOT_TRACE\|/i.test(normalized)) return text;
    const endsWithBreak = /\r?\n$/.test(normalized);
    const visible = normalized
      .split(/\r?\n/)
      .filter((line) => !/SANCABOT_TRACE\|/i.test(line))
      .join('\n');
    return visible && endsWithBreak ? visible + '\n' : visible;
  }

  // ===== Filtro de STREAM (com estado) =====
  // O BLE/serial fatia as linhas em pedacos; um filtro por chunk deixa vazar
  // fragmentos de SANCABOT_TRACE no console. Este filtro guarda o comeco de uma
  // possivel linha de trace ate ela completar (ou ate provar que nao e trace).
  const TRACE_MARK = 'SANCABOT_TRACE|';
  const INTERNAL_MARKS = ['SANCABOT_TRACE|'];
  const INTERNAL_MARKS_UPPER = INTERNAL_MARKS.map((mark) => mark.toUpperCase());
  const INTERNAL_LINE_RE = /SANCABOT_TRACE\|/i;
  const streamState = { tail: '' };

  function tailCouldBeTrace(partial) {
    const breakAt = Math.max(partial.lastIndexOf('\r'), partial.lastIndexOf('\n'));
    const seg = partial.slice(breakAt + 1).toUpperCase();
    if (INTERNAL_MARKS_UPPER.some((mark) => seg.indexOf(mark) !== -1)) return true;
    const max = Math.min(seg.length, Math.max(...INTERNAL_MARKS_UPPER.map((mark) => mark.length)) - 1);
    for (let n = max; n > 0; n--) {
      if (INTERNAL_MARKS_UPPER.some((mark) => seg.slice(-n) === mark.slice(0, n))) return true;
    }
    return false;
  }

  function filterTraceStream(data) {
    const normalized = normalizeTraceData(data);
    const upper = normalized.toUpperCase();
    // Caminho rapido: nada pendente e nenhum indicio de canal interno -> devolve intocado
    // (preserva o tipo original do dado para o terminal).
    if (!streamState.tail && !INTERNAL_MARKS_UPPER.some((mark) => upper.indexOf(mark) !== -1)) {
      const lastBreak = Math.max(normalized.lastIndexOf('\r'), normalized.lastIndexOf('\n'));
      const lastLine = normalized.slice(lastBreak + 1);
      if (!tailCouldBeTrace(lastLine)) return data;
    }

    let text = streamState.tail + normalized;
    streamState.tail = '';
    let out = '';
    let lineStart = 0;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch !== '\n' && ch !== '\r') continue;
      let end = i + 1;
      if (ch === '\r' && text[i + 1] === '\n') {
        end = i + 2;
        i++;
      }
      const line = text.slice(lineStart, end);
      if (!INTERNAL_LINE_RE.test(line)) out += line;
      lineStart = end;
    }

    const rest = text.slice(lineStart);
    if (rest) {
      if (tailCouldBeTrace(rest) && rest.length <= 600) {
        streamState.tail = rest; // segura ate a linha completar
      } else if (!INTERNAL_LINE_RE.test(rest)) {
        out += rest;
      }
    }
    return out;
  }
  window.sancabotTraceFlow = { markTrace, clearTrace, inspectTraceText, stripTraceText, filterTraceStream };
}
initSancaBotTraceFlow();
