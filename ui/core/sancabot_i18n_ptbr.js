/* SPDX-License-Identifier: GPL-3.0-or-later
   SancaBot by BIPES: textos dos blocos de hardware/BIPES em português do Brasil.
   Os blocos de hardware foram escritos com rótulos em inglês dentro de block_definitions.js. Em vez de editar ~700 definições,
   este arquivo traduz, em tempo de execução, os RÓTULOS e as OPÇÕES DE MENU de cada bloco (exatamente como estão escritos).
   Valores internos (o que vai para o Python) NÃO mudam: só o texto exibido. Nomes de funções Python (Pin.value, LCD160CR.dot...)
   e siglas técnicas ficam como estão de propósito.
   Só age quando o idioma é pt-br. Carregar depois de block_definitions*.js e antes de Code.init(). */
(function () {
  'use strict';
  var B = window.Blockly;
  if (!B || !window.Code || Code.LANG !== 'pt-br') return;

  var D = {
    'Hue': 'Matiz', 'Saturation': 'Saturação', 'Lightness': 'Luminosidade',
    'Read RPI Pico ADC Input': 'Ler entrada analógica (ADC) do RPi Pico', 'pin': 'pino',
    'Setup Web Bluetooth REPL': 'Configurar REPL por Web Bluetooth', 'Bluetooth name:': 'Nome do Bluetooth:',
    'Start Web Bluetooth REPL': 'Iniciar REPL por Web Bluetooth', 'Cell': 'Célula',
    'LCD Backlight': 'Luz de fundo do LCD', 'ON/OFF': 'LIGADO/DESLIGADO', 'Clear LCD': 'Limpar LCD', 'LCD Power': 'Energia do LCD',
    'Init I2C Character LCD Display': 'Iniciar display LCD de caracteres I2C', 'Lines': 'Linhas', 'Columns': 'Colunas',
    'Move LCD Cursor to': 'Mover cursor do LCD para', 'Write text on LCD': 'Escrever texto no LCD', 'Text': 'Texto',
    'Clear OLED Display': 'Limpar display OLED',
    'Init PID Controller #': 'Iniciar controlador PID nº', 'tunings Kp': 'ajustes Kp', 'update every': 'atualizar a cada',
    'get': 'obter', 'counter': 'contador', 'by': 'por',
    'seconds': 'segundos', 'miliseconds': 'milissegundos', 'microseconds': 'microssegundos', 'nanoseconds': 'nanossegundos',
    'cpu ticks': 'ciclos da CPU', 'setpoint': 'valor desejado (setpoint)', 'PID #': 'PID nº', 'enable': 'ativar',
    'compute PID #': 'calcular PID nº', 'with': 'com', 'timestep (s)': 'passo de tempo (s)', 'output limits': 'limites de saída',
    'from': 'de', 'to': 'para', 'tunings': 'ajustes', 'get PID #': 'obter PID nº', 'Kp gain': 'ganho Kp', 'Ki gain': 'ganho Ki',
    'Kd gain': 'ganho Kd', 'tunings (Kp, Ki, Kd)': 'ajustes (Kp, Ki, Kd)', 'last time': 'último instante',
    'output limits (lower, upper)': 'limites de saída (mínimo, máximo)', 'auto mode': 'modo automático',
    'power components': 'componentes de potência',
    'Set DC Motor Direction': 'Definir sentido do motor DC', 'Direction': 'Sentido', 'Init DC Motor': 'Iniciar motor DC',
    'Motor Name': 'Nome do motor', 'Set DC Motor Power': 'Definir potência do motor DC', 'Power': 'Potência',
    'Stop DC Motor': 'Parar motor DC', 'decode bytes to text': 'decodificar bytes em texto', 'deep sleep': 'sono profundo (deep sleep)',
    'delay milliseconds': 'esperar milissegundos', 'delay seconds': 'esperar segundos', 'delay microseconds': 'esperar microssegundos',
    'EasyMQTT Stop': 'Parar EasyMQTT',
    'Init Rotatory Encoder': 'Iniciar encoder rotativo', 'Read Encoder Value': 'Ler valor do encoder', 'Reset Encoder': 'Zerar encoder',
    'ESP32 Analog Input (ADC)': 'Entrada analógica (ADC) do ESP32', 'Attenuation:': 'Atenuação:', 'Width:': 'Resolução:',
    'ESP32-CAM capture photo': 'ESP32-CAM: tirar foto', 'ESP32-CAM Init': 'Iniciar ESP32-CAM',
    'Control ESP32-CAM red LED': 'Controlar LED vermelho da ESP32-CAM', 'Control ESP32-CAM flashlight': 'Controlar lanterna da ESP32-CAM',
    'Set CAN Filter': 'Definir filtro CAN', 'Frame Filter': 'Filtro de quadro',
    'Init ESP32 CAN Bus Controller': 'Iniciar controlador de barramento CAN do ESP32', 'Mode': 'Modo',
    'Baud Rate': 'Taxa de transmissão (baud)', 'Extended CAN Frame': 'Quadro CAN estendido', 'Receive CAN Frame': 'Receber quadro CAN',
    'Send CAN Frame': 'Enviar quadro CAN', 'Frame Data': 'Dados do quadro',
    'Set RTC Value (ESP32)': 'Definir valor do RTC (ESP32)', 'year': 'ano', 'month': 'mês', 'day': 'dia', 'hour': 'hora',
    'minute': 'minuto', 'second': 'segundo',
    'Run Python Code': 'Executar código Python', 'Command': 'Comando', 'Execute Python custom with output': 'Executar Python personalizado com saída',
    'file': 'arquivo', 'Close file': 'Fechar arquivo', 'filename': 'nome do arquivo', 'Append': 'Acrescentar', 'Read': 'Ler',
    'Overwrite': 'Sobrescrever', 'Read and Write': 'Ler e escrever', 'Open text file for reading': 'Abrir arquivo de texto para leitura',
    'Open text file for writing': 'Abrir arquivo de texto para escrita', 'Read data from the file': 'Ler dados do arquivo',
    'Read text from the file': 'Ler texto do arquivo', 'Write to file': 'Escrever no arquivo', 'Data:': 'Dados:',
    'Write single byte to file': 'Escrever um byte no arquivo', 'Write text to file': 'Escrever texto no arquivo', 'List files': 'Listar arquivos',
    'Fill OLED Display with': 'Preencher display OLED com', 'classifier': 'classificador',
    'Get CPU Clock Frequency': 'Obter frequência da CPU', 'Send data to a Google spreadsheet': 'Enviar dados para uma planilha do Google',
    'Deployment Code': 'Código de implantação', 'Cells': 'Células',
    'External event (Interrupt on Input Pin)': 'Evento externo (interrupção em pino de entrada)', 'Trigger:': 'Gatilho:', 'Pin': 'Pino',
    'IRQ_FALLING and IRQ_RISING': 'IRQ_FALLING e IRQ_RISING', 'Disable interrupt on pin': 'Desativar interrupção no pino',
    'GPS Date and Time': 'Data e hora do GPS', 'GPS Altitude': 'Altitude do GPS', 'GPS Latitude': 'Latitude do GPS',
    'GPS Longitude': 'Longitude do GPS', 'GPS Speed': 'Velocidade do GPS', 'Init GPS Module': 'Iniciar módulo GPS',
    'Update GPS Readings': 'Atualizar leituras do GPS',
    'GSM: Send HTTP GET Request': 'GSM: enviar requisição HTTP GET', 'Request:': 'Requisição:',
    'Init SIM800/900 GSM MODEM': 'Iniciar modem GSM SIM800/900', 'TX Pin:': 'Pino TX:', 'RX Pin:': 'Pino RX:', 'Baud rate:': 'Taxa (baud):',
    'Get GSM Modem Response': 'Obter resposta do modem GSM', 'Timeout:': 'Tempo limite:', 'Send AT Command': 'Enviar comando AT',
    'Command:': 'Comando:', 'Send SMS Message': 'Enviar mensagem SMS', 'Destination:': 'Destino:', 'Message:': 'Mensagem:',
    'Start HCSR04 Ultrasound sensor': 'Iniciar sensor ultrassônico HC-SR04', 'echo pin': 'pino echo', 'trigger pin': 'pino trigger',
    'timeout (us)': 'tempo limite (µs)', 'Get distance (ultrasound sensor)': 'Obter distância (sensor ultrassônico)', 'request': 'requisição',
    'Init MPU6050 IMU': 'Iniciar IMU MPU6050', 'Init I2C SSD1306 OLED Display': 'Iniciar display OLED SSD1306 I2C',
    'Init RC Servo Motor': 'Iniciar servomotor', 'Servo Name': 'Nome do servo', 'Tank Init': 'Iniciar tanque',
    'X position': 'posição X', 'Y position': 'posição Y', 'Rotation': 'Rotação',
    'localStorage topic': 'tópico do localStorage', 'axis data (x, y, ...)': 'dados dos eixos (x, y, ...)', 'dataset': 'conjunto de dados', 'axis': 'eixo',
    'Init MAX30100 Sensor': 'Iniciar sensor MAX30100', 'Get MAX30100 IR Value': 'Obter valor IR do MAX30100',
    'Update MAX30100 Reading': 'Atualizar leitura do MAX30100', 'Get MAX30100 Red Value': 'Obter valor vermelho do MAX30100',
    'Move Servo Motor': 'Mover servomotor', 'Angle': 'Ângulo',
    'Acceleration - X axis': 'Aceleração - eixo X', 'Acceleration - Y axis': 'Aceleração - eixo Y', 'Acceleration - Z axis': 'Aceleração - eixo Z',
    'Gyro - X axis': 'Giroscópio - eixo X', 'Gyro - Y axis': 'Giroscópio - eixo Y', 'Gyro - Z axis': 'Giroscópio - eixo Z',
    'Add Data to MQTT Buffer': 'Adicionar dado ao buffer MQTT', 'Field Name': 'Nome do campo', 'Value': 'Valor',
    'Check MQTT Server for pending messages': 'Verificar mensagens pendentes no servidor MQTT', 'Disconnect MQTT Client': 'Desconectar cliente MQTT',
    'Start MQTT Client': 'Iniciar cliente MQTT',
    'Server Address': 'Endereço do servidor', 'Server Port': 'Porta do servidor', 'Publish Buffer to MQTT Topic': 'Publicar buffer em um tópico MQTT',
    'QOS:': 'QoS:', '0 - at most once': '0 - no máximo uma vez', '1 - at least once': '1 - pelo menos uma vez',
    'Publish Payload to MQTT Topic': 'Publicar mensagem em um tópico MQTT', 'Set Callback to MQTT Messages': 'Definir ação ao receber mensagens MQTT',
    'received from': 'recebido de', 'Subscribe to MQTT Topic': 'Assinar tópico MQTT', 'Wait for MQTT Server messages': 'Aguardar mensagens do servidor MQTT',
    'Control NeoPixel': 'Controlar NeoPixel', 'Init NeoPixel': 'Iniciar NeoPixel', 'Number of LEDs': 'Número de LEDs', 'Write NeoPixel': 'Atualizar NeoPixel',
    'Configure Access Point Mode': 'Configurar modo ponto de acesso', 'Network name': 'Nome da rede', 'Network password': 'Senha da rede',
    'Close HTTP Web Server': 'Fechar servidor HTTP Web', 'JPG Image': 'Imagem JPG', 'Wifi current IP': 'IP atual do Wi-Fi',
    'NTP: Network Time Protocol': 'NTP: protocolo de hora na rede', 'Make HTTP POST Request URL': 'Fazer requisição HTTP POST para a URL',
    'Socket Close': 'Fechar socket', 'TCP/IP Socket Connect': 'Conectar socket TCP/IP', 'Host:': 'Servidor:', 'Port:': 'Porta:',
    'Socket Receive': 'Receber pelo socket', 'Bytes to receive:': 'Bytes a receber:', 'Socket Send': 'Enviar pelo socket',
    'Configure WizNet5000': 'Configurar WizNet5000', 'Ethernet Controller': 'Controlador Ethernet', 'IP:': 'IP:', 'Subnet:': 'Sub-rede:',
    'Gateway:': 'Gateway:', 'DNS:': 'DNS:', 'Init WizNet5000': 'Iniciar WizNet5000', 'SPI Bus:': 'Barramento SPI:',
    'Check if Ethernet is Connected': 'Verificar se a Ethernet está conectada', 'Dump Ethernet Registers': 'Despejar registradores da Ethernet',
    'Play music note': 'Tocar nota musical', 'Duration (s):': 'Duração (s):', '(0 for infinite duration)': '(0 para duração infinita)',
    'Trigger DS1820 reading': 'Disparar leitura do DS1820', 'Init OneWire Bus': 'Iniciar barramento OneWire',
    'DS1820 Temperature reading': 'Leitura de temperatura do DS1820', 'Scan DS1820 sensors': 'Procurar sensores DS1820',
    'RPI Pico Timer': 'Temporizador do RPi Pico', 'Interval (ms):': 'Intervalo (ms):', 'Play MP3 file': 'Tocar arquivo MP3',
    'PWM #': 'PWM nº', 'deinit PWM #': 'desativar PWM nº', 'RPi Pico PWM #': 'PWM nº do RPi Pico', 'Try/Catch': 'Tentar/Capturar erro',
    'Random Forest Classifier': 'Classificador Random Forest',
    'Cause: woke up from deepsleep': 'Causa: acordou do sono profundo', 'Cause: hard reset': 'Causa: reinício forçado',
    'Cause: soft reset': 'Causa: reinício por software', 'Cause: reset by watchdog timer': 'Causa: reinício pelo cão de guarda (watchdog)',
    'Get card identification (UID)': 'Obter identificação do cartão (UID)', 'Check if RFID Card is present': 'Verificar se há um cartão RFID',
    'Init RC522 RFID Module': 'Iniciar módulo RFID RC522', 'Read RFID Card Memory': 'Ler memória do cartão RFID',
    'Write RFID Card Memory': 'Escrever na memória do cartão RFID', 'Play song (RTTTL)': 'Tocar música (RTTTL)',
    'Run Linux command': 'Executar comando Linux', 'Mount SD Card': 'Montar cartão SD', 'mount point': 'ponto de montagem',
    'Set CPU Clock Frequency': 'Definir frequência da CPU', 'Frequency (Hz)': 'Frequência (Hz)', 'Update OLED Display': 'Atualizar display OLED',
    'DC Motor#': 'Motor DC nº', 'Static Friction (Nm)': 'Atrito estático (Nm)', 'voltage (V)': 'tensão (V)', 'load (Nm)': 'carga (Nm)',
    'get DC Motor #': 'obter motor DC nº', 'static friction (Nm)': 'atrito estático (Nm)', 'torque (Nm)': 'torque (Nm)',
    'Load torque (Nm)': 'Torque de carga (Nm)', 'Water Boiler #': 'Aquecedor de água nº',
    'Dissipation rate (ΔºC/ms)': 'Taxa de dissipação (ΔºC/ms)', 'power input': 'potência de entrada',
    'Snek: Read analog Input': 'Snek: ler entrada analógica', 'Snek: delay seconds': 'Snek: esperar segundos',
    'Snek: Read digital pin': 'Snek: ler pino digital', 'Snek: Set power': 'Snek: definir potência', 'Power (0-1)': 'Potência (0-1)',
    'Sneck: time counter': 'Snek: contador de tempo',
    'ST7789 backlight intensity': 'Intensidade da luz de fundo do ST7789', 'ST7789 Color': 'Cor do ST7789', 'ST7789 Color: Red': 'Cor do ST7789: vermelho',
    'Fill ST7789 display': 'Preencher display ST7789', 'Init ST7789 Display': 'Iniciar display ST7789',
    'Draw line on ST7789 display': 'Desenhar linha no display ST7789', 'X0 position': 'posição X0', 'Y0 position': 'posição Y0',
    'X1 position': 'posição X1', 'Y1 position': 'posição Y1', 'Draw pixel on ST7789 display': 'Desenhar pixel no display ST7789',
    'Init Stepper Motor': 'Iniciar motor de passo', 'Stepper Step': 'Passo do motor de passo', 'Stop Timer': 'Parar temporizador',
    'Tank to': 'Tanque para', 'distance of': 'distância de', 'Tank to Turn': 'Tanque girar', 'to str': 'para texto', 'Thread #': 'Tarefa (thread) nº',
    'Compute time difference': 'Calcular diferença de tempo', 'Get milliseconds counter': 'Obter contador de milissegundos', 'Timer #': 'Temporizador nº',
    'once in': 'uma vez em', 'Set Brightness of Led Matrix': 'Definir brilho da matriz de LED', 'value (1-7)': 'valor (1-7)',
    'Custom Data Matrix layout': 'Layout personalizado da matriz', 'Start TM1640 LED Matrix': 'Iniciar matriz de LED TM1640',
    'Write Number on Led Matrix': 'Escrever número na matriz de LED', 'value (0-9)': 'valor (0-9)', 'Write array to Led Matrix': 'Escrever lista na matriz de LED',
    'LED array value': 'valores da matriz de LED', 'Tone (Hz)': 'Tom (Hz)', 'Note:': 'Nota:', 'except OSError': 'exceto OSError',
    'Init UART Serial Port': 'Iniciar porta serial UART', 'Start bit:': 'Bit de início:', 'Stop bit:': 'Bit de parada:', 'Parity:': 'Paridade:',
    'Read data from UART': 'Ler dados da UART', 'Bytes to read:': 'Bytes a ler:', 'Read all data from UART': 'Ler todos os dados da UART',
    'Read from UART into a Buffer': 'Ler da UART para um buffer', 'Destination Buffer:': 'Buffer de destino:', 'Read one line from UART': 'Ler uma linha da UART',
    'Send data to UART': 'Enviar dados pela UART', 'Init uMail Email Sender': 'Iniciar envio de e-mail (uMail)', 'Username:': 'Usuário:',
    'Password:': 'Senha:', 'Send email': 'Enviar e-mail', 'To email:': 'Para o e-mail:', 'Subject:': 'Assunto:', 'Email message:': 'Mensagem do e-mail:',
    'Create new folder': 'Criar nova pasta', 'Delete file': 'Excluir arquivo', 'until deadline #': 'até o prazo nº', 'sum time': 'somar tempo',
    'time difference from': 'diferença de tempo de', 'to float': 'para decimal', 'to int': 'para inteiro',
    'WebREPL Setup': 'Configurar WebREPL', 'Start WebREPL': 'Iniciar WebREPL', 'Write text on display': 'Escrever texto no display',
    'Print value on display': 'Mostrar valor no display',
    // textos que aparecem em blocos de uso comum no BIPES
    'get seconds counter': 'obter contador de segundos', 'get milliseconds counter': 'obter contador de milissegundos',
    'Configure Access Point Mode Network name': 'Configurar modo ponto de acesso, nome da rede',
    'tente': 'tente', 'Dados do projeto': 'Dados do projeto', 'Author': 'Autor', 'Description': 'Descrição'
  };

  function tr(s) {
    if (typeof s !== 'string') return s;
    var t = s.trim(); if (!t) return s;
    var out = Object.prototype.hasOwnProperty.call(D, t) ? D[t] : null;
    if (out === null) {
      // Iniciante: "GPIO5" -> "porta 5" (só o texto exibido; o valor do menu e o código gerado não mudam)
      var g = t.match(/^GPIO\s*(\d+)(.*)$/i), CF = window.SancaBotConfig || {};
      if (g) out = (CF.portWord || 'porta') + ' ' + g[1] + g[2];
    }
    if (out === null) return s;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    return lead + out + trail;
  }

  function translateDropdown(f) {
    var gen = f.menuGenerator_ !== undefined ? f.menuGenerator_ : f.menuGenerator;
    var wrap = function (opts) {
      return opts.map(function (o) { return (o && typeof o[0] === 'string') ? [tr(o[0]), o[1]] : o; });
    };
    var changed = false;
    if (Array.isArray(gen)) {
      var w = wrap(gen);
      changed = w.some(function (o, i) { return o[0] !== gen[i][0]; });
      if (changed) { if ('menuGenerator_' in f) f.menuGenerator_ = w; else f.menuGenerator = w; }
    } else if (typeof gen === 'function' && !gen.__sbtr) {
      var wf = function () { return wrap(gen.apply(this, arguments)); };
      wf.__sbtr = true; changed = true;
      if ('menuGenerator_' in f) f.menuGenerator_ = wf; else f.menuGenerator = wf;
    }
    if (changed) {
      // atualiza o texto da opção já escolhida
      try {
        var v = f.getValue();
        var opt = f.getOptions(false).filter(function (o) { return o[1] === v; })[0];
        if (opt) { if ('selectedOption' in f) f.selectedOption = opt; else f.selectedOption_ = opt; if (f.forceRerender) f.forceRerender(); }
      } catch (e) { /* mantém o texto original */ }
    }
  }

  function translateBlock(block) {
    try {
      var tip = block.tooltip, TIPS = window.sancabotI18nTips || {};
      if (typeof tip === 'string' && Object.prototype.hasOwnProperty.call(TIPS, tip.trim())) block.setTooltip(TIPS[tip.trim()]);
    } catch (e) { /* mantém a dica original */ }
    (block.inputList || []).forEach(function (input) {
      (input.fieldRow || []).forEach(function (f) {
        try {
          if (f instanceof B.FieldLabel) { var v = f.getValue(), t = tr(v); if (t !== v) f.setValue(t); }
          else if (f instanceof B.FieldDropdown) translateDropdown(f);
        } catch (e) { /* um campo problemático não pode quebrar o bloco */ }
      });
    });
  }

  function wrapAll() {
    Object.keys(B.Blocks).forEach(function (type) {
      var def = B.Blocks[type];
      if (!def || typeof def.init !== 'function' || def.__sbI18n) return;
      var orig = def.init;
      def.init = function () { var r = orig.apply(this, arguments); translateBlock(this); return r; };
      def.__sbI18n = true;
    });
  }
  wrapAll();
  // Projetos e toolbox em XML trazem o rótulo em inglês gravado no campo (<field name="NET_IFCONFIG">Wifi current IP</field>) e o
  // carregamento do XML sobrescreve a tradução feita no init. Por isso o próprio campo de rótulo traduz o valor que recebe.
  try {
    var FLp = B.FieldLabel.prototype, FLset = FLp.setValue;
    if (!FLset.__sbtr) { FLp.setValue = function (v) { return FLset.call(this, typeof v === 'string' ? tr(v) : v); }; FLp.setValue.__sbtr = true; }
  } catch (e) { /* sem o ajuste, só os rótulos vindos de XML ficam em inglês */ }
  window.sancabotI18n = { dict: D, translate: tr, wrapAll: wrapAll };
})();
