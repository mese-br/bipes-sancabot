# Exemplos prontos do simulador

Arquivo: `ui/core/sancabot_sim_examples.js` (carregado antes do simulador). No editor: **Simular** > menu **Exemplos**.
Cada exemplo traz o **programa em blocos**, a **rota-alvo**, os **obstáculos** e o **desvio do mundo real**. Os tempos são calculados a partir de `robot.trackCm` e do giro calibrado em `sancabot_config.js` (a 50%, o robô anda v50 = (π/2 / T90) · distância_entre_rodas / 2 cm/s e gira 90° em T90 s). Se você medir o robô e trocar esses valores, os exemplos continuam certos.

Resultados medidos no simulador (distância entre rodas 10 cm, giro de 90° em 1,0 s):

| # | Exemplo | Nível | Blocos | Cenário | Resultado |
|---|---|---|---|---|---|
| 1 | Andar em linha reta | Explorador | Preparar; Mover frente 50% por 11,5 s | reta de 90 cm | Perfeito (desvio 0,5 cm) |
| 2 | Desenhar um quadrado | Explorador | Preparar; Repetir 4 { Mover frente 5,1 s; Girar direita 90° } | quadrado de 40 cm | Perfeito |
| 3 | Zigue-zague | Explorador | Preparar; Repetir 2 { frente 3,6 s; girar dir.; frente 3,6 s; girar esq. } | zigue-zague de 45° | Perfeito |
| 4 | Parar antes da parede | Explorador | Preparar; Preparar sensor; Mover contínuo; Repetir até obstáculo < 15 cm { Esperar 0,1 }; Parar | parede a 90 cm | Perfeito (para a ~14 cm) |
| 5 | Desviar da caixa | Criador | Sensor; andar até < 15 cm; Parar; girar dir.; frente; girar esq.; frente | caixa 20x20 em (60, 40) | Perfeito (desvio 1,8 cm) |
| 6 | O robô puxa para o lado | Criador | Preparar; Mover frente 11,5 s | reta, desvio médio | Longe (23 cm) |
| 7 | Corrigindo o desvio | Criador | igual ao 6 + Corrigir desvio esquerda +3 | reta, desvio médio | Perfeito (1,5 cm) |
| 8 | Passar pelo corredor | Criador | Preparar; Mover frente 11,5 s | corredor de 30 cm | Perfeito; com desvio grande: Bateu |

## "E se...?" (as dicas de cada exemplo, testadas)
- Ex. 4 sem o bloco **Parar**: o robô bate na parede aos 8 s (a tela avisa "falta Parar").
- Ex. 4 com o limite em **30**: para mais longe da parede e não chega ao alvo.
- Ex. 7 com correção **6**: corrige demais (Longe, 21,7 cm); com **0**: volta o desvio (Longe, 23,2 cm). O valor certo é calibrar: +3.
- Ex. 8 com desvio **grande**: o robô bate na parede do corredor.

## Como criar o seu exemplo
Copie um item de `EXEMPLOS` no arquivo e mude. Formato:

```js
{ id: 'meu', titulo: '9. Meu desafio', nivel: 'Criador',
  descricao: 'O que o aluno deve fazer.', dica: 'Uma pista do que testar.',
  rota: 'reta' | 'quadrado' | 'oito' | 's' | 'nenhuma' | { pontos: [[x, y], ...] },       // cm, tablado de 120 x 80
  obstaculos: [{ tipo: 'parede', x: 90, y: 40, rot: 90 }],                                // parede|caixa|cone|corredor|portao|canto
  desvio: 0,                                                                              // 0 nenhum, 1 pequeno, 2 médio, 3 grande
  xml: X(preparar(frente(60, parar()))) }                                                 // programa; peças no topo do arquivo
```
Peças prontas: `preparar`, `sensor`, `mover(acao, vel, segundos|null, next)`, `frente(cm)`, `girarDireita`, `girarEsquerda`, `parar`, `esperar`, `repetir(n, corpo)`, `ateObstaculo(cm, corpo)`, `corrigir(lado, pct)`.
Dica: monte o programa no editor, abra o XML com o Blockly (`Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Code.workspace))` no console) e cole em `xml`.
