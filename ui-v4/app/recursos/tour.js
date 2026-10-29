/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4: TOUR PELA PLATAFORMA. Apresenta todos os recursos, passo a passo, destacando cada botão e trocando de tela sozinho.
   Abre: (1) pelo item "Conhecer a plataforma" do menu Projeto, (2) com ?tour=1 (ou o antigo ?tour=prep) na URL,
   (3) sozinho na primeira visita (uma vez só; não roda em navegador automatizado). Para refazer: menu Projeto. */
'use strict';
(function () {
  var CHAVE = 'sancabot_tour_visto';
  var $ = function (s) { return document.querySelector(s); };
  var tour, overlay, spot, titulo, texto, rotulo, bNext, bBack, bSkip;
  var i = 0, ativo = false, token = 0;

  /* ---------- ações de preparação de cada passo ---------- */
  function aba(id) {   // troca de tela (a fonte da verdade é Code.current, as classes só mudam depois da animação)
    var t = document.getElementById(id), atual = window.Code && Code.current && Code.current[0];
    if (t && atual !== id.replace('tab_', '')) t.click();
  }
  function menuProjeto(abrir) {
    var b = $('.sb-actions-btn'); if (!b) return;
    var aberto = b.getAttribute('aria-expanded') === 'true';
    if (aberto !== abrir) b.click();
  }
  function simulador(abrir) {
    var b = document.getElementById('simOpenBtn'); if (!b) return;
    var aberto = b.getAttribute('aria-pressed') === 'true';
    if (aberto !== abrir) b.click();
  }
  function perfil(abrir) {
    var p = $('.account-panel'), aberto = p && /\bon\b|open|visible/.test(p.className);
    var b = document.getElementById('accountButton'); if (b && !!aberto !== abrir) b.click();
  }
  function limpar() { menuProjeto(false); simulador(false); }

  /* ---------- os passos ---------- */
  var T = '.top-menu';
  var passos = [
    { t: null, h: 'Bem-vindo ao SancaBot!', p: 'Aqui você monta programas juntando blocos, testa no simulador e manda para o robô. Este passeio mostra tudo o que a plataforma tem. Dá para sair quando quiser.',
      antes: function () { limpar(); aba('tab_blocks'); } },
    { t: ['.tabs', '.sb-tabs-btn'], h: 'As telas', p: 'Estes botões trocam de tela: Blocos, Console, Arquivos, Galeria e Meu robô. Vamos visitar cada uma.' },
    { t: '.blocklyToolboxDiv', h: 'Caixa de blocos', p: 'Cada categoria tem blocos de um assunto. Clique numa categoria para abrir e arraste os blocos que quiser.', antes: function () { aba('tab_blocks'); } },
    { t: '.sancabot-toolbox-sancabot', h: 'Os blocos do robô (laranja)', p: 'Em SancaBot estão os blocos que fazem o robô andar, girar, corrigir o caminho e parar. Comece por aqui.' },
    { t: '.sb-adv-switch', h: 'Modo Avançado', p: 'Para começar, só aparecem as categorias mais simples. Ligue o Avançado para ver todas as outras (sensores, repetições, textos, listas, comunicação…).' },
    { t: '#content_blocks', h: 'Área de montagem', p: 'Arraste os blocos para cá e encaixe um embaixo do outro. O robô obedece na ordem em que estão. Clique com o botão direito para copiar, apagar ou desfazer.' },
    { t: '#sbCodePanel', h: 'Código e Referência', p: 'Este painel mostra o programa em Python que seus blocos geram (dá para copiar e baixar o .py) e, na aba Referência, a ajuda de cada bloco. Você pode fixá-lo ou recolhê-lo.' },
    { t: '#simOpenBtn', h: 'Simular sem o robô', p: 'Não tem o robô por perto? O Simulador testa o seu programa num tablado virtual. Vamos abrir.', antes: function () { simulador(false); } },
    { t: '#sbSimPanel', h: 'O tablado virtual', p: 'Aperte Jogar e veja o robô andar. Escolha um exemplo pronto, uma trajetória-alvo (reta, quadrado, oito, curva em S), coloque obstáculos ou desenhe paredes e confira o desvio, o tempo e o sensor de distância. A velocidade (1×, 2×, 4×) é sua.',
      antes: function () { simulador(true); }, espera: 450 },
    { t: ['#channelButton', '#channel_connect'], h: 'Conectar o robô', p: 'Clique em Conectar e escolha como ligar: cabo USB (o mais fácil), Bluetooth ou Wi-Fi. Quando ficar verde, o robô está conectado.', antes: function () { simulador(false); } },
    { t: '#runButton', h: 'Conectar e rodar', p: 'Quando os blocos estiverem prontos, aperte aqui: o programa é enviado e o robô começa. Cada bloco acende no momento em que o robô o executa.' },
    { t: '#sancabotSlowToggle', h: 'Modo passo a passo 🐢', p: 'Liga a tartaruga para o programa rodar devagar, com uma pausa em cada bloco. Ótimo para entender o que acontece e achar erros.' },
    { t: '.sb-proj', h: 'Menu Projeto', p: 'Aqui ficam as ações do seu projeto. Vamos ver cada uma.', antes: function () { menuProjeto(false); } },
    { t: '.sb-actions-menu', h: 'Compartilhar, salvar e abrir', p: 'Compartilhar na galeria, gerar o link do projeto, baixar o projeto como arquivo, abrir um arquivo guardado, pedir ajuda no fórum e rever este passeio.',
      antes: function () { menuProjeto(true); } },
    { t: ['#tab_console', '.sb-tabs-btn'], h: 'Console', p: 'É a conversa com o robô: o que ele diz aparece aqui, e você também pode digitar comandos. Os erros chegam em português.', antes: function () { menuProjeto(false); aba('tab_console'); }, espera: 450 },
    { t: '#content_console', h: 'Executar, parar e reiniciar', p: 'Nesta tela estão os botões Executar meus blocos, Parar programa e Reiniciar o robô, o medidor de distância do sensor e as ferramentas de rede (EasyMQTT).' },
    { t: ['#tab_files', '.sb-tabs-btn'], h: 'Arquivos do robô', p: 'Veja, abra, edite, salve, execute e apague os arquivos que estão dentro do robô. Dá também para baixar um arquivo para o computador.', antes: function () { aba('tab_files'); }, espera: 450 },
    { t: ['#tab_programs', '.sb-tabs-btn'], h: 'Galeria de projetos', p: 'A galeria mostra projetos da turma e da comunidade. Abra um, remixe e aprenda com ele; entre com a sua conta para ver a turma e os seus projetos.', antes: function () { aba('tab_programs'); }, espera: 450 },
    { t: ['#tab_device', '.sb-tabs-btn'], h: 'Meu robô', p: 'O esquema da placa do robô, com o nome de cada pino, e a documentação, para quando você quiser entender o que está por dentro.', antes: function () { aba('tab_device'); }, espera: 450 },
    { t: '#accountButton', h: 'Seu perfil', p: 'Aqui ficam seus projetos guardados neste computador: dá para renomear, baixar ou apagar cada um.', antes: function () { aba('tab_blocks'); }, espera: 450 },
    { t: null, h: 'Pronto, é com você! 🚀', p: 'Já conhece a plataforma toda. Monte um programa, teste no simulador e mande para o robô. Para rever este passeio, abra Projeto → Conhecer a plataforma.' }
  ];

  /* ---------- posicionamento ---------- */
  function achar(sel) {   // sel pode ser uma lista de alternativas: vale a primeira que estiver visível (em janela estreita as abas viram um botão)
    var l = [].concat(sel);
    for (var k = 0; k < l.length; k++) { var e = $(l[k]); if (e && e.getClientRects().length) return e; }
    return null;
  }
  function retangulo(e) {
    var r = e.getBoundingClientRect(), pad = 4;
    var l = Math.max(6, r.left - pad), tp = Math.max(6, r.top - pad);
    return { left: l, top: tp, width: Math.max(40, Math.min(r.width + pad * 2, innerWidth - l - 6)), height: Math.max(34, Math.min(r.height + pad * 2, innerHeight - tp - 6)) };
  }
  function posCartao(r) {
    var w = Math.min(380, innerWidth - 28), h = tour.offsetHeight || 230, left, top;
    if (!r) { left = (innerWidth - w) / 2; top = Math.max(18, Math.min(112, innerHeight * .14)); }
    else {
      var abaixo = r.top + r.height + 16, acima = r.top - h - 16, direita = r.left + r.width + 16, esquerda = r.left - w - 16;
      if (r.top < 110 && abaixo + h < innerHeight - 10) { top = abaixo; left = r.left; }
      else if (direita + w < innerWidth - 10) { left = direita; top = r.top; }
      else if (esquerda > 10) { left = esquerda; top = r.top; }
      else if (acima > 10) { top = acima; left = r.left; }
      else { top = abaixo; left = r.left; }
      if (r.width > innerWidth * .6 || r.height > innerHeight * .6) { top = Math.min(innerHeight - h - 14, Math.max(14, r.top + r.height / 2 - h / 2)); left = Math.max(14, (innerWidth - w) / 2); }
    }
    left = Math.max(14, Math.min(left, innerWidth - w - 14)); top = Math.max(14, Math.min(top, innerHeight - h - 14));
    tour.style.width = w + 'px'; tour.style.left = left + 'px'; tour.style.top = top + 'px';
    tour.style.setProperty('--tour-arrow-left', '34px');
  }

  function mostrar() {
    var passo = passos[i], meu = ++token;
    rotulo.textContent = 'Passo ' + (i + 1) + ' / ' + passos.length;
    titulo.textContent = passo.h; texto.textContent = passo.p;
    bNext.textContent = i === passos.length - 1 ? 'Concluir' : 'Próximo';
    bBack.hidden = i === 0;
    // roda depois do clique que trouxe até aqui terminar (senão o "clicar fora" do menu o fecha na hora)
    setTimeout(function () { try { if (passo.antes && meu === token) passo.antes(); } catch (e) {} }, 0);
    function posicionar() {
      if (meu !== token || !ativo) return;
      var alvo = passo.t ? achar(passo.t) : null, r = alvo ? retangulo(alvo) : null;
      tour.classList.toggle('sancabot-tour--intro', !r);
      spot.hidden = !r;
      if (r) { spot.style.left = r.left + 'px'; spot.style.top = r.top + 'px'; spot.style.width = r.width + 'px'; spot.style.height = r.height + 'px'; }
      posCartao(r);
    }
    setTimeout(posicionar, 30);
    setTimeout(posicionar, passo.espera || 120);
    setTimeout(posicionar, (passo.espera || 120) + 400);   // segunda medida: depois que a tela termina de aparecer
  }

  function fechar(concluiu) {
    ativo = false; token++;
    tour.hidden = overlay.hidden = spot.hidden = true; tour.setAttribute('aria-hidden', 'true');
    limpar(); aba('tab_blocks');
    try { localStorage.setItem(CHAVE, '1'); } catch (e) {}
  }

  function abrir() {
    if (!tour) return;
    ativo = true; i = 0;
    tour.hidden = overlay.hidden = false; tour.setAttribute('aria-hidden', 'false');
    mostrar(); bNext.focus();
  }

  function ligar() {
    tour = document.getElementById('sancabotTour'); overlay = document.getElementById('sancabotTourOverlay'); spot = document.getElementById('sancabotTourSpotlight');
    titulo = document.getElementById('sancabotTourTitle'); texto = document.getElementById('sancabotTourText'); rotulo = document.getElementById('sancabotTourStep');
    bNext = document.getElementById('sancabotTourNext'); bSkip = document.getElementById('sancabotTourSkip'); bBack = document.getElementById('sancabotTourBack');
    if (!tour || !overlay || !spot || !titulo || !texto || !rotulo || !bNext || !bSkip || !bBack) return;
    bNext.addEventListener('click', function () { if (i < passos.length - 1) { i++; mostrar(); } else fechar(true); });
    bBack.addEventListener('click', function () { if (i > 0) { i--; mostrar(); } });
    bSkip.addEventListener('click', function () { fechar(false); });
    addEventListener('resize', function () { if (ativo) mostrar(); });
    document.addEventListener('keydown', function (e) {
      if (!ativo) return;
      if (e.key === 'Escape') fechar(false);
      else if (e.key === 'ArrowRight') bNext.click();
      else if (e.key === 'ArrowLeft') bBack.click();
    });
    window.SancaBotTour = { abrir: abrir, fechar: fechar, passos: passos };
    menu();
    var q = new URLSearchParams(location.search).get('tour'), visto = false;
    try { visto = !!localStorage.getItem(CHAVE); } catch (e) {}
    if (q === '1' || q === 'prep') setTimeout(abrir, 400);
    else if (!visto && !navigator.webdriver && !new URLSearchParams(location.search).get('robo')) setTimeout(abrir, 900);
  }

  function menu() {   // item "Conhecer a plataforma" no menu Projeto
    var m = $('.sb-actions-menu'); if (!m || document.getElementById('tourButton')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'tourButton'; b.className = 'icon'; b.setAttribute('role', 'menuitem');
    b.title = 'Passeio por todos os recursos da plataforma';
    b.addEventListener('click', function () { menuProjeto(false); abrir(); });
    m.appendChild(b);
  }

  function esperar(n) {
    if ($('.top-menu') && $('.sb-actions-menu') && document.getElementById('sancabotTour')) return ligar();
    if (n > 80) return;
    setTimeout(function () { esperar(n + 1); }, 250);
  }
  esperar(0);
})();
