/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: RETOMAR DE ONDE PAROU ao recarregar a página.
   Os blocos já são guardados pelo BIPES (storage.js), mas só 0,9 s depois da última mudança e no evento "unload", que o navegador nem sempre dispara.
   Aqui: (1) guarda os blocos também ao sair/esconder a página; (2) lembra a ABA aberta; (3) lembra o zoom e a posição da área de blocos.
   Tudo em sessionStorage: sobrevive ao recarregar, e uma janela nova começa limpa nos Blocos. */
(function () {
  'use strict';
  var K_TAB = 'sancabot_aba', K_VIEW = 'sancabot_vista';
  var RETOMAVEIS = ['tab_console', 'tab_files', 'tab_programs', 'tab_device'];   // abas que não dependem de uma conexão ou de um iframe já carregado
  function ler(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } }
  function gravar(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } }
  function ws() { return window.Code && Code.workspace; }
  function uid() { try { return UI['account'].currentProject.uid; } catch (e) { return ''; } }

  function guardarBlocos() { try { if (ws() && window.BlocklyStorage) BlocklyStorage.backupBlocks_(ws()); } catch (e) { /* ok */ } }
  function guardarVista() {
    var w = ws(); if (!w || !w.getAllBlocks || !w.getAllBlocks(false).length) return;
    gravar(K_VIEW, { uid: uid(), s: w.scale, x: w.scrollX, y: w.scrollY });
  }
  function aoSair() { guardarBlocos(); guardarVista(); }
  window.addEventListener('pagehide', aoSair);
  window.addEventListener('beforeunload', aoSair);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') aoSair(); });

  function abaAtual() { var on = document.querySelector('.top-menu .tabs > .on'); return on ? on.id : 'tab_blocks'; }
  function observarAba() {
    var tabs = document.querySelector('.top-menu .tabs'); if (!tabs) return;
    new MutationObserver(function () { gravar(K_TAB, abaAtual()); }).observe(tabs, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }
  function retomarVista() {
    var v = ler(K_VIEW), w = ws(); if (!v || !w || v.uid !== uid() || !w.getAllBlocks(false).length) return;
    try { w.setScale(v.s); w.scroll(v.x, v.y); } catch (e) { /* ok */ }
    // com a vista restaurada, passa a guardar mudanças de zoom e rolagem (com pausa, para não pesar)
    var t = 0; w.addChangeListener(function (ev) { if (ev && ev.type === 'viewport_change') { clearTimeout(t); t = setTimeout(guardarVista, 400); } });
  }
  function iniciar() {
    var tent = 0, abaFeita = false, vistaFeita = false, iv = setInterval(function () {
      var w = ws(), tabs = document.querySelector('.top-menu .tabs'), pronto = w && tabs && window.UI && UI['account'] && uid() && document.getElementById('tab_blocks');
      if (!pronto) { if (++tent > 100) { clearInterval(iv); if (window.sancabotPronto) sancabotPronto(); } return; }
      if (!abaFeita) { abaFeita = true; observarAba(); }   // a aba lembrada já nasce certa (index.html + app/code.js); aqui só passa a gravar as mudanças
      if (!vistaFeita && (w.getAllBlocks(false).length > 0 || ++tent > 25)) { vistaFeita = true; clearInterval(iv); retomarVista(); }   // espera o último projeto abrir (até ~2,5 s)
    }, 100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.SancaBotSessao = { guardar: aoSair };
})();
