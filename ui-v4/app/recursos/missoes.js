/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4 (F4): PAINÉIS DE MISSÃO 1 a 4. Só aparecem quando o Studio abre o editor com ?mission=N (ver sancabot-studio).
   O aluno anota medidas, recebe uma sugestão calculada, rascunha o relato e "envia para o Studio" (localStorage + abre /studio/?mission=N&review=1).
   Antes eram 4 cópias quase iguais de ~130 linhas dentro do index.html; agora uma fábrica (criarPainelMissao) cuida do que é comum
   (painel, botões, rascunho salvo, envio) e cada missão só diz o que é diferente (campos, texto da sugestão, relato rascunhado, dados enviados).
   O HTML dos painéis continua no index.html (ids missionPanel, missionPanel2...). Textos e dados enviados são os mesmos da v3. */
'use strict';
(function () {
  const numero = (campo) => { const v = Number(String(campo.value || '').replace(',', '.')); return Number.isFinite(v) ? v : 0; };
  const valor = (campo) => campo.value || '';
  const preenchido = (campo, min) => (campo.value || '').trim().length >= min;

  /** Descrição de cada missão. f = campos (elementos), n = lê o número do campo. */
  const MISSOES = {
    1: {
      campos: { speed: 'Speed', time: 'Time', distance: 'Distance', target: 'Target', evidence: 'Evidence' },
      sugestao(f) {
        const velocidade = numero(f.speed), tempo = numero(f.time), distancia = numero(f.distance), alvo = numero(f.target);
        if (!tempo || !distancia) return 'Meça quanto o SancaBot andou para calcular a próxima tentativa.';
        const cmPorSegundo = distancia / tempo;
        let texto = `Seu teste deu ${cmPorSegundo.toFixed(1)} cm/s usando ${velocidade || 0}% de velocidade.`;
        if (alvo > 0 && cmPorSegundo > 0) texto += ` Para chegar a ${alvo.toFixed(1)} cm, tente: SancaBot anda frente por tempo ${(alvo / cmPorSegundo).toFixed(1)} segundos.`;
        else texto += ' Informe a distância até o alvo para receber uma sugestão.';
        return texto;
      },
      relato(f) {
        const velocidade = numero(f.speed), tempo = numero(f.time), distancia = numero(f.distance), alvo = numero(f.target);
        const cmPorSegundo = tempo && distancia ? distancia / tempo : 0, tempoSugerido = alvo && cmPorSegundo ? alvo / cmPorSegundo : 0;
        return `No teste, usei ${velocidade || 0}% de velocidade por ${tempo || 0} s e o SancaBot percorreu ${distancia || 0} cm. Para chegar ao alvo de ${alvo || 0} cm, tentei ajustar o tempo para ${tempoSugerido.toFixed(1)} s. Também observei se ele desviou e se precisei usar um giro para mirar melhor.`;
      },
      dados(f) {
        const tempo = numero(f.time), distancia = numero(f.distance), alvo = numero(f.target);
        const cmPorSegundo = tempo && distancia ? distancia / tempo : 0, tempoSugerido = alvo && cmPorSegundo ? alvo / cmPorSegundo : 0;
        return { speed: valor(f.speed), testTime: valor(f.time), distance: valor(f.distance), target: valor(f.target),
          cmPerSecond: cmPorSegundo ? cmPorSegundo.toFixed(1) : '', suggestedTime: tempoSugerido ? tempoSugerido.toFixed(1) : '' };
      },
      checks(f) {
        const tempo = numero(f.time), distancia = numero(f.distance), alvo = numero(f.target);
        const cmPorSegundo = tempo && distancia ? distancia / tempo : 0, tempoSugerido = alvo && cmPorSegundo ? alvo / cmPorSegundo : 0;
        return { track: true, forward: !!distancia, rule: !!alvo && !!tempoSugerido, evidence: preenchido(f.evidence, 30) };
      }
    },
    2: {
      campos: { speed: 'Speed', stop: 'Stop', reading: 'Reading', evidence: 'Evidence' },
      sugestao(f) {
        const velocidade = numero(f.speed), parar = numero(f.stop), leitura = numero(f.reading);
        if (!leitura || !parar) return 'Digite ou receba do console uma distância para testar a regra SE... então...';
        const acao = leitura <= parar ? 'ENTÃO parar' : `ENTÃO seguir devagar com ${velocidade || 0}%`;
        return `SE ${leitura.toFixed(1)} cm ${leitura <= parar ? '<=' : '>'} ${parar.toFixed(1)} cm, ${acao}.`;
      },
      relato(f) {
        const velocidade = numero(f.speed), parar = numero(f.stop), leitura = numero(f.reading);
        const acao = leitura && parar && leitura <= parar ? 'parou' : 'continuou';
        return `Usei velocidade ${velocidade || 0}% e distância de segurança de ${parar || 0} cm. A leitura do sensor ficou em ${leitura || 0} cm, então o SancaBot ${acao}. Ajustei o obstáculo e observei se ele parava antes de encostar.`;
      },
      dados(f) {
        const parar = numero(f.stop), leitura = numero(f.reading);
        return { speed: valor(f.speed), stopDistance: valor(f.stop), reading: valor(f.reading), decision: leitura && parar ? (leitura <= parar ? 'parar' : 'continuar') : '' };
      },
      checks(f) { return { obstacle: true, sensor: !!numero(f.reading), condition: !!numero(f.stop), evidence: preenchido(f.evidence, 30) }; }
    },
    3: {
      campos: { cargo: 'Cargo', speed: 'Speed', time: 'Time', safeDistance: 'SafeDistance', evidence: 'Evidence' },
      sugestao(f) {
        const carga = (f.cargo.value || 'objeto especial').trim() || 'objeto especial';
        const velocidade = numero(f.speed), tempo = numero(f.time), seguranca = numero(f.safeDistance);
        let texto = `Plano: empurrar ${carga} com ${velocidade || 0}% de velocidade por ${tempo || 0} s.`;
        if (seguranca > 0) texto += ` Se usar o sensor, pare quando detectar um objeto a menos de ${seguranca} cm.`;
        return texto + ' Se o objeto especial escapar, reduza a velocidade ou alinhe melhor a guia.';
      },
      relato(f) {
        const carga = (f.cargo.value || 'objeto especial').trim() || 'objeto especial';
        const velocidade = numero(f.speed), tempo = numero(f.time), seguranca = numero(f.safeDistance);
        return `Escolhi ${carga} como objeto especial. Acoplei a guia frontal e deixei o sensor ultrassom logo acima, sem bloquear a medição. Testei empurrar com ${velocidade || 0}% de velocidade por ${tempo || 0} s. Usei ${seguranca || 0} cm como limite para parar ao detectar um objeto e ajustei a rota até a zona de entrega.`;
      },
      dados(f) { return { cargo: valor(f.cargo), speed: valor(f.speed), pushTime: valor(f.time), limitDistance: valor(f.safeDistance) }; },
      checks(f) { return { setup: true, cargo: (f.cargo.value || '').trim().length > 0, route: true, sensor: true, delivery: preenchido(f.evidence, 30) }; }
    },
    4: {
      campos: { speed: 'Speed', wallLimit: 'WallLimit', turnTime: 'TurnTime', maxTime: 'MaxTime', attempts: 'Attempts', strategy: 'Strategy', evidence: 'Evidence' },
      sugestao(f) {
        const velocidade = numero(f.speed), parede = numero(f.wallLimit), giro = numero(f.turnTime), maximo = numero(f.maxTime), tentativas = numero(f.attempts);
        return `Plano: andar com ${velocidade || 0}% de velocidade, considerar parede a menos de ${parede || 0} cm, girar por ${giro || 0} s e tentar sair em ate ${maximo || 0} s. Planeje ${tentativas || 0} tentativa(s) e ajuste uma coisa por vez.`;
      },
      relato(f) {
        const velocidade = numero(f.speed), parede = numero(f.wallLimit), giro = numero(f.turnTime), maximo = numero(f.maxTime), tentativas = numero(f.attempts);
        return `Montei um labirinto com paredes baixas e testei o ultrassom antes. Programei o SancaBot para andar com ${velocidade || 0}% de velocidade, detectar parede a menos de ${parede || 0} cm, girar por ${giro || 0} s e tentar por ate ${maximo || 0} s. Fiz ${tentativas || 0} tentativa(s). Minha estrategia foi: ${f.strategy.value || 'medir, decidir e agir.'}`;
      },
      dados(f) { return { speed: valor(f.speed), wallLimit: valor(f.wallLimit), turnTime: valor(f.turnTime), maxTime: valor(f.maxTime), attempts: valor(f.attempts), strategy: valor(f.strategy) }; },
      checks(f) { return { maze: true, sensor: true, rule: true, timer: true, test: preenchido(f.evidence, 30) }; }
    }
  };

  /** Liga um painel de missão (se a URL pedir esta missão). */
  function criarPainelMissao(n) {
    if (new URLSearchParams(window.location.search).get('mission') !== String(n)) return;
    const M = MISSOES[n], sufixo = n === 1 ? '' : String(n), pref = n === 1 ? 'mission' : 'mission' + n;
    const el = (id) => document.getElementById(id);
    const painel = el('missionPanel' + sufixo), botao = el('missionPanelButton' + sufixo), fechar = el('missionPanelClose' + sufixo);
    if (!painel || !botao || !fechar) return;

    const f = {}; Object.keys(M.campos).forEach(k => { f[k] = el(pref + M.campos[k]); });
    const resultado = el(pref + 'Result'), rascunho = el(pref + 'DraftEvidence'), limpar = el(pref + 'ClearEvidence'), enviar = el(pref + 'SendStudio'), nota = el(pref + 'SaveNote');
    const chaveRascunho = `sancabot_mission_${n}_draft`, chaveStudio = `sancabot_studio_mission_${n}`, chaveCaixa = `sancabot_studio_mission_${n}_inbox`;

    painel.hidden = false; botao.hidden = false; document.body.classList.add('mission-mode');

    const atualizar = () => {
      resultado.textContent = M.sugestao(f);
      const guardado = {}; Object.keys(f).forEach(k => { guardado[k] = f[k].value || ''; });
      localStorage.setItem(chaveRascunho, JSON.stringify(guardado));
      if (nota) nota.textContent = 'Rascunho salvo neste navegador.';
    };
    const abrir = () => { painel.classList.add('open'); painel.setAttribute('aria-hidden', 'false'); botao.setAttribute('aria-expanded', 'true'); };
    const fecharPainel = () => { painel.classList.remove('open'); painel.setAttribute('aria-hidden', 'true'); botao.setAttribute('aria-expanded', 'false'); };

    try {
      const salvo = JSON.parse(localStorage.getItem(chaveRascunho) || '{}');
      Object.keys(f).forEach(k => { if (salvo[k] !== undefined) f[k].value = salvo[k]; });
    } catch (erro) { console.warn(n === 1 ? 'Nao foi possivel carregar a missao salva.' : `Nao foi possivel carregar a missao ${n} salva.`, erro); }

    Object.keys(f).forEach(k => f[k].addEventListener('input', atualizar));
    rascunho.addEventListener('click', () => { f.evidence.value = M.relato(f); atualizar(); f.evidence.focus(); });
    limpar.addEventListener('click', () => { f.evidence.value = ''; atualizar(); });
    if (enviar) enviar.addEventListener('click', () => {
      const dados = Object.assign({ source: 'bipes', mission: n, receivedAt: new Date().toISOString() }, M.dados(f), { evidence: valor(f.evidence), checks: M.checks(f) });
      localStorage.setItem(chaveStudio, JSON.stringify(dados));
      localStorage.setItem(chaveCaixa, JSON.stringify(dados));
      if (nota) nota.textContent = 'Registro enviado para o Studio.';
      window.open(window.location.origin + `/studio/?mission=${n}&review=1`, '_blank');
    });
    botao.addEventListener('click', () => painel.classList.contains('open') ? fecharPainel() : abrir());
    fechar.addEventListener('click', fecharPainel);
    atualizar();
    abrir();
  }

  window.SancaBotMissoes = { criar: criarPainelMissao, descricao: MISSOES };
  [1, 2, 3, 4].forEach(n => setTimeout(() => criarPainelMissao(n), 250));
})();
