/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4: CORES E ÍCONES DAS CATEGORIAS da caixa de blocos (à esquerda). Cada categoria ganha a cor do seu PAPEL (paleta em
   core/sancabot_config.js) e um ícone (core/sancabot_icons.js). Observa a página porque o Blockly desenha a caixa de novo ao trocar de dispositivo.
   (F4) Movido sem mudança de comportamento do <script> do index.html. */
'use strict';
function applySancaBotToolboxColors() {
  // Cor e ícone de cada categoria pelo PAPEL (paleta em core/sancabot_config.js, ícones em core/sancabot_icons.js).
  // Blockly 13: a linha é .blocklyToolboxCategory; a cor vai na variável --cat e o CSS (sancabot_scratch.css) faz o resto.
  const CF = window.SancaBotConfig || {}, P = CF.palette || {}, INK = CF.ink || '#1B2250', I = window.SancaBotIcons;
  const rules = [
    [/^sancabot$/, 'robot'],
    [/preparacao|ajustes|calibr/, 'prep'], [/movimento/, 'move'], [/sensores e leituras/, 'sense'], [/condicoes|condicao/, 'calc'],
    [/^decidir/, 'decide'], [/^repetir/, 'repeat'], [/^variavel$|contador/, 'store'], [/^tempo$|cronometro|duracao/, 'time'],
    [/modelos/, 'star'], [/experimental/, 'more'],
    [/logica e matematica/, 'calc'], [/laboratorio avancado/, 'more'],
    [/^logic|^logica/, 'decide'], [/^loop|^laco/, 'repeat'], [/^math|^matem/, 'calc'], [/^variable|^variaveis/, 'store'],
    [/^text|^texto/, 'text'], [/^list/, 'lists'], [/^function|^funcoes|^bipes|^python/, 'more'],
    [/temporizacao|timing/, 'time'], [/maquina|cpu|processador|pinos/, 'prep'],
    [/display|tela|led|neopixel|oled|matriz|fita|st7789/, 'text'],
    [/saidas|atuadores|motor|servo|rele/, 'move'], [/^sons/, 'time'],
    [/sensor|ultra|gps|camera|oximetro|inercial|rfid|encoder|onewire|dht|anemometro|pluviometro/, 'sense'],
    [/rede|http|wifi|mqtt|e-mail|email|comunic|uart|spi|i2c|gsm|socket|cliente|servidor|ntp|bluetooth/, 'net'], [/arquivo/, 'more']
  ];
  document.querySelectorAll('.blocklyToolboxCategoryLabel').forEach(label => {
    const row = label.closest('.blocklyToolboxCategory');
    if (!row) return;
    const key = (label.textContent || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const hit = rules.find(([re]) => re.test(key));
    const role = hit ? hit[1] : 'more';
    const color = role === 'robot' ? INK : (P[role] || P.more || '#A9B6D8');
    row.style.setProperty('--cat', color);
    row.classList.add('sancabot-toolbox-row');
    if (role === 'robot') row.classList.add('sancabot-toolbox-sancabot');
    const box = row.querySelector('.blocklyTreeRowContentContainer');
    if (box && !box.querySelector('.sb-cat-ico') && I) {
      const ico = document.createElement('span');
      ico.className = 'sb-cat-ico'; ico.setAttribute('aria-hidden', 'true');
      const glyph = role === 'robot' ? 'robot' : role === 'star' ? 'star' : I.forRole(role);
      ico.innerHTML = I.svg(glyph, role === 'robot' ? '#FFFFFF' : INK, 20);
      box.insertBefore(ico, box.firstChild);
    }
  });
}
let sancabotToolboxColorTimer;
const sancabotToolboxObserver = new MutationObserver(() => {
  clearTimeout(sancabotToolboxColorTimer);
  sancabotToolboxColorTimer = setTimeout(applySancaBotToolboxColors, 40);
});
sancabotToolboxObserver.observe(document.body, { childList: true, subtree: true });
setTimeout(applySancaBotToolboxColors, 200);
