/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: painéis laterais.
     A1 painel de código ao vivo (Copiar, Baixar .py)      A4 abrir ao passar o mouse (animação suave, com intenção)
     A2 recolher e fixar (caixa de blocos e código)        A5 painel direito redimensionável
     A3 responsividade (1050 px, 768 px, sem mouse)        A6 aba Referência (sancabot_reference.js)
   Os painéis são CAMADAS acima da área de desenho: abrir, fechar ou fixar nunca empurra nem redimensiona os blocos.
   "Fixar" = continua aberto; solto = abre ao passar o mouse e recolhe ao sair.
   Comportamento inspirado em obsat-oficial/satblocks (GPL-3.0): index.html, css/satblocks_theme.css, js/satblocks_app.js.
   Não altera blocos, geradores, envio ao robô nem o trace (SANCABOT_TRACE / SANCABOT_PANEL). */
(function () {
  'use strict';

  var LS_KEY = 'sancabot.panels.v1';
  var DEFAULT_W = 380, MIN_W = 280;
  var OPEN_DELAY = 160;     // ms de "intenção": o mouse precisa ficar na borda para abrir (evita abrir ao passar de raspão)
  var CLOSE_DELAY = 650;    // ms depois de sair do painel até recolher
  var TRACE_LINE = /^\s*sancabot_trace\(.*\)\s*$/;
  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)');

  // ---------- preferências (localStorage pode falhar: privado, bloqueado) ----------
  function readPrefs() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function writePrefs(p) { try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch (e) {} }
  var prefs = readPrefs();

  function bucket() { var w = window.innerWidth; return w < 768 ? 'phone' : (w < 1050 ? 'narrow' : 'wide'); }
  // Abaixo de 1050 px os painéis começam recolhidos; em tela larga começam abertos. A escolha da pessoa vale por faixa de tela.
  function defaults(b) { return b === 'wide' ? { code: true, tools: true } : { code: false, tools: false }; }
  function pinned(b) { var saved = prefs[b] || {}, d = defaults(b); return { code: saved.code != null ? saved.code : d.code, tools: saved.tools != null ? saved.tools : d.tools }; }
  function setPinned(which, value) { var b = bucket(); prefs[b] = prefs[b] || {}; prefs[b][which] = value; writePrefs(prefs); }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  function mk(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  var ui = {}, cm = null, view = 'program', tab = 'code', lastFull = '', lastBody = '';
  // codePinned/toolsPinned: fixado (continua aberto). peekCode/peekTools: aberto só enquanto o mouse está por perto.
  var st = { codePinned: false, toolsPinned: true, peekCode: false, peekTools: false, bucket: bucket() };
  var genTimer = 0, toolbox = null, insets = { right: 0, bottom: 0 };
  var T = { code: { open: 0, close: 0 }, tools: { open: 0, close: 0 } };

  // ---------- geração do Python ----------
  // workspaceToCode devolve "funções de apoio + programa". O wrapper em finish captura só o programa do aluno.
  function generate() {
    var P = Blockly.Python, orig = P.finish, body = '', full = '', error = '';
    try {
      P.finish = function (code) { body = code; return orig.call(this, code); };
      full = P.workspaceToCode(Code.workspace);
    } catch (e) { error = (e && e.message) || String(e); }
    finally { P.finish = orig; }
    return { full: full, body: body, error: error };
  }
  function programView(body) {
    return String(body).split('\n').filter(function (l) { return !TRACE_LINE.test(l); }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function refreshCode() {
    if (!ui.panel || !isVisible('code') || tab !== 'code') return;
    var g = generate();
    ui.hint.classList.toggle('sb-error', !!g.error);
    if (g.error) { ui.hint.textContent = 'Não consegui gerar o código agora: ' + g.error; return; }
    lastFull = g.full; lastBody = programView(g.body);
    var shown = view === 'full' ? g.full.trim() : lastBody;
    var empty = !g.full.trim();
    setCode(empty ? '# Monte blocos para ver o código aqui.' : (shown || '# Sem comandos ainda. Arraste um bloco de movimento.'));
    ui.hint.textContent = empty ? '' : (view === 'full'
      ? 'Código completo, igual ao que vai para o robô.'
      : 'Só o seu programa. As funções de apoio ficam em "Código completo". Copiar e Baixar usam o código completo.');
    ui.copy.disabled = ui.download.disabled = empty;
  }
  function scheduleRefresh() { clearTimeout(genTimer); genTimer = setTimeout(refreshCode, 250); }

  function setCode(text) {
    if (cm) { cm.setValue(text); setTimeout(function () { cm.refresh(); }, 0); }
    else ui.pre.textContent = text;
  }

  // ---------- copiar / baixar ----------
  function announce(msg) { ui.live.textContent = ''; setTimeout(function () { ui.live.textContent = msg; }, 30); }
  function copy() {
    var text = lastFull;
    var done = function () { ui.copy.textContent = 'Copiado!'; announce('Código copiado'); setTimeout(function () { ui.copy.textContent = 'Copiar'; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      var t = mk('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t);
      t.select(); try { document.execCommand('copy'); done(); } catch (e) { announce('Não foi possível copiar'); } t.remove();
    }
  }
  function download() {
    var a = mk('a'), url = URL.createObjectURL(new Blob([lastFull], { type: 'text/x-python;charset=utf-8' }));
    a.href = url; a.download = 'sancabot.py'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ---------- estado e layout ----------
  function blocksActive() { var c = $('#content_blocks'); return !!c && c.classList.contains('on'); }
  function isVisible(which) { return which === 'code' ? (blocksActive() && (st.codePinned || st.peekCode)) : (st.toolsPinned || st.peekTools); }

  function resizeBlockly() {
    clearTimeout(resizeBlockly.t);
    resizeBlockly.t = setTimeout(function () { try { Blockly.svgResize(Code.workspace); } catch (e) {} }, 60);
  }
  // Mantém zoom e lixeira (borda direita/base) fora do painel fixado. Os BLOCOS não se mexem: só esses controles.
  function updateInsets() {
    var pinnedOpen = blocksActive() && st.codePinned;
    var phone = st.bucket === 'phone';
    var simW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sb-sim-w'), 10) || 0;   // simulador aberto à direita
    insets.right = (pinnedOpen && !phone ? Math.round(ui.panel.getBoundingClientRect().width || DEFAULT_W) : 0) + simW;
    insets.bottom = pinnedOpen && phone ? Math.round(window.innerHeight * 0.46) : 0;
    try { Code.workspace.resize(); } catch (e) {}
  }
  function toolsWidth() { var d = $('.blocklyToolboxDiv'); return d && d.classList.contains('sb-tb-open') ? d.offsetWidth : 0; }
  function setTop() {
    var m = $('.top-menu'); if (m) document.documentElement.style.setProperty('--sb-top', m.getBoundingClientRect().bottom + 'px');
  }
  // Sem animação (primeira pintura e mudança de faixa de tela). A classe sai por setTimeout, não por requestAnimationFrame:
  // em aba em segundo plano o rAF pode atrasar e deixaria as animações desligadas. try/finally: um erro em fn() não a deixa presa.
  function instant(fn) {
    var root = document.documentElement; root.classList.add('sb-no-anim');
    try { fn(); void root.offsetWidth; }       // o reflow aplica o estado novo ainda sem transição
    finally { setTimeout(function () { root.classList.remove('sb-no-anim'); }, 80); }
  }
  var PIN_ON = 'Fixado: clique para soltar (volta a abrir só ao passar o mouse)';
  function setPin(btn, pressed, what) {
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    btn.title = pressed ? PIN_ON : 'Fixar: manter ' + what + ' aberto';
  }
  function setGone(el, gone) { el.classList.toggle('sb-gone', gone); el.tabIndex = gone ? -1 : 0; }
  function render() {
    var active = blocksActive();
    var vc = isVisible('code'), vt = isVisible('tools');
    ui.panel.classList.toggle('sb-open', vc);
    ui.panel.setAttribute('aria-hidden', vc ? 'false' : 'true');
    ui.panel.inert = !vc;
    setPin(ui.pin, st.codePinned, 'o painel de código');
    setPin(ui.tbPin, st.toolsPinned, 'a caixa de blocos');
    setGone(ui.edgeCode, !active || vc);
    setGone(ui.edgeTools, !active || vt);
    ui.hoverRight.hidden = !active || vc || !hoverCapable.matches;
    ui.hoverLeft.hidden = !active || vt || !hoverCapable.matches;
    var tbDiv = $('.blocklyToolboxDiv');
    if (tbDiv) {
      var was = tbDiv.classList.contains('sb-tb-open');
      tbDiv.classList.toggle('sb-tb-open', vt);
      tbDiv.inert = !vt;
      if (was && !vt) closeFlyout();
    }
    if (vc) { refreshCode(); if (cm) setTimeout(function () { cm.refresh(); }, 0); }
    updateInsets();
  }
  function closeFlyout() {
    try {
      if (toolbox && toolbox.clearSelection) toolbox.clearSelection();
      var f = Code.workspace.getFlyout && Code.workspace.getFlyout(); if (f) f.hide();
    } catch (e) {}
  }

  // ---------- fixar, espiar (hover) e recolher ----------
  function clearT(which, k) { clearTimeout(T[which][k]); T[which][k] = 0; }
  function peekNow(which, on) {
    if (!hoverCapable.matches && on) return;
    clearT(which, 'open'); if (on) clearT(which, 'close');
    if (which === 'code') {
      if (on && st.codePinned) return;
      st.peekCode = on;
    } else {
      if (on && st.toolsPinned) return;
      // Arrastando um bloco da lista para a área de trabalho: espera terminar antes de recolher.
      if (!on && Code.workspace.isDragging && Code.workspace.isDragging()) { T.tools.close = setTimeout(function () { T.tools.close = 0; peekNow('tools', false); }, 300); return; }
      st.peekTools = on;
    }
    render();
  }
  // Abrir só depois de um instante com o mouse na borda; fechar só depois de um instante fora.
  function scheduleOpen(which) {
    if (!hoverCapable.matches || (which === 'code' ? (st.codePinned || st.peekCode) : (st.toolsPinned || st.peekTools))) return;
    clearT(which, 'close');
    if (!T[which].open) T[which].open = setTimeout(function () { T[which].open = 0; peekNow(which, true); }, OPEN_DELAY);
  }
  function cancelOpen(which) { clearT(which, 'open'); }
  function scheduleClose(which) {
    if (!T[which].close) T[which].close = setTimeout(function () { T[which].close = 0; peekNow(which, false); }, CLOSE_DELAY);
  }
  function cancelClose(which) { clearT(which, 'close'); }
  function closeAllNow() { ['code', 'tools'].forEach(function (w) { clearT(w, 'open'); clearT(w, 'close'); }); st.peekCode = st.peekTools = false; render(); }

  // Fixar / soltar. Soltar com mouse deixa aberto até o mouse sair (comportamento de "espiar"); sem mouse, recolhe.
  function pinCode(on) { st.codePinned = on; st.peekCode = !on && hoverCapable.matches && ui.panel.matches(':hover'); setPinned('code', on); clearT('code', 'close'); render(); }
  function pinTools(on) {
    st.toolsPinned = on; setPinned('tools', on); clearT('tools', 'close');
    var d = $('.blocklyToolboxDiv'); st.peekTools = !on && hoverCapable.matches && !!d && d.matches(':hover');
    render();
  }
  function collapseCode() { st.codePinned = false; st.peekCode = false; setPinned('code', false); clearT('code', 'close'); render(); }
  function collapseTools() { st.toolsPinned = false; st.peekTools = false; setPinned('tools', false); clearT('tools', 'close'); render(); }

  function applyBucket(force) {
    var b = bucket();
    if (!force && b === st.bucket) return;
    st.bucket = b;
    var p = pinned(b);
    st.codePinned = p.code; st.toolsPinned = p.tools; st.peekCode = st.peekTools = false;
    var w = parseInt(prefs.w, 10); setWidth(isFinite(w) ? w : DEFAULT_W, false);
    instant(render);
  }

  // ---------- redimensionar (A5) ----------
  function maxW() { return Math.max(MIN_W, Math.round(window.innerWidth * 0.6)); }
  function setWidth(w, persist) {
    w = Math.max(MIN_W, Math.min(maxW(), Math.round(w)));
    document.documentElement.style.setProperty('--sb-code-w', w + 'px');
    ui.resizer.setAttribute('aria-valuenow', String(w));
    if (persist) { prefs.w = w; writePrefs(prefs); }
    if (st.codePinned) updateInsets();
    if (cm) cm.refresh();
  }
  function currentW() { return ui.panel.getBoundingClientRect().width || DEFAULT_W; }
  function initResizer() {
    var r = ui.resizer, startX = 0, startW = 0;
    r.addEventListener('pointerdown', function (e) {
      startX = e.clientX; startW = currentW(); r.setPointerCapture(e.pointerId); r.classList.add('sb-dragging'); e.preventDefault();
    });
    r.addEventListener('pointermove', function (e) { if (r.classList.contains('sb-dragging')) setWidth(startW + (startX - e.clientX), false); });
    var end = function (e) { if (!r.classList.contains('sb-dragging')) return; r.classList.remove('sb-dragging'); try { r.releasePointerCapture(e.pointerId); } catch (x) {} setWidth(currentW(), true); };
    r.addEventListener('pointerup', end); r.addEventListener('pointercancel', end);
    r.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { setWidth(currentW() + 24, true); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { setWidth(currentW() - 24, true); e.preventDefault(); }
      else if (e.key === 'Home') { setWidth(MIN_W, true); e.preventDefault(); }
      else if (e.key === 'End') { setWidth(maxW(), true); e.preventDefault(); }
    });
    r.addEventListener('dblclick', function () { setWidth(Math.abs(currentW() - DEFAULT_W) < 8 ? maxW() * 0.8 : DEFAULT_W, true); });
  }

  // ---------- montagem da interface ----------
  // Alfinete desenhado aqui. Solto: contorno e inclinado. Fixado: preenchido, reto e destacado em azul (ver CSS).
  function pinButton(label, extra) {
    var b = mk('button', { type: 'button', class: 'sb-iconbtn sb-pinbtn' + (extra ? ' ' + extra : ''), 'aria-pressed': 'false', 'aria-label': label });
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), path = document.createElementNS(NS, 'path');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    path.setAttribute('d', 'M9 3h6v2.2l-1.2.6V10l3.2 3.1V15h-4.4v6.2L12 22.4l-1.6-1.2V15H6v-1.9L9.2 10V5.8L9 5.2z');
    svg.appendChild(path); b.appendChild(svg);
    return b;
  }

  function build() {
    var panel = mk('aside', { id: 'sbCodePanel', class: 'sb-panel', 'aria-label': 'Código e referência', 'aria-hidden': 'true' });
    ui.panel = panel;
    ui.resizer = mk('div', { class: 'sb-resizer', role: 'separator', 'aria-orientation': 'vertical', tabindex: '0',
      'aria-label': 'Redimensionar o painel de código (setas esquerda e direita)', 'aria-valuemin': String(MIN_W), 'aria-valuemax': '1000', 'aria-valuenow': String(DEFAULT_W) });
    var head = mk('header', { class: 'sb-head' });
    var tabs = mk('div', { class: 'sb-tabs', role: 'tablist' });
    ui.tabCode = mk('button', { type: 'button', role: 'tab', 'aria-selected': 'true', id: 'sbTabCode' }, 'Código');
    ui.tabRef = mk('button', { type: 'button', role: 'tab', 'aria-selected': 'false', id: 'sbTabRef' }, 'Referência');
    tabs.append(ui.tabCode, ui.tabRef);
    var actions = mk('div', { class: 'sb-actions' });
    ui.pin = pinButton('Fixar o painel de código');
    ui.collapse = mk('button', { type: 'button', class: 'sb-iconbtn', 'aria-label': 'Recolher o painel de código', title: 'Recolher' }, '›');
    actions.append(ui.pin, ui.collapse);
    head.append(tabs, actions);

    ui.viewCode = mk('section', { class: 'sb-body', 'aria-labelledby': 'sbTabCode' });
    var bar = mk('div', { class: 'sb-toolbar' });
    var seg = mk('div', { class: 'sb-seg', role: 'group', 'aria-label': 'O que mostrar' });
    ui.vProg = mk('button', { type: 'button', 'aria-pressed': 'true' }, 'Meu programa');
    ui.vFull = mk('button', { type: 'button', 'aria-pressed': 'false' }, 'Código completo');
    seg.append(ui.vProg, ui.vFull);
    ui.copy = mk('button', { type: 'button' }, 'Copiar');
    ui.download = mk('button', { type: 'button' }, 'Baixar .py');
    bar.append(seg, mk('span', { class: 'sb-spacer' }), ui.copy, ui.download);
    var box = mk('div', { class: 'sb-codebox' });
    ui.pre = mk('pre'); ui.pre.setAttribute('tabindex', '0');
    box.append(ui.pre);
    ui.hint = mk('p', { class: 'sb-hint' });
    ui.live = mk('div', { class: 'sb-live', 'aria-live': 'polite' });
    ui.viewCode.append(bar, box, ui.hint, ui.live);

    ui.viewRef = mk('section', { class: 'sb-body sb-ref', 'aria-labelledby': 'sbTabRef', hidden: '' });
    panel.append(ui.resizer, head, ui.viewCode, ui.viewRef);

    ui.edgeCode = mk('button', { type: 'button', class: 'sb-edge sb-edge--right', 'aria-label': 'Abrir o painel de código' }, '‹ Código');
    ui.edgeTools = mk('button', { type: 'button', class: 'sb-edge sb-edge--left', 'aria-label': 'Abrir a caixa de blocos' }, 'Blocos ›');
    ui.hoverRight = mk('div', { class: 'sb-hover sb-hover--right', 'aria-hidden': 'true' });
    ui.hoverLeft = mk('div', { class: 'sb-hover sb-hover--left', 'aria-hidden': 'true' });
    document.body.append(panel, ui.edgeCode, ui.edgeTools, ui.hoverRight, ui.hoverLeft);

    // CodeMirror (já carregado pelo BIPES) dá cor ao Python; sem ele, mostra texto simples.
    if (window.CodeMirror) {
      ui.pre.remove();
      cm = window.CodeMirror(box, { value: '', mode: 'python', readOnly: true, lineNumbers: true, lineWrapping: true, tabindex: 0 });
    }

    // Botão dentro da caixa de blocos
    var tbDiv = $('.blocklyToolboxDiv');
    // Faixa no TOPO da caixa de blocos (o menu é mais alto que a janela, então um botão na base ficava fora da tela).
    ui.tbHead = mk('div', { class: 'sb-tb-head' });
    ui.tbPin = pinButton('Fixar a caixa de blocos', 'sb-tb-btn');
    ui.tbCollapse = mk('button', { type: 'button', class: 'sb-iconbtn sb-tb-btn', 'aria-label': 'Recolher a caixa de blocos', title: 'Recolher' }, '‹');
    ui.tbHead.append(ui.tbPin, ui.tbCollapse);
    if (tbDiv) { tbDiv.insertBefore(ui.tbHead, tbDiv.firstChild); tbDiv.classList.add('sb-tb-layer'); } else document.body.appendChild(ui.tbHead);

    // eventos
    ui.tabCode.onclick = function () { selectTab('code'); };
    ui.tabRef.onclick = function () { selectTab('ref'); };
    ui.vProg.onclick = function () { setView('program'); };
    ui.vFull.onclick = function () { setView('full'); };
    ui.copy.onclick = copy; ui.download.onclick = download;
    ui.pin.onclick = function () { pinCode(!st.codePinned); };
    ui.collapse.onclick = collapseCode;
    ui.edgeCode.onclick = function () { pinCode(true); };
    ui.edgeTools.onclick = function () { pinTools(true); };
    ui.tbPin.onclick = function () { pinTools(!st.toolsPinned); };
    ui.tbCollapse.onclick = collapseTools;
    // Código (direita): abre com intenção, fecha com atraso.
    [ui.hoverRight, ui.edgeCode].forEach(function (z) { z.addEventListener('mouseenter', function () { scheduleOpen('code'); }); z.addEventListener('mouseleave', function () { cancelOpen('code'); }); });
    ui.panel.addEventListener('mouseenter', function () { cancelClose('code'); });
    ui.panel.addEventListener('mouseleave', function () { if (st.peekCode) scheduleClose('code'); });
    // Caixa de blocos (esquerda): abre com intenção; só recolhe quando o mouse sai do menu, da lista de blocos que abre ao lado e da borda.
    [ui.hoverLeft, ui.edgeTools].forEach(function (z) { z.addEventListener('mouseenter', function () { scheduleOpen('tools'); }); z.addEventListener('mouseleave', function () { cancelOpen('tools'); }); });
    var inToolsArea = function (t) { return !!(t && t.closest && t.closest('.blocklyToolboxDiv, .blocklyFlyout, .sb-hover--left, .sb-edge--left')); };
    var watchTools = function (e) {
      if (!st.peekTools) return;
      if (inToolsArea(e.target)) cancelClose('tools'); else scheduleClose('tools');
    };
    document.addEventListener('mousemove', watchTools);
    // Ao soltar um bloco fora do menu, ele recolhe mesmo sem mexer o mouse. Fase de captura: o Blockly consome o evento durante o arrasto.
    document.addEventListener('mouseup', watchTools, true);
    document.addEventListener('pointerup', watchTools, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && (st.peekCode || st.peekTools)) closeAllNow(); });
    initResizer();
  }

  // ---------- Referência ligada à caixa de blocos ----------
  function ensureReference() {
    if (!window.SancaBotReference) return false;
    if (!ui.refReady) {
      window.SancaBotReference.render(ui.viewRef, {
        follow: prefs.follow !== false,
        onFollow: function (v) { prefs.follow = v; writePrefs(prefs); }
      });
      ui.refReady = true;
    }
    return true;
  }
  // Ao escolher uma categoria na caixa de blocos, a Referência mostra o tópico equivalente.
  function onToolboxCategory(name) {
    if (!name || !ensureReference()) return;
    if (!window.SancaBotReference.showByName(name)) return;
    if (prefs.follow === false || !isVisible('code')) return;     // painel recolhido: não abre sozinho
    if (tab !== 'ref') selectTab('ref');
  }

  function setView(v) {
    view = v;
    ui.vProg.setAttribute('aria-pressed', v === 'program' ? 'true' : 'false');
    ui.vFull.setAttribute('aria-pressed', v === 'full' ? 'true' : 'false');
    refreshCode();
  }
  function selectTab(t) {
    tab = t;
    ui.tabCode.setAttribute('aria-selected', t === 'code' ? 'true' : 'false');
    ui.tabRef.setAttribute('aria-selected', t === 'ref' ? 'true' : 'false');
    ui.viewCode.hidden = t !== 'code';
    ui.viewRef.hidden = t !== 'ref';
    if (t === 'ref') ensureReference();
    if (t === 'code') { refreshCode(); if (cm) setTimeout(function () { cm.refresh(); }, 0); }
  }


  // ---------- conta SancaLabs ----------
  // Se houver sessão do Studio no mesmo domínio, o painel mostra a conta (somente leitura: nome completo e plano) e sugere o
  // primeiro nome como apelido. O campo de nome continua EDITÁVEL: o apelido fica só neste navegador (localStorage 'account_user')
  // e nunca muda a conta. Não faz login aqui, não grava no servidor e qualquer falha é ignorada. Contrato: docs/identidade.md do sancabot-studio.
  function showAccountName() {
    var field = $('#account_user');
    if (!field || window.location.protocol === 'file:') return;
    fetch('/studio/api/login.php?action=me', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.success || !d.user || !d.user.name) return;
        var mine = ''; try { mine = localStorage.getItem('account_user') || ''; } catch (e) { /* ok */ }
        var def = (window.SancaBotConfig && SancaBotConfig.defaults && SancaBotConfig.defaults.author) || 'Aluno';
        if (!mine || mine === def) { field.textContent = String(d.user.name).split(' ')[0]; field.dispatchEvent(new Event('sb-name')); }   // só sugere; não grava
        var tries = 0;   // a linha da conta é criada por sancabot_layout.js, que pode chegar depois desta resposta
        (function fill() {
          var info = document.getElementById('accountInfo');
          if (!info) { if (++tries < 40) setTimeout(fill, 250); return; }
          info.hidden = false; info.innerHTML = 'Conta SancaLabs: <b></b> · plano <b></b>'; var bs = info.querySelectorAll('b'); bs[0].textContent = d.user.name; bs[1].textContent = d.user.plan || 'free';
        })();
      })
      .catch(function () {});
  }

  // A caixa de blocos vira camada: para o Blockly ela ocupa 0 px (a área de desenho nunca se reorganiza ao abrir/fechar) e a lista
  // de blocos abre ao lado dela. Zoom e lixeira ficam fora do painel fixado. Feito sobre a versão fixa do Blockly (6.20210701.0),
  // com verificação de existência para não quebrar numa atualização futura.
  function makeToolboxAnOverlay(ws) {
    try {
      if (toolbox) {
        toolbox.getWidth = function () { return 0; };
        var fly = toolbox.getFlyout && toolbox.getFlyout();
        if (fly) fly.getX = function () { return this.isVisible() ? ($('.blocklyToolboxDiv') || {}).offsetWidth || 0 : 0; };
      }
      var mm = ws.getMetricsManager && ws.getMetricsManager();
      if (mm && mm.getUiMetrics) {
        var orig = mm.getUiMetrics.bind(mm);
        mm.getUiMetrics = function () {
          var m = orig();
          if (!insets.right && !insets.bottom) return m;
          var v = m.viewMetrics;
          return { viewMetrics: { left: v.left, top: v.top, width: Math.max(0, v.width - insets.right), height: Math.max(0, v.height - insets.bottom) },
                   absoluteMetrics: m.absoluteMetrics, toolboxMetrics: m.toolboxMetrics };
        };
      }
    } catch (e) { console.warn('[SancaBot painéis] não consegui tornar a caixa de blocos uma camada:', e); }
  }

  function start() {
    build();
    setTop();
    var ws = Code.workspace;
    toolbox = ws.getToolbox ? ws.getToolbox() : null;
    makeToolboxAnOverlay(ws);
    ws.addChangeListener(function (e) {
      if (e.type === 'toolbox_item_select') { onToolboxCategory(e.newItem); return; }
      if (!e.isUiEvent) scheduleRefresh();
    });
    var content = $('#content_blocks');
    if (content) new MutationObserver(render).observe(content, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', function () { setTop(); var w = parseInt(prefs.w, 10) || DEFAULT_W; setWidth(Math.min(w, maxW()), false); applyBucket(false); updateInsets(); });
    hoverCapable.addEventListener && hoverCapable.addEventListener('change', render);
    applyBucket(true);
    showAccountName();
  }

  function waitForEditor(tries) {
    if (window.Code && Code.workspace && window.Blockly && Blockly.Python && $('.blocklyToolboxDiv')) {
      try { start(); } catch (e) { console.error('[SancaBot painéis] falhou ao iniciar:', e); }
    } else if (tries < 100) setTimeout(function () { waitForEditor(tries + 1); }, 100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { waitForEditor(0); });
  else waitForEditor(0);

  window.SancaBotPanels = { refreshInsets: updateInsets, refresh: refreshCode, state: st, insets: function () { return { left: toolsWidth(), right: insets.right, bottom: insets.bottom }; } };
})();
