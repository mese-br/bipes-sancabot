/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: PARÂMETROS de aparência e de linguagem do editor, num lugar só.
   Mude os valores aqui; o resto do código lê este objeto. Carregar antes de sancabot_scratch_theme.js. */
window.SancaBotConfig = {
  version: 'v4-dev',  // v3 = paleta viva, ícones, Controle dividido, painel claro. Congeladas: v1 (/bipes-v1/) e v2 (/bipes-v2/), em dev-local/versoes

  // ---- Paleta: cores vivas e alegres, uma por papel. TODAS levam texto azul-marinho (contraste mínimo 5,5:1) ----
  palette: {
    prep:   '#FF7B6B',   // coral        preparar o robô e a placa, ajustes
    move:   '#4C9FFF',   // azul-céu     andar, girar, motores
    sense:  '#1FD3C0',   // turquesa     sentir: distância e sensores
    decide: '#FF9A3C',   // tangerina    decidir: se... então
    repeat: '#FFD23F',   // amarelo-sol  repetir
    calc:   '#5FDB74',   // verde-folha  contas e condições (verdadeiro/falso)
    time:   '#A58BFF',   // lavanda      tempo, esperar, sons
    store:  '#FF6FA5',   // rosa-chiclete guardar: variáveis
    text:   '#F27DDC',   // orquídea     texto e telas
    lists:  '#B5E04B',   // lima         listas
    net:    '#6FD3FF',   // celeste      redes e comunicação
    more:   '#A9B6D8',   // cinza-azulado funções, arquivos, avançado
    events: '#FFD23F'    // "quando começar" (mesmo amarelo de repetir)
  },
  ink: '#1B2250',        // cor do texto e dos ícones nos blocos
  // ---- Fonte dos blocos (arquivo em media/fonts/nunito; ver @font-face em core/sancabot_scratch.css) ----
  font: {
    family: 'Nunito',
    fallback: '"Baloo 2","Trebuchet MS","Segoe UI",system-ui,-apple-system,sans-serif',
    weight: '800',        // 400 normal ... 800 negrito arredondado (estilo Scratch)
    size: 13              // tamanho do texto dentro dos blocos (px)
  },

  // ---- Espaçamento dos blocos (px). Menores = blocos mais compactos, com menos "ar" em volta do texto ----
  spacing: {
    minBlockHeight: 40,           // altura mínima de uma linha de bloco (padrão do Zelos: 48)
    smallPadding: 6,              // entre um campo e o seguinte (padrão 4)
    mediumPadding: 7,             // padding médio (padrão 8)
    largePadding: 12,             // margem das bordas do bloco (padrão 16)
    emptyInlineInputPadding: 10,  // largura de um encaixe vazio (padrão 16)
    cornerRadius: 6               // arredondamento dos cantos (padrão 4)
  },

  // ---- Textos que o projeto novo já traz ----
  defaults: {
    author: 'Aluno',              // no lugar de "User"
    description: 'Meu projeto'    // no lugar de "My project"
  },

  // ---- Robôs: as DUAS versões do firmware (repositório mese-br/sancabot-firmware) ----
  // Fonte dos pinos: os comentários e os #define dos .ino (conferido em 2026-10-29). Mudou o firmware? Mude aqui, e só aqui:
  // os menus de porta dos blocos, a aba "Meu robô", os avisos do simulador e os testes leem esta tabela.
  //   SancaBot    = SancaBot Free v1.0 (tag free-v1.0, firmware/sancabot_free). É o robô ATUAL e o padrão. Mantém o nome "SancaBot"
  //                 porque os projetos já salvos guardam esse nome no campo DEVICE.
  //   SancaBotV2  = linha v2 (tag v2-r12, firmware/sancabot_ble): servo direito no pino 21, sensor de contato e Hall (odometria).
  // "id" liga cada função ao papel dos blocos (servoEsq/servoDir = "Preparar motores"; trig/echo = "Preparar sensor de distância").
  robotDefault: 'SancaBot',
  robos: {
    SancaBot: {
      nome: 'SancaBot Free v1.0', menu: 'SancaBot Free v1.0',
      resumo: 'Versão atual do robô: dois servos de rotação contínua, dois sensores de linha e o sensor de distância.',
      origem: 'sancabot_free.ino, tag free-v1.0',
      pinos: [
        { id: 'servoEsq', pino: 0, nome: 'Servo esquerdo', nota: 'roda esquerda (rotação contínua)' },
        { id: 'servoDir', pino: 1, nome: 'Servo direito', nota: 'roda direita (rotação contínua, montada espelhada)' },
        { id: 'irEsq', pino: 5, nome: 'IR esquerdo', nota: 'sensor de linha; o firmware lê HIGH quando está na linha' },
        { id: 'irDir', pino: 6, nome: 'IR direito', nota: 'sensor de linha; o firmware lê HIGH quando está na linha' },
        { id: 'trig', pino: 7, nome: 'Ultrassom TRIG', nota: 'HC-SR04, emissor (dispara o pulso)' },
        { id: 'echo', pino: 8, nome: 'Ultrassom ECHO', nota: 'HC-SR04, receptor (mede o eco)' }
      ]
    },
    SancaBotV2: {
      nome: 'SancaBot v2', menu: 'SancaBot v2',
      resumo: 'Versão anterior, com sensor de contato e sensores Hall nas rodas (odometria). O servo direito fica no pino 21.',
      origem: 'sancabot_ble.ino, tag v2-r12',
      pinos: [
        { id: 'servoEsq', pino: 0, nome: 'Servo esquerdo', nota: 'roda esquerda (rotação contínua)' },
        { id: 'servoDir', pino: 21, nome: 'Servo direito', nota: 'roda direita (rotação contínua); o pino 21 é também o TX da placa' },
        { id: 'trig', pino: 7, nome: 'Ultrassom TRIG', nota: 'HC-SR04, emissor (dispara o pulso)' },
        { id: 'echo', pino: 8, nome: 'Ultrassom ECHO', nota: 'HC-SR04, receptor (mede o eco)' },
        { id: 'contato', pino: 4, nome: 'Contato', nota: 'chave de contato KW11-3Z-5; fecha ao bater' },
        { id: 'irEsq', pino: 5, nome: 'IR esquerdo', nota: 'sensor de linha HW-870; HIGH = linha escura' },
        { id: 'irDir', pino: 6, nome: 'IR direito', nota: 'sensor de linha HW-870; HIGH = linha escura' },
        { id: 'hallEsq', pino: 2, nome: 'Hall esquerdo', nota: 'conta os pulsos da roda esquerda' },
        { id: 'hallDir', pino: 3, nome: 'Hall direito', nota: 'conta os pulsos da roda direita' }
      ]
    }
  },
  // Papéis dos campos de porta dos blocos -> id da tabela acima.
  papeis: { left: 'servoEsq', right: 'servoDir', trig: 'trig', echo: 'echo' },

  // ---- Portas da placa: NOME que o aluno vê -> PINO real (ESP32-C3, pinos 0 a 21) ----
  // "ports" depende do robô escolhido no cabeçalho (abaixo). Pinos sem função aparecem como "pino N". O valor guardado no projeto
  // continua sendo o número do pino, então nenhum projeto antigo deixa de abrir.
  roboAtual: function () {   // chave do robô escolhido no cabeçalho (padrão: o Free)
    var sel = document.getElementById('device_selector'), k = sel && sel.value;
    return (k && this.robos[k]) ? k : this.robotDefault;
  },
  pinoDe: function (id, chave) {   // pino de uma função ("servoDir" -> 1 ou 21); undefined se o robô não tem
    var l = this.robos[chave || this.roboAtual()].pinos;
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i].pino;
    return undefined;
  },
  nomeDoPino: function (pino, chave) {   // "Servo direito (1)" ou "pino 10"
    var l = this.robos[chave || this.roboAtual()].pinos;
    for (var i = 0; i < l.length; i++) if (l[i].pino === Number(pino)) return l[i].nome + ' (' + l[i].pino + ')';
    return 'pino ' + pino;
  },
  portas: function (chave) {   // [[texto, pino], ...] para os menus dos blocos
    var l = [];
    for (var i = 0; i <= 21; i++) l.push([this.nomeDoPino(i, chave), i]);
    return l;
  },
  pinagem: function (chave) {   // lista do bloco genérico "pinout" (devinfo): os pinos sem função seguem como "GPIOn"
    var fixos = { 18: 'GPIO18 / USB D-', 19: 'GPIO19 / USB D+', 20: 'GPIO20 / RX', 21: 'GPIO21 / TX' }, l = [];
    for (var i = 0; i <= 21; i++) {
      var n = this.nomeDoPino(i, chave);
      l.push([/^pino /.test(n) ? (fixos[i] || 'GPIO' + i) : n, String(i)]);
    }
    return l;
  },
  descricao: function (chave) {   // HTML da aba "Meu robô"
    var r = this.robos[chave], esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    var linhas = r.pinos.slice().sort(function (a, b) { return a.pino - b.pino; }).map(function (p) {
      return '<tr><td>' + p.pino + '</td><td><b>' + esc(p.nome) + '</b></td><td>' + esc(p.nota) + '</td></tr>';
    }).join('');
    return esc(r.resumo) + '<br><br><table class="sancabot-pinos"><thead><tr><th>Pino</th><th>Função</th><th>Detalhe</th></tr></thead><tbody>' + linhas + '</tbody></table>' +
      '<br><a class=\'sancabot-pinout-link\' href=\'devinfo/media/ESP32-C3-SuperMini-Pinout-SancaBot.png\' target=\'_blank\' rel=\'noopener\'>Ver pinagem ESP32-C3 Super Mini</a>' +
      '<br><small>Pinos conferidos no firmware (' + esc(r.origem) + '). Troque de robô no menu do cabeçalho.</small>';
  },
  aplicarAosDispositivos: function (devices) {   // chamado quando devinfo.json chega: dá a cada robô o título, a descrição e a pinagem certos
    var me = this;
    Object.keys(this.robos).forEach(function (k) {
      if (!devices[k]) return;
      devices[k].title = '<b>' + me.robos[k].nome + ' (ESP32-C3 Super Mini)</b><br>';
      devices[k].description = me.descricao(k);
      devices[k].pinout = me.pinagem(k);
    });
  },
  conferirPinos: function (ws) {   // blocos de motor/sensor com pino diferente do robô escolhido -> lista de frases
    var me = this, k = this.roboAtual(), r = this.robos[k], out = [];
    function ver(b, campo, papel, quem) {
      var f = b.getFieldValue(campo); if (f === null || f === undefined) return;
      var esperado = me.pinoDe(me.papeis[papel], k);
      if (esperado !== undefined && String(f) !== String(esperado)) out.push({ bloco: b, texto: quem + ' está em "' + me.nomeDoPino(f, k) + '", mas no ' + r.nome + ' fica em "' + me.nomeDoPino(esperado, k) + '".' });
    }
    ws.getAllBlocks(false).forEach(function (b) {
      if (b.type === 'sancabot_config') { ver(b, 'LEFT_PIN', 'left', 'A roda esquerda'); ver(b, 'RIGHT_PIN', 'right', 'A roda direita'); }
      if (b.type === 'sancabot_distance_sensor') { ver(b, 'TRIGGER_PIN', 'trig', 'O emissor do sensor de distância'); ver(b, 'ECHO_PIN', 'echo', 'O receptor do sensor de distância'); }
    });
    return out;
  },

  // ---- Simulador de trajetória (aba "Simulador") ----
  // ⚠️ PENDENTE: estas medidas são PROVISÓRIAS. Medir no robô real e atualizar (roteiro em docs/projeto/MEDIDAS-DO-ROBO.md).
  // trackCm = distância entre as rodas, em cm. PROVISÓRIA (meça no robô). A velocidade vem do giro calibrado do próprio robô
  // (girar 90° em 1,0 s a 50%, o padrão do runtime em generator_stubs_sancabot.js; o bloco "Calibrar giro" muda isso na simulação).
  robot: { trackCm: 10, turn90At50: 1.0 },
  tablado: { w: 120, h: 80 },   // tamanho do tablado em cm

  // ---- Linguagem para iniciantes ----
  // Nos menus de pino, "GPIO5" aparece como "porta 5" (só o texto; o código gerado não muda).
  portWord: 'porta',
  beginner: {
    enabled: true,                              // true = começa no modo iniciante
    advancedParent: 'Laboratório Avançado',     // grupo da caixa de blocos que guarda as categorias técnicas
    keepCategories: ['Lógica', 'Matemática'],   // categorias desse grupo que o iniciante continua vendo
    parentLabel: 'Lógica e matemática',         // nome do grupo no modo iniciante (no avançado volta ao original)
    storageKey: 'sancabot_modo_avancado'        // guarda a escolha do aluno neste navegador
  }
};
// "ports" (usado pelos menus dos blocos e pelo simulador) acompanha o robô escolhido.
Object.defineProperty(window.SancaBotConfig, 'ports', { enumerable: true, get: function () { return this.portas(); } });
