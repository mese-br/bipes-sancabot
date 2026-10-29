/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: blocos DECLARATIVOS criados no SancaBot Studio Creator.

   Um bloco é um objeto JSON (sem JavaScript digitado por ninguém): mensagem com {CAMPOS}, lista de campos e um modelo de MicroPython
   com {CAMPOS}. Este mesmo arquivo é usado pelo Creator (prévia) e pelo editor (execução), então a prévia é igual ao que roda.
   Convenção (README-SANCABOT.md): bloco novo entra na categoria "Experimental" (#94a3b8) e só depois de validado em aula é promovido
   para uma categoria definitiva; "promover" = exportar o código (toDefinitionJS/toGeneratorJS/toToolboxXml) para os arquivos
   block_definitions_sancabot.js, generator_stubs_sancabot.js e toolbox/sancabot.xml.
   As regras de validação são espelhadas em PHP (sancabot-studio/api/lib/blocks.php); os dois são testados com os mesmos casos.
   TODO(pinos): faixa de GPIO 0 a 21 (ESP32-C3) e pinos padrão ainda a confirmar com o hardware. */
(function (root) {
  'use strict';

  var SCHEMA = 1;
  var TYPE_PREFIX = 'sancabot_x_';
  var NAME_RE = /^[a-z][a-z0-9_]{1,30}$/;
  var FIELD_RE = /^[A-Z][A-Z0-9_]{0,15}$/;
  var VALUE_RE = /^[A-Za-z0-9_ .,+\-*\/()"'<>=!%]{0,40}$/;
  var IMPORT_RE = /^(import [A-Za-z_][A-Za-z0-9_.]*|from [A-Za-z_][A-Za-z0-9_.]* import [A-Za-z0-9_, *]+)$/;
  var KINDS = ['statement', 'value'];
  var VALUE_TYPES = ['Number', 'Boolean', 'String'];
  var FIELD_KINDS = ['pin', 'number', 'text', 'dropdown', 'checkbox', 'input'];
  var PIN_MIN = 0, PIN_MAX = 21;        // TODO(pinos): confirmar a faixa de GPIO do ESP32-C3
  var LIMITS = { fields: 8, options: 12, imports: 8, setup: 6, helpers: 2000, code: 1200, label: 120, tooltip: 240, text: 40 };

  var PAL = ((typeof window !== 'undefined' && window.SancaBotConfig) || {}).palette || {};
  // Cores por categoria: as da paleta do editor (README-SANCABOT.md).
  var TARGETS = {
    // Cores = paleta do editor (sancabot_config.js); o fallback é a mesma paleta, para o Creator funcionar sem o config.
    experimental: { name: 'Experimental', colour: (PAL.more || '#A9B6D8') },
    preparacao: { name: 'Preparação', colour: (PAL.prep || '#FF7B6B') },
    movimento: { name: 'Movimento', colour: (PAL.move || '#4C9FFF') },
    ajustes: { name: 'Ajustes', colour: (PAL.prep || '#FF7B6B') },
    sensores: { name: 'Sensores', colour: (PAL.sense || '#1FD3C0') },
    decisao: { name: 'Repetição e decisão', colour: (PAL.decide || '#FF9A3C') }
  };

  var TOKEN_RE = /\{\{|\}\}|\{([A-Z][A-Z0-9_]*)\}/g;

  function str(v, max) { return (typeof v === 'string' ? v : (v == null ? '' : String(v))).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max); }
  function num(v, fallback) { var n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : fallback; }
  function lines(v, maxLines, maxLen) {
    var a = Array.isArray(v) ? v : String(v == null ? '' : v).split('\n');
    return a.map(function (s) { return str(s, maxLen).replace(/\s+$/, ''); }).filter(function (s) { return s.trim() !== ''; }).slice(0, maxLines);
  }

  // Tokens {CAMPO} de um texto (ignorando {{ e }}). Devolve a lista de nomes, na ordem.
  function tokensOf(text) {
    var out = [], m; TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(text)) !== null) { if (m[1]) out.push(m[1]); }
    return out;
  }
  // Chaves soltas (não escapadas) num texto.
  function strayBraces(text) { return String(text).replace(TOKEN_RE, '').search(/[{}]/) >= 0; }

  /* Normaliza qualquer objeto (formulário, arquivo importado, API) e devolve { def, errors, warnings }.
     Nunca lança. Se errors estiver vazio, def é seguro para registrar. */
  function sanitize(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var errors = [], warnings = [];
    var d = { schema: SCHEMA };
    d.name = str(raw.name, 31).trim();
    if (!NAME_RE.test(d.name)) errors.push('Identificador inválido: use letras minúsculas, números e _, começando por letra (2 a 31 caracteres).');
    d.label = str(raw.label, LIMITS.label).trim();
    if (!d.label) errors.push('Escreva o texto do bloco.');
    d.kind = KINDS.indexOf(raw.kind) >= 0 ? raw.kind : 'statement';
    d.valueType = d.kind === 'value' ? (VALUE_TYPES.indexOf(raw.valueType) >= 0 ? raw.valueType : 'Number') : null;
    d.target = TARGETS[raw.target] ? raw.target : 'experimental';
    d.tooltip = str(raw.tooltip, LIMITS.tooltip).trim();
    d.trace = str(raw.trace, 60).trim();
    d.title = str(raw.title, 80).trim();

    // campos
    d.fields = [];
    var seen = {};
    (Array.isArray(raw.fields) ? raw.fields : []).slice(0, LIMITS.fields).forEach(function (f, i) {
      f = f && typeof f === 'object' ? f : {};
      var n = str(f.name, 16).trim();
      if (!FIELD_RE.test(n)) { errors.push('Campo ' + (i + 1) + ': nome inválido (use MAIÚSCULAS, números e _, começando por letra).'); return; }
      if (seen[n]) { errors.push('Campo repetido: ' + n + '.'); return; }
      seen[n] = 1;
      var kind = FIELD_KINDS.indexOf(f.kind) >= 0 ? f.kind : 'number';
      var o = { name: n, kind: kind };
      if (kind === 'pin') {
        o.min = PIN_MIN; o.max = PIN_MAX; o.step = 1;
        o.default = Math.min(PIN_MAX, Math.max(PIN_MIN, Math.round(num(f.default, 0))));
      } else if (kind === 'number') {
        o.min = num(f.min, 0); o.max = num(f.max, 100); o.step = num(f.step, 1) || 1;
        if (Math.abs(o.min) > 1e6 || Math.abs(o.max) > 1e6) errors.push('Campo ' + n + ': limites muito grandes.');
        if (o.min > o.max) { errors.push('Campo ' + n + ': mínimo maior que o máximo.'); }
        o.default = Math.min(o.max, Math.max(o.min, num(f.default, o.min)));
      } else if (kind === 'text') {
        o.default = str(f.default, LIMITS.text);
      } else if (kind === 'dropdown') {
        o.options = (Array.isArray(f.options) ? f.options : []).slice(0, LIMITS.options).map(function (op) {
          return [str(Array.isArray(op) ? op[0] : '', 30).trim(), str(Array.isArray(op) ? op[1] : '', LIMITS.text).trim()];
        }).filter(function (op) { return op[0] !== ''; });
        if (!o.options.length) errors.push('Campo ' + n + ': a lista precisa de pelo menos uma opção.');
        o.options.forEach(function (op) { if (!VALUE_RE.test(op[1])) errors.push('Campo ' + n + ': o valor "' + op[1] + '" tem caracteres não permitidos.'); });
        o.default = o.options.length ? o.options[0][1] : '';
      } else if (kind === 'checkbox') {
        o.default = f.default === true || f.default === 'true' || f.default === 'TRUE';
      } else if (kind === 'input') {
        o.check = VALUE_TYPES.indexOf(f.check) >= 0 ? f.check : null;
        o.default = o.check === 'Boolean' ? 'False' : (o.check === 'String' ? '""' : '0');
      }
      d.fields.push(o);
    });

    // mensagem: cada campo aparece exatamente uma vez
    if (strayBraces(d.label)) errors.push('O texto do bloco tem { ou } soltos. Use {CAMPO} para um campo.');
    var inLabel = tokensOf(d.label), counts = {};
    inLabel.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    inLabel.forEach(function (t) { if (!seen[t]) errors.push('O texto usa {' + t + '}, mas esse campo não existe.'); });
    d.fields.forEach(function (f) {
      if (!counts[f.name]) errors.push('O campo ' + f.name + ' não aparece no texto do bloco: coloque {' + f.name + '} onde ele deve ficar.');
      else if (counts[f.name] > 1) errors.push('O campo ' + f.name + ' aparece mais de uma vez no texto do bloco.');
    });

    // Python
    d.imports = lines(raw.imports, LIMITS.imports, 80).map(function (s) { return s.trim(); });
    d.imports.forEach(function (s) { if (!IMPORT_RE.test(s)) errors.push('Importação inválida: "' + s + '" (use "import x" ou "from x import y").'); });
    d.helpers = str(raw.helpers, LIMITS.helpers).replace(/\s+$/, '');
    d.setup = lines(raw.setup, LIMITS.setup, 160);
    d.code = str(raw.code, LIMITS.code).replace(/\s+$/, '');
    if (!d.code.trim()) errors.push('Escreva o modelo de MicroPython do bloco.');
    if (d.kind === 'value' && d.code.indexOf('\n') >= 0) errors.push('Um bloco de valor precisa de uma única expressão de MicroPython (sem quebra de linha).');
    [['modelo de MicroPython', d.code]].concat(d.setup.map(function (s) { return ['linha de preparação', s]; })).forEach(function (p) {
      if (strayBraces(p[1])) errors.push('O ' + p[0] + ' tem { ou } soltos. Use {CAMPO}, ou {{ e }} para chaves de verdade.');
      tokensOf(p[1]).forEach(function (t) { if (!seen[t]) errors.push('O ' + p[0] + ' usa {' + t + '}, mas esse campo não existe.'); });
    });
    var codeTok = tokensOf(d.code + '\n' + d.setup.join('\n'));
    d.fields.forEach(function (f) { if (codeTok.indexOf(f.name) < 0) warnings.push('O campo ' + f.name + ' não é usado no MicroPython.'); });
    if (!d.tooltip) warnings.push('Sem dica: explique em uma frase o que o bloco faz (aparece ao passar o mouse).');
    if (!d.trace) d.trace = labelText(d);
    return { def: d, errors: errors, warnings: warnings };
  }

  /* Texto do bloco sem os campos (usado como rótulo do acompanhamento). */
  function labelText(d) {
    return String(d.label).replace(TOKEN_RE, function (m, n) { return n ? '' : (m === '{{' ? '{' : '}'); }).replace(/\s+/g, ' ').trim().slice(0, 60);
  }

  function blockType(d) { return TYPE_PREFIX + d.name; }
  // opts.experimental: o bloco vive na categoria Experimental (cinza) até ser promovido; senão, a cor da categoria de destino.
  function colourOf(d, opts) { return (opts && opts.experimental) ? TARGETS.experimental.colour : TARGETS[d.target].colour; }

  /* Substituição segura dos {CAMPOS}. Valor de campo NUNCA vira código solto:
       pin/number -> número; checkbox -> True/False; text -> literal de string Python entre aspas;
       dropdown -> o valor da opção (escrito pelo autor, validado); input -> código do bloco encaixado. */
  // Mesma chave dos blocos originais para "import x" (assim "import time" não duplica).
  function importKey(line) { return 'import_' + (line.indexOf('import ') === 0 ? line.slice(7) : line).replace(/\W+/g, '_'); }
  function pyString(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n') + '"'; }
  function fill(template, values) {
    return String(template).replace(TOKEN_RE, function (m, n) {
      if (m === '{{') return '{'; if (m === '}}') return '}';
      return Object.prototype.hasOwnProperty.call(values, n) ? values[n] : m;
    });
  }
  function literalFor(f, raw) {
    if (f.kind === 'pin') return String(Math.min(PIN_MAX, Math.max(PIN_MIN, Math.round(num(raw, f.default)))));
    if (f.kind === 'number') { var n = num(raw, f.default); n = Math.min(f.max, Math.max(f.min, n)); return String(n); }
    if (f.kind === 'checkbox') return (raw === true || raw === 'TRUE' || raw === 'true') ? 'True' : 'False';
    if (f.kind === 'text') return pyString(raw == null ? f.default : raw);
    if (f.kind === 'dropdown') { var ok = f.options.some(function (o) { return o[1] === raw; }); return ok ? String(raw) : f.default; }
    return f.default;
  }
  // Python de um bloco, a partir de uma função que devolve o valor cru de cada campo e o código de cada entrada.
  function generatePython(d, getField, getInput, ctx) {
    var vals = {};
    d.fields.forEach(function (f) {
      vals[f.name] = f.kind === 'input' ? (getInput(f.name) || f.default) : literalFor(f, getField(f.name));
    });
    var defs = ctx.definitions, out = { trace: d.trace };
    d.imports.forEach(function (line) { defs[importKey(line)] = line; });
    if (d.helpers) defs[blockType(d) + '_helpers'] = d.helpers;
    d.setup.forEach(function (line) { var f = fill(line, vals); defs[blockType(d) + '_setup_' + f.replace(/\W+/g, '_')] = f; });
    out.code = fill(d.code, vals);
    return out;
  }

  /* ---------- Registro no Blockly ---------- */
  function segments(d) {
    var byName = {}; d.fields.forEach(function (f) { byName[f.name] = f; });
    var segs = [], last = 0, m; TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(d.label)) !== null) {
      var text = d.label.slice(last, m.index).replace(/\{\{/g, '{').replace(/\}\}/g, '}');
      if (m[1]) { segs.push({ text: text, field: byName[m[1]] }); last = m.index + m[0].length; }
    }
    segs.push({ text: d.label.slice(last).replace(/\{\{/g, '{').replace(/\}\}/g, '}'), field: null });
    return segs;
  }
  function makeField(f) {
    var B = root.Blockly;
    if (f.kind === 'pin' || f.kind === 'number') return new B.FieldNumber(f.default, f.min, f.max, f.step);
    if (f.kind === 'text') return new B.FieldTextInput(f.default);
    if (f.kind === 'dropdown') return new B.FieldDropdown(f.options.map(function (o) { return [o[0], o[1]]; }));
    if (f.kind === 'checkbox') return new B.FieldCheckbox(f.default ? 'TRUE' : 'FALSE');
    return null;
  }
  var registry = {};     // name -> def (apenas o que ESTE módulo registrou)
  function register(def, opts) {
    var B = root.Blockly, P = B.Python, type = blockType(def);
    registry[def.name] = def;
    B.Blocks[type] = {
      init: function () {
        var self = this, row = this.appendDummyInput();
        segments(def).forEach(function (s) {
          if (s.field && s.field.kind === 'input') {
            var inp = self.appendValueInput(s.field.name);
            if (s.field.check) inp.setCheck(s.field.check);
            if (s.text.trim()) inp.appendField(s.text);
            row = null;
          } else {
            if (!row) row = self.appendDummyInput();
            if (s.text) row.appendField(s.text);
            if (s.field) row.appendField(makeField(s.field), s.field.name);
          }
        });
        if (def.fields.some(function (f) { return f.kind === 'input'; })) this.setInputsInline(true);
        if (def.kind === 'value') this.setOutput(true, def.valueType);
        else { this.setPreviousStatement(true, null); this.setNextStatement(true, null); }
        this.setColour(colourOf(def, opts));
        this.setTooltip(def.tooltip || '');
        this.setHelpUrl('');
      }
    };
    // Blockly 13: o gerador de cada bloco fica em generator.forBlock[tipo].
    (P.forBlock || P)[type] = function (block) {
      var r = generatePython(def,
        function (n) { return block.getFieldValue(n); },
        function (n) { return P.valueToCode(block, n, P.ORDER_ATOMIC); },
        { definitions: P.definitions_ });
      if (def.kind === 'value') {
        var simple = /^[\w.]+(\(.*\))?$/.test(r.code) || /^\(.*\)$/.test(r.code);
        return [simple ? r.code : '(' + r.code + ')', P.ORDER_ATOMIC];
      }
      var trace = (typeof root.sancabotTraceLine === 'function') ? root.sancabotTraceLine(block, r.trace) : '';
      return trace + r.code.replace(/\n?$/, '\n');
    };
    return type;
  }
  function unregister(name) {
    var B = root.Blockly, type = TYPE_PREFIX + name;
    delete registry[name]; delete B.Blocks[type]; delete (B.Python.forBlock || B.Python)[type];
  }
  function registerAll(defs, opts) {
    var res = [];
    (defs || []).forEach(function (raw) {
      var s = sanitize(raw);
      if (s.errors.length) { res.push({ name: raw && raw.name, errors: s.errors }); return; }
      if (registry[s.def.name]) unregister(s.def.name);
      register(s.def, opts); res.push({ name: s.def.name, type: blockType(s.def) });
    });
    return res;
  }

  /* ---------- Saídas no formato da convenção do repositório ---------- */
  function jsStr(s) { return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'"; }
  function jsStrAscii(s) { return jsStr(s).replace(/[^\x20-\x7E]/g, function (c) { return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4); }); }
  function fieldJs(f) {
    if (f.kind === 'pin' || f.kind === 'number') return 'new Blockly.FieldNumber(' + [f.default, f.min, f.max, f.step].join(', ') + ')';
    if (f.kind === 'text') return 'new Blockly.FieldTextInput(' + jsStrAscii(f.default) + ')';
    if (f.kind === 'checkbox') return "new Blockly.FieldCheckbox('" + (f.default ? 'TRUE' : 'FALSE') + "')";
    return 'new Blockly.FieldDropdown([' + f.options.map(function (o) { return '[' + jsStrAscii(o[0]) + ', ' + jsStrAscii(o[1]) + ']'; }).join(', ') + '])';
  }
  function toDefinitionJS(d) {
    var type = blockType(d), L = [];
    L.push("Blockly.Blocks['" + type + "'] = {");
    L.push('  init: function() {');
    var open = false;
    segments(d).forEach(function (s) {
      if (s.field && s.field.kind === 'input') {
        if (open) { L[L.length - 1] += ';'; open = false; }
        L.push("    this.appendValueInput('" + s.field.name + "')" + (s.field.check ? ".setCheck('" + s.field.check + "')" : '') + (s.text.trim() ? '.appendField(' + jsStrAscii(s.text) + ')' : '') + ';');
      } else {
        if (!open) { L.push('    this.appendDummyInput()'); open = true; }
        if (s.text) L.push('        .appendField(' + jsStrAscii(s.text) + ')');
        if (s.field) L.push('        .appendField(' + fieldJs(s.field) + ", '" + s.field.name + "')");
      }
    });
    if (open) L[L.length - 1] += ';';
    if (d.fields.some(function (f) { return f.kind === 'input'; })) L.push('    this.setInputsInline(true);');
    if (d.kind === 'value') L.push("    this.setOutput(true, '" + d.valueType + "');");
    else { L.push('    this.setPreviousStatement(true, null);'); L.push('    this.setNextStatement(true, null);'); }
    L.push("    this.setColour('" + colourOf(d) + "');   // " + TARGETS[d.target].name);
    L.push('    this.setTooltip(' + jsStrAscii(d.tooltip) + ');');
    L.push("    this.setHelpUrl('');");
    L.push('  }');
    L.push('};');
    return L.join('\n');
  }
  // Modelo -> expressão JavaScript que monta a string. Ex.: "_bz{PIN} = x" -> '_bz' + pin_ + ' = x'
  function tmplToJs(template) {
    var parts = [], buf = '', last = 0, m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(template)) !== null) {
      buf += template.slice(last, m.index);
      if (m[0] === '{{') buf += '{';
      else if (m[0] === '}}') buf += '}';
      else { if (buf) { parts.push(jsStrAscii(buf)); buf = ''; } parts.push(m[1].toLowerCase() + '_'); }
      last = m.index + m[0].length;
    }
    buf += template.slice(last);
    if (buf) parts.push(jsStrAscii(buf));
    return parts.length ? parts.join(' + ') : "''";
  }
  function toGeneratorJS(d) {
    var type = blockType(d), L = [];
    L.push("Blockly.Python.forBlock['" + type + "'] = function(block) {");
    d.fields.forEach(function (f) {
      var v = f.name.toLowerCase() + '_';
      if (f.kind === 'pin') L.push('  var ' + v + " = String(Math.round(Number(block.getFieldValue('" + f.name + "'))) || 0);");
      else if (f.kind === 'number') L.push('  var ' + v + " = String(Number(block.getFieldValue('" + f.name + "')) || 0);");
      else if (f.kind === 'checkbox') L.push('  var ' + v + " = block.getFieldValue('" + f.name + "') === 'TRUE' ? 'True' : 'False';");
      else if (f.kind === 'text') L.push('  var ' + v + ' = sancabotPyString(block.getFieldValue(' + "'" + f.name + "'));");
      else if (f.kind === 'dropdown') L.push('  var ' + v + " = block.getFieldValue('" + f.name + "') || " + jsStrAscii(f.default) + ';');
      else L.push('  var ' + v + " = Blockly.Python.valueToCode(block, '" + f.name + "', Blockly.Python.ORDER_ATOMIC) || " + jsStrAscii(f.default) + ';');
    });
    d.imports.forEach(function (line) { L.push("  Blockly.Python.definitions_['" + importKey(line) + "'] = " + jsStrAscii(line) + ';'); });
    if (d.helpers) L.push("  Blockly.Python.definitions_['" + type + "_helpers'] = " + jsStrAscii(d.helpers) + ';');
    d.setup.forEach(function (line, i) { L.push("  Blockly.Python.definitions_['" + type + '_setup_' + (i + 1) + "_' + " + tmplToJs(line) + '] = ' + tmplToJs(line) + ';'); });
    var code = tmplToJs(d.code);
    if (d.kind === 'value') {
      L.push('  var code = ' + code + ';');
      L.push('  return [code, Blockly.Python.ORDER_ATOMIC];');
    } else {
      L.push('  return sancabotTraceLine(block, ' + jsStrAscii(d.trace) + ') + ' + code + " + '\\n';");
    }
    L.push('};');
    return L.join('\n');
  }
  function toToolboxXml(d) {
    var x = '<block type="' + blockType(d) + '">';
    d.fields.forEach(function (f) { if (f.kind !== 'input') x += '<field name="' + f.name + '">' + String(f.kind === 'checkbox' ? (f.default ? 'TRUE' : 'FALSE') : f.default).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</field>'; });
    return x + '</block>';
  }
  function toolboxXml(d) { return Blockly.Xml.textToDom(toToolboxXml(d)); }

  var API = {
    SCHEMA: SCHEMA, TYPE_PREFIX: TYPE_PREFIX, TARGETS: TARGETS, LIMITS: LIMITS, PIN_MIN: PIN_MIN, PIN_MAX: PIN_MAX,
    NAME_RE: NAME_RE, FIELD_RE: FIELD_RE,
    sanitize: sanitize, blockType: blockType, labelText: labelText, tokensOf: tokensOf,
    generatePython: generatePython, pyString: pyString, fill: fill,
    register: register, unregister: unregister, registerAll: registerAll, registered: function () { return Object.keys(registry).map(function (k) { return registry[k]; }); },
    toDefinitionJS: toDefinitionJS, toGeneratorJS: toGeneratorJS, toToolboxXml: toToolboxXml, toolboxXml: toolboxXml
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.SancaBotCustomBlocks = API;
})(typeof window !== 'undefined' ? window : globalThis);
