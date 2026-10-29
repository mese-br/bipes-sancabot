/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4: MEDIDOR DE DISTÂNCIA. Lê o que o robô imprime no Console (valores do sensor) e mostra o cartão de distância (barra e
   "perto/longe"); alimenta também o painel da Missão 4 e o campo "leitura" da Missão 2. Expõe window.sancabotMission2InspectConsole
   (usado por core/channel.js).
   (F4) Movido sem mudança de comportamento do <script> do index.html. */
'use strict';
function initSancaBotDistancePanel() {
  const labelEl = document.getElementById('sancabotPanelLabel');
  const valueEl = document.getElementById('sancabotDistanceValue');
  const barEl = document.getElementById('sancabotDistanceBar');
  const statusEl = document.getElementById('sancabotDistanceStatus');
  const mission4LabelEl = document.getElementById('sancabotMission4PanelLabel');
  const mission4ValueEl = document.getElementById('sancabotMission4Value');
  const mission4BarEl = document.getElementById('sancabotMission4Bar');
  const mission4StatusEl = document.getElementById('sancabotMission4Status');
  const inputEl = document.getElementById('mission2Reading');
  if ((!valueEl || !barEl || !statusEl) && (!mission4ValueEl || !mission4BarEl || !mission4StatusEl)) return;

  function updatePanel(label, value, unit) {
    if (!Number.isFinite(value)) return;
    const displayLabel = label || 'Valor';
    const displayUnit = unit || '';
    const normalized = `${displayLabel} ${displayUnit}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const isDistance = normalized.includes('dist') || displayUnit.toLowerCase() === 'cm';
    const noReading = isDistance && (value < 2 || value > 400);
    if (labelEl) labelEl.textContent = displayLabel;
    if (mission4LabelEl) mission4LabelEl.textContent = displayLabel;
    if (noReading) {
      const status = 'Sem eco do ultrassom: confira fios, pinos Trigger/Echo e alimentação do sensor.';
      if (valueEl) valueEl.textContent = 'sem leitura';
      if (barEl) barEl.style.width = '4%';
      if (statusEl) { statusEl.textContent = status; statusEl.dataset.tone = 'lost'; }
      if (mission4ValueEl) mission4ValueEl.textContent = 'sem leitura';
      if (mission4BarEl) mission4BarEl.style.width = '4%';
      if (mission4StatusEl) { mission4StatusEl.textContent = status; mission4StatusEl.dataset.tone = 'lost'; }
      return;
    }
    const displayValue = `${value.toFixed(1)}${displayUnit ? ' ' + displayUnit : ''}`;
    if (valueEl) valueEl.textContent = displayValue;
    if (mission4ValueEl) mission4ValueEl.textContent = displayValue;
    const clamped = Math.max(0, Math.min(100, value));
    const barWidth = `${Math.max(4, Math.min(100, clamped))}%`;
    if (barEl) barEl.style.width = barWidth;
    if (mission4BarEl) mission4BarEl.style.width = barWidth;
    let status = 'Valor recebido';
    let tone = 'far';
    if (isDistance) {
      status = 'Longe';
      if (value <= 15) { status = 'Perto: parar'; tone = 'near'; }
      else if (value <= 30) { status = 'Aten\u00e7\u00e3o'; tone = 'mid'; }
      if (inputEl) {
        inputEl.value = value.toFixed(1);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    if (statusEl) { statusEl.textContent = status; statusEl.dataset.tone = tone; }
    if (mission4StatusEl) { mission4StatusEl.textContent = status; mission4StatusEl.dataset.tone = tone; }
  }

  let consoleBuffer = '';
  let panelBuffer = '';
  const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

  function normalizeTerminalData(data) {
    if (data == null) return '';
    if (typeof data === 'string') return data;
    if (data instanceof ArrayBuffer && decoder) return decoder.decode(new Uint8Array(data));
    if (ArrayBuffer.isView(data) && decoder) return decoder.decode(data);
    if (Array.isArray(data)) return String.fromCharCode.apply(null, data);
    return String(data || '');
  }

  function consumePanelText(text) {
    if (!text) return false;
    panelBuffer = (panelBuffer + text).slice(-3000);
    const patterns = [
      /SANCABOT_PANEL\|([^|\r\n]+)\|(-?\d+(?:[\.,]\d+)?)\|([^|\r\n]*)/gi,
      /SANCABOT_PANEL\s+([^|:\r\n]+)\s*[:|]\s*(-?\d+(?:[\.,]\d+)?)\s*([^\r\n]*)/gi,
      /(?:Distancia|Distância|Distance)\s*:?\s*(-?\d+(?:[\.,]\d+)?)\s*(cm)?/gi
    ];
    let found = null;
    patterns.forEach((pattern, index) => {
      const matches = [...panelBuffer.matchAll(pattern)];
      const match = matches[matches.length - 1];
      if (!match) return;
      found = index === 2
        ? { label: 'Distância agora', value: match[1], unit: match[2] || 'cm' }
        : { label: match[1], value: match[2], unit: match[3] || '' };
    });
    if (!found) return false;
    updatePanel(found.label, Number(String(found.value).replace(',', '.')), String(found.unit || '').trim());
    const lastBreak = Math.max(panelBuffer.lastIndexOf('\n'), panelBuffer.lastIndexOf('\r'));
    if (lastBreak >= 0) panelBuffer = panelBuffer.slice(lastBreak + 1);
    return true;
  }
  function inspectConsoleText(text) {
    if (window.sancabotTraceFlow) window.sancabotTraceFlow.inspectTraceText(text);
    const raw = normalizeTerminalData(text).replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, ' ');
    if (!raw) return;

    consumePanelText(raw);

    const clean = raw.replace(/.*SANCABOT_TRACE\|[^\r\n]*/gi, '');
    if (!clean) return;
    consoleBuffer = (consoleBuffer + clean).slice(-1600);
    const searchable = consoleBuffer.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const distanceMatches = [...searchable.matchAll(/(?:Distancia|Distance)\s*:?\s*(-?\d+(?:[\.,]\d+)?)/gi)];
    const distanceMatch = distanceMatches[distanceMatches.length - 1];
    if (distanceMatch) updatePanel('Dist\u00e2ncia agora', Number(distanceMatch[1].replace(',', '.')), 'cm');
  }
  window.sancabotMission2InspectConsole = inspectConsoleText;

  const install = () => {
    const termObj = window.term || (typeof term !== 'undefined' ? term : null) || window.terminal || (typeof terminal !== 'undefined' ? terminal : null);
    if (!termObj || termObj.__sancabotDistanceHook) return false;
    ['write', 'writeUtf8', 'writeln'].forEach((method) => {
      if (typeof termObj[method] !== 'function') return;
      const original = termObj[method].bind(termObj);
      termObj[method] = function(data, callback) {
        inspectConsoleText(data);
        const visibleData = window.sancabotTraceFlow && window.sancabotTraceFlow.filterTraceStream
          ? window.sancabotTraceFlow.filterTraceStream(data)
          : data;
        if (visibleData === '') { if (typeof callback === 'function') callback(); return; }
        return original(visibleData, callback);
      };
    });
    const termEl = document.getElementById('term') || document.querySelector('.xterm');
    if (termEl && typeof MutationObserver !== 'undefined') {
      let lastText = '';
      const observer = new MutationObserver(() => {
        const text = termEl.textContent || '';
        if (text && text !== lastText) {
          inspectConsoleText(text.slice(Math.max(0, lastText.length - 300)));
          lastText = text;
        }
      });
      observer.observe(termEl, { childList: true, subtree: true, characterData: true });
      termObj.__sancabotDistanceObserver = observer;
    }
    termObj.__sancabotDistanceHook = true;
    return true;
  };

  if (!install()) {
    const timer = setInterval(() => {
      if (install()) clearInterval(timer);
    }, 300);
    setTimeout(() => clearInterval(timer), 60000);
  }
  // Garante o hook mesmo se o terminal for criado tarde (ex.: conectar depois):
  // ao clicar no play, tenta instalar de novo (install() ignora se ja instalado).
  const runBtnHook = document.getElementById('runButton');
  if (runBtnHook) runBtnHook.addEventListener('click', () => setTimeout(install, 400));
}
setTimeout(initSancaBotDistancePanel, 800);
