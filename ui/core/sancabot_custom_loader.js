/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: carrega os blocos criados no SancaBot Studio Creator e os coloca na categoria "Experimental".

   De onde vêm os blocos:
     1) catálogo PUBLICADO pelo administrador:  GET /studio/api/blocks.php?action=published  (leitura pública, só publicados)
     2) rascunhos do próprio navegador, SÓ quando a página abre com ?creator=1 (é o "Testar no editor" do Creator)
   O último catálogo publicado fica em cache (localStorage) e é registrado ANTES de o editor restaurar o projeto salvo; senão um projeto
   que usa um bloco experimental abriria com "bloco desconhecido". A busca na rede atualiza o cache em seguida.
   Falha de rede, sem API ou sem blocos: o editor segue normal (a categoria mostra um aviso). Nada aqui altera blocos nem geradores originais. */
(function () {
  'use strict';
  var API_URL = '/studio/api/blocks.php?action=published';
  var CACHE_KEY = 'sancabot.custom.published.v1';
  var DRAFT_KEY = 'sancabot.creator.drafts.v1';
  var CAT_KEY = 'SANCABOT_EXPERIMENTAL';
  var C = window.SancaBotCustomBlocks;
  if (!C || !window.Blockly || !Blockly.Python) { console.warn('[SancaBot blocos criados] módulo base ausente; nada carregado.'); return; }

  var published = [], drafts = [], active = [];       // active: nomes registrados agora
  var useDrafts = /[?&]creator=1(&|$)/.test(location.search);

  function readJson(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
  function writeJson(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  function apply() {
    var byName = {};
    published.forEach(function (d) { byName[d && d.name] = d; });
    if (useDrafts) drafts.forEach(function (d) { byName[d && d.name] = d; });
    var list = Object.keys(byName).map(function (k) { return byName[k]; });
    // some quem saiu do catálogo
    active.forEach(function (n) { if (!byName[n]) C.unregister(n); });
    var res = C.registerAll(list, { experimental: true });   // no editor vivem em Experimental (cinza)
    active = res.filter(function (r) { return r.type; }).map(function (r) { return r.name; });
    res.filter(function (r) { return r.errors; }).forEach(function (r) { console.warn('[SancaBot blocos criados] "' + r.name + '" ignorado:', r.errors.join(' | ')); });
    try { document.dispatchEvent(new CustomEvent('sancabot:custom-blocks', { detail: { names: active.slice() } })); } catch (e) {}
  }

  function entries() {
    return active.map(function (n) {
      var d = C.registered().filter(function (x) { return x.name === n; })[0];
      return d ? { type: C.blockType(d), blockxml: C.toolboxXml(d) } : null;
    }).filter(Boolean);
  }

  // Registra já, com o cache (antes de o editor restaurar o projeto salvo).
  published = (readJson(CACHE_KEY) || {}).blocks || [];
  drafts = useDrafts ? (readJson(DRAFT_KEY) || []) : [];
  apply();

  function registerCategory(ws) {
    if (!ws.registerToolboxCategoryCallback) return;
    ws.registerToolboxCategoryCallback(CAT_KEY, function () {
      var out = entries().map(function (e) { return e.blockxml; });
      if (!out.length) out.push(Blockly.Xml.textToDom('<label text="Nenhum bloco em teste agora"></label>'));
      return out;
    });
  }
  function refreshFlyout() {
    try {
      var tb = Code.workspace.getToolbox(), sel = tb && tb.getSelectedItem && tb.getSelectedItem();
      if (sel && /experimental/i.test(sel.getName())) tb.refreshSelection();
    } catch (e) {}
  }
  function fetchPublished() {
    if (location.protocol === 'file:' || !window.fetch) return;
    fetch(API_URL, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !Array.isArray(d.blocks)) return;
        var changed = JSON.stringify(d.blocks) !== JSON.stringify(published);
        published = d.blocks; writeJson(CACHE_KEY, { blocks: d.blocks, at: Date.now() });
        if (changed) { apply(); refreshFlyout(); }
      }).catch(function () {});
  }
  function waitForEditor(tries) {
    if (window.Code && Code.workspace) { registerCategory(Code.workspace); fetchPublished(); }
    else if (tries < 100) setTimeout(function () { waitForEditor(tries + 1); }, 100);
  }
  waitForEditor(0);

  window.SancaBotCustomLoader = { entries: entries, reload: fetchPublished, names: function () { return active.slice(); }, draftsMode: useDrafts, CAT_KEY: CAT_KEY };
})();
