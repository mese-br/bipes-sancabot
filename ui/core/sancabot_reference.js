/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: aba "Referência", ligada à caixa de blocos.
   Ideia (categoria escolhida à esquerda abre o tópico equivalente, catálogo de blocos com Python, "Usar bloco" e arrastar para a
   área de trabalho) inspirada em obsat-oficial/satblocks (js/sat_reference.js, js/satblocks_app.js, GPL-3.0). Código próprio.

   COMPLETA POR CONSTRUÇÃO: os tópicos e os blocos vêm do toolbox ativo (Code.workspace.options.languageTree), uma linha por
   bloco. O Python mostrado NUNCA é digitado à mão: é gerado pelo gerador real (Blockly.Python) a partir do mesmo XML que o
   "Usar bloco" insere. Os textos em português ficam em sancabot_reference_data.js.
   TODO(pinos): qualquer pino que aparece no Python vem do gerador; confirmar GPIO do ESP32-C3 com o hardware. */
window.SancaBotReference = (function () {
  'use strict';

  var D = window.SancaBotReferenceData || { CATEGORY: {}, TITLE_PT: {}, EXTRA: {}, DESC: {}, EXAMPLE_XML: {}, norm: function (s) { return String(s || '').toLowerCase(); } };
  var MIME = 'application/x-sancabot-block';
  var MAX_VARIANTS = 3;                 // variações do mesmo tipo de bloco por categoria (ex.: 29 músicas em "Sons")
  var TRACE_LINE = /^\s*sancabot_trace\(.*\)\s*$/;
  var NO_CODE = '# (este bloco não gera comando por si só)';
  var NO_CODE_BY_TYPE = { exec_python: '# o Python que você escrever no bloco aparece aqui', exec_python_output: '# o Python que você escrever no bloco aparece aqui' };

  var state = { tree: null, topics: [], byId: {}, byName: {}, current: null, query: '', follow: true, onFollow: null, inserted: 0, rowCache: {} };
  var ui = {};

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function cleanCode(code) {
    return String(code || '').split('\n').filter(function (l) { return !TRACE_LINE.test(l); }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function colourOf(raw, blockColour) {
    try {
      var c = Blockly.utils.replaceMessageReferences(raw || '');
      if (c) return Blockly.utils.parseBlockColour(c).hex;
    } catch (e) {}
    return blockColour || '#64748b';
  }

  // ---------- modelo de tópicos, lido do toolbox ativo ----------
  function build() {
    var lt = Code.workspace.options.languageTree;
    if (!lt || lt === state.tree) return;
    state.tree = lt; state.topics = []; state.byId = {}; state.byName = {}; state.rowCache = {};
    var rep = Blockly.utils.replaceMessageReferences;
    (function walk(items, parent, path) {
      (items || []).forEach(function (it) {
        if (String(it.kind || '').toUpperCase() !== 'CATEGORY') return;
        var name = rep(it.name || '');
        var id = path.concat(name).join('/');
        var t = { id: id, name: name, key: D.norm(name), parent: parent ? parent.id : null, depth: path.length, path: path.concat(name),
                  colour: colourOf(it.colour, null), custom: it.custom || '', children: [], entries: [] };
        (it.contents || []).forEach(function (c) {
          if (String(c.kind || '').toUpperCase() === 'BLOCK' && (c.type || c.blockxml)) t.entries.push(c);
        });
        (D.EXTRA[t.key] || []).forEach(function (type) { if (!t.entries.some(function (e) { return e.type === type; })) t.entries.push({ type: type, extra: true }); });
        if (parent) parent.children.push(t.id);
        state.topics.push(t); state.byId[id] = t;
        if (!state.byName[name]) state.byName[name] = t;
        walk(it.contents, t, path.concat(name));
      });
    })(lt.contents, null, []);
  }

  // ---------- uma linha por bloco ----------
  function entryXml(entry) {
    var x = entry.blockxml;
    if (x && x.nodeType === 1) return x;
    if (D.EXAMPLE_XML[entry.type]) return Blockly.Xml.textToDom(D.EXAMPLE_XML[entry.type]);
    return Blockly.Xml.textToDom('<block type="' + entry.type + '"></block>');
  }
  function generate(xmlEl) {
    var ws = null;
    try { if (window.sancabotI18n && sancabotI18n.wrapAll) sancabotI18n.wrapAll(); } catch (e) { /* blocos definidos depois do tradutor também entram em português */ }
    try {
      ws = new Blockly.Workspace();
      Blockly.Python.init(ws);
      var blk = Blockly.Xml.domToBlock(xmlEl, ws);
      var out = Blockly.Python.blockToCode(blk);
      if (Array.isArray(out)) out = out[0];
      // Funções criadas pelo aluno não devolvem comando: o gerador guarda o código em definitions_ ('%nome').
      if (!String(out || '').trim()) {
        var defs = Blockly.Python.definitions_ || {};
        out = Object.keys(defs).filter(function (k) { return k.charAt(0) === '%'; }).map(function (k) { return defs[k]; }).join('\n');
      }
      var t = blk.tooltip, tip = '';
      try { tip = typeof t === 'function' ? String(t.call(blk)) : String(t || ''); } catch (e) {}
      return { type: blk.type, label: blk.toString(), colour: blk.getColour(), python: cleanCode(out), tooltip: tip, count: blk.getDescendants(false).length };
    } catch (e) {
      return null;
    } finally { if (ws) ws.dispose(); }
  }
  function descFor(topic, g) {
    if (topic.key === 'modelos') return 'Programa pronto com ' + g.count + ' blocos encaixados. Arraste para a área de blocos e mude os valores.';
    return D.DESC[topic.name + '/' + g.type] || D.DESC[g.type] || g.tooltip || 'Bloco ' + g.label + '.';
  }
  function rowsOf(topic) {
    // "Experimental" é dinâmica: os blocos vêm do carregador (criados no SancaBot Studio Creator) e podem mudar; sem cache.
    var dynamic = topic.custom === 'SANCABOT_EXPERIMENTAL' && window.SancaBotCustomLoader;
    if (!dynamic && state.rowCache[topic.id]) return state.rowCache[topic.id];
    var seen = {}, perType = {}, rows = [], omitted = {};
    (dynamic ? window.SancaBotCustomLoader.entries() : topic.entries).forEach(function (entry) {
      var xml = entryXml(entry), text = Blockly.Xml.domToText(xml);
      if (seen[text]) return; seen[text] = 1;
      var g = generate(xml); if (!g) return;
      perType[g.type] = (perType[g.type] || 0) + 1;
      if (perType[g.type] > MAX_VARIANTS) { omitted[g.type] = (omitted[g.type] || { n: 0, label: g.label }); omitted[g.type].n++; return; }
      rows.push({ topic: topic, type: g.type, label: g.label, colour: g.colour, python: g.python || NO_CODE_BY_TYPE[g.type] || NO_CODE, desc: descFor(topic, g), xml: xml, xmlText: text });
    });
    var res = { rows: rows, omitted: Object.keys(omitted).map(function (k) { return { type: k, n: omitted[k].n, label: omitted[k].label }; }) };
    if (!dynamic) state.rowCache[topic.id] = res;
    return res;
  }
  function allRows() { var all = []; state.topics.forEach(function (t) { rowsOf(t).rows.forEach(function (r) { all.push(r); }); }); return all; }

  // ---------- inserir bloco na área de trabalho ----------
  function viewMetrics() {
    var ws = Code.workspace;
    try { return ws.getMetricsManager().getViewMetrics(true); } catch (e) {}
    var m = ws.getMetrics(); return { left: m.viewLeft, top: m.viewTop, width: m.viewWidth, height: m.viewHeight };
  }
  function toWorkspace(clientX, clientY) {
    var ws = Code.workspace, mm = ws.getMetricsManager(), r = ws.getInjectionDiv().getBoundingClientRect();
    var abs = mm.getAbsoluteMetrics(), view = mm.getViewMetrics(true);
    return { x: view.left + (clientX - r.left - abs.left) / ws.scale, y: view.top + (clientY - r.top - abs.top) / ws.scale };
  }
  function insert(xmlEl, at) {
    var ws = Code.workspace, blk = null;
    Blockly.Events.setGroup(true);
    try {
      blk = Blockly.Xml.domToBlock(xmlEl.cloneNode(true), ws);
      var p = at;
      if (!p) {
        // Os painéis são camadas por cima da área de desenho: entra na parte que fica livre (fora da caixa de blocos aberta).
        var v = viewMetrics(), n = state.inserted++ % 8;
        var ins = (window.SancaBotPanels && window.SancaBotPanels.insets) ? window.SancaBotPanels.insets() : { left: 0 };
        p = { x: v.left + (ins.left || 0) / ws.scale + 40 + n * 24, y: v.top + 40 + n * 24 };
      }
      var xy = blk.getRelativeToSurfaceXY();
      blk.moveBy(p.x - xy.x, p.y - xy.y);
      blk.select();
    } finally { Blockly.Events.setGroup(false); }
    return blk;
  }
  function insertFromRow(row, at) {
    var blk = insert(row.xml, at);
    announce('Bloco "' + row.label + '" adicionado à área de blocos');
    return blk;
  }
  function announce(msg) {
    if (!ui.live) return;
    ui.live.textContent = ''; setTimeout(function () { ui.live.textContent = msg; }, 30);
  }
  function copyText(text, btn) {
    var done = function () { var o = btn.textContent; btn.textContent = 'Copiado!'; setTimeout(function () { btn.textContent = o; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { var t = el('textarea'); t.value = text; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} t.remove(); }
  }

  // Arrastar uma linha da Referência para a área de blocos
  function setupDrop() {
    if (setupDrop.done) return; setupDrop.done = true;
    var div = Code.workspace.getInjectionDiv();
    var has = function (e) { var t = e.dataTransfer && e.dataTransfer.types; return t && Array.prototype.indexOf.call(t, MIME) >= 0; };
    div.addEventListener('dragover', function (e) { if (!has(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; div.classList.add('sb-drop'); });
    div.addEventListener('dragleave', function () { div.classList.remove('sb-drop'); });
    div.addEventListener('drop', function (e) {
      div.classList.remove('sb-drop');
      if (!has(e)) return;
      e.preventDefault();
      try {
        var dom = Blockly.Xml.textToDom(e.dataTransfer.getData(MIME));
        var blk = insert(dom, toWorkspace(e.clientX, e.clientY));
        announce('Bloco "' + blk.toString() + '" adicionado à área de blocos');
      } catch (err) { console.error('[SancaBot referência] não consegui soltar o bloco:', err); }
    });
    document.addEventListener('dragend', function () { div.classList.remove('sb-drop'); });
  }

  // ---------- interface ----------
  function rowNode(r, showTopic) {
    var box = el('div', 'sb-row');
    box.draggable = true;
    box.title = 'Arraste para a área de blocos, ou use o botão "Usar bloco"';
    box.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData(MIME, r.xmlText); e.dataTransfer.setData('text/plain', r.python); e.dataTransfer.effectAllowed = 'copy';
    });
    var head = el('div', 'sb-row-head');
    head.appendChild(el('span', 'sb-grip', '⠿'));
    var chip = el('span', 'sb-block', r.label); chip.style.background = r.colour || '#555'; head.appendChild(chip);
    box.appendChild(head);
    if (showTopic) box.appendChild(el('div', 'sb-where', r.topic.path.join(' › ')));
    box.appendChild(el('p', 'sb-note', r.desc));
    var pre = el('pre'); pre.appendChild(el('code', null, r.python)); box.appendChild(pre);
    var acts = el('div', 'sb-row-acts');
    var use = el('button', 'sb-mini', 'Usar bloco'); use.type = 'button'; use.title = 'Coloca este bloco (com os blocos que vêm junto) na área de trabalho';
    use.addEventListener('click', function () { insertFromRow(r); });
    var cp = el('button', 'sb-mini', 'Copiar Python'); cp.type = 'button';
    cp.addEventListener('click', function () { copyText(r.python, cp); });
    acts.appendChild(use); acts.appendChild(cp); box.appendChild(acts);
    return box;
  }
  function titleOf(t) {
    var pt = D.TITLE_PT[t.key];
    return pt && D.norm(pt) !== t.key ? t.name + ' · ' + pt : t.name;
  }
  function renderTopic(t) {
    var c = ui.content; c.textContent = '';
    var info = D.CATEGORY[t.key] || {};
    var head = el('div', 'sb-topic-head'); head.style.borderLeftColor = t.colour;
    if (t.depth > 0) head.appendChild(el('div', 'sb-crumb', t.path.slice(0, -1).join(' › ')));
    head.appendChild(el('h3', null, titleOf(t)));
    c.appendChild(head);
    c.appendChild(el('p', 'sb-intro', info.intro || 'Blocos desta categoria da caixa de blocos.'));
    if (info.how && info.how.length) {
      var ul = el('ul', 'sb-how'); info.how.forEach(function (h) { ul.appendChild(el('li', null, h)); }); c.appendChild(ul);
    }
    if (t.children.length) {
      var sub = el('div', 'sb-chips'); sub.setAttribute('role', 'group'); sub.setAttribute('aria-label', 'Subcategorias');
      t.children.forEach(function (cid) {
        var ch = state.byId[cid], b = el('button', 'sb-chip', ch.name); b.type = 'button';
        b.addEventListener('click', function () { show(ch.id); }); sub.appendChild(b);
      });
      c.appendChild(sub);
    }
    var res = rowsOf(t);
    if (res.rows.length) c.appendChild(el('div', 'sb-count', res.rows.length + (res.rows.length === 1 ? ' bloco' : ' blocos') + ' nesta categoria'));
    else if (!t.children.length) c.appendChild(el('p', 'sb-empty', t.key === 'experimental' ? 'Nenhum bloco em teste agora.' : 'Esta categoria não tem blocos fixos na caixa de blocos.'));
    res.rows.forEach(function (r) { c.appendChild(rowNode(r, false)); });
    res.omitted.forEach(function (o) { c.appendChild(el('p', 'sb-more', 'Há mais ' + o.n + ' variações de “' + o.label + '” na caixa de blocos.')); });
    if (info.tip) c.appendChild(el('p', 'sb-tip', 'Dica: ' + info.tip));
    c.scrollTop = 0;
  }
  function renderSearch(q) {
    var c = ui.content; c.textContent = '';
    var nq = D.norm(q), terms = nq.split(/\s+/).filter(Boolean);
    var hits = allRows().filter(function (r) {
      var hay = D.norm(r.label + ' ' + r.desc + ' ' + r.python + ' ' + r.type + ' ' + r.topic.path.join(' '));
      return terms.every(function (t) { return hay.indexOf(t) >= 0; });
    });
    c.appendChild(el('div', 'sb-count', hits.length + (hits.length === 1 ? ' resultado' : ' resultados') + ' para “' + q + '”' + (hits.length > 60 ? ' (mostrando 60)' : '')));
    if (!hits.length) c.appendChild(el('p', 'sb-empty', 'Nada encontrado. Tente outra palavra, como “distância”, “motor” ou “repetir”.'));
    hits.slice(0, 60).forEach(function (r) { c.appendChild(rowNode(r, true)); });
    c.scrollTop = 0;
  }
  function show(id) {
    var t = state.byId[id]; if (!t) return false;
    state.current = t.id; state.query = ''; if (ui.search) ui.search.value = '';
    if (ui.select) ui.select.value = t.id;
    markChips(); renderTopic(t);
    return true;
  }
  function markChips() {
    if (!ui.chips) return;
    Array.prototype.forEach.call(ui.chips.children, function (b) { b.setAttribute('aria-pressed', b.dataset.id === state.current && !state.query ? 'true' : 'false'); });
  }
  function showByName(name) {
    var t = state.byName[name];
    if (!t) { var n = D.norm(name); t = state.topics.filter(function (x) { return x.key === n; })[0]; }
    return t ? show(t.id) : false;
  }

  function render(host, opts) {
    opts = opts || {};
    state.follow = opts.follow !== false; state.onFollow = opts.onFollow || null;
    if (host && !host.dataset.sbBuilt) {
      host.dataset.sbBuilt = '1'; ui.host = host; host.textContent = '';
      var top = el('div', 'sb-ref-top');
      ui.search = el('input', 'sb-search'); ui.search.type = 'search'; ui.search.placeholder = 'Buscar bloco ou comando…';
      ui.search.setAttribute('aria-label', 'Buscar bloco ou comando em toda a referência');
      var fl = el('label', 'sb-follow'); ui.follow = el('input'); ui.follow.type = 'checkbox'; ui.follow.checked = state.follow;
      fl.appendChild(ui.follow); fl.appendChild(document.createTextNode(' Seguir a caixa de blocos'));
      fl.title = 'Ao escolher uma categoria na caixa de blocos, abre aqui a referência dela';
      top.appendChild(ui.search); top.appendChild(fl); host.appendChild(top);
      ui.chips = el('div', 'sb-chips'); ui.chips.setAttribute('role', 'group'); ui.chips.setAttribute('aria-label', 'Categorias do SancaBot');
      ui.select = el('select', 'sb-topic-select'); ui.select.setAttribute('aria-label', 'Todas as categorias');
      var navRow = el('div', 'sb-navrow'); navRow.appendChild(ui.chips); navRow.appendChild(ui.select); host.appendChild(navRow);
      ui.content = el('div', 'sb-ref-content'); host.appendChild(ui.content);
      ui.live = el('div', 'sb-live'); ui.live.setAttribute('aria-live', 'polite'); host.appendChild(ui.live);

      var timer = 0;
      ui.search.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var q = ui.search.value.trim();
          if (q.length >= 2) { state.query = q; markChips(); renderSearch(q); }
          else { state.query = ''; show(state.current || (state.topics[0] && state.topics[0].id)); }
        }, 180);
      });
      ui.follow.addEventListener('change', function () { state.follow = ui.follow.checked; if (state.onFollow) state.onFollow(state.follow); });
      ui.select.addEventListener('change', function () { show(ui.select.value); });
      setupDrop();
    }
    populate();
    if (!state.current || !state.byId[state.current]) { var first = state.byName['Movimento'] || state.topics[0]; if (first) show(first.id); }
    else if (state.query) renderSearch(state.query); else show(state.current);
  }
  function populate() {
    build();
    if (!ui.chips) return;
    ui.chips.textContent = ''; ui.select.textContent = '';
    state.topics.forEach(function (t) {
      var opt = el('option', null, new Array(t.depth + 1).join('— ') + t.name); opt.value = t.id; ui.select.appendChild(opt);
      if (t.parent && state.byId[t.parent].depth === 0 && state.byId[t.parent].key === 'sancabot') {
        var b = el('button', 'sb-chip', t.name); b.type = 'button'; b.dataset.id = t.id; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { show(t.id); }); ui.chips.appendChild(b);
      }
    });
    markChips();
  }
  function setFollow(v) { state.follow = !!v; if (ui.follow) ui.follow.checked = state.follow; }

  return {
    render: render, showByName: showByName, show: show, setFollow: setFollow, isFollowing: function () { return state.follow; },
    prepare: function () { build(); }, topics: function () { build(); return state.topics; }, rowsOf: rowsOf, allRows: function () { build(); return allRows(); },
    insertFromRow: insertFromRow, current: function () { return state.byId[state.current]; }, generate: generate, cleanCode: cleanCode
  };
})();
