# Arquitetura

Atualizado em 2026-10-28. Resumo: **editor estático** (`bipes-sancabot/ui`) + **API PHP** (`sancabot-studio/api`) no mesmo domínio. O robô fala por Serial, Bluetooth ou Wi-Fi diretamente do navegador.

## 1. Visão geral

```
 Aluno / Professor (navegador)
   │
   ├─ Editor  ── /bipes/  (bipes-sancabot/ui: HTML + JS + CSS estáticos)
   │     ├─ Blockly 13 (blocos, simulador, galeria, Console)
   │     ├─ Conexão com o robô: Web Serial / Web Bluetooth / WebSocket  ──►  Robô SancaBot (ESP32-C3, MicroPython)
   │     └─ localStorage / sessionStorage: projetos, estrelas, aba e posição
   │
   └─ Studio  ── /studio/  (sancabot-studio: páginas + API PHP)
         ├─ api/login.php     sessão (cookie assinado) via loja
         ├─ api/blocks.php    blocos do Creator (publicados → catálogo)
         ├─ api/gallery.php   galeria (projetos, aprovação, curtidas, remix)
         └─ data/*.json       armazenamento em arquivo (DATA_DIR, fora do public_html)

 Loja (OpenCart, simulada no dev) ── identidade e assinatura, chamada só servidor-a-servidor
```

Ambiente local: `dev-local/dev.sh up` sobe um contêiner `php:8.3-cli` com roteador único em `http://localhost:8090` (`/studio/`, `/bipes/`, `/loja/`, `/bipes-v1/`, `/bipes-v2/`).

## 2. Camadas do editor

| Camada | Arquivos principais | Observação |
|---|---|---|
| **Núcleo do BIPES (herdado)** | `core/code.js`, `ui.js`, `utils.js`, `channel.js`, `storage.js`, `style.css`, `index.html` | Conexão com o robô, arquivos, projetos, estrutura da página. **É o que o M8 pretende substituir.** |
| **Blockly 13** | `core/blockly13/*`, `sancabot_blockly_compat.js` | Camada de compatibilidade para o código antigo continuar funcionando. |
| **Blocos e geração de Python** | `block_definitions*.js`, `generator_stubs*.js`, `sancabot_custom_*.js`, `toolbox/sancabot.xml` | 29 blocos do SancaBot + 739 definições herdadas (a caixa usa 193 tipos de bloco no total). |
| **Aparência v3** | `sancabot_config.js` (parâmetros), `sancabot_scratch*.js/css`, `sancabot_icons.js`, `sancabot_block_roles.js` | Paleta, fonte, ícones e papéis de cor. |
| **Camada de interface sobre o BIPES** | `sancabot_layout.css/js`, `sancabot_header_early.js`, `sancabot_panels.css/js`, `sancabot_empty.css`, `sancabot_session.js` | Redesenha cabeçalho, painéis e abas **por cima** do HTML antigo (muitas regras com `!important`). |
| **Português** | `sancabot_i18n_ptbr*.js`, `sancabot_reference*.js`, `sancabot_console_ptbr.js`, `msg/pt-br.js` | Só altera o que se vê; o código digitado e o Python gerado não mudam. |
| **Simulador e missões** | `sancabot_sim.js/css`, `sancabot_sim_examples.js` | Roda no navegador; evento `sancabot:missao`. |
| **Galeria** | `sancabot_gallery.js/css`, `sancabot_gallery_page.js`, `shared.html` | Dois modos: servidor ou local de demonstração. |

## 3. Fluxos principais

**Rodar no robô:** blocos → `Blockly.Python` → texto Python → `mux` (Serial, Bluetooth ou WebSocket) → robô. O botão Rodar muda de estado conforme `mux.connected()` e o status do `workspace`.

**Simular:** blocos → `runProgram` (percurso com tempo) → `trace` + `events` → desenho no tablado, destaque do bloco (`sb-running`) e medida do desvio → veredito e estrelas → `localStorage['sancabot_estrelas']` e evento `sancabot:missao`.

**Compartilhar:** janela do editor → `SancaBotGaleria.publicar` → `POST gallery.php?action=publish` → servidor valida (tamanho, XML, tipos de bloco), define o estado (`turma`, `pendente`, `privado`; `publico` só se quem envia é professor) → cache do cliente atualizado a cada 30 s e ao focar.

**Retomar a sessão:** `sancabot_session.js` grava blocos (`BlocklyStorage.backupBlocks_`), aba e posição ao esconder a página; ao abrir, restaura a aba assim que os cliques existem e a posição quando os blocos carregam. `sancabot_header_early.js` + a classe `html.sb-boot` evitam a piscada.

## 4. Modelo de dados da galeria (`gallery.json`)

```
projects[]: { id, titulo, autor (apelido), autorId, turma, xml, estado, visib, missao, estrelas(0–3),
              descricao, criado, reacoes{estrela[], foguete[], ideia[]}, remixDe{id,titulo,autor}|null, remixes, motivo? }
estado: privado | turma | pendente | publico | recusado
```
O navegador nunca recebe ids de quem curtiu (só contagem; `me` marca a curtida própria).

## 5. Papéis e permissões

| Ação | Visitante | Aluno | Professor (admin) |
|---|---|---|---|
| Ver a Comunidade | ✅ | ✅ | ✅ |
| Ver a turma e "Meus projetos" | — | ✅ | ✅ |
| Compartilhar, curtir, remixar | — | ✅ | ✅ |
| Publicar direto na Comunidade | — | pede aprovação | ✅ |
| Aprovar ou recusar | — | — | ✅ |
| Excluir | — | o próprio | qualquer |
| Criar blocos no Creator | — | — | ✅ |

Provisório: admin do Studio = professor; todos os alunos na turma `geral`.

## 6. Versões
`SancaBotConfig.version` informa a versão; v1 e v2 ficam congeladas em `dev-local/versoes/` (ver [VERSOES.md](../VERSOES.md)). O Python gerado é idêntico entre versões.
