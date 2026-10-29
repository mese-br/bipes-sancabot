# Status das funcionalidades

Atualizado em **2026-10-28** · versão **v3** · legenda em [README.md](README.md). Evidência: `auto` = teste automático, `nav` = navegador de desenvolvimento, `robô` = robô real (**nenhum item foi testado com robô real**).

## Resumo

| Área | ✅ | 🟢 | 🟡 | ⚪ | 🔴 |
|---|---|---|---|---|---|
| A. Editor de blocos | 6 | 1 | 1 | 0 | 0 |
| B. Português | 4 | 1 | 1 | 0 | 0 |
| C. Simulador e missões | 7 | 0 | 1 | 1 | 1 |
| D. Conexão com o robô | 1 | 0 | 2 | 0 | 2 |
| E. Interface e design | 10 | 0 | 2 | 2 | 0 |
| F. Galeria | 6 | 0 | 3 | 3 | 0 |
| G. Plataforma (Studio) | 2 | 1 | 0 | 4 | 0 |
| H. Engenharia | 3 | 0 | 1 | 3 | 1 |

## A. Editor de blocos

| Item | Status | Evidência | Falta |
|---|---|---|---|
| Blockly 13.4.0 com renderizador e tema `sancabot` | ✅ | nav; Python gerado idêntico em v1/v2/v3 | — |
| Paleta viva (13 cores), ícones em blocos e categorias, "Decidir" e "Repetir" | ✅ | nav | — |
| Blocos do SancaBot (29 definições) | ✅ | nav + paridade de geração | Validar com o robô |
| Modo iniciante (esconde categorias técnicas) | ✅ | nav | — |
| Blocos do Creator (publicados pelo Studio) | ✅ | auto (44) | — |
| Salvar projetos no navegador e retomar a sessão (aba, zoom, posição) | ✅ | nav | — |
| Laboratório Avançado (parte dos 193 tipos de bloco da caixa vem do BIPES) | 🟢 | carregam e geram código | Não testados com hardware; fora do foco da turma |
| Portas com nome | 🟡 | nav (só na v4) | v4 usa os nomes do firmware (Servo 0 e 1, IR 5 e 6, Ultrassom 7 e 8); **confirmar com a placa** qual servo/IR é esquerdo/direito. Ver [MEDIDAS-DO-ROBO.md](MEDIDAS-DO-ROBO.md) |

## B. Português do Brasil

| Item | Status | Evidência | Falta |
|---|---|---|---|
| Blocos, menus, dicas e Referência (auditoria sem linhas em inglês) | ✅ | nav | — |
| Avisos e confirmações do BIPES | ✅ | nav | — |
| Painel de Código | ✅ | nav | — |
| Mensagens de erro do robô no Console (com interruptor e eco protegido) | ✅ | nav | — |
| Erros desconhecidos do MicroPython | 🟢 | nav | Ficam em inglês; um `print` igual a uma mensagem de erro também é traduzido (desligar o interruptor resolve) |
| Abas herdadas (IOT, EasyMQTT, Databoard) | 🟡 | — | Escondidas e **mantidas** para uso futuro; não traduzidas nem auditadas |

## C. Simulador e missões

| Item | Status | Evidência | Falta |
|---|---|---|---|
| Trajetória com percurso-alvo, obstáculos e desvio do mundo real | ✅ | nav | — |
| Verificação do programa (erros e avisos) | ✅ | nav | — |
| 8 exemplos prontos com 3 dicas cada | ✅ | nav | — |
| Destaque do bloco em execução | ✅ | nav | — |
| Missões com estrelas (0–3) e evento `sancabot:missao` | ✅ | nav | — |
| Abre parado; o aluno aperta ▶ Jogar | ✅ | nav (animação simulada) | Ver a animação em navegador normal |
| Fecha ao sair da aba Blocos; o botão leva aos Blocos | ✅ | nav | — |
| **⚠️ Medidas do robô** (`trackCm` = 10 cm, giro 90° em 1 s a 50%, tablado 120×80) | 🟡 | — | **PENDENTE e provisórias**: o responsável vai medir. Ver [MEDIDAS-DO-ROBO.md](MEDIDAS-DO-ROBO.md) |
| Estrelas gravadas no servidor (progresso da turma) | ⚪ | — | O Studio ainda não escuta `sancabot:missao` |
| Fidelidade da simulação em relação ao robô | 🔴 | — | Depende de hardware |

## D. Conexão com o robô

| Item | Status | Evidência | Falta |
|---|---|---|---|
| Diálogo "Conectar o robô" (USB, Bluetooth, Wi-Fi) e botão Conectar único | ✅ | nav (conexão simulada por `mux.connected()`) | — |
| Botão Rodar com 3 estados (abre o diálogo / ▶ / ■) | 🟡 | nav simulado | Fluxo real conectar → rodar |
| Código de conexão (`channel.js`: Serial, Bluetooth, Wi-Fi) | 🟡 | herdado do BIPES | Revisar e testar com o robô |
| Fluxo completo com robô **simulado** (conectar, rodar, parar, Console, arquivos, erros, desconectar; 25 passos) | ✅ | auto-navegador (v3 e v4 iguais) | Não substitui o robô real |
| Teste real de conectar → enviar → rodar → parar | 🔴 | — | Precisa do robô |
| Bluetooth em iPad/Safari | 🔴 | — | Web Bluetooth costuma não existir no iPad; definir alternativa |

## E. Interface e design

| Item | Status | Evidência | Falta |
|---|---|---|---|
| Cabeçalho com menu Projeto, abas que viram menu, Simular e Conectar | ✅ | nav 390–2560 px | — |
| Perfil com apelido editável | ✅ | nav | — |
| Avisos em painel flutuante | ✅ | nav | — |
| Painéis laterais fixáveis (estado visível) | ✅ | nav | — |
| Console com tema próprio | ✅ | nav | — |
| Dispositivo (cartão do robô) | ✅ | nav | — |
| Estados vazios com o mascote | ✅ | nav | — |
| Carregamento sem piscada | ✅ | nav (medido ≈0,16 s) | Ver em navegador normal |
| Layout para telefone, tablet e tela grande | ✅ | nav (emulado) | Teste em tablet real |
| Arquivos no padrão do SatBlocks: Executar, Baixar e Excluir na barra do editor, sobre o arquivo aberto | ✅ | nav (com o robô simulado) | Testar com o robô real (M11) |
| Contraste e foco por teclado | 🟡 | nav | Sem auditoria formal de acessibilidade (WCAG) |
| Tour guiado de primeira abertura | ⚪ | — | Previsto no plano da plataforma |
| Glossário "o que é isto?" | ⚪ | — | Previsto no plano da plataforma |
| Camada antiga do BIPES (HTML/CSS/JS de interface) | 🟡 | CSS: auto (script de paridade); JS: pendente | **Troca completa na v4 (`/bipes-v4/`), com a v3 preservada.** F0 a **F5 concluídas** (CSS, núcleo, robô simulado, recursos em módulos, código antigo e rastreadores fora); **F6 concluída** (111 testes automáticos com um comando e checklist de promoção). Falta o **teste com o robô real** e a decisão de promover; ver [PROMOCAO-V4.md](PROMOCAO-V4.md). Ver [MIGRACAO-V4.md](MIGRACAO-V4.md) |

## F. Galeria de projetos

| Item | Status | Evidência | Falta |
|---|---|---|---|
| Abas, cartões, miniatura dos blocos, detalhes | ✅ | nav | — |
| Compartilhar (Só eu / Turma / Comunidade) | ✅ | nav + auto | — |
| Aprovação pelo professor, com motivo ao recusar | ✅ | nav + auto | — |
| Curtidas por reações prontas (sem comentários livres) | ✅ | nav + auto | — |
| Remix com crédito vindo do servidor | ✅ | nav + auto | — |
| API (`gallery.php`) e 38 testes | ✅ | auto | — |
| Turmas reais | 🟡 | — | Todos os alunos estão na turma `geral` até o login informar a turma |
| Lista de palavras bloqueadas | 🟡 | — | A lista está vazia; definir com a escola (`STUDIO_GALLERY_BLOCKED_WORDS`) |
| Escala (XML de cada projeto vem na lista) | 🟡 | — | Gerar miniatura no servidor |
| Denúncia | ⚪ | — | — |
| Simular dentro do cartão | ⚪ | — | — |
| Comentários | ⚪ | — | **De propósito não existem** (público infantil) |
| Link do projeto pela galeria (`?galeria=ID`, abre como projeto novo) e "Copiar link" | ✅ | nav + auto (API devolve o id) | Só na v4 |

## G. Plataforma (Studio, contas, turmas)

| Item | Status | Evidência | Falta |
|---|---|---|---|
| Sessão por cookie assinado; papéis admin/aluno/visitante | ✅ | auto (identidade, 44 de blocos, 38 da galeria) | — |
| Studio Creator (blocos criados por administradores) | ✅ | auto | — |
| Login com a loja (SSO) | 🟢 | auto contra a loja **simulada** | Integrar com a loja real |
| Turmas, painel do professor ao vivo | ⚪ | — | [studio-v2-escopo.md](../../../sancabot-studio/docs/studio-v2-escopo.md) |
| Progresso, XP, ranking, medalhas | ⚪ | — | Plano da plataforma, fases 5 e 7 |
| Editor dentro do Studio (`iframe` + `postMessage`) | ⚪ | — | Plano, fase 3 |
| Currículo e códigos BNCC por missão | ⚪ | — | Sessão de curadoria com o professor |

## H. Engenharia

| Item | Status | Evidência | Falta |
|---|---|---|---|
| Ambiente local (`dev-local`, Docker, porta 8090) | ✅ | — | — |
| Versões congeladas (v1, v2) para comparar e voltar | ✅ | — | — |
| Documentação técnica | ✅ | este conjunto | Manter atualizada |
| Testes automáticos de API | 🟡 | 3 suítes de shell/PHP | Falta cobrir a interface |
| Testes automáticos da interface (navegador) | ✅ | `dev-local/testar.sh`: 111 verificações (carregamento, console, acabamento, robô simulado, paridade com a v3, visual, sessão, galeria, API) | Faltam ▶ Jogar do simulador e varredura de inglês |
| Integração contínua (CI) e lint | ⚪ | — | — |
| Controle de versão (git) para `bipes-sancabot` | ⚪ | — | A pasta não está num repositório; decidir quando começar a commitar |
| Publicação e PWA offline | 🔴 | — | O service worker dá 404 no ambiente de dev; verificar em produção |
