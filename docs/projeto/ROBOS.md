# Os dois robôs: SancaBot Free v1.0 e SancaBot v2

O editor v4 deixa escolher entre as duas versões do robô, no menu do cabeçalho (ao lado de "Conectar e rodar"). A escolha muda os nomes das portas nos blocos, os pinos que os blocos novos já trazem, a tabela da aba "Meu robô" e os avisos do simulador. O projeto guarda o robô para o qual foi feito (campo `DEVICE` do arquivo), e o editor lembra a última escolha neste navegador.

Os pinos vêm do firmware, no repositório privado `mese-br/sancabot-firmware`. Conferência feita em 29/10/2026 nos arquivos `sancabot_free.ino` (tag `free-v1.0`) e `sancabot_ble.ino` (tag `v2-r12`).

## Tabela de pinos

| Função | Free v1.0 (atual, padrão) | v2 (r12) |
|---|---|---|
| Servo esquerdo | 0 | 0 |
| Servo direito | 1 | 21 |
| Sensor IR esquerdo (linha) | 5 | 5 |
| Sensor IR direito (linha) | 6 | 6 |
| Ultrassom TRIG | 7 | 7 |
| Ultrassom ECHO | 8 | 8 |
| Sensor de contato (KW11-3Z-5) | não tem | 4 |
| Hall esquerdo (odometria) | não tem | 2 |
| Hall direito (odometria) | não tem | 3 |

O único pino que muda de lugar entre as versões é o do servo direito (1 no Free, 21 na v2). O 21 também é o TX da placa. O resto da v2 acrescenta sensores que o Free não tem.

O que o firmware diz sobre cada coisa:

- **Servos de rotação contínua.** A roda direita é montada espelhada: o firmware inverte o sinal dela. Os blocos já fazem isso (`SANCABOT_RIGHT_INVERT = -1`).
- **Sensores IR.** Leitura digital. No Free, `HIGH` quer dizer "está na linha" (há uma opção para inverter). Na v2, `HIGH` é linha escura.
- **Ultrassom HC-SR04.** TRIG em 7 (emissor) e ECHO em 8 (receptor), nas duas versões.
- **Contato e Hall (só v2).** Contato com `INPUT_PULLUP` (fecha ao bater). Hall conta pulsos da roda (roda de 40 mm, 125,66 mm por volta).

## Onde isso está no código

Tudo sai de **uma tabela só**: `ui-v4/core/sancabot_config.js`, em `robos`. Se o firmware mudar, mude lá. O resto lê dali:

| O que | Como usa a tabela |
|---|---|
| Menus de porta dos blocos | `SancaBotConfig.ports` acompanha o robô escolhido (`Servo direito (21)`, `Contato (4)`, ou `pino 10` quando o pino não tem função) |
| Pino padrão dos blocos novos | "Preparar motores" nasce 0/1 no Free e 0/21 na v2; "Preparar sensor de distância" nasce 7/8 nos dois |
| Aba "Meu robô" | título, resumo e tabela de pinos (`SancaBotConfig.descricao`) |
| Bloco genérico de pinos (`pinout`) | lista `SancaBotConfig.pinagem` |
| Avisos | `SancaBotConfig.conferirPinos`: o simulador e um aviso na tela dizem quando um bloco usa um pino que não é o do robô escolhido |

O valor guardado em cada bloco continua sendo o número do pino. Por isso nenhum projeto antigo deixa de abrir, e o código Python gerado não mudou.

**Trocar de robô não mexe nos blocos que já estão na tela.** Só reescreve o nome das portas e avisa se algum pino não bate ("A roda direita está em pino 1, mas no SancaBot v2 fica em Servo direito (21)"). Escolhi avisar em vez de corrigir sozinho porque trocar o pino de um bloco muda o programa sem o aluno perceber.

Projetos antigos têm `DEVICE = SancaBot` e abrem como Free v1.0. O nome do Free continua `SancaBot` por isso.

## O que o simulador faz com a v2

Nada de diferente: ele não simula Hall, contato nem sensores de linha (os blocos para eles ainda não existem). A v2 muda só os nomes e os pinos.

## Diferença entre firmware e MicroPython: conferir na bancada

O firmware Arduino do Free manda o servo parado em **1450 µs** (variável `trimEsq`/`trimDir`) e varre ±600 µs. O programa MicroPython que os blocos geram usa `duty` de centro **77** (cerca de 1505 µs a 50 Hz) e varre ±25 (cerca de ±490 µs).

Se, com o bloco "Parar" ou "Mover a 0%", as rodas continuarem girando devagar, o centro está desajustado. O valor equivalente a 1450 µs seria `duty` 74. Está no roteiro de bancada (passo B9). Não mudei nada: só dá para decidir com o robô na mão.

## O que ainda falta

- Confirmar na bancada que a roda esquerda é mesmo o servo do pino 0 e os lados dos IR (B5 e B6 do roteiro).
- Confirmar que o MicroPython gravado nos robôs de aula usa os mesmos pinos do firmware Arduino (o README do firmware diz que o BIPES grava MicroPython por cima, sem listar os pinos).
- Blocos para os sensores IR, o contato e o Hall. Hoje as portas têm nome, mas só motores e ultrassom têm bloco.
