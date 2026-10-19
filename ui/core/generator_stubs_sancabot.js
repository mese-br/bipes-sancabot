// ===== Geradores Python dos blocos SancaBot (extraÃ­do de generator_stubs.js em 2026-07-05) =====
// Cada bloco novo criado em block_definitions_sancabot.js deve ter seu gerador
// correspondente adicionado aqui. Ver convenÃ§Ã£o em README-SANCABOT.md.
//
// Removidos nesta reorganizaÃ§Ã£o (geradores dos blocos de movimento redundantes
// confirmados como "testados e nÃ£o usados" por Marcos em 2026-07-05):
// sancabot_drive_mode, sancabot_turn_mode, sancabot_drive_timed,
// sancabot_turn_degrees, sancabot_move. Backup do conteÃºdo original completo
// em _backup_pre_reorg_20260705/generator_stubs.js.bak.

function sancabotTraceRuntimeDefinition() {
  Blockly.Python.definitions_['import_time'] = 'import time';
  // Modo passo a passo (tartaruga): pausa em ms apos cada bloco, 0 = desligado.
  // Lido de window.sancabotSlowMode no momento da geracao do codigo (botao no editor).
  var slowMs = (typeof window !== 'undefined' && window.sancabotSlowMode) ? 350 : 0;
  Blockly.Python.definitions_['sancabot_trace_runtime'] = [
    'SANCABOT_TRACE_COUNTS = {}',
    'SANCABOT_TRACE_LAST_MS = 0',
    'SANCABOT_TRACE_SLEEP = ' + slowMs,
    '',
    'def sancabot_trace(block_id, label):',
    '    global SANCABOT_TRACE_LAST_MS',
    '    now = time.ticks_ms()',
    '    count = SANCABOT_TRACE_COUNTS.get(block_id, 0) + 1',
    '    SANCABOT_TRACE_COUNTS[block_id] = count',
    '    if count == 1 or time.ticks_diff(now, SANCABOT_TRACE_LAST_MS) >= 120:',
    '        print("SANCABOT_TRACE|" + block_id + "|" + label + "|" + str(count))',
    '        SANCABOT_TRACE_LAST_MS = now',
    '    if SANCABOT_TRACE_SLEEP:',
    '        time.sleep_ms(SANCABOT_TRACE_SLEEP)'
  ].join('\n');
}

function sancabotTraceLine(block, label) {
  if (!block || !block.id) return '';
  sancabotTraceRuntimeDefinition();
  return 'sancabot_trace(' + JSON.stringify(block.id) + ', ' + JSON.stringify(label) + ')\n';
}

// Trace emitido DENTRO do corpo do loop: reacende o bloco de repeticao a cada
// iteracao (o contador xN no editor mostra quantas voltas ja rodaram).
function sancabotLoopIterationTraceLine(block, label) {
  if (!block || !block.id) return '';
  sancabotTraceRuntimeDefinition();
  var indent = (Blockly.Python && Blockly.Python.INDENT) || '  ';
  return indent + 'sancabot_trace(' + JSON.stringify(block.id) + ', ' + JSON.stringify(label) + ')\n';
}
function sancabotRuntimeDefinition() {
  Blockly.Python.definitions_['import_pin'] = 'from machine import Pin';
  Blockly.Python.definitions_['import_pwm'] = 'from machine import PWM';
  Blockly.Python.definitions_['import_time'] = 'import time';
  Blockly.Python.definitions_['sancabot_runtime'] = [
    'SANCABOT_DUTY_RANGE = 25',
    'SANCABOT_LEFT_CENTER = 77',
    'SANCABOT_RIGHT_CENTER = 77',
    'SANCABOT_LEFT_INVERT = 1',
    'SANCABOT_RIGHT_INVERT = -1',
    'SANCABOT_LEFT_CORRECTION = 0',
    'SANCABOT_RIGHT_CORRECTION = 0',
    'SANCABOT_TURN_90_SECONDS_AT_50 = 1.0',
    '',
    'def sancabot_limit(value, low, high):',
    '    return max(low, min(high, int(value)))',
    '',
    'def sancabot_set_correction(left_correction, right_correction):',
    '    global SANCABOT_LEFT_CORRECTION, SANCABOT_RIGHT_CORRECTION',
    '    SANCABOT_LEFT_CORRECTION = sancabot_limit(left_correction, 0, 30)',
    '    SANCABOT_RIGHT_CORRECTION = sancabot_limit(right_correction, 0, 30)',
    '',
    'def sancabot_apply_straight_correction(left_speed, right_speed):',
    '    if left_speed == 0 or right_speed == 0:',
    '        return left_speed, right_speed',
    '    if (left_speed > 0 and right_speed > 0) or (left_speed < 0 and right_speed < 0):',
    '        direction = 1 if left_speed > 0 else -1',
    '        if SANCABOT_LEFT_CORRECTION > 0:',
    '            corrected_left = left_speed + direction * SANCABOT_LEFT_CORRECTION',
    '            if corrected_left > 100 or corrected_left < -100:',
    '                right_speed -= direction * SANCABOT_LEFT_CORRECTION',
    '            else:',
    '                left_speed = corrected_left',
    '        if SANCABOT_RIGHT_CORRECTION > 0:',
    '            corrected_right = right_speed + direction * SANCABOT_RIGHT_CORRECTION',
    '            if corrected_right > 100 or corrected_right < -100:',
    '                left_speed -= direction * SANCABOT_RIGHT_CORRECTION',
    '            else:',
    '                right_speed = corrected_right',
    '    return left_speed, right_speed',
    '',
    'def sancabot_drive(left_speed, right_speed):',
    '    left_speed, right_speed = sancabot_apply_straight_correction(left_speed, right_speed)',
    '    left_speed = sancabot_limit(left_speed, -100, 100)',
    '    right_speed = sancabot_limit(right_speed, -100, 100)',
    '    left_duty = SANCABOT_LEFT_CENTER + SANCABOT_LEFT_INVERT * int(left_speed * SANCABOT_DUTY_RANGE / 100)',
    '    right_duty = SANCABOT_RIGHT_CENTER + SANCABOT_RIGHT_INVERT * int(right_speed * SANCABOT_DUTY_RANGE / 100)',
    '    sancabot_left.duty(sancabot_limit(left_duty, 40, 120))',
    '    sancabot_right.duty(sancabot_limit(right_duty, 40, 120))',
    '',
    'def sancabot_set_turn_calibration(seconds_90_at_50):',
    '    global SANCABOT_TURN_90_SECONDS_AT_50',
    '    SANCABOT_TURN_90_SECONDS_AT_50 = max(0.1, min(5, float(seconds_90_at_50)))',
    '',
    'def sancabot_turn_seconds(angle, speed):',
    '    speed = max(1, abs(speed))',
    '    return abs(angle) / 90 * SANCABOT_TURN_90_SECONDS_AT_50 * (50 / speed)',
    '',
    'def sancabot_stop():',
    '    sancabot_left.duty(SANCABOT_LEFT_CENTER)',
    '    sancabot_right.duty(SANCABOT_RIGHT_CENTER)'
  ].join('\n');
}


function sancabotDeindent(code) {
  var indent = Blockly.Python.INDENT || '  ';
  return (code || '').split('\n').map(function(line) {
    return line.indexOf(indent) === 0 ? line.slice(indent.length) : line;
  }).join('\n');
}

Blockly.Python['sancabot_motion_scene'] = function(block) {
  var statements = Blockly.Python.statementToCode(block, 'MOVES');
  statements = sancabotDeindent(statements);
  return statements || '';
};


Blockly.Python['sancabot_config'] = function(block) {
  var leftPin = block.getFieldValue('LEFT_PIN');
  var rightPin = block.getFieldValue('RIGHT_PIN');
  sancabotRuntimeDefinition();
  var code = sancabotTraceLine(block, 'preparar motores');
  code += 'SANCABOT_LEFT_PIN = ' + leftPin + '\n';
  code += 'SANCABOT_RIGHT_PIN = ' + rightPin + '\n';
  code += 'sancabot_left = PWM(Pin(SANCABOT_LEFT_PIN), freq=50)\n';
  code += 'sancabot_right = PWM(Pin(SANCABOT_RIGHT_PIN), freq=50)\n';
  code += 'sancabot_stop()\n';
  return code;
};



Blockly.Python['sancabot_time_seconds'] = function(block) {
  var seconds = block.getFieldValue('SECONDS') || '1';
  return [seconds, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['sancabot_angle_degrees'] = function(block) {
  var degrees = block.getFieldValue('DEGREES') || '90';
  return [degrees, Blockly.Python.ORDER_ATOMIC];
};



function sancabotWheelSpeedsForAction(action, speed) {
  var left = speed;
  var right = speed;
  if (action === 'BACKWARD') {
    left = '-' + speed;
    right = '-' + speed;
  } else if (action === 'LEFT') {
    left = '-' + speed;
    right = speed;
  } else if (action === 'RIGHT') {
    left = speed;
    right = '-' + speed;
  }
  return { left: left, right: right };
}

Blockly.Python['sancabot_move_mode'] = function(block) {
  var action = block.getFieldValue('ACTION');
  var speed = block.getFieldValue('SPEED') || '50';
  var mode = block.getFieldValue('MODE') || 'CONTINUOUS';
  sancabotRuntimeDefinition();
  var wheels = sancabotWheelSpeedsForAction(action, speed);
  var code = sancabotTraceLine(block, 'movimentar SancaBot') + 'sancabot_drive(' + wheels.left + ', ' + wheels.right + ')\n';
  if (mode === 'TIMED') {
    var seconds = Blockly.Python.valueToCode(block, 'DURATION', Blockly.Python.ORDER_ATOMIC) || '1';
    code += sancabotTraceLine(block, 'esperar movimento') + 'time.sleep(' + seconds + ')\n';
    code += 'sancabot_stop()\n';
  }
  return code;
};

Blockly.Python['sancabot_stop'] = function(block) {
  sancabotRuntimeDefinition();
  return sancabotTraceLine(block, 'parar SancaBot') + 'sancabot_stop()\n';
};

Blockly.Python['sancabot_wait'] = function(block) {
  var seconds = Blockly.Python.valueToCode(block, 'SECONDS', Blockly.Python.ORDER_ATOMIC) || '1';
  Blockly.Python.definitions_['import_time'] = 'import time';
  return sancabotTraceLine(block, 'esperar') + 'time.sleep(' + seconds + ')\n';
};
Blockly.Python['sancabot_calibrate'] = function(block) {
  var side = block.getFieldValue('SIDE');
  var correction = block.getFieldValue('CORRECTION');
  sancabotRuntimeDefinition();
  var left = side === 'LEFT' ? correction : '0';
  var right = side === 'RIGHT' ? correction : '0';
  return sancabotTraceLine(block, 'corrigir desvio') + 'sancabot_set_correction(' + left + ', ' + right + ')\n';
};

Blockly.Python['sancabot_turn_calibration'] = function(block) {
  var seconds = block.getFieldValue('SECONDS') || '1';
  sancabotRuntimeDefinition();
  return sancabotTraceLine(block, 'calibrar giro') + 'sancabot_set_turn_calibration(' + seconds + ')\n';
};

function sancabotDistanceRuntimeDefinition() {
  Blockly.Python.definitions_['import_time'] = 'import time';
  Blockly.Python.definitions_['import_pin'] = 'from machine import Pin';
  Blockly.Python.definitions_['import_time_pulse_us'] = 'from machine import time_pulse_us';
  Blockly.Python.definitions_['sancabot_distance_runtime'] = [
    'class SancaBotHCSR04:',
    '    def __init__(self, trigger_pin, echo_pin, echo_timeout_us=25000):',
    '        self.echo_timeout_us = echo_timeout_us',
    '        self.trigger = Pin(trigger_pin, mode=Pin.OUT)',
    '        self.trigger.value(0)',
    '        self.echo = Pin(echo_pin, mode=Pin.IN)',
    '',
    '    def _send_pulse_and_wait(self):',
    '        self.trigger.value(0)',
    '        time.sleep_us(5)',
    '        self.trigger.value(1)',
    '        time.sleep_us(10)',
    '        self.trigger.value(0)',
    '        return time_pulse_us(self.echo, 1, self.echo_timeout_us)',
    '',
    '    def distance_cm(self):',
    '        pulse_time = self._send_pulse_and_wait()',
    '        if pulse_time < 0:',
    '            return -1',
    '        distance = (pulse_time / 2) / 29.1',
    '        if distance < 2 or distance > 400:',
    '            return -1',
    '        return distance',
    '',
    'def sancabot_distance_cm():',
    '    try:',
    '        sensor = sancabot_distance_sensor',
    '    except NameError:',
    '        return -1',
    '    try:',
    '        return round(sensor.distance_cm(), 1)',
    '    except Exception:',
    '        return -1',
    '',
    'def sancabot_observed_distance_cm():',
    '    global sancabot_observe_distance_cm, sancabot_distance_last_ms',
    '    try:',
    '        interval_ms = sancabot_distance_interval_ms',
    '    except NameError:',
    '        interval_ms = 200',
    '    now = time.ticks_ms()',
    '    try:',
    '        last_ms = sancabot_distance_last_ms',
    '    except NameError:',
    '        last_ms = None',
    '    if last_ms is None or time.ticks_diff(now, last_ms) >= interval_ms:',
    '        sancabot_observe_distance_cm = sancabot_distance_cm()',
    '        sancabot_distance_last_ms = now',
    '    try:',
    '        return sancabot_observe_distance_cm',
    '    except NameError:',
    '        return sancabot_distance_cm()'
  ].join('\n');
}

Blockly.Python['sancabot_distance_sensor'] = function(block) {
  var triggerPin = block.getFieldValue('TRIGGER_PIN') || '7';
  var echoPin = block.getFieldValue('ECHO_PIN') || '8';
  var readInterval = block.getFieldValue('READ_INTERVAL') || '0.2';
  sancabotDistanceRuntimeDefinition();
  var code = sancabotTraceLine(block, 'preparar ultrassom');
  code += 'sancabot_distance_sensor = SancaBotHCSR04(trigger_pin=' + triggerPin + ', echo_pin=' + echoPin + ', echo_timeout_us=30000)\n';
  code += 'sancabot_distance_interval_ms = int(' + readInterval + ' * 1000)\n';
  code += 'sancabot_output_interval_ms = 1000\n';
  return code;
};

Blockly.Python['sancabot_distance_cm'] = function(block) {
  sancabotDistanceRuntimeDefinition();
  return ['sancabot_observed_distance_cm()', Blockly.Python.ORDER_FUNCTION_CALL];
};

function sancabotDistanceCompareExpression(op, limit) {
  var reading = 'sancabot_observed_distance_cm()';
  if (op === 'GT') return '(' + reading + ' >= 0 and ' + reading + ' > ' + limit + ')';
  if (op === 'EQ') return '(' + reading + ' >= 0 and abs(' + reading + ' - ' + limit + ') <= 1)';
  return '(' + reading + ' >= 0 and ' + reading + ' < ' + limit + ')';
}

Blockly.Python['sancabot_obstacle_near'] = function(block) {
  var limit = block.getFieldValue('LIMIT_CM') || '15';
  var op = block.getFieldValue('OP') || 'LT';
  sancabotDistanceRuntimeDefinition();
  return [sancabotDistanceCompareExpression(op, limit), Blockly.Python.ORDER_RELATIONAL || Blockly.Python.ORDER_NONE];
};

Blockly.Python['sancabot_if_obstacle'] = function(block) {
  var limit = block.getFieldValue('LIMIT_CM') || '15';
  var op = block.getFieldValue('OP') || 'LT';
  sancabotDistanceRuntimeDefinition();
  var branch = Blockly.Python.statementToCode(block, 'DO');
  if (!branch || !branch.trim()) branch = Blockly.Python.INDENT + 'pass\n';
  return sancabotTraceLine(block, 'decidir pela distancia') + 'if ' + sancabotDistanceCompareExpression(op, limit) + ':\n' + branch;
};

Blockly.Python['sancabot_observe_scene'] = function(block) {
  var seconds = block.getFieldValue('SECONDS') || '5';
  var interval = block.getFieldValue('INTERVAL') || '0.2';
  sancabotDistanceRuntimeDefinition();
  var branch = Blockly.Python.statementToCode(block, 'DO');
  if (!branch || !branch.trim()) {
    branch = Blockly.Python.INDENT + 'print("Distancia:", sancabot_distance_cm(), "cm")\n';
  }
  var code = sancabotTraceLine(block, 'testar sensor') + '';
  code += 'sancabot_observe_start = time.ticks_ms()\n';
  code += 'while time.ticks_diff(time.ticks_ms(), sancabot_observe_start) < (' + seconds + ' * 1000):\n';
  code += Blockly.Python.INDENT + 'sancabot_observe_distance_cm = sancabot_distance_cm()\n';
  code += branch;
  code += Blockly.Python.INDENT + 'time.sleep(' + interval + ')\n';
  code += 'try:\n';
  code += Blockly.Python.INDENT + 'sancabot_stop()\n';
  code += 'except Exception:\n';
  code += Blockly.Python.INDENT + 'pass\n';
  return code;
};



function sancabotPyString(value) {
  return JSON.stringify(String(value || ''));
}





Blockly.Python['sancabot_explore_until'] = function(block) {
  var limit = block.getFieldValue('LIMIT_CM') || '15';
  var op = block.getFieldValue('OP') || 'LT';
  var interval = block.getFieldValue('INTERVAL') || '0.2';
  sancabotDistanceRuntimeDefinition();
  var whileBranch = Blockly.Python.statementToCode(block, 'WHILE_DO');
  var foundBranch = Blockly.Python.statementToCode(block, 'FOUND_DO');
  if (!whileBranch || !whileBranch.trim()) {
    whileBranch = Blockly.Python.INDENT + 'print("Distancia:", sancabot_observed_distance_cm(), "cm")\n';
  }
  foundBranch = sancabotDeindent(foundBranch);
  if (!foundBranch || !foundBranch.trim()) foundBranch = 'pass\n';
  var condition = sancabotDistanceCompareExpression(op, limit);
  var code = sancabotTraceLine(block, 'explorar ate obstaculo') + '';
  code += 'while True:\n';
  code += Blockly.Python.INDENT + sancabotTraceLine(block, 'medir e explorar');
  code += Blockly.Python.INDENT + 'sancabot_observe_distance_cm = sancabot_distance_cm()\n';
  code += Blockly.Python.INDENT + 'if ' + condition + ':\n';
  code += Blockly.Python.INDENT + Blockly.Python.INDENT + 'break\n';
  code += whileBranch;
  code += Blockly.Python.INDENT + 'time.sleep(' + interval + ')\n';
  code += 'sancabot_observe_distance_cm = sancabot_distance_cm()\n';
  code += foundBranch;
  return code;
};

Blockly.Python['sancabot_explore_forever'] = function(block) {
  var interval = block.getFieldValue('INTERVAL') || '0.2';
  sancabotDistanceRuntimeDefinition();
  var branch = Blockly.Python.statementToCode(block, 'DO');
  if (!branch || !branch.trim()) {
    branch = Blockly.Python.INDENT + 'print("Distancia:", sancabot_observed_distance_cm(), "cm")\n';
  }
  var code = sancabotTraceLine(block, 'repetir medicao') + '';
  code += 'while True:\n';
  code += Blockly.Python.INDENT + sancabotTraceLine(block, 'medir sensor');
  code += Blockly.Python.INDENT + 'sancabot_observe_distance_cm = sancabot_distance_cm()\n';
  code += branch;
  code += Blockly.Python.INDENT + 'time.sleep(' + interval + ')\n';
  return code;
};

function sancabotIsInsideRepeat(block) {
  var parent = block && block.getSurroundParent && block.getSurroundParent();
  while (parent) {
    if (parent.type === 'sancabot_exp_repeat_condition' ||
        parent.type === 'sancabot_exp_repeat_while' ||
        parent.type === 'sancabot_exp_repeat_until' ||
        parent.type === 'sancabot_exp_repeat_times' ||
        parent.type === 'sancabot_explore_forever' ||
        parent.type === 'sancabot_explore_until') {
      return true;
    }
    parent = parent.getSurroundParent && parent.getSurroundParent();
  }
  return false;
}
Blockly.Python['sancabot_break_explore'] = function(block) {
  if (!sancabotIsInsideRepeat(block)) {
    return '# sair da repeticao usado fora de uma repeticao\npass\n';
  }
  return sancabotTraceLine(block, 'sair da repeticao') + 'break\n';
};

Blockly.Python['sancabot_panel_number'] = function(block) {
  var value = Blockly.Python.valueToCode(block, 'VALUE', Blockly.Python.ORDER_ATOMIC) || '0';
  var label = sancabotPyString(block.getFieldValue('LABEL') || 'Valor');
  var unit = sancabotPyString(block.getFieldValue('UNIT') || '');
  var code = sancabotTraceLine(block, 'mostrar no painel');
  code += 'try:\n';
  code += Blockly.Python.INDENT + '_ = sancabot_panel_last_ms\n';
  code += 'except NameError:\n';
  code += Blockly.Python.INDENT + 'sancabot_panel_last_ms = None\n';
  code += 'try:\n';
  code += Blockly.Python.INDENT + '_ = sancabot_output_interval_ms\n';
  code += 'except NameError:\n';
  code += Blockly.Python.INDENT + 'sancabot_output_interval_ms = 1000\n';
  code += 'sancabot_panel_now = time.ticks_ms()\n';
  code += 'if sancabot_panel_last_ms is None or time.ticks_diff(sancabot_panel_now, sancabot_panel_last_ms) >= sancabot_output_interval_ms:\n';
  code += Blockly.Python.INDENT + 'print("SANCABOT_PANEL|" + ' + label + ' + "|" + str(' + value + ') + "|" + ' + unit + ')\n';
  code += Blockly.Python.INDENT + 'sancabot_panel_last_ms = sancabot_panel_now\n';
  return code;
};



Blockly.Python['sancabot_observe_drive'] = function(block) {
  var action = block.getFieldValue('ACTION');
  var speed = block.getFieldValue('SPEED') || '30';
  sancabotRuntimeDefinition();
  var left = speed;
  var right = speed;
  if (action === 'BACKWARD') {
    left = '-' + speed;
    right = '-' + speed;
  } else if (action === 'LEFT') {
    left = '-' + speed;
    right = speed;
  } else if (action === 'RIGHT') {
    left = speed;
    right = '-' + speed;
  }
  return sancabotTraceLine(block, 'seguir enquanto observa') + 'sancabot_drive(' + left + ', ' + right + ')\n';
};

// sancabot_print_distance removido em 2026-07-05 — use sancabot_panel_number.


// ===== Experimental: geradores de logica, condicoes e cronometro =====
function sancabotTimerRuntimeDefinition() {
  Blockly.Python.definitions_['import_time'] = 'import time';
  Blockly.Python.definitions_['sancabot_timer_runtime'] = [
    'def sancabot_timer_seconds():',
    '    try:',
    '        start = sancabot_timer_start',
    '    except NameError:',
    '        return 0',
    '    return int(time.ticks_diff(time.ticks_ms(), start) / 1000)'
  ].join('\n');
}

function sancabotBooleanCode(block, inputName, fallback) {
  return Blockly.Python.valueToCode(block, inputName, Blockly.Python.ORDER_NONE) || fallback || 'False';
}

function sancabotStatementCode(block, inputName) {
  var branch = Blockly.Python.statementToCode(block, inputName);
  if (!branch || !branch.trim()) branch = Blockly.Python.INDENT + 'pass\n';
  return branch;
}

Blockly.Python['sancabot_exp_if_else'] = function(block) {
  var code = sancabotTraceLine(block, 'decidir') + '';
  var index = 0;
  do {
    var condition = sancabotBooleanCode(block, 'IF' + index, 'False');
    var branch = sancabotStatementCode(block, 'DO' + index);
    code += (index === 0 ? 'if ' : 'elif ') + condition + ':\n' + branch;
    index++;
  } while (block.getInput('IF' + index));
  if (block.getInput('ELSE')) {
    code += 'else:\n' + sancabotStatementCode(block, 'ELSE');
  }
  return code;
};
Blockly.Python['sancabot_exp_repeat_times'] = function(block) {
  var times = Blockly.Python.valueToCode(block, 'TIMES', Blockly.Python.ORDER_ATOMIC) || '10';
  var branch = sancabotStatementCode(block, 'DO');
  return 'for sancabot_repeat_i in range(int(' + times + ')):\n' + sancabotLoopIterationTraceLine(block, 'repetir vezes') + branch;
};

Blockly.Python['sancabot_exp_repeat_while'] = function(block) {
  var condition = sancabotBooleanCode(block, 'COND', 'False');
  var branch = sancabotStatementCode(block, 'DO');
  return 'while ' + condition + ':\n' + sancabotLoopIterationTraceLine(block, 'repetir enquanto') + branch;
};

Blockly.Python['sancabot_exp_repeat_until'] = function(block) {
  var condition = sancabotBooleanCode(block, 'COND', 'False');
  var branch = sancabotStatementCode(block, 'DO');
  return 'while not (' + condition + '):\n' + sancabotLoopIterationTraceLine(block, 'repetir ate') + branch;
};

Blockly.Python['sancabot_exp_repeat_condition'] = function(block) {
  var condition = sancabotBooleanCode(block, 'COND', 'False');
  var mode = block.getFieldValue('MODE') || 'WHILE';
  var branch = sancabotStatementCode(block, 'DO');
  if (mode === 'UNTIL') {
    return 'while not (' + condition + '):\n' + sancabotLoopIterationTraceLine(block, 'repetir ate') + branch;
  }
  return 'while ' + condition + ':\n' + sancabotLoopIterationTraceLine(block, 'repetir enquanto') + branch;
};

Blockly.Python['sancabot_ultrasonic_condition'] = function(block) {
  var limit = block.getFieldValue('LIMIT_CM') || '15';
  var op = block.getFieldValue('OP') || 'LT';
  sancabotDistanceRuntimeDefinition();
  return [sancabotDistanceCompareExpression(op, limit), Blockly.Python.ORDER_RELATIONAL || Blockly.Python.ORDER_NONE];
};

Blockly.Python['sancabot_logic_join'] = function(block) {
  var a = sancabotBooleanCode(block, 'A', 'False');
  var b = sancabotBooleanCode(block, 'B', 'False');
  var op = block.getFieldValue('OP') || 'AND';
  var pyOp = op === 'OR' ? ' or ' : ' and ';
  return ['(' + a + pyOp + b + ')', Blockly.Python.ORDER_LOGICAL_AND || Blockly.Python.ORDER_NONE];
};

Blockly.Python['sancabot_timer_start'] = function(block) {
  sancabotTimerRuntimeDefinition();
  return sancabotTraceLine(block, 'iniciar cronometro') + 'sancabot_timer_start = time.ticks_ms()\n';
};

Blockly.Python['sancabot_timer_seconds'] = function(block) {
  sancabotTimerRuntimeDefinition();
  return ['sancabot_timer_seconds()', Blockly.Python.ORDER_FUNCTION_CALL];
};

function sancabotTimerCompareExpression(op, seconds) {
  var reading = 'sancabot_timer_seconds()';
  if (op === 'GT') return '(' + reading + ' > ' + seconds + ')';
  if (op === 'EQ') return '(abs(' + reading + ' - ' + seconds + ') <= 0.5)';
  return '(' + reading + ' < ' + seconds + ')';
}

Blockly.Python['sancabot_timer_condition'] = function(block) {
  var seconds = block.getFieldValue('SECONDS') || '60';
  var op = block.getFieldValue('OP') || 'LT';
  sancabotTimerRuntimeDefinition();
  return [sancabotTimerCompareExpression(op, seconds), Blockly.Python.ORDER_RELATIONAL || Blockly.Python.ORDER_NONE];
};

// sancabot_timer_print removido em 2026-07-05 — use sancabot_panel_number.
















