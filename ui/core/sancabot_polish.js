/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: acabamento do editor para iniciantes (parâmetros em core/sancabot_config.js).
   1) Rótulos sem espaços sobrando ("mostrar na aba IoT " vira "mostrar na aba IoT"): espaço nas pontas ou duplo aparece como "buraco" no bloco.
   2) Modo iniciante: esconde categorias técnicas (fica só o que está em keepCategories); uma chave "Avançado" na caixa de blocos liga e desliga (a escolha fica no navegador).
   3) Projetos antigos: "User" e "My project" do bloco de dados do projeto viram os textos padrão em português.
   Carregar depois de block_definitions*.js e sancabot_i18n_ptbr.js. */
(function () {
  'use strict';
  var B = window.Blockly, CFG = window.SancaBotConfig || {};
  if (!B) return;

  // ---------- 0) cor de cada bloco do SancaBot pelo PAPEL (paleta em sancabot_config.js) ----------
  var PAL = CFG.palette || {};
  var ROLE = {
    prep: ['sancabot_config', 'sancabot_distance_sensor', 'sancabot_calibrate', 'sancabot_turn_calibration'],
    move: ['sancabot_motion_scene', 'sancabot_move_mode', 'sancabot_stop', 'sancabot_observe_drive'],
    time: ['sancabot_wait', 'sancabot_time_seconds', 'sancabot_angle_degrees', 'sancabot_timer_start', 'sancabot_timer_seconds'],
    sense: ['sancabot_distance_cm', 'sancabot_panel_number'],
    decide: ['sancabot_if_obstacle', 'sancabot_exp_if_else'],
    repeat: ['sancabot_observe_scene', 'sancabot_explore_until', 'sancabot_explore_forever', 'sancabot_break_explore',
             'sancabot_exp_repeat_times', 'sancabot_exp_repeat_while', 'sancabot_exp_repeat_until', 'sancabot_exp_repeat_condition'],
    calc: ['sancabot_obstacle_near', 'sancabot_ultrasonic_condition', 'sancabot_logic_join', 'sancabot_timer_condition']
  };
  var ROLE_OF = {};
  Object.keys(ROLE).forEach(function (r) { ROLE[r].forEach(function (t) { ROLE_OF[t] = r; }); });
  // blocos de hardware/BIPES: papel herdado da categoria (arquivo gerado sancabot_block_roles.js)
  var GEN = window.SancaBotBlockRoles || {};
  Object.keys(GEN).forEach(function (r) { GEN[r].forEach(function (t) { if (!ROLE_OF[t]) ROLE_OF[t] = r; }); });

  // Ícone no começo de cada bloco do SancaBot (SancaBotIcons em sancabot_icons.js; traço na cor do texto)
  var ICON_OF = {
    sancabot_config: 'prep', sancabot_distance_sensor: 'sense', sancabot_calibrate: 'prep', sancabot_turn_calibration: 'turn',
    sancabot_motion_scene: 'move', sancabot_move_mode: 'move', sancabot_stop: 'stop', sancabot_observe_drive: 'move',
    sancabot_wait: 'time', sancabot_time_seconds: 'time', sancabot_angle_degrees: 'turn', sancabot_timer_start: 'time',
    sancabot_timer_seconds: 'time', sancabot_timer_condition: 'time', sancabot_distance_cm: 'sense', sancabot_panel_number: 'sense',
    sancabot_obstacle_near: 'sense', sancabot_ultrasonic_condition: 'sense', sancabot_if_obstacle: 'decide', sancabot_exp_if_else: 'decide',
    sancabot_observe_scene: 'repeat', sancabot_explore_until: 'repeat', sancabot_explore_forever: 'repeat', sancabot_break_explore: 'stop',
    sancabot_exp_repeat_times: 'repeat', sancabot_exp_repeat_while: 'repeat', sancabot_exp_repeat_until: 'repeat', sancabot_exp_repeat_condition: 'repeat',
    sancabot_logic_join: 'calc'
  };
  function addIcon(block, type) {
    var name = ICON_OF[type], I = window.SancaBotIcons;
    if (!name || !I || !B.FieldImage || !block.inputList || !block.inputList[0]) return;
    try { block.inputList[0].insertFieldAt(0, new B.FieldImage(I.uri(name, CFG.ink || '#1B2250', 24), 20, 20, '', null)); } catch (e) { /* sem ícone, o bloco funciona igual */ }
  }

  // O texto escuro nos papéis claros (amarelo, laranja, verde) é aplicado pelo tema (classe sb-ink-dark; ver sancabot_scratch_theme.js).

  // ---------- 1) rótulos sem espaço sobrando ----------
  function cleanText(s) { return typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : s; }
  function cleanBlock(block) {
    (block.inputList || []).forEach(function (input) {
      (input.fieldRow || []).forEach(function (f) {
        try {
          if (f instanceof B.FieldLabel) {
            var v = f.getValue(), c = cleanText(v);
            if (c && c !== v) f.setValue(c);
          }
        } catch (e) { /* um campo problemático não pode quebrar o bloco */ }
      });
    });
  }
  function wrapAll() {
    Object.keys(B.Blocks).forEach(function (type) {
      var def = B.Blocks[type];
      if (!def || typeof def.init !== 'function' || def.__sbPolish) return;
      var orig = def.init;
      def.init = function () { var r = orig.apply(this, arguments); cleanBlock(this); var role = ROLE_OF[type]; if (role && PAL[role]) this.setColour(PAL[role]); addIcon(this, type); return r; };
      def.__sbPolish = true;
    });
  }
  wrapAll();

  // ---------- 2) modo iniciante ----------
  var BEG = CFG.beginner || {};
  var KEY = BEG.storageKey || 'sancabot_modo_avancado';
  function advancedOn() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setAdvanced(on) {
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* sem armazenamento: vale só nesta sessão */ }
    apply();
  }
  function apply() {
    var beginner = BEG.enabled !== false && !advancedOn();
    document.documentElement.classList.toggle('sb-beginner', beginner);
    var cb = document.getElementById('sbAdvSwitch'); if (cb) cb.checked = !beginner;
    markCategories(); syncReferenceSelect();
  }
  function norm(t) { return String(t || '').trim(); }
  function labelOf(c) { return c.querySelector(':scope > .blocklyToolboxCategory .blocklyToolboxCategoryLabel'); }
  // No modo iniciante o grupo "Laboratório Avançado" mostra só as categorias de keepCategories (ex.: Lógica e Matemática),
  // com o nome beginner.parentLabel; no modo avançado volta ao nome e às categorias de sempre.
  function markCategories() {
    var parentName = norm(BEG.advancedParent || 'Laboratório Avançado'), keep = (BEG.keepCategories || []).map(norm);
    document.querySelectorAll('.blocklyToolboxCategoryContainer').forEach(function (c) {
      var lab = labelOf(c); if (!lab) return;
      var orig = c.dataset.sbOrig || norm(lab.textContent);
      if (orig === parentName) {
        c.dataset.sbOrig = orig; c.classList.add('sb-adv-parent');
        c.querySelectorAll(':scope > .blocklyToolboxCategoryGroup > .blocklyToolboxCategoryContainer').forEach(function (k) {
          var kl = labelOf(k); if (kl && keep.indexOf(norm(kl.textContent)) === -1) k.classList.add('sb-adv');
        });
        var shown = document.documentElement.classList.contains('sb-beginner') && keep.length ? (BEG.parentLabel || 'Lógica e matemática') : orig;
        if (lab.textContent !== shown) lab.textContent = shown;
      }
    });
  }
  // Painel Referência: o seletor de categorias segue a mesma regra (iniciante só vê o que a caixa de blocos mostra).
  function syncReferenceSelect() {
    var sel = document.querySelector('.sb-panel select'); if (!sel) return;
    var parentName = norm(BEG.advancedParent || 'Laboratório Avançado'), keep = (BEG.keepCategories || []).map(norm);
    var beginner = document.documentElement.classList.contains('sb-beginner') && keep.length;
    var inAdv = false;
    Array.prototype.forEach.call(sel.options, function (o) {
      if (o.dataset.sbOrig === undefined) o.dataset.sbOrig = o.textContent;
      var raw = o.dataset.sbOrig, depth = (raw.match(/^(— )*/)[0].length) / 2, name = norm(raw.replace(/^(— )+/, ''));
      var hide = false, text = raw;
      if (depth === 0) { inAdv = name === parentName; if (inAdv && beginner) text = norm(BEG.parentLabel || 'Lógica e matemática'); }
      else if (inAdv && beginner) hide = !(depth === 1 && keep.indexOf(name) !== -1);
      if (o.textContent !== text) o.textContent = text;
      if (o.hidden !== hide) { o.hidden = hide; o.disabled = hide; }
    });
  }
  function ensureSwitch() {
    var head = document.querySelector('.sb-tb-head');
    if (!head || document.getElementById('sbAdvSwitch')) return;
    var label = document.createElement('label');
    label.className = 'sb-adv-switch';
    label.title = 'Mostra os blocos técnicos (sensores, telas, redes, Python...). Para quem já domina o básico.';
    label.innerHTML = '<input type="checkbox" id="sbAdvSwitch"><span class="sb-adv-track" aria-hidden="true"></span><span class="sb-adv-text">Avançado</span>';
    var pin = head.querySelector('.sb-pinbtn');
    head.insertBefore(label, pin ? pin.nextSibling : head.firstChild);
    label.querySelector('input').addEventListener('change', function (e) { setAdvanced(e.target.checked); });
    apply();
  }
  var obsTimer = 0;
  new MutationObserver(function () {
    clearTimeout(obsTimer);
    obsTimer = setTimeout(function () { markCategories(); syncReferenceSelect(); ensureSwitch(); }, 60);
  }).observe(document.body || document.documentElement, { childList: true, subtree: true });
  apply();

  // ---------- 3) textos padrão em projetos que já existem ----------
  var D = CFG.defaults || {};
  var OLD = { project_author: ['User'], project_description: ['My project'] };
  var NEW = { project_author: D.author || 'Aluno', project_description: D.description || 'Meu projeto' };
  function migrateDefaults() {
    var ws = window.Code && Code.workspace; if (!ws || !ws.getBlocksByType) return;
    ws.getBlocksByType('project_metadata', false).forEach(function (b) {
      Object.keys(OLD).forEach(function (input) {
        var t = b.getInputTargetBlock(input); if (!t) return;
        var f = t.getField('TEXT'); if (!f) return;
        if (OLD[input].indexOf(f.getValue()) !== -1) f.setValue(NEW[input]);
      });
    });
  }
  var tries = 0, mt = setInterval(function () {
    migrateDefaults();
    if (++tries > 6) clearInterval(mt);
  }, 800);

  // ---------- fontes: se o bloco foi medido antes da Nunito carregar, os campos guardam a largura errada (texto colado);
  // quando a fonte fica pronta, cada campo mede de novo ----------
  function remeasure() {
    var ws = window.Code && Code.workspace;
    if (!ws) return;
    try {
      ws.getAllBlocks(false).forEach(function (b) {
        (b.inputList || []).forEach(function (i) { (i.fieldRow || []).forEach(function (f) { try { f.forceRerender(); } catch (e) { /* ok */ } }); });
      });
    } catch (e) { /* tudo bem */ }
  }
  if (document.fonts && document.fonts.load) {
    var fam = (CFG.font && CFG.font.family) || 'Nunito', wt = (CFG.font && CFG.font.weight) || '800', sz = (CFG.font && CFG.font.size) || 13;
    document.fonts.load(wt + ' ' + sz + 'pt "' + fam + '"').then(function () {
      remeasure(); setTimeout(remeasure, 600); setTimeout(remeasure, 2000);
    }, function () { /* sem a fonte: usa a reserva */ });
  }

  // ---------- grupos da caixa de blocos (SancaBot, Lógica e matemática...): o clique no cabeçalho é um interruptor ----------
  // Fechado -> abre e já mostra a primeira categoria. Aberto -> fecha. O Blockly só recolhe quando o cabeçalho já estava selecionado
  // (e nós selecionamos a primeira categoria), então aqui o clique no cabeçalho é tratado por nós, antes do Blockly.
  (function hookGroups() {
    function headerRow(t) {
      var row = t && t.closest && t.closest('.blocklyToolboxCategory');
      if (!row || !row.parentElement || !row.parentElement.querySelector(':scope > .blocklyToolboxCategoryGroup')) return null;
      return row;
    }
    function itemOf(row) {
      var tb = window.Code && Code.workspace && Code.workspace.getToolbox && Code.workspace.getToolbox();
      if (!tb) return null;
      var id = row.id || row.parentElement.id;
      return { tb: tb, item: (tb.getToolboxItemById && tb.getToolboxItemById(id)) || null };
    }
    ['pointerdown', 'pointerup', 'mousedown', 'mouseup'].forEach(function (type) {
      document.addEventListener(type, function (e) { if (headerRow(e.target)) e.stopImmediatePropagation(); }, true);
    });
    document.addEventListener('click', function (e) {
      var row = headerRow(e.target); if (!row) return;
      var r = itemOf(row); if (!r || !r.item) return;
      e.stopImmediatePropagation(); e.preventDefault();
      var tb = r.tb, item = r.item;
      if (item.isExpanded()) {
        var sel = tb.getSelectedItem(), inside = false;
        for (var p = sel; p; p = p.getParent && p.getParent()) { if (p === item) { inside = true; break; } }
        item.setExpanded(false);
        if (inside) { try { tb.clearSelection(); } catch (x) { try { tb.setSelectedItem(null); } catch (y) { /* ok */ } } }
      } else {
        item.setExpanded(true);
        var first = (item.getChildToolboxItems() || []).filter(function (k) { return k.isSelectable && k.isSelectable(); })[0];
        if (first) setTimeout(function () { try { tb.setSelectedItem(first); } catch (x) { /* ok */ } }, 0);
      }
    }, true);
  })();

  window.sancabotPolish = { remeasure: remeasure, wrapAll: wrapAll, setAdvanced: setAdvanced, markCategories: markCategories, migrateDefaults: migrateDefaults };
})();
