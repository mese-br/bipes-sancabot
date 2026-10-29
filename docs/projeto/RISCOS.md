# Riscos, perguntas em aberto e dívidas técnicas

Atualizado em 2026-10-28. Probabilidade (P) e impacto (I): A alta, M média, B baixa.

## 1. Registro de riscos

| ID | Risco | P | I | Resposta | Responsável |
|---|---|---|---|---|---|
| **R1** | **Nada está em controle de versão**: a pasta do editor não é um repositório; só há cópias congeladas (v1, v2). Uma perda de disco apaga meses de trabalho. | M | A | Inicializar o repositório e fazer o primeiro commit assim que o responsável aprovar; enquanto isso, cópia de segurança periódica. | Responsável |
| **R2** | **Google Analytics e CDNs de terceiros carregados para todos**, inclusive crianças (rastreador `UA-162001686-1`, componente PWA no jsdelivr). | A | A | **Resolvido na v4 (F5, 2026-10-29):** fora do código; ao abrir só o próprio servidor é chamado. **Continua na v3 (`/bipes/`)**: a v4 precisa substituí-la antes de qualquer piloto. Restam chamadas a terceiros só em recursos avançados usados de propósito (lista no MIGRACAO-V4, seção 10). | Responsável (promover a v4) |
| **R3** | **Robô real nunca testado e medidas provisórias** (ver [MEDIDAS-DO-ROBO.md](MEDIDAS-DO-ROBO.md)): conexão, envio, rodar, parar, arquivos e a fidelidade do simulador são suposições. | A | A | M11 antes de levar à escola; roteiro curto e uma sessão de bancada. | Responsável |
| **R4** | **Interface sobre código antigo**: cada ajuste briga com CSS herdado; regressões visuais aparecem sem aviso. | A | M | M10 (testes) e depois M8 (substituir por partes). | Claude |
| **R5** | **Menores e LGPD**: apelido, avatar, projetos públicos, login por PIN, IA. Precisa de consentimento do responsável legal e revisão jurídica dos textos. | M | A | Manter apelido apenas, sem comentários livres, aprovação do professor; texto jurídico aprovado antes do piloto. | Responsável |
| **R6** | **Moderação**: lista de palavras bloqueadas vazia; sem denúncia; título é texto livre. | M | M | Definir a lista com a escola e criar a denúncia (M13). | Responsável + Claude |
| **R7** | **Armazenamento em arquivo JSON**: não escala e depende de bloqueio de arquivo. | M | M | Migrar para MySQL (D3) antes de uso em muitas turmas. | Claude |
| **R8** | **Dependência da loja** (OpenCart, já invadida antes) como ponto único de identidade. | M | A | Módulo SSO mínimo e fora do núcleo, como no plano. | Responsável |
| **R9** | **Web Bluetooth varia** (Chromebook, iPad/Safari): alunos podem não conseguir conectar. | A | M | Testar nos aparelhos da escola; oferecer USB e Wi-Fi como alternativas. | Responsável |
| **R10** | **PWA offline não verificado**: o service worker dá 404 no ambiente de desenvolvimento. | M | B | Verificar em produção (M16). | Claude |
| **R11** | **Estimativas de esforço são palpites**: dependem do ritmo de revisão e do hardware. | M | M | Reavaliar ao fim de cada marco. | Ambos |

## 2. Perguntas e decisões (respondidas em 2026-10-28)

| # | Pergunta | Resposta do responsável | Efeito |
|---|---|---|---|
| 1 | Interface própria (M8) | **Fazer de uma vez**, preservando o que existe e com caminho de volta | v3 congelada; v4 em construção ([ADR-018](DECISOES.md), [MIGRACAO-V4.md](MIGRACAO-V4.md)) |
| 2 | Arquivos: ações na barra do editor | **Sim** | Feito (2026-10-28); ver [STATUS.md](STATUS.md) |
| 3 | Wi-Fi recolhido em "Outras formas de conectar" | **Não**: o diálogo atual com Serial, Bluetooth e Wi-Fi está certo | Mantido como está |
| 4 | Abas herdadas (IOT, EasyMQTT, Databoard) | **Não remover**; não serão usadas agora, podem servir quando o projeto crescer | Escondidas na barra, código mantido ([ADR-013](DECISOES.md)) |
| 5 | Quem vê a Comunidade | **Qualquer visitante**, como no Tinkercad | Já é assim; confirmado |
| 6 | Login por turma e PIN | **Sim por enquanto**; depois, login unificado como o do AIPES | M12 usa turma + PIN; migração para o login unificado fica registrada ([ADR-014](DECISOES.md)) |
| 7 | Lista de palavras bloqueadas | **A definir**, com critérios públicos que sigam o ECA e o ECA Digital | Tarefa nova no M13 ([ADR-015](DECISOES.md)) |
| 8 | Nomes reais das portas e medidas do robô | **Nomear com os nomes verdadeiros**; as **medidas** o responsável atualizará em breve (sem o robô em mãos agora) | Nomes aplicados na v4; medidas **PENDENTES em destaque** em [MEDIDAS-DO-ROBO.md](MEDIDAS-DO-ROBO.md) |

## 3. Dívidas técnicas

| Dívida | Onde | Impacto | Marco |
|---|---|---|---|
| Regras com `!important` contra o CSS antigo | `sancabot_*.css` | Frágil, difícil de manter | M8 |
| `ui.js`, `code.js`, `utils.js` e `index.html` herdados | `ui/core` | Acoplamento (`UI['notify']`, `mux`…) | M8 |
| 12 catálogos de placas e 739 definições de blocos herdadas | `toolbox/`, `block_definitions.js` | Peso e superfície de teste | M9 |
| Tabela de portas e medidas do robô provisórias | `sancabot_config.js` | Simulação e menus imprecisos | M11 |
| `localStorage` como única fonte do projeto do aluno | `storage.js` | Perda ao limpar o navegador; sem sincronia | M12 |
| Lista da galeria traz o XML de cada projeto | `gallery.php` | Pesa com muitos projetos | M13 |
| Sem testes de interface nem CI | — | Regressões silenciosas | M10 e M16 |
