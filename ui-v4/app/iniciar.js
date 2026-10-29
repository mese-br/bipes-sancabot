/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4 (F5): INICIAR A APLICAÇÃO. Cria, nesta ordem, o que o resto do código espera encontrar como objetos globais:
   Channel (conexão com o robô), terminal (xterm), Files (arquivos), UI (interface) e os atalhos de teclado.
   Antes isso era um <script> dentro do index.html, junto com o cookie do BIPES, a tela de boas-vindas e o Google Analytics (removidos). */
'use strict';

/* Conexão com o robô (ver core/channel.js): Serial, Bluetooth, Wi-Fi e o seletor entre eles */
var Channel = {};
Channel['websocket'] = new websocket();
Channel['webserial'] = new webserial();
Channel['webbluetooth'] = new webbluetooth();
Channel['mux'] = new mux();

/* Terminal do Console, em azul-marinho da marca, letra maior e cursor amarelo */
var terminal = new Terminal();
term.init('#term');
try {
  terminal.setOption('theme', { background: '#1B2250', foreground: '#EAF0FF', cursor: '#FFD23F', cursorAccent: '#1B2250', selection: 'rgba(76,159,255,.45)' });
  terminal.setOption('fontSize', 14);
  term.resize();
} catch (e) { /* ok */ }

/* Arquivos do robô e editor (ver core/utils.js) */
var Files = new files('#fileList');

/* Interface (ver app/ui.js) */
var UI = {};
UI['responsive'] = new Responsive();
UI['notify'] = new Notify();
UI['progress'] = new Progress();
UI['account'] = new Account('#accountButton', '.account-panel');
UI['notify-panel'] = new Panel('#notificationButton', '.notify-panel');
UI['channel-panel'] = new ChannelPanel('#channelButton', '.channel-panel');
UI['toolbar'] = new Panel('#toolbarButton', '.toolbar');
UI['workspace'] = new Workspace();

/* Não usar dados da sessão anterior (ponte serial → freeboard do BIPES) */
Tool.clearQueue();

/* Atalhos de teclado (core/shortcut.js) */
window.addEventListener('load', function () {
  shortcut.add('Ctrl+Shift+L', function () { Tool.exportScreenshot(); });                          // foto dos blocos
  shortcut.add('Ctrl+Shift+E', function () { Code.handleLink('console', 1); Tool.runPython(); });    // rodar e ir para o Console
  shortcut.add('Ctrl+Shift+R', function () { Tool.runPython(); });                                  // rodar
  shortcut.add('Ctrl+Shift+S', function () { Tool.stopPython(); });                                 // parar
});

/* Console: refaz o tamanho do terminal quando algo dentro da tela muda de altura (a imagem da dica carrega, a fonte chega...) */
(function () {
  const tela = document.getElementById('content_console'), t = document.getElementById('term');
  if (!tela || !t || !window.ResizeObserver) return;
  let espera = 0;
  const ro = new ResizeObserver(() => { clearTimeout(espera); espera = setTimeout(() => term.resize(), 120); });
  ro.observe(tela);
  Array.from(tela.children).forEach(c => { if (!c.contains(t)) ro.observe(c); });
})();

/* Reforço (se o navegador demorar a avisar mudanças de tamanho): mede de novo quando a página e as fontes terminam de carregar */
window.addEventListener('load', () => setTimeout(() => term.resize(), 500));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(() => term.resize(), 200));

/* Tela lembrada ao recarregar: agora que terminal, arquivos e interface existem, prepara a tela (tamanho do terminal, editor...) e tira o CSS provisório */
(function () {
  const aba = document.documentElement.getAttribute('data-aba');
  if (!aba) return;
  Code.renderContent(aba);
  requestAnimationFrame(() => document.documentElement.removeAttribute('data-aba'));
  setTimeout(() => document.documentElement.removeAttribute('data-aba'), 600);   // se o navegador não desenhar quadros (aba em segundo plano)
})();
