/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: SIMULADOR DE TRAJETÓRIA (aba "Simulador" no painel da direita).
   O aluno monta os blocos, escolhe (ou desenha, ou importa em SVG) uma trajetória-alvo no tablado e vê o robô percorrer o que o
   PROGRAMA dele manda, com o desvio em centímetros. Serve para testar antes de ligar o robô de verdade.

   Como usar: botão "Simular" no cabeçalho abre o painel do simulador ao lado dos blocos e já roda; ele reinicia sozinho quando os blocos mudam.
   Como funciona (resumo):
   1) verificação: olha só os BLOCOS e aponta o que vai dar errado no robô (falta preparar, porta repetida, sensor sem preparar...).
   2) interpretador: roda o programa em blocos passo a passo, com relógio simulado, seguindo as regras dos geradores Python
               (generator_stubs_sancabot.js): velocidade em %, correção de desvio, giro de 90° em N s a 50%, cronômetro (segundos inteiros),
               sensor de distância (HC-SR04: vale de 2 a 400 cm, leitura guardada e renovada a cada intervalo), condições, repetições,
               "sair da repetição", Se/Senão. Dá erro como o robô daria (ex.: mover sem preparar os motores).
   3) física:  robô de duas rodas. Velocidade vem do giro calibrado: 90° em T s a 50% => ω = (π/2)/T, e ω = 2·v/distância_entre_rodas
               (robot.trackCm, PROVISÓRIA). O robô não atravessa paredes: bate e fica parado.
   4) medida:  desvio máximo/médio entre o rastro e a trajetória-alvo; sensor lido ao longo do tempo.
   Não simula: valores/variáveis do BIPES fora dos blocos do SancaBot, nem ruído do sensor.
   Parâmetros em sancabot_config.js (robot, tablado). */
(function () {
  'use strict';
  var CFG = window.SancaBotConfig || {};
  var ROBOT = Object.assign({ trackCm: 10, turn90At50: 1.0 }, CFG.robot || {});
  var TAB = Object.assign({ w: 120, h: 80 }, CFG.tablado || {});
  var MAX_SECONDS = 120, DT = 0.02;
  function fmt(n) { return n.toFixed(1).replace('.', ','); }

  /* ================= 1) interpretador do programa em blocos ================= */
  // Roda o programa passo a passo com um relógio simulado, seguindo as mesmas regras dos geradores Python (generator_stubs_sancabot.js).
  function limit(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.trunc(v))); }
  var BRK = { brk: true }, STOP = { stop: true };
  function ptSeg(px, py, a, b) { var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2)) : 0; return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy)); }
  function rayHit(ox, oy, ang, a, b) { // distância até o segmento ab ao longo do raio (ou Infinity)
    var rx = Math.cos(ang), ry = Math.sin(ang), sx = b.x - a.x, sy = b.y - a.y, den = rx * sy - ry * sx;
    if (Math.abs(den) < 1e-9) return Infinity;
    var t = ((a.x - ox) * sy - (a.y - oy) * sx) / den, u = ((a.x - ox) * ry - (a.y - oy) * rx) / den;
    return (t >= 0 && u >= 0 && u <= 1) ? t : Infinity;
  }
  function wallSegments(walls) { var out = []; (walls || []).forEach(function (poly) { for (var i = 1; i < poly.length; i++) out.push([poly[i - 1], poly[i]]); }); return out; }
  function cmpOp(op, v, lim) { return op === 'GT' ? v > lim : op === 'EQ' ? Math.abs(v - lim) <= 1 : v < lim; }

  function runProgram(ws, start, opts) {
    opts = opts || {};
    var bias = opts.bias || 0, segW = wallSegments(opts.walls), warns = {}, L = ROBOT.trackCm * 1.15;
    var S = { x: start.x, y: start.y, th: start.th, t: 0, l: 0, r: 0, corrL: 0, corrR: 0, turn90: ROBOT.turn90At50, timer0: null,
              ready: false, sensor: null, lastRead: -1e9, obs: -1, crash: null, moved: false, truncated: false, error: null, loops: 0 };
    var trace = [{ t: 0, x: S.x, y: S.y, th: S.th, d: -1 }], acc = 0, events = [];   // events: em que instante cada bloco começou a rodar (para destacá-lo)
    function warn(m) { warns[m] = 1; }

    function front(x, y, th) { return { x: x + Math.cos(th) * L / 2, y: y + Math.sin(th) * L / 2, th: th }; }
    function trueDistance() {
      var f = front(S.x, S.y, S.th), best = Infinity;
      [-0.15, 0, 0.15].forEach(function (da) { segW.forEach(function (sg) { var d = rayHit(f.x, f.y, S.th + da, sg[0], sg[1]); if (d < best) best = d; }); });
      return (best < 2 || best > 400 || best === Infinity) ? -1 : best;   // o HC-SR04 só vale de 2 a 400 cm; sem eco = -1
    }
    function measureNow() { if (!S.sensor) { S.obs = -1; return -1; } S.obs = Math.round(trueDistance() * 10) / 10; mark(); return S.obs; }
    function observed() {                                                // sancabot_observed_distance_cm(): leitura guardada, renovada a cada READ_INTERVAL
      if (!S.sensor) return -1;
      if (S.lastRead < -1e8 || S.t - S.lastRead >= S.sensor.interval - 1e-9) { S.obs = Math.round(trueDistance() * 10) / 10; S.lastRead = S.t; mark(); }
      return S.obs;
    }
    function mark() { var p = trace[trace.length - 1]; if (p) p.d = S.obs; }
    function timerSeconds() { return S.timer0 == null ? 0 : Math.trunc(S.t - S.timer0); }

    // regra de sancabot_apply_straight_correction + sancabot_drive do robô
    function effective() {
      var l = S.l, r = S.r;
      if (l !== 0 && r !== 0 && ((l > 0 && r > 0) || (l < 0 && r < 0))) {
        var d = l > 0 ? 1 : -1, c;
        if (S.corrL > 0) { c = l + d * S.corrL; if (c > 100 || c < -100) r -= d * S.corrL; else l = c; }
        if (S.corrR > 0) { c = r + d * S.corrR; if (c > 100 || c < -100) l -= d * S.corrR; else r = c; }
      }
      return { l: limit(l, -100, 100), r: limit(r, -100, 100) };
    }
    function drive(l, r) { if (!S.ready) { S.error = 'O robô não foi preparado: falta "Preparar motores" antes deste movimento.'; throw STOP; } S.l = l; S.r = r; }
    function blocked(nx, ny, nth) {
      if (!segW.length) return false;
      var a = front(S.x, S.y, S.th), b = front(nx, ny, nth);
      return segW.some(function (sg) { return ptSeg(b.x, b.y, sg[0], sg[1]) < 1.2 || ptSeg(a.x, a.y, sg[0], sg[1]) < 1.2 && ptSeg(b.x, b.y, sg[0], sg[1]) < ptSeg(a.x, a.y, sg[0], sg[1]); });
    }
    function advance(sec) {
      if (!(sec > 0)) return;
      var omega50 = (Math.PI / 2) / S.turn90, pp = (omega50 * ROBOT.trackCm / 2) / 50, e = effective();
      var vL = e.l * pp * (1 - bias), vR = e.r * pp, n = Math.max(1, Math.round(sec / DT)), i;
      if (e.l || e.r) S.moved = true;
      for (i = 0; i < n; i++) {
        if (S.t >= MAX_SECONDS) { S.truncated = true; throw STOP; }
        var v = (vL + vR) / 2, w = (vL - vR) / ROBOT.trackCm, nth = S.th + w * DT, nx = S.x + Math.cos(nth) * v * DT, ny = S.y + Math.sin(nth) * v * DT;
        if (v !== 0 && blocked(nx, ny, nth)) { if (!S.crash) S.crash = { t: S.t, x: S.x, y: S.y }; S.th = nth; }   // bateu: não atravessa a parede
        else { S.th = nth; S.x = nx; S.y = ny; }
        S.t += DT; acc += DT;
        if (acc >= 0.04) { acc = 0; trace.push({ t: S.t, x: S.x, y: S.y, th: S.th, d: S.obs }); }
      }
    }

    // valores e perguntas
    function val(b, input, fallback) {
      var t = b.getInputTargetBlock(input); if (!t) return fallback; var v = evalNum(t); if (v == null || isNaN(v)) { warn('um valor calculado que não consegui simular em "' + b.type + '"; usei ' + fallback); return fallback; } return v;
    }
    function evalNum(t) {
      switch (t.type) {
        case 'sancabot_time_seconds': return parseFloat(String(t.getFieldValue('SECONDS')).replace(',', '.'));
        case 'sancabot_angle_degrees': return Number(t.getFieldValue('DEGREES'));
        case 'math_number': return Number(t.getFieldValue('NUM'));
        case 'sancabot_distance_cm': return observed();
        case 'sancabot_timer_seconds': return timerSeconds();
        case 'math_arithmetic': {
          var a = t.getInputTargetBlock('A'), b = t.getInputTargetBlock('B'); if (!a || !b) return null; var x = evalNum(a), y = evalNum(b), op = t.getFieldValue('OP');
          return op === 'ADD' ? x + y : op === 'MINUS' ? x - y : op === 'MULTIPLY' ? x * y : op === 'DIVIDE' ? (y ? x / y : null) : op === 'POWER' ? Math.pow(x, y) : null; }
        default: return null;
      }
    }
    function cond(b, input) {
      var t = b.getInputTargetBlock(input); if (!t) return false; return evalBool(t);
    }
    function distCond(op, lim) { var d = observed(); return d >= 0 && (op === 'GT' ? d > lim : op === 'EQ' ? Math.abs(d - lim) <= 1 : d < lim); }
    function evalBool(t) {
      switch (t.type) {
        case 'sancabot_ultrasonic_condition': case 'sancabot_obstacle_near': return distCond(t.getFieldValue('OP'), Number(t.getFieldValue('LIMIT_CM')));
        case 'sancabot_timer_condition': { var s = timerSeconds(), lim = Number(t.getFieldValue('SECONDS')), op = t.getFieldValue('OP'); return op === 'GT' ? s > lim : op === 'EQ' ? Math.abs(s - lim) <= 0.5 : s < lim; }
        case 'sancabot_logic_join': case 'logic_operation': { var a = cond(t, 'A'), b = cond(t, 'B'), o = t.getFieldValue('OP'); return o === 'OR' ? (a || b) : (a && b); }
        case 'logic_boolean': return t.getFieldValue('BOOL') === 'TRUE';
        case 'logic_negate': return !cond(t, 'BOOL');
        case 'logic_compare': { var x = val(t, 'A', 0), y = val(t, 'B', 0), c = t.getFieldValue('OP'); return c === 'EQ' ? x === y : c === 'NEQ' ? x !== y : c === 'LT' ? x < y : c === 'LTE' ? x <= y : c === 'GT' ? x > y : x >= y; }
        default: warn('uma pergunta que ainda não simulo ("' + t.type + '"); tratei como falsa'); return false;
      }
    }

    // execução
    function chain(b, depth, inLoop) { while (b) { exec(b, depth, inLoop); b = b.getNextBlock(); } }
    function loop(depth, test, body, step) {          // laço genérico: while test() { body; step }
      var guard = 0, t0;
      for (;;) {
        if (!test()) return;
        t0 = S.t;
        try { body(); } catch (e) { if (e === BRK) return; throw e; }
        if (step) step();
        if (S.t === t0 && ++guard > 5000) { warn('uma repetição sem nenhuma espera dentro; parei de simulá-la (no robô ela ficaria presa)'); return; }
        if (S.t !== t0) guard = 0;
      }
    }
    function exec(b, depth, inLoop) {
      if (depth > 14) return;
      if (events.length < 20000) events.push({ t: S.t, id: b.id });
      switch (b.type) {
        case 'sancabot_config': S.ready = true; S.l = S.r = 0; break;
        case 'sancabot_distance_sensor': S.sensor = { interval: Math.max(0.05, parseFloat(String(b.getFieldValue('READ_INTERVAL')).replace(',', '.')) || 0.2) }; S.lastRead = -1e9; break;
        case 'sancabot_calibrate': { var c = limit(Number(b.getFieldValue('CORRECTION')) || 0, 0, 30); S.corrL = b.getFieldValue('SIDE') === 'LEFT' ? c : 0; S.corrR = b.getFieldValue('SIDE') === 'RIGHT' ? c : 0; break; }
        case 'sancabot_turn_calibration': S.turn90 = Math.max(0.1, Math.min(5, parseFloat(String(b.getFieldValue('SECONDS')).replace(',', '.')) || 1)); break;
        case 'sancabot_motion_scene': chain(b.getInputTargetBlock('MOVES'), depth + 1, inLoop); break;
        case 'sancabot_move_mode': case 'sancabot_observe_drive': {
          var a = b.getFieldValue('ACTION'), sp = Number(b.getFieldValue('SPEED')) || 0, l = sp, r = sp;
          if (a === 'BACKWARD') { l = -sp; r = -sp; } else if (a === 'LEFT') { l = -sp; r = sp; } else if (a === 'RIGHT') { l = sp; r = -sp; }
          drive(l, r);
          if (b.type === 'sancabot_move_mode' && b.getFieldValue('MODE') === 'TIMED') { advance(val(b, 'DURATION', 1)); drive(0, 0); }
          break; }
        case 'sancabot_stop': drive(0, 0); break;
        case 'sancabot_wait': advance(val(b, 'SECONDS', 1)); break;
        case 'sancabot_timer_start': S.timer0 = S.t; break;
        case 'sancabot_exp_repeat_times': {
          var n = Math.max(0, Math.min(1000, Math.trunc(val(b, 'TIMES', 10))));
          for (var i = 0; i < n; i++) { try { chain(b.getInputTargetBlock('DO'), depth + 1, true); } catch (e) { if (e === BRK) break; throw e; } }
          break; }
        case 'sancabot_exp_repeat_while': loop(depth, function () { return cond(b, 'COND'); }, function () { chain(b.getInputTargetBlock('DO'), depth + 1, true); }); break;
        case 'sancabot_exp_repeat_until': loop(depth, function () { return !cond(b, 'COND'); }, function () { chain(b.getInputTargetBlock('DO'), depth + 1, true); }); break;
        case 'sancabot_exp_repeat_condition': {
          var until = b.getFieldValue('MODE') === 'UNTIL';
          loop(depth, function () { var c2 = cond(b, 'COND'); return until ? !c2 : c2; }, function () { chain(b.getInputTargetBlock('DO'), depth + 1, true); }); break; }
        case 'sancabot_if_obstacle': if (distCond(b.getFieldValue('OP'), Number(b.getFieldValue('LIMIT_CM')))) chain(b.getInputTargetBlock('DO'), depth + 1, inLoop); break;
        case 'sancabot_exp_if_else': {
          var k = 0, done = false;
          do { if (cond(b, 'IF' + k)) { chain(b.getInputTargetBlock('DO' + k), depth + 1, inLoop); done = true; break; } k++; } while (b.getInput('IF' + k));
          if (!done && b.getInput('ELSE')) chain(b.getInputTargetBlock('ELSE'), depth + 1, inLoop);
          break; }
        case 'sancabot_observe_scene': {
          var secs = Number(b.getFieldValue('SECONDS')) || 5, iv = Number(b.getFieldValue('INTERVAL')) || 0.2, t0 = S.t;
          while (S.t - t0 < secs) { measureNow(); try { chain(b.getInputTargetBlock('DO'), depth + 1, true); } catch (e) { if (e === BRK) break; throw e; } advance(iv); }
          S.l = S.r = 0; break; }
        case 'sancabot_explore_until': {
          var iv2 = Number(b.getFieldValue('INTERVAL')) || 0.2, lim2 = Number(b.getFieldValue('LIMIT_CM')), op2 = b.getFieldValue('OP');
          for (;;) { measureNow(); if (distCond(op2, lim2)) break; try { chain(b.getInputTargetBlock('WHILE_DO'), depth + 1, true); } catch (e) { if (e === BRK) break; throw e; } advance(iv2); }
          measureNow(); chain(b.getInputTargetBlock('FOUND_DO'), depth + 1, inLoop); break; }
        case 'sancabot_explore_forever': {
          var iv3 = Number(b.getFieldValue('INTERVAL')) || 0.2;
          for (;;) { measureNow(); try { chain(b.getInputTargetBlock('DO'), depth + 1, true); } catch (e) { if (e === BRK) break; throw e; } advance(iv3); }
          break; }
        case 'sancabot_break_explore': if (inLoop) throw BRK; break;
        default: break; // painel, dados do projeto etc. não mexem no robô
      }
    }

    try {
      ws.getTopBlocks(true).filter(function (b) { return /^sancabot_/.test(b.type); }).forEach(function (b) { chain(b, 0, false); });
      if (S.l !== 0 || S.r !== 0) { warn('__runsOn'); advance(3); }
    } catch (e) { if (e !== STOP && e !== BRK) throw e; }
    trace.push({ t: S.t, x: S.x, y: S.y, th: S.th, d: S.obs });
    var w = Object.keys(warns), runsOn = w.indexOf('__runsOn') !== -1; w = w.filter(function (x) { return x !== '__runsOn'; });
    return { trace: trace, events: events, seconds: S.t, warnings: w, runsOn: runsOn && !S.truncated, truncated: S.truncated, hasMotion: S.moved, crash: S.crash, error: S.error, sensorUsed: !!S.sensor };
  }

  /* ================= 2) verificação do programa (antes de simular) ================= */
  // Olha só os BLOCOS (nada de física) e diz o que vai dar errado no robô de verdade.
  var DIST_TYPES = ['sancabot_distance_cm', 'sancabot_obstacle_near', 'sancabot_ultrasonic_condition', 'sancabot_if_obstacle', 'sancabot_explore_until', 'sancabot_explore_forever', 'sancabot_observe_scene'];
  var MOVE_TYPES = ['sancabot_move_mode', 'sancabot_observe_drive', 'sancabot_stop'];
  var LOOP_BODY = { sancabot_exp_repeat_times: 'DO', sancabot_exp_repeat_while: 'DO', sancabot_exp_repeat_until: 'DO', sancabot_exp_repeat_condition: 'DO', sancabot_if_obstacle: 'DO', sancabot_observe_scene: 'DO', sancabot_explore_forever: 'DO', sancabot_motion_scene: 'MOVES' };
  function portName(pin) {
    var ports = (CFG.ports || []); for (var i = 0; i < ports.length; i++) if (String(ports[i][1]) === String(pin)) return ports[i][0];
    return 'pino ' + pin;
  }
  function describe(b) { var t = b.toString ? b.toString() : b.type; return '"' + (t.length > 34 ? t.slice(0, 33) + '…' : t) + '"'; }
  function validate(ws) {
    var out = [], order = [], tops = ws.getTopBlocks(true).filter(function (b) { return /^sancabot_/.test(b.type); });
    function add(level, text, b) { out.push({ level: level, text: text, id: b && b.id }); }
    // ordem de execução (profundidade, como o código gerado)
    function walk(b) { while (b) { order.push(b); Object.keys(b.inputList ? b.inputList.reduce(function (o, i) { if (i.type === 3 || (i.connection && i.connection.type === 3)) o[i.name] = 1; return o; }, {}) : {}).forEach(function (n) { walk(b.getInputTargetBlock(n)); }); b = b.getNextBlock(); } }
    tops.forEach(walk);
    if (!order.length) { add('aviso', 'Ainda não há blocos do SancaBot no programa.'); return out; }
    var firstCfg = -1, firstMove = -1, firstSens = -1, firstDist = -1;
    order.forEach(function (b, i) {
      if (b.type === 'sancabot_config' && firstCfg < 0) firstCfg = i;
      if (MOVE_TYPES.indexOf(b.type) !== -1 && firstMove < 0) firstMove = i;
      if (b.type === 'sancabot_distance_sensor' && firstSens < 0) firstSens = i;
      if (DIST_TYPES.indexOf(b.type) !== -1 && firstDist < 0) firstDist = i;
    });
    var cfgs = order.filter(function (b) { return b.type === 'sancabot_config'; }), sens = order.filter(function (b) { return b.type === 'sancabot_distance_sensor'; });
    if (firstMove >= 0 && firstCfg < 0) add('erro', 'Falta "Preparar motores" no começo do programa. Sem ele o robô não se mexe.', order[firstMove]);
    else if (firstMove >= 0 && firstMove < firstCfg) add('erro', 'O movimento ' + describe(order[firstMove]) + ' vem ANTES de "Preparar motores". Coloque a preparação primeiro.', order[firstMove]);
    if (firstDist >= 0 && firstSens < 0) add('erro', 'Você usa o sensor de distância, mas falta "Preparar sensor de distância". Sem ele a leitura é sempre "sem eco" e nada acontece.', order[firstDist]);
    else if (firstDist >= 0 && firstDist < firstSens) add('erro', 'O bloco ' + describe(order[firstDist]) + ' lê a distância ANTES de "Preparar sensor de distância".', order[firstDist]);
    if (cfgs.length > 1) add('aviso', '"Preparar motores" aparece ' + cfgs.length + ' vezes; só precisa de uma.', cfgs[1]);
    if (sens.length > 1) add('aviso', '"Preparar sensor de distância" aparece ' + sens.length + ' vezes; só precisa de uma.', sens[1]);
    // portas
    var pins = [];
    cfgs.forEach(function (b) { var l = String(b.getFieldValue('LEFT_PIN')), r = String(b.getFieldValue('RIGHT_PIN')); pins.push({ n: 'roda esquerda', p: l, b: b }, { n: 'roda direita', p: r, b: b }); });
    sens.forEach(function (b) { pins.push({ n: 'emissor do sensor', p: String(b.getFieldValue('TRIGGER_PIN')), b: b }, { n: 'receptor do sensor', p: String(b.getFieldValue('ECHO_PIN')), b: b }); });
    var seen = {};
    pins.forEach(function (x) {
      if (seen[x.p] && seen[x.p].n !== x.n) { add('erro', 'A porta ' + portName(x.p) + ' está sendo usada por duas coisas: ' + seen[x.p].n + ' e ' + x.n + '.', x.b); }
      seen[x.p] = seen[x.p] || x;
    });
    // pinos que não batem com o robô escolhido no cabeçalho (firmware: ver SancaBotConfig.robos)
    if (CFG.conferirPinos) CFG.conferirPinos(ws).forEach(function (d) { add('aviso', d.texto, d.bloco); });
    // movimentos suspeitos
    order.forEach(function (b, i) {
      if (b.type === 'sancabot_move_mode') {
        if ((Number(b.getFieldValue('SPEED')) || 0) === 0) add('aviso', 'Velocidade 0% em ' + describe(b) + ': o robô não vai sair do lugar.', b);
        if (b.getFieldValue('MODE') === 'TIMED') { var d = b.getInputTargetBlock('DURATION'); if (d && d.type === 'sancabot_time_seconds' && parseFloat(String(d.getFieldValue('SECONDS')).replace(',', '.')) === 0) add('aviso', 'Tempo 0 em ' + describe(b) + ': o movimento não acontece.', b); }
        if (b.getFieldValue('MODE') === 'CONTINUOUS') {
          var nx = b.getNextBlock(); if (nx && (nx.type === 'sancabot_move_mode' || nx.type === 'sancabot_stop')) add('aviso', ('Movimento contínuo seguido direto de outro comando: ' + describe(b) + ' é trocado na hora. Coloque "Esperar" entre eles.'), b);
        }
      }
      if (b.type === 'sancabot_exp_repeat_times') { var t = b.getInputTargetBlock('TIMES'); if (t && t.type === 'math_number' && Number(t.getFieldValue('NUM')) === 0) add('aviso', '"Repetir 0 vezes": o conteúdo nunca roda.', b); }
      var bodyName = LOOP_BODY[b.type];
      if (bodyName && b.getInput(bodyName) && !b.getInputTargetBlock(bodyName) && b.type !== 'sancabot_motion_scene') add('aviso', describe(b) + ' está vazio: coloque blocos dentro.', b);
      if ((b.type === 'sancabot_exp_repeat_while' || b.type === 'sancabot_exp_repeat_until' || b.type === 'sancabot_exp_repeat_condition' || b.type === 'sancabot_exp_if_else') && b.getInput('COND') !== null && !b.getInputTargetBlock('COND')) add('aviso', describe(b) + ' está sem a pergunta: ela nunca é verdadeira.', b);
      if (b.type === 'sancabot_exp_if_else' && !b.getInputTargetBlock('IF0')) add('aviso', describe(b) + ' está sem a pergunta: ela nunca é verdadeira.', b);
      if (b.type === 'sancabot_explore_forever') { var hasBreak = false; (function scan(x) { while (x && !hasBreak) { if (x.type === 'sancabot_break_explore') hasBreak = true; (x.inputList || []).forEach(function (i) { if (i.connection && i.connection.type === 3) scan(i.connection.targetBlock()); }); x = x.getNextBlock(); } })(b.getInputTargetBlock('DO')); if (!hasBreak) add('aviso', '"Medir distância sem parar" nunca termina. Use "Sair da repetição" ou troque por outra repetição.', b); }
    });
    // termina com o robô andando? (acompanha o estado dos motores na ordem do programa: movimento contínuo liga; Parar ou movimento por tempo desliga)
    var on = false, lastOn = null;
    order.forEach(function (b) {
      if (b.type === 'sancabot_observe_drive' || (b.type === 'sancabot_move_mode' && b.getFieldValue('MODE') === 'CONTINUOUS')) { on = true; lastOn = b; }
      else if (b.type === 'sancabot_stop' || (b.type === 'sancabot_move_mode' && b.getFieldValue('MODE') === 'TIMED')) on = false;
    });
    if (on && lastOn) add('aviso', 'O programa termina sem "Parar": o robô continua andando depois do último bloco.', lastOn);
    var starts = tops.length; if (starts > 1) add('aviso', 'Há ' + starts + ' grupos de blocos soltos. Todos rodam, um depois do outro, de cima para baixo.', tops[1]);
    return out;
  }

  function nearest(path, p) { var m = 1e9, i; for (i = 0; i < path.length; i++) { var d = Math.hypot(path[i].x - p.x, path[i].y - p.y); if (d < m) m = d; } return m; }
  function measure(trace, path) {
    var max = 0, sum = 0, n = 0, left = false, i;
    for (i = 0; i < trace.length; i++) {
      var p = trace[i]; if (p.x < 0 || p.y < 0 || p.x > TAB.w || p.y > TAB.h) left = true;
      if (path.length) { var d = nearest(path, p); max = Math.max(max, d); sum += d; n++; }
    }
    var last = trace[trace.length - 1], endGap = path.length ? Math.hypot(path[path.length - 1].x - last.x, path[path.length - 1].y - last.y) : 0;
    return { max: max, avg: n ? sum / n : 0, endGap: endGap, left: left, seconds: last.t };
  }

  /* ================= trajetórias ================= */
  function P(x, y) { return { x: x, y: y }; }
  function resample(pts, step) {
    if (pts.length < 2) return pts.slice();
    var out = [pts[0]], acc = 0, i;
    for (i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], seg = Math.hypot(b.x - a.x, b.y - a.y), d = step - acc;
      while (d <= seg) { var f = d / seg; out.push(P(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f)); d += step; }
      acc = seg - (d - step);
    }
    out.push(pts[pts.length - 1]); return out;
  }
  var PRESETS = {
    reta: function () { return resample([P(15, 40), P(105, 40)], 1); },
    quadrado: function () { return resample([P(40, 60), P(40, 20), P(80, 20), P(80, 60), P(40, 60)], 1); },
    oito: function () { var a = [], i; for (i = 0; i <= 200; i++) { var u = i / 200 * Math.PI * 2; a.push(P(60 + 38 * Math.sin(u), 40 + 20 * Math.sin(2 * u))); } return resample(a, 1); },
    s: function () { var a = [], i; for (i = 0; i <= 120; i++) { var u = i / 120; a.push(P(12 + 96 * u, 40 + 24 * Math.sin(u * Math.PI * 2))); } return resample(a, 1); }
  };
  var WALLS = {
    nenhuma: function () { return []; },
    parede: function () { return [[P(90, 10), P(90, 70)]]; },
    corredor: function () { return [[P(10, 25), P(110, 25)], [P(10, 55), P(110, 55)]]; },
    caixa: function () { return [[P(50, 28), P(75, 28), P(75, 52), P(50, 52), P(50, 28)]]; }
  };
  // Obstáculos do tablado: o aluno escolhe o tipo no menu, arrasta para o lugar e gira. Cada um vira linhas (paredes) para o sensor e a colisão.
  function circle(r) { var a = [], i; for (i = 0; i <= 20; i++) a.push([r * Math.cos(i / 20 * 2 * Math.PI), r * Math.sin(i / 20 * 2 * Math.PI)]); return a; }
  var OBS_TYPES = {
    parede:   { nome: 'Parede',   rot: 90, shape: [[[-20, 0], [20, 0]]] },
    caixa:    { nome: 'Caixa',    rot: 0,  shape: [[[-10, -10], [10, -10], [10, 10], [-10, 10], [-10, -10]]] },
    cone:     { nome: 'Cone',     rot: 0,  shape: [circle(6)] },
    corredor: { nome: 'Corredor', rot: 0,  shape: [[[-40, -15], [40, -15]], [[-40, 15], [40, 15]]] },
    portao:   { nome: 'Portão',   rot: 90, shape: [[[-30, 0], [-10, 0]], [[10, 0], [30, 0]]] },
    canto:    { nome: 'Canto',    rot: 0,  shape: [[[-20, -20], [-20, 20], [20, 20]]] }
  };
  function obsPolys(o) {
    var t = OBS_TYPES[o.tipo]; if (!t) return []; var c = Math.cos(o.rot * Math.PI / 180), n = Math.sin(o.rot * Math.PI / 180);
    return t.shape.map(function (poly) { return poly.map(function (q) { return { x: o.x + q[0] * c - q[1] * n, y: o.y + q[0] * n + q[1] * c }; }); });
  }
  function allWalls() { var out = []; S.obs.forEach(function (o) { obsPolys(o).forEach(function (p) { out.push(p); }); }); S.walls.forEach(function (w) { out.push(w); }); return out; }
  function inPoly(pt, poly) { var inside = false, i, j; for (i = 0, j = poly.length - 1; i < poly.length; j = i++) { if ((poly[i].y > pt.y) !== (poly[j].y > pt.y) && pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) inside = !inside; } return inside; }
  function hitObstacle(pt) {
    for (var k = S.obs.length - 1; k >= 0; k--) {
      var polys = obsPolys(S.obs[k]);
      for (var m = 0; m < polys.length; m++) {
        var poly = polys[m], closed = poly.length > 3 && Math.hypot(poly[0].x - poly[poly.length - 1].x, poly[0].y - poly[poly.length - 1].y) < 0.01;
        if (closed && inPoly(pt, poly)) return S.obs[k];
        for (var i = 1; i < poly.length; i++) if (ptSeg(pt.x, pt.y, poly[i - 1], poly[i]) < 3.5) return S.obs[k];
      }
    }
    return null;
  }
  function startPose(path) {
    if (path.length < 2) return { x: 15, y: TAB.h / 2, th: 0 };
    var a = path[0], b = path[Math.min(6, path.length - 1)];
    return { x: a.x, y: a.y, th: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  // SVG -> pontos em cm. Só lê a GEOMETRIA (d, points, x1..., cx...), nada de scripts nem estilos do arquivo.
  function importSvg(text, widthCm) {
    var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('Esse arquivo não parece um SVG válido.');
    var NS = 'http://www.w3.org/2000/svg', tmp = document.createElementNS(NS, 'svg');
    tmp.setAttribute('width', '0'); tmp.setAttribute('height', '0'); tmp.style.cssText = 'position:absolute;left:-9999px;visibility:hidden';
    document.body.appendChild(tmp);
    var ATTRS = { path: ['d'], polyline: ['points'], polygon: ['points'], line: ['x1', 'y1', 'x2', 'y2'], circle: ['cx', 'cy', 'r'], ellipse: ['cx', 'cy', 'rx', 'ry'], rect: ['x', 'y', 'width', 'height', 'rx', 'ry'] };
    var raw = [], count = 0;
    try {
      Array.prototype.forEach.call(doc.querySelectorAll('path,polyline,polygon,line,circle,ellipse,rect'), function (src) {
        if (count > 200) return;
        var tag = src.localName, el = document.createElementNS(NS, tag);
        (ATTRS[tag] || []).forEach(function (a) { if (src.hasAttribute(a)) el.setAttribute(a, src.getAttribute(a)); });
        tmp.appendChild(el); count++;
        var len = 0; try { len = el.getTotalLength(); } catch (e) { len = 0; }
        if (!(len > 0)) return;
        var steps = Math.min(4000, Math.max(8, Math.ceil(len / 2)));
        for (var i = 0; i <= steps; i++) { var pt = el.getPointAtLength(len * i / steps); raw.push({ x: pt.x, y: pt.y }); }
      });
    } finally { tmp.remove(); }
    if (raw.length < 2) throw new Error('Não encontrei nenhuma linha nesse SVG (use caminhos, linhas ou formas).');
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    raw.forEach(function (p) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    var w = Math.max(1e-6, maxX - minX), h = Math.max(1e-6, maxY - minY), margin = 8, k;
    k = widthCm > 0 ? widthCm / w : Math.min((TAB.w - 2 * margin) / w, (TAB.h - 2 * margin) / h);
    var ox = (TAB.w - w * k) / 2, oy = (TAB.h - h * k) / 2;
    return resample(raw.map(function (p) { return P(ox + (p.x - minX) * k, oy + (p.y - minY) * k); }), 1);
  }

  /* ================= 3) interface ================= */
  var S = { path: [], walls: [], obs: [], sel: null, nid: 1, drag: null, wallMode: 'nenhuma', mode: 'quadrado', trace: [], plan: null, running: false, raf: 0, tPlay: 0, last: 0, mult: 1, bias: 0, res: null, drawing: false, raw: [] };
  var ui = {};
  function el(tag, attrs, text) { var e = document.createElement(tag); if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); }); if (text != null) e.textContent = text; return e; }

  var SIM_W = 380;
  function isOpen() { return !!ui.panel && ui.panel.classList.contains('sb-open'); }
  function phoneLayout() { return window.matchMedia && window.matchMedia('(max-width: 767.98px)').matches; }

  // Painel PRÓPRIO do simulador (como o do micro:bit): aparece ao lado dos blocos quando se clica em "Simular", roda na hora
  // e se reinicia sozinho a cada mudança nos blocos. Não fica dentro do painel de código.
  function build() {
    if (document.getElementById('sbSimPanel')) return;
    ui.panel = el('aside', { id: 'sbSimPanel', class: 'sb-sim-panel', 'aria-label': 'Simulador do robô', 'aria-hidden': 'true' });
    var head = el('header', { class: 'sim-head' });
    head.appendChild(el('h2', null, 'Simulador'));
    ui.run = el('button', { type: 'button', class: 'sim-run', 'aria-label': 'Jogar ou reiniciar a simulação' }, '▶ Jogar');
    ui.stopBtn = el('button', { type: 'button', class: 'sim-stop', 'aria-label': 'Parar a simulação' }, '■ Parar');
    ui.close = el('button', { type: 'button', class: 'sim-close', 'aria-label': 'Fechar o simulador', title: 'Fechar' }, '×');
    head.append(ui.run, ui.stopBtn, ui.close);

    ui.view = el('section', { class: 'sb-sim' });
    ui.canvas = el('canvas', { width: String(TAB.w * 6), height: String(TAB.h * 6), 'aria-label': 'Tablado de ' + TAB.w + ' por ' + TAB.h + ' centímetros com o robô. Nos modos Desenhar, desenhe com o mouse ou o dedo.' });
    ui.ctx = ui.canvas.getContext('2d');

    var speed = el('div', { class: 'sim-speed', role: 'group', 'aria-label': 'Velocidade da animação' });
    speed.appendChild(el('span', { class: 'sim-lab' }, 'Velocidade:'));
    [1, 2, 4].forEach(function (m) { speed.appendChild(el('button', { type: 'button', 'data-m': String(m), 'aria-pressed': m === 1 ? 'true' : 'false' }, m + '×')); });

    ui.read = el('div', { class: 'sim-read', 'aria-live': 'polite' });
    [['rMax', 'Desvio máximo'], ['rAvg', 'Desvio médio'], ['rTime', 'Tempo'], ['rSens', 'Sensor de distância'], ['rRes', 'Resultado']].forEach(function (r) {
      var d = el('div'); d.appendChild(document.createTextNode(r[1])); ui[r[0]] = el('b', null, '–'); d.appendChild(ui[r[0]]); ui.read.appendChild(d);
    });
    ui.msg = el('div', { class: 'sim-msg', 'aria-live': 'polite' });
    ui.check = el('div', { class: 'sim-check', 'aria-live': 'polite' });

    // cenário: trajetória-alvo, paredes, SVG e desvio do mundo real
    var det = el('details', { class: 'sim-scene' }); det.open = true;
    det.appendChild(el('summary', null, 'Cenário: trajetória, paredes e desvio'));
    var presetRow = el('div', { class: 'sim-chips', role: 'group', 'aria-label': 'Trajetória-alvo' });
    presetRow.appendChild(el('span', { class: 'sim-lab' }, 'Trajetória:'));
    [['reta', 'Reta'], ['quadrado', 'Quadrado'], ['oito', 'Oito'], ['s', 'Curva em S'], ['livre', 'Desenhar'], ['nenhuma', 'Nenhuma']].forEach(function (p) { presetRow.appendChild(el('button', { type: 'button', 'data-p': p[0], 'aria-pressed': 'false' }, p[1])); });
    ui.wallRow = el('div', { class: 'sim-chips', role: 'group', 'aria-label': 'Obstáculos do tablado (o sensor de distância enxerga e o robô bate)' });
    ui.wallRow.appendChild(el('span', { class: 'sim-lab' }, 'Obstáculos:'));
    Object.keys(OBS_TYPES).forEach(function (k) { ui.wallRow.appendChild(el('button', { type: 'button', 'data-o': k, title: 'Colocar ' + OBS_TYPES[k].nome.toLowerCase() + ' no tablado' }, '+ ' + OBS_TYPES[k].nome)); });
    ui.obsActs = el('div', { class: 'sim-chips', role: 'group', 'aria-label': 'Ações do obstáculo selecionado' });
    ui.obsActs.appendChild(el('span', { class: 'sim-lab' }, 'Selecionado:'));
    [['rot15', '↻ 15°'], ['rot90', '↻ 90°'], ['del', '× Remover'], ['draw', 'Desenhar parede'], ['clear', 'Limpar tudo']].forEach(function (p) { ui.obsActs.appendChild(el('button', { type: 'button', 'data-a': p[0], 'aria-pressed': p[0] === 'draw' ? 'false' : null }, p[1])); });
    ui.obsHint = el('p', { class: 'sim-note' }, 'Toque num obstáculo e arraste para mudar de lugar.');
    var imp = el('button', { type: 'button', class: 'sim-import' }, 'Importar SVG');
    ui.file = el('input', { type: 'file', accept: '.svg,image/svg+xml', hidden: '' });
    ui.svgAs = el('select', { 'aria-label': 'Usar o SVG importado como' });
    [['path', 'trajetória'], ['wall', 'parede']].forEach(function (o) { ui.svgAs.appendChild(el('option', { value: o[0] }, 'SVG como ' + o[1])); });
    ui.widthCm = el('input', { type: 'number', min: '10', max: '1000', step: '1', placeholder: 'ajustar', 'aria-label': 'Largura real da pista importada, em centímetros' });
    var impRow = el('div', { class: 'sim-imp' }); var lbl = el('label', null, 'Largura (cm): '); lbl.appendChild(ui.widthCm);
    impRow.append(ui.svgAs, imp, lbl, ui.file);
    var bias = el('label', { class: 'sim-bias' }, 'Desvio do mundo real: '); ui.biasLbl = el('b', null, 'nenhum');
    ui.bias = el('input', { type: 'range', min: '0', max: '3', step: '1', value: '0', 'aria-label': 'Desvio do mundo real' });
    bias.append(ui.biasLbl, ui.bias);
    ui.biasNote = el('p', { class: 'sim-note' }, 'A roda esquerda fica um pouco mais fraca, como num robô de verdade. Use "Corrigir desvio" para compensar.');
    ui.cfgNote = el('p', { class: 'sim-note' }, 'Distância entre as rodas usada: ' + ROBOT.trackCm + ' cm (provisória; ajuste em sancabot_config.js).');
    det.append(presetRow, ui.wallRow, ui.obsActs, ui.obsHint, impRow, bias, ui.biasNote, ui.cfgNote);

    // exemplos prontos (core/sancabot_sim_examples.js)
    var exRow = el('label', { class: 'sim-examples' }, 'Exemplos: ');
    ui.examples = el('select', { 'aria-label': 'Carregar um exemplo pronto (blocos e cenário)' });
    ui.examples.appendChild(el('option', { value: '' }, 'Escolha um exemplo…'));
    (window.SancaBotSimExamples || []).forEach(function (ex) { ui.examples.appendChild(el('option', { value: ex.id }, ex.titulo + (ex.nivel ? ' (' + ex.nivel + ')' : ''))); });
    exRow.appendChild(ui.examples);
    ui.exInfo = el('p', { class: 'sim-note', 'aria-live': 'polite' });
    ui.examples.addEventListener('change', function () { var id = ui.examples.value; if (id) loadExample(id); });
    // cartão da missão: objetivo, estrelas (guardadas neste navegador) e dicas aos poucos
    ui.mission = el('section', { class: 'sim-mission', 'aria-live': 'polite', hidden: '' });
    ui.mTitle = el('h3', null); ui.mGoal = el('p', { class: 'sim-note' });
    ui.mStars = el('div', { class: 'sim-stars', role: 'img', 'aria-label': '0 de 3 estrelas' });
    for (var si = 0; si < 3; si++) ui.mStars.appendChild(el('span', null, '★'));
    ui.mStatus = el('p', { class: 'sim-mstatus' });
    ui.mHintBtn = el('button', { type: 'button', class: 'sim-hint-btn' }, 'Pedir uma dica');
    ui.mHints = el('ol', { class: 'sim-hints' });
    ui.mHintBtn.addEventListener('click', function () { showHint(); });
    var mTop = el('div', { class: 'sim-mtop' }); mTop.append(ui.mTitle, ui.mStars);
    ui.mission.append(mTop, ui.mGoal, ui.mStatus, ui.mHintBtn, ui.mHints);
    ui.view.append(exRow, ui.exInfo, ui.mission, ui.canvas, speed, ui.read, ui.msg, ui.check, det);
    ui.panel.append(head, ui.view);
    document.body.appendChild(ui.panel);

    // botão "Simular" no cabeçalho
    var tb = document.querySelector('.top-menu .toolbar');
    ui.btn = document.getElementById('simOpenBtn');   // normalmente já montado no cabeçalho (app/cabecalho-estrutura.js), para não aparecer depois
    if (!ui.btn) {
      ui.btn = el('button', { type: 'button', id: 'simOpenBtn', class: 'sim-open', 'aria-pressed': 'false', 'aria-controls': 'sbSimPanel', title: 'Simular o programa no tablado' });
      ui.btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg><span>Simular</span>';
      var tm = document.querySelector('.top-menu'); if (tm) tm.insertBefore(ui.btn, tb || null); else document.body.appendChild(ui.btn);
    }   // fora da barra de ferramentas: no celular ela vira menu e o Simular continua à vista

    // Fora da aba Blocos o painel fecha; o botão continua à vista e, ao clicar, leva de volta aos Blocos e abre o simulador
    function onBlocks() { var t = document.getElementById('tab_blocks'), on = document.querySelector('.top-menu .tabs > .on'); return !t || !on || on === t; }   // a aba ativa leva a classe "on"; sem nenhuma, é Blocos
    function syncTab() { if (!onBlocks() && isOpen()) closePanel(); }
    ui.btn.addEventListener('click', function () {
      if (!onBlocks()) { var t = document.getElementById('tab_blocks'); if (t) t.click(); if (!isOpen()) openPanel(); return; }
      if (isOpen()) closePanel(); else openPanel();
    });
    var tabsEl = document.querySelector('.top-menu .tabs');
    if (tabsEl) new MutationObserver(syncTab).observe(tabsEl, { attributes: true, subtree: true, attributeFilter: ['class'] });
    ui.close.addEventListener('click', closePanel);
    ui.run.addEventListener('click', function () { start(false); });
    ui.stopBtn.addEventListener('click', function () { stop(); });
    var presetClick = function (e) { var b = e.target.closest('button[data-p]'); if (b) setMode(b.getAttribute('data-p')); };
    presetRow.addEventListener('click', presetClick);
    ui.wallRow.addEventListener('click', function (e) { var b = e.target.closest('button[data-o]'); if (b) addObstacle(b.getAttribute('data-o')); });
    ui.obsActs.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return; var a = b.getAttribute('data-a'), o = selected();
      if (a === 'draw') { S.wallMode = S.wallMode === 'livre' ? 'nenhuma' : 'livre'; b.setAttribute('aria-pressed', String(S.wallMode === 'livre')); ui.obsHint.textContent = S.wallMode === 'livre' ? 'Desenhe a parede no tablado com o mouse ou o dedo.' : 'Toque num obstáculo e arraste para mudar de lugar.'; return; }
      if (a === 'clear') { S.obs = []; S.walls = []; S.sel = null; changed(); return; }
      if (!o) { message('Escolha um obstáculo no tablado primeiro (toque nele).', true); return; }
      if (a === 'rot15') o.rot = (o.rot + 15) % 360; else if (a === 'rot90') o.rot = (o.rot + 90) % 360;
      else if (a === 'del') { S.obs = S.obs.filter(function (x) { return x !== o; }); S.sel = null; }
      changed();
    });
    speed.addEventListener('click', function (e) { var b = e.target.closest('button[data-m]'); if (!b) return; S.mult = Number(b.getAttribute('data-m')); speed.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); });
    ui.bias.addEventListener('input', function () { S.bias = [0, 0.03, 0.06, 0.1][Number(ui.bias.value)]; ui.biasLbl.textContent = ['nenhum', 'pequeno', 'médio', 'grande'][Number(ui.bias.value)]; if (isOpen()) schedule(); });
    imp.addEventListener('click', function () { ui.file.click(); });
    ui.file.addEventListener('change', function () {
      var f = ui.file.files && ui.file.files[0]; if (!f) return;
      if (f.size > 2 * 1024 * 1024) { message('O arquivo é grande demais (máximo 2 MB).', true); return; }
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var pts = importSvg(String(rd.result), Number(ui.widthCm.value) || 0);
          if (ui.svgAs.value === 'wall') { S.walls.push(pts); changed(); message('Parede importada: ' + Math.round(pts.length) + ' cm de linha.', false); }
          else { S.path = pts; setMode('svg', true); message('Trajetória importada: ' + Math.round(pts.length) + ' cm de linha.', false); }
        } catch (err) { message(err.message, true); }
      };
      rd.readAsText(f); ui.file.value = '';
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen() && ui.panel.contains(document.activeElement)) closePanel(); });
    bindDrawing();
    S.mode = 'quadrado'; S.path = PRESETS.quadrado(); presetRow.querySelector('[data-p="quadrado"]').setAttribute('aria-pressed', 'true');
    draw();

    // reinicia sozinho quando os blocos mudam (como no micro:bit)
    if (window.Code && Code.workspace) Code.workspace.addChangeListener(function (e) { if (e.isUiEvent || !isOpen()) return; schedule(); });
    window.addEventListener('resize', function () { if (isOpen()) applyWidth(); });
  }
  function loadExample(id) {
    var ex = (window.SancaBotSimExamples || []).filter(function (e) { return e.id === id; })[0], ws = window.Code && Code.workspace; if (!ex || !ws) return;
    var hasBlocks = ws.getAllBlocks(false).some(function (b) { return /^sancabot_/.test(b.type); });
    if (hasBlocks && !window.confirm('Carregar "' + ex.titulo + '" troca os blocos atuais pelos do exemplo. Dá para desfazer com Ctrl+Z. Continuar?')) { ui.examples.value = ''; return; }
    stop(); ui.examples.value = id;
    try {
      Blockly.Events.setGroup(true);
      ws.clear(); Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(ex.xml), ws);
    } finally { Blockly.Events.setGroup(false); }
    // cenário
    S.walls = []; S.sel = null; S.obs = (ex.obstaculos || []).map(function (o) { return { id: S.nid++, tipo: o.tipo, x: o.x, y: o.y, rot: o.rot || 0 }; });
    if (typeof ex.rota === 'string') { S.path = PRESETS[ex.rota] ? PRESETS[ex.rota]() : []; S.mode = PRESETS[ex.rota] ? ex.rota : 'nenhuma'; }
    else if (ex.rota && ex.rota.pontos) { S.path = resample(ex.rota.pontos.map(function (q) { return P(q[0], q[1]); }), 1); S.mode = 'exemplo'; }
    else { S.path = []; S.mode = 'nenhuma'; }
    ui.view.querySelectorAll('.sim-chips button[data-p]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-p') === S.mode)); });
    ui.bias.value = String(ex.desvio || 0); S.bias = [0, 0.03, 0.06, 0.1][ex.desvio || 0]; ui.biasLbl.textContent = ['nenhum', 'pequeno', 'médio', 'grande'][ex.desvio || 0];
    ui.exInfo.textContent = ''; S.mission = ex; S.hintsShown = 0; S.rated = false; renderMission();
    try { ws.scrollCenter(); } catch (e) { /* ok */ }
    reset(); renderCheck(); start(true);
  }
  /* ---------- missão: estrelas e dicas ---------- */
  var STAR_KEY = 'sancabot_estrelas';
  function readStars() { try { return JSON.parse(localStorage.getItem(STAR_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function writeStar(id, n) { try { var o = readStars(); if (!o[id] || o[id] < n) { o[id] = n; localStorage.setItem(STAR_KEY, JSON.stringify(o)); } } catch (e) { /* sem armazenamento: só não guarda */ } }
  function starsOf(v) { return v === 'Perfeito' ? 3 : v === 'Quase' ? 2 : (v === 'Longe' || v === 'Não chegou' || v === 'Terminou') ? 1 : 0; }
  function paintStars(el2, n) { [].forEach.call(el2.children, function (c, i) { c.className = i < n ? 'on' : ''; }); el2.setAttribute('aria-label', n + ' de 3 estrelas'); }
  function renderMission() {
    var ex = S.mission, best = ex ? (readStars()[ex.id] || 0) : 0;
    ui.mission.hidden = !ex; if (!ex) return;
    ui.mTitle.textContent = 'Missão: ' + ex.titulo.replace(/^\d+\.\s*/, '');
    ui.mGoal.textContent = ex.descricao;
    paintStars(ui.mStars, best);
    ui.mStatus.textContent = best ? 'Melhor resultado: ' + best + (best === 1 ? ' estrela' : ' estrelas') + '.' : 'Rode o programa para ganhar estrelas.';
    ui.mHints.innerHTML = '';
    var list = ex.dicas && ex.dicas.length ? ex.dicas : (ex.dica ? [ex.dica] : []);
    for (var i = 0; i < S.hintsShown && i < list.length; i++) ui.mHints.appendChild(el('li', null, list[i]));
    ui.mHintBtn.hidden = S.hintsShown >= list.length;
    ui.mHintBtn.textContent = S.hintsShown ? 'Mais uma dica' : 'Pedir uma dica';
    var st = readStars(); [].forEach.call(ui.examples.options, function (o, k) { var e2 = (window.SancaBotSimExamples || [])[k - 1]; if (e2) o.textContent = ((st[e2.id] || 0) ? '★'.repeat(st[e2.id]) + ' ' : '') + e2.titulo + (e2.nivel ? ' (' + e2.nivel + ')' : ''); });
  }
  function showHint() { S.hintsShown++; renderMission(); }
  function rateMission(v) {
    if (!S.mission || S.rated) return; S.rated = true;
    var n = starsOf(v); writeStar(S.mission.id, n);
    renderMission(); paintStars(ui.mStars, Math.max(n, readStars()[S.mission.id] || 0));
    ui.mStatus.textContent = n === 3 ? 'Missão cumprida com 3 estrelas! ' + v + '.' : n ? 'Você ganhou ' + n + (n === 1 ? ' estrela' : ' estrelas') + ' (' + v + '). Dá para melhorar!' : 'Ainda não deu (' + v + '). Peça uma dica ou ajuste os blocos.';
    try { window.dispatchEvent(new CustomEvent('sancabot:missao', { detail: { id: S.mission.id, estrelas: n, veredito: v, desvioMax: S.res && S.res.max, tempo: S.plan && S.plan.seconds } })); } catch (e) { /* ok */ }
  }
  var schT = 0;
  function schedule() { clearTimeout(schT); schT = setTimeout(function () { if (isOpen()) { renderCheck(); start(true); } }, 700); }
  function applyWidth() {
    var w = phoneLayout() ? 0 : SIM_W;
    document.documentElement.style.setProperty('--sb-sim-w', (isOpen() ? w : 0) + 'px');
    try { if (window.SancaBotPanels && SancaBotPanels.refreshInsets) SancaBotPanels.refreshInsets(); } catch (e) { /* ok */ }
  }
  function openPanel() {
    ui.panel.classList.add('sb-open'); ui.panel.setAttribute('aria-hidden', 'false'); ui.btn.setAttribute('aria-pressed', 'true'); applyWidth();
    renderCheck(); start(true);
  }
  function closePanel() {
    stop(); ui.panel.classList.remove('sb-open'); ui.panel.setAttribute('aria-hidden', 'true'); ui.btn.setAttribute('aria-pressed', 'false'); applyWidth();
  }

  function message(text, bad, list) {
    ui.msg.textContent = ''; ui.msg.className = 'sim-msg' + (bad ? ' sim-bad' : '');
    if (text) ui.msg.appendChild(el('p', null, text));
    if (list && list.length) { var ul = el('ul'); list.forEach(function (w) { ul.appendChild(el('li', null, w)); }); ui.msg.appendChild(ul); }
  }
  function setMode(m, keepPath) {
    S.mode = m; ui.view.querySelectorAll('.sim-chips button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-p') === m)); });
    if (!keepPath) S.path = PRESETS[m] ? PRESETS[m]() : [];
    reset();
  }
  function selected() { for (var i = 0; i < S.obs.length; i++) if (S.obs[i].id === S.sel) return S.obs[i]; return null; }
  function changed() { reset(); draw(); if (isOpen()) schedule(); }   // mudou o cenário: refaz a simulação (como quando os blocos mudam)
  function addObstacle(tipo) {
    var o = { id: S.nid++, tipo: tipo, x: TAB.w / 2 + 7 * (S.obs.length % 5), y: TAB.h / 2 + 5 * (S.obs.length % 5), rot: OBS_TYPES[tipo].rot };
    S.obs.push(o); S.sel = o.id; ui.obsHint.textContent = OBS_TYPES[tipo].nome + ' colocado(a) no meio do tablado: arraste para o lugar certo.'; changed();
  }
  function renderCheck() {
    var ws = window.Code && Code.workspace; if (!ws || !ui.check) return [];
    var list = validate(ws); ui.check.textContent = '';
    var head = el('div', { class: 'sim-check-head' }); var errs = list.filter(function (x) { return x.level === 'erro'; }).length, avs = list.length - errs;
    head.appendChild(el('b', null, 'Verificação do programa'));
    head.appendChild(el('span', { class: errs ? 'sim-pill sim-pill-bad' : avs ? 'sim-pill sim-pill-warn' : 'sim-pill sim-pill-ok' }, errs ? errs + (errs === 1 ? ' erro' : ' erros') : avs ? avs + (avs === 1 ? ' aviso' : ' avisos') : 'tudo certo'));
    ui.check.appendChild(head);
    if (list.length) { var ul = el('ul'); list.forEach(function (x) { var li = el('li', { class: x.level === 'erro' ? 'sim-bad' : 'sim-warn', tabindex: x.id ? '0' : '-1' }, (x.level === 'erro' ? '✖ ' : '⚠ ') + x.text); if (x.id) { li.title = 'Clique para achar o bloco'; li.addEventListener('click', function () { try { ws.centerOnBlock(x.id); var bk = ws.getBlockById(x.id); if (bk && bk.select) bk.select(); } catch (e) { /* ok */ } }); } ul.appendChild(li); }); ui.check.appendChild(ul); }
    return list;
  }
  /* Destaque do bloco em execução: o bloco que começou por último até o instante atual da simulação */
  var hiId = null;
  function highlight(id) {
    var ws = window.Code && Code.workspace; if (!ws || id === hiId) return;
    try {   // o Blockly 13 não pinta mais highlightBlock: marcamos o bloco com uma classe própria (ver sancabot_sim.css)
      var old = hiId && ws.getBlockById(hiId), nu = id && ws.getBlockById(id);
      if (old && old.getSvgRoot) old.getSvgRoot().classList.remove('sb-running');
      if (nu && nu.getSvgRoot) nu.getSvgRoot().classList.add('sb-running');
    } catch (e) { /* ok */ }
    hiId = id;
  }
  function highlightAt(t) {
    var ev = S.plan && S.plan.events; if (!ev || !ev.length) return;
    var lo = 0, hi = ev.length - 1, ans = -1;
    while (lo <= hi) { var m = (lo + hi) >> 1; if (ev[m].t <= t + 1e-9) { ans = m; lo = m + 1; } else hi = m - 1; }
    highlight(ans >= 0 ? ev[ans].id : null);
  }
  function stop() { S.running = false; cancelAnimationFrame(S.raf); highlight(null); }
  function reset() {
    stop(); highlight(null); S.trace = []; S.plan = null; S.tPlay = 0; S.res = null;
    ['rMax', 'rAvg', 'rTime', 'rSens', 'rRes'].forEach(function (k) { ui[k].textContent = '–'; });
    message('', false); draw();
  }

  function start(paused) {   // paused = true: prepara a simulação e espera o aluno apertar "Jogar"
    paused = paused === true; stop();
    var ws = window.Code && Code.workspace; if (!ws) return;
    var found = renderCheck();
    reset();
    var res = runProgram(ws, startPose(S.path), { bias: S.bias, walls: allWalls() });
    if (!res.hasMotion && !res.error) { message('Seu programa ainda não move o robô. Arraste um bloco "Mover" para a área de blocos.', true, res.warnings); return; }
    S.plan = res; S.trace = res.trace; S.res = measure(S.trace, S.path); S.rated = false;
    var notes = res.warnings.slice();
    if (res.runsOn) notes.unshift('o programa termina com o robô ainda andando (falta "Parar"); simulei mais 3 segundos');
    if (res.truncated) notes.unshift('a simulação parou em ' + MAX_SECONDS + ' segundos (o programa não terminou)');
    var lines = notes.map(function (n) { return 'Atenção: ' + n + '.'; });
    if (res.error) lines.unshift(res.error + ' No robô de verdade o programa pararia aqui.');
    if (res.crash) lines.unshift('O robô bateu na parede aos ' + fmt(res.crash.t) + ' s.');
    message('', res.error ? true : false, lines);
    if (paused) { ui.run.textContent = '▶ Jogar'; draw(); return; }
    S.running = true; S.tPlay = 0; S.last = performance.now(); ui.run.textContent = '↻ Reiniciar'; S.raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (!S.running) return;
    S.tPlay += Math.min(0.1, (now - S.last) / 1000) * S.mult; S.last = now;
    var end = S.trace[S.trace.length - 1].t, over = S.tPlay >= end;
    if (over) S.tPlay = end;
    draw(); readout(over); highlightAt(S.tPlay);
    if (over) { S.running = false; highlight(null); return; }
    S.raf = requestAnimationFrame(tick);
  }
  function verdict(r) {
    if (S.plan && S.plan.error) return 'Programa com erro';
    if (S.plan && S.plan.crash) return 'Bateu';
    if (r.left) return 'Saiu do tablado';
    if (!S.path.length) return 'Terminou';
    if (r.max >= 6) return 'Longe';
    if (r.endGap > 12) return 'Não chegou';
    return r.max < 3 ? 'Perfeito' : 'Quase';
  }
  function readout(done) {
    var cur = 0, i, mx = 0, sm = 0, n = 0;
    for (i = 0; i < S.trace.length && S.trace[i].t <= S.tPlay; i++) { var d = S.path.length ? nearest(S.path, S.trace[i]) : 0; mx = Math.max(mx, d); sm += d; n++; cur = S.trace[i].t; }
    ui.rMax.textContent = fmt(mx) + ' cm'; ui.rAvg.textContent = fmt(n ? sm / n : 0) + ' cm'; ui.rTime.textContent = fmt(S.tPlay) + ' s';
    var dnow = -1; for (i = 0; i < S.trace.length && S.trace[i].t <= S.tPlay; i++) dnow = S.trace[i].d;
    ui.rSens.textContent = !S.plan || !S.plan.sensorUsed ? 'desligado' : dnow >= 0 ? fmt(dnow) + ' cm' : 'sem eco';
    ui.rRes.textContent = done ? verdict(S.res) : '…';
    if (done) rateMission(verdict(S.res));
  }

  /* ---------- desenho do tablado ---------- */
  var K = 6; // px por cm
  function errColor(e) { var t = Math.max(0, Math.min(1, e / 8)); return 'rgb(' + Math.round(46 + 183 * t) + ',' + Math.round(180 - 108 * t) + ',' + Math.round(79 - 2 * t) + ')'; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function draw() {
    if (!ui.ctx) return;
    var c = ui.ctx, W = ui.canvas.width, H = ui.canvas.height, x, y, i;
    c.clearRect(0, 0, W, H); c.fillStyle = '#F5F8FF'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#DCE2F5'; c.lineWidth = 1;
    for (x = 0; x <= TAB.w; x += 10) { c.beginPath(); c.moveTo(x * K, 0); c.lineTo(x * K, H); c.stroke(); }
    for (y = 0; y <= TAB.h; y += 10) { c.beginPath(); c.moveTo(0, y * K); c.lineTo(W, y * K); c.stroke(); }
    c.fillStyle = '#5B6490'; c.font = '800 13px Nunito, sans-serif'; c.fillText('0', 5, 15); c.fillText(TAB.w + ' cm', W - 58, 15); c.fillText(TAB.h + ' cm', 6, H - 7);
    if (S.path.length > 1) {
      c.setLineDash([10, 8]); c.strokeStyle = '#7B86B8'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
      S.path.forEach(function (p, j) { j ? c.lineTo(p.x * K, p.y * K) : c.moveTo(p.x * K, p.y * K); }); c.stroke(); c.setLineDash([]);
    } else if (S.mode === 'livre') { c.fillStyle = '#5B6490'; c.font = '800 18px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('Desenhe a trajetória aqui', W / 2, H / 2); c.textAlign = 'start'; }
    c.strokeStyle = '#1B2250'; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
    var sel = selected();
    if (sel) { c.strokeStyle = '#FF9A3C'; c.lineWidth = 15; c.globalAlpha = .55; obsPolys(sel).forEach(function (poly) { c.beginPath(); poly.forEach(function (q, j) { j ? c.lineTo(q.x * K, q.y * K) : c.moveTo(q.x * K, q.y * K); }); c.stroke(); }); c.globalAlpha = 1; c.strokeStyle = '#1B2250'; c.lineWidth = 7; }
    allWalls().forEach(function (poly) { c.beginPath(); poly.forEach(function (q, j) { j ? c.lineTo(q.x * K, q.y * K) : c.moveTo(q.x * K, q.y * K); }); c.stroke(); });
    // rastro até o instante atual + robô
    var pose = null; c.lineWidth = 6; c.lineCap = 'round';
    for (i = 1; i < S.trace.length && S.trace[i].t <= S.tPlay + 1e-9; i++) {
      c.strokeStyle = S.path.length ? errColor(nearest(S.path, S.trace[i])) : '#2F6FE4';
      c.beginPath(); c.moveTo(S.trace[i - 1].x * K, S.trace[i - 1].y * K); c.lineTo(S.trace[i].x * K, S.trace[i].y * K); c.stroke(); pose = S.trace[i];
    }
    if (!pose && S.path.length > 1) { var sp = startPose(S.path); pose = { x: sp.x, y: sp.y, th: sp.th }; } else if (!pose && S.trace.length) pose = S.trace[0];
    if (pose) {
      var dn = -1; for (i = 0; i < S.trace.length && S.trace[i].t <= S.tPlay + 1e-9; i++) dn = S.trace[i].d;
      if (dn >= 0 && S.plan) { var fl = ROBOT.trackCm * 1.15 / 2; c.strokeStyle = 'rgba(229,72,77,.65)'; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.moveTo((pose.x + Math.cos(pose.th) * fl) * K, (pose.y + Math.sin(pose.th) * fl) * K); c.lineTo((pose.x + Math.cos(pose.th) * (fl + dn)) * K, (pose.y + Math.sin(pose.th) * (fl + dn)) * K); c.stroke(); c.setLineDash([]); }
      robot(c, pose);
    }
    // régua
    c.strokeStyle = '#1B2250'; c.lineWidth = 4; c.beginPath(); c.moveTo(W - 20 * K - 12, H - 14); c.lineTo(W - 12, H - 14); c.stroke();
    c.fillStyle = '#1B2250'; c.font = '800 12px Nunito, sans-serif'; c.fillText('20 cm', W - 20 * K - 12, H - 20);
  }
  function robot(c, p) {
    var L = ROBOT.trackCm * K * 1.15, Wd = ROBOT.trackCm * K; c.save(); c.translate(p.x * K, p.y * K); c.rotate(p.th);
    c.fillStyle = '#1B2250'; c.fillRect(-L * .3, -Wd / 2 - 3, L * .55, 7); c.fillRect(-L * .3, Wd / 2 - 4, L * .55, 7);
    c.fillStyle = '#FFD23F'; rr(c, -L / 2, -Wd / 2 + 2, L, Wd - 4, 10); c.fill();
    c.fillStyle = '#001021'; rr(c, -L / 2 + 5, -Wd / 2 + 7, L - 10, Wd - 14, 7); c.fill();
    c.fillStyle = '#4C9FFF'; c.beginPath(); c.ellipse(L / 2 - 14, -Wd / 5, 3, 4, 0, 0, 7); c.ellipse(L / 2 - 14, Wd / 5, 3, 4, 0, 0, 7); c.fill();
    c.restore();
  }
  function bindDrawing() {
    var cv = ui.canvas;
    function pos(e) { var r = cv.getBoundingClientRect(); return P((e.clientX - r.left) / r.width * TAB.w, (e.clientY - r.top) / r.height * TAB.h); }
    cv.addEventListener('pointerdown', function (e) {
      var hit = S.wallMode === 'livre' ? null : hitObstacle(pos(e));
      if (hit) { stop(); S.sel = hit.id; var p0 = pos(e); S.drag = { o: hit, dx: hit.x - p0.x, dy: hit.y - p0.y, moved: false }; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } draw(); return; }
      if (S.wallMode === 'livre') { stop(); S.drawing = 'wall'; S.raw = [pos(e)]; S.walls.push(S.raw); try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } draw(); return; }
      if (S.mode !== 'livre') setMode('livre'); stop(); S.drawing = true; S.raw = [pos(e)]; S.path = S.raw.slice(); S.trace = []; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } draw(); });
    cv.addEventListener('pointermove', function (e) {
      if (S.drag) { var q = pos(e); S.drag.o.x = Math.max(0, Math.min(TAB.w, q.x + S.drag.dx)); S.drag.o.y = Math.max(0, Math.min(TAB.h, q.y + S.drag.dy)); S.drag.moved = true; draw(); return; }
      if (!S.drawing) return; var p = pos(e), l = S.raw[S.raw.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 0.8) { S.raw.push(p); if (S.drawing !== 'wall') S.path = S.raw.slice(); draw(); } });
    function end() { if (!S.drawing) return; if (S.drawing === 'wall') { S.drawing = false; if (S.raw.length < 3) S.walls.pop(); else S.walls[S.walls.length - 1] = resample(S.raw, 1); reset(); return; } S.drawing = false; S.path = S.raw.length > 3 ? resample(S.raw, 1) : []; reset(); }
    function endDrag() { if (!S.drag) return false; var m = S.drag.moved; S.drag = null; if (m) changed(); else { draw(); } return true; }
    cv.addEventListener('pointerup', function () { if (!endDrag()) end(); }); cv.addEventListener('pointercancel', function () { if (!endDrag()) end(); });
  }

  // espera o cabeçalho e a área de blocos existirem
  var tries = 0, t = setInterval(function () {
    if (document.querySelector('.top-menu .toolbar') && window.Code && Code.workspace) { clearInterval(t); build(); }
    else if (++tries > 80) clearInterval(t);
  }, 250);

  window.SancaBotSim = { obstacles: function () { return S.obs.map(function (o) { return { tipo: o.tipo, x: Math.round(o.x * 10) / 10, y: Math.round(o.y * 10) / 10, rot: o.rot }; }); }, selected: function () { var o = selected(); return o && o.tipo; }, result: function () { return S.res ? { veredito: verdict(S.res), desvioMax: S.res.max, desvioMedio: S.res.avg, fimAteAlvo: S.res.endGap, tempo: S.res.seconds, bateu: S.plan && S.plan.crash ? S.plan.crash.t : null, erro: S.plan && S.plan.error, sensor: S.plan && S.plan.sensorUsed, avisos: S.plan && S.plan.warnings, faltaParar: S.plan && S.plan.runsOn } : null; }, loadExample: function (id) { if (ui.panel) loadExample(id); }, open: function () { if (ui.panel && !isOpen()) openPanel(); }, close: function () { if (ui.panel) closePanel(); }, isOpen: isOpen, run: runProgram, validate: validate, measure: measure, walls: WALLS, startPose: startPose, importSvg: importSvg, presets: PRESETS, robot: ROBOT };
})();
