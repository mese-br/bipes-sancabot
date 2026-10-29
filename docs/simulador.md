# Simulador de trajetória

**Como se usa (igual ao micro:bit):** clique em **Simular** no cabeçalho. O simulador abre num painel próprio, ao lado dos blocos (o painel de código fica ao lado dele), e o programa já roda ali. Enquanto está aberto, ele **reinicia sozinho** a cada mudança nos blocos. `↻ Reiniciar` roda de novo, `■ Parar` interrompe, `×` (ou Esc) fecha. Nada leva o aluno para outra tela.

Arquivos: `ui/core/sancabot_sim.js`, `sancabot_sim.css`. Parâmetros em `sancabot_config.js` (`robot`, `tablado`). Só na página do editor (`index.html`).

## O que faz
1. **Verifica o programa em blocos** (sem física) e lista o que dará errado no robô: falta "Preparar motores" ou ele vem depois do movimento; usa o sensor sem "Preparar sensor de distância"; duas coisas na mesma porta (rodas ou sensor); velocidade ou tempo 0; "Repetir 0 vezes"; blocos vazios ou sem pergunta; movimento contínuo seguido direto de outro; repetição que nunca termina; programa que termina sem "Parar"; grupos de blocos soltos. Clicar numa linha leva ao bloco.
2. **Roda o programa** com um relógio simulado, seguindo as regras dos geradores Python: velocidade em %, correção de desvio, giro calibrado, cronômetro (segundos inteiros), sensor de distância (vale de 2 a 400 cm; leitura guardada e renovada a cada intervalo), condições (distância, cronômetro, e/ou, comparações), Se/Senão, repetir N vezes / enquanto / até, explorar, observar, "sair da repetição". Também falha como o robô falharia (mover sem preparar os motores para a simulação).
3. **Simula o robô** (duas rodas) sobre o tablado de 120 x 80 cm em escala. Ele não atravessa paredes: bate e fica parado.
4. **Compara** com a trajetória-alvo: pronta (reta, quadrado, oito, curva em S), **desenhada**, ou **SVG** (como trajetória ou como parede; largura real em cm ou ajustada). Os obstáculos (menu abaixo), as paredes desenhadas e as importadas são enxergados pelo sensor e o robô bate neles.
5. **Menu de obstáculos** (em "Cenário"): `+ Parede`, `+ Caixa`, `+ Cone`, `+ Corredor`, `+ Portão`, `+ Canto`. O obstáculo aparece no meio do tablado já selecionado (contorno laranja): arraste para o lugar, gire (`↻ 15°`, `↻ 90°`), `× Remover` ou `Limpar tudo`. `Desenhar parede` também vale. Mudou o cenário, o simulador refaz sozinho.
6. **Exemplos prontos** (menu "Exemplos", no topo do painel): carrega os blocos, a rota, os obstáculos e o desvio de um exemplo e roda. Trocar os blocos atuais pede confirmação e dá para desfazer com Ctrl+Z. Lista e como criar o seu: `docs/simulador-exemplos.md`.
7. Mostra desvio máximo/médio, tempo, a leitura do sensor ao vivo (com um traço vermelho no tablado) e o resultado (Perfeito, Quase, Longe, Não chegou, Saiu do tablado, Bateu, Programa com erro).

## De onde vêm os números (nada inventado, exceto uma medida)
- Velocidade em % e correção de desvio: as mesmas regras do `sancabot_drive` / `sancabot_apply_straight_correction` do robô.
- Giro: o robô gira 90° em `SANCABOT_TURN_90_SECONDS_AT_50 = 1,0 s` a 50% (padrão do runtime; o bloco "Calibrar giro" muda isso também na simulação). Daí sai a velocidade das rodas: ω = (π/2)/T e v = ω·distância_entre_rodas/2.
- **Provisório:** `robot.trackCm` = 10 cm (distância entre as rodas). **Meça no robô e ajuste.** Isso escala todas as distâncias.
- "Desvio do mundo real": a roda esquerda fica 3/6/10% mais fraca (o robô puxa para a esquerda). "Corrigir desvio" do aluno compensa, como no robô.

## Ainda NÃO simula
Valores de blocos do BIPES fora dos do SancaBot (variáveis, texto), ruído do sensor e qualquer bloco de hardware avançado. O que não conhece, a tela avisa. Se o programa termina com o robô andando (falta "Parar"), simula mais 3 s e avisa. Simulação para em 120 s.

## Testes feitos
- Quadrado programado (repetir 4: andar 2 s, girar direita 1 s): robô perfeito volta ao ponto de partida (0,00 cm); com desvio médio fica a 6,4 cm; com "Corrigir desvio +6%" fica a 1,6 cm.
- Parede em 90 cm, "andar contínuo; repetir até obstáculo < 15 cm; parar": o robô para a 14 cm da parede. Sem esse laço, bate aos 8 s. Sem "Preparar sensor", o laço nunca termina (corta em 120 s) e o robô bate. Cronômetro "enquanto < 3 s": 3,00 s. "Sair da repetição" funciona dentro de "Medir distância sem parar".
- Verificação: acusa falta de preparar, ordem errada, sensor sem preparar, portas repetidas e conflito motor/sensor; programa correto dá "tudo certo".
- SVG com `<script>`/`onclick`: só a geometria é lida; nada executa.
- Mudar um bloco com o simulador aberto reinicia a simulação sozinho.

## Próximos passos sugeridos
Medir o robô (distância entre rodas, velocidade real a 100%) e comparar uma volta real com a simulada para calibrar; obstáculos/paredes a partir de SVG e o sensor de distância; destacar o bloco que está rodando; imprimir a pista em 1:1.

## Bloco em execução (destaque)
Durante a simulação, o bloco que o robô está executando no instante atual ganha contorno azul-marinho e brilho amarelo (classe `sb-running`, em `sancabot_sim.css`). `runProgram` devolve `events` (`{t, id}`: quando cada bloco começou) e `tick` destaca o último que começou até o tempo atual; ao terminar, parar ou reiniciar, o destaque some. (O `highlightBlock` do Blockly 13 não pinta mais nada, por isso a classe própria.)

## Missões: estrelas e dicas
Cada exemplo de `sancabot_sim_examples.js` agora é uma **missão**: o cartão amarelo no topo do simulador mostra o objetivo (`descricao`), as estrelas e um botão "Pedir uma dica" que revela, uma por vez, as dicas do campo `dicas` (3 por missão; sem `dicas`, usa `dica`).
- **Estrelas** vêm do veredito da simulação: Perfeito = 3, Quase = 2, Longe / Não chegou / Terminou = 1, o resto = 0. O melhor resultado de cada missão fica em `localStorage['sancabot_estrelas']` (`{id: estrelas}`) e aparece como ★ na lista de exemplos.
- **Evento para o Studio/LMS:** ao fim de cada rodada o editor dispara `window` `CustomEvent('sancabot:missao', { detail: { id, estrelas, veredito, desvioMax, tempo } })`. A plataforma de turmas pode ouvir esse evento para registrar progresso, sem mexer no editor.
- Para criar uma missão: copie um item de `EXEMPLOS`, mude `rota`, `obstaculos`, `xml` e `dicas`.
