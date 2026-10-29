# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões do editor: v0 (BIPES original) → v1 → v2 → **v3** (em andamento). Datas no formato AAAA-MM-DD; quando o dia exato não foi registrado, aparece só o mês.

## [v4-dev] — interface própria (em desenvolvimento, `/bipes-v4/`)
### Alterado
- **v3 congelada** em `dev-local/versoes/v3` (`/bipes-v3/`) e API do Studio arquivada; `ui-v4` criada a partir dela. (2026-10-29)
- **Nomes de porta** do firmware (Servo 0 e 1, IR 5 e 6, Ultrassom 7 e 8; "pino N" nas demais); os blocos deixam de dizer "porta" antes do menu. (2026-10-29)
### Documentação
- **Roteiro de bancada** (`docs/projeto/ROTEIRO-DE-BANCADA.md`): passos A/B/C para testar a v4 com o robô real e medir, com folha de registro. (2026-10-29)
### Removido (2026-10-29)
- **Submódulo `blockly`** (apontava para um commit de setembro de 2024 do `google/blockly`, sem uso) e o alvo `git-clone` do `Makefile`; `make copy` só copia o `webrepl`. O Blockly 13.4.0 continua copiado em `core/blockly13/`. ADR-023.
### Adicionado (dois robôs, 2026-10-29)
- **Escolha entre SancaBot Free v1.0 e SancaBot v2** no cabeçalho, com os pinos conferidos no firmware (`mese-br/sancabot-firmware`): servo direito no 1 (Free) ou 21 (v2); contato 4 e Hall 2/3 só na v2. Nomes de porta nos blocos (`Servo direito (21)`), pinos padrão dos blocos novos, tabela na aba "Meu robô", nomes no bloco genérico de pinos e aviso (simulador e tela) quando um bloco usa pino de outro robô. O projeto guarda o robô (`DEVICE`) e o editor lembra a última escolha. Tabela única em `SancaBotConfig.robos`; ver `docs/projeto/ROBOS.md` e ADR-022. Suíte `robos` (11 verificações). Passo novo no tour.
### Adicionado (tour, 2026-10-29)
- **Tour pela plataforma** (`ui-v4/app/recursos/tour.js`): 21 passos que apresentam todos os recursos (telas, caixa de blocos e modo Avançado, painel de código/referência, simulador, conectar, rodar, modo passo a passo, menu Projeto, Console, Arquivos, galeria, Robô, perfil), trocando de tela sozinho. Abre pelo item "Conhecer a plataforma" do menu Projeto, com `?tour=1` (o antigo `?tour=prep` continua valendo) e sozinho na primeira visita (uma vez; não em navegador automatizado). Teclas ← → Esc; botões Voltar/Próximo/Sair. Suíte `tour` (6 verificações).
### Adicionado (tour, 2026-10-29)
- **Tour pela plataforma** (`ui-v4/app/recursos/tour.js`): 21 passos que apresentam todos os recursos (telas, caixa de blocos e modo Avançado, painel de código/referência, simulador, conectar, rodar, modo passo a passo, menu Projeto, Console, Arquivos, galeria, Robô, perfil), trocando de tela sozinho. Abre pelo item "Conhecer a plataforma" do menu Projeto, com `?tour=1` (o antigo `?tour=prep` continua valendo) e sozinho na primeira visita (uma vez; não em navegador automatizado). Teclas ← → Esc; botões Voltar/Próximo/Sair. Suíte `tour` (6 verificações).
### Alterado (F1, 2026-10-29)
- **CSS próprio** em `ui-v4/app/` (tokens, base, componentes, casca, telas, painéis, Blockly, recursos) no lugar do `style.css` e do `libs.css` do BIPES e dos 4 remendos da v3. Paridade visual com a v3 de 390 a 2560 px (script `dev-local/lab/paridade-visual.js`).
- **Console:** os blocos da tela deixam de encolher quando a janela é baixa (a dica e o terminal não ficam mais amassados).
- **Seletor de robô:** a lista suspensa fica clara (antes era escura sobre o pill claro).
### Alterado (F2, 2026-10-29)
- **Núcleo da aplicação novo** em `ui-v4/app/code.js` e `ui-v4/app/ui.js` no lugar de `core/code.js` e `core/ui.js` do BIPES. Comportamento igual ao da v3 (script `dev-local/lab/paridade-comportamento.js`); projetos salvos pela v3 abrem na v4.
- Saíram o menu de troca de idioma e o realce de código por CDN externo; corrigida a espera do iframe do Databoard.
### Adicionado (F3, 2026-10-29)
- **Robô simulado** (`?robo=simulado`): porta serial de mentira que fala como o REPL do MicroPython, para testar e demonstrar a conexão sem o robô. Roteiro de 25 passos (`dev-local/lab/teste-robo-simulado.js`): 25 de 25 na v3 e na v4.
### Alterado (F3)
- O motor de conexão deixa de mexer em classes de CSS dos botões: usa `UI['workspace'].idle()` e `isIdle()`.
### Alterado (F4, 2026-10-29)
- Os recursos do SancaBot que estavam dentro do `index.html` (missões 1 a 4, rastro dos blocos, medidor de distância, tour, cores das categorias, modo lento) viraram módulos em `ui-v4/app/recursos/`. O `index.html` caiu de 2277 para 1163 linhas. As 4 missões compartilham uma fábrica em vez de 4 cópias. Comportamento idêntico (script `dev-local/lab/paridade-recursos.js`: 0 diferenças).
- O botão da tartaruga (modo passo a passo) agora vem pronto no HTML do cabeçalho, sem "aparecer" depois.
### Removido / Alterado (F5, 2026-10-29)
- **Fora da v4:** `style.css` e `libs.css` do BIPES, os 4 CSS de remendo, **Google Analytics**, cookie do último IP, tela de boas-vindas, blocos de OpenCV, componente PWA de CDN e o envio de link do BIPES. Ao abrir, só o próprio servidor é chamado.
- **Link do projeto pela Galeria**: "Gerar link do projeto" lista seus projetos da galeria com "Copiar link"; `?galeria=ID` abre o projeto como projeto novo. O Remix também abre como projeto novo (não troca mais os blocos do projeto aberto).
- `app/iniciar.js` cria `Channel`, `terminal`, `Files` e `UI`; remendos de JavaScript movidos para `app/`. `index.html`: 735 linhas (eram 2277).
### Corrigido (v4, 2026-10-29, a partir da revisão do responsável)
- Botões do Console voltam a ser redondos (pílulas).
- Menu Projeto: os ícones de Baixar, Abrir e Ajuda voltam a aparecer (o mapa de posição do sprite antigo os empurrava para fora).
- Diálogo Conectar: o texto "Conectar →" fica centralizado dentro da pílula.
- Arquivos: o cabeçalho da lista e a barra do editor têm a mesma altura e a mesma linha de baixo; a mensagem de andamento foi para o rodapé da lista.
- Caixa de blocos: mais espaço entre a "meia-lua" colorida e o ícone redondo.
- **Console quebrado por uma correção minha** (o ajuste de Arquivos valia também para o Console, que usa o mesmo id): botões empilhados e terminal sumido. Agora o ajuste só vale em Arquivos e o Console voltou ao da v3.
- Diálogo Conectar: clicar fora fecha (faltava a zona de clique atrás do painel, que vinha do CSS antigo); o × fica centralizado.
- Caixa de blocos: a bolinha do ícone agora é branca com anel da cor da categoria (antes tinha a mesma cor do fundo da linha e se misturava).
- Arquivos: o texto de Executar, Baixar e Excluir fica no centro da pílula.
- **Console cabe na tela**: o terminal passa a usar a altura que sobra (mede a dica, os botões e a linha do EasyMQTT), sem rolar a página, com espaço em branco embaixo; a engrenagem do EasyMQTT fica alinhada ao texto e ao interruptor. Medido: 1440×900 e 1920×1080 sem rolagem.
- **Perfil**: saiu o seletor de idioma (a escolha ficou comentada no `index.html`, com a instrução para reativar numa versão futura). Em "Meus projetos", o nome e os ícones ficam alinhados no meio da pílula (os ícones eram 34 px com o desenho no topo) e o **nome do projeto pode ser editado**: lápis na linha ou duplo clique no nome; Enter grava, Esc cancela; o nome vale mesmo quando o projeto veio de um exemplo e continua depois de recarregar. O painel deixou de trocar o nome pelo gerado a partir do código.
- **Carregamento sem tela azul e sem trocar de aba**: a aba lembrada (Console, Arquivos, Galeria ou Robô) agora **já nasce visível** no primeiro desenho, por CSS (`html[data-aba]`), com o cabeçalho montado antes. Antes a página ficava escondida por uma tela azul, mostrava os Blocos e só depois pulava para a aba. Medido: a página aparece em cerca de 0,17 s; o painel de código e a caixa de blocos continuam escondidos nas outras abas; o terminal reserva o espaço dele para não crescer no meio do carregamento.
- **Rótulo do menu de abas** (telas estreitas): mostrava sempre "Blocos" (a classe antiga `tabon` vinha na frente da `on`); agora mostra a aba aberta.
- **Sem contorno azul** em volta dos grupos da caixa de blocos (anel de foco do Blockly 13).
- **Console cabe na tela de verdade**: o terminal mede a altura real da linha, confere depois de desenhar se ainda sobrou rolagem e refaz a conta quando a imagem da dica, a fonte ou o tamanho da janela mudam.
- Menu Projeto: "Baixar projeto" passou a ciano, para não repetir o azul de "Gerar link".
### Adicionado (F6, 2026-10-29)
- **`dev-local/testar.sh`**: 105 testes automáticos no Chrome com um comando (carregamento sem piscada, Console sem rolagem, acabamento, robô simulado, paridade com a v3, aparência em 4 tamanhos, sessão, galeria e API). Os testes falham quando um ajuste já corrigido volta a quebrar (conferido por mutação).
- `dev-local/versoes/promover.sh` e `docs/projeto/PROMOCAO-V4.md`: checklist e procedimento para a v4 substituir a v3, com volta atrás.
### Corrigido (F6)
- A v4 tentava carregar o iframe da aba IOT (desligada) e gerava um erro 404 em toda abertura.
### Documentado
- **⚠️ Medidas do robô pendentes** (`docs/projeto/MEDIDAS-DO-ROBO.md`) e plano de migração (`docs/projeto/MIGRACAO-V4.md`). (2026-10-29)

## [Não lançado] — v3 (em andamento)

### Adicionado
- **Galeria de projetos** (aba Projetos): abas "Da turma", "Da comunidade", "Meus projetos" e "Para aprovar" (professor); cartões com miniatura dos blocos, reações (⭐ 🚀 💡), remix com crédito e aprovação do professor antes de publicar na comunidade. (2026-10-28)
- **API da galeria** em `sancabot-studio/api/gallery.php`: papéis visitante/aluno/professor, validação do XML, limites por autor, curtidas anônimas para quem vê. Testes: `dev-local/test-gallery-api.sh` (38 verificações). (2026-10-28)
- Item **"Compartilhar na galeria"** no menu Projeto, com janela de nome, frase e visibilidade (Só eu, Minha turma, Comunidade). (2026-10-28)
- **Simulador**: o botão Simular abre o painel parado; o aluno aperta **▶ Jogar**. Painel fecha ao sair da aba Blocos; o botão leva de volta aos Blocos. (2026-10-28)
- **Retomar de onde parou** ao recarregar: aba aberta, zoom e posição dos blocos, e gravação dos blocos ao esconder a página. (2026-10-28)
- **Carregamento sem piscada**: cabeçalho montado antes do primeiro desenho (`sancabot_header_early.js`). (2026-10-28)
- **Console em português** com interruptor "Mensagens do robô em português"; o código digitado e o eco nunca são traduzidos. (2026-10)
- **Destaque do bloco em execução** no simulador; **missões** com estrelas (Perfeito 3, Quase 2, outros 1) e 3 dicas por exemplo; evento `sancabot:missao`. (2026-10)
- Cabeçalho no padrão do SatBlocks: menu **Projeto**, abas que viram menu em telas menores, botão **Conectar** único com diálogo de 3 cartões (USB, Bluetooth, Wi-Fi). (2026-10)
- **Perfil** com apelido editável e **Avisos** em painel flutuante; botão **Rodar no robô** com três estados (sem robô abre o diálogo, ▶ conectado, ■ rodando). (2026-10)
- Tradução para português de: avisos do BIPES, painel de Código, Referência (auditoria sem linhas em inglês), mensagens de erro do robô no Console. (2026-10)
- Estados vazios com o mascote (Console, Arquivos, Projetos); aparência do Console, Arquivos e Dispositivo no mesmo estilo. (2026-10)
- Layout responsivo: telefone, tablet, telas grandes (até 2560 px). (2026-10)
- Painéis laterais, código ao vivo e Referência (2026-10-22); blocos do Creator no editor (2026-10-23).
- Paleta viva (13 cores), ícones nos blocos e categorias, "Controle" dividido em "Decidir" e "Repetir", portas com nome, modo iniciante, simulador de trajetória com verificação do programa e 8 exemplos.

### Alterado
- **Arquivos**: Executar, Baixar para o PC e Excluir do robô saíram dos ícones de cada linha e foram para a barra do editor, agindo sobre o arquivo aberto (desligados sem arquivo). Os rótulos "run at boot" e "is directory" viraram "abre ao ligar" e "pasta". (2026-10-28)
- As abas **IOT, EasyMQTT e Databoard** ficam escondidas, com o código mantido. (2026-10-28)
- A aba "Compartilhado" virou **Galeria de projetos** (antes apontava para o servidor público do BIPES original).
- `localhost` passou a contar como contexto seguro para Serial/Bluetooth em desenvolvimento.

### Corrigido
- Aba "Para aprovar" aparecia para quem não era professor (o estilo da aba sobrescrevia o atributo `hidden`).
- Contraste dos ícones das abas da galeria sobre o azul de seleção.
- Falta de espaço no texto do Console; botão Projeto branco sobre branco; desalinhamento dos cartões de conexão; ícone de perfil fora do centro; estado "fixado" invisível no painel esquerdo.

### Segurança
- O XML de projetos compartilhados nunca é executado no servidor; DOCTYPE/entidades, tipos de bloco suspeitos e arquivos grandes são recusados. Escritas exigem mesma origem e sessão assinada.

## [v2] — paleta semântica
- Paleta de 9 papéis (tons escuros) e blocos curtos do SancaBot. Congelada em `/bipes-v2/`.

## [v1] — Blockly 13 e visual estilo Scratch
- Migração do Blockly 6 para **13.4.0**, renderizador próprio (`sancabot`), fonte Nunito, português, modo iniciante, painéis em camada e Creator. Congelada em `/bipes-v1/`.

## [v0] — BIPES original
- Blockly 6, inglês, visual do BIPES. Arquivo em `dev-local/backup-pre-blockly13/`.
