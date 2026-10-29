/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: tela da galeria (shared.html). Desenha as abas e os cartões com os dados de SancaBotGaleria. */
(function () {
  'use strict';
  var G = window.SancaBotGaleria, lista = document.getElementById('gLista'), aba = 'turma', esc = G.esc;
  var ROT = { privado: '🔒 Só eu', turma: '👥 Turma', pendente: '⏳ Esperando o professor', publico: '🌎 Comunidade', recusado: '✋ Precisa de ajustes' };
  var VAZIO = {
    turma: ['Ainda não há projetos da turma', 'Seja o primeiro a compartilhar um projeto com a turma!'],
    comunidade: ['A comunidade ainda está vazia', 'Os projetos aprovados pelo professor aparecem aqui.'],
    meus: ['Você ainda não compartilhou nada', 'Monte seus blocos e use o botão abaixo para guardar ou compartilhar.'],
    pendentes: ['Nada para aprovar', 'Quando um aluno pedir para publicar na comunidade, o projeto aparece aqui.']
  };
  function estrelas(n) { return n ? '<span class="sbg-stars" aria-label="' + n + ' de 3 estrelas">' + '★'.repeat(n) + '☆'.repeat(3 - n) + '</span>' : ''; }
  function data(t) { var d = Math.floor((Date.now() - t) / 864e5); return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : 'há ' + d + ' dias'; }

  function cartao(p, u) {
    var meu = p.autorId === u.id, prof = u.papel === 'professor';
    var mostraEstado = aba === 'meus' || aba === 'pendentes';
    var chips = G.reacoes.map(function (r) {
      var a = (p.reacoes && p.reacoes[r.id]) || [], on = a.indexOf(u.id) >= 0;
      return '<button type="button" class="sbg-chip" data-r="' + r.id + '" aria-pressed="' + on + '" title="' + r.nome + '">' + r.emoji + ' ' + a.length + '</button>';
    }).join('');
    var acoes = '';
    if (aba === 'pendentes') acoes = '<div class="sbg-acoes-p"><button type="button" class="sbg-btn sbg-ok" data-a="aprovar">✔ Aprovar</button><button type="button" class="sbg-btn sbg-no" data-a="recusar">Pedir ajustes</button></div>';
    else if (meu || prof) acoes = '<div class="sbg-acoes-p"><button type="button" class="sbg-btn sbg-sec" data-a="excluir">Excluir</button></div>';
    return '<article class="sbg-card-p" data-id="' + p.id + '">' +
      (mostraEstado ? '<span class="sbg-estado ' + (p.estado === 'pendente' ? 'pend' : p.estado === 'recusado' ? 'rec' : '') + '">' + ROT[p.estado] + '</span>' : '') +
      '<button type="button" class="sbg-thumb" data-a="abrir" aria-label="Abrir ' + esc(p.titulo) + '">' + (G.miniatura(p.xml) || '<span class="sbg-vazio">Sem blocos</span>') + '</button>' +
      '<div class="sbg-body"><h3 class="sbg-titulo">' + esc(p.titulo) + '</h3>' +
      '<div class="sbg-meta"><span class="sbg-av" aria-hidden="true">' + esc((p.autor || '?').charAt(0).toUpperCase()) + '</span><span>' + esc(p.autor) + (meu ? ' (você)' : '') + '</span><span>· ' + data(p.criado) + '</span>' + estrelas(p.estrelas) + '</div>' +
      (p.missao ? '<div><span class="sbg-missao">🎯 ' + esc(p.missao) + '</span></div>' : '') +
      (p.remixDe ? '<div class="sbg-remix-de">🔁 Remix de ' + esc(p.remixDe.titulo) + ', de ' + esc(p.remixDe.autor) + '</div>' : '') +
      (p.estado === 'recusado' && p.motivo ? '<p class="sbg-aviso">' + esc(p.motivo) + '</p>' : '') +
      '<div class="sbg-react">' + chips + '<button type="button" class="sbg-chip sbg-remix" data-a="remix" title="Abrir uma cópia no editor">🔁 Remixar' + (p.remixes ? ' · ' + p.remixes : '') + '</button></div>' + acoes + '</div></article>';
  }

  function desenhar() {
    var u = G.usuario(), prof = u.papel === 'professor', n = G.contarPendentes();
    document.getElementById('gProf').checked = prof;
    var tp = document.querySelector('.sbg-tab[data-aba="pendentes"]'); tp.hidden = !prof; document.getElementById('gN').textContent = n; document.getElementById('gN').hidden = !n;
    if (aba === 'pendentes' && !prof) aba = 'turma';
    document.querySelectorAll('.sbg-tab').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-aba') === aba)); });
    var modo = G.modo();
    document.querySelector('.sbg-demo').hidden = modo !== 'local';
    if (modo === 'carregando') { lista.style.display = 'block'; lista.innerHTML = '<div class="sbg-vazio-pg"><img src="media/sancabot-face.svg" alt=""><h2>Carregando a galeria…</h2></div>'; return; }
    if (u.papel === 'visitante' && (aba === 'turma' || aba === 'meus')) {
      lista.style.display = 'block';
      lista.innerHTML = '<div class="sbg-vazio-pg"><img src="media/sancabot-face.svg" alt=""><h2>Entre para ver esta aba</h2><p>Os projetos da turma e os seus ficam na sua conta do SancaBot Studio. A aba Da comunidade está aberta para todos.</p><a class="sbg-btn sbg-main" href="/studio/" target="_blank" rel="noopener" style="text-decoration:none">Entrar</a></div>';
      return;
    }
    var itens = G.listar(aba);
    if (!itens.length) {
      lista.style.display = 'block';
      lista.innerHTML = '<div class="sbg-vazio-pg"><img src="media/sancabot-face.svg" alt=""><h2>' + VAZIO[aba][0] + '</h2><p>' + VAZIO[aba][1] + '</p>' + (aba !== 'pendentes' ? '<button type="button" class="sbg-btn sbg-main" data-a="compartilhar">＋ Compartilhar meu projeto</button>' : '') + '</div>';
      return;
    }
    lista.style.display = '';
    lista.innerHTML = itens.map(function (p) { return cartao(p, u); }).join('');
  }

  function detalhe(id) {
    var p = G.achar(id); if (!p) return;
    var ov = document.createElement('div'); ov.className = 'sbg-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="sbg-dialog"><button type="button" class="sbg-x" aria-label="Fechar">×</button><h2>' + esc(p.titulo) + '</h2>' +
      '<div class="sbg-prev">' + (G.miniatura(p.xml) || '<p>Sem blocos</p>') + '</div>' +
      '<div class="sbg-det-meta"><span>por <b>' + esc(p.autor) + '</b></span><span>' + data(p.criado) + '</span>' + estrelas(p.estrelas) + (p.missao ? '<span class="sbg-missao">🎯 ' + esc(p.missao) + '</span>' : '') + '</div>' +
      (p.descricao ? '<p class="sbg-det-desc">' + esc(p.descricao) + '</p>' : '') +
      (p.remixDe ? '<p class="sbg-remix-de">🔁 Remix de ' + esc(p.remixDe.titulo) + ', de ' + esc(p.remixDe.autor) + '</p>' : '') +
      '<div class="sbg-acoes"><button type="button" class="sbg-btn sbg-sec" data-a="fechar">Fechar</button><button type="button" class="sbg-btn sbg-main" data-a="remix">🔁 Remixar no editor</button></div></div>';
    document.body.appendChild(ov);
    function fim() { ov.remove(); document.removeEventListener('keydown', esc2, true); }
    function esc2(e) { if (e.key === 'Escape') fim(); }
    document.addEventListener('keydown', esc2, true);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fim(); });
    ov.querySelector('.sbg-x').onclick = fim; ov.querySelector('[data-a="fechar"]').onclick = fim;
    ov.querySelector('[data-a="remix"]').onclick = function () { fim(); remix(id); };
    ov.querySelector('.sbg-main').focus();
  }
  function remix(id) {
    var pai = window.parent && window.parent !== window ? window.parent.SancaBotGaleria : null;
    if (pai && pai.remixar) pai.remixar(id); else alert('O remix abre o projeto no editor. Abra a galeria dentro do SancaBot.');
  }
  function compartilhar() {
    var pai = window.parent && window.parent !== window ? window.parent.SancaBotGaleria : null;
    if (pai && pai.abrirCompartilhar) pai.abrirCompartilhar(); else alert('Para compartilhar, abra a galeria dentro do SancaBot.');
  }

  lista.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a], [data-r]'); if (!b) return;
    var c = b.closest('.sbg-card-p'), id = c && c.getAttribute('data-id'), a = b.getAttribute('data-a');
    if (b.getAttribute('data-r')) { G.reagir(id, b.getAttribute('data-r')); return; }
    if (a === 'abrir') detalhe(id); else if (a === 'remix') remix(id);
    else if (a === 'aprovar') G.aprovar(id);
    else if (a === 'recusar') { var m = window.prompt('O que o aluno pode melhorar? (aparece para ele)', 'Troque o nome do projeto ou capriche mais na descrição.'); if (m !== null) G.recusar(id, m); }
    else if (a === 'excluir') { if (window.confirm('Excluir este projeto da galeria?')) G.remover(id); }
    else if (a === 'compartilhar') compartilhar();
  });
  document.querySelector('.sbg-tabs').addEventListener('click', function (e) { var b = e.target.closest('.sbg-tab'); if (b) { aba = b.getAttribute('data-aba'); desenhar(); } });
  document.getElementById('gShare').addEventListener('click', compartilhar);
  document.getElementById('gProf').addEventListener('change', function (e) { G.definirPapel(e.target.checked ? 'professor' : 'aluno'); });
  G.aoMudar(desenhar); desenhar();
})();
