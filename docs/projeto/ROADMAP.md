# Roadmap

Atualizado em **2026-10-28**. Estados em [README.md](README.md). Esforço em **interações de trabalho** (uma interação = um pedido ao Claude com entrega para revisão); é palpite baseado no ritmo desta sessão, não medição. O que mais atrasa é o **retorno visual do responsável** e o **teste com o robô real**, não escrever o código.

## 1. Marcos já alcançados

> Datas de M1 a M6 são **aproximadas** (o projeto não está em git; foram reconstruídas dos documentos e das versões congeladas). As de M7 e M7b são exatas.

| # | Marco | Data | Entrega verificável |
|---|---|---|---|
| M1 | **Editor modernizado** | até 2026-07 | Blockly 13.4.0 com renderizador próprio, português e modo iniciante. Versão v1 congelada. |
| M2 | **Identidade visual v2/v3** | 2026-07 a 2026-10 | Paleta semântica, depois paleta viva com ícones. Python gerado idêntico entre v1, v2 e v3. |
| M3 | **Simulador de trajetória** | 2026-10 | Percurso, obstáculos, desvio, verificação do programa e 8 exemplos. [simulador.md](../simulador.md) |
| M4 | **Interface completa em português** | 2026-10 | Blocos, Referência, Código, avisos e mensagens de erro do robô. |
| M5 | **Cabeçalho e painéis no padrão SatBlocks** | 2026-10 | Menu Projeto, abas responsivas, conectar em 3 cartões, perfil, avisos, Rodar com 3 estados. Testado de 390 a 2560 px. |
| M6 | **Missões** | 2026-10 | Estrelas, dicas, destaque do bloco, ▶ Jogar. |
| M7 | **Galeria de projetos (com servidor)** | 2026-10-28 | Turma e comunidade, aprovação do professor, curtidas, remix. API com 38 testes. |
| M7b | **Experiência de produto** | 2026-10-28 | Retoma aba, blocos e posição ao recarregar; carregamento sem piscada. |

## 2. Próximos marcos (ordem recomendada)

### M8. Interface própria (v4), sem a camada antiga do BIPES — 🟡 EM ANDAMENTO (decidido: troca completa, com a v3 preservada)
**Decisão de 2026-10-29:** fazer de uma vez, mantendo a v3 congelada e inalterada (`/bipes-v3/`) e construindo a v4 em separado (`/bipes-v4/`) para poder voltar. Plano, inventário e fases em [MIGRACAO-V4.md](MIGRACAO-V4.md). **Progresso: F0 ✅, F1 ✅ (CSS antigo fora, paridade visual) F2 ✅ (`code.js` e `ui.js` novos, paridade de comportamento) e F3 ✅ (robô simulado e roteiro de 25 passos; motor mantido) F4 ✅ (missões, rastro, medidor, tour e modo lento em módulos) e F5 ✅ (código antigo, Google Analytics e CDNs fora; link do projeto pela Galeria), todas em 2026-10-29; F6 ✅ (testes automáticos com um comando e checklist). **A v4 está pronta para decisão**: falta o teste com o robô real (M11) e a escolha de promover ([PROMOCAO-V4.md](PROMOCAO-V4.md)).**
**Por quê:** hoje a interface roda por cima do HTML/CSS/JS antigo do BIPES (ver [ARQUITETURA.md](ARQUITETURA.md)). Isso causou a maior parte dos bugs visuais e encarece cada ajuste.
**Como:** substituição **por partes**, sempre com o produto funcionando: (1) painéis (conectar, perfil, avisos) e abas; (2) `style.css` e `libs.css` antigos; (3) `ui.js`, `code.js` e o esqueleto do `index.html`.
**Pronto quando:** nenhum arquivo antigo de interface é carregado; as regras com `!important` contra o CSS antigo desapareceram; os testes do M10 passam.
**Esforço:** 10 a 15 interações (troca completa de uma vez: 20 a 30, risco maior).
**Depende de:** decisão do responsável; idealmente M11 antes de mexer na conexão.

### M9. Enxugar o que é herdado — ⚪
As abas **IOT, EasyMQTT e Databoard** já estão escondidas e **continuam no código** (ADR-013). Aqui: reduzir os 12 catálogos de placas para o do SancaBot e revisar os blocos herdados do Laboratório Avançado (a caixa usa 193 tipos de bloco no total).
**Pronto quando:** só o que a turma usa é carregado; o peso da página cai.
**Esforço:** 3 a 5 interações. **Depende de:** nada; pode ser feito a qualquer hora.

### M10. Testes automáticos da interface — ✅ (2026-10-29, via F6)
Roteiros de navegador (Playwright ou similar) para: abrir e recarregar retomando a sessão, menu Projeto, conectar (simulado), Simular → Jogar, compartilhar → aprovar → remixar, tradução do Console.
**Pronto quando:** rodam com um comando e entram no fluxo de entrega ([QUALIDADE.md](QUALIDADE.md)).
**Esforço:** 4 a 6 interações. **Valor:** é o que torna o M8 seguro.

### M11. Validação com o robô real — 🔴 depende de hardware e do responsável
> **⚠️ PENDENTE EM DESTAQUE:** as medidas do robô (distância entre rodas, giro de 90°, tablado, lados dos servos e IR) estão provisórias. O responsável as atualizará quando estiver com o robô. Roteiro: [MEDIDAS-DO-ROBO.md](MEDIDAS-DO-ROBO.md).

Conectar por USB e Bluetooth, enviar, rodar, parar, ler o Console, enviar arquivos; **medir** `trackCm`, o tempo de giro e os **nomes reais das portas**; comparar simulação com robô.
**Pronto quando:** roteiro de teste executado em um robô de verdade (o de 25 passos de `dev-local/lab/teste-robo-simulado.js` serve de base: ele já diz o que cada passo deve mostrar), falhas registradas e corrigidas; tabela de portas e medidas no `sancabot_config.js` deixam de ser provisórias.
**Esforço:** 3 a 6 interações **mais** o tempo de bancada. **É o maior risco do projeto** (ver [RISCOS.md](RISCOS.md)).

### M12. Turmas e progresso — ⚪
Turma e papel vindos do login; estrelas das missões gravadas no servidor (o Studio passa a ouvir `sancabot:missao`); painel do professor com a turma e o progresso; galeria por turma de verdade.
**Pronto quando:** o professor vê, por aluno, as missões e as estrelas; a galeria "Da turma" mostra só a turma do aluno.
**Esforço:** 8 a 12 interações. **Decidido:** login de alunos por turma + PIN, com migração futura para o login unificado do AIPES (ADR-014). **Depende de:** M11 parcial (medidas) e revisão de LGPD ([RISCOS.md](RISCOS.md)).

### M13. Moderação e escala da galeria — ⚪
Denúncia, lista de palavras bloqueadas baseada em critérios públicos do ECA e do ECA Digital (ADR-015), miniatura gerada no servidor, curtidas agrupadas por conta, simular dentro do cartão.
**Esforço:** 4 a 6 interações. **Depende de:** M12.

### M14. Experiência de primeira vez — ⚪
Tour guiado, glossário "o que é isto?", dicas por bloco, revisão de acessibilidade (WCAG AA).
**Esforço:** 5 a 8 interações.

### M15. Estúdio dentro da plataforma — ⚪
Editor aberto pelo Studio (`iframe` + `postMessage`), missão e estado indo e voltando, BNCC por missão, XP e medalhas.
**Esforço:** 10 a 15 interações. **Depende de:** M12.

### M16. Publicação — ⚪
Repositório git e CI, empacotamento, PWA offline verificado em produção, política de privacidade e remoção do Google Analytics ([RISCOS.md](RISCOS.md), R2).
**Esforço:** 3 a 5 interações. **Pode (e deve) começar antes**: a parte de privacidade é urgente.

## 3. Linha do tempo

| Janela | Foco | Marcos |
|---|---|---|
| **Agora** | Decidir e proteger | Decidir M8; **R1** e **R2** de [RISCOS.md](RISCOS.md) (git e analytics); preparar M11 (roteiro e robô) |
| **Próximo** | Base de qualidade | M10 → M8 (por partes) → M9 |
| **Depois** | Valor para a turma | M11 → M12 → M13 |
| **Mais adiante** | Plataforma | M14 → M15 → M16 |

## 4. Como este roadmap se mantém
1. Ao concluir um marco, **mover para "Marcos já alcançados"** com data e a entrega verificável.
2. Ao concluir um item, atualizar [STATUS.md](STATUS.md) e o [CHANGELOG](../../CHANGELOG.md).
3. Decisões novas entram em [DECISOES.md](DECISOES.md); riscos novos em [RISCOS.md](RISCOS.md).
