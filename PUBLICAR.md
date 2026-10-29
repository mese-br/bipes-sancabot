# PUBLICAR: painéis do BIPES SancaBot (branch `feat/paineis-satblocks`)

Estado: **tudo local, sem commits e sem push.** Arquivos alterados/novos:

| Arquivo | O quê |
|---|---|
| `ui/core/sancabot_panels.js` (novo) | A1 código ao vivo + Copiar/Baixar, A2 recolher/fixar (alfinete em ícone), A3 responsivo, A4 hover suave com intenção, A5 redimensionar, painéis como camadas, B6 nome da conta |
| `ui/core/sancabot_panels.css` (novo) | estilo dos painéis, folha inferior, botões de borda |
| `ui/core/sancabot_reference.js` (novo) | A6 Referência ligada à caixa de blocos: tópicos e blocos lidos do toolbox, Python do gerador real, busca, Usar bloco e arrastar |
| `ui/core/sancabot_reference_data.js` (novo) | textos em português: introdução por categoria e descrição de cada bloco |
| `ui/index.html` | 1 `<link>` e 3 `<script>` (versão `?ver=sancabot-20261022-5`) |
| `README-SANCABOT.md` | seção nova + atribuição ao SatBlocks |

## Como testei (ambiente local, `http://localhost:8090/bipes/`)
Navegador de pré-visualização, 1280/1000/700/375 px (375 com emulação de toque). Cada item abaixo passou:
* **A1** painel mostra o programa sem funções de apoio nem `sancabot_trace`; "Código completo" inclui as funções; muda ao editar; vazio mostra aviso e desliga Copiar/Baixar; Copiar entrega o código completo; Baixar gera `sancabot.py` e o arquivo real (149 linhas) passou em `python3 -m py_compile`.
* **Camadas (sem empurrar):** os painéis são camadas por cima da área de desenho. Abrir, fechar, fixar ou soltar não muda a largura da área de desenho nem a posição de nenhum bloco (medido: tamanho da área, origem e posição de cada bloco idênticos antes e depois, nos quatro movimentos, em 1280 px e no celular). Para o Blockly a caixa de blocos "ocupa 0 px"; a lista de blocos abre colada à caixa (x = 207). Zoom e lixeira saem de baixo do painel fixado (só esses controles se movem, os blocos não).
* **Alfinete sem texto:** fixar/soltar é um ícone. Solto = contorno, inclinado 45°; fixado = preenchido, reto, fundo azul (medido por estilo calculado: `fill`, rotação e fundo diferentes; `aria-pressed` e `title` descrevem o estado; nenhum texto "Fixar/Fixado" aparece nos painéis).
* **Animação do hover (suave):** abre depois de ~160 ms com o mouse na borda (173 ms medidos; passar de raspão em 80–90 ms não abre) e só recolhe ~650 ms depois de sair (660 ms medidos; voltar a tempo cancela). Desliza e esmaece, 440 ms ao abrir e 360 ms ao fechar, curva `cubic-bezier(.4, 0, .2, 1)` (só 3% do caminho nos primeiros 10% do tempo). Verificado pela API de animações do navegador (duração, curva e posição em instantes escolhidos). `prefers-reduced-motion` desliga o deslize. Soltar o alfinete com o mouse em cima mantém aberto até o mouse sair.
* **A3** 1000 px: tudo recolhido, botões de borda; 700 px: folha inferior por cima (largura total, 46% da altura, **a área de desenho não encolhe**; zoom e lixeira sobem para fora da folha); sem mouse: zonas de hover desligadas, hover não abre nada, botões de borda abrem.
* **A4** hover abre o painel como camada; sair, Esc ou o alfinete funcionam.
* **Caixa de blocos (esquerda), com mouse real:** faixa **"Fixado | ‹"** no topo do menu (antes o botão ficava na base, fora da janela). Soltar (clicar em "Fixado") recolhe; passar o mouse na borda esquerda ou no botão "Blocos ›" abre a caixa sem empurrar a área de trabalho, e aparece "Fixar"; clicar em "Fixar" mantém aberta e guarda a escolha. Aberta por hover, ela **não recolhe enquanto o mouse estiver no menu ou na lista de blocos que abre ao lado**, nem no meio de um arrasto de bloco; recolhe ao soltar o bloco fora do menu, ao afastar o mouse (450 ms) ou com Esc. Testado: abrir categoria, mover para a lista, arrastar um bloco para a área de trabalho (entrou) e recolher sozinha.
* **A5** setas ±24 px, Home (280), End (60% da tela), duplo clique (380), arrasto de ponteiro; largura guardada; separador com `role`/`aria-valuenow`.
* **A6 Referência (v2, ligada à caixa de blocos):**
  * **Ligação:** clicar uma categoria na caixa de blocos abre a aba Referência no tópico equivalente (Movimento, Controle, Tempo, Condições, Modelos, Experimental, Variável e as do Laboratório Avançado, inclusive categorias-mãe com botões de subcategoria). Com "Seguir a caixa de blocos" desligado a aba não muda, mas o tópico já fica certo; a escolha é guardada. Painel recolhido: não abre sozinho.
  * **Completa:** 53 categorias; 258 instâncias de bloco do toolbox = 234 linhas + 24 variações (máx. 3 do mesmo bloco por categoria, ex.: 29 músicas em "Sounds") = 258/258. Nenhuma linha sem descrição; todos os tipos de bloco do Laboratório Avançado têm descrição em português curada (os blocos do SancaBot usam o texto do próprio bloco).
  * **Python real:** o Python de cada linha é o do gerador, igual ao reconstruído de forma independente (3 blocos têm identificadores aleatórios do próprio gerador: `utime.deadline`, `easymqtt_init`, `easymqtt_subscribe`).
  * **Busca** em toda a referência (sem diferenciar acento; acha por rótulo, descrição e código) e seletor com as 53 categorias.
  * **Do código para os blocos:** "Usar bloco" insere o bloco ou a pilha inteira na parte visível da área de trabalho; arrastar a linha e soltar cria o bloco **exatamente onde soltou** (erro < 2 px); funciona também a partir de resultado de busca.
  * Celular (700 px): folha inferior com seletor (botões de categoria escondidos para poupar altura).
* **Trace e leituras** seguem funcionando (destaque do bloco e selo ×N, `sancabot_trace` ainda no código enviado); trocar de aba (Console, Arquivos) esconde o painel sem deixar faixa.
* **B6** com sessão do Studio mostra o nome (somente leitura); `localStorage` intocado.

**Observado, já existente (não causado por esta mudança):** inserir o modelo de "Modelos" e apertar Ctrl+Z deixa para trás o bloco "mostrar leitura no painel" (acontece igual criando a pilha pelo caminho normal do Blockly, sem a Referência).

**Não testado:** robô real, dispositivo de toque físico, Safari/Firefox, `index_offline.html`, leitor de tela.
Erros de console que **já existiam** antes (confirmados no primeiro carregamento): `jsCv/v30.js ADAPTIVE_THRESH_GAUSSIAN_C`, 404 de recursos e registro do service worker, causados pelo roteador de desenvolvimento.

## O que muda no servidor real
* Nada de configuração. Publicar os 4 arquivos em `ui/` (3 novos + `index.html`). O `?ver=` já força o cache a renovar.
* B6 chama `/studio/api/login.php?action=me` (mesmo domínio). Só funciona depois de publicar a Parte B do Studio; antes disso falha em silêncio e o painel segue como era.
* `ui/index_offline.html` precisa dos mesmos 3 arquivos embutidos (não feito).

## Riscos e o que ficou de fora
* **Camada da caixa de blocos mexe em partes internas do Blockly** (`toolbox.getWidth` devolve 0, `flyout.getX` desloca a lista, `getUiMetrics` recua zoom e lixeira). Está amarrado à versão fixa **6.20210701.0** e protegido por verificação de existência (se algo mudar, cai no comportamento normal do Blockly e avisa no console); revisar ao atualizar o Blockly.
* Com os painéis por cima, **parte da área de desenho fica coberta enquanto eles estão abertos** (é o que se pediu). Blocos que estiverem sob um painel ficam inacessíveis até recolhê-lo; "Usar bloco" já insere na parte livre.
* **Tempo real da animação não foi medido a olho**: o painel de teste renderiza ~1–2 quadros por segundo. A duração, a curva e a posição foram verificadas pela API de animações, mas vale **olhar uma vez num navegador normal** e ajustar `--sb-open-ms`, `--sb-close-ms` e `--sb-ease-*` no CSS (e `OPEN_DELAY`/`CLOSE_DELAY` no JS) ao seu gosto.
* Em tela estreita a largura salva (até 60%) pode comer muito da área de blocos; se incomodar, limitar no `applyBucket`.
* Glossário, tour, perfis de oficina e melhorias educacionais continuam fora desta etapa.
* **As descrições dos blocos do Laboratório Avançado (hardware) foram escritas a partir do rótulo e do tooltip de cada bloco, sem ler cada gerador nem ligar o componente.** Peça a revisão de quem conhece o hardware (ex.: pinos do RFID RC522, unidade da distância do HC-SR04, `deep_sleep8266` no ESP32-C3).
* "Puxar código para o bloco" significa trazer o bloco equivalente ao trecho mostrado. **Não há conversão de Python livre para blocos** (o BIPES não tem esse parser).
* Se o toolbox mudar (outra placa), a Referência se reconstrói sozinha na próxima abertura; testado só com o toolbox do SancaBot.
* Pinos: a Referência mostra os pinos do gerador (motores 0/1, ultrassom 7/8 no exemplo testado). **Confirmar no hardware ESP32-C3.**


---

# Blocos criados no SancaBot Studio Creator (categoria Experimental dinâmica)

Estado: **local, sem commits.** Ferramenta e API ficam no repositório do Studio (`docs/creator.md`).

| Arquivo | O quê |
|---|---|
| `ui/core/sancabot_custom_blocks.js` (novo) | formato declarativo do bloco, validação (`sanitize`), registro no Blockly, geração de Python segura e as saídas de código; **o Creator carrega este mesmo arquivo** |
| `ui/core/sancabot_custom_loader.js` (novo) | registra os blocos publicados (e rascunhos com `?creator=1`) e alimenta a categoria Experimental |
| `ui/toolbox/sancabot.xml` | Experimental ganhou `custom="SANCABOT_EXPERIMENTAL"` (sem o antigo rótulo "Espaço livre") |
| `ui/index.html` | 2 `<script>` novos, depois de `generator_stubs_sancabot.js` |
| `ui/core/sancabot_reference.js` | Referência > Experimental lê os blocos criados (com Python e descrição) |

## Como testei
Editor (`http://localhost:8090/bipes/`): `?creator=1` registra publicado + rascunhos; o flyout de Experimental lista os blocos; gera Python com os valores do aluno (importações, preparação, funções de apoio, linha de acompanhamento); cor `#94a3b8`; sem blocos criados a categoria mostra o aviso e a Referência também; **projeto salvo com bloco criado reabre intacto** depois de recarregar (4/660/120); só o **publicado** aparece para quem abre normalmente; a Referência mostra o bloco com Python e dica. Regressão: 53 categorias e 234 linhas na Referência sem erro; painéis seguem como camadas.

**Não testado:** `index_offline.html` (não recebeu os arquivos novos), outro navegador, robô real.

## O que muda no servidor real
Publicar os 3 arquivos novos/alterados em `ui/` (`sancabot_custom_blocks.js`, `sancabot_custom_loader.js`, `sancabot.xml`, `index.html`, `sancabot_reference.js`). O carregador chama `/studio/api/blocks.php?action=published` no mesmo domínio; sem a API ele falha em silêncio e o editor segue normal.

## Riscos e o que ficou de fora
* **Projeto compartilhado que usa bloco experimental, aberto por quem nunca carregou o catálogo (sem cache):** na primeira abertura o bloco ainda não existe e o Blockly não o reconhece. O cache cobre quem já abriu o editor com o catálogo publicado. Se isso virar problema, o próximo passo é carregar o catálogo antes de restaurar o projeto (bloqueando a abertura por um instante) ou trocar blocos desconhecidos por um marcador.
* **Despublicar** um bloco usado em projetos faz o bloco sumir deles.
* **Promoção continua manual** (copiar as saídas para os arquivos do repositório): é a convenção do README-SANCABOT.md. Quando um bloco é promovido, é preciso **despublicá-lo** para ele não existir duas vezes (o nome `sancabot_x_…` é diferente do definitivo, então não há conflito de código).
* **O módulo de validação existe em JS e em PHP** (espelhados). Mudou uma regra, mude nos dois e rode `dev-local/test-blocks-parity.sh`.
