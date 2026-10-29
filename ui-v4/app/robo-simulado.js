/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot v4 (F3): ROBÔ SIMULADO para testar a ligação com o robô SEM o robô de verdade.
   Troca `navigator.serial` por uma porta de mentira que fala como o REPL do MicroPython: eco, prompts ">>> " e "... " com recuo,
   modo colar (Ctrl-E ... Ctrl-D), Ctrl-C (KeyboardInterrupt), Ctrl-D (reinício), sistema de arquivos (listar, ler, gravar, apagar, executar),
   erros (Traceback) e a saída `print`. Assim o código REAL de conexão (core/channel.js: webserial) e os arquivos (core/utils.js) rodam inteiros.
   NÃO é um emulador de MicroPython: só entende o que o editor envia (ver "COMANDOS ENTENDIDOS" abaixo). Serve para teste e para o aluno/professor
   conhecer o fluxo antes de ter o robô. Como usar: abra o editor com ?robo=simulado (aparece uma etiqueta "Robô simulado" no canto), clique em
   Conectar e escolha qualquer porta. Para testes: window.RoboSimulado (.arquivos, .diario, .dizer(texto)).

   COMANDOS ENTENDIDOS: import ...; os.listdir('.'); os.remove('x'); os.stat('x'); f=open('x','w'); f.write('...'); f.close();
   exec(open('./x').read(),globals()); leitura de arquivo em bloco (with open(...,'rb') ... sys.stdout.write(result));
   print("texto"); 1/0 (ZeroDivisionError); um nome solto (NameError); programas colados (Ctrl-E): cada chamada sancabot_trace("id","rótulo")
   imprime a linha SANCABOT_TRACE|id|rótulo|1, cada print("texto") imprime o texto, e `while True:` roda até o Ctrl-C. */
(function () {
  'use strict';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const PROMPT = '>>> ';
  const BANNER = 'MPY: soft reboot\r\nMicroPython v1.22.0 on 2024-01-01; SancaBot ESP32-C3 (simulado) with ESP32C3\r\nType "help()" for more information.\r\n';
  const TRACE_STEP_MS = 140;   // intervalo entre uma chamada de sancabot_trace e a seguinte

  class RoboSimulado {
    constructor() {
      this.arquivos = { 'boot.py': '# boot.py (robô simulado)\n', 'main.py': 'print("Olá do robô simulado!")\n' };
      this.diario = [];          // tudo que o editor enviou (texto), para os testes
      this.push = null;          // função que escreve para o editor
      this.reset_();
    }
    reset_() {
      this.modo = 'normal';      // normal | colar | rodando
      this.linha = ''; this.bloco = []; this.recuo = 0; this.vazias = 0; this.colado = '';
      this.arquivoAberto = null; this.timers = [];
    }
    out(t) { if (this.push) this.push(t); }
    dizer(t) { this.out(t.replace(/\r?\n/g, '\r\n') + '\r\n'); }   // o robô "imprime" algo (para testes)

    /** Recebe bytes do editor. */
    entrada(bytes) {
      const texto = dec.decode(bytes);
      this.diario.push(texto);
      for (const ch of texto) this.tecla(ch);
    }

    tecla(ch) {
      if (this.modo === 'rodando') { if (ch === '\x03') this.interromper(); return; }
      if (this.modo === 'colar') return this.teclaColar(ch);
      switch (ch) {
        case '\x03': this.linha = ''; this.bloco = []; this.recuo = 0; this.vazias = 0; this.out('\r\n' + PROMPT); break;
        case '\x04': this.reset_(); this.out('\r\n' + BANNER + PROMPT); break;   // reinício suave
        case '\x05': this.modo = 'colar'; this.colado = ''; this.out('\r\npaste mode; Ctrl-C to cancel, Ctrl-D to finish\r\n=== '); break;
        case '\b':
          if (this.linha !== '') { this.linha = this.linha.slice(0, -1); this.out('\b \b'); }
          else if (this.bloco.length && this.recuo >= 4) { this.recuo -= 4; this.out('\b\b\b\b'); }   // sai de um nível do bloco
          break;
        case '\r': case '\n': this.enter(); break;
        default: if (ch >= ' ') { this.linha += ch; this.out(ch); }
      }
    }

    /** Enter no REPL normal: linhas simples, ou blocos (if/while/with...) que só rodam depois de linhas vazias. */
    enter() {
      const l = this.linha; this.linha = '';
      if (this.bloco.length === 0) {
        if (l.trim() === '') { this.out('\r\n' + PROMPT); return; }
        if (l.trimEnd().endsWith(':')) { this.bloco = [l]; this.recuo = 4; this.vazias = 0; this.out('\r\n... ' + ' '.repeat(this.recuo)); return; }
        this.out('\r\n'); this.executar([l]); return;
      }
      if (l.trim() !== '') {
        this.vazias = 0; this.bloco.push(' '.repeat(this.recuo) + l);
        if (l.trimEnd().endsWith(':')) this.recuo += 4;
        this.out('\r\n... ' + ' '.repeat(this.recuo)); return;
      }
      this.vazias++;   // linhas vazias: a 1ª repete o recuo, a 2ª volta a zero, a 3ª executa
      if (this.vazias === 1) this.out('\r\n... ' + ' '.repeat(this.recuo));
      else if (this.vazias === 2) { this.recuo = 0; this.out('\r\n... '); }
      else { const b = this.bloco; this.bloco = []; this.recuo = 0; this.vazias = 0; this.out('\r\n'); this.executar(b); }
    }

    /** Modo colar: eco com "=== ", Ctrl-D executa, Ctrl-C cancela. */
    teclaColar(ch) {
      if (ch === '\x04') { const codigo = this.colado; this.colado = ''; this.modo = 'normal'; this.out('\r\n'); this.rodarPrograma(codigo); return; }
      if (ch === '\x03') { this.modo = 'normal'; this.colado = ''; this.out('\r\n' + PROMPT); return; }
      if (ch === '\r' || ch === '\n') { this.colado += '\n'; this.out('\r\n=== '); return; }
      this.colado += ch; this.out(ch);
    }

    /* ---------- execução de comandos simples ---------- */
    executar(linhas) {
      const codigo = linhas.join('\n');
      try { this.out(this.avaliar(codigo)); } catch (e) { this.out(this.traceback(e)); }
      if (this.modo === 'normal') this.out(PROMPT);
    }
    traceback(e) {
      if (e instanceof ErroPython) return 'Traceback (most recent call last):\r\n  File "<stdin>", line 1, in <module>\r\n' + e.message + '\r\n';
      return 'Traceback (most recent call last):\r\n  File "<stdin>", line 1, in <module>\r\nRuntimeError: ' + e.message + '\r\n';
    }
    /** Entende só o que o editor manda (ver o cabeçalho). Devolve o texto que o REPL imprimiria. */
    avaliar(codigo) {
      // leitura de arquivo em bloco: with open('x', 'rb') as infile: ... sys.stdout.write(result)
      let m = codigo.match(/with open\('([^']+)', 'rb'\) as infile:[\s\S]*sys\.stdout\.write\(result\)/);
      if (m) { if (!(m[1] in this.arquivos)) throw new ErroPython("OSError: [Errno 2] ENOENT"); return this.arquivos[m[1]]; }

      let saida = '';
      for (let st of codigo.split(/\n|;/)) {
        st = st.trim(); if (!st || /^import\s/.test(st) || /^from\s/.test(st)) continue;
        if ((m = st.match(/^os\.listdir\('([^']*)'\)$/))) { saida += '[' + Object.keys(this.arquivos).map(n => `'${n}'`).join(', ') + ']\r\n'; continue; }
        if ((m = st.match(/^os\.remove\('([^']+)'\)$/))) { if (!(m[1] in this.arquivos)) throw new ErroPython("OSError: [Errno 2] ENOENT"); delete this.arquivos[m[1]]; continue; }
        if ((m = st.match(/^os\.stat\('([^']+)'\)$/))) { if (!(m[1] in this.arquivos)) throw new ErroPython("OSError: [Errno 2] ENOENT"); saida += `(32768, 0, 0, 0, 0, 0, ${this.arquivos[m[1]].length}, 0, 0, 0)\r\n`; continue; }
        if ((m = st.match(/^f\s*=\s*open\('([^']+)',\s*'w'\)$/))) { this.arquivoAberto = { nome: m[1], dados: '' }; continue; }
        if ((m = st.match(/^f\.write\('([\s\S]*)'\)$/))) {
          if (!this.arquivoAberto) throw new ErroPython("NameError: name 'f' isn't defined");
          const t = desescapar(m[1]); this.arquivoAberto.dados += t; saida += t.length + '\r\n'; continue;
        }
        if (st === 'f.close()') { if (this.arquivoAberto) { this.arquivos[this.arquivoAberto.nome] = this.arquivoAberto.dados; this.arquivoAberto = null; } continue; }
        if ((m = st.match(/^exec\(open\('\.?\/?([^']+)'\)\.read\(\),globals\(\)\)$/))) {
          if (!(m[1] in this.arquivos)) throw new ErroPython("OSError: [Errno 2] ENOENT");
          this.out(saida); saida = ''; this.rodarPrograma(this.arquivos[m[1]], true); return '';
        }
        if ((m = st.match(/^print\((["'])(.*)\1\)$/))) { saida += m[2] + '\r\n'; continue; }
        if (/^\d+\s*\/\s*0$/.test(st)) throw new ErroPython('ZeroDivisionError: divide by zero');
        if ((m = st.match(/^([A-Za-z_]\w*)$/))) throw new ErroPython(`NameError: name '${m[1]}' isn't defined`);
        if (/^[\w.]+\(.*\)$/.test(st) || /^\w+\s*=/.test(st)) continue;   // chamadas e atribuições que o simulador não entende: ignora em silêncio
        throw new ErroPython('SyntaxError: invalid syntax');
      }
      return saida;
    }

    /* ---------- programas (modo colar ou arquivo) ---------- */
    rodarPrograma(codigo, deArquivo) {
      const eventos = [];
      for (const l of codigo.split('\n')) {
        let m;
        if ((m = l.match(/^\s*sancabot_trace\("([^"]*)",\s*"([^"]*)"\)\s*$/))) eventos.push(`SANCABOT_TRACE|${m[1]}|${m[2]}|1\r\n`);
        else if ((m = l.match(/^\s*print\((["'])([^"']*)\1\)\s*$/))) eventos.push(m[2] + '\r\n');
        else if (/^\s*1\s*\/\s*0\s*$/.test(l)) eventos.push(new ErroPython('ZeroDivisionError: divide by zero'));
      }
      const infinito = /^\s*while True:/m.test(codigo.replace(/def sancabot_trace[\s\S]*?\n(?=\S)/, ''));
      this.modo = 'rodando'; let i = 0;
      const passo = () => {
        if (this.modo !== 'rodando') return;
        if (i >= eventos.length) {
          if (!infinito || eventos.length === 0) return this.terminar();
          i = 0; this.timers.push(setTimeout(passo, TRACE_STEP_MS * 2)); return;
        }
        const e = eventos[i++];
        if (e instanceof ErroPython) { this.out(this.traceback(e)); return this.terminar(); }
        this.out(e); this.timers.push(setTimeout(passo, TRACE_STEP_MS));
      };
      this.timers.push(setTimeout(passo, 30));
    }
    terminar() { this.timers.forEach(clearTimeout); this.timers = []; this.modo = 'normal'; this.out(PROMPT); }
    interromper() {
      this.timers.forEach(clearTimeout); this.timers = []; this.modo = 'normal';
      this.out('\r\nTraceback (most recent call last):\r\n  File "<stdin>", line 1, in <module>\r\nKeyboardInterrupt: \r\n' + PROMPT);
    }
  }
  class ErroPython extends Error {}
  function desescapar(s) { return s.replace(/\\(r|n|t|\\|'|")/g, (m, c) => ({ r: '\r', n: '\n', t: '\t' }[c] || c)); }

  /* ---------- a "porta serial" de mentira, no formato da Web Serial API ---------- */
  const robo = new RoboSimulado();
  class PortaFalsa {
    open() {
      return new Promise(res => setTimeout(() => {
        this.readable = new ReadableStream({ start: c => { this.ctl = c; robo.push = t => { try { c.enqueue(enc.encode(t)); } catch (e) { /* fechada */ } }; } });
        this.writable = new WritableStream({ write: chunk => robo.entrada(chunk), close: () => { robo.push = null; } });
        res();
      }, 20));
    }
    close() { try { this.ctl.close(); } catch (e) { /* ok */ } robo.push = null; return Promise.resolve(); }
  }
  const serialFalso = { requestPort: () => new Promise(res => setTimeout(() => res(new PortaFalsa()), 20)) };
  Object.defineProperty(navigator, 'serial', { value: serialFalso, configurable: true });
  window.RoboSimulado = robo;

  // etiqueta visível: o aluno sabe que não é o robô de verdade
  const mostrar = () => {
    if (!document.body) return;
    const t = document.createElement('div');
    t.textContent = '🤖 Robô simulado (teste)';
    t.style.cssText = 'position:fixed;left:.6rem;bottom:.6rem;z-index:2000;padding:.3rem .7rem;border-radius:999px;background:#FFD23F;color:#1B2250;font:800 12px Nunito,system-ui,sans-serif;box-shadow:0 2px 0 rgba(27,34,80,.25);pointer-events:none';
    document.body.appendChild(t);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mostrar); else mostrar();
})();
