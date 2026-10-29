/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4: MODO PASSO A PASSO (botão da tartaruga ao lado de "Rodar"). Ligado, o programa gerado ganha uma pausa de 350 ms depois de
   cada bloco, para a turma acompanhar o destaque dos blocos com calma (generator_stubs_sancabot.js lê window.sancabotSlowMode).
   (F4) O botão agora vem pronto no HTML do cabeçalho (antes era criado por JavaScript 0,6 s depois e "aparecia" no meio do cabeçalho). */
'use strict';
(function () {
  const botao = document.getElementById('sancabotSlowToggle');
  if (!botao) return;
  const ligado = localStorage.getItem('sancabot_slow_mode') === '1';
  window.sancabotSlowMode = ligado;
  botao.classList.toggle('active', ligado);
  botao.addEventListener('click', () => {
    window.sancabotSlowMode = !window.sancabotSlowMode;
    localStorage.setItem('sancabot_slow_mode', window.sancabotSlowMode ? '1' : '0');
    botao.classList.toggle('active', window.sancabotSlowMode);
  });
})();
