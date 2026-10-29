# Limpeza: o que parece não ser usado ou ser legado

Levantamento de 29/10/2026, para decidir em grupo. **Nada foi apagado.** A coluna "Decisão" está em branco para quem for decidir preencher.

## Como foi levantado

1. Abri a v4 (`ui-v4/`) num Chrome automatizado e percorri todas as telas, o simulador, os dois robôs, o tour, o perfil, o modo Avançado e as missões 1 a 4, anotando todo arquivo que o navegador baixou. Foram 81 arquivos usados, de 430.
2. Procurei no código quem cita o resto (`index.html`, `app/`, `core/`).
3. Olhei no git quem criou cada coisa e quando.

Atenção ao limite do método: "não carregou" não prova que ninguém usa. Um arquivo pode ser pedido só em situações que o teste não cobriu (por exemplo, abrir um projeto salvo para outra placa). Por isso cada item tem um nível de certeza.

A pasta `ui/` (v3) não entra aqui. Ela é a cópia congelada da versão em produção e só deve ser limpa depois que a v4 for promovida. Muito do que está abaixo existe nas duas.

## Certeza alta: sem uso, ou o próprio arquivo diz que é lixo

| Item | Tamanho | Origem | Por que parece lixo | Decisão |
|---|---|---|---|---|
| `.gitmodules.save` | 4 KB | joaodrj, 2024 | O texto dentro dele diz "arquivo obsoleto, recomenda-se exclusão" | |
| `.github/workflows/bipes_offline.yml.bak` | pequeno | Jorge Marques, 2021 | Extensão `.bak`: o GitHub não executa | |
| `docs/sync.ffs_db`, `easymqtt/sync.ffs_db` | pequeno | Carlos Matos, 2024 | Bancos do FreeFileSync, esquecidos no commit | |
| `ui/core/code.js.save`, `ui-v4/core/code.js.save` | 0,5 KB | Carlos Matos, 2024 | Backup de 503 bytes; o `code.js` de verdade é outro | |
| `ui-v4/core/blockly_compressed.js`, `blocks_compressed.js`, `python_compressed.js` | cerca de 0,8 MB | Jorge Marques, 2021 | É o Blockly 6; o `index.html` só carrega o Blockly 13 (`core/blockly13/`) | |
| `ui-v4/b.msg/` | 5,4 MB (175 arquivos) | Rafael Vidal Aroca, 2020 | Mensagens do Blockly 6. O `code.js` carrega só o `b.msg/js/pt-br.js`; os outros idiomas e a pasta `json/` ficam parados | |
| `ui-v4/pylibs/` | 272 KB | Rafael Vidal Aroca, 2020 | O código busca as bibliotecas em `/beta2/ui/pylibs/` no servidor do BIPES, nunca nesta pasta | |
| `ui-v4/examples/` | 112 KB | Rafael Vidal Aroca, 2020 | Idem: o código busca em `/beta2/ui/examples/`. Os exemplos do SancaBot ficam em `sancabot_sim_examples.js` | |
| `ui-v4/index_offline.html` | 680 KB | gerado pelo `make offline` | O modo offline está desligado até o M16 e o arquivo está velho | |
| `ui-v4/pwabuilder-sw.js` | 4 KB | BIPES | Só aparece em um comentário do `index.html`; carrega um CDN do Google | |
| Pastas vazias: `ui-v4/freeboard/`, `ui-v4/bipes-micropython-unicorn/`, `databoard/`, `webrepl/` | 0 | submódulos nunca baixados | Estão vazias na máquina de quem clonou. `webrepl` é citado pelo `make copy`; as outras, só pelo `.gitmodules` | |

Total aproximado só deste bloco: **6,5 a 7 MB** dentro de `ui-v4/`.

## Do BIPES original, provavelmente legado, mas vale conversar

| Item | Tamanho | Origem | O que é e quem poderia usar | Decisão |
|---|---|---|---|---|
| `bipes_block_generator/` | 420 KB | Rafael Vidal Aroca, 2020 | Ferramenta do BIPES para gerar blocos. Só o `Makefile` cita (`copy-bipes-blocks`). Os blocos do SancaBot são escritos à mão em `block_definitions_sancabot.js` | |
| `bipes_blocks/` | 36 KB | Rafael Vidal Aroca, 2020 | Idem | |
| `appengine/` | 96 KB | Rafael Vidal Aroca, 2020 | Configuração do Google App Engine do projeto do BIPES (`bipes-271213`), com um armazenamento de projetos na nuvem. É o `/storage` que o antigo "Gerar link" chamava e que nunca funcionou aqui | |
| `easymqtt/` | 156 KB | Carlos Matos, 2024 | PHP do servidor EasyMQTT do BIPES. A tela de Console tem a linha de EasyMQTT, que abre uma ponte pelo `easymqtt_bridge.html`. Antes de remover, confirmar se alguém usa MQTT nas aulas | |
| Abas IOT, EasyMQTT e Databoard (escondidas), `freeboard`, `databoard` | n/a | BIPES | Estão desligadas por CSS e só reapareceriam se alguém as reativasse | |
| Outras placas: 11 arquivos em `toolbox/`, 16 entradas em `devinfo/devinfo.json`, `devinfo/media/` | cerca de 4 MB | BIPES | Só aparecem se um projeto trouxer o `DEVICE` de outra placa. O editor do SancaBot só oferece o robô (Free v1.0 e v2) | |
| `ui-v4/media/*.png` (dcmotor, oled, max30100…) | 5 MB | BIPES | Imagens de blocos de outras placas e sensores. Conferir quais o `sancabot.xml` usa antes de apagar | |
| `docs/` do Sphinx: `conf.py`, `index.rst`, `core/`, `get-started/`, `block-tutorials/`, `_static/`, `Makefile`, `make.bat` | cerca de 0,1 MB | Jorge Marques, 2021, e Carlos Matos, 2024 | Documentação em inglês do BIPES, não do SancaBot. O alvo `make doc` do `Makefile` a compila | |
| `ui-v4/emulator.html` | 24 KB | Carlos Matos, 2024 | Só os blocos antigos do BIPES apontam para ele | |
| `bipes.png` | 60 KB | Rafael Vidal Aroca, 2021 | Ninguém cita depois que o README foi refeito | |
| Idiomas do Blockly 13 além do português e do inglês: `core/blockly13/msg/` e `plugins/` | cerca de 0,4 MB | Blockly | O editor só usa `pt-br` | |

## Desatualizado ou confuso (não é lixo, mas mente)

| Item | Problema | Decisão |
|---|---|---|
| `PUBLICAR.md` | Fala da branch `feat/paineis-satblocks` (apagada do GitHub) e diz "tudo local, sem commits e sem push". Nenhum dos dois é verdade hoje | |
| `CHANGES-TRACE-V2-20260706.md` | Bilhete de passagem para o Codex (Marcos Tan Endo, 2026-10-19). É histórico; caberia em `docs/projeto/` | |
| Menções ao **SatBlocks** | Aparecem em `README-SANCABOT.md`, `PUBLICAR.md`, `CHANGELOG.md`, em comentários de `ui-v4/app/paineis.js` e `shell.css`, e em arquivos da v3 (`sancabot_panels.*`, `sancabot_layout.*`, `sancabot_reference.js`). Algumas são atribuições de "inspirado em `obsat-oficial/satblocks` (GPL-3.0)". **Se o código foi mesmo derivado de lá, a atribuição precisa ficar** (a GPL exige). Se não foi, dá para tirar. Quem escreveu essas partes sabe dizer | |

## O que eu sugiro, se o grupo concordar

1. **Primeiro passo, risco baixo:** o bloco de certeza alta, mais a correção do `PUBLICAR.md`. Depois rodar `dev-local/testar.sh` (122 verificações) para ver que nada quebrou.
2. **Segundo passo:** só os itens do segundo bloco que o grupo aprovar, um de cada vez, com teste depois de cada um.
3. **Terceiro passo:** a `ui/` (v3) só depois de promover a v4. Aí o `restaurar.sh v3` deixa de depender dessa cópia, e ela pode ir embora com o restante do legado.

Perguntas para quem for decidir:
- Alguém usa EasyMQTT, IOT ou Databoard nas aulas?
- Algum aluno ou professor abre projetos salvos para outras placas (ESP8266, Pico, Arduino)?
- O `appengine/` ainda hospeda alguma coisa?
- O SatBlocks é dependência, inspiração ou nada disso?
