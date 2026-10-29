/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: layout responsivo. O cabeçalho pode quebrar em duas linhas (tablet) e o conteúdo precisa descer junto:
   --sb-top = borda de baixo do cabeçalho. Observa o tamanho do cabeçalho e avisa o Blockly e os painéis. */
(function () {
  'use strict';
  var last = -1, t = 0;
  function apply() {
    var m = document.querySelector('.top-menu'); if (!m) return;
    var b = Math.round(m.getBoundingClientRect().bottom);
    if (b === last) return; last = b;
    document.documentElement.style.setProperty('--sb-top', b + 'px');
    clearTimeout(t); t = setTimeout(function () {
      try { if (window.SancaBotPanels && SancaBotPanels.refreshInsets) SancaBotPanels.refreshInsets(); } catch (e) { /* ok */ }
      try { window.dispatchEvent(new Event('resize')); } catch (e) { /* ok */ }
    }, 60);
  }
  function init() {
    var m = document.querySelector('.top-menu'); if (!m) return;
    apply();
    if (window.ResizeObserver) new ResizeObserver(apply).observe(m);
    window.addEventListener('resize', apply); window.addEventListener('orientationchange', apply);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* ---------- Cabeçalho no padrão do SatBlocks: menu "Projeto", menu de abas e botão Conectar único ---------- */
(function () {
  'use strict';
  function el(tag, attrs, html) { var e = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (html) e.innerHTML = html; return e; }
  var menu, abtn, tbtn, header;
  function closeAll() {
    if (menu) menu.hidden = true; if (abtn) abtn.setAttribute('aria-expanded', 'false');
    if (header) header.classList.remove('sb-tabs-open'); if (tbtn) tbtn.setAttribute('aria-expanded', 'false');
  }
  function buildActions() {
    var c = window.SancaBotCab && SancaBotCab.actions(); if (!c || c.btn.getAttribute('data-sb-on')) return;   // a estrutura já vem do cabeçalho (cabecalho-estrutura.js); aqui só ligamos os cliques
    c.btn.setAttribute('data-sb-on', '1'); menu = c.menu; abtn = c.btn;
    abtn.addEventListener('click', function (e) { e.stopPropagation(); var open = menu.hidden; closeAll(); menu.hidden = !open; abtn.setAttribute('aria-expanded', String(open)); });
    menu.addEventListener('click', function () { setTimeout(closeAll, 0); });
  }
  function labelOf(tab) { return tab ? tab.textContent.trim() : ''; }
  function buildTabs() {
    var c = window.SancaBotCab && SancaBotCab.tabs(); if (!c || c.btn.getAttribute('data-sb-on')) return;
    c.btn.setAttribute('data-sb-on', '1'); header = c.header; tbtn = c.btn; var tabs = c.tabs, paint = c.pintar;
    new MutationObserver(paint).observe(tabs, { attributes: true, subtree: true, attributeFilter: ['class'], childList: true, characterData: true });
    tbtn.addEventListener('click', function (e) {
      e.stopPropagation(); var open = !header.classList.contains('sb-tabs-open'); closeAll();
      if (open) { header.classList.add('sb-tabs-open'); tabs.style.left = Math.max(4, tbtn.getBoundingClientRect().left - header.getBoundingClientRect().left) + 'px'; }
      paint();
    });
    tabs.addEventListener('click', function () { setTimeout(function () { closeAll(); paint(); }, 0); });
  }
  function wireConnect() {
    var c = document.getElementById('connectButton'), ch = document.getElementById('channelButton'); if (!c || !ch) return;
    // Desconectado: "Conectar" abre o diálogo com as 3 opções. Conectado: o mesmo botão desconecta (comportamento de sempre).
    c.addEventListener('click', function (e) {
      var connected = false; try { connected = typeof mux !== 'undefined' && !!mux.connected(); } catch (x) { /* ok */ }   // mux é uma class: não fica em window
      if (!connected) { e.stopImmediatePropagation(); e.preventDefault(); ch.click(); }
    }, true);
    ['serialButton', 'bluetoothButton', 'networkButton'].forEach(function (id) {
      var b = document.getElementById(id); if (b) b.addEventListener('click', function () { setTimeout(function () { try { UI['responsive'].hidePanels(); } catch (x) { /* ok */ } }, 0); });
    });
    ['channelClose', 'channelClose2'].forEach(function (id) { var b = document.getElementById(id); if (b) b.addEventListener('click', function () { try { UI['responsive'].hidePanels(); } catch (x) { /* ok */ } }); });
  }
  // Perfil: avatar com a inicial + campo de nome editável (apelido local) + linha da conta SancaLabs quando houver sessão
  function buildProfile() {
    var panel = document.querySelector('.account-panel'), user = document.getElementById('account_user'), old = document.getElementById('account_header');
    if (!panel || !user || panel.querySelector('.acc-head')) return;
    var head = el('div', { 'class': 'acc-head' }), av = el('div', { 'class': 'acc-avatar', 'aria-hidden': 'true' }), box = el('div', { 'class': 'acc-name' });
    var lab = el('label', { 'class': 'acc-lab', 'for': 'account_user' }, 'Seu nome'), wrap = el('div', { 'class': 'acc-field' });
    var pen = el('span', { 'class': 'acc-pen', 'aria-hidden': 'true' }, '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/></svg>');
    user.setAttribute('aria-label', 'Seu nome'); user.setAttribute('spellcheck', 'false'); user.title = 'Toque para mudar o nome';
    wrap.append(user, pen); box.append(lab, wrap);
    var info = el('p', { 'class': 'acc-info', id: 'accountInfo' }); info.hidden = true;
    head.append(av, box); panel.insertBefore(head, panel.firstChild); head.after(info);
    if (old) old.hidden = true;
    function paint() { var n = (user.textContent || '').trim(); av.textContent = (n ? n.charAt(0) : '?').toUpperCase(); }
    user.addEventListener('input', function () { if (user.textContent.length > 24) { user.textContent = user.textContent.slice(0, 24); var r = document.createRange(); r.selectNodeContents(user); r.collapse(false); var sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); } paint(); });
    user.addEventListener('sb-name', paint);
    user.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); user.blur(); } });
    user.addEventListener('blur', function () { if (!user.textContent.trim()) { user.textContent = (window.SancaBotConfig && SancaBotConfig.defaults && SancaBotConfig.defaults.author) || 'Aluno'; try { localStorage.setItem('account_user', user.textContent); } catch (e) { /* ok */ } paint(); } });
    wrap.addEventListener('click', function () { user.focus(); });
    paint();
    new MutationObserver(paint).observe(user, { childList: true, characterData: true, subtree: true });
  }
  // Rodar no robô: sem robô conectado abre o diálogo de conexão (e roda assim que conectar); conectado vira ▶ Rodar; rodando vira ■ Parar
  var pendingRun = 0;
  function runState() {
    var connected = false; try { connected = typeof mux !== 'undefined' && !!mux.connected(); } catch (x) { /* ok */ }
    if (!connected) return 'off';
    var st = window.UI && UI['workspace'] && UI['workspace'].runButton; return st && st.status === false ? 'running' : 'ready';
  }
  function wireRun() {
    var rb = document.getElementById('runButton'), ch = document.getElementById('channelButton'); if (!rb || !ch) return;
    var last = '';
    function paint() {
      var st = runState(); if (st !== last) { rb.setAttribute('data-sb-run', st); rb.title = st === 'off' ? 'Conectar o robô e rodar o programa' : st === 'running' ? 'Parar o programa no robô' : 'Rodar o programa no robô'; last = st; }
      if (pendingRun && st === 'ready') { var go = pendingRun; pendingRun = 0; if (Date.now() - go < 60000) setTimeout(function () { try { UI['workspace'].run(); } catch (x) { /* ok */ } }, 600); }
      if (pendingRun && Date.now() - pendingRun > 60000) pendingRun = 0;
    }
    rb.addEventListener('click', function (e) {
      if (runState() === 'off') { e.stopImmediatePropagation(); e.preventDefault(); pendingRun = Date.now(); ch.click(); }
    }, true);
    setInterval(paint, 250); paint();
  }
  // Avisos: cabeçalho com "Limpar tudo" e um estado vazio com o mascote (as mensagens são <span> filhos do painel, criados pelo notify.send)
  function buildNotify() {
    var panel = document.querySelector('.notify-panel'); if (!panel || panel.querySelector('.nt-head')) return;
    var head = el('div', { 'class': 'nt-head' }, '<h2>Avisos</h2>'), clear = el('button', { type: 'button', 'class': 'nt-clear' }, 'Limpar tudo');
    head.appendChild(clear);
    var empty = el('div', { 'class': 'nt-empty' }, '<img src="media/sancabot-face.svg" alt="" width="64" height="64"><p>Tudo certo por aqui!</p><small>Os avisos do robô e do editor aparecem aqui.</small>');
    panel.insertBefore(empty, panel.firstChild); panel.insertBefore(head, panel.firstChild);
    clear.addEventListener('click', function (e) {
      e.stopPropagation();
      [].slice.call(panel.children).forEach(function (c) { if (c.tagName === 'SPAN') panel.removeChild(c); });
      try { UI['notify'].messages = []; } catch (x) { /* ok */ }
    });
  }
  function init() { buildActions(); buildTabs(); wireConnect(); buildProfile(); buildNotify(); wireRun(); }
  document.addEventListener('click', function (e) { if (!e.target.closest || (!e.target.closest('.sb-proj') && !e.target.closest('.sb-tabs-btn') && !e.target.closest('.top-menu > .tabs'))) closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeAll(); try { var p = document.querySelector('.channel-panel#show'); if (p) UI['responsive'].hidePanels(); } catch (x) { /* ok */ } } });
  // os botões do cabeçalho são criados pelo HTML, mas o Code/UI só ligam seus cliques depois do load: espera o UI existir
  var tries = 0, t = setInterval(function () { if ((window.UI && UI['responsive'] && document.getElementById('connectButton')) || ++tries > 80) { clearInterval(t); init(); } }, 100);
})();
