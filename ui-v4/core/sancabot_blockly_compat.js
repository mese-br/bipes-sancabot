/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: compatibilidade entre o código do BIPES (escrito para o Blockly 6.2021) e o Blockly 13.
   Cada item abaixo cobre UMA API que o BIPES usa e que mudou de nome ou saiu do núcleo. O levantamento completo foi feito
   comparando as 528 APIs do Blockly usadas pelo BIPES com a versão 13.4.0: só estas 15 não existem mais.
   Carregar logo depois de blockly13/*.js e antes de storage.js, code.js e dos blocos. */
(function () {
  'use strict';
  var B = window.Blockly;
  if (!B || !B.utils) { console.error('[SancaBot compat] Blockly 13 não carregou.'); return; }

  // 1) XML: textToDom saiu de Blockly.Xml (agora está em Blockly.utils.xml).
  if (!B.Xml.textToDom) B.Xml.textToDom = function (text) { return B.utils.xml.textToDom(text); };

  // 2) Alinhamento dos campos (Blockly.ALIGN_RIGHT etc. -> Blockly.Input.Align).
  var A = (B.Input && B.Input.Align) || (B.inputs && B.inputs.Align) || {};
  if (B.ALIGN_LEFT === undefined) B.ALIGN_LEFT = A.LEFT;
  if (B.ALIGN_CENTRE === undefined) B.ALIGN_CENTRE = A.CENTRE;
  if (B.ALIGN_RIGHT === undefined) B.ALIGN_RIGHT = A.RIGHT;

  // 3) Campos de cor e ângulo: saíram do núcleo e viraram plugins (carregados antes deste arquivo).
  try {
    if (!B.FieldColour && window.FieldColour) { B.FieldColour = window.FieldColour; if (window.registerFieldColour) window.registerFieldColour(); }
    if (!B.FieldAngle && window.FieldAngle) { B.FieldAngle = window.FieldAngle; if (window.registerFieldAngle) window.registerFieldAngle(); }
  } catch (e) { console.warn('[SancaBot compat] plugin de cor/ângulo:', e); }

  // 4) Mutador: `new Blockly.Mutator([...])` virou o ícone MutatorIcon. Os blocos do BIPES continuam escrevendo
  //    this.setMutator(new Blockly.Mutator([...])) e usando decompose/compose/saveConnections como antes.
  if (!B.Mutator && B.icons && B.icons.MutatorIcon) {
    B.Mutator = function (quarkNames) { this.quarkNames = quarkNames || []; };
    // Religa a conexão de um bloco filho a uma entrada (cópia do comportamento original).
    B.Mutator.reconnect = function (connectionChild, block, inputName) {
      if (!connectionChild || !connectionChild.getSourceBlock() || !connectionChild.getSourceBlock().workspace) return false;
      var input = block.getInput(inputName); if (!input || !input.connection) return false;
      var connectionParent = input.connection, currentParent = connectionChild.targetBlock();
      if ((!currentParent || currentParent === block) && connectionParent.targetConnection !== connectionChild) {
        if (connectionParent.isConnected()) connectionParent.disconnect();
        connectionParent.connect(connectionChild);
        return true;
      }
      return false;
    };
    // O BlockSvg tem o próprio setMutator (sobrepõe o do Block), por isso o envelope vai nos dois.
    [B.Block, B.BlockSvg].forEach(function (K) {
      if (!K || !K.prototype) return;
      var origSet = K.prototype.setMutator;
      K.prototype.setMutator = function (m) {
        if (m instanceof B.Mutator) { if (!this.getIcon || !this.getIcon(B.icons.MutatorIcon.TYPE)) this.addIcon(new B.icons.MutatorIcon(m.quarkNames, this)); return; }
        if (origSet) return origSet.apply(this, arguments);
      };
    });
  }

  // 5) Diálogos: Blockly.alert/confirm/prompt -> Blockly.dialog.*.
  if (!B.alert && B.dialog) B.alert = function (m, cb) { return B.dialog.alert(m, cb); };
  if (!B.confirm && B.dialog) B.confirm = function (m, cb) { return B.dialog.confirm(m, cb); };
  if (!B.prompt && B.dialog) B.prompt = function (m, d, cb) { return B.dialog.prompt(m, d, cb); };

  // 6) Utilitários que mudaram de pasta.
  if (B.utils.parsing) {
    if (!B.utils.replaceMessageReferences) B.utils.replaceMessageReferences = B.utils.parsing.replaceMessageReferences;
    if (!B.utils.parseBlockColour) B.utils.parseBlockColour = B.utils.parsing.parseBlockColour;
  }

  // 8) Block.getVars(): existia no Blockly 6 (ids das variáveis usadas pelo bloco) e o gerador do EasyMQTT/funções ainda chama.
  //    Blocos que a sobrescrevem (procedimentos) continuam valendo; os demais devolviam ids, que nunca coincidem com nomes.
  if (!B.Block.prototype.getVars) {
    B.Block.prototype.getVars = function () {
      var vars = [];
      for (var i = 0, input; (input = this.inputList[i]); i++) {
        for (var j = 0, field; (field = input.fieldRow[j]); j++) { if (field.referencesVariables && field.referencesVariables()) vars.push(field.getValue()); }
      }
      return vars;
    };
  }

  // 9) Carregar XML (projetos antigos, modelos): o Blockly 6 deixava solto, em silêncio, o bloco cujo tipo de conexão não combinava;
  //    o 13 lança erro e o projeto inteiro deixaria de abrir. Ao CARREGAR XML os blocos ficam conectados como foram salvos
  //    (só a verificação de TIPO fica de lado, e só durante o carregamento; arrastar na tela continua respeitando os tipos).
  (function () {
    var CC = B.ConnectionChecker && B.ConnectionChecker.prototype;
    if (!CC || !CC.doTypeChecks) return;
    var tolerant = function (fn) {
      return function () {
        var orig = CC.doTypeChecks; CC.doTypeChecks = function () { return true; };
        try { return fn.apply(this, arguments); } finally { CC.doTypeChecks = orig; }
      };
    };
    ['domToWorkspace', 'domToBlock', 'appendDomToWorkspace', 'clearWorkspaceAndLoadFromXml'].forEach(function (n) { if (B.Xml[n]) B.Xml[n] = tolerant(B.Xml[n]); });
  })();

  // 10b) Mesmo problema em outros geradores de matemática (número primo, média, mediana, moda, desvio padrão): o Blockly novo
  //      escreve "from numbers import Number" e isinstance(x, Number). MicroPython não tem o módulo "numbers". O Blockly 6 antigo
  //      gerava isinstance(x, int), que descartava decimais (ex.: a média ignorava leituras de sensor como 2.5). Usamos
  //      (int, float), que funciona em MicroPython e conta os decimais.
  if (B.Python && B.Python.finish && !B.Python.__sancabotNumberFix) {
    var origFinish = B.Python.finish;
    B.Python.finish = function (code) {
      var defs = this.definitions_ || {};
      delete defs['from_numbers_import_Number'];
      Object.keys(defs).forEach(function (k) {
        if (typeof defs[k] === 'string') defs[k] = defs[k].replace(/isinstance\(([A-Za-z_][A-Za-z0-9_]*), Number\)/g, 'isinstance($1, (int, float))');
      });
      return origFinish.call(this, String(code).replace(/isinstance\(([A-Za-z_][A-Za-z0-9_]*), Number\)/g, 'isinstance($1, (int, float))'));
    };
    B.Python.__sancabotNumberFix = true;
  }

  // 10) math_change ("mudar variável por N"): o gerador novo escreve "from numbers import Number" + isinstance(x, Number); o módulo
  //     "numbers" NÃO existe em MicroPython. O BIPES sempre gerou isinstance(x, int); mantemos assim.
  if (B.Python && B.Python.forBlock) {
    B.Python.forBlock['math_change'] = function (block, generator) {
      var G = generator || B.Python;
      var delta = G.valueToCode(block, 'DELTA', G.ORDER_ADDITIVE) || '0';
      var varName = G.getVariableName ? G.getVariableName(block.getFieldValue('VAR')) : G.nameDB_.getName(block.getFieldValue('VAR'), B.Names.NameType ? B.Names.NameType.VARIABLE : B.VARIABLE_CATEGORY_NAME);
      return varName + ' = (' + varName + ' if isinstance(' + varName + ', (int, float)) else 0) + ' + delta + '\n';
    };
  }

  // 11) A div da caixa de ferramentas mudou de classe (.blocklyToolboxDiv -> .blocklyToolbox). O CSS e os painéis do SancaBot
  //     usam o nome antigo; mantemos as duas classes na mesma div.
  if (B.Toolbox && B.Toolbox.prototype.init && !B.Toolbox.prototype.__sbCls) {
    var origInit = B.Toolbox.prototype.init;
    B.Toolbox.prototype.init = function () {
      var r = origInit.apply(this, arguments);
      if (this.HtmlDiv) this.HtmlDiv.classList.add('blocklyToolboxDiv');
      return r;
    };
    B.Toolbox.prototype.__sbCls = true;
  }

  // 12) Bandeja de blocos (flyout): se um modelo da caixa tiver um encaixe que o Blockly 13 recusa por tipo, a montagem lançava erro no meio,
  //     a bandeja ficava pela metade e TODAS as categorias seguintes apareciam vazias. Aqui a montagem ignora a checagem de tipo (como no
  //     carregamento de projetos) e, se mesmo assim falhar, esconde a bandeja em vez de deixá-la quebrada.
  if (B.Flyout && B.Flyout.prototype.show && !B.Flyout.prototype.__sbTol) {
    var origShow = B.Flyout.prototype.show;
    B.Flyout.prototype.show = function () {
      var CC = B.ConnectionChecker && B.ConnectionChecker.prototype, saved = CC && CC.doTypeChecks;
      if (CC) CC.doTypeChecks = function () { return true; };
      try { return origShow.apply(this, arguments); }
      catch (e) { console.warn('[SancaBot] bandeja de blocos com problema:', e && e.message); try { this.hide(); } catch (x) { /* ok */ } }
      finally { if (CC) CC.doTypeChecks = saved; }
    };
    B.Flyout.prototype.__sbTol = true;
  }

  // 7) Geradores: no Blockly novo o gerador de um bloco mora em generator.forBlock[tipo]. O código do BIPES foi convertido
  //    (Blockly.Python.forBlock['tipo'] = ...), então não há nada a adaptar aqui; só registramos o estado para diagnóstico.
  window.sancabotCompat = { blockly: B.VERSION, python: B.Python && !!B.Python.forBlock, javascript: B.JavaScript && !!B.JavaScript.forBlock };
})();
