/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: GALERIA de projetos (da turma e da comunidade), no estilo do Tinkercad.
   Este arquivo tem duas partes:
     1) SancaBotGaleria: os dados (projetos, curtidas, remixes, aprovação do professor) e a miniatura dos blocos. É usado pelo editor
        e pela página da galeria (shared.html). Dois modos, escolhidos sozinhos ao abrir:
          · SERVIDOR: a API /studio/api/gallery.php (sancabot-studio) responde: login, papéis, aprovação e dados de verdade.
          · LOCAL (demonstração): se a API não existe (ex.: o editor aberto sem o Studio), usa o localStorage com projetos de exemplo.
        As leituras são síncronas (vêm de um cache que o modo SERVIDOR atualiza); as escritas devolvem Promise.
     2) No editor: o item "Compartilhar na galeria" do menu Projeto e a janela de publicar.
   Estados de um projeto: privado (só o autor) · turma (visível à turma) · pendente (espera o professor) · publico · recusado. */
(function () {
  'use strict';
  var KEY = 'sancabot_galeria_v1', KEY_USER = 'sancabot_galeria_usuario';
  var PALAVRAS_BLOQUEADAS = ['palavrao1', 'palavrao2'];   // PROVISÓRIO: trocar pela lista da escola (só os títulos são livres)
  var REACOES = [{ id: 'estrela', emoji: '⭐', nome: 'Legal' }, { id: 'foguete', emoji: '🚀', nome: 'Rápido' }, { id: 'ideia', emoji: '💡', nome: 'Boa ideia' }];

  function lerJson(k, vazio) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? vazio : v; } catch (e) { return vazio; } }
  function gravarJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } }
  function agora() { return Date.now(); }
  function novoId() { return 'p' + agora().toString(36) + Math.random().toString(36).slice(2, 6); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- modo: null = descobrindo · false = local (demonstração) · true = servidor ---------- */
  var API = (window.SancaBotConfig && SancaBotConfig.galleryApi) || '/studio/api/gallery.php';
  var remoto = null, cache = { projetos: [], me: null }, sincronizando = null;
  function api(acao, corpo) {
    var opt = { credentials: 'same-origin', headers: {} };
    if (corpo) { opt.method = 'POST'; opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(corpo); }
    return fetch(API + '?action=' + acao, opt).then(function (r) { return r.json().catch(function () { return { success: false, message: 'Resposta inesperada do servidor.' }; }); });
  }
  function sincronizar() {   // baixa tudo que este usuário pode ver e avisa a tela
    if (!remoto) return Promise.resolve();
    if (sincronizando) return sincronizando;
    sincronizando = api('all').then(function (d) {
      if (d && d.success) {
        cache.me = d.me;
        cache.projetos = d.projects.map(function (p) { p.autorId = p.mine ? 'me' : 'outro'; return p; });
        avisar();
      }
    }).catch(function () { /* sem rede: mantém o que já tem */ }).then(function () { sincronizando = null; });
    return sincronizando;
  }
  function descobrir() {
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); }, 3500);
    fetch(API + '?action=me', { credentials: 'same-origin', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { if (!d || !d.success) throw 0; remoto = true; cache.me = d.me; return sincronizar(); })
      .catch(function () { remoto = false; })
      .then(function () { clearTimeout(t); avisar(); });
    setInterval(function () { if (remoto && document.visibilityState !== 'hidden') sincronizar(); }, 30000);
    window.addEventListener('focus', function () { sincronizar(); });
  }

  /* ---------- quem está usando (modo servidor: vem da sessão; local: papel de demonstração) ---------- */
  function usuario() {
    if (remoto && cache.me) { var m = cache.me; return { id: m.papel === 'visitante' ? 'visitante' : 'me', papel: m.papel, apelido: m.apelido || 'Aluno', turma: m.turma || 'Minha turma' }; }
    var u = lerJson(KEY_USER, null);
    if (!u) { u = { id: 'u' + Math.random().toString(36).slice(2, 8), papel: 'aluno' }; gravarJson(KEY_USER, u); }
    var nome = ''; try { nome = localStorage.getItem('account_user') || ''; } catch (e) { /* ok */ }
    u.apelido = (nome || u.apelido || 'Aluno').trim().split(/\s+/)[0] || 'Aluno';
    u.turma = u.turma || 'Minha turma';
    return u;
  }
  function definirPapel(papel) { if (remoto) return usuario(); var u = usuario(); u.papel = papel === 'professor' ? 'professor' : 'aluno'; gravarJson(KEY_USER, u); avisar(); return u; }

  /* ---------- projetos de exemplo (aparecem só quando a galeria está vazia) ---------- */
  function exemplos() {
    var ex = window.SancaBotSimExamples || (window.parent && window.parent !== window && window.parent.SancaBotSimExamples) || [];
    function xml(id) { for (var i = 0; i < ex.length; i++) if (ex[i].id === id) return ex[i].xml; return ''; }
    function proj(id, titulo, autor, estado, missao, estrelas, reacoes, desc, remixes) {
      var r = { estrela: [], foguete: [], ideia: [] };
      Object.keys(reacoes || {}).forEach(function (k) { for (var i = 0; i < reacoes[k]; i++) r[k].push('demo' + k + i); });
      return { id: novoId(), titulo: titulo, autor: autor, autorId: 'demo-' + autor, xml: xml(id), estado: estado, visib: estado === 'turma' ? 'turma' : 'comunidade', turma: 'Minha turma', missao: missao,
        estrelas: estrelas, descricao: desc, criado: agora() - Math.floor(Math.random() * 6) * 864e5, reacoes: r, remixDe: null, remixes: remixes || 0, demo: true };
    }
    return [
      proj('quadrado', 'Meu quadrado perfeito', 'Lia', 'turma', 'Desenhar um quadrado', 3, { estrela: 4, foguete: 1 }, 'Repeti 4 vezes: andar e girar.', 2),
      proj('parar', 'Para antes da parede', 'Teo', 'turma', 'Parar antes da parede', 2, { ideia: 3, estrela: 1 }, 'O sensor vê a parede e o robô para.'),
      proj('caixa', 'Desvio da caixa', 'Nina', 'turma', 'Desviar da caixa', 3, { foguete: 2, ideia: 1 }, 'Contorna a caixa por baixo.', 1),
      proj('zigue', 'Zigue-zague veloz', 'Davi', 'publico', 'Zigue-zague', 3, { estrela: 7, foguete: 5, ideia: 2 }, 'Sobe e desce sem parar.', 4),
      proj('desvio-com', 'Robô corrigido', 'Maria', 'publico', 'Corrigindo o desvio', 2, { ideia: 6, estrela: 3 }, 'Usei Corrigir desvio com +3.', 2),
      proj('reta', 'Linha reta', 'Caio', 'pendente', 'Andar em linha reta', 1, {}, 'Meu primeiro programa!')
    ];
  }

  /* ---------- armazenamento ([SERVIDOR]: estas funções viram chamadas à API) ---------- */
  var ouvintes = [];
  function avisar() { ouvintes.forEach(function (f) { try { f(); } catch (e) { /* ok */ } }); }
  function todos() {
    if (remoto) return cache.projetos;
    if (remoto === null) return [];   // ainda descobrindo o modo: não cria dados de exemplo antes da hora
    var d = lerJson(KEY, null);
    if (!d) { d = { projetos: exemplos() }; gravarJson(KEY, d); }
    return d.projetos;
  }
  function salvar(lista) { if (remoto) return; gravarJson(KEY, { projetos: lista }); avisar(); }
  function achar(id) { var l = todos(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function atualizar(id, fn) { var l = todos(), p = null; for (var i = 0; i < l.length; i++) if (l[i].id === id) p = l[i]; if (!p) return null; fn(p); if (remoto) avisar(); else salvar(l); return p; }
  function falhou(r) { try { UI['notify'].send((r && r.message) || 'Não consegui falar com o servidor. Tente de novo.'); } catch (e) { /* ok */ } return sincronizar(); }
  function enviar(acao, corpo) { return api(acao, corpo).then(function (r) { return r && r.success ? sincronizar().then(function () { return r; }) : falhou(r).then(function () { return r; }); }, function () { return falhou(); }); }

  function tituloValido(t) {
    t = String(t || '').trim(); if (t.length < 2) return 'Dê um nome ao projeto (pelo menos 2 letras).';
    if (t.length > 40) return 'O nome pode ter no máximo 40 letras.';
    var baixo = t.toLowerCase(); for (var i = 0; i < PALAVRAS_BLOQUEADAS.length; i++) if (baixo.indexOf(PALAVRAS_BLOQUEADAS[i]) >= 0) return 'Esse nome não pode ser usado. Escolha outro.';
    return '';
  }

  /* lista para uma aba. aba: 'turma' | 'comunidade' | 'meus' | 'pendentes' (professor) */
  function listar(aba) {
    var u = usuario(), l = todos().slice();
    var r = l.filter(function (p) {
      if (aba === 'turma') return p.estado === 'turma' || p.estado === 'publico';   // o que é público também é da turma
      if (aba === 'comunidade') return p.estado === 'publico';
      if (aba === 'meus') return p.autorId === u.id;
      if (aba === 'pendentes') return u.papel === 'professor' && p.estado === 'pendente';
      return false;
    });
    return r.sort(function (a, b) { return b.criado - a.criado; });
  }
  function contarPendentes() { return usuario().papel === 'professor' ? todos().filter(function (p) { return p.estado === 'pendente'; }).length : 0; }

  /* visib: 'privado' | 'turma' | 'comunidade' (esta espera o professor, exceto se quem publica é o professor). Devolve uma Promise. */
  function publicar(dados) {
    var u = usuario(), erro = tituloValido(dados.titulo); if (erro) return Promise.resolve({ ok: false, erro: erro });
    if (u.papel === 'visitante') return Promise.resolve({ ok: false, erro: 'Entre na sua conta do SancaBot Studio para compartilhar.' });
    if (remoto) {
      return api('publish', { titulo: dados.titulo, descricao: dados.descricao, visib: dados.visib, xml: dados.xml, missao: dados.missao || '', estrelas: dados.estrelas || 0, remixDe: dados.remixDe ? dados.remixDe.id : '' })
        .then(function (r) { return r && r.success ? sincronizar().then(function () { return { ok: true, projeto: { estado: r.estado, id: r.id } }; }) : { ok: false, erro: (r && r.message) || 'Não consegui compartilhar agora.' }; },
          function () { return { ok: false, erro: 'Não consegui falar com o servidor. Tente de novo.' }; });
    }
    var visib = dados.visib, estado = visib === 'comunidade' ? (u.papel === 'professor' ? 'publico' : 'pendente') : visib === 'turma' ? 'turma' : 'privado';
    var p = { id: novoId(), titulo: dados.titulo.trim(), autor: u.apelido, autorId: u.id, xml: dados.xml, estado: estado, visib: visib, turma: u.turma, missao: dados.missao || '', estrelas: dados.estrelas || 0,
      descricao: (dados.descricao || '').trim().slice(0, 140), criado: agora(), reacoes: { estrela: [], foguete: [], ideia: [] }, remixDe: dados.remixDe || null, remixes: 0 };
    var l = todos(); l.push(p); salvar(l);
    return Promise.resolve({ ok: true, projeto: p });
  }
  function aprovar(id) { if (remoto) return enviar('approve', { id: id }); return atualizar(id, function (p) { if (usuario().papel === 'professor') { p.estado = 'publico'; delete p.motivo; } }); }
  function recusar(id, motivo) { if (remoto) return enviar('reject', { id: id, motivo: motivo }); return atualizar(id, function (p) { if (usuario().papel === 'professor') { p.estado = 'recusado'; p.motivo = motivo || 'O professor pediu alguns ajustes.'; } }); }
  function remover(id) {
    var u = usuario(), p = achar(id); if (!p || (p.autorId !== u.id && u.papel !== 'professor')) return false;
    if (remoto) { cache.projetos = cache.projetos.filter(function (x) { return x.id !== id; }); avisar(); enviar('delete', { id: id }); return true; }
    salvar(todos().filter(function (x) { return x.id !== id; })); return true;
  }
  function reagir(id, tipo) {
    var u = usuario(); if (u.papel === 'visitante') { try { UI['notify'].send('Entre na sua conta para curtir.'); } catch (e) { /* ok */ } return null; }
    var r = atualizar(id, function (p) {   // no modo servidor, vale na hora na tela e o servidor confirma em seguida
      p.reacoes = p.reacoes || { estrela: [], foguete: [], ideia: [] }; var a = p.reacoes[tipo] || (p.reacoes[tipo] = []), i = a.indexOf(u.id);
      if (i >= 0) a.splice(i, 1); else a.push(u.id);
    });
    if (remoto) enviar('react', { id: id, tipo: tipo });
    return r;
  }
  function totalReacoes(p) { var n = 0; Object.keys(p.reacoes || {}).forEach(function (k) { n += p.reacoes[k].length; }); return n; }

  /* ---------- remix: abre uma cópia no editor, com o crédito guardado para quando o aluno compartilhar ---------- */
  var remixAtual = null;
  function remixar(id, jaTentou) {
    var p = achar(id), ws = window.Code && Code.workspace;
    if (!p && remoto && !jaTentou) { sincronizar().then(function () { remixar(id, true); }); return true; }   // projeto novo que este cache ainda não tinha
    if (!p || !ws) return false;
    // o remix vira um PROJETO NOVO na lista do aluno: o que ele estava montando continua guardado no projeto anterior
    if (window.UI && UI['account'] && UI['account'].importProject) UI['account'].importProject(p.xml);
    else { try { Blockly.Events.setGroup(true); ws.clear(); Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(p.xml), ws); } finally { Blockly.Events.setGroup(false); } }
    try { ws.scrollCenter(); } catch (e) { /* ok */ }
    remixAtual = { id: p.id, titulo: p.titulo, autor: p.autor };
    if (remoto) enviar('remix', { id: id }); else atualizar(id, function (x) { x.remixes = (x.remixes || 0) + 1; });
    var aba = document.getElementById('tab_blocks'); if (aba) aba.click();
    try { UI['notify'].send('Aberto como projeto novo! Você está editando uma cópia de "' + p.titulo + '", de ' + p.autor + '.'); } catch (e) { /* ok */ }
    return true;
  }

  /* ---------- link do projeto: aponta para um projeto da GALERIA (nada é enviado a servidores de terceiros) ---------- */
  function linkDe(id) { return location.origin + location.pathname + '?galeria=' + encodeURIComponent(id); }
  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return copiarAntigo(texto); });
    return Promise.resolve(copiarAntigo(texto));
  }
  function copiarAntigo(texto) {
    try { var t = document.createElement('textarea'); t.value = texto; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); var ok = document.execCommand('copy'); t.remove(); return ok; } catch (e) { return false; }
  }
  /** Abre o projeto de um link (?galeria=ID) como projeto novo. Só abre o que esta pessoa pode ver. */
  function abrirDoLink(id) {
    var ir = function () {
      var p = achar(id);
      if (!p) { try { UI['notify'].send('Não encontrei esse projeto da galeria. Ele pode ser só de uma turma, ainda esperar o professor aprovar, ou ter sido apagado.'); } catch (e) { /* ok */ } return; }
      remixar(id, true);
    };
    if (remoto === null) { var iv = setInterval(function () { if (remoto !== null) { clearInterval(iv); sincronizar().then(ir); } }, 200); } else sincronizar().then(ir);
  }

  /* ---------- miniatura: desenha a pilha de blocos em SVG (sem imagens, funciona offline) ---------- */
  var COR = { prep: '#FF7B6B', move: '#4C9FFF', sense: '#1FD3C0', decide: '#FF9A3C', repeat: '#FFD23F', time: '#A58BFF', more: '#A9B6D8' };
  function tipoCor(t) {
    var pal = (window.SancaBotConfig && SancaBotConfig.palette) || COR;
    if (/config|calibrate/.test(t)) return pal.prep || COR.prep;
    if (/move|stop|turn/.test(t)) return pal.move || COR.move;
    if (/sensor|ultrasonic|distance/.test(t)) return pal.sense || COR.sense;
    if (/repeat|loop|while/.test(t)) return pal.repeat || COR.repeat;
    if (/wait|time/.test(t)) return pal.time || COR.time;
    if (/if|logic|compare/.test(t)) return pal.decide || COR.decide;
    return pal.more || COR.more;
  }
  var ACOES = { FORWARD: 'andar', BACKWARD: 'voltar', LEFT: 'girar ←', RIGHT: 'girar →' };
  function rotulo(b) {
    var t = b.getAttribute('type') || '', f = {}; for (var i = 0; i < b.children.length; i++) if (b.children[i].tagName === 'field') f[b.children[i].getAttribute('name')] = b.children[i].textContent;
    if (/config/.test(t)) return 'preparar'; if (/move/.test(t)) return ACOES[f.ACTION] || 'mover'; if (/stop/.test(t)) return 'parar'; if (/wait/.test(t)) return 'esperar';
    if (/repeat_times/.test(t)) return 'repetir'; if (/repeat/.test(t)) return 'repetir até'; if (/distance_sensor/.test(t)) return 'sensor'; if (/calibrate/.test(t)) return 'corrigir';
    return t.replace(/^sancabot_/, '').replace(/_/g, ' ').slice(0, 12);
  }
  function miniatura(xml) {
    var doc; try { doc = new DOMParser().parseFromString(xml || '', 'text/xml'); } catch (e) { return ''; }
    var raiz = doc.documentElement; if (!raiz || raiz.querySelector('parsererror')) return '';
    var linhas = [];
    function cadeia(b, prof) {
      while (b) {
        linhas.push({ t: b.getAttribute('type') || '', r: rotulo(b), p: prof });
        for (var i = 0; i < b.children.length; i++) if (b.children[i].tagName === 'statement') { var f = b.children[i].querySelector(':scope > block'); if (f) cadeia(f, prof + 1); }
        var nx = null; for (var j = 0; j < b.children.length; j++) if (b.children[j].tagName === 'next') nx = b.children[j].querySelector(':scope > block');
        b = nx;
      }
    }
    var topo = []; for (var k = 0; k < raiz.children.length; k++) if (raiz.children[k].tagName === 'block') topo.push(raiz.children[k]);
    topo.forEach(function (b) { cadeia(b, 0); });
    if (!linhas.length) return '';
    var MAX = 7, extra = linhas.length - MAX, vis = linhas.slice(0, MAX), h = 26, s = '';
    vis.forEach(function (l, i) {
      var x = 14 + l.p * 16, y = 12 + i * h, w = 150 - l.p * 16;
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="22" rx="8" fill="' + tipoCor(l.t) + '"/>' +
        '<text x="' + (x + 10) + '" y="' + (y + 15) + '" font-size="11.5" font-weight="800" fill="#1B2250">' + esc(l.r) + '</text>';
    });
    if (extra > 0) s += '<text x="16" y="' + (12 + MAX * h + 10) + '" font-size="11" font-weight="800" fill="#6b7396">+ ' + extra + ' blocos</text>';
    var alto = 12 + Math.min(linhas.length, MAX) * h + (extra > 0 ? 18 : 6);
    return '<svg viewBox="0 0 180 ' + alto + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Miniatura dos blocos" style="font-family:Nunito,system-ui,sans-serif">' + s + '</svg>';
  }
  function resumoMissao() {   // missão atual do simulador, se houver (para ligar o projeto às estrelas)
    var s = window.SancaBotSim && SancaBotSim.result && SancaBotSim.result(); return s ? { veredito: s.veredito } : null;
  }

  window.SancaBotGaleria = {
    reacoes: REACOES, usuario: usuario, definirPapel: definirPapel, listar: listar, achar: achar, publicar: publicar, aprovar: aprovar, recusar: recusar, remover: remover,
    reagir: reagir, totalReacoes: totalReacoes, contarPendentes: contarPendentes, remixar: remixar, miniatura: miniatura, tituloValido: tituloValido,
    aoMudar: function (f) { ouvintes.push(f); }, modo: function () { return remoto === null ? 'carregando' : remoto ? 'servidor' : 'local'; }, sincronizar: sincronizar, remixAtual: function () { return remixAtual; }, esc: esc
  };
  window.addEventListener('storage', function (e) { if (!remoto && (e.key === KEY || e.key === KEY_USER)) avisar(); });
  descobrir();

  /* ======================================================================
     2) Editor: "Compartilhar na galeria" (menu Projeto) e a janela de publicar
     ====================================================================== */
  var G = window.SancaBotGaleria, dlg = null;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  function xmlAtual() { var ws = window.Code && Code.workspace; return ws ? Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(ws)) : ''; }
  function estrelasDaMissao() {
    var t = null; try { var m = JSON.parse(localStorage.getItem('sancabot_estrelas') || '{}'), k = Object.keys(m); if (k.length) t = m; } catch (e) { /* ok */ }
    return t;
  }
  function fechar() { if (dlg) { dlg.remove(); dlg = null; document.removeEventListener('keydown', teclas, true); } }
  function teclas(e) { if (e.key === 'Escape') fechar(); }

  function abrir() {
    fechar(); document.querySelectorAll('.sbg-toast').forEach(function (t) { t.remove(); });
    var ws = window.Code && Code.workspace, xml = xmlAtual(), temBlocos = ws && ws.getAllBlocks(false).length > 0;
    var u = G.usuario(), rm = G.remixAtual();
    if (u.papel === 'visitante') return avisoLogin();
    dlg = el('div', 'sbg-overlay'); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'Compartilhar na galeria');
    var card = el('div', 'sbg-dialog');
    card.innerHTML =
      '<button type="button" class="sbg-x" aria-label="Fechar">×</button>' +
      '<h2>Compartilhar na galeria</h2>' +
      '<div class="sbg-prev">' + (G.miniatura(xml) || '<p>Monte alguns blocos antes de compartilhar.</p>') + '</div>' +
      '<label class="sbg-lbl" for="sbgTitulo">Nome do projeto</label>' +
      '<input id="sbgTitulo" class="sbg-input" maxlength="40" placeholder="Ex.: Meu quadrado perfeito" autocomplete="off">' +
      '<label class="sbg-lbl" for="sbgDesc">Uma frase sobre ele (opcional)</label>' +
      '<input id="sbgDesc" class="sbg-input" maxlength="140" placeholder="Ex.: Repeti 4 vezes andar e girar." autocomplete="off">' +
      (rm ? '<p class="sbg-credit">🔁 Baseado em <b>' + G.esc(rm.titulo) + '</b>, de ' + G.esc(rm.autor) + '. O crédito aparece no cartão.</p>' : '') +
      '<div class="sbg-lbl">Quem pode ver?</div>' +
      '<div class="sbg-opts" role="radiogroup">' +
        opt('privado', '🔒', 'Só eu', 'Fica guardado na galeria, só você vê.', false) +
        opt('turma', '👥', 'Minha turma', 'Aparece na hora para a ' + G.esc(u.turma) + '.', true) +
        opt('comunidade', '🌎', 'Comunidade', u.papel === 'professor' ? 'Todos podem ver.' : 'O professor precisa aprovar antes de aparecer.', false) +
      '</div>' +
      '<p class="sbg-erro" role="alert" hidden></p>' +
      '<div class="sbg-acoes"><button type="button" class="sbg-btn sbg-sec" data-a="cancelar">Cancelar</button><button type="button" class="sbg-btn sbg-main" data-a="publicar">Compartilhar</button></div>';
    dlg.appendChild(card); document.body.appendChild(dlg);
    var titulo = card.querySelector('#sbgTitulo'); setTimeout(function () { titulo.focus(); }, 30);
    card.querySelector('.sbg-x').onclick = fechar; card.querySelector('[data-a="cancelar"]').onclick = fechar;
    dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) fechar(); });
    document.addEventListener('keydown', teclas, true);
    var erro = card.querySelector('.sbg-erro');
    function enviarProjeto() {
      if (!temBlocos) { erro.textContent = 'Seu projeto ainda não tem blocos. Monte um programa e volte aqui.'; erro.hidden = false; return; }
      var visib = card.querySelector('input[name="sbgVisib"]:checked').value, btn = card.querySelector('[data-a="publicar"]');
      btn.disabled = true; erro.hidden = true;
      G.publicar({ titulo: titulo.value, descricao: card.querySelector('#sbgDesc').value, visib: visib, xml: xml, remixDe: rm, estrelas: melhorEstrela() }).then(function (r) {
        btn.disabled = false;
        if (!r.ok) { erro.textContent = r.erro; erro.hidden = false; titulo.focus(); return; }
        fechar(); confirmar(r.projeto);
      });
    }
    card.querySelector('[data-a="publicar"]').onclick = enviarProjeto;
    titulo.addEventListener('keydown', function (e) { if (e.key === 'Enter') enviarProjeto(); });
  }
  function avisoLogin() {
    dlg = el('div', 'sbg-overlay'); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
    dlg.innerHTML = '<div class="sbg-dialog"><button type="button" class="sbg-x" aria-label="Fechar">×</button><h2>Entre para compartilhar</h2><p class="sbg-det-desc">Para compartilhar na galeria você precisa entrar na sua conta do SancaBot Studio. Seus blocos continuam aqui, nada se perde.</p><div class="sbg-acoes"><button type="button" class="sbg-btn sbg-sec" data-a="x">Agora não</button><a class="sbg-btn sbg-main" href="/studio/" target="_blank" rel="noopener" style="text-decoration:none">Entrar</a></div></div>';
    document.body.appendChild(dlg); dlg.querySelector('.sbg-x').onclick = fechar; dlg.querySelector('[data-a="x"]').onclick = fechar;
    dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) fechar(); }); document.addEventListener('keydown', teclas, true);
  }
  function opt(v, ico, nome, desc, on) {
    return '<label class="sbg-opt"><input type="radio" name="sbgVisib" value="' + v + '"' + (on ? ' checked' : '') + '><span class="sbg-card"><i>' + ico + '</i><b>' + nome + '</b><small>' + desc + '</small></span></label>';
  }
  function melhorEstrela() { var e = estrelasDaMissao(), best = 0; if (e) Object.keys(e).forEach(function (k) { best = Math.max(best, +e[k] || 0); }); return best; }
  function confirmar(p) {
    var msg = { privado: 'Projeto guardado. Só você vê.', turma: 'Projeto compartilhado com a turma! 🎉', pendente: 'Enviado! Assim que o professor aprovar, ele aparece na Comunidade.', publico: 'Projeto publicado na Comunidade! 🎉' }[p.estado] || 'Pronto!';
    try { UI['notify'].send(msg); } catch (e) { /* ok */ }
    var t = el('div', 'sbg-toast'), temLink = p.id && (p.estado === 'turma' || p.estado === 'publico' || p.estado === 'pendente');
    t.innerHTML = '<span>' + msg + '</span><button type="button" data-a="ver">Ver na galeria</button>' + (temLink ? '<button type="button" data-a="link">Copiar link</button>' : '');
    document.body.appendChild(t);
    t.querySelector('[data-a="ver"]').onclick = function () { var a = document.getElementById('tab_programs'); if (a) a.click(); t.remove(); };
    if (temLink) t.querySelector('[data-a="link"]').onclick = function () { var b = this; copiar(linkDe(p.id)).then(function (ok) { b.textContent = ok ? 'Link copiado!' : 'Não consegui copiar'; }); };
    setTimeout(function () { t.remove(); }, 7000);
  }

  /** "Gerar link do projeto": copia o link de um projeto seu que já está na galeria, ou leva a compartilhar o projeto atual. */
  function abrirLink() {
    fechar(); document.querySelectorAll('.sbg-toast').forEach(function (t) { t.remove(); });
    var u = G.usuario();
    dlg = el('div', 'sbg-overlay'); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'Link do projeto');
    var meus = u.papel === 'visitante' ? [] : G.listar('meus').filter(function (p) { return p.estado === 'turma' || p.estado === 'publico' || p.estado === 'pendente'; });
    var linhas = meus.map(function (p) {
      return '<div class="sbg-linha"><div><b>' + G.esc(p.titulo) + '</b><small>' + ({ turma: '👥 Turma', publico: '🌎 Comunidade', pendente: '⏳ Esperando o professor' }[p.estado]) + '</small></div><button type="button" class="sbg-btn sbg-sec" data-id="' + p.id + '">Copiar link</button></div>';
    }).join('');
    dlg.innerHTML = '<div class="sbg-dialog"><button type="button" class="sbg-x" aria-label="Fechar">×</button><h2>Link do projeto</h2>' +
      '<p class="sbg-det-desc">O link leva a um projeto que está na <b>Galeria</b>. Quem abrir recebe uma cópia, como projeto novo.</p>' +
      (u.papel === 'visitante' ? '<p class="sbg-credit">Entre na sua conta do SancaBot Studio para compartilhar e gerar links.</p>' :
        (linhas ? '<div class="sbg-lbl">Seus projetos na galeria</div>' + linhas : '<p class="sbg-credit">Você ainda não compartilhou nenhum projeto.</p>')) +
      '<div class="sbg-acoes"><button type="button" class="sbg-btn sbg-sec" data-a="x">Fechar</button>' + (u.papel === 'visitante' ? '<a class="sbg-btn sbg-main" href="/studio/" target="_blank" rel="noopener" style="text-decoration:none">Entrar</a>' : '<button type="button" class="sbg-btn sbg-main" data-a="novo">Compartilhar o projeto atual…</button>') + '</div></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('.sbg-x').onclick = fechar; dlg.querySelector('[data-a="x"]').onclick = fechar;
    var novo = dlg.querySelector('[data-a="novo"]'); if (novo) novo.onclick = function () { fechar(); abrir(); };
    dlg.addEventListener('click', function (e) { var b = e.target.closest('[data-id]'); if (b) copiar(linkDe(b.getAttribute('data-id'))).then(function (ok) { b.textContent = ok ? 'Link copiado!' : 'Não consegui copiar'; }); });
    dlg.addEventListener('mousedown', function (e) { if (e.target === dlg) fechar(); }); document.addEventListener('keydown', teclas, true);
  }

  function montarItem() {
    var menu = document.querySelector('.sb-actions-menu'); if (!menu || document.getElementById('galleryShareButton')) return false;
    var b = el('button', 'icon'); b.id = 'galleryShareButton'; b.type = 'button'; b.setAttribute('role', 'menuitem'); b.title = 'Compartilhar com a turma ou com a comunidade';
    var ref = document.getElementById('linkButton'); menu.insertBefore(b, ref || menu.firstChild);
    b.addEventListener('click', function () { setTimeout(abrir, 0); });
    var lk = document.getElementById('linkButton');   // "Gerar link do projeto": agora é da Galeria (antes enviava o projeto a um servidor do BIPES)
    if (lk) lk.addEventListener('click', function (e) { e.stopImmediatePropagation(); e.preventDefault(); setTimeout(abrirLink, 0); }, true);
    return true;
  }
  window.SancaBotGaleria.abrirCompartilhar = abrir; window.SancaBotGaleria.abrirLink = abrirLink; window.SancaBotGaleria.linkDe = linkDe; window.SancaBotGaleria.copiar = copiar;
  function iniciarEditor() {   // só no editor: na página da galeria (iframe) não há cabeçalho
    if (!document.querySelector('.top-menu')) return;
    var tent = 0, iv = setInterval(function () { if (montarItem() || ++tent > 80) clearInterval(iv); }, 150);
    var id = new URLSearchParams(location.search).get('galeria');   // link de um projeto da galeria
    if (id) {
      var espera = 0, pronto = setInterval(function () {
        if (window.Code && Code.workspace && window.UI && UI['account'] && UI['account'].currentProject.uid || ++espera > 60) { clearInterval(pronto); history.replaceState(null, '', location.pathname); abrirDoLink(id); }
      }, 250);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarEditor); else iniciarEditor();
})();
