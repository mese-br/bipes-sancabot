# Roteiro de bancada: testar a v4 com o robô de verdade

Para o dia em que o robô estiver em mãos (marco **M11**). Leva cerca de **45 minutos** no total: **A) conexão e execução** (~20 min, o essencial), **B) medidas** (~15 min, o que falta para o simulador ser fiel) e **C) extras** (~10 min, opcional). Se o tempo for curto, faça só **A** e as medidas **B1 a B3**.

Não precisa saber programar. Em cada passo: **faça** o que está escrito, **compare** com o "esperado" e marque ✅ (como esperado), ❌ (diferente) ou ➖ (não deu para testar). Quando for ❌, **anote o que aconteceu com suas palavras** e, se der, tire uma foto da tela do Console. A folha de registro está no fim deste arquivo (pode imprimir ou anotar no papel).

> Este roteiro é a versão com o robô real dos 25 passos que já passam com o robô simulado (`dev-local/lab/teste-robo-simulado.js`). Tudo que o simulador prova só vale de verdade depois deste teste.

---

## 0. Preparação (5 minutos)

**Material:** o robô carregado e com o MicroPython gravado · cabo USB **de dados** (alguns cabos só carregam e não funcionam) · computador com **Chrome ou Edge** · uma superfície lisa e livre de pelo menos **120 × 80 cm** · trena ou régua grande · esquadro ou um canto de parede (para conferir 90°) · cronômetro (o do celular serve) · fita crepe para marcar a largada · um livro ou caixa para fazer de "parede".

**No computador:**
1. Ligue o servidor de desenvolvimento: `dev-local/dev.sh up`.
2. Abra no Chrome: **http://localhost:8090/bipes-v4/** (sem `?robo=simulado`: aquele é o robô de mentira). O endereço `localhost` conta como seguro, então a conexão USB funciona.
3. Feche outros programas que usem a porta USB do robô (monitor serial, Arduino IDE, Thonny).
4. Anote o **modelo do computador**, o **sistema** e a **versão do Chrome** (menu ⋮ → Ajuda → Sobre o Google Chrome) na folha de registro.

**O robô:** coloque-o na superfície, com a frente apontada para onde ele vai andar, e marque a largada com fita. Ligue o cabo USB ao computador.

---

## A) Conexão e execução (~20 minutos)

| # | Faça | Esperado | |
|---|---|---|---|
| **A1** | Abra a v4 e olhe a tela. | Abre sem tela azul demorada, sem mensagens de erro. O cabeçalho mostra "Conectar" apagado. | |
| **A2** | Clique em **Conectar** → **Cabo USB (Conectar →)**. O Chrome abre uma lista de portas: escolha a do robô (costuma aparecer como "USB JTAG/serial" ou "CP210x"). | O diálogo fecha. O botão fica verde: **"Conectado"**. Na aba **Console** aparece "Conectado pelo cabo USB (Web Serial)!" e, em seguida, o prompt `>>>`. | |
| **A3** | Na aba **Console**, clique no terminal e digite `print("oi")` e Enter. | O robô responde `oi` e volta o `>>>`. O que você digitou aparece como digitou (em inglês, sem tradução). | |
| **A4** | Volte aos **Blocos**, escolha o menu **Simular → Exemplos → "1. Andar em linha reta"** (ou monte: *Preparar motores* + *Mover para frente por 9 s*). Aperte o botão verde de rodar do cabeçalho (ou, no Console, **Executar meus blocos**). **Deixe o robô livre na superfície.** | O robô **anda para frente em linha reta** (observe se curva) por cerca de 90 cm e para sozinho. Anote o quanto ele andou e para que lado curvou, se curvou. | |
| **A5** | Rode o exemplo **"2. Desenhar um quadrado"** olhando os blocos na tela. | Enquanto roda, **cada bloco acende** na hora em que o robô executa aquele passo. No Console **não** aparecem linhas como `SANCABOT_TRACE`. O robô desenha (mais ou menos) um quadrado; anote se virou para o lado certo (direita). | |
| **A6** | Rode de novo e, no meio, aperte **Parar programa** (aba Console). | O robô **para na hora** (ou em até meio segundo). O Console mostra a interrupção em português ("programa interrompido") e volta o `>>>`. | |
| **A7** | No Console digite `1/0` e Enter; depois digite `abc` e Enter. | Mensagens em **português** ("divisão por zero…", "o nome 'abc' não existe…"). Desligue o interruptor **"Mensagens do robô em português"**, repita `1/0`: agora aparece a mensagem original em inglês (ZeroDivisionError). Ligue de novo. | |
| **A8** | Aba **Arquivos**: aperte o botão de atualizar (↻) da lista. Clique em `main.py` (se existir). | A lista mostra os arquivos do robô (`boot.py`, `main.py`...). Clicar abre o conteúdo no editor e liga os botões **▶ Executar / ⬇ Baixar para o PC / 🗑 Excluir do robô**. | |
| **A9** | Ainda em **Arquivos**: digite o nome `teste.py`, escreva no editor `print("gravado")` e aperte **Salvar**. Atualize a lista, abra `teste.py`, aperte **▶ Executar**, depois **🗑 Excluir do robô**. | `teste.py` aparece na lista; **▶ Executar** mostra `gravado` no Console; **Excluir** pergunta e some da lista. | |
| **A10** | Exemplo **"4. Parar antes da parede"**: coloque o livro a uns 60 cm à frente do robô e rode. | O robô anda e **para antes de encostar**. Meça com a régua a distância entre a frente do robô e o livro depois que parou (esperado: **perto de 15 cm**). | |
| **A11** | Aba Console: **Reiniciar o robô**. | O Console mostra o aviso de reinício ("MPY: soft reboot" / reinício suave) e volta o `>>>`. | |
| **A12** | Clique em **Conectado** para **desconectar**; depois conecte de novo (A2). Repita uma vez. | Desconecta e reconecta sem travar; o botão volta a "Conectar" e depois a "Conectado". | |
| **A13** | Com o robô conectado, **recarregue a página** (F5). | A página volta na mesma aba e com os mesmos blocos (a conexão precisa ser refeita, é normal). | |
| **A14** | Com o robô conectado, **puxe o cabo USB**. | O botão volta a "Conectar" e o Console avisa que desconectou; **a página não trava**. (Se não avisar, anote: é um ponto a melhorar.) | |

---

## B) Medidas para o simulador (~15 minutos)

**Por que importa:** o simulador hoje usa valores **chutados**. Com as medidas reais, os exemplos e o percurso simulado passam a bater com o robô. Faça cada medida **3 vezes** e anote a média.

| # | O que medir | Como | Valor atual (chute) | Medido |
|---|---|---|---|---|
| **B1** | **Distância entre as rodas** (`trackCm`) | Régua: do centro de uma roda ao centro da outra, onde elas tocam o chão. Em cm. | 10 cm | |
| **B2** | **Velocidade em linha reta a 50%** | *Mover para frente, 50%, por 2 s* (bloco *Mover* por tempo). Marque onde largou e onde parou; meça a distância. Divida por 2 → cm/s. | calculada: ≈ 7,9 cm/s | |
| **B3** | **Tempo para girar 90° a 50%** (`turn90At50`) | *Girar para a direita, 50%, por T segundos*. Ajuste T até o robô virar exatamente 90° (confira no esquadro). Anote T. | 1,0 s | |
| **B4** | **Desvio em linha reta** | *Mover para frente, 50%, por ~12 s* (≈ 100 cm). Meça o quanto saiu da linha (cm) e **para qual lado**. | sem desvio | |
| **B5** | **Qual roda é a esquerda?** | No bloco *Preparar motores*, a porta "esquerdo" é **Servo 0**. Com o robô levantado, rode *Mover para frente* e veja se a roda da **esquerda** (de quem olha de trás) gira primeiro/igual. Se for a do lado contrário, anote. | Servo 0 = esquerda, Servo 1 = direita | |
| **B6** | **Sensores IR** (se o robô tiver) | Anote em qual **pino** (5 ou 6) fica o sensor do lado **esquerdo** e qual do **direito**. | sem lado definido | |
| **B7** | **Ultrassom: qual pino é Trig e qual é Echo** | O bloco *Preparar sensor de distância* usa emissor = Ultrassom 7, receptor = Ultrassom 8. Se na A10 o robô parou certo, está correto; se o sensor nunca "vê" nada, troque os dois e teste de novo. | 7 = emissor, 8 = receptor | |
| **B8** | **Tamanho da pista** das aulas | Largura × altura da área livre de verdade, em cm. | 120 × 80 cm | |

**Conta de conferência (B1, B2, B3):** o simulador calcula a velocidade a 50% por `v = (π/2 ÷ B3) × (B1 ÷ 2)`. Com B1 = 10 e B3 = 1,0 dá ≈ 7,85 cm/s. Se a **B2 medida** ficar mais de **10%** diferente disso, anote: significa que as três medidas não combinam entre si (por exemplo, a roda patina) e vamos ajustar o simulador para usar a velocidade medida em vez da calculada.

---

## C) Extras (opcional, ~10 minutos)

| # | Faça | Esperado | |
|---|---|---|---|
| **C1** | **Bluetooth:** desconecte o USB; **Conectar → Bluetooth**. Escolha o robô. Rode um exemplo. | Conecta, roda e para. (No Chrome do **iPad** e do Safari o Bluetooth costuma **não existir**: anote o que aparece.) | |
| **C2** | **Wi-Fi:** se o robô estiver na mesma rede, use **Rede Wi-Fi** com o endereço e a senha do robô. | Conecta e roda. Se não tiver como testar, marque ➖. | |
| **C3** | **Tablet:** abra o endereço no tablet (o servidor tem de estar acessível na rede; ou use o computador com a janela estreita) e conecte por USB-C/OTG se o tablet permitir. | Os botões são fáceis de tocar; o Console cabe na tela. | |
| **C4** | **Robô lento:** ligue o botão da **tartaruga** (modo passo a passo) e rode o quadrado. | O robô faz uma pausa curta depois de cada bloco e o destaque acompanha com calma. | |
| **C5** | **Uma criança testa:** peça a um aluno para montar "andar e parar" sozinho. | Observe onde ele hesita ou erra (sem ajudar). Anote as dúvidas dele: valem ouro. | |

---

## Se algo der errado

Anote, na folha, para cada ❌:
1. **O passo** (ex.: A6) e **o que aconteceu** em uma ou duas frases.
2. **Foto da tela**, em especial do **Console** (ou copie o texto: no Console, selecione e Ctrl+Insert).
3. O **modelo e a versão** (computador, Chrome, tipo de cabo USB).
4. Se o robô **travou**: o que fez para destravar (desligar, apertar reset).

Dicas rápidas:
- **A lista de portas vem vazia:** troque o cabo (precisa ser de dados), tente outra porta USB, feche outros programas que usem a porta.
- **Conecta mas não responde:** aperte o botão de **reset** do robô ou use **Reiniciar o robô ao conectar** (no diálogo Conectar).
- **O robô anda torto de propósito:** é o "desvio do mundo real" (B4): vale registrar, não é erro.

---

## Depois do teste

1. **Entregue a folha** (foto ou transcrição) e as fotos.
2. As **medidas** B1 a B8 vão para `bipes-sancabot/ui-v4/core/sancabot_config.js` (`robot.trackCm`, `robot.turn90At50`, `tablado`, `ports`). Os tempos dos 8 exemplos se recalculam sozinhos. Atualize também [MEDIDAS-DO-ROBO.md](MEDIDAS-DO-ROBO.md): troque "provisório" pelo valor medido, com data e quem mediu.
3. Rode `dev-local/testar.sh` (tudo deve continuar verde).
4. Atualize o [STATUS.md](STATUS.md) (itens com 🔴 de robô real) e o checklist de [PROMOCAO-V4.md](PROMOCAO-V4.md), critério 8.
5. Os ❌ viram correções antes de promover a v4. Se **A1 a A9** estiverem todos ✅, o critério mínimo do robô real está cumprido.

---

## Folha de registro (pode imprimir)

**Data:** ________  **Quem testou:** ________________  **Computador/sistema:** ________________  **Chrome:** ________  **Cabo:** ________

| Passo | ✅ ❌ ➖ | Observações |
|---|---|---|
| A1 abrir | | |
| A2 conectar USB | | |
| A3 digitar no Console | | |
| A4 andar em linha reta (cm andou / curvou?) | | |
| A5 quadrado e blocos acendendo | | |
| A6 parar | | |
| A7 erros em português / interruptor | | |
| A8 listar e abrir arquivos | | |
| A9 gravar, executar e excluir | | |
| A10 parar antes do livro (distância final: ___ cm) | | |
| A11 reiniciar o robô | | |
| A12 desconectar e reconectar | | |
| A13 recarregar a página | | |
| A14 puxar o cabo | | |
| C1 Bluetooth | | |
| C2 Wi-Fi | | |
| C3 tablet | | |
| C4 modo passo a passo | | |
| C5 aluno testou | | |

| Medida | Valor 1 | Valor 2 | Valor 3 | Média |
|---|---|---|---|---|
| B1 distância entre as rodas (cm) | | | | |
| B2 distância andada em 2 s a 50% (cm) → cm/s | | | | |
| B3 tempo do giro de 90° a 50% (s) | | | | |
| B4 desvio em ~100 cm (cm e lado) | | | | |

| Confirmações | Resposta |
|---|---|
| B5 roda esquerda é o Servo ___ | |
| B6 IR esquerdo no pino ___ / IR direito no pino ___ | |
| B7 ultrassom: Trig = pino ___ / Echo = pino ___ | |
| B8 pista: ___ × ___ cm | |
