# Blockly 13 e visual "lúdico" do SancaBot

Estado: **local, sem commit**. Editor em `http://localhost:8090/bipes/`.

## O que mudou
- **Blockly 6.20210701 → 13.4.0** (Apache-2.0, licença em `ui/core/blockly13/LICENSE`).
  Arquivos novos em `ui/core/blockly13/` (núcleo, blocos, geradores Python/JS, idiomas, mídia, plugins de cor e ângulo).
  Os arquivos antigos (`ui/core/blockly_compressed.js` etc.) **continuam no disco, sem alteração**.
- **Camada de compatibilidade** `ui/core/sancabot_blockly_compat.js`: o código do BIPES (escrito para o Blockly 6) continua igual.
  Cobre as APIs que sumiram ou mudaram (XML, alinhamento, campos de cor/ângulo, mutador em `Block` e `BlockSvg`, diálogos,
  utilitários, `getVars`, carregamento tolerante de XML, classe `.blocklyToolboxDiv` da caixa de ferramentas).
- Geradores: `Blockly.Python['x'] = ...` virou `Blockly.Python.forBlock['x'] = ...` em `generator_stubs*.js` e `jsCv/v30/python.js`
  (e nos blocos criados no Creator, inclusive o texto exportado "Gerador (.js)"). `Code.checkAllGeneratorFunctionsDefined` olha `forBlock`.
- **Visual estilo Scratch**: renderizador `zelos` + tema `sancabot` (`ui/core/sancabot_scratch_theme.js`) e CSS
  `ui/core/sancabot_scratch.css`: blocos arredondados, campos em pílula, cores vivas, categorias em cartões, área de desenho clara.
  Cores fixas antigas dos blocos SancaBot são mapeadas para a paleta nova (`HEX_MAP` no tema), sem editar as definições.
  O Creator usa o mesmo tema na prévia (e carrega `msg/pt-br.js`, exigido pelo Blockly 13).

## Mudanças de comportamento (intencionais)
- `isinstance(x, Number)` do Blockly novo vira `isinstance(x, (int, float))`: MicroPython não tem o módulo `numbers`.
  No Blockly 6 era `int`, que ignorava decimais (a média descartava leituras como 2.5); agora conta.
- Ao **carregar XML** (projetos, modelos) a verificação de tipo de conexão fica de lado: o Blockly 13 lançaria erro e o projeto
  inteiro não abriria. Ao arrastar na tela os tipos continuam valendo.
- `math_atan2`, `math_change`, `number_property`, `on_list` e `text_charAt` têm pequenas diferenças de texto no Python gerado
  (equivalentes em execução).

## Como foi validado
- Saída dos geradores: 232/234 linhas idênticas em programas de referência do Blockly 6; 161/176 casos idênticos no teste diferencial
  de geradores padrão; nenhum Python gerado contém `numbers`/`Number` executável.
- Suítes existentes: `test-identidade.sh` 21 ok, `test-blocks-api.sh` 44 ok, `test-blocks-parity.sh` 28+12 ok.
- No navegador: mutadores (`controls_if`, `lists_create_with`, `text_join`, procedimentos, `sancabot_exp_if_else`, `localstorage_store`),
  salvar/recarregar XML, arrastar da bandeja, "Usar bloco" da Referência, painéis como camadas, bloco criado no Creator publicado e
  carregado no editor, celular (375 px).

## Páginas migradas
`ui/index.html`, `ui/index_offline.html` e `ui/emulator.html` usam o Blockly 13 (mesma ordem de scripts, compat + tema).
O emulador já estava quebrado antes (faltava o elemento `languageIcon` que o `Code.initLanguage` exige); agora essas atribuições
toleram elementos ausentes. Ainda no Blockly 6: só o editor interno do Studio (`sancabot-studio/editor/sanca-editor.js`, que confere o
hash do `blockly_compressed.js` antigo).

## Português do Brasil
- O idioma padrão agora é `pt-br` (`?lang=en` para inglês) em `Code.getLang`.
- Blocos de hardware/BIPES tinham rótulos em inglês dentro de `block_definitions.js`. `ui/core/sancabot_i18n_ptbr.js` traduz, em tempo de
  execução, **rótulos e opções de menu** pelo texto exato (dicionário `D`). Os valores que vão para o Python não mudam.
  Nomes de funções Python (`Pin.value`, `LCD160CR.dot`...) e siglas ficam como estão de propósito.
- `toolbox/sancabot.xml`: nomes de categorias, rótulos e botões em português (a Referência foi ajustada: chaves `Sons/text`, `Cliente HTTP/...`).
  O callback de instalar biblioteca aceita "Instalar biblioteca X" e o antigo "Install X library".
- Para traduzir mais um texto: acrescentar `'texto em inglês': 'texto em português'` em `D`.
- **Dicas (tooltips):** `ui/core/sancabot_i18n_ptbr_tips.js` (texto inglês original -> português), aplicado pelo mesmo tradutor.
  Ficam em inglês de propósito os trechos da documentação oficial do MicroPython (`.. function:: ...`) e nomes de funções.
- **Toolboxes de todas as placas** (`toolbox/*.xml`) e o toolbox embutido em `index_offline.html`: categorias, rótulos e botões
  em português. Nomes de módulos Python/OpenCV (`machine.Pin`, `imgproc`...) ficam como estão.
- `block_definitions.js`: os blocos de pinos e de ADC leem `UI.workspace`, que o emulador não cria; agora toleram a ausência
  (o Blockly 13 monta o menu na criação do bloco).

## Parâmetros de aparência e de iniciante (`ui/core/sancabot_config.js`)
Tudo o que é "gosto" fica num objeto só, `window.SancaBotConfig`; mude os valores e recarregue.
- **Fonte:** `font.family/weight/size`. Padrão: Nunito 800, 13 px (arquivo local em `ui/media/fonts/nunito`, licença OFL; carrega sem internet).
- **Espaçamento:** `spacing.*` (altura mínima 40, espaço entre campos 6, margens 12, encaixe vazio 10, cantos 6). Valem para um renderizador
  próprio (`sancabot`, derivado do Zelos) definido em `sancabot_scratch_theme.js`; se falhar, cai no Zelos puro.
- **Sem espaços sobrando:** `sancabot_polish.js` tira espaço nas pontas e duplicado dos rótulos de todos os blocos; depois que a fonte carrega,
  os blocos são medidos de novo. O bloco "Dados do projeto" passou a alinhar à esquerda (antes à direita, o que abria um vão).
- **Textos padrão:** `defaults.author` = "Aluno" e `defaults.description` = "Meu projeto" (projetos novos e também os antigos, que ainda
  traziam "User" e "My project"). O nome de usuário local "User" também vira "Aluno".
- **Iniciante:** blocos do SancaBot sem GPIO/Trigger/Echo ("na porta", "emissor do som", "receptor"); nos menus de pino, "GPIO5" aparece como
  "porta 5" (`portWord`; só o texto, o código gerado não muda). No modo iniciante o grupo "Laboratório Avançado" vira "Lógica e matemática" e
  mostra só `beginner.keepCategories` (Lógica e Matemática); o seletor do painel Referência segue a mesma regra. A chave "Avançado" no topo
  da caixa de blocos mostra tudo de novo e lembra a escolha (`beginner.enabled`, `advancedParent`, `keepCategories`, `parentLabel`).
- **Cuidado ao mexer no CSS dos blocos:** o Blockly mede o texto sem `letter-spacing`; se o CSS acrescentar espaçamento entre letras, o texto
  fica mais largo que o medido e os rótulos vizinhos se encostam. A fonte também precisa estar carregada na hora de medir
  (`sancabot_polish.js` mede os campos de novo quando a Nunito termina de carregar).

## Reverter
- Tudo: restaurar `dev-local/backup-pre-blockly13/bipes-ui-antes-do-blockly13.tgz` sobre `bipes-sancabot/ui`.
- Só o visual: remover `sancabot_scratch_theme.js` e `sancabot_scratch.css` do `index.html` e o `renderer`/`theme` do `Blockly.inject`.

## v3: paleta viva, ícones e painel claro
- **Paleta** (`sancabot_config.js`, `palette`): 13 cores vivas por papel (coral, azul-céu, turquesa, tangerina, amarelo-sol, verde-folha, lavanda, rosa-chiclete, orquídea, lima, celeste, cinza-azulado). **Todas** levam texto azul-marinho `#1B2250` (contraste mínimo medido: 5,5:1 em 583 textos de 54 categorias).
- **Ícones:** `sancabot_icons.js` (traço arredondado). Aparecem no começo dos blocos do SancaBot e numa bolinha colorida em cada categoria da caixa de blocos.
- **Controle** virou **Decidir** e **Repetir** (`toolbox/sancabot.xml`; tópicos da Referência atualizados).
- **Recolorir tudo:** blocos de hardware/BIPES por família da categoria (`sancabot_block_roles.js`, gerado); os padrão do Blockly (Lógica, Laços, Matemática, Texto, Listas, Variáveis) pelo tema; os demais pelo tom numérico mais próximo.
- **Painel direito e cabeçalho:** painel Código/Referência claro, fonte Nunito, código com realce em cores da paleta; cabeçalho azul da marca com aba ativa em pílula branca.
- **Caixa de categorias:** linha com bolinha colorida; a selecionada vira cartão branco com anel da cor (antes o Blockly pintava a linha toda com a cor da categoria e texto branco, o que misturava laranja e roxo e perdia contraste).
- **Bug corrigido (bandejas vazias):** o modelo do labirinto tinha um encaixe que o Blockly 13 recusa por tipo (`Mostrar no painel` depois de `Parar`). A exceção travava a montagem da bandeja e **todas** as categorias seguintes ficavam vazias. Agora o bloco aceita qualquer vizinho, a montagem da bandeja tolera tipos (`sancabot_blockly_compat.js`, item 12) e uma falha esconde a bandeja em vez de quebrá-la. Clicar num cabeçalho de grupo (ex.: "SancaBot") agora abre a primeira categoria dele.
- **Também:** modelo do labirinto com entrada `DO0` correta; blocos criados no Creator usam a paleta; o Creator carrega a mesma regra de texto.
- **Grupos da caixa de blocos (SancaBot, Lógica e matemática / Laboratório Avançado, Máquina, Sensores...):** o clique no cabeçalho é um interruptor tratado por `sancabot_polish.js`: fechado, abre e já mostra a primeira categoria; aberto, fecha (e esconde a bandeja se a categoria aberta estava dentro dele). Antes, o código que abria a primeira categoria reabria o grupo a cada clique e ele nunca fechava, porque o Blockly só recolhe quando o próprio cabeçalho já estava selecionado.
- **Ícone (favicon) = logotipo do SancaBot** (`ui/media/sancabot-face.svg`): `ui/favicon.ico` (16/32/48 px), `ui/media/icon/favicon-32x32.png`, ícones do app (`icon-192x192.png`, `icon-512x512.png` sobre o azul da marca, `icon-maskable-192x192.png`) e `ui/media/apple-touch-icon.png` (180 px, não existia). Também em `appengine/bipes-271213/favicon.ico`, `sancabot-studio/favicon.ico` e `favicon-32.png` (ligados no Studio e no Creator). Pendente: `media/icon/safari-pinned-tab.svg` ainda é do BIPES (precisa de um desenho de uma cor só).
- **Portas com nome:** nos blocos "Preparar motores" e "Preparar sensor de distância", os campos numéricos viraram menus (`sancabotPortField` em `block_definitions_sancabot.js`). A tabela **nome -> pino** está em `sancabot_config.js` (`ports`). Hoje é PROVISÓRIA: letras A..V na ordem dos pinos 0..21 (A = pino 0), o que mantém os padrões (motores A e B; sensor H e I). Para usar os nomes reais da placa, troque a tabela, por exemplo `[['Motor E', 0], ['Motor D', 1], ['Olho (envio)', 7], ['Olho (retorno)', 8], ...]`. Pinos fora da tabela aparecem como "pino N". O valor guardado no projeto continua sendo o número do pino: projetos antigos abrem e o Python gerado é idêntico ao da v1. Fora do escopo por enquanto: os blocos de hardware avançados (que têm seus próprios menus de pino) e os campos "pino" do Creator.
- **Menus suspensos** dos blocos: texto azul-marinho (antes ficava branco sobre cor clara).

## Console, Arquivos e Projetos em português, com estados vazios
`index.html`: botões do Console ("Executar meus blocos", "Parar programa", "Reiniciar o robô", "Limpar o console"), do painel de conexão (Rede, Endereço, Senha, Buscar dispositivos, Reiniciar ao conectar) e da aba Arquivos (Arquivos, No robô, Blocos em código, Modelos, Salvar...). As mensagens de andamento de arquivos (`Files.update_file_status`, em `core/utils.js`) são traduzidas por regras no próprio método. Estados vazios com o mascote: dica no Console, texto na lista de arquivos e a página `shared.html` (aba Compartilhado) refeita; estilos em `core/sancabot_empty.css`.
**Console e Compartilhado:** terminal em azul-marinho (`terminal.setOption('theme', ...)` em `index.html`; `term.resize` usa 8,5 px por coluna e 17 px por linha para a letra 14), botões em pílula com "Executar meus blocos" em destaque, aba Compartilhado ocupando a aba inteira. Textos restantes em português: painel da conta ("Olá", "Meus projetos", "Ajustes"), dicas dos botões de conexão e do projeto, "Meu projeto" como nome padrão.

## Layout responsivo e hierarquia do cabeçalho
`core/sancabot_layout.css` + `sancabot_layout.js` (carregados por último). `--sb-top` = borda de baixo do cabeçalho, medida por `ResizeObserver`; o conteúdo e os painéis descem junto. Faixas: **≥1280 px** uma linha; **760–1279 px (tablet)** logo, Simular e ferramentas na linha 1, abas rolando na linha 2 (a barra de ferramentas não some mais atrás de um botão); **<760 px (celular)** botão de menu com as ferramentas num cartão azul e o Simular sempre à vista. O botão Simular agora fica no cabeçalho, fora da barra de ferramentas. Alvos de toque maiores com `pointer: coarse`. Hierarquia: só dois verbos em destaque, **Simular** e **Rodar no robô** (botão amarelo com nome); o sino de avisos só aparece no modo avançado. Abas renomeadas: Compartilhado -> **Galeria**, Dispositivo -> **Meu robô**. Arquivos, Meu robô e os painéis (conta, conexão) no mesmo visual claro.

## Cabeçalho no padrão do SatBlocks e diálogo "Conectar o robô"
- **Cabeçalho:** logo | abas | Simular | **Conectar** | robô + **Rodar no robô** | **Projeto ▾** | perfil. Acima de 1700 px as abas aparecem lado a lado, com ícone; abaixo disso viram um menu com a aba atual (como no SatBlocks). Abaixo de 1100 px as ferramentas descem para a segunda linha; no celular o robô + Rodar ficam numa terceira linha curta, sem rolagem lateral.
- **Projeto ▾** reúne (sem mudar ids nem lógica, os elementos são só movidos): Gerar link do projeto, Baixar projeto (arquivo), Abrir projeto de um arquivo, Ajuda (fórum) e Avisos (só no modo avançado).
- **Conectar:** um botão só, com estado (cinza "Conectar", amarelo "Conectando…", verde "Conectado"). Desconectado, abre o diálogo com 3 cartões: **Cabo USB** (recomendado, com "Reiniciar o robô ao conectar"), **Bluetooth** e **Rede Wi-Fi** (endereço, senha, "Buscar robôs"). Conectado, o mesmo botão desconecta. Os botões dos cartões são os mesmos `#serialButton`, `#bluetoothButton`, `#networkButton` de antes, então `Channel.mux.switch` e o resto continuam iguais. Fecha com Esc, "Fechar" ou clicando fora.
- `core/channel.js`: `localhost` passou a contar como contexto seguro (como `127.0.0.1`), então USB e Bluetooth não pedem mais para trocar para a versão HTTPS ao testar localmente.

## Perfil e botões de fixar
- **Painel do perfil** (`sancabot_layout.js` `buildProfile`, estilos em `sancabot_layout.css`): avatar com a inicial, campo "Seu nome" **editável** (apelido guardado só neste navegador em `localStorage['account_user']`; Enter confirma, vazio volta para "Aluno", máximo 24 letras) e, havendo sessão do Studio, uma linha somente leitura "Conta SancaLabs: nome · plano". Antes o campo era travado quando havia sessão do Studio e, além disso, o painel tinha `user-select: none`. O apelido nunca altera a conta. Projetos e idioma em seções separadas.
- **Fixar:** o estado "fixado" da caixa de blocos (esquerda) agora aparece igual ao do painel de código (direita): botão azul com alfinete cheio e reto. As regras `.sb-tb-btn { ... !important }` de `sancabot_scratch.css` escondiam esse estado só na esquerda.

## Avisos, alertas e mensagens do console em português
- `msg/pt-br.js`: `notConnected`, `serialFroozen`, `notAvailableFlag` (as demais chaves já estavam em português).
- Textos fixos traduzidos no código: `channel.js` (senha incorreta, Bluetooth perdido, "este jeito de conectar não está disponível", e as linhas do terminal: bem-vindo, enviando a senha, conectado por USB/Bluetooth, reiniciando, desconectado), `code.js` (instalar biblioteca, carregar exemplo), `utils.js` (apagar arquivo, enviar XML para os blocos, lista de arquivos atualizada), `ui.js` (abrir arquivo inválido, variável em uso, versão offline), `storage.js` (projeto aberto pelo link).
- As mensagens de andamento dos arquivos ("Sending...", "Got...") são traduzidas por regras em `Files.update_file_status`. Mensagens técnicas internas (`notify.log`) não aparecem na tela e ficaram como estão. Os outros idiomas (`msg/en.js` etc.) não foram alterados.

## Painel de código e Referência: auditoria de inglês
Auditoria feita no navegador: percorri os 54 tópicos da Referência (rótulos, descrições e dicas das 236 linhas) e o painel de código. Os textos da interface dos dois painéis já estavam em português; o que sobrava eram **rótulos de blocos que o XML trazia gravados em inglês** (`<field name="NET_IFCONFIG">Wifi current IP</field>`): o carregamento do XML sobrescrevia a tradução feita no `init` do bloco.
- `sancabot_i18n_ptbr.js`: `FieldLabel.setValue` agora traduz o valor que recebe, então rótulos vindos de XML (toolbox, projetos antigos, modelos) saem em português. Entradas novas no dicionário: `get` -> obter, `counter` -> contador, `by` -> por.
- `sancabot_reference.js`: `generate()` chama `sancabotI18n.wrapAll()` antes de montar cada linha (blocos definidos depois do tradutor também entram).
- Toolbox: textos de exemplo do bloco de e-mail ("E-mail do SancaBot!", "O SancaBot é legal!").
- Resultado da auditoria depois do ajuste: 0 rótulos e 0 descrições em inglês nas 236 linhas. O código Python em si (nomes de função, `time.sleep`) continua em inglês, como deve.

## Console: mensagens do robô em português
`core/sancabot_console_ptbr.js` traduz, **só na tela**, o que o MicroPython imprime (o que o robô envia e recebe não muda): banner e "Type help()", `MPY: soft reboot`, `Traceback`/`File "...", line N` (rastro de erro) e os erros mais comuns (`NameError`, `SyntaxError`, `IndentationError`, `TypeError` de somar tipos diferentes, `ZeroDivisionError`, `ValueError` de pino, `ImportError`, `MemoryError`, `OSError [Errno N] E...` com os nomes de erro de comunicação, `KeyboardInterrupt`, queda de energia). Erro que não está na lista aparece como veio. Passa por `term.write` (único ponto de saída do console), preserva cores e tolera linha cortada em dois pedaços (espera até 150 ms). Para acrescentar uma mensagem: nova linha em `RULES`. Texto que o próprio programa do aluno imprime (`print`) nunca é alterado, a não ser que coincida com uma mensagem de erro do MicroPython.
- **Python continua em inglês quando você interage com o robô.** O que a pessoa digita no console vai para o robô sem alteração (`terminal.onData` envia o dado como veio). O eco da digitação (linhas que começam com `>>>` ou `...`) também nunca é traduzido. O interruptor **"Mensagens do robô em português"** (Console, guardado em `localStorage['sancabot_console_pt']`) desliga a tradução e mostra exatamente o que o robô enviou, útil para pesquisar o erro em inglês.

## Galeria de projetos (aba Projetos) — passo 1, sem servidor

- **Abas:** Da turma · Da comunidade · Meus projetos · Para aprovar (só professor). Cartões com miniatura dos blocos (SVG gerado do XML), apelido, estrelas, missão, três reações (⭐ 🚀 💡, sem comentários livres) e **Remixar**.
- **Compartilhar:** menu Projeto → "Compartilhar na galeria". Visibilidade: Só eu, Minha turma (aparece na hora) ou Comunidade (fica *pendente* até o professor aprovar; o professor pode recusar com um motivo que o aluno lê).
- **Remix:** abre uma cópia no editor e guarda o crédito ("Remix de … , de …"), que vai para o cartão quando o aluno compartilhar.
- **Dados:** ficam no `localStorage` (`sancabot_galeria_v1`) com projetos de exemplo. A caixa "Ver como professor" no rodapé da galeria é só demonstração. Para ligar ao servidor, trocar as funções marcadas `[SERVIDOR]` em `core/sancabot_gallery.js` (usuário, listar, publicar, aprovar, reagir, remover).
- **Ainda não feito:** denúncia, lista de palavras bloqueadas real (hoje provisória), miniatura em imagem, simulação dentro do cartão, login e turmas reais.

## Galeria — passo 2: ligada ao servidor

- **API:** `sancabot-studio/api/gallery.php` (+ `api/lib/gallery.php`), no mesmo padrão do `blocks.php`: identidade só do cookie assinado, `requireSameOrigin` nas escritas, arquivo `gallery.json` em `DATA_DIR`. Teste: `dev-local/test-gallery-api.sh` (38 verificações: visitante x aluno x professor, aprovação, recusa com motivo, curtidas, remix, exclusão e entradas hostis).
- **Papéis (provisório):** admin do Studio = professor; qualquer outra conta = aluno; sem login = visitante (só vê a Comunidade). Todos os alunos estão na turma `geral` até existirem turmas; depois, o claim `turma` do cookie passa a valer (já lido em `galWho()`).
- **O XML é só dado:** o servidor confere tamanho (60 KB), recusa DOCTYPE/entidades, exige raiz `xml`, tipos de bloco `[A-Za-z0-9_]` e ao menos um bloco. O crédito de remix vem do servidor; curtidas chegam ao navegador só como contagem (`me`/`o`).
- **Cliente:** `sancabot_gallery.js` escolhe o modo ao abrir: SERVIDOR (a API responde) ou LOCAL de demonstração (sem API). Leituras vêm de um cache atualizado a cada 30 s e ao focar a aba; escritas devolvem Promise.
- **Limites e palavras:** 40 projetos por autor, 3000 no total, 80 projetos por consulta. Lista de palavras bloqueadas: `STUDIO_GALLERY_BLOCKED_WORDS` (separadas por vírgula).
- **Falta:** turmas reais, denúncia, miniatura gerada no servidor (hoje a lista traz o XML de cada projeto), e agrupar as curtidas por conta para a lista não crescer sem limite.

## Carregamento sem "piscada"

- O cabeçalho novo (menu Projeto, botão de abas, Simular, estado do botão Rodar) é montado por `core/sancabot_header_early.js`, logo depois do HTML do cabeçalho e antes do primeiro desenho. `sancabot_layout.js` só liga os cliques nessa estrutura.
- Até lá a página fica oculta (`html.sb-boot`, fundo azul da marca). Com a aba Blocos, é liberada no mesmo instante (≈0,15 s medidos). Se o aluno recarregou em Console/Arquivos/Projetos/Robô, espera essa aba abrir (`sancabot_session.js`) para não mostrar os Blocos antes. Cronômetro de segurança: 4 s.
