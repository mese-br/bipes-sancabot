# Migração para a interface própria (v4)

Atualizado em **2026-10-29**. Decisão: **troca completa, de uma vez**, preservando o que existe e com caminho de volta ([ADR-018](DECISOES.md)).

## 1. Como voltar (preservação)

| O que | Onde | Estado |
|---|---|---|
| **v3 congelada** (o editor como estava antes da v4) | `dev-local/versoes/v3/ui` · `http://localhost:8090/bipes-v3/` | somente leitura |
| **v3 em trabalho** | `bipes-sancabot/ui` · `http://localhost:8090/bipes/` | **não será alterada** pela v4 |
| **API do Studio na v3** (galeria, blocos, login) | `dev-local/versoes/v3-servidor-studio-api.tgz` | somente leitura |
| **v4 em desenvolvimento** | `bipes-sancabot/ui-v4` · `http://localhost:8090/bipes-v4/` | começou como cópia da v3 |
| v1 e v2 | `/bipes-v1/`, `/bipes-v2/` | congeladas |

- **Voltar:** abrir `/bipes-v3/` ou `/bipes/`; ou `dev-local/versoes/restaurar.sh v3`.
- **Promover a v4:** só depois de aprovada: congelar `ui-v4` como `v4` e trocar `ui` por ela (o script faz cópia de segurança antes).
- Os **projetos dos alunos** ficam no mesmo `localStorage` (formato `bipes_projects`); a v4 **deve abrir** tudo que a v3 salvou. Isso é critério de aceite.

## 2. O que é "a camada antiga do BIPES" (inventário)

**Será substituída** (interface):

| Peça | Onde | O que faz |
|---|---|---|
| Esqueleto da página e estilos | `index.html`, `style.css`, `libs.css` | Estrutura, abas, painéis, aparência antiga |
| Classes de interface | `core/ui.js` (834 linhas) | `panel`, `account` (projetos e perfil), `channelPanel`, `notify`, `responsive`, `progress`, `workspace` (rodar, salvar, trocar de placa) |
| Aplicação do editor | `core/code.js` (842 linhas) | Cria o Blockly, abas, recarrega a caixa de blocos, gera código |
| Remendos da v3 | `sancabot_layout.css/js`, `sancabot_header_early.js`, `sancabot_panels.css/js`, `sancabot_empty.css`, partes de `sancabot_scratch.css` | Desenham a aparência nova **por cima** da antiga |
| Atalhos e PWA | `shortcut.js`, `manup.js`, `pwabuilder-sw.js` | Teclas; instalação offline |
| Cookie, tela de boas-vindas e rastreador | trecho inline do `index.html` | Splash do BIPES e **Google Analytics (risco R2: sai na v4)** |

**Código do SancaBot hoje dentro de `<script>` do `index.html`** (precisa ir para módulos próprios): caixa de blocos colorida por papel (`applySancaBotToolboxColors`), painéis das missões 1 a 4 e envio ao Studio, rastreio dos blocos no Console (`initSancaBotTraceFlow`), modo lento, painel de distância (e leitura do que o robô imprime), tour de preparação.

**Fica** (é "o motor" e o produto próprio): Blockly 13, blocos e geradores, simulador, galeria, tradução, `channel.js` (Serial, Bluetooth, Wi-Fi), `utils.js` (`Tool`, `files`, `term`), `storage.js` (projetos), `devinfo.json`, `msg/*`.
O motor hoje busca elementos da página por **id** (`#term`, `#url`, `#resetBoard`, `#put-file-select`…): a v4 mantém esse contrato de ids (ou o troca em uma etapa própria, com teste).

## 3. Fases

| Fase | Entrega | Pronto quando |
|---|---|---|
| **F0 — Preservar** ✅ | v3 congelada, API arquivada, `ui-v4` criada, rotas, nomes das portas da v4 | `/bipes-v3/` e `/bipes-v4/` abrem; `/bipes/` intacto |
| **F1 — Sistema de design e casca** ✅ (2026-10-29) | Tokens, base, componentes e a casca (cabeçalho, abas, telas, painéis, responsiva) em `ui-v4/app/*.css`, **sem** `style.css`, `libs.css` nem os 4 remendos da v3 | A casca carrega sem arquivos antigos de aparência; paridade com a v3 de 390 a 2560 px (ver seção 6) |
| **F2 — Núcleo da aplicação** ✅ (2026-10-29) | `app/code.js` e `app/ui.js` no lugar de `core/code.js` e `core/ui.js`: editor (Blockly, telas e tela dividida, caixa de blocos, código), projetos (compatível com `bipes_projects`), avisos, progresso, perfil, painéis, dispositivo | Montar blocos, trocar de projeto e recarregar sem perder nada; projetos da v3 abrem; comportamento igual ao da v3 (ver seção 7) |
| **F3 — Robô** ✅ (2026-10-29, com robô simulado) | Robô simulado (`app/robo-simulado.js`) + roteiro de 25 passos; o motor (`channel.js`, `utils.js`) fala com a interface por métodos (`UI['workspace'].idle()/isIdle()`), não por classes de CSS | Todos os fluxos da v3 funcionam com robô simulado; **real no M11** |
| **F4 — Recursos do SancaBot** ✅ (2026-10-29) | Missões, rastro dos blocos, medidor de distância, modo lento, tour e cores das categorias como módulos em `app/recursos/` (simulador e galeria já eram módulos) | Mesmo comportamento da v3, sem `<script>` inline de recursos |
| **F5 — Aposentar o antigo** ✅ (2026-10-29) | Fora: `style.css`, `libs.css`, os 4 CSS de remendo, Google Analytics, cookie, tela de boas-vindas, OpenCV, componente PWA de CDN e o envio do link ao servidor; remendos de JavaScript movidos para `app/`; link do projeto pela Galeria | Nenhum arquivo antigo de interface é carregado; nenhuma chamada a terceiros ao abrir; sem `!important` contra CSS herdado |
| **F6 — Testes e aceite** ✅ (2026-10-29) | Um comando (`dev-local/testar.sh`) roda 105 verificações automáticas no Chrome; comparação com a v3; checklist e script de promoção ([PROMOCAO-V4.md](PROMOCAO-V4.md)) | Tudo verde; falta só o robô real e a decisão de promover |

## 4. Critérios de aceite da v4 (checklist de promoção)

1. Python gerado **idêntico** ao da v3 para os 8 exemplos do simulador.
2. Projetos salvos pela v3 abrem na v4 (e vice-versa, enquanto as duas convivem).
3. Fluxos com robô simulado: conectar, rodar, parar, listar/abrir/executar/baixar/excluir arquivo, Console.
4. Simulador (▶ Jogar, destaque, estrelas), galeria (publicar, aprovar, curtir, remixar) e tradução do Console sem regressão.
5. Cabeçalho e telas em 390, 820, 1024, 1400 e 2560 px; sem piscada; recarregar mantém aba, blocos e posição.
6. Nenhum texto em inglês visível ao aluno; nenhum rastreador de terceiros.
7. Suítes de API (`dev-local/test-*.sh`) passando; testes de interface (M10) passando.
8. **Teste no robô real** (M11) antes de promover para os alunos.

## 5. Riscos específicos
- **Contrato de ids do motor** (`channel.js`, `utils.js`): mudar um id sem testar quebra a conexão de modo silencioso. Mitigação: manter os ids e cobrir com teste.
- **Sem robô real**: a v4 só chega a ✅ de verdade depois do M11.
- **Duas pastas até a promoção**: correções feitas na v3 durante esse tempo precisam ser levadas para a v4 (registrar no [CHANGELOG](../../CHANGELOG.md)).

## 6. F1 — o que foi feito (2026-10-29)

**Arquivos novos em `ui-v4/app/`** (substituem `style.css` com 2172 linhas, `libs.css` e os remendos `sancabot_layout/scratch/empty/panels.css`):

| Arquivo | O que tem |
|---|---|
| `tokens.css` | Cores, tipografia, espaços, raios, sombras, movimento e camadas da **interface** (as cores dos blocos continuam em `sancabot_config.js`) |
| `base.css` | Reset, corpo e o **sistema de telas** (`.content` com `ani/on/pos1/pos2`, usado por `code.js` até a F2) |
| `icons.css` | Mapa do sprite `media/icons.svg` |
| `components.css` | Botão com ícone, interruptor, aviso flutuante, barra de progresso, grupos que abrem (`details`) |
| `shell.css` | Cabeçalho (logo, abas, Simular, Conectar, robô + Rodar, Projeto, perfil), menus e janelas flutuantes, **sem `!important` contra CSS herdado** |
| `screens.css` | Console, Arquivos, Dispositivo, Projetos e estados vazios |
| `panels.css` | Painéis laterais (código, Referência, caixa de blocos) |
| `blockly.css` | Aparência do Blockly (caixa de categorias, bandeja, blocos, menus) |
| `features.css` | CSS dos recursos do SancaBot que estavam no fim do `style.css` (missões, tour, medidor de distância, rastro dos blocos, link do esquema de pinos) |
| `vendor-xterm.css` | CSS do xterm.js (terceiros, MIT), copiado sem mudanças |

**Como foi verificado:** `dev-local/lab/paridade-visual.js` compara tamanho, posição e ~14 estilos calculados de ~60 elementos, em todas as telas e painéis, entre `/bipes-v3/` e `/bipes-v4/`.
Resultado: **8 diferenças em 977, 1440 e 2560 px** (e só a altura do seletor de robô em 390 px), todas de 1 a 20 px ou de um tom de cor; nenhuma visível. Nenhum CSS antigo é carregado (`document.styleSheets` conferido).

**Correções que a comparação revelou** (úteis para a F2): o `style.css` antigo fazia coisas sem avisar: definia o logo do SancaBot, o brilho dos ícones em sprite, o `min-width: 0` da barra de ferramentas, a ordem de largura do seletor de robô e o `flex: none` do Console; e a v3 dependia de que os remendos fossem carregados **depois** dos painéis. Tudo isso agora é explícito.

**O que a F1 NÃO fez (de propósito):**
- `shell.css` ainda usa cores literais em vez de `var(--sb-*)` e tem regras repetidas em camadas (herança dos remendos). Arrumar isso é trabalho da **F5**, depois que `ui.js` e `code.js` saírem (mexer antes arrisca regressão sem teste).
- Continuam carregados: `prettify.css` de um CDN externo (sai na F5), o JavaScript de interface herdado (`ui.js`, `code.js`, `sancabot_layout.js`, `sancabot_panels.js`, `sancabot_header_early.js`, `sancabot_session.js`) e o Google Analytics (risco R2, sai na F5).
- `ui-v4/style.css` e `ui-v4/core/libs.css` continuam na pasta (só não são carregados); `index_offline.html` ainda os usa. Serão apagados na F5.
- Para testar não existe ainda automação: a comparação é manual, com o script acima (M10 a automatiza).

## 7. F2 — o que foi feito (2026-10-29)

**Substituições** (`core/code.js` com 842 linhas e `core/ui.js` com 834 saíram da v4; as duas continuam na v3):

| Novo | Substitui | O que mudou |
|---|---|---|
| `app/code.js` (objeto `Code`) | `core/code.js` | Telas e tela dividida reescritas com funções nomeadas e comentários; Blockly, caixa de blocos, geração de código e XML; botões da caixa de blocos (instalar biblioteca, exemplo, documentação) isolados em `registerToolboxButtons` |
| `app/ui.js` (classes `Panel`, `Account`, `ChannelPanel`, `Notify`, `Progress`, `Responsive`, `Workspace`) | `core/ui.js` | Classes em PascalCase; `Account` com `addProject_` único (antes havia três cópias do mesmo código); sem o vetor de "zonas mortas" que ninguém usava |

**Contrato mantido** (o que `channel.js`, `utils.js`, `storage.js` e `sancabot_*` esperam, e que não mudou de nome): `Code.workspace`, `Code.current`, `Code.handleLink`, `renderContent`, `reloadToolbox`, `generateCode`, `generateXML`, `LANG`; `UI['notify'].send/log/messages`, `UI['workspace'].runButton/receiving/runAbort/connecting/selector/devices/saveXML/readWorkspace/writeWorkspace/changeTo/...`, `UI['account'].currentProject/projects/restoreProjects/openLastEdited/importProject`, `UI['responsive'].hidePanels`, `UI['progress']`; e os atalhos globais `get`, `getIn`, `getAll`, `style`, `fx`, `xhrGET`, `$em`.

**Decisões da F2:**
- **Saiu o menu de troca de idioma** (o SancaBot é em português). `?lang=en` ainda funciona; os arquivos de textos são os mesmos. A troca com "blocos guardados na sessão" saiu junto.
- **Saiu o realce de código por um script de CDN externo** (`code-prettify`): nada o usava. Menos uma dependência de terceiros (junto com o risco R2).
- **Corrigido** um erro do BIPES: ao esperar o iframe do Databoard, o código procurava `mopdules` (letra trocada) e nunca carregava.
- `UI['toolbar']` e `#toolbarButton` ficam (escondidos): o motor de conexão ainda muda a classe do botão.

**Como foi verificado** (`dev-local/lab/paridade-comportamento.js`, v3 × v4): Python dos 8 exemplos (mesmo conteúdo; só os ids **aleatórios** dos blocos nas chamadas de rastreio mudam), projetos (novo, reabrir, apagar, nome), escrita e leitura do XML do BIPES, 7 trocas de tela e de tela dividida (estado e classes de cada tela), abertura e fechamento de painéis, estados de conexão, avisos, progresso, dispositivo e caixa de blocos, idioma.
Resultado: **tudo idêntico**, exceto esses ids aleatórios. Um projeto salvo pela v3 abriu na v4 com os mesmos 7 blocos. A comparação encontrou um erro meu (`$em`, usado por `utils.js` para dimensionar o terminal), já corrigido.

**O que a F2 NÃO fez:** `storage.js` (guarda projetos e o link na nuvem do BIPES), `shortcut.js`, `manup.js`, o JavaScript embutido no `index.html` (cookie, splash, missões, tour, rastro dos blocos, medidor de distância) e os arquivos `sancabot_layout.js`, `sancabot_panels.js`, `sancabot_header_early.js`, `sancabot_session.js` continuam. `channel.js` e `utils.js` continuam buscando elementos por id (F3). Teste com robô real: M11.

**Atenção (privacidade):** o item "Gerar link do projeto" do menu Projeto (`BlocklyStorage.link`) envia o projeto ao servidor do BIPES original. Está como no BIPES; decidir antes de qualquer piloto (risco R2).

## 8. F3 — o que foi feito (2026-10-29)

**Decisão de escopo (importante):** o motor de conexão (`core/channel.js`: Serial, Bluetooth, Wi-Fi; `core/utils.js`: `Tool`, `files`, `term`) **não foi reescrito**. Sem o robô real e sem como testar Bluetooth e Wi-Fi, reescrever seria o maior risco do projeto (R3). Em vez disso a F3 criou a rede de segurança que faltava e fez só o desacoplamento seguro. A reescrita do motor fica para depois do M11.

**1. Robô simulado** (`app/robo-simulado.js`, carregado com `?robo=simulado`). Troca `navigator.serial` por uma porta de mentira que fala como o REPL do MicroPython (eco, prompts `>>>` e `...` com recuo, modo colar, Ctrl-C, Ctrl-D, arquivos, erros, `print`, rastro `SANCABOT_TRACE`). O código **real** de conexão e de arquivos roda inteiro; só a porta é falsa. Mostra a etiqueta "🤖 Robô simulado (teste)". Serve também para o aluno ou professor conhecer o fluxo sem o robô. **Não é um emulador de MicroPython**: entende só o que o editor envia (lista no cabeçalho do arquivo).

**2. Roteiro do fluxo** (`dev-local/lab/teste-robo-simulado.js`), 25 passos: conectar (e o aviso no Console) → rodar → saída no Console → rastro dos blocos escondido → programa infinito e **parar** → erro em português → listar, abrir, executar, gravar e excluir arquivos (com a barra de ações) → digitar no Console (o robô recebe exatamente o que foi digitado) → desconectar e botões de volta ao normal.
Resultado: **25 de 25 na v4 e 25 de 25 na v3, com a mesma lista de passos aprovados.**

**3. Desacoplamento:** o motor mexia em classes de CSS de botões da interface (`runButton.dom.className = 'icon'`...). Agora chama `UI['workspace'].idle()` e `isIdle()` (3 blocos e 5 checagens em `channel.js`). Repetido o roteiro depois: 25 de 25.

**O que o roteiro ensinou:** os retornos (callbacks) do motor são consumidos **um por prompt `>>>`**; se o aluno clicar em "atualizar a lista" enquanto um envio de arquivo ainda está terminando, a lista pode atualizar com a resposta errada. O roteiro espera o envio acabar (como uma pessoa esperaria). Vale lembrar para o M11 e para uma futura reescrita do motor (fila com identificador por comando).

**O que a F3 NÃO cobre:** Bluetooth e Wi-Fi (sem como testar sem hardware ou servidor), o comportamento do MicroPython de verdade (erros reais, memória, velocidade), arquivos grandes e desconexões no meio de um envio.

## 9. F4 — o que foi feito (2026-10-29)

O `index.html` perdeu **1114 linhas** (2277 → 1163): os recursos do SancaBot que viviam em `<script>` dentro dele agora são módulos em `ui-v4/app/recursos/`.

| Módulo | O que é | Como foi feito |
|---|---|---|
| `missoes.js` | Painéis de missão 1 a 4 (só com `?mission=N`, vindos do Studio) | **Reescrito**: uma fábrica `criarPainelMissao` + a descrição de cada missão (campos, sugestão, relato, dados e verificações). Eram **4 cópias de ~130 linhas** quase iguais; agora cerca de 150 linhas no total |
| `categorias.js` | Cor e ícone das categorias da caixa de blocos | Movido sem mudança |
| `rastro.js` | Tira as linhas `SANCABOT_TRACE` do Console e acende o bloco que roda | Movido sem mudança |
| `medidor-distancia.js` | Cartão de distância e leitura da Missão 2/4 a partir do que o robô imprime | Movido sem mudança |
| `tour.js` | Tour de preparação (`?tour=prep`) | Movido sem mudança |
| `modo-lento.js` | Botão da tartaruga | Reescrito pequeno; o botão agora **vem no HTML do cabeçalho** (antes era criado por JavaScript 0,6 s depois e "aparecia" no meio do cabeçalho) |

**Como foi verificado** (`dev-local/lab/paridade-recursos.js`, v3 × v4): para as 4 missões, abrir, sugestão calculada, relato rascunhado, dados enviados ao Studio (JSON), caixa de entrada do Studio, URL aberta, rascunho salvo, limpar, fechar e reabrir; o filtro do rastro com 7 entradas (inclusive quebradas no meio da linha); o cartão de distância com 4 leituras; cores e ícones das 54 categorias; a tartaruga. Resultado: **0 diferenças.** O tour (`?tour=prep`) abre igual nas duas. O roteiro de 25 passos do robô simulado continua **25 de 25**. Console do navegador sem erros novos.

**Não mudou de propósito:** textos, dados enviados ao Studio e chaves do `localStorage` (os rascunhos das missões da v3 continuam valendo na v4).
**Ficou para a F5:** o JavaScript do cookie, da tela de boas-vindas (`modal`), do Google Analytics e dos atalhos de teclado ainda está no `index.html`; também os arquivos `sancabot_layout.js`, `sancabot_panels.js`, `sancabot_header_early.js` e `sancabot_session.js`.

## 10. F5 — o que foi feito (2026-10-29)

**Saiu da v4** (continua na v3 congelada):
- `style.css` (2172 linhas) e `core/libs.css`; os 4 CSS de remendo (`sancabot_layout/scratch/empty/panels.css`).
- **Google Analytics** (`UA-162001686-1`) e o cookie do último IP/senha do Wi-Fi (o código só lia e ninguém gravava; o cookie guardava a senha). **Risco R2 resolvido na v4.**
- **Tela de boas-vindas** do BIPES (modal, texto, cookie "não mostrar de novo") e a regra `body { font-family: Arial }` que vinha junto: o texto sem fonte própria agora usa a Nunito da marca.
- **Blocos de OpenCV** (`jsCv/`): a caixa do SancaBot não os usa e o script dava erro ao carregar.
- **Componente PWA de um CDN** (`@pwabuilder/pwaupdate`, jsdelivr). O service worker (`pwabuilder-sw.js`) ainda carrega o Workbox de um CDN do Google, mas **nada o registra mais**: o modo offline fica desligado até o marco M16 (refazer sem CDN).
- Em `storage.js`: `BlocklyStorage.link`, `retrieveXml` e a fila de requisições. Elas enviavam o projeto a um endpoint `/storage` do servidor do BIPES que **o SancaBot não tem** (na prática o "Gerar link" nunca funcionou aqui, e não saía para o servidor do BIPES, como eu tinha suposto antes: era o mesmo servidor).
- Iframes das abas escondidas (IOT, EasyMQTT, Databoard) passam a carregar só se forem usadas (`loading="lazy"`), e a imagem de placeholder inexistente do Dispositivo saiu.

**Entrou / mudou:**
- `app/iniciar.js`: cria `Channel`, `terminal`, `Files`, `UI` e os atalhos de teclado (antes um `<script>` no `index.html`).
- Remendos de JavaScript movidos para `app/` com nomes próprios: `cabecalho-estrutura.js`, `cabecalho.js`, `sessao.js`, `paineis.js`.
- `shell.css`: as cores literais iguais aos tokens viraram `var(--sb-*)` (mesmo valor calculado, então sem mudança visual).
- **Link do projeto pela Galeria** ([ADR-020](DECISOES.md)): o item "Gerar link do projeto" do menu Projeto abre uma janela que lista os seus projetos da galeria com **Copiar link**, ou leva a compartilhar o projeto atual. Depois de compartilhar, o aviso ganha "Copiar link"; os cartões da galeria têm "🔗 Link". O link é `…/bipes/?galeria=ID`: abre o projeto **como projeto novo** (só se a pessoa puder ver aquele projeto). O **Remix** também passou a abrir como projeto novo, em vez de trocar os blocos do projeto aberto. A API devolve o `id` do projeto publicado (`test-gallery-api.sh`: 39 de 39).

**Como foi verificado:** `index.html` de 2277 para **735 linhas**; ao abrir, **0 requisições com erro e só o próprio servidor** (nenhum domínio de terceiros, nenhum `gtag`); paridade visual v3 × v4 em 1440 px (13 diferenças, todas de fonte para Nunito, de 1 a 20 px ou de um tom); paridade de comportamento (as mesmas 10 diferenças só nos ids aleatórios dos blocos); robô simulado **25 de 25**; link ponta a ponta (compartilhar, listar, abrir por `?galeria=ID`, projeto antigo preservado, crédito do remix, limpeza).

**Ainda chama terceiros, só quando o aluno usa** (recursos avançados herdados do BIPES): instalar biblioteca (`bipes.net.br/…/pylibs`) e carregar exemplo no Laboratório Avançado; ponte EasyMQTT (aba escondida); aviso "abrir a versão HTTPS" ao trocar de canal sem suporte.
**Dívidas que sobram** (F6 e depois): regras repetidas em camadas no `shell.css`; módulos do produto ainda em `core/sancabot_*.js` (reference, i18n, sim, gallery...) em vez de `app/`; `emulator.html`, `index_offline.html`, `ports.html` e `easymqtt_bridge.html` (páginas do BIPES que a v4 não serve); abas escondidas.

## 11. F6 — o que foi feito (2026-10-29)

**Um comando:** `dev-local/testar.sh` (ou `cd dev-local/testes && node rodar.js`). Usa o Chrome já instalado (`puppeteer-core`, sem baixar navegador), precisa do servidor ligado. **105 verificações em cerca de 2,5 minutos.** Sai com código 1 se algo falhar, então serve também para CI no futuro.

| Suíte | O que confere | Verificações |
|---|---|---|
| `carregamento` | Para cada aba (Blocos, Console, Arquivos, Galeria, Robô): a aba certa ativa, Blocos só aparecem se for a aba, painel de código escondido, **nenhuma outra tela pisca depois que a página aparece** (quadro a quadro), página em < 2,5 s, só o próprio servidor, sem `gtag`, **0 requisições com erro e 0 erros no console** | 50 |
| `console` | Em 1280×720, 1440×900, 1920×1048 e 1920×1080: sem rolagem, espaço embaixo, terminal ≥ 8 linhas, engrenagem alinhada, botões redondos e em fila | 20 |
| `acabamento` | Os alinhamentos já corrigidos uma vez: Arquivos, menu Projeto (ícones e cores), Conectar (× centralizado, clicar fora fecha), caixa de blocos (contraste, espaço, sem contorno), Perfil (alinhamento, sem idioma, renomear) | 14 |
| `robo` | Os 25 passos do robô simulado na v4 e na v3, com os **mesmos passos aprovados** | 3 |
| `paridade` | Missões, rastro, distância, categorias, modo lento, projetos, telas, painéis, conexão, avisos e Python: iguais à v3 | 3 |
| `visual` | v4 × v3 em 390, 1024, 1440 e 2560 px; falha só com diferença **nova** (as aceitas estão em `baseline-visual.json`) | 4 |
| `sessao` | Recarregar mantém blocos, zoom e posição | 3 |
| `galeria` | Conta de aluno, compartilhar, link `?galeria=ID`, projeto novo sem perder o antigo, crédito do remix, limpeza | 5 |
| `api` | `test-gallery-api.sh` (39), `test-blocks-api.sh` (44), `test-identidade.sh` | 3 |

**Os testes pegam o que já quebrou:** conferi por mutação. Estraguei de propósito dois ajustes (botões do Console voltaram a ser quadrados; texto de "Conectar" no topo da pílula) e 5 verificações falharam; restaurei e voltaram a passar.

**O que o primeiro uso achou:** a v4 tentava carregar o iframe da aba IOT (desligada) e gerava um erro 404 em toda abertura. Corrigido (o `src` virou `data-src`).

**Também entregue:** `dev-local/versoes/promover.sh` (testa, pede confirmação, guarda backup, troca, congela; **não foi executado**) e [PROMOCAO-V4.md](PROMOCAO-V4.md) com o checklist, o que falta e como voltar.

**Limites:** o teste visual compara com a v3 por medidas (posição, tamanho, estilos), **não por imagem**; não vê animação nem se algo "está bonito". A varredura de inglês e o ▶ Jogar do simulador ainda não têm teste. Nada disso substitui o teste com o robô real.
