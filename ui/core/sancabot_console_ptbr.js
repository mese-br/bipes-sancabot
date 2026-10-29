/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: mensagens do robô (MicroPython) em português no Console.
   Só o que aparece na tela muda: o texto traduzido é escrito no terminal (term.write); o que o robô recebe e envia continua igual.
   Cobre o banner, "soft reboot", rastros de erro (Traceback) e os erros mais comuns. Erro desconhecido aparece como veio.
   Para acrescentar uma mensagem: nova linha em RULES (regex, texto em português; $1, $2 são os trechos capturados). */
(function () {
  'use strict';
  var ERRNO = {
    EPERM: 'operação não permitida', ENOENT: 'arquivo ou pasta não existe', EIO: 'erro de entrada/saída (fios?)', ENOMEM: 'sem memória',
    EACCES: 'sem permissão', EEXIST: 'já existe', ENODEV: 'dispositivo não encontrado (fios?)', EINVAL: 'valor inválido',
    ENOSPC: 'sem espaço na memória do robô', EBUSY: 'ocupado, tente de novo', ETIMEDOUT: 'tempo esgotado', ECONNRESET: 'a conexão foi reiniciada',
    ECONNREFUSED: 'conexão recusada', ECONNABORTED: 'conexão cancelada', EADDRINUSE: 'endereço já está em uso', EHOSTUNREACH: 'não consegui chegar nesse endereço',
    ENOTCONN: 'sem conexão', EAGAIN: 'tente de novo', EBADF: 'arquivo inválido', EISDIR: 'isso é uma pasta, não um arquivo', ENOTDIR: 'isso não é uma pasta',
    ENETUNREACH: 'rede inacessível', EINPROGRESS: 'em andamento'
  };
  var OPS = { __add__: 'somar', __sub__: 'subtrair', __mul__: 'multiplicar', __truediv__: 'dividir', __floordiv__: 'dividir', __mod__: 'calcular o resto de', __pow__: 'elevar' };
  var TYPES = { int: 'número inteiro', float: 'número decimal', str: 'texto', bool: 'verdadeiro/falso', list: 'lista', tuple: 'tupla', dict: 'dicionário', NoneType: 'nada (None)', bytes: 'bytes' };
  function ty(t) { return TYPES[t] ? t + ' (' + TYPES[t] + ')' : t; }

  var RULES = [
    [/Traceback \(most recent call last\):/, 'Deu erro no programa! Onde aconteceu (a última linha é a mais recente):'],
    [/^(\s*)File "(.*)", line (\d+), in (.*)$/, function (m) { return m[1] + 'Arquivo "' + m[2] + '", linha ' + m[3] + ', em ' + m[4]; }],
    [/^(\s*)File "(.*)", line (\d+)$/, function (m) { return m[1] + 'Arquivo "' + m[2] + '", linha ' + m[3]; }],
    [/MicroPython (\S+) on (\S+); (.*)/, function (m) { return 'MicroPython ' + m[1] + ' (de ' + m[2] + '); ' + m[3]; }],
    [/Type "help\(\)" for more information\./, 'Digite "help()" para ver a ajuda.'],
    [/MPY: soft reboot/, 'MPY: reiniciando o MicroPython (o robô não desliga)'],
    [/raw REPL; CTRL-B to exit/, 'REPL bruto; CTRL-B para sair'],
    [/paste mode; Ctrl-C to cancel, Ctrl-D to finish/, 'modo colar; Ctrl-C cancela, Ctrl-D termina'],
    [/Brownout detector was triggered/, 'A energia ficou fraca e o robô reiniciou (confira as pilhas ou o cabo USB)'],
    [/KeyboardInterrupt:?/, 'Programa parado (KeyboardInterrupt)'],
    [/NameError: name '(.*)' isn't defined/, function (m) { return "NameError: o nome '" + m[1] + "' não existe (escrito certo? criado antes?)"; }],
    [/SyntaxError: invalid syntax/, 'SyntaxError: o Python não entendeu esta linha (sintaxe inválida)'],
    [/SyntaxError: (.*)/, function (m) { return 'SyntaxError: erro de escrita no código (' + m[1] + ')'; }],
    [/IndentationError: unexpected indent/, 'IndentationError: espaços a mais no começo da linha (recuo inesperado)'],
    [/IndentationError: unindent doesn't match any outer indentation level/, 'IndentationError: os espaços no começo da linha não combinam com os de cima'],
    [/IndentationError: expected an indented block/, 'IndentationError: faltou recuo (espaços) depois dos dois pontos'],
    [/IndentationError: (.*)/, function (m) { return 'IndentationError: espaços no começo da linha estão errados (' + m[1] + ')'; }],
    [/TypeError: unsupported types for (\w+): '(\w+)', '(\w+)'/, function (m) { return 'TypeError: não dá para ' + (OPS[m[1]] || 'fazer a conta com') + ' ' + ty(m[2]) + ' e ' + ty(m[3]); }],
    [/TypeError: can't convert '(\w+)' object to (\w+) implicitly/, function (m) { return "TypeError: não dá para virar " + m[2] + " um valor do tipo " + ty(m[1]); }],
    [/TypeError: object '(\w+)' isn't callable/, function (m) { return "TypeError: '" + m[1] + "' não é uma função, então não dá para usar com ( )"; }],
    [/TypeError: function takes (\d+) positional arguments? but (\d+) (?:were|was) given/, function (m) { return 'TypeError: a função pede ' + m[1] + ' valor(es), mas foram dados ' + m[2]; }],
    [/TypeError: (.*)/, function (m) { return 'TypeError: tipo de valor incorreto (' + m[1] + ')'; }],
    [/ZeroDivisionError: (?:divide by zero|division by zero)/, 'ZeroDivisionError: não dá para dividir por zero'],
    [/ValueError: Pin\((\d+)\) doesn't exist/, function (m) { return 'ValueError: o pino ' + m[1] + ' não existe nesta placa'; }],
    [/ValueError: invalid pin/, 'ValueError: pino inválido'],
    [/ValueError: (.*)/, function (m) { return 'ValueError: valor não aceito (' + m[1] + ')'; }],
    [/IndexError: (?:list )?index out of range/, 'IndexError: essa posição não existe na lista'],
    [/KeyError: (.*)/, function (m) { return 'KeyError: a chave ' + m[1] + ' não foi encontrada'; }],
    [/AttributeError: '(\w+)' object has no attribute '(\w+)'/, function (m) { return "AttributeError: o objeto '" + m[1] + "' não tem '" + m[2] + "'"; }],
    [/AttributeError: (.*)/, function (m) { return 'AttributeError: ' + m[1] + ' (esse item não existe)'; }],
    [/ImportError: no module named '(.*)'/, function (m) { return "ImportError: não achei o módulo '" + m[1] + "' (talvez falte instalar a biblioteca)"; }],
    [/MemoryError: memory allocation failed, allocating (\d+) bytes/, function (m) { return 'MemoryError: faltou memória (o programa precisava de mais ' + m[1] + ' bytes)'; }],
    [/MemoryError(.*)/, function (m) { return 'MemoryError: faltou memória' + m[1]; }],
    [/RuntimeError: (.*)/, function (m) { return 'RuntimeError: erro durante a execução (' + m[1] + ')'; }],
    [/AssertionError(.*)/, function (m) { return 'AssertionError: uma verificação do programa falhou' + m[1]; }],
    [/OSError: \[Errno (\d+)\] (E[A-Z0-9]+)/, function (m) { return 'OSError: ' + (ERRNO[m[2]] || m[2]) + ' (' + m[2] + ', Errno ' + m[1] + ')'; }],
    [/OSError: (Wifi .*|Wi-Fi .*)/, function (m) { return 'OSError: problema no Wi-Fi (' + m[1] + ')'; }],
    [/OSError: (.*)/, function (m) { return 'OSError: erro de comunicação ou de arquivo (' + m[1] + ')'; }]
  ];

  function trLine(line) {
    var cr = /\r$/.test(line) ? '\r' : ''; if (cr) line = line.slice(0, -1);   // o terminal manda \r\n: o "." do regex não casa com \r
    return trOne(line) + cr;
  }
  var PROMPT = /^(\x1b\[[0-9;]*m)*(>>>|\.\.\.) /;
  function trOne(line) {
    // Linha que começa com o prompt (>>> ou ...) é o eco do que a pessoa digitou: o código dela não pode ser alterado.
    // Só passam o reinício e a interrupção, que o robô escreve logo depois do prompt.
    if (PROMPT.test(line) && !/(>>>|\.\.\.) (MPY: soft reboot|KeyboardInterrupt|Traceback)/.test(line)) return line;
    for (var i = 0; i < RULES.length; i++) {
      var r = RULES[i], m = r[0].exec(line);
      if (!m) continue;
      var out = typeof r[1] === 'function' ? r[1](m) : r[1];
      // as regras sem âncora (^) trocam só o trecho reconhecido: o que vem antes (códigos de cor) e depois fica
      return /^\/\^/.test(String(r[0])) ? out : line.slice(0, m.index) + out + line.slice(m.index + m[0].length);
    }
    return line;
  }
  function trText(s) { return s.split('\n').map(trLine).join('\n'); }

  // Dados chegam em pedaços: uma linha pode vir cortada ("Trace" + "back..."). A ponta sem quebra de linha que parece começo de
  // mensagem conhecida espera até 150 ms pelo resto; o prompt ">>> " não casa e aparece na hora.
  var KEYS = ['Traceback', 'File "', 'MicroPython', 'Type "help', 'MPY:', 'raw REPL', 'paste mode', 'Brownout', 'KeyboardInterrupt'];
  function looksPartial(rest) {
    var t = rest.replace(/\x1b\[[0-9;]*m/g, '').replace(/^\s+/, '');
    if (!t || t.length > 90) return false;
    for (var i = 0; i < KEYS.length; i++) if (KEYS[i].indexOf(t) === 0 || t.indexOf(KEYS[i]) === 0) return true;
    return /^[A-Z][A-Za-z]*(Error|Exception)?:?[^\n]*$/.test(t) && /^[A-Z]/.test(t) && !/^>>>/.test(t);
  }
  var tail = '', timer = 0, sink = null;
  function flush() { clearTimeout(timer); timer = 0; if (tail && sink) { var t = tail; tail = ''; sink(trText(t)); } tail = ''; }
  function translate(chunk) {
    var s = tail + chunk; tail = ''; clearTimeout(timer); timer = 0;
    var i = s.lastIndexOf('\n'), done = s.slice(0, i + 1), rest = s.slice(i + 1);
    if (rest && looksPartial(rest)) { tail = rest; timer = setTimeout(flush, 150); } else done += rest;
    return trText(done);
  }

  // Interruptor "traduzir": desligado, o console mostra exatamente o que o robô enviou (útil para pesquisar o erro em inglês)
  var KEY = 'sancabot_console_pt', enabled = true;
  try { enabled = localStorage.getItem(KEY) !== '0'; } catch (e) { /* ok */ }
  function buildSwitch() {
    var host = document.getElementById('content_console'); if (!host || host.querySelector('.sb-conpt')) return !!host;
    var lab = document.createElement('label'); lab.className = 'sb-conpt';
    lab.title = 'Ligado: avisos e erros do robô aparecem em português. Desligado: aparecem como o robô envia (em inglês). O que você digita nunca muda.';
    lab.innerHTML = '<input type="checkbox"><span class="sb-conpt-track"></span><span>Mensagens do robô em português</span>';
    var cb = lab.querySelector('input'); cb.checked = enabled;
    cb.addEventListener('change', function () { enabled = cb.checked; try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) { /* ok */ } });
    var tips = document.getElementById('tipsGeneric'); if (tips && tips.parentNode) tips.parentNode.insertBefore(lab, tips.nextSibling); else host.insertBefore(lab, host.firstChild);
    return true;
  }
  var swTries = 0, swT = setInterval(function () { if (buildSwitch() || ++swTries > 60) clearInterval(swT); }, 200);

  function install() {
    if (typeof term === 'undefined' || typeof terminal === 'undefined' || term.__sbPt) return !!(typeof term !== 'undefined' && term.__sbPt);
    var orig = term.write;
    sink = function (t) { orig.call(term, t); };
    term.write = function (data) {
      if (typeof data !== 'string') return orig.call(term, data);
      var out = enabled ? translate(data) : (flush(), data);
      if (out !== '') orig.call(term, out);
    };
    term.__sbPt = true;
    return true;
  }
  window.sancabotConsolePt = { translate: trText, install: install, enabled: function () { return enabled; } };
  if (!install()) { var n = 0, t = setInterval(function () { if (install() || ++n > 60) clearInterval(t); }, 100); }
})();
