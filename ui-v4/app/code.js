/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4 (F2): APLICAÇÃO DO EDITOR. Substitui core/code.js do BIPES (que vinha do demo "Code" do Blockly).
   Faz: carregar os textos do idioma, criar o Blockly, trocar de tela (e dividir a tela), recarregar a caixa de blocos e gerar o código.
   O contrato com o resto do código continua o mesmo nome (objeto global `Code`); ver docs/projeto/MIGRACAO-V4.md.
   Saiu em relação ao BIPES: menu de troca de idioma (o SancaBot é em português; ?lang=en ainda funciona), troca de idioma com blocos
   guardados na sessão, e o realce de código por um script de CDN externo (nada usava). */
'use strict';

var Code = {};

/** Idiomas que têm arquivo de textos em msg/ e core/blockly13/msg/. O padrão é pt-br. */
Code.LANGUAGE_NAME = { 'en': 'English', 'pt-br': 'Português Brasileiro', 'es': 'Español', 'it': 'Italiano', 'fr': 'Français', 'de': 'Deutsch', 'zh-hans': 'Chinese (simplified)', 'zh-hant': 'Chinese (traditional)' };
Code.LANGUAGE_RTL = ['ar', 'fa', 'he', 'lki'];

/** Área de blocos do Blockly (criada em Code.init). @type {Blockly.WorkspaceSvg} */
Code.workspace = null;

Code.getStringParamFromUrl = function (name, defaultValue) {
  const val = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
  return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};
Code.getLang = function () {
  const lang = Code.getStringParamFromUrl('lang', '');
  return Code.LANGUAGE_NAME[lang] === undefined ? 'pt-br' : lang;   // padrão do SancaBot: português do Brasil
};
Code.isRtl = function () { return Code.LANGUAGE_RTL.indexOf(Code.LANG) !== -1; };
Code.LANG = Code.getLang();

/** (compatibilidade) liga um clique a um botão. */
Code.bindClick = function (el, func) {
  if (typeof el === 'string') el = document.getElementById(el);
  el.addEventListener('click', func, true);
};

/* ====================== Telas (abas) e tela dividida ======================
   Estado: Code.current = [tela inteira, esquerda, direita]. Clique esquerdo numa aba mostra a tela inteira (ou a metade esquerda);
   clique direito abre a tela na metade direita. As classes de CSS (ani/on/pos1/pos2/_pos1/_pos2) estão em app/base.css. */
Code.TABS_ = ['blocks', 'console', 'files', 'device', 'programs', 'databoard', 'mqtt', 'iot'];
Code.current = ['blocks', '', ''];

Code.handleLink = (navigation, pos) => {
  const other = pos === 2 ? 1 : 2, crt = Code.current;

  const turnOff = (elem, p) => {
    const tab = get(`#content_${elem}`), nav = get(`#tab_${elem}`);
    Code.deinitContent(elem);
    nav.classList.remove('on');
    if (p === 1) tab.classList.add('_pos1');    // evita um tranco na animação
    if (p === 2) tab.classList.add('_pos2');
    tab.classList.remove(`pos${p}`);
    Animate.off(tab);
  };
  const turnOn = (elem, p) => {
    const tab = get(`#content_${elem}`), nav = get(`#tab_${elem}`);
    Code.renderContent(elem);
    nav.classList.add('on');
    Animate.on(tab);
    tab.classList.remove('_pos1', '_pos2');
    if (p !== 0) tab.classList.add(`pos${p}`);
  };
  const clearHalf = (elem, p) => get(`#content_${elem}`).classList.remove(`pos${p}`);

  // clique numa aba para ocupar a tela toda
  if (pos === 0) { turnOn(navigation, 0); Code.current = [navigation, '', '']; return; }

  // a aba já está do outro lado: troca os lados
  if (crt[other] === navigation) {
    const tab = get(`#content_${crt[pos]}`), tab0 = get(`#content_${crt[other]}`);
    tab.classList.remove(`pos${pos}`); tab.classList.add(`pos${other}`);
    tab0.classList.remove(`pos${other}`); tab0.classList.add(`pos${pos}`);
    Code.current = ['', crt[2], crt[1]];
    return;
  }
  // clique na aba que já ocupa a tela toda
  if (crt[0] === navigation && crt[1] === '' && crt[2] === '') return;

  // clique esquerdo numa aba nova enquanto outra ocupa a tela toda: troca a tela
  if (pos === 1 && crt[0] !== '') {
    turnOff(crt[0], 0); crt[0] = navigation; turnOn(crt[0], 0); Code.resizeContent(); return;
  }
  // duas metades abertas, clique esquerdo numa delas: ela passa a ocupar a tela toda
  if (pos === 1 && crt[pos] === navigation && crt[other] !== '') {
    turnOff(crt[other], other); clearHalf(crt[pos], pos);
    Code.current = [navigation, '', '']; Code.resizeContent(); return;
  }
  // duas metades abertas, clique direito numa delas: fecha essa metade
  if (pos === 2 && crt[pos] === navigation && crt[other] !== '') {
    turnOff(crt[pos], pos); clearHalf(crt[other], other);
    Code.current = [crt[other], '', '']; Code.resizeContent(); return;
  }
  // aba nova numa metade livre
  if (crt[pos] !== navigation && crt[0] === '') {
    if (crt[pos] !== '') turnOff(crt[pos], pos);
    turnOn(navigation, pos); Code.current[pos] = navigation; Code.resizeContent(); return;
  }
  // clique direito numa aba nova enquanto outra ocupa a tela toda: divide a tela
  if (pos === 2 && crt[pos] !== navigation && crt[0] !== '') {
    get(`#content_${crt[0]}`).classList.add('pos1');
    turnOn(navigation, 2); Code.current = ['', crt[0], navigation]; Code.resizeContent();
  }
};

/** Prepara uma tela quando ela aparece. */
Code.renderContent = (navigation) => {
  if (typeof navigation === 'undefined') return;
  const content = get(`#content_${navigation}`);
  switch (navigation) {
    case 'databoard':   // o canvas do chart.js só inicia com a tela visível: espera 10 ms
      setTimeout(() => {
        const f = window.frames[3];
        if (!f.inited) {
          if (typeof f.modules === 'object' && typeof f.modules.Workspaces === 'object') f.initDataStorage();
          else {
            const iv = setInterval(() => {
              if (typeof f.modules === 'object' && typeof f.modules.Workspaces === 'object') { f.initDataStorage(); if (f.inited) clearInterval(iv); }
            }, 500);
          }
        } else f.initGrid();
      }, 10);
      break;
    case 'blocks':
      Code.workspace.setVisible(true); Code.auto_mode = true; Blockly.svgResize(Code.workspace);
      break;
    case 'files':
      if (Files.editor.init === undefined) {   // sem isso os números de linha não aparecem com menos de 10 linhas
        Files.editor.setValue(new Array(9).fill('\r\n').join(''));
        setTimeout(() => { Files.editor.setValue(''); Files.editor.init = true; }, 10);
      }
      Files.handleCurrentProject();
      break;
    case 'console':
      term.resize();
      break;
  }
  content.focus();
};

/** Reajusta as telas abertas (depois de dividir ou de mudar o tamanho). */
Code.resizeContent = () => {
  Code.current.forEach(key => {
    if (key === 'blocks') setTimeout(() => Blockly.svgResize(Code.workspace), 250);
    else if (key === 'files') Files.resize();
    else if (key === 'console') term.resize();
  });
};

/** Desliga o que a tela usa enquanto está escondida. */
Code.deinitContent = (navigation) => {
  if (navigation === 'databoard') { if (window.frames[3].grid_inited) window.frames[3].deinitGrid(); }
  else if (navigation === 'blocks') { Code.workspace.setVisible(false); Code.auto_mode = false; }
};

/* ====================== Caixa de blocos, código e XML ====================== */
/** Troca a caixa de blocos (toolbox) pela de um dispositivo. Os {textos} do XML vêm do dicionário MSG. */
Code.reloadToolbox = function (XML_) {
  const text = new XMLSerializer().serializeToString(XML_).replace(/(^|[^%]){(\w+)}/g, (m, p1, p2) => p1 + MSG[p2]);
  Code.workspace.updateToolbox(Blockly.Xml.textToDom(text));
  Code.workspace.scrollCenter();
};

/** Avisa se algum bloco da área não tem gerador de código. */
Code.checkAllGeneratorFunctionsDefined = function (generator) {
  const missing = [];
  Code.workspace.getAllBlocks().forEach(b => {
    if (!(generator.forBlock && generator.forBlock[b.type]) && !generator[b.type] && missing.indexOf(b.type) === -1) missing.push(b.type);
  });
  if (missing.length) Blockly.alert('The generator code for the following blocks not specified for ' + generator.name_ + ':\n - ' + missing.join('\n - '));
  return missing.length === 0;
};

/** Gera o código. Se `auto_mode` está ligado (chamado pelo cronômetro), ou se foi chamado de propósito, gera; senão devolve nada. */
Code.auto_mode = false;
Code.generateCode = function (generator = Blockly.Python) {
  if (Code.auto_mode || this.constructor.name !== 'Window') {
    if (Code.checkAllGeneratorFunctionsDefined(generator)) return generator.workspaceToCode(Code.workspace);
    Code.auto_mode = false;   // um bloco sem gerador: para de gerar sozinho
  }
};

/** Gera o XML dos blocos, com as informações extras do BIPES (dispositivo, hora). */
Code.generateXML = function (workspace = Code.workspace) {
  return UI['workspace'].writeWorkspace(Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(workspace)), true);
};

/** Apaga todos os blocos (pede confirmação se houver mais de um). */
Code.discard = function () {
  const count = Code.workspace.getAllBlocks().length;
  if (count < 2 || window.confirm(Blockly.Msg['DELETE_ALL_BLOCKS'].replace('%1', count))) {
    Code.workspace.clear();
    if (window.location.hash) window.location.hash = '';
  }
};

/** Carrega os blocos do último projeto, depois que a lista de dispositivos chegou. */
Code.loadBlocks = function (defaultXml) {
  const iv = setInterval(() => {
    if (typeof UI === 'undefined' || UI['workspace'].devices.constructor.name !== 'Object') return;
    clearInterval(iv);
    if (defaultXml) {
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(defaultXml), Code.workspace);
    } else if ('BlocklyStorage' in window) {
      setTimeout(() => { BlocklyStorage.restoreBlocks(); UI['account'].openLastEdited(); }, 0);   // fora desta pilha: uma falha ao abrir não trava o resto
    }
  }, 500);
};

/* ====================== Iniciar ====================== */
Code.init = function () {
  Code.initLanguage();

  // Os nomes das categorias na caixa de blocos usam chaves do Blockly (%{BKY_CATLOGIC}): copia do dicionário MSG para Blockly.Msg.
  for (const key in MSG) if (key.indexOf('cat') === 0) Blockly.Msg[key.toUpperCase()] = MSG[key];

  setInterval(Code.generateCode, 250);   // gera o Python sozinho, a cada 250 ms (enquanto a tela Blocos está aberta)
  Code.auto_mode = true;

  Code.workspace = Blockly.inject('content_blocks', {
    grid: { spacing: 25, length: 3, colour: '#cfd7f0', snap: true },
    media: 'core/blockly13/media/',
    renderer: window.SancaBotRenderer || 'geras',
    theme: window.SancaBotTheme || undefined,
    rtl: Code.isRtl(),
    toolbox: Blockly.Xml.textToDom("<xml><category name='...'></category></xml>"),   // vazia: a caixa do dispositivo entra depois (workspace.change)
    oneBasedIndex: false,
    zoom: { controls: true, wheel: true }
  });

  Code.loadBlocks('');

  if ('BlocklyStorage' in window) {   // guarda o projeto enquanto edita e ao sair
    BlocklyStorage.enableAutosave(Code.workspace);
    BlocklyStorage.backupOnUnload(Code.workspace);
  }

  // Tela inicial: a lembrada (html[data-aba], ver index.html) ou Blocos. Para as outras o CSS já a mostra; aqui só o estado é acertado,
  // sem animação, e a preparação da tela (terminal, editor de arquivos) é feita em app/iniciar.js, quando esses objetos já existem.
  var inicial = document.documentElement.getAttribute('data-aba');
  if (inicial) {
    Code.current = [inicial, '', ''];
    document.getElementById('content_' + inicial).classList.add('ani', 'on');
    document.getElementById('tab_' + inicial).classList.add('on');
    Code.workspace.setVisible(false); Code.auto_mode = false;   // os Blocos estão escondidos
  } else Code.handleLink(Code.current[0], 0);

  Code.bindClick('forumButton', () => window.open('https://github.com/BIPES/BIPES/discussions', '_blank'));

  if ('BlocklyStorage' in window) BlocklyStorage['XML_ERROR'] = MSG['xmlError'];
  // O botão "Gerar link do projeto" (#linkButton) é da Galeria: core/sancabot_gallery.js

  // clique esquerdo e direito nas abas
  Code.TABS_.forEach(name => {
    const tab = get(`#tab_${name}`);
    tab.addEventListener('click', ev => { ev.preventDefault(); Code.handleLink(name, 1); });
    tab.addEventListener('contextmenu', ev => { ev.preventDefault(); Code.handleLink(name, 2); });
  });
  Blockly.svgResize(Code.workspace);

  Code.registerToolboxButtons();
};

/** Textos fixos da página, vindos do dicionário MSG do idioma. */
Code.initLanguage = function () {
  document.dir = Code.isRtl() ? 'rtl' : 'ltr';
  document.head.parentElement.setAttribute('lang', Code.LANG);
  const set = (id, prop, key) => { const e = document.getElementById(id); if (e) e[prop] = MSG[key]; };
  set('tab_blocks', 'textContent', 'blocks'); set('tab_files', 'textContent', 'files'); set('tab_programs', 'textContent', 'shared'); set('tab_device', 'textContent', 'device');
  set('linkButton', 'title', 'linkTooltip'); set('runButton', 'title', 'runTooltip'); set('saveButton', 'title', 'saveTooltip'); set('loadButton', 'title', 'loadTooltip');
  set('notificationButton', 'title', 'notificationTooltip'); set('toolbarButton', 'title', 'toolbarTooltip'); set('forumButton', 'title', 'forumTooltip'); set('accountButton', 'title', 'accountTooltip');
};

/* ====================== Botões dentro da caixa de blocos (bibliotecas e exemplos do BIPES) ====================== */
/** "Instalar biblioteca X" baixa um arquivo .py da internet e grava no robô conectado. */
Code.registerToolboxButtons = function () {
  Code.workspace.registerButtonCallback('installPyLib', function (button) {
    const parts = button.text_.split(' '), lib = /^Instalar$/i.test(parts[0]) ? parts[2] : parts[1];   // "Install X library" ou "Instalar biblioteca X"
    alert('Isto vai baixar e instalar a biblioteca ' + lib + ' no robô conectado. É preciso ter internet. O resultado da instalação aparece na aba Console.');
    UI['notify'].send('Instalando a biblioteca. Acompanhe pela aba Console.');

    Tool.runPython(`
def bipesInstall(url, lib):
    import socket
    _, _, host, path = url.split('/', 3)
    addr = socket.getaddrinfo(host, 80)[0][-1]
    s = socket.socket()
    s.connect(addr)
    print('Downloading from ' + url)
    s.send(bytes('GET /%s HTTP/1.0\\r\\nHost: %s\\r\\n\\r\\n' % (path, host), 'utf8'))
    f = open('tmplib.py', 'w')
    while True:
        data = s.recv(100)
        if data:
            f.write(data)
        else:
            break
    s.close()
    f.close()
    print('Download done')

lib = '${lib}.py'\r` + `bipesInstall('http://bipes.net.br/beta2/ui/pylibs/' + lib, lib)`);

    Tool.runPython(`
f=open("tmplib.py", "r")
c=open("${lib}.py", "w")
lineC=0
for line in f:
	lineC=lineC+1
	#Jump 10 lines to skip HTTP header
	if lineC >= 10:
		r=c.write(line)
		print('.', end='')
f.close()
c.close()
print('Install done.')
`);
  });

  /** "Carregar exemplo: X" troca os blocos pelos de um exemplo do BIPES. */
  Code.workspace.registerButtonCallback('loadExample', function (button) {
    const lib = button.text_.split(':')[1].replace(/\s/g, '');
    if (confirm('Isto vai carregar o exemplo: ' + lib + '. É preciso ter internet. Atenção: todos os blocos que estão na tela serão trocados pelos blocos do exemplo. Quer continuar?')) {
      Code.workspace.clear(); Code.renderContent(); loadExampleFromURL(lib); Code.renderContent();
    }
  });

  /** "Documentação: X" abre o documento do BIPES sobre a biblioteca. */
  Code.workspace.registerButtonCallback('loadDoc', function (button) {
    const lib = button.text_.split(':')[1].replace(/\s/g, '');
    let url = Code.getLang() === 'pt-br'
      ? 'https://docs.google.com/document/d/e/2PACX-1vT7dc6hP4sKyMJupklbGK4adIf3qCkt4r-HrEWO8jTRMx9uUOUSfboKG749IF3DZr8k6zUPSLXkrDGY/pub'
      : 'https://docs.google.com/document/d/e/2PACX-1vSk-9T56hP9K9EOhkF5SoNzsYl4TzDk-GEDnMssaFP_m-LEfI6IU-uRkkLP_HoONK0QmMrZVo_f27Fw/pub';
    const ANCHORS = { mpu6050: '#h.79fbsr8dha21', tm1640: '#h.iw35vui9vzi1', ds1820: '#h.w84555jgod5j', mfrc522: '#h.owhbali4ayaj' };
    if (ANCHORS[lib]) url += ANCHORS[lib];
    const win = window.open(url, '_blank'); if (win) win.focus();
  });
};

/** Busca um exemplo (.xml) do servidor do BIPES e coloca os blocos na área. */
function loadExampleFromURL(name) {
  const request = new XMLHttpRequest();
  request.open('GET', '/beta2/ui/examples/' + name + '.xml', true);
  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200)
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(request.responseText), Code.workspace);
  };
  request.send(null);
}

/* ====================== Textos dos idiomas ======================
   Precisam entrar no momento em que este arquivo é lido (antes de Code.init). Os textos novos do Blockly 13 vêm de core/blockly13/msg;
   os do Blockly 6 antigo (b.msg/js) só completam o que o BIPES ainda usa. Onde existir nos dois, vale o novo. */
document.write('<script src="msg/' + Code.LANG + '.js"></script>\n');
document.write('<script src="core/blockly13/msg/' + Code.LANG + '.js"></script>\n');
document.write('<script>window.__sancabotMsgNew = Object.assign({}, Blockly.Msg);</script>\n');
document.write('<script src="b.msg/js/' + Code.LANG + '.js"></script>\n');
document.write('<script>Object.assign(Blockly.Msg, window.__sancabotMsgNew); delete window.__sancabotMsgNew;</script>\n');
