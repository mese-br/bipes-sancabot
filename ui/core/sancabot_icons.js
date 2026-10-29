/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: ícones simples (contorno arredondado, 24x24) para blocos e categorias.
   Desenhados para este projeto. Uso: SancaBotIcons.svg('move', '#1B2250') devolve o texto SVG;
   SancaBotIcons.uri('move', '#1B2250') devolve um data: URI (para imagens dentro dos blocos). */
(function () {
  'use strict';
  var P = {
    robot:  '<rect x="5" y="8" width="14" height="10" rx="3.5"/><path d="M12 8V5M9 13h.01M15 13h.01"/>',
    prep:   '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    move:   '<path d="M5 12h13M13 6l6 6-6 6"/>',
    turn:   '<path d="M5 17a8 8 0 0114 0M19 17l-3.2-3.2M19 17l-3.2 3.2"/>',
    stop:   '<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/>',
    sense:  '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    decide: '<path d="M9 9.2a3 3 0 116 0c0 2.2-3 2.4-3 5M12 18.6h.01"/>',
    repeat: '<path d="M4 12a8 8 0 0114-5.2M20 12a8 8 0 01-14 5.2M18 3v4h-4M6 21v-4h4"/>',
    calc:   '<path d="M12 5v14M5 12h14"/>',
    time:   '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    store:  '<path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>',
    text:   '<path d="M5 18l4.5-12L14 18M6.6 14h5.8M17 9.5c1.6 0 2.6.8 2.6 2V18M19.6 14.4c-2.4 0-3.4.7-3.4 1.8 0 1 .8 1.6 1.9 1.6 1 0 1.5-.4 1.5-1.2"/>',
    lists:  '<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>',
    net:    '<path d="M3 9.5a13 13 0 0118 0M6 13a8.5 8.5 0 0112 0M9 16.5a4 4 0 016 0M12 20h.01"/>',
    more:   '<path d="M6 12h.01M12 12h.01M18 12h.01"/>',
    star:   '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/>',
    flag:   '<path d="M6 21V4M6 5h11l-2.2 4L17 13H6"/>'
  };
  // Qual ícone representa cada papel de cor (categoria da caixa de blocos).
  var ROLE_ICON = { prep: 'prep', move: 'move', sense: 'sense', decide: 'decide', repeat: 'repeat', calc: 'calc', time: 'time', store: 'store',
                    text: 'text', lists: 'lists', net: 'net', more: 'more', events: 'flag' };

  function svg(name, color, size) {
    var body = P[name] || P.more, sz = size || 24;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || '#1B2250') +
      '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }
  function uri(name, color, size) { return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg(name, color, size)); }
  window.SancaBotIcons = { svg: svg, uri: uri, names: Object.keys(P), forRole: function (r) { return ROLE_ICON[r] || 'more'; } };
})();
