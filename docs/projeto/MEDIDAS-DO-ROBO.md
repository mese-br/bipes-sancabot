# ⚠️ Medidas do robô: PENDENTE (valores provisórios)

> **Estado: o robô existe, mas as medidas reais ainda não foram passadas ao software.** Enquanto isso, o simulador e alguns exemplos usam **valores provisórios**. Eles funcionam, mas **o percurso simulado não é igual ao do robô de verdade**. Este é o item de maior impacto na fidelidade do simulador.
> Registrado em 2026-10-29 a pedido do responsável (que atualizará os valores quando estiver com o robô).

## O que está provisório hoje

| Valor | Onde fica | Valor provisório | O que ele afeta |
|---|---|---|---|
| **Distância entre as rodas** (`trackCm`) | `ui*/core/sancabot_config.js` → `robot.trackCm` | **10 cm** | Quanto o robô gira e a que velocidade anda na simulação; **todos os tempos dos exemplos** (são calculados a partir dele) |
| **Tempo para girar 90° a 50%** (`turn90At50`) | `sancabot_config.js` → `robot.turn90At50` | **1,0 s** (padrão do runtime, `generator_stubs_sancabot.js`) | Velocidade e giro simulados; tempo dos exemplos |
| **Tamanho do tablado** (`tablado`) | `sancabot_config.js` → `tablado` | **120 × 80 cm** | Tamanho do cenário; confirmar com a pista real |
| **Qual servo é a roda esquerda** e qual **sensor IR** fica de cada lado | `sancabot_config.js` → `robos` (ver [ROBOS.md](ROBOS.md)) | Firmware: servo esquerdo 0 e direito 1 (Free) ou 21 (v2); IR esquerdo 5 e direito 6. **Conferido no firmware**, falta confirmar no robô | Menus de porta; sentido de giro |
| **Trig e Echo do ultrassom** | padrão do bloco "Preparar sensor de distância" | Firmware: TRIG (emissor) 7, ECHO (receptor) 8. **Conferido no firmware**, falta confirmar no robô | Leitura do sensor |
| **Desvio do mundo real** (puxar para um lado) | simulador, "Desvio" | 4 níveis: 0, 3%, 6%, 10% | Realismo do exemplo "o robô puxa para o lado" |

## O que medir (roteiro curto, com régua e cronômetro)

1. **Distância entre as rodas:** meça de centro a centro do contato das duas rodas com o chão, em cm.
2. **Velocidade em linha reta:** 50% por 2 s numa superfície lisa; meça quantos cm andou (repita 3 vezes e use a média).
3. **Giro de 90°:** com `Girar à direita a 50%`, ajuste o tempo até virar 90° (use um esquadro). Anote o tempo.
4. **Desvio:** em linha reta por 100 cm, meça o quanto o robô saiu da linha (cm) e para que lado.
5. **Portas:** confirme qual servo é a roda esquerda, quais pinos são os dois sensores IR (e de que lado) e qual pino do ultrassom é Trig e qual é Echo.
6. **Pista:** tamanho real do tablado das aulas.

## Onde colocar os valores
1. Editar `ui-v4/core/sancabot_config.js` (e `ui/core/sancabot_config.js` se a v3 ainda for usada):
   ```js
   robot: { trackCm: <medido>, turn90At50: <medido> },
   tablado: { w: <cm>, h: <cm> },
   ports: [ ...nomes reais... ]
   ```
2. Os tempos dos 8 exemplos **se recalculam sozinhos** a partir de `trackCm` e `turn90At50` (`sancabot_sim_examples.js`).
3. Atualizar este documento: trocar "provisório" por o valor medido, com data e quem mediu.
4. Atualizar [STATUS.md](STATUS.md) (item "Medidas do robô") e o [CHANGELOG](../../CHANGELOG.md).

## Como saber que está pronto
- Rodar o exemplo "Desenhar um quadrado" no robô e na simulação: o erro final deve ficar abaixo de **3 cm** (é o limite do veredito "Perfeito").
- O robô para a menos de **15 cm** da parede no exemplo 4, com a mesma folga da simulação.

## Histórico

| Data | Quem | O que |
|---|---|---|
| 2026-10-29 | Responsável | Pediu que as medidas ficassem documentadas em destaque; o robô ainda não está em mãos. Valores continuam provisórios. |
