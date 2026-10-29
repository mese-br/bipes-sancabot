# Promoção da v4: checklist e procedimento

Atualizado em **2026-10-29**. A v4 (`/bipes-v4/`) ainda **não** substituiu a v3 em `/bipes/`. Este documento diz o que já está provado, o que falta e como trocar (e voltar) com segurança. **A decisão de promover é do responsável.**

## 1. Checklist de aceite (os 8 critérios de [MIGRACAO-V4.md](MIGRACAO-V4.md), seção 4)

| # | Critério | Estado | Como é verificado |
|---|---|---|---|
| 1 | Python gerado idêntico ao da v3 nos 8 exemplos | ✅ | `testar.sh paridade` (só mudam os ids aleatórios dos blocos) |
| 2 | Projetos da v3 abrem na v4 | ✅ | `paridade` (projetos, XML) e abertura de projeto salvo pela v3 (manual, F2). A v3 e a v4 compartilham o `localStorage` |
| 3 | Conectar, rodar, parar, Console, arquivos (listar, abrir, executar, gravar, excluir), erros, desconectar | ✅ **com robô simulado** | `testar.sh robo` (25 passos, v3 e v4 iguais) |
| 4 | Simulador, galeria e tradução do Console sem regressão | 🟡 | Galeria: `testar.sh galeria` (compartilhar, link, remix) ✅. Simulador: só o carregamento de exemplos e as missões (`paridade`); **▶ Jogar e as estrelas não têm teste automático**. Tradução do Console: só o erro de divisão por zero no roteiro do robô; o resto foi conferido à mão (F3) |
| 5 | Telas em 390, 1024, 1440 e 2560 px; sem piscada; recarregar mantém aba, blocos e posição | ✅ | `testar.sh visual` (4 tamanhos, 0 diferenças novas), `carregamento` (nenhuma tela errada aparece, 50 verificações), `sessao` (blocos, zoom e posição) |
| 6 | Nenhum texto em inglês visível ao aluno; nenhum rastreador | 🟡 | Rastreador: `carregamento` (só o próprio servidor, sem `gtag`) ✅. **Inglês: não há varredura automática**; a Referência foi auditada à mão |
| 7 | Suítes de API e de interface passam | ✅ | `testar.sh` (111 verificações) |
| 8 | **Teste com o robô real** | 🔴 | Depende do hardware e do responsável (M11). Roteiro-base: os 25 passos de `dev-local/lab/teste-robo-simulado.js` |

**Lido assim:** os critérios 1, 2, 3, 5 e 7 estão provados por teste automático. 4 e 6 têm buracos conhecidos. **O 8 é o que de fato falta antes de levar a v4 aos alunos.**

## 2. O que ainda é diferente da v3 (decidido, não é defeito)
- Portas com nomes do firmware (Servo 0 e 1, IR 5 e 6, Ultrassom 7 e 8) em vez de letras; **a confirmar com a placa** qual servo/IR é esquerdo ou direito.
- Sem menu de idioma, sem tela de boas-vindas do BIPES, sem Google Analytics, sem blocos de OpenCV, sem componente PWA de CDN (**o modo offline fica desligado** até o M16).
- Abas IOT, EasyMQTT e Databoard escondidas, e o iframe da IOT não carrega.
- "Gerar link do projeto" agora é da Galeria; o Remix abre como projeto novo.
- Fonte Nunito onde antes caía em Arial; Arquivos com cabeçalho e barra alinhados; Console que cabe na tela.
- A lista completa e aceita das diferenças visuais está em `dev-local/testes/baseline-visual.json`.

## 3. Antes de promover (nesta ordem)
1. **Teste com o robô real** (M11, siga o [ROTEIRO-DE-BANCADA.md](ROTEIRO-DE-BANCADA.md)) pelo menos: conectar por USB, rodar um exemplo, parar, listar e gravar um arquivo. Medir e preencher [MEDIDAS-DO-ROBO.md](MEDIDAS-DO-ROBO.md).
2. Decidir o que fazer com o buraco do critério 4 (testar ▶ Jogar e as estrelas) e 6 (varredura de inglês), ou aceitá-los assim.
3. Confirmar com a escola se o modo offline faz falta já (se sim, refazer o PWA antes: M16).
4. Rodar `dev-local/testar.sh` e ver **tudo verde**.

## 4. Como promover
```bash
dev-local/versoes/promover.sh
```
O script: roda os testes → pede que você digite `sim` → guarda a versão atual em `dev-local/versoes/backup-antes-da-v4-AAAAMMDD-HHMMSS.tgz` → troca `bipes-sancabot/ui` pela v4 → congela a v4 em `dev-local/versoes/v4` (somente leitura). Depois da troca, `/bipes/` é a v4.

## 5. Como voltar atrás
```bash
dev-local/versoes/restaurar.sh v3
```
Troca `bipes-sancabot/ui` pela v3 congelada (guarda antes o estado atual). Além disso: `/bipes-v3/` continua aberta (somente leitura), a API do Studio da v3 está em `dev-local/versoes/v3-servidor-studio-api.tgz`, e os projetos dos alunos continuam no navegador (mesmo `localStorage`, mesmo formato).

## 6. Depois de promover
- Remover `bipes-sancabot/ui-v4` e a rota `/bipes-v4/` quando não forem mais necessárias (ou manter como área de trabalho da próxima versão).
- Atualizar [STATUS.md](STATUS.md), [ROADMAP.md](ROADMAP.md) (M8 concluído) e o [CHANGELOG](../../CHANGELOG.md).
- **Produção:** o servidor real (`sancabot.com.br`) não é o `dev-local`; a publicação e o cache dos arquivos (`?ver=…`) são tarefa do M16.
