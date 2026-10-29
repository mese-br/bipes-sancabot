# SancaBot by BIPES: documentação do projeto

Ponto de partida para quem entra no projeto (professor, designer, desenvolvedor ou revisor). Atualizado em **2026-10-28**, versão em andamento **v3**.

> ## ⚠️ ATENÇÃO: medidas do robô pendentes
> O simulador usa medidas **provisórias** (10 cm entre as rodas, giro de 90° em 1 s). Elas precisam ser trocadas pelas medidas reais do robô. **Roteiro e onde colocar: [MEDIDAS-DO-ROBO.md](MEDIDAS-DO-ROBO.md).**

## O que é
Plataforma educacional de programação em blocos para o robô **SancaBot** (ESP32-C3, MicroPython), voltada a alunos do ciclo básico. O aluno monta blocos, **simula** o percurso no computador, **conecta** o robô (USB, Bluetooth ou Wi-Fi), **roda** o programa e **compartilha** projetos com a turma e a comunidade. O editor é um derivado do BIPES (GPL-3.0) com Blockly 13, visual e português próprios.

## Como ler esta pasta

| Documento | Para quê | Quando abrir |
|---|---|---|
| [STATUS.md](STATUS.md) | O que está **concluído, quase pronto, em andamento, não iniciado ou bloqueado**, por área, com a evidência de cada item | Para saber "em que pé estamos" |
| [ROADMAP.md](ROADMAP.md) | **Marcos já alcançados** e os **próximos marcos**, com critério de pronto, dependências e esforço | Para decidir o que fazer a seguir |
| [../../CHANGELOG.md](../../CHANGELOG.md) | Histórico de mudanças por versão (formato Keep a Changelog) | Para ver o que mudou e quando |
| [MEDIDAS-DO-ROBO.md](MEDIDAS-DO-ROBO.md) | **PENDENTE**: o que medir no robô, valores provisórios e onde colocar | Assim que o robô estiver em mãos |
| [ROTEIRO-DE-BANCADA.md](ROTEIRO-DE-BANCADA.md) | Roteiro (~45 min) para testar a v4 com o robô real e medir | No dia em que o robô estiver em mãos |
| [MIGRACAO-V4.md](MIGRACAO-V4.md) | Plano da interface própria (v4): como voltar, inventário e fases | Para acompanhar ou revisar a troca |
| [PROMOCAO-V4.md](PROMOCAO-V4.md) | Checklist para a v4 substituir a v3, o que falta, como trocar e como voltar | Antes de decidir a troca |
| [ARQUITETURA.md](ARQUITETURA.md) | Peças do sistema, fluxo de dados, mapa de arquivos | Para mexer no código |
| [DECISOES.md](DECISOES.md) | Registro das decisões (ADR): contexto, escolha, consequências | Para entender "por que é assim" |
| [QUALIDADE.md](QUALIDADE.md) | Testes que existem, como rodar, o que falta testar, definição de pronto | Antes de entregar algo |
| [RISCOS.md](RISCOS.md) | Riscos, perguntas em aberto e dívidas técnicas | Para planejar e priorizar |

Documentos antigos que continuam valendo: [blockly13-e-visual.md](../blockly13-e-visual.md) (guia técnico detalhado do visual), [simulador.md](../simulador.md), [simulador-exemplos.md](../simulador-exemplos.md), [VERSOES.md](../VERSOES.md), `../../README-SANCABOT.md`, e os planos de plataforma em `../../../PLANO_PLATAFORMA*.md`.

## Legenda de status (usada em todos os documentos)

| Sinal | Significado |
|---|---|
| ✅ Concluído | Funciona e foi verificado (teste automático ou no navegador). |
| 🟢 Quase pronto | Funciona; falta um item pequeno e conhecido. |
| 🟡 Em andamento / parcial | Existe uma parte útil, mas falta funcionalidade importante. |
| ⚪ Não iniciado | Planejado, sem código. |
| 🔴 Bloqueado | Depende de algo externo (hardware, decisão, servidor). |

**Como verificamos** (coluna "Evidência"): `auto` = teste automático (scripts em `dev-local/`); `nav` = testado no navegador de desenvolvimento (inclusive telefone e tablet simulados); `robô` = testado com o robô de verdade. **Nenhum item foi testado com o robô de verdade ainda.**

## Regras de trabalho combinadas
- **Nada é commitado até o responsável testar.** Tudo roda em local (`dev-local`, porta 8090) e as versões antigas ficam congeladas (v1, v2) para comparar ou voltar.
- Código lê como o código ao redor: nomes em português, comentários curtos que explicam o "porquê".
- Textos para o aluno em português do Brasil, linguagem simples, voltada a estudantes do ciclo básico.

## Próximos passos sugeridos
1. Responder as **perguntas em aberto** de [RISCOS.md](RISCOS.md) (principalmente a decisão do M8).
2. Tratar **R1** (git) e **R2** (rastreador) antes de qualquer piloto.
3. Combinar uma sessão de bancada com o robô real (**M11**).
