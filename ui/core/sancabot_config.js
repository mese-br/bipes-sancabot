/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: PARÂMETROS de aparência e de linguagem do editor, num lugar só.
   Mude os valores aqui; o resto do código lê este objeto. Carregar antes de sancabot_scratch_theme.js. */
window.SancaBotConfig = {
  version: 'v3',  // v3 = paleta viva, ícones, Controle dividido, painel claro. Congeladas: v1 (/bipes-v1/) e v2 (/bipes-v2/), em dev-local/versoes

  // ---- Paleta: cores vivas e alegres, uma por papel. TODAS levam texto azul-marinho (contraste mínimo 5,5:1) ----
  palette: {
    prep:   '#FF7B6B',   // coral        preparar o robô e a placa, ajustes
    move:   '#4C9FFF',   // azul-céu     andar, girar, motores
    sense:  '#1FD3C0',   // turquesa     sentir: distância e sensores
    decide: '#FF9A3C',   // tangerina    decidir: se... então
    repeat: '#FFD23F',   // amarelo-sol  repetir
    calc:   '#5FDB74',   // verde-folha  contas e condições (verdadeiro/falso)
    time:   '#A58BFF',   // lavanda      tempo, esperar, sons
    store:  '#FF6FA5',   // rosa-chiclete guardar: variáveis
    text:   '#F27DDC',   // orquídea     texto e telas
    lists:  '#B5E04B',   // lima         listas
    net:    '#6FD3FF',   // celeste      redes e comunicação
    more:   '#A9B6D8',   // cinza-azulado funções, arquivos, avançado
    events: '#FFD23F'    // "quando começar" (mesmo amarelo de repetir)
  },
  ink: '#1B2250',        // cor do texto e dos ícones nos blocos
  // ---- Fonte dos blocos (arquivo em media/fonts/nunito; ver @font-face em core/sancabot_scratch.css) ----
  font: {
    family: 'Nunito',
    fallback: '"Baloo 2","Trebuchet MS","Segoe UI",system-ui,-apple-system,sans-serif',
    weight: '800',        // 400 normal ... 800 negrito arredondado (estilo Scratch)
    size: 13              // tamanho do texto dentro dos blocos (px)
  },

  // ---- Espaçamento dos blocos (px). Menores = blocos mais compactos, com menos "ar" em volta do texto ----
  spacing: {
    minBlockHeight: 40,           // altura mínima de uma linha de bloco (padrão do Zelos: 48)
    smallPadding: 6,              // entre um campo e o seguinte (padrão 4)
    mediumPadding: 7,             // padding médio (padrão 8)
    largePadding: 12,             // margem das bordas do bloco (padrão 16)
    emptyInlineInputPadding: 10,  // largura de um encaixe vazio (padrão 16)
    cornerRadius: 6               // arredondamento dos cantos (padrão 4)
  },

  // ---- Textos que o projeto novo já traz ----
  defaults: {
    author: 'Aluno',              // no lugar de "User"
    description: 'Meu projeto'    // no lugar de "My project"
  },

  // ---- Portas da placa: NOME que o aluno vê -> PINO real (ESP32-C3, pinos 0 a 21) ----
  // PROVISÓRIO: as letras seguem a ordem dos pinos (A = pino 0, B = pino 1...), o que mantém os padrões de hoje
  // (motores em A e B; sensor de distância em H e I). Troque pelos nomes reais da placa: [['Motor E', 0], ['Motor D', 1], ...].
  // Pinos que não estiverem na tabela aparecem como "pino N", então nenhum projeto antigo deixa de abrir.
  ports: 'ABCDEFGHIJKLMNOPQRSTUV'.split('').map(function (n, i) { return [n, i]; }),

  // ---- Simulador de trajetória (aba "Simulador") ----
  // trackCm = distância entre as rodas, em cm. PROVISÓRIA (meça no robô). A velocidade vem do giro calibrado do próprio robô
  // (girar 90° em 1,0 s a 50%, o padrão do runtime em generator_stubs_sancabot.js; o bloco "Calibrar giro" muda isso na simulação).
  robot: { trackCm: 10, turn90At50: 1.0 },
  tablado: { w: 120, h: 80 },   // tamanho do tablado em cm

  // ---- Linguagem para iniciantes ----
  // Nos menus de pino, "GPIO5" aparece como "porta 5" (só o texto; o código gerado não muda).
  portWord: 'porta',
  beginner: {
    enabled: true,                              // true = começa no modo iniciante
    advancedParent: 'Laboratório Avançado',     // grupo da caixa de blocos que guarda as categorias técnicas
    keepCategories: ['Lógica', 'Matemática'],   // categorias desse grupo que o iniciante continua vendo
    parentLabel: 'Lógica e matemática',         // nome do grupo no modo iniciante (no avançado volta ao original)
    storageKey: 'sancabot_modo_avancado'        // guarda a escolha do aluno neste navegador
  }
};
