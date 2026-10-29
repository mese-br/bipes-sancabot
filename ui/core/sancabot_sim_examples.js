/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: EXEMPLOS PRONTOS para o simulador (menu "Exemplos" no painel do simulador).
   Cada exemplo traz o cenário (rota-alvo, obstáculos, desvio do mundo real) e o PROGRAMA em blocos. Ao escolher um, o editor
   carrega os blocos e o simulador roda na hora. Para criar o seu: copie um item de EXEMPLOS e mude.

   Formato de um exemplo:
     { id, titulo, nivel, descricao, dica,
       rota:       'reta' | 'quadrado' | 'oito' | 's' | 'nenhuma' | { pontos: [[x, y], ...] }   // em cm, tablado de 120 x 80
       obstaculos: [{ tipo: 'parede'|'caixa'|'cone'|'corredor'|'portao'|'canto', x, y, rot }],  // x,y em cm; rot em graus
       desvio:     0..3   (0 nenhum, 1 pequeno, 2 médio, 3 grande: a roda esquerda fica mais fraca),
       xml:        programa em blocos (Blockly XML) }

   Os tempos dos programas são CALCULADOS a partir de sancabot_config.js (robot.trackCm e giro calibrado): se você medir o robô e
   trocar esses valores, os exemplos continuam certos. A conta: a 50% o robô anda v50 = (π/2 / T90) · distância_entre_rodas / 2 cm/s,
   e gira 90° em T90 segundos. */
(function () {
  'use strict';
  var CF = window.SancaBotConfig || {}, R = Object.assign({ trackCm: 10, turn90At50: 1.0 }, CF.robot || {});
  var v50 = (Math.PI / 2 / R.turn90At50) * R.trackCm / 2;                  // cm/s a 50%
  function seg(cm) { return Math.round(cm / v50 * 10) / 10; }               // segundos para andar "cm" a 50%
  var T90 = R.turn90At50;                                                    // segundos para girar 90° a 50%

  /* ----- peças para montar programas (cada uma devolve texto XML; "next" é o que vem depois) ----- */
  function X(body) { return '<xml xmlns="https://developers.google.com/blockly/xml">' + body + '</xml>'; }
  function preparar(next) { return '<block type="sancabot_config" x="30" y="30"><next>' + (next || '') + '</next></block>'; }
  function sensor(next) { return '<block type="sancabot_distance_sensor"><field name="READ_INTERVAL">0.2</field>' + (next ? '<next>' + next + '</next>' : '') + '</block>'; }
  function mover(acao, vel, segundos, next) {   // segundos = null => contínuo
    var timed = segundos != null;
    return '<block type="sancabot_move_mode"><mutation mode="' + (timed ? 'TIMED' : 'CONTINUOUS') + '"></mutation><field name="ACTION">' + acao + '</field><field name="SPEED">' + vel +
      '</field><field name="MODE">' + (timed ? 'TIMED' : 'CONTINUOUS') + '</field>' +
      (timed ? '<value name="DURATION"><block type="sancabot_time_seconds"><field name="SECONDS">' + segundos + '</field></block></value>' : '') +
      (next ? '<next>' + next + '</next>' : '') + '</block>';
  }
  function frente(cm, next) { return mover('FORWARD', 50, seg(cm), next); }
  function girarDireita(next) { return mover('RIGHT', 50, T90, next); }     // 90° para a direita
  function girarEsquerda(next) { return mover('LEFT', 50, T90, next); }     // 90° para a esquerda
  function parar(next) { return '<block type="sancabot_stop">' + (next ? '<next>' + next + '</next>' : '') + '</block>'; }
  function esperar(s, next) { return '<block type="sancabot_wait"><value name="SECONDS"><block type="sancabot_time_seconds"><field name="SECONDS">' + s + '</field></block></value>' + (next ? '<next>' + next + '</next>' : '') + '</block>'; }
  function repetir(n, corpo, next) {
    return '<block type="sancabot_exp_repeat_times"><value name="TIMES"><shadow type="math_number"><field name="NUM">' + n + '</field></shadow></value><statement name="DO">' + corpo + '</statement>' + (next ? '<next>' + next + '</next>' : '') + '</block>';
  }
  function ateObstaculo(cm, corpo, next) {      // repetir ATÉ o sensor ver algo a menos de "cm"
    return '<block type="sancabot_exp_repeat_condition"><field name="MODE">UNTIL</field><value name="COND"><block type="sancabot_ultrasonic_condition"><field name="OP">LT</field><field name="LIMIT_CM">' + cm +
      '</field></block></value><statement name="DO">' + corpo + '</statement>' + (next ? '<next>' + next + '</next>' : '') + '</block>';
  }
  function corrigir(lado, pct, next) { return '<block type="sancabot_calibrate"><field name="SIDE">' + lado + '</field><field name="CORRECTION">' + pct + '</field>' + (next ? '<next>' + next + '</next>' : '') + '</block>'; }

  var EXEMPLOS = [
    {
      id: 'reta', titulo: '1. Andar em linha reta', nivel: 'Explorador',
      descricao: 'O primeiro passo: preparar os motores e andar para frente por um tempo.',
      dica: 'Mude o tempo do bloco "Mover" e veja o robô parar antes ou depois do fim da linha.',
      dicas: ["Todo programa começa com o bloco \"Preparar motores\".", "Depois use um bloco \"Mover para frente\" por tempo.", "Tempo maior, linha mais longa: ajuste até o robô parar no fim da linha."],
      rota: 'reta', obstaculos: [], desvio: 0,
      xml: X(preparar(frente(90)))
    },
    {
      id: 'quadrado', titulo: '2. Desenhar um quadrado', nivel: 'Explorador',
      descricao: 'Repetir 4 vezes: andar um lado e girar 90° para a direita.',
      dica: 'O lado mede 40 cm. Troque o 4 por 3 e veja um triângulo estranho.',
      dicas: ["Um quadrado tem 4 lados iguais e 4 giros iguais.", "Use \"Repetir 4 vezes\" para não copiar blocos.", "Dentro do repetir: andar para frente, depois girar 90° para a direita."],
      rota: 'quadrado', obstaculos: [], desvio: 0,
      xml: X(preparar(repetir(4, frente(40, girarDireita()))))
    },
    {
      id: 'zigue', titulo: '3. Zigue-zague', nivel: 'Explorador',
      descricao: 'Andar, girar para a direita, andar, girar para a esquerda: o robô sobe e desce.',
      dica: 'Cada perna mede cerca de 28 cm. O giro de 90° muda a direção entre subir e descer.',
      dicas: ["O caminho alterna: sobe, desce, sobe, desce.", "Cada perna é um \"andar\" seguido de um giro de 90°.", "Gire à direita para descer e à esquerda para subir de novo."],
      rota: { pontos: [[15, 60], [35, 40], [55, 60], [75, 40], [95, 60]] }, obstaculos: [], desvio: 0,
      xml: X(preparar(repetir(2, frente(28.3, girarDireita(frente(28.3, girarEsquerda()))))))
    },
    {
      id: 'parar', titulo: '4. Parar antes da parede', nivel: 'Explorador',
      descricao: 'O robô anda até o sensor ver a parede a menos de 15 cm e então para.',
      dica: 'Tire o bloco "Parar" e veja o robô bater. Mude o 15 para 30 e veja parar mais longe.',
      dicas: ["O sensor só funciona depois do bloco \"Preparar sensor de distância\".", "Use \"Repetir até\" a distância ser menor que 15 cm.", "Não esqueça o bloco \"Parar\" depois do repetir."],
      rota: { pontos: [[15, 40], [75, 40]] }, obstaculos: [{ tipo: 'parede', x: 90, y: 40, rot: 90 }], desvio: 0,
      xml: X(preparar(sensor(mover('FORWARD', 50, null, ateObstaculo(15, esperar(0.1), parar())))))
    },
    {
      id: 'caixa', titulo: '5. Desviar da caixa', nivel: 'Criador',
      descricao: 'Anda até a caixa, vira para a direita, contorna por baixo e segue em frente.',
      dica: 'Mude o tamanho dos trechos para contornar uma caixa maior. Arraste a caixa para outro lugar e ajuste.',
      dicas: ["Ande até a caixa como no exemplo anterior.", "Gire à direita, ande um pouco, gire à esquerda: você está ao lado da caixa.", "Siga em frente até passar da caixa."],
      rota: { pontos: [[15, 40], [29, 40], [29, 62], [90, 62]] }, obstaculos: [{ tipo: 'caixa', x: 60, y: 40, rot: 0 }], desvio: 0,
      xml: X(preparar(sensor(mover('FORWARD', 50, null, ateObstaculo(15, esperar(0.1),
        parar(girarDireita(frente(22, girarEsquerda(frente(58))))))))))
    },
    {
      id: 'desvio-sem', titulo: '6. O robô puxa para o lado (sem correção)', nivel: 'Criador',
      descricao: 'Um robô de verdade nunca anda perfeitamente reto: aqui a roda esquerda é um pouco mais fraca.',
      dica: 'Veja o rastro virar para o lado. No exemplo 7 o programa conserta isso.',
      dicas: ["Esse robô puxa para um lado, e isso é normal em robôs de verdade.", "Observe para qual lado o rastro curva.", "No próximo exemplo você aprende a compensar."],
      rota: 'reta', obstaculos: [], desvio: 2,
      xml: X(preparar(frente(90)))
    },
    {
      id: 'desvio-com', titulo: '7. Corrigindo o desvio', nivel: 'Criador',
      descricao: 'Mesmo robô do exemplo 6, agora com o bloco "Corrigir desvio" dando mais força à roda esquerda (+3).',
      dica: 'Troque o 3 por 6: corrige demais e o robô vai para o outro lado. Troque por 0: volta o desvio. Achar o valor certo é calibrar.',
      dicas: ["Use o bloco \"Corrigir desvio\" antes de andar.", "Dê mais força à roda que está mais fraca (a esquerda).", "Experimente valores pequenos: 1, 2, 3. Qual deixa a linha mais reta?"],
      rota: 'reta', obstaculos: [], desvio: 2,
      xml: X(preparar(corrigir('LEFT', 3, frente(90))))
    },
    {
      id: 'corredor', titulo: '8. Passar pelo corredor', nivel: 'Criador',
      descricao: 'Andar reto por um corredor estreito sem encostar nas paredes.',
      dica: 'Desafio: em "Cenário", aumente o Desvio do mundo real e veja o robô se afastar do trilho. Depois use "Corrigir desvio" para voltar a passar.',
      dicas: ["Passar sem encostar exige andar reto.", "Se o robô puxa para um lado, use \"Corrigir desvio\".", "Aumente o desvio em \"Cenário\" para um desafio maior."],
      rota: { pontos: [[10, 40], [100, 40]] }, obstaculos: [{ tipo: 'corredor', x: 60, y: 40, rot: 0 }], desvio: 0,
      xml: X(preparar(frente(90)))
    }
  ];
  window.SancaBotSimExamples = EXEMPLOS;
})();
