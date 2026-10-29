# Qualidade e testes

Atualizado em 2026-10-28.

## 1. Testes automáticos que existem
Todos em `dev-local/` (precisam do ambiente local em pé: `dev-local/dev.sh up`). Não imprimem senhas.

| Script | O que cobre | Resultado atual |
|---|---|---|
| `test-identidade.sh` | Contrato de login contra a loja simulada | passa |
| `test-blocks-api.sh` | Creator: acesso (visitante, aluno, admin) e API de blocos | 44 ok |
| `test-blocks-parity.sh` | Validação de blocos: JavaScript × PHP com os mesmos 28 casos e valores hostis | passa |
| `test-gallery-api.sh` | Galeria: papéis, validação do XML (DOCTYPE, tipos, tamanho), fluxo de aprovação e recusa, curtidas, remix, exclusão, outra origem | 38 ok |
| `test-auth-lib.php` | Biblioteca de sessão | passa |

```bash
dev-local/dev.sh up
dev-local/test-gallery-api.sh
```

## 1b. Testes automáticos de interface (um comando)
```bash
dev-local/testar.sh                 # tudo (≈ 2,5 min, 111 verificações)
dev-local/testar.sh console robo    # só algumas suítes
```
Suítes: carregamento, console, acabamento, robo, paridade, visual, sessao, galeria, api. Usa o Chrome instalado. `--atualizar-baseline` aceita as diferenças visuais de agora (revise antes). Ver [MIGRACAO-V4.md](MIGRACAO-V4.md), seção 11.

## 2. O que é testado só à mão (no navegador de desenvolvimento)
Cabeçalho e responsividade (390, 820, 1024, 1400, 2560 px), menu Projeto, conectar e Rodar (com conexão **simulada**), simulador, tradução do Console, galeria pela interface, retomada da sessão, carregamento sem piscada.
**Limites do navegador de testes:** a animação (`requestAnimationFrame`) não dispara com o painel escondido e o primeiro desenho da página não é observável. Esses pontos precisam de conferência por uma pessoa num navegador normal.

## 2b. Comparação visual entre versões
`dev-local/lab/paridade-visual.js` compara duas versões do editor (tamanho, posição e estilos de ~60 elementos em todas as telas). Foi usado na F1 (v3 × v4). É a base do M10.

## 2c. Comparação de comportamento entre versões
`dev-local/lab/paridade-comportamento.js` roda as mesmas operações nas duas versões (Python dos exemplos, projetos, XML, telas, painéis, estados de conexão, avisos, progresso) e lista as diferenças. Usado na F2 (v3 × v4). Cuidado: carrega exemplos e cria/apaga projetos; só em navegador de desenvolvimento.

## 2e. Paridade dos recursos do SancaBot
`dev-local/lab/paridade-recursos.js` compara missões 1 a 4, rastro dos blocos, cartão de distância, categorias e modo lento entre duas versões. Usado na F4 (v3 × v4: 0 diferenças).

## 2d. Fluxo com o robô simulado
`?robo=simulado` + `dev-local/lab/teste-robo-simulado.js` (25 passos). Usa o código real de conexão e de arquivos; a porta serial é de mentira. Roda em segundos, sem hardware. **Limites:** só Web Serial (não Bluetooth nem Wi-Fi) e não é MicroPython de verdade. Base do roteiro do M11 (robô real).

## 3. Lacunas (o que ainda não é verificado)
1. **Robô real**: nenhum fluxo de conexão foi testado com hardware (marco M11).
2. **Interface sem teste automático** (marco M10): uma mudança no CSS pode quebrar telas sem ninguém perceber.
3. **Tablet e telefone reais**; Web Bluetooth em iPad.
4. **Acessibilidade**: sem auditoria (contraste, teclado, leitor de tela).
5. **Desempenho com muitos projetos** na galeria (a lista traz o XML de cada um).

## 4. Definição de pronto
Um item só vira ✅ em [STATUS.md](STATUS.md) quando:
1. Faz o que o responsável pediu, em português simples, para crianças.
2. Foi testado no navegador em pelo menos desktop e telefone (ou tem teste automático).
3. Se mexe no servidor: tem teste em `dev-local/` e as suítes anteriores continuam passando.
4. Não adiciona texto em inglês visível ao aluno.
5. Documentação atualizada ([CHANGELOG](../../CHANGELOG.md), STATUS, e DECISOES se houve escolha).
6. **Nada commitado** antes do aceite do responsável.

Para itens que dependem do robô, ✅ exige o teste com robô real; até lá o máximo é 🟢 ou 🟡.

## 5. Roteiro de conferência manual (antes de mostrar a alguém)
1. Abrir `/bipes/` do zero (janela anônima): sem piscada, cabeçalho completo.
2. Montar um exemplo, Simular → Jogar → ver o bloco em destaque e as estrelas.
3. Recarregar no Console e em Arquivos: volta na mesma aba, blocos intactos.
4. Menu Projeto → Compartilhar na galeria → turma → ver na galeria → remixar.
5. Entrar como professor, aprovar um pendente, conferir na Comunidade como visitante.
6. Telefone (390 px) e tablet (820 px): cabeçalho, conectar, galeria.
7. Console: digitar `print("KeyError: x")` e ver o eco intacto.
