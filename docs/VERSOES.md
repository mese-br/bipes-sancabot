# Versões do editor SancaBot (bipes-sancabot/ui)

O projeto não usa git, então cada versão é uma **cópia congelada** da pasta `ui`, aberta no servidor local ao lado da versão em andamento.

| Versão | Onde | Endereço local | O que é |
|---|---|---|---|
| v0 | `dev-local/backup-pre-blockly13/bipes-ui-antes-do-blockly13.tgz` | (arquivo; extrair para ver) | Antes de tudo: Blockly 6, inglês, visual BIPES original. |
| **v1** | `dev-local/versoes/v1/ui` (somente leitura) | `http://localhost:8090/bipes-v1/` | Blockly 13.4.0, visual estilo Scratch (renderizador próprio, Nunito), português, modo iniciante, painéis em camada, Creator. **Antes** da paleta semântica e dos blocos curtos. |
| **v2** | `dev-local/versoes/v2/ui` (somente leitura) | `http://localhost:8090/bipes-v2/` | v1 + paleta semântica de 9 papéis (tons escuros, texto branco/escuro misto) + blocos curtos do SancaBot. |
| **v3** | `bipes-sancabot/ui` (em andamento) | `http://localhost:8090/bipes/` | v2 + paleta VIVA (13 cores, texto azul-marinho), ícones nos blocos e nas categorias, "Controle" dividido em "Decidir" e "Repetir", todos os blocos recoloridos por família, painel Código/Referência e cabeçalho no mesmo estilo claro, correção do bug das bandejas vazias, grupos da caixa que abrem e fecham, favicon e ícones do app com o logotipo do SancaBot, portas com nome, botão Simular com simulador ao lado dos blocos e verificação do programa (`docs/simulador.md`). |
| **v3** (congelada em 2026-10-29) | `dev-local/versoes/v3/ui` (somente leitura) | `http://localhost:8090/bipes-v3/` | Estado do editor antes da interface própria. `bipes-sancabot/ui` (`/bipes/`) continua idêntica a ela. A API do Studio da época está em `v3-servidor-studio-api.tgz`. |
| **v4** (em desenvolvimento) | `bipes-sancabot/ui-v4` | `http://localhost:8090/bipes-v4/` | Interface própria, sem a camada antiga do BIPES; nomes reais de portas. Plano: `bipes-sancabot/docs/projeto/MIGRACAO-V4.md`. |

`SancaBotConfig.version` (em `ui/core/sancabot_config.js`) diz em que versão a página está; no console: `SancaBotConfig.version`.

## Voltar para a v1
```bash
dev-local/versoes/restaurar.sh v1
```
O script primeiro guarda o estado atual em `dev-local/versoes/_antes-de-restaurar-AAAAMMDD-HHMMSS.tgz` e só depois troca `bipes-sancabot/ui` pela cópia da versão pedida.
Para só comparar, não precisa restaurar: abra `/bipes-v1/` e `/bipes/` lado a lado.

## Congelar uma nova versão (ex.: ao terminar a v2)
```bash
dev-local/versoes/congelar.sh v2
```
Copia `bipes-sancabot/ui` para `dev-local/versoes/v2/ui`, marca como somente leitura e a deixa aberta em `/bipes-v2/` (precisa de uma linha no `router.php`; o script avisa).

## Projetos dos alunos
v1 e v2 usam o mesmo endereço (`localhost:8090`), então **compartilham os projetos salvos no navegador**. Os blocos mudaram só de texto e de cor (mesmos tipos e campos), então um projeto abre nas duas.

## Mapa de cores (v3)
Cada bloco do SancaBot tem o papel definido em `ui/core/sancabot_polish.js` (lista `ROLE`). Os blocos de hardware herdam o papel da categoria onde moram em `toolbox/sancabot.xml`, num arquivo GERADO: `ui/core/sancabot_block_roles.js`. Se mudar a organização da caixa de blocos, regenere (script Python que percorre as categorias de `Laboratório Avançado`; as regras por categoria estão no começo do arquivo gerado). Blocos que não estão na caixa caem no papel de cor mais próxima do tom original. As cores ficam em `ui/core/sancabot_config.js` (`palette`); mudar lá muda blocos, categorias e Creator.

## Verificado entre v1, v2 e v3
- O Python gerado para o mesmo programa de blocos é **idêntico** nas três versões (testado com preparar, caminho, mover por tempo, parar e "se obstáculo").
- Os nomes internos dos blocos e dos campos não mudaram, só os rótulos exibidos.
