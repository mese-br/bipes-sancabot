/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: monta a ESTRUTURA do cabeçalho (menu Projeto, botão de abas, botão Simular) logo depois do HTML do cabeçalho,
   antes do primeiro desenho da página. Assim o aluno nunca vê o cabeçalho antigo. Os cliques são ligados depois, por sancabot_layout.js
   (que usa as funções daqui). Carregar logo após </div> do .top-menu, sem defer. */
(function () {
  'use strict';
  function el(tag, attrs, html) { var e = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (html) e.innerHTML = html; return e; }
  var Cab = window.SancaBotCab = {};

  Cab.actions = function () {   // menu "Projeto": reúne Compartilhar/Link/Baixar/Abrir/Ajuda/Avisos
    var tb = document.querySelector('.top-menu .toolbar'); if (!tb) return null;
    var wrap = tb.querySelector('.sb-proj');
    if (!wrap) {
      wrap = el('div', { 'class': 'sb-proj' });
      var btn = el('button', { type: 'button', 'class': 'sb-actions-btn', 'aria-haspopup': 'menu', 'aria-expanded': 'false', title: 'Salvar, abrir, compartilhar e ajuda' }, '<svg class="sb-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg><span>Projeto</span><i class="sb-chev"></i>');
      var menu = el('div', { 'class': 'sb-actions-menu', role: 'menu' }); menu.hidden = true;
      ['linkButton', 'saveButton', 'loadButton', 'forumButton', 'notificationButton'].forEach(function (id) { var e = document.getElementById(id); if (e) { e.setAttribute('role', 'menuitem'); menu.appendChild(e); } });
      wrap.append(btn, menu);
      tb.insertBefore(wrap, document.getElementById('accountButton'));   // o perfil continua por último
    }
    return { wrap: wrap, btn: wrap.querySelector('.sb-actions-btn'), menu: wrap.querySelector('.sb-actions-menu') };
  };

  Cab.tabs = function () {   // botão com a aba atual, que vira menu nas telas menores
    var header = document.querySelector('.top-menu'), tabs = header && header.querySelector('.tabs'); if (!tabs) return null;
    var btn = header.querySelector('.sb-tabs-btn');
    if (!btn) { btn = el('button', { type: 'button', 'class': 'sb-tabs-btn', 'aria-haspopup': 'menu', 'aria-expanded': 'false', title: 'Mudar de tela' }); header.insertBefore(btn, tabs); }
    function pintar() {
      var on = tabs.querySelector('.on, .tabon') || tabs.firstElementChild, icon = on && getComputedStyle(on, '::before').content.replace(/["']/g, '');
      btn.innerHTML = '<span aria-hidden="true">' + (icon && icon !== 'none' ? icon : '🧩') + '</span><span>' + (on ? on.textContent.trim() : '') + '</span><i class="sb-chev"></i>';
      btn.setAttribute('aria-expanded', header.classList.contains('sb-tabs-open') ? 'true' : 'false');
    }
    pintar();
    return { header: header, tabs: tabs, btn: btn, pintar: pintar };
  };

  Cab.simular = function () {   // botão Simular (o simulador liga o clique depois)
    var header = document.querySelector('.top-menu'); if (!header) return null;
    var b = document.getElementById('simOpenBtn');
    if (!b) {
      b = el('button', { type: 'button', id: 'simOpenBtn', 'class': 'sim-open', 'aria-pressed': 'false', 'aria-controls': 'sbSimPanel', title: 'Simular o programa no tablado' }, '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg><span>Simular</span>');
      header.insertBefore(b, header.querySelector('.toolbar'));
    }
    return b;
  };

  Cab.montar = function () {
    Cab.actions(); Cab.tabs(); Cab.simular();
    var rb = document.getElementById('runButton'); if (rb && !rb.getAttribute('data-sb-run')) rb.setAttribute('data-sb-run', 'off');   // até o BIPES responder, "sem robô"
    var h = document.querySelector('.top-menu'); if (h) document.documentElement.style.setProperty('--sb-top', Math.round(h.getBoundingClientRect().bottom) + 'px');
  };
  Cab.montar();
})();
