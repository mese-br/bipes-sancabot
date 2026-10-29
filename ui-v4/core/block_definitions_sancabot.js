// ===== Blocos SancaBot (extraÃ­do de block_definitions.js em 2026-07-05) =====
// Convenção: todo bloco novo criado aqui deve primeiro entrar na categoria
// "Experimental" do toolbox (ui/toolbox/sancabot.xml) antes de ser promovido
// para uma categoria temática definitiva. Ver README-SANCABOT.md.
//
// Removidos nesta reorganização (variantes de movimento redundantes com
// sancabot_move_mode, confirmadas como "testadas e não usadas" por Marcos em
// 2026-07-05): sancabot_drive_mode, sancabot_turn_mode, sancabot_drive_timed,
// sancabot_turn_degrees, sancabot_move. Backup do conteúdo original completo
// em _backup_pre_reorg_20260705/block_definitions.js.bak.

// Portas da placa com NOME (tabela em sancabot_config.js, "ports"). O valor do campo continua sendo o número do pino,
// então o código gerado e os projetos antigos não mudam; só o texto que o aluno vê.
function sancabotPortOptions() {
  var cfg = (window.SancaBotConfig && window.SancaBotConfig.ports) || [], byPin = {}, out = [], pin;
  cfg.forEach(function (p) { byPin[p[1]] = p[0]; });
  for (pin = 0; pin <= 21; pin++) out.push([byPin[pin] !== undefined ? String(byPin[pin]) : 'pino ' + pin, String(pin)]);
  return out;
}
function sancabotPortField(defaultPin) {
  var f = new Blockly.FieldDropdown(sancabotPortOptions);
  try { f.setValue(String(defaultPin)); } catch (e) { /* fica no primeiro da lista */ }
  return f;
}

Blockly.Blocks['sancabot_config'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Preparar motores')
        .appendField('esquerdo')
        .appendField(sancabotPortField(0), 'LEFT_PIN')
        .appendField('direito')
        .appendField(sancabotPortField(1), 'RIGHT_PIN');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#168fd8');
    this.setTooltip('Configura as rodas antes de qualquer movimento. A porta \u00e9 o encaixe da placa onde cada motor est\u00e1 ligado.');
    this.setHelpUrl('');
  }
};



Blockly.Blocks['sancabot_motion_scene'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Caminho do robô');
    this.appendStatementInput('MOVES')
        .setCheck('SancaBotMotion')
        .appendField('faça');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#d96a1c');
    this.setTooltip('Organiza uma sequ\u00eancia de movimentos. Coloque aqui andar, girar, esperar ou parar.');
    this.setHelpUrl('');
  }
};



Blockly.Blocks['sancabot_time_seconds'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('tempo')
        .appendField(new Blockly.FieldTextInput('2', function(value) {
          var n = String(value).replace(',', '.');
          if (isNaN(parseFloat(n))) return null;
          n = Math.max(0, Math.min(999, parseFloat(n)));
          return String(n);
        }), 'SECONDS')
        .appendField('segundos');
    this.setOutput(true, 'SancaBotTime');
    this.setColour('#7b61ff');
    this.setTooltip('Define uma dura\u00e7\u00e3o em segundos. Use junto com movimentos por tempo ou com o bloco espera.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_angle_degrees'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('ângulo')
        .appendField(new Blockly.FieldNumber(90, 1, 360, 1), 'DEGREES')
        .appendField('graus');
    this.setOutput(true, 'SancaBotAngle');
    this.setColour('#7b61ff');
    this.setTooltip('Representa um \u00e2ngulo de giro. 90 graus \u00e9 um quarto de volta; 180 graus \u00e9 meia-volta.');
    this.setHelpUrl('');
  }
};



Blockly.Blocks['sancabot_move_mode'] = {
  init: function() {
    var self = this;
    var modeField = new Blockly.FieldDropdown([
      ['contínuo', 'CONTINUOUS'],
      ['por tempo', 'TIMED']
    ], function(newMode) {
      setTimeout(function() { self.updateShape_(newMode); }, 0);
      return newMode;
    });
    this.appendDummyInput('MAIN')
        .appendField('Mover')
        .appendField(new Blockly.FieldDropdown([
          ['para frente', 'FORWARD'],
          ['para trás', 'BACKWARD'],
          ['girando para esquerda', 'LEFT'],
          ['girando para direita', 'RIGHT']
        ]), 'ACTION')
        .appendField('a')
        .appendField(new Blockly.FieldNumber(50, 0, 100, 1), 'SPEED')
        .appendField('%')
        .appendField(modeField, 'MODE');
    this.setPreviousStatement(true, 'SancaBotMotion');
    this.setNextStatement(true, 'SancaBotMotion');
    this.setColour('#d96a1c');
    this.setTooltip('Move o SancaBot. Cont\u00ednuo mant\u00e9m andando at\u00e9 outro comando; por tempo anda por alguns segundos e para.');
    this.setHelpUrl('');
    this.updateShape_(this.getFieldValue('MODE'));
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('mode', this.getFieldValue('MODE') || 'CONTINUOUS');
    return container;
  },
  domToMutation: function(xmlElement) {
    var mode = xmlElement.getAttribute('mode') || 'CONTINUOUS';
    var field = this.getField('MODE');
    if (field && field.getValue() !== mode) field.setValue(mode);
    this.updateShape_(mode);
  },
  updateShape_: function(mode) {
    var shouldHaveDuration = mode === 'TIMED';
    if (shouldHaveDuration && !this.getInput('DURATION')) {
      this.appendValueInput('DURATION')
          .setCheck('SancaBotTime')
          .appendField('durante');
    } else if (!shouldHaveDuration && this.getInput('DURATION')) {
      this.removeInput('DURATION');
    }
    if (this.rendered && this.render) this.render();
  }
};

Blockly.Blocks['sancabot_stop'] = {
  init: function() {
    this.appendDummyInput().appendField('Parar');
    this.setPreviousStatement(true, 'SancaBotMotion');
    this.setNextStatement(true, 'SancaBotMotion');
    this.setColour('#d96a1c');
    this.setTooltip('Para as duas rodas imediatamente. Use antes de medir, virar ou terminar uma tentativa.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_wait'] = {
  init: function() {
    this.appendValueInput('SECONDS')
        .setCheck('SancaBotTime')
        .appendField('Esperar');
    this.setPreviousStatement(true, 'SancaBotMotion');
    this.setNextStatement(true, 'SancaBotMotion');
    this.setColour('#d96a1c');
    this.setTooltip('Pausa o programa pelo tempo escolhido. Use para esperar o rob\u00f4 estabilizar antes de medir ou continuar.');
    this.setHelpUrl('');
  }
};
Blockly.Blocks['sancabot_calibrate'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Corrigir desvio do robô');
    this.appendDummyInput()
        .appendField('se o robô vai para')
        .appendField(new Blockly.FieldDropdown([['esquerda', 'LEFT'], ['direita', 'RIGHT']]), 'SIDE');
    this.appendDummyInput()
        .appendField('aumentar a velocidade dessa roda em')
        .appendField(new Blockly.FieldNumber(5, 0, 30, 1), 'CORRECTION')
        .appendField('%');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#c88a00');
    this.setTooltip('Corrige o caminho quando o SancaBot n\u00e3o anda reto. Se ele desvia para um lado, aumente um pouco a roda desse mesmo lado.');
    this.setHelpUrl('');
  }
};


Blockly.Blocks['sancabot_turn_calibration'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Calibrar giro');
    this.appendDummyInput()
        .appendField('um giro de 90° leva')
        .appendField(new Blockly.FieldNumber(1, 0.1, 5, 0.1), 'SECONDS')
        .appendField('s a 50% de velocidade');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#c88a00');
    this.setTooltip('Calibra o tempo de um giro de 90 graus. Aumente se virou pouco; diminua se virou demais.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_distance_sensor'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Preparar sensor de distância');
    this.appendDummyInput()
        .appendField('emissor')
        .appendField(sancabotPortField(7), 'TRIGGER_PIN')
        .appendField('receptor')
        .appendField(sancabotPortField(8), 'ECHO_PIN');
    this.appendDummyInput()
        .appendField('ler a cada')
        .appendField(new Blockly.FieldNumber(0.2, 0.1, 5, 0.1), 'READ_INTERVAL')
        .appendField('s');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#168fd8');
    this.setTooltip('Configura o sensor de dist\u00e2ncia. O emissor manda o som e o receptor ouve o eco; cada um fica em uma porta da placa.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_distance_cm'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('distância')
        .appendField('(cm)');
    this.setOutput(true, 'Number');
    this.setColour('#00a7c7');
    this.setTooltip('Entrega a dist\u00e2ncia medida em cent\u00edmetros. Use para mostrar no painel ou comparar em uma decis\u00e3o.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_obstacle_near'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('obstáculo')
        .appendField(new Blockly.FieldDropdown([
          ['menor que', 'LT'],
          ['maior que', 'GT'],
          ['aproximadamente igual a', 'EQ']
        ]), 'OP')
        .appendField(new Blockly.FieldNumber(15, 1, 400, 1), 'LIMIT_CM')
        .appendField('cm');
    this.setOutput(true, 'Boolean');
    this.setColour('#14b8a6');
    this.setTooltip('Cria uma pergunta com a dist\u00e2ncia medida: menor, maior ou perto do valor escolhido.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_if_obstacle'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Se obstáculo')
        .appendField(new Blockly.FieldDropdown([
          ['menor que', 'LT'],
          ['maior que', 'GT'],
          ['aproximadamente igual a', 'EQ']
        ]), 'OP')
        .appendField(new Blockly.FieldNumber(15, 1, 400, 1), 'LIMIT_CM')
        .appendField('cm');
    this.appendStatementInput('DO')
        .setCheck(null)
        .appendField('faça');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#00a7c7');
    this.setTooltip('Executa os blocos de dentro somente quando a dist\u00e2ncia combinada for detectada.');
    this.setHelpUrl('');
  }
};


Blockly.Blocks['sancabot_observe_scene'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Testar sensor por')
        .appendField(new Blockly.FieldNumber(5, 0.5, 60, 0.5), 'SECONDS')
        .appendField('segundos');
    this.appendDummyInput()
        .appendField('atualizar a cada')
        .appendField(new Blockly.FieldNumber(1, 0.2, 5, 0.1), 'INTERVAL')
        .appendField('s');
    this.appendStatementInput('DO')
        .setCheck('SancaBotObserve')
        .appendField('repetir o teste');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6d5bd0');
    this.setTooltip('Faz v\u00e1rias medi\u00e7\u00f5es por alguns segundos. Bom para testar se o ultrassom est\u00e1 lendo certo.');
    this.setHelpUrl('');
  }
};




Blockly.Blocks['sancabot_explore_until'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Explorar até achar obstáculo')
        .appendField(new Blockly.FieldDropdown([
          ['menor que', 'LT'],
          ['maior que', 'GT'],
          ['aproximadamente igual a', 'EQ']
        ]), 'OP')
        .appendField(new Blockly.FieldNumber(15, 1, 400, 1), 'LIMIT_CM')
        .appendField('cm');
    this.appendDummyInput()
        .appendField('repetir a cada')
        .appendField(new Blockly.FieldNumber(1, 0.2, 5, 0.1), 'INTERVAL')
        .appendField('s');
    this.appendStatementInput('WHILE_DO')
        .setCheck('SancaBotObserve')
        .appendField('enquanto explora');
    this.appendStatementInput('FOUND_DO')
        .setCheck(null)
        .appendField('ao achar');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6d5bd0');
    this.setTooltip('Continua explorando at\u00e9 a dist\u00e2ncia escolhida acontecer. Depois segue para os blocos de ao encontrar.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_explore_forever'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Medir distância sem parar');
    this.appendDummyInput()
        .appendField('repetir a cada')
        .appendField(new Blockly.FieldNumber(1, 0.2, 5, 0.1), 'INTERVAL')
        .appendField('s');
    this.appendStatementInput('DO')
        .setCheck('SancaBotObserve')
        .appendField('a cada leitura');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6d5bd0');
    this.setTooltip('Repete a medi\u00e7\u00e3o do ultrassom. Use com decis\u00f5es para reagir enquanto o SancaBot se move.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_break_explore'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Sair da repetição');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6d5bd0');
    this.setTooltip('Encerra a repeti\u00e7\u00e3o atual. Use quando o SancaBot j\u00e1 encontrou o que precisava.');
    this.setHelpUrl('');
  },
  onchange: function() {
    if (!this.workspace || this.isInFlyout) return;
    var parent = this.getSurroundParent();
    var insideLoop = false;
    while (parent) {
      if (parent.type === 'sancabot_exp_repeat_condition' ||
          parent.type === 'sancabot_exp_repeat_while' ||
          parent.type === 'sancabot_exp_repeat_until' ||
          parent.type === 'sancabot_exp_repeat_times' ||
          parent.type === 'sancabot_explore_forever' ||
          parent.type === 'sancabot_explore_until') {
        insideLoop = true;
        break;
      }
      parent = parent.getSurroundParent && parent.getSurroundParent();
    }
    this.setWarningText(insideLoop ? null : 'Este bloco só funciona dentro de uma repetição.');
  }
};

Blockly.Blocks['sancabot_panel_number'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField('Mostrar no painel');
    this.appendDummyInput()
        .appendField('nome')
        .appendField(new Blockly.FieldTextInput('Distancia'), 'LABEL')
        .appendField('unidade')
        .appendField(new Blockly.FieldTextInput('cm'), 'UNIT');
    // Qualquer ponto do programa serve para mostrar um valor (o modelo do labirinto o põe depois de "Parar"); por isso aceita qualquer vizinho.
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#00a7c7');
    this.setTooltip('Mostra um valor no painel da miss\u00e3o. A atualiza\u00e7\u00e3o visual \u00e9 limitada para proteger o Bluetooth.');
    this.setHelpUrl('');
  }
};



Blockly.Blocks['sancabot_observe_drive'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Andar e observar')
        .appendField(new Blockly.FieldDropdown([
          ['frente', 'FORWARD'],
          ['ré', 'BACKWARD'],
          ['esquerda', 'LEFT'],
          ['direita', 'RIGHT']
        ]), 'ACTION')
        .appendField('velocidade')
        .appendField(new Blockly.FieldNumber(30, 0, 100, 1), 'SPEED')
        .appendField('%');
    this.setPreviousStatement(true, 'SancaBotObserve');
    this.setNextStatement(true, 'SancaBotObserve');
    this.setColour('#6d5bd0');
    this.setTooltip('Mant\u00e9m o SancaBot se movendo enquanto o sensor continua sendo lido.');
    this.setHelpUrl('');
  }
};

// sancabot_print_distance removido em 2026-07-05 \u2014 use sancabot_panel_number.


// ===== Experimental: blocos genéricos para validar lógica de programação =====
Blockly.Blocks['sancabot_exp_if_else'] = {
  init: function() {
    this.appendValueInput('IF0')
        .setCheck('Boolean')
        .appendField('Se');
    this.appendStatementInput('DO0')
        .setCheck(null)
        .appendField('faça');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6d5bd0');
    this.setMutator(new Blockly.Mutator(['controls_if_elseif', 'controls_if_else']));
    this.elseifCount_ = 0;
    this.elseCount_ = 0;
    this.setTooltip('Cria uma decis\u00e3o. Use a engrenagem do bloco para adicionar sen\u00e3o se ou sen\u00e3o quando houver mais caminhos.');
    this.setHelpUrl('');
  },
  mutationToDom: function() {
    if (!this.elseifCount_ && !this.elseCount_) return null;
    var container = document.createElement('mutation');
    if (this.elseifCount_) container.setAttribute('elseif', this.elseifCount_);
    if (this.elseCount_) container.setAttribute('else', 1);
    return container;
  },
  domToMutation: function(xmlElement) {
    this.elseifCount_ = parseInt(xmlElement.getAttribute('elseif'), 10) || 0;
    this.elseCount_ = parseInt(xmlElement.getAttribute('else'), 10) || 0;
    this.updateShape_();
  },
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('controls_if_if');
    containerBlock.initSvg();
    var connection = containerBlock.nextConnection;
    for (var i = 1; i <= this.elseifCount_; i++) {
      var elseifBlock = workspace.newBlock('controls_if_elseif');
      elseifBlock.initSvg();
      connection.connect(elseifBlock.previousConnection);
      connection = elseifBlock.nextConnection;
    }
    if (this.elseCount_) {
      var elseBlock = workspace.newBlock('controls_if_else');
      elseBlock.initSvg();
      connection.connect(elseBlock.previousConnection);
    }
    return containerBlock;
  },
  compose: function(containerBlock) {
    var itemBlock = containerBlock.nextConnection.targetBlock();
    var valueConnections = [null];
    var statementConnections = [null];
    var elseStatementConnection = null;
    this.elseifCount_ = 0;
    this.elseCount_ = 0;
    while (itemBlock && !itemBlock.isInsertionMarker()) {
      if (itemBlock.type === 'controls_if_elseif') {
        this.elseifCount_++;
        valueConnections.push(itemBlock.valueConnection_);
        statementConnections.push(itemBlock.statementConnection_);
      } else if (itemBlock.type === 'controls_if_else') {
        this.elseCount_++;
        elseStatementConnection = itemBlock.statementConnection_;
      }
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
    this.updateShape_();
    this.reconnectChildBlocks_(valueConnections, statementConnections, elseStatementConnection);
  },
  saveConnections: function(containerBlock) {
    var itemBlock = containerBlock.nextConnection.targetBlock();
    var i = 1;
    while (itemBlock) {
      if (itemBlock.type === 'controls_if_elseif') {
        var inputIf = this.getInput('IF' + i);
        var inputDo = this.getInput('DO' + i);
        itemBlock.valueConnection_ = inputIf && inputIf.connection.targetConnection;
        itemBlock.statementConnection_ = inputDo && inputDo.connection.targetConnection;
        i++;
      } else if (itemBlock.type === 'controls_if_else') {
        var inputElse = this.getInput('ELSE');
        itemBlock.statementConnection_ = inputElse && inputElse.connection.targetConnection;
      }
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
  },
  updateShape_: function() {
    if (this.getInput('ELSE')) this.removeInput('ELSE');
    var i = 1;
    while (this.getInput('IF' + i)) {
      this.removeInput('IF' + i);
      this.removeInput('DO' + i);
      i++;
    }
    for (i = 1; i <= this.elseifCount_; i++) {
      this.appendValueInput('IF' + i)
          .setCheck('Boolean')
          .appendField('senão se');
      this.appendStatementInput('DO' + i)
          .setCheck(null)
          .appendField('faça');
    }
    if (this.elseCount_) {
      this.appendStatementInput('ELSE')
          .setCheck(null)
          .appendField('senão');
    }
  },
  reconnectChildBlocks_: function(valueConnections, statementConnections, elseStatementConnection) {
    for (var i = 1; i <= this.elseifCount_; i++) {
      Blockly.Mutator.reconnect(valueConnections[i], this, 'IF' + i);
      Blockly.Mutator.reconnect(statementConnections[i], this, 'DO' + i);
    }
    Blockly.Mutator.reconnect(elseStatementConnection, this, 'ELSE');
  }
};
Blockly.Blocks['sancabot_exp_repeat_times'] = {
  init: function() {
    this.appendValueInput('TIMES')
        .setCheck('Number')
        .appendField('Repetir');
    this.appendDummyInput()
        .appendField('vezes');
    this.appendStatementInput('DO')
        .setCheck(null)
        .appendField('faça');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6d5bd0');
    this.setTooltip('Repete uma quantidade fixa de vezes. Bom para testar uma sequ\u00eancia antes de deixar o rob\u00f4 aut\u00f4nomo.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_exp_repeat_while'] = {
  init: function() {
    this.appendValueInput('COND')
        .setCheck('Boolean')
        .appendField('Repetir enquanto');
    this.appendStatementInput('DO')
        .setCheck(null)
        .appendField('faça');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6d5bd0');
    this.setTooltip('Repete enquanto a pergunta for verdadeira. Quando deixar de ser, o programa continua.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_exp_repeat_until'] = {
  init: function() {
    this.appendValueInput('COND')
        .setCheck('Boolean')
        .appendField('Repetir até');
    this.appendStatementInput('DO')
        .setCheck(null)
        .appendField('faça');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6d5bd0');
    this.setTooltip('Repete at\u00e9 uma pergunta virar verdadeira. \u00datil para procurar parede, sa\u00edda ou limite de tempo.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_exp_repeat_condition'] = {
  init: function() {
    this.appendValueInput('COND')
        .setCheck('Boolean')
        .appendField('Repetir')
        .appendField(new Blockly.FieldDropdown([
          ['enquanto', 'WHILE'],
          ['até', 'UNTIL']
        ]), 'MODE');
    this.appendStatementInput('DO')
        .setCheck(null)
        .appendField('faça');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6d5bd0');
    this.setTooltip('Escolha enquanto para repetir enquanto a pergunta \u00e9 verdadeira. Escolha at\u00e9 para parar quando ela acontecer.');
    this.setHelpUrl('');
  }
};


Blockly.Blocks['sancabot_ultrasonic_condition'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('sensor vê objeto')
        .appendField(new Blockly.FieldDropdown([
          ['a menos de', 'LT'],
          ['a mais de', 'GT'],
          ['perto de', 'EQ']
        ]), 'OP')
        .appendField(new Blockly.FieldNumber(15, 1, 400, 1), 'LIMIT_CM')
        .appendField('cm');
    this.setOutput(true, 'Boolean');
    this.setColour('#14b8a6');
    this.setTooltip('Transforma a dist\u00e2ncia do ultrassom em uma condi\u00e7\u00e3o verdadeira ou falsa. Use dentro de decide ou repete.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_logic_join'] = {
  init: function() {
    this.appendValueInput('A')
        .setCheck('Boolean')
        .appendField('condição');
    this.appendValueInput('B')
        .setCheck('Boolean')
        .appendField(new Blockly.FieldDropdown([
          ['e', 'AND'],
          ['ou', 'OR']
        ]), 'OP');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setColour('#14b8a6');
    this.setTooltip('Combina duas condi\u00e7\u00f5es. Use E quando as duas precisam acontecer; use OU quando uma delas j\u00e1 basta.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_timer_start'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('Iniciar cronômetro');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#7b61ff');
    this.setTooltip('Come\u00e7a a contar o tempo da tentativa. Use antes do desafio ou antes de uma nova rodada.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_timer_seconds'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('tempo do cronômetro')
        .appendField('(s)');
    this.setOutput(true, 'Number');
    this.setColour('#7b61ff');
    this.setTooltip('Informa quantos segundos passaram desde que o cron\u00f4metro foi iniciado.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['sancabot_timer_condition'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('cronômetro')
        .appendField(new Blockly.FieldDropdown([
          ['menor que', 'LT'],
          ['maior que', 'GT'],
          ['aproximadamente igual a', 'EQ']
        ]), 'OP')
        .appendField(new Blockly.FieldNumber(60, 0, 999, 1), 'SECONDS')
        .appendField('segundos');
    this.setOutput(true, 'Boolean');
    this.setColour('#14b8a6');
    this.setTooltip('Compara o tempo do cron\u00f4metro com o valor escolhido. Use para limitar uma tentativa ou criar uma meta.');
    this.setHelpUrl('');
  }
};

// sancabot_timer_print removido em 2026-07-05 — use sancabot_panel_number.








