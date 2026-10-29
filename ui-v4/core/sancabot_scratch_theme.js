/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: aparência dos blocos "lúdica e moderna" (inspirada no estilo do Scratch, com cores e formas próprias).
   Usa o renderizador `zelos` do Blockly 13 (cantos bem arredondados, encaixes suaves, campos em forma de pílula)
   e um tema com cores vivas. Expõe window.SancaBotTheme e window.SancaBotRenderer para o Blockly.inject em code.js.
   Carregar depois de blockly13/*.js e sancabot_blockly_compat.js. */
(function () {
  'use strict';
  var B = window.Blockly;
  if (!B || !B.Theme || !B.Themes) return;

  // Cores numéricas (setColour(160)) viravam tons apagados (saturação .45, brilho .65). Aqui ficam vivas e claras (o texto dos blocos é escuro).
  B.utils.colour.setHsvSaturation(0.5);
  B.utils.colour.setHsvValue(1.0);

  function shade(hex, towards, amount) { return B.utils.colour.blend(towards, hex, amount); }
  // Cada cor-base gera: campo/entrada (mais clara), borda (mais escura).
  function style(hex) { return { colourPrimary: hex, colourSecondary: shade(hex, '#ffffff', 0.22), colourTertiary: shade(hex, '#000000', 0.2) }; }

  // Paleta SancaBot (mesmos papéis do Scratch: controle laranja, operadores verde, variáveis laranja forte...).
  var CFGP = (window.SancaBotConfig && window.SancaBotConfig.palette) || {};
  var P = Object.assign({ prep: '#FF7B6B', move: '#4C9FFF', sense: '#1FD3C0', decide: '#FF9A3C', repeat: '#FFD23F', calc: '#5FDB74', time: '#A58BFF', store: '#FF6FA5', text: '#F27DDC', lists: '#B5E04B', net: '#6FD3FF', more: '#A9B6D8', events: '#FFD23F' }, CFGP);
  var PAL = { text: P.text, lists: P.lists, variables: P.store, functions: P.more, colour: P.more };

  var CFG = window.SancaBotConfig || {};
  CFG.font = CFG.font || { family: 'Nunito', fallback: 'system-ui,sans-serif', weight: '800', size: 13 };
  CFG.spacing = CFG.spacing || {};
  var FONT_STACK = '"' + CFG.font.family + '",' + CFG.font.fallback;

  var theme = B.Theme.defineTheme('sancabot', {
    base: B.Themes.Zelos,
    name: 'sancabot',
    blockStyles: {
      logic_blocks: style(P.decide), loop_blocks: style(P.repeat), math_blocks: style(P.calc),
      text_blocks: style(P.text), list_blocks: style(P.lists), colour_blocks: style(P.more),
      variable_blocks: style(P.store), variable_dynamic_blocks: style(P.store),
      procedure_blocks: style(P.more), hat_blocks: style(P.events)
    },
    categoryStyles: {
      logic_category: { colour: P.decide }, loop_category: { colour: P.repeat }, math_category: { colour: P.calc },
      text_category: { colour: P.text }, list_category: { colour: P.lists }, colour_category: { colour: P.more },
      variable_category: { colour: P.store }, variable_dynamic_category: { colour: P.store }, procedure_category: { colour: P.more }
    },
    componentStyles: {
      workspaceBackgroundColour: '#F7F9FF',
      toolboxBackgroundColour: '#FFFFFF',
      toolboxForegroundColour: '#575E75',
      flyoutBackgroundColour: '#EEF2FF',
      flyoutForegroundColour: '#575E75',
      flyoutOpacity: 1,
      scrollbarColour: '#8A93B8',
      scrollbarOpacity: 0.45,
      insertionMarkerColour: '#1F2A5A',
      insertionMarkerOpacity: 0.22,
      markerColour: '#4C97FF',
      cursorColour: '#FFAB19'
    },
    fontStyle: { family: FONT_STACK, weight: String(CFG.font.weight), size: CFG.font.size },
    startHats: true
  });

  // Blocos antigos pedem cores fixas (hex) ou tons numéricos (hue). Tudo cai na paleta, sem editar as ~700 definições:
  //  - hex conhecido  -> o papel equivalente;  - número (hue) -> o papel de cor mais próxima no círculo de cores.
  var HEX_MAP = {
    '#d96a1c': P.move, '#168fd8': P.prep, '#c88a00': P.prep, '#6d5bd0': P.repeat, '#7b61ff': P.time,
    '#14b8a6': P.calc, '#00a7c7': P.sense, '#94a3b8': P.more, '#0ea5e9': P.move, '#a55b80': P.store
  };
  function hueOfHex(h) {
    var r = parseInt(h.substr(1, 2), 16) / 255, g = parseInt(h.substr(3, 2), 16) / 255, b = parseInt(h.substr(5, 2), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0;
    var hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (hh * 60 + 360) % 360;
  }
  var HUE_ROLES = ['prep', 'move', 'sense', 'decide', 'repeat', 'calc', 'time', 'store', 'text', 'lists', 'net'].map(function (k) { return { hex: P[k], hue: hueOfHex(P[k]) }; });
  function nearestRole(hue) {
    var best = HUE_ROLES[0], bd = 999;
    HUE_ROLES.forEach(function (r) { var d = Math.abs(((r.hue - hue + 540) % 360) - 180); if (d < bd) { bd = d; best = r; } });
    return best.hex;
  }
  if (!B.Block.prototype.__sbSetColour) {
    var origSetColour = B.Block.prototype.setColour;
    B.Block.prototype.setColour = function (c) {
      if (typeof c === 'string' && HEX_MAP[c.toLowerCase()]) c = HEX_MAP[c.toLowerCase()];
      else if (typeof c === 'number') c = nearestRole(c);
      return origSetColour.call(this, c);
    };
    B.Block.prototype.__sbSetColour = true;
  }

  window.SancaBotTheme = theme;
  // Renderizador próprio = Zelos com espaçamento compacto (valores em SancaBotConfig.spacing). Se algo falhar, cai no Zelos puro.
  window.SancaBotRenderer = 'zelos';
  try {
    var ZCP = B.zelos.ConstantProvider, ZR = B.zelos.Renderer, SP = CFG.spacing;
    var num = function (v, d) { return typeof v === 'number' ? v : d; };
    var SancaCP = class extends ZCP {
      constructor() {
        super();
        this.MIN_BLOCK_HEIGHT = num(SP.minBlockHeight, this.MIN_BLOCK_HEIGHT);
        this.SMALL_PADDING = num(SP.smallPadding, this.SMALL_PADDING);
        this.MEDIUM_PADDING = num(SP.mediumPadding, this.MEDIUM_PADDING);
        this.LARGE_PADDING = num(SP.largePadding, this.LARGE_PADDING);
        this.EMPTY_INLINE_INPUT_PADDING = num(SP.emptyInlineInputPadding, this.EMPTY_INLINE_INPUT_PADDING);
        this.CORNER_RADIUS = num(SP.cornerRadius, this.CORNER_RADIUS);
      }
    };
    var SancaRenderer = class extends ZR {
      makeConstants_() { return new SancaCP(); }
    };
    B.blockRendering.register('sancabot', SancaRenderer);
    window.SancaBotRenderer = 'sancabot';
  } catch (e) { console.warn('[SancaBot] renderizador próprio indisponível, usando zelos:', e); }
  window.SancaBotPalette = P;
})();
