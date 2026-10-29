/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4 (F2): INTERFACE da aplicação. Substitui core/ui.js do BIPES.
   Classes: Panel (painel que abre e fecha), Account (perfil e projetos), ChannelPanel (diálogo Conectar), Notify (avisos),
   Responsive (zona de clique fora dos painéis), Progress (barra fina), Workspace (dispositivo, rodar, salvar e abrir projeto).
   O resto do código (channel.js, utils.js, storage.js, sancabot_*) fala com elas pelo objeto global `UI`, montado em index.html:
   UI['account'], UI['notify'], UI['workspace'], UI['responsive'], UI['progress'] ... Os nomes de métodos usados por fora foram mantidos
   (ver docs/projeto/MIGRACAO-V4.md, "contrato"). Mudou: nomes das classes em PascalCase; o aviso de tela pequena usa matchMedia. */
'use strict';

/* Atalhos de DOM usados em todo o projeto */
function get(e) { return document.querySelector(e); }
function getIn(a, b) { return a.querySelector(b); }
function getAll(e, f) { return get(e).querySelectorAll(f); }
function style(e) { return get(e).style; }
function fx(e, vfx) { e.style.Transition = vfx; }

/** Tamanho de 1em em pixels: utils.js (terminal e editor de arquivos) calcula larguras com ele. */
var $em = 16;

const MOBILE_QUERY = '(max-width: 59.99em)';   // abaixo disso as ferramentas do cabeçalho viram menu (antes: 60 × 16 px)
const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

/** Busca um arquivo (JSON, texto ou XML). Na versão offline, os dados vêm de dentro do próprio index. */
async function xhrGET(filename, responsetype, onsuccess, onfail) {
  if (!Channel['mux'].isLocalFile) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${filename}`);
    xhr.responseType = responsetype;
    xhr.onload = function () {
      if (this.status === 200) {
        if (responsetype === 'text' || responsetype === '') onsuccess(this.responseText);
        else if (responsetype === 'document') onsuccess(this.responseXML);
        else onsuccess(this.response);
      } else if (onfail !== undefined) onfail();
      else UI['notify'].send(MSG['ErrorGET']);
    };
    xhr.send();
    return;
  }
  filename = filename.replace(/[\/\.]/g, '_');
  if (/_(.*)_json/.test(filename)) {
    window.addEventListener('load', () => onsuccess(JSON.parse(eval(`OFFLINE_${filename}`))), false);
  } else if (/_(.*)_xml/.test(filename)) {
    let xml = get(`#OFFLINE_${filename}`);
    if (xml === null) { xml = get('#OFFLINE_toolbox_default_xml'); UI['notify'].send(MSG['noToolbox']); }
    onsuccess(xml);
  } else alert(`Não encontrei o arquivo ${filename}. Abra a página por um servidor (não direto do arquivo) ou use a versão online.`);
}

/* ====================== Painéis ====================== */
/** Painel ligado a um botão: clicar mostra (id="show") ou esconde. O estado fica em UI['responsive'].panels. */
class Panel {
  constructor(button, panel) {
    this.panel_ = panel;
    this.button = get(button);
    this.panel = get(panel);
    this.button.onclick = () => this.showPanel();
  }
  showPanel() {
    const state = UI['responsive'].panels[this.panel_];
    UI['responsive'].closeZone._dom.classList.add('on');
    if (!state.show) {
      this.panel.id = 'show';
      if (state.from === 'notify-panel') UI['notify'].container.id = '';
    } else this.panel.id = '';
    state.show = !state.show;
    if (this.onOpenPanel_) this.onOpenPanel_();
  }
}

/** Diálogo "Conectar o robô": escolhe Serial, Bluetooth ou Wi-Fi e esconde o diálogo. */
class ChannelPanel extends Panel {
  constructor(button, panel) {
    super(button, panel);
    this.bluetooth = get('#bluetoothButton');
    this.serial = get('#serialButton');
    this.network = get('#networkButton');
    this.hidePanel = (target) => {
      this.panel.id = '';
      this.button.className = `icon ${target}`;
      UI['responsive'].panels[this.panel_].show = false;
    };
    this.button.className = `icon ${Channel['mux'].currentChannel}`;
    this.bluetooth.onclick = () => { this.hidePanel('webbluetooth'); Channel['mux'].switch('webbluetooth'); };
    this.serial.onclick = () => { this.hidePanel('webserial'); Channel['mux'].switch('webserial'); };
    this.network.onclick = () => { this.hidePanel('websocket'); Channel['mux'].switch('websocket'); };
  }
}

/** Perfil (apelido) e lista de projetos. Os projetos ficam no localStorage: `bipes_projects` = { uid: hora } e uma chave por projeto com o XML. */
class Account extends Panel {
  constructor(button, panel) {
    super(button, panel);
    this.projectList = get('#ProjectList');
    this.newProjectButton = get('#newProjectButton');
    this.dom_username = get('#account_user');
    this.dom_username.addEventListener('input', () => localStorage.setItem('account_user', this.dom_username.innerText));
    this.newProjectButton.onclick = () => this.newProject();
    this.currentProject = { uid: '', xml: '' };
    this.projects = {};

    if (localStorage['account_user'] === 'User') localStorage.removeItem('account_user');   // 'User' era o padrão em inglês
    if (localStorage['account_user']) this.dom_username.innerText = localStorage['account_user'];
    else localStorage.setItem('account_user', (window.SancaBotConfig && SancaBotConfig.defaults && SancaBotConfig.defaults.author) || 'Aluno');
  }

  /** Lista os projetos guardados; esquece os da lista que não têm mais o XML. */
  restoreProjects(projects) {
    this.projects = projects;
    for (const uid in this.projects) {
      if (localStorage[uid]) this.listProject(uid, this.projects[uid]);
      else delete this.projects[uid];
    }
  }

  /** Abre o projeto editado por último. */
  openLastEdited() {
    this.currentProject.uid = Object.keys(this.projects).reduce((a, b) => (this.projects[a] > this.projects[b] ? a : b));
    this.currentProject.xml = localStorage[this.currentProject.uid];
    this.mark(this.currentProject.uid);
    const xml = UI['workspace'].readWorkspace(this.currentProject.xml, false);
    Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), Blockly.getMainWorkspace());
  }

  /** Marca o projeto aberto na lista (classe "current"). */
  mark(uid) { const row = getIn(this.projectList, `#${uid}`); if (row) row.className = 'current'; }
  unmarkCurrent() {
    if (this.currentProject.uid === '') return;
    BlocklyStorage.backupBlocks_();
    try { getIn(this.projectList, `#${this.currentProject.uid}`).className = ''; } catch (e) { /* ok */ }
  }

  /** Acrescenta uma linha na lista de projetos. */
  listProject(uid, timestamp) {
    const name = this.getProjectName_(uid), when = Tool.unix2date(timestamp);
    const short = name.length > 30 ? `${name.substring(0, 27)}...` : name;
    const row = new DOM('div', { id: uid });
    const open = new DOM('div', { innerText: short, className: 'runText', title: `Abrir o projeto ${name}, criado às ${when}` }).onclick(this, this.openProject, [uid]);
    const ren = new DOM('span', { className: 'icon', id: 'renameIcon', title: `Mudar o nome do projeto ${name}` }).onclick(this, this.editName, [uid]);
    const del = new DOM('span', { className: 'icon', id: 'trashIcon', title: `Apagar o projeto ${name}` }).onclick(this, this.deleteProject, [uid]);
    const dl = new DOM('span', { className: 'icon', id: 'downloadIcon', title: `Baixar o projeto ${name}` }).onclick(this, UI['workspace'].saveXML, [uid]);
    open._dom.addEventListener('dblclick', (ev) => { ev.preventDefault(); this.editName(uid); });   // duplo clique no nome também edita
    row.append([open, new DOM('div').append([ren, dl, del])]);
    this.projectList.append(row._dom);
  }

  /** Guarda o projeto aberto e abre outro. */
  openProject(uid) {
    this.unmarkCurrent();
    const xml = localStorage[uid];
    this.currentProject.uid = uid;
    this.currentProject.xml = xml;
    this.mark(uid);
    this.projects[uid] = +new Date();
    BlocklyStorage.loadXml_(xml, Blockly.getMainWorkspace());
    Files.handleCurrentProject();
  }

  deleteProject(uid) {
    localStorage.removeItem(uid); localStorage.removeItem('bipes_nome_' + uid);
    delete this.projects[uid];
    localStorage.setItem('bipes_projects', JSON.stringify(this.projects));
    getIn(this.projectList, `#${uid}`).remove();
    if (this.currentProject.uid === uid) {
      this.currentProject.uid = '';
      this.currentProject.xml = '';
      if (Object.keys(this.projects).length === 0) this.newProject();
      else this.openProject(Object.keys(this.projects).reduce((a, b) => (this.projects[a] > this.projects[b] ? a : b)));
    }
  }

  /** Nome do projeto, lido do XML guardado. */
  getProjectName_(uid) {
    if (localStorage['bipes_nome_' + uid]) return localStorage['bipes_nome_' + uid];   // nome escolhido pelo aluno (editar nome)
    const xml = localStorage[uid], block = /<value name="project_description">.*?<\/value>/;
    if (!block.test(xml)) return 'Meu projeto';
    return xml.match(block)[0].match(/<field name="TEXT">(.*?)<\/field>/)[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  }

  /** Cria e abre um projeto novo (vazio). */
  newProject() { this.addProject_(Tool.emptyXML()); }
  /** Guarda um projeto vindo de fora (XML) e abre. */
  importProject(xml) { this.addProject_(xml); }
  addProject_(xml) {
    this.unmarkCurrent();
    const uid = Tool.uid();
    this.projects[uid] = +new Date();
    localStorage.setItem('bipes_projects', JSON.stringify(this.projects));
    localStorage.setItem(uid, xml);
    this.currentProject.uid = uid;
    this.currentProject.xml = xml;
    this.listProject(uid, this.projects[uid]);
    BlocklyStorage.loadXml_(xml, Blockly.getMainWorkspace());
    this.mark(uid);
  }

  /** Troca o nome na linha por um campo de texto: Enter ou sair do campo grava, Esc cancela. */
  editName(uid) {
    const row = getIn(this.projectList, `#${uid}`), texto = row && getIn(row, '.runText');
    if (!texto || getIn(row, 'input.sb-rename')) return;
    const atual = this.getProjectName_(uid), campo = document.createElement('input');
    campo.type = 'text'; campo.className = 'sb-rename'; campo.value = atual; campo.maxLength = 40; campo.setAttribute('aria-label', 'Nome do projeto');
    texto.style.display = 'none'; row.insertBefore(campo, texto);
    let feito = false;
    const fechar = (gravar) => {
      if (feito) return; feito = true;
      const novo = campo.value.trim();
      campo.remove(); texto.style.display = '';
      if (gravar && novo && novo !== atual) this.renameProject(uid, novo);
    };
    campo.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') fechar(true); else if (ev.key === 'Escape') fechar(false); ev.stopPropagation(); });
    campo.addEventListener('blur', () => fechar(true));
    campo.addEventListener('click', (ev) => ev.stopPropagation());
    campo.focus(); campo.select();
  }
  /** Grava o novo nome no XML do projeto (bloco "descrição do projeto") e, se for o aberto, no bloco da área de trabalho. */
  renameProject(uid, nome) {
    const esc = nome.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const campo = /(<value name="project_description">[\s\S]*?<field name="TEXT">)[\s\S]*?(<\/field>)/;
    localStorage.setItem('bipes_nome_' + uid, nome);   // vale mesmo se o projeto não tiver o bloco "descrição do projeto" (ex.: veio de um exemplo)
    let xml = localStorage[uid];
    if (campo.test(xml)) { xml = xml.replace(campo, (m, a, b) => a + esc + b); localStorage.setItem(uid, xml); }
    this.projects[uid] = +new Date(); localStorage.setItem('bipes_projects', JSON.stringify(this.projects));
    if (this.currentProject.uid === uid) {
      this.currentProject.xml = xml;
      try {
        const meta = Code.workspace.getBlocksByType('project_metadata')[0], bloco = meta && meta.getInputTargetBlock('project_description');
        if (bloco) bloco.setFieldValue(nome, 'TEXT');
      } catch (e) { UI['notify'].log(e); }
    }
    const short = nome.length > 30 ? `${nome.substring(0, 27)}...` : nome, texto = getIn(getIn(this.projectList, `#${uid}`), '.runText');
    texto.innerText = short; texto.title = `Abrir o projeto ${nome}.`;
    UI['notify'].send(`Projeto renomeado para "${nome}".`);
  }

  /** Mostra na lista o nome que vem do bloco do projeto. */
  setCurrentProjectName_(name) {
    const short = name.length > 30 ? `${name.substring(0, 27)}...` : name;
    const text = getIn(getIn(this.projectList, `#${this.currentProject.uid}`), '.runText');
    text.innerText = short;
    text.title = `Abrir o projeto ${name}.`;
  }
  onOpenPanel_() { this.setCurrentProjectName_(this.getProjectName_(this.currentProject.uid)); }   // antes: nome gerado a partir do código; agora o nome do projeto (editável)
}

/* ====================== Avisos e progresso ====================== */
/** Avisos: o balão no canto (3 s) e o painel com o histórico. */
class Notify {
  constructor() {
    this.panel_ = '.notify-panel';
    this.container = get('.notify');
    this.container.innerHTML = '';
    this.panel = get(this.panel_);
    this.messages = [];   // todos os avisos
    this.logs = [];       // registros técnicos (não aparecem)
    this.buffer_count = 0;
  }
  /** Mostra um aviso (e guarda no histórico). */
  send(message) {
    console.log(`Notification: ${message}`);
    this.messages.push({ timestamp: +new Date, message });
    const this_message = this.messages[this.messages.length - 1];
    const previous = this.messages.length > 1 ? this.messages[this.messages.length - 2].message : undefined;
    const close = document.createElement('span');
    close.classList.add('icon');
    close.id = 'trashIcon';
    const text = `[${Tool.unix2date(this_message.timestamp)}] ${message}`;
    this_message.div = document.createElement('span');
    this_message.div.title = text;
    this_message.div.appendChild(document.createTextNode(text));
    this_message.div.appendChild(close);
    this_message.div.onclick = (ev) => { try { this.panel.removeChild(ev.target.parentNode); } catch (e) { /* ok */ } };   // clicar remove
    this.panel.appendChild(this_message.div);

    if (!UI['responsive'].panels[this.panel_].show) {   // com o painel fechado, mostra o balão
      if (previous === message && this.container.id === 'show') {
        this.buffer_count += 1;
        this.container.innerHTML = `(${this.buffer_count}x) ${text}`;
      } else {
        this.container.innerHTML = this.container.innerHTML === '' ? text : `${text}<hr>${this.container.innerHTML}`;
        this.buffer_count = 0;
      }
      this.container.id = 'show';
      window.clearTimeout(this.timeOut);
      this.timeOut = setTimeout(() => {
        this.container.id = '';
        this.buffer_count = 0;
        this.timeOut2 = setTimeout(() => { this.container.innerHTML = ''; }, 150);
      }, 3000);
    }
  }
  /** Só registra (não aparece para o aluno). */
  log(message) { this.logs.push({ timestamp: +new Date, message }); }
}

/** Barra fina de progresso sob o cabeçalho. */
class Progress {
  constructor() {
    this.dom = get('.progress-bar');
    this.div = document.createElement('div');
    this.dom.appendChild(this.div);
  }
  load(loaded, total) { this.div.style.width = (loaded * 100 / total) + '%'; }
  remain(len) { this.div.style.width = ((this.len - len) * 100 / this.len) + '%'; }
  start(len) { this.len = len; this.dom.id = 'on'; }
  end() { this.dom.id = ''; this.div.style.width = '0%'; }
}

/** Zona invisível atrás dos painéis: clicar fora fecha tudo. */
class Responsive {
  constructor() {
    this.mobile = isMobile();
    this.closeZone = new DOM('div', { id: 'closeZone' }).onclick(this, this.hidePanels);
    // `x`, `x2` e `y` (zona de clique "morta") não são usados por ninguém hoje; ficam só o nome do painel e se está aberto
    this.panels = {
      '.toolbar': { from: 'toolbar', show: false },
      '.notify-panel': { from: 'notify-panel', show: false },
      '.account-panel': { from: 'account', show: false },
      '.channel-panel': { from: 'channel-panel', show: false }
    };
    get('body').append(this.closeZone._dom);
    window.onresize = () => { Files.resize(); term.resize(); this.mobile = isMobile(); };
  }
  hidePanels() {
    for (const key in this.panels) {
      UI[this.panels[key].from].panel.id = '';
      this.panels[key].show = false;
    }
    this.closeZone._dom.classList.remove('on');
  }
}

/* ====================== Área de trabalho: dispositivo, rodar, salvar e abrir ====================== */
/** Liga o Blockly à página: XML dos projetos, o dispositivo escolhido e o visual do estado da conexão. */
class Workspace {
  constructor() {
    if (window.location.pathname.includes('index.html') && window.location.protocol === 'file:') {
      alert('Você será levado para a versão offline.');
      window.location.replace('index_offline.html');
    }
    this.defaultToolbox = 'default.xml';
    this.selector = get('#device_selector');
    this.content = get('#content_device');
    this.toolbarButton = get('#toolbarButton');
    this.channel_connect = get('#channel_connect');
    this.device_title = getIn(this.content, '#device_title');
    this.device_img = getIn(this.content, '#device_img');
    this.device_desc = getIn(this.content, '#device_desc');
    /** Lista de dispositivos (devinfo/devinfo.json). Enquanto não chega é um array vazio; depois vira objeto (outros módulos esperam por isso). */
    this.devices = [];
    xhrGET('devinfo/devinfo.json', 'json', (response) => {
      this.devices = response.devices;
      if (!/#(.)/.test(window.location.href)) this.change();   // sem #arquivo na URL para carregar
    });
    this.selector.onchange = () => this.change();

    this.websocket = { url: get('#url'), pass: get('#password') };
    this.runButton = { dom: get('#runButton'), status: true };   // status: true = parado, false = rodando
    this.connectButton = get('#connectButton');
    this.saveButton = get('#saveButton');
    this.loadButton = get('#loadXML');
    this.connectButton.onclick = () => this.connectClick();
    this.runButton.dom.onclick = () => this.run();
    this.saveButton.onclick = () => this.saveXML();
    this.loadButton.addEventListener('change', () => this.loadXML());

    this.resetBoard = get('#resetBoard');
    this.EasyMQTT_bridge = get('#EasyMQTT_bridge');
    this.term = get('#term');
    this.file_status = get('#file-status');
    this.put_file_select = get('#put-file-select');
    this.file = get('#content_file_name');
    this.content_file_name = get('#content_file_name');
    this.put_file_select.onchange = () => Files.handle_put_file_select();
    this.freeboard = '';   // JSON do freeboard (aba escondida)
  }

  /** Roda o programa dos blocos, ou para o que está rodando. Sem conexão, tenta conectar antes. */
  run() {
    if (this.runButton.status) Tool.runWhenConnected(() => Tool.runPython(), 'Rodando programa...');
    else Tool.stopPython();
  }

  /* --- estados visuais da conexão (as classes são lidas pelo CSS e por cabecalho.js) --- */
  connecting() { this.toolbarButton.className = 'icon medium wait'; this.channel_connect.className = 'wait'; }
  /** O robô voltou ao prompt (>>>): terminou de rodar. Chamado por channel.js. */
  idle() { this.runButton.status = true; this.runButton.dom.className = 'icon'; this.toolbarButton.className = 'icon medium'; }
  /** O programa terminou (ou nada está rodando)? */
  isIdle() { return this.runButton.status === true; }
  receiving() {   // conectado
    this.channel_connect.className = '';
    this.runButton.status = false;
    this.runButton.dom.className = 'icon on';
    this.toolbarButton.className = 'icon medium on';
    this.connectButton.className = 'icon on';
    this.term.className = 'on';
  }
  runAbort() {    // desconectado
    this.channel_connect.className = '';
    this.runButton.status = true;
    this.runButton.dom.className = 'icon';
    this.toolbarButton.className = 'icon medium';
    this.connectButton.className = 'icon';
    this.term.className = '';
    this.websocket.url.disabled = false;
    this.connectButton.value = 'Connect';
  }
  /** O botão Conectar liga ou desliga. */
  connectClick() { if (mux.connected()) mux.disconnect(); else Channel['mux'].connect(); }

  /** Troca para o dispositivo do menu: caixa de blocos, imagem, descrição e velocidade serial. */
  change() {
    if (!(this.selector.value in this.devices)) { UI['notify'].send(MSG['invalidDevice']); return; }
    const selected = this.devices[this.selector.value];
    this.device_title.innerHTML = selected.title;
    this.device_img.src = selected.img;
    this.device_desc.innerHTML = selected.description;

    const toolbox = selected.toolbox ? `toolbox/${selected.toolbox}` : `toolbox/${this.defaultToolbox}`;
    if (!selected.toolbox) UI['notify'].send(MSG['noToolbox']);
    xhrGET(toolbox, 'document', (xml) => Code.reloadToolbox(xml));

    if (this.devices.constructor.name === 'Object') {   // atualiza os blocos de pinagem com o dispositivo novo
      const pinout = Code.workspace.getBlocksByType('pinout');
      pinout.forEach((block) => block.refresh());
      if (pinout.length !== 0) UI['notify'].send(MSG['wrongDevicePin']);
    }
    Channel['webserial'].packetSize = parseInt(selected.serial_packet_size);
    Channel['webserial'].speed = parseInt(selected.speed);
  }
  /** Escolhe um dispositivo pelo nome (se existir) e troca. */
  changeTo(device) {
    if (device in this.devices) { this.selector.value = device; this.change(); }
    else if (device !== '') UI['notify'].send(MSG['deviceUnavailable'].replace('%1', device));
  }

  /** Baixa o XML do projeto (do aberto, ou de `uid`). */
  saveXML(uid) {
    if (uid === undefined && 'BlocklyStorage' in window) BlocklyStorage.backupBlocks_(Code.workspace);
    let xmlText;
    if (uid === undefined) xmlText = this.writeWorkspace(Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(Code.workspace)), true);
    else xmlText = Blockly.Xml.domToPrettyText(Blockly.Xml.textToDom(localStorage[uid]));
    const link = document.createElement('a');
    link.setAttribute('href', 'data:x-application/xml;charset=utf-8,' + encodeURIComponent(xmlText));
    link.setAttribute('download', 'workspace.bipes.xml');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /** Lê dispositivo, hora, freeboard e databoard do XML do BIPES, e devolve o XML só dos blocos. */
  readWorkspace(xml, prettyText) {
    const chunk = prettyText ? /(<workspace>.*<\/workspace>\n)/s : /(<workspace>.*<\/workspace>)/;
    if (!chunk.test(xml)) { this.changeTo(Object.keys(this.devices)[0]); return xml; }
    const info = xml.match(chunk)[0];
    xml = xml.replace(chunk, '');
    try { this.loadFreeboard(info.match(/<freeboard><!\[CDATA\[(.+?)\]\]><\/freeboard>/)[1]); } catch (e) { UI['notify'].log(e); }
    try { this.loadDataboard(info.match(/<databoard><!\[CDATA\[(.+?)\]\]><\/databoard>/)[1]); } catch (e) { UI['notify'].log(e); }
    try {
      const device = info.match(/<field name="DEVICE">(.+?)<\/field>/)[1];
      if (this.devices.constructor.name === 'Object') this.changeTo(device);
      else {   // espera a lista de dispositivos chegar
        const iv = setInterval(() => { if (this.devices.constructor.name === 'Object') { this.changeTo(device); clearInterval(iv); } }, 500);
      }
    } catch (e) { UI['notify'].log(e); }
    return xml;
  }

  /** Escreve dispositivo, hora, freeboard e databoard dentro do XML do Blockly. */
  writeWorkspace(xml, prettyText) {
    const timestamp = +new Date(), device = this.selector.value;
    let freeboard = '', databoard = '';
    try {   // as abas escondidas ficam em iframes; abrindo de file:// o Chrome bloqueia
      freeboard = JSON.stringify(window.frames[1].freeboard.serialize());
      if (freeboard === '{"version":1,"allow_edit":true,"plugins":[],"panes":[],"datasources":[{"name":"vars","type":"core_scratchpad_plugin","settings":{"data":"={}","persist":"off","lock":false}}],"columns":3}') freeboard = '';
    } catch (e) { /* ok */ }
    try { databoard = window.frames[3].modules.Workspaces.compress(); } catch (e) { /* ok */ }

    xml = xml.replace(/(xmlns=")(?:.+?)(")/g, '$1https://bipes.net.br$2');
    const extra = `<field name="DEVICE">${device}</field><field name="TIMESTAMP">${timestamp}</field><freeboard><![CDATA[${freeboard}]]></freeboard><databoard><![CDATA[${databoard}]]></databoard>`;
    if (prettyText) return xml.replace(/(<xml xmlns=".+?">\n)/, `$1  <workspace>\n    <field name="DEVICE">${device}</field>\n    <field name="TIMESTAMP">${timestamp}</field>\n    <freeboard><![CDATA[${freeboard}]]></freeboard>\n    <databoard><![CDATA[${databoard}]]></databoard> \n  </workspace>\n`);
    return xml.replace(/(<xml xmlns=".+?">)/, `$1<workspace>${extra}</workspace>`);
  }

  /** Abre um projeto de arquivo .xml (botão Abrir). */
  loadXML() {
    const file = this.loadButton.files[0];
    if (file === undefined) return;
    if (!(/.xml$/.test(file.name) && file.type === 'text/xml')) { UI['notify'].send('Nenhum arquivo válido foi escolhido.'); return; }
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (ev) => {
      const content = this.readWorkspace(ev.target.result, true);
      try {
        Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(content), Code.workspace);
      } catch (e) {
        UI['notify'].log(e);
        if (/Error: Variable id, (.*) is already in use\.$/.test(e)) UI['notify'].send(`Esse nome de variável já está em uso, não consegui abrir ${file.name}.`);
        else UI['notify'].send(`O arquivo ${file.name} não parece um projeto válido, não consegui abrir.`);
        this.loadButton.value = '';
        return;
      }
      UI['notify'].send(MSG['blocksLoadedFromFile'].replace('%1', file.name));
      this.loadButton.value = '';
    };
  }

  /** Abas escondidas: carrega o painel do freeboard (JSON) quando o iframe ficar pronto. */
  loadFreeboard(json) {
    try {
      const board = JSON.parse(json), frame = window.frames[1];
      if (!/\/freeboard/.test(frame.location.pathname)) { UI['notify'].log('iFrame is not a freeboard'); return; }
      if (typeof frame.freeboard === 'object') frame.freeboard.loadDashboard(board);
      else { const iv = setInterval(() => { if (typeof frame.freeboard === 'object') { frame.freeboard.loadDashboard(board); clearInterval(iv); } }, 500); }
    } catch (e) { UI['notify'].log(e); }
  }
  /** Abas escondidas: carrega o databoard (JSON). */
  loadDataboard(json) {
    try {
      const board = JSON.parse(json), frame = window.frames[3];
      if (!/\/databoard/.test(frame.location.pathname)) { UI['notify'].log('iFrame is not a Databoard'); return; }
      const apply = () => {
        frame.modules.Workspaces.deinit();
        frame.modules.Workspaces.clearLocalStorage();
        frame.modules.Workspaces.uncompress(board);
        if (get('#tab_databoard').classList.contains('on')) frame.modules.Workspaces.init();
      };
      if (typeof frame.modules === 'object') apply();
      else { const iv = setInterval(() => { if (typeof frame.modules === 'object') { apply(); clearInterval(iv); } }, 500); }
    } catch (e) { UI['notify'].log(e); }
  }
}
