# Registro de decisões (ADR)

Formato: contexto → decisão → consequências. Status: **Aceita**, **Proposta** (aguarda o responsável) ou **Substituída**.

### ADR-001 — Basear o editor no BIPES (GPL-3.0) · Aceita
**Contexto:** precisávamos de conexão com o robô, envio de arquivos e salvamento prontos. **Decisão:** derivar do BIPES e manter a licença GPL-3.0 com atribuição. **Consequências:** ganhamos meses de trabalho; herdamos código antigo e a obrigação de licença. O editor único é o `bipes-sancabot` (D1 do plano da plataforma).

### ADR-002 — Migrar o Blockly de 6 para 13.4.0 com renderizador próprio · Aceita
**Contexto:** visual do Blockly 6 inadequado para estudantes do ciclo básico; limite para blocos curtos e coloridos. **Decisão:** Blockly 13 com renderizador e tema `sancabot` e uma camada de compatibilidade. **Consequências:** Python gerado idêntico ao das versões anteriores (verificado); alguns eventos antigos mudaram (ex.: o destaque do bloco agora usa uma classe CSS própria).

### ADR-003 — Congelar versões em vez de usar git · Aceita (provisória)
**Contexto:** o projeto não está em um repositório. **Decisão:** copiar a pasta `ui` para `dev-local/versoes/vN` e servir lado a lado. **Consequências:** é possível comparar e voltar; não há histórico fino nem revisão. **Substituir** quando o repositório existir (marco M16).

### ADR-004 — Só traduzir o que se vê; nunca o que se digita · Aceita
**Contexto:** o aluno precisa aprender o Python real do firmware. **Decisão:** a tradução do Console mexe apenas na exibição; o texto digitado vai ao robô sem mudar, o eco do `>>>` é protegido e há um interruptor para ver a mensagem original. **Consequências:** o aluno pode pesquisar erros em inglês; um `print` igual a uma mensagem de erro também é traduzido quando o interruptor está ligado.

### ADR-005 — Cabeçalho no padrão do SatBlocks · Aceita
**Contexto:** o cabeçalho antigo ficava lotado em tablet e telefone. **Decisão:** menu Projeto, abas que viram menu (sem esconder), um botão Conectar com diálogo de 3 cartões. **Consequências:** menos redundância; mais JavaScript de montagem (hoje em `sancabot_header_early.js`).

### ADR-006 — Galeria com dois níveis e aprovação do professor · Aceita
**Contexto:** público infantil. **Decisão:** abas Turma e Comunidade; publicar na Comunidade exige aprovação; só reações prontas, **sem comentários livres**; remix com crédito vindo do servidor; apelido, nunca nome real. **Consequências:** moderação simples e segura; sem conversa entre alunos.

### ADR-007 — Galeria em dois modos (servidor e local) com leituras síncronas · Aceita
**Contexto:** a interface já existia antes da API. **Decisão:** `SancaBotGaleria` escolhe o modo ao abrir; leituras vêm de um cache, escritas devolvem Promise. **Consequências:** o editor continua funcionando sem o Studio (demonstração); o modo servidor é a referência.

### ADR-008 — O XML dos projetos compartilhados é só dado · Aceita
**Contexto:** alunos enviam conteúdo ao servidor. **Decisão:** o servidor nunca executa o XML; confere tamanho, recusa DOCTYPE e entidades, exige tipos de bloco `[A-Za-z0-9_]` e ao menos um bloco. **Consequências:** superfície de ataque pequena; a miniatura é gerada no navegador (pesa na lista; ver M13).

### ADR-009 — Armazenamento em arquivo JSON no servidor, por enquanto · Aceita (provisória)
**Contexto:** mesma escolha dos blocos do Creator. **Decisão:** `gallery.json` em `DATA_DIR` com bloqueio de arquivo. **Consequências:** simples de operar e testar; **não escala**. O plano da plataforma prevê MySQL (D3).

### ADR-010 — Papéis provisórios: admin = professor, turma `geral` · Aceita (provisória)
**Decisão:** até existirem turmas, qualquer conta é aluno e o admin do Studio é professor. O servidor já lê `turma` do cookie. **Substituir** no M12.

### ADR-011 — Esconder a página até o cabeçalho estar montado · Aceita
**Contexto:** o layout antigo aparecia por um instante. **Decisão:** montar o cabeçalho antes do primeiro desenho e manter a página oculta só se for preciso restaurar outra aba; cronômetro de segurança de 4 s. **Consequências:** carregamento ≈0,16 s na aba Blocos.

### ADR-012 — Interface própria sem a camada antiga do BIPES · Aceita em 2026-10-29 (ver ADR-018)
**Contexto:** a interface roda por cima do HTML/CSS/JS antigo e isso encarece cada ajuste. **Opções:** (a) manter assim; (b) substituir por partes; (c) reescrever de uma vez. **Recomendação:** (b), precedida do M10 (testes de interface). Ver M8 em [ROADMAP.md](ROADMAP.md). **Decide:** o responsável.

### ADR-013 — Abas herdadas ficam escondidas, não removidas · Aceita
**Contexto:** IOT, EasyMQTT e Databoard vêm do BIPES e não fazem parte do plano atual, mas podem ser úteis quando o projeto amadurecer. **Decisão:** esconder as três abas por uma regra de CSS (`sancabot_layout.css`) e manter o código. **Consequências:** o aluno não vê telas não traduzidas; reativar é apagar uma regra.

### ADR-014 — Login de alunos por turma e PIN, com migração futura para o login unificado do AIPES · Aceita
**Contexto:** é preciso que alunos entrem sem conta própria de adulto. **Decisão:** por enquanto turma + PIN (papel `student`, apelido); mais tarde, login unificado no estilo do AIPES. **Consequências:** o servidor já lê `turma` do cookie; a identidade do aluno deve ser desenhada para migrar de PIN para conta unificada sem perder projetos (guardar um identificador estável do aluno).

### ADR-015 — Moderação baseada em critérios públicos (ECA e ECA Digital) · Aceita
**Contexto:** a galeria é pública e infantil. **Decisão:** a lista de palavras bloqueadas e as regras de conteúdo serão definidas a partir de critérios públicos alinhados ao ECA (Lei 8.069/1990) e ao ECA Digital, e revisadas por pessoa habilitada. Mantém-se: só apelido, sem comentários livres, aprovação do professor para a Comunidade. **Consequências:** exige uma tarefa de curadoria (M13); o texto final de políticas precisa de revisão jurídica.

### ADR-016 — Comunidade visível para qualquer visitante · Aceita
**Decisão:** a aba "Da comunidade" é aberta, sem login, como no Tinkercad; só a publicação, as curtidas e o remix exigem conta. **Consequências:** nada que o aluno publica na Comunidade é privado; por isso só entra após aprovação do professor.

### ADR-017 — Ações de arquivo na barra do editor · Aceita
**Decisão:** "Executar", "Baixar para o PC" e "Excluir do robô" agem sobre o arquivo do robô aberto no editor (padrão SatBlocks), em vez de três ícones sem texto em cada linha. **Consequências:** botões claros e desligados quando não há arquivo aberto; a lista fica só com os nomes.

### ADR-018 — Interface própria (v4) feita de uma vez, com a v3 preservada · Aceita
**Contexto:** o responsável escolheu a troca completa da camada antiga do BIPES, mas pediu que o que existe fique inalterado e que dê para voltar. **Decisão:** (1) congelar a v3 em `dev-local/versoes/v3/ui` (somente leitura, `/bipes-v3/`) e a API do Studio em `v3-servidor-studio-api.tgz`; (2) manter `bipes-sancabot/ui` como está (v3 em trabalho, `/bipes/`); (3) construir a v4 em `bipes-sancabot/ui-v4` (`/bipes-v4/`), promovida só depois de aprovada. **Consequências:** nenhum risco para o produto atual; a v4 pode ser comparada lado a lado; voltar é abrir a v3 ou `restaurar.sh v3`. Custo: duas pastas até a promoção.

### ADR-020 — Link do projeto pela Galeria, não por servidor externo · Aceita
**Contexto:** o item "Gerar link do projeto" do BIPES enviava o projeto a um endpoint `/storage` que o SancaBot não tem (nunca funcionou) e, se funcionasse, guardaria projetos de crianças fora da moderação. **Decisão:** o link aponta para um projeto da **Galeria** (`?galeria=ID`); abrir o link cria um **projeto novo** com uma cópia, só se a pessoa puder ver aquele projeto (Comunidade: qualquer um; Turma: a turma; pendente: autor e professor). O Remix também abre como projeto novo. **Consequências:** o link passa pelas regras de visibilidade e aprovação; o projeto precisa estar compartilhado para ter link; o aluno nunca perde o que estava montando.

### ADR-021 — Sem rastreadores nem CDNs de terceiros ao abrir o editor · Aceita
**Decisão:** removidos Google Analytics, cookie do BIPES, tela de boas-vindas, componente PWA de CDN e blocos de OpenCV. **Consequências:** nenhuma coleta de uso; o modo offline (PWA) fica desligado até ser refeito sem CDN (M16).

### ADR-019 — Nomes de portas do firmware, não letras · Aceita (na v4)
**Decisão:** as portas aparecem como **Servo 0, Servo 1, IR 5, IR 6, Ultrassom 7 e Ultrassom 8** (nomes do firmware Free v1.0) e "pino N" para as demais; os blocos deixam de dizer "porta" antes do menu. O valor guardado continua sendo o número do pino (projetos antigos abrem). **A confirmar** com a placa: lado de cada servo e de cada IR.

### ADR-022 — Dois robôs (Free v1.0 e v2) escolhidos no cabeçalho, com pinos do firmware · Aceita (na v4)
**Contexto:** o firmware (`mese-br/sancabot-firmware`) tem duas linhas de hardware: Free v1.0 (atual) e v2 r12, que muda o servo direito para o pino 21 e acrescenta contato e Hall. **Decisão:** a tabela de pinos de cada robô fica em um lugar só (`SancaBotConfig.robos`); o seletor de robô que já existia no cabeçalho oferece os dois (`SancaBot` = Free, mantendo o nome para os projetos antigos, e `SancaBotV2`); nomes das portas, padrões dos blocos, aba "Meu robô" e avisos leem dessa tabela. O robô vai no projeto (`DEVICE`). **Consequências:** trocar de robô só reescreve nomes e avisa se um pino não bate; não altera blocos sozinho. Ver [ROBOS.md](ROBOS.md). Substitui, na parte dos nomes, a ADR-019 ("Servo 0", "IR 5"…).

### ADR-023 — Blockly vendorizado, sem submódulo · Aceita
**Contexto:** o repositório herdou do BIPES um submódulo `blockly` fixo em um commit de 16/09/2024 do `google/blockly` (1.329 commits atrás da `main`), que nada usa: o editor carrega o Blockly 13.4.0 copiado em `core/blockly13/`. O GitHub mostrava o SHA antigo e dava a entender que o projeto usava aquela versão. **Decisão:** remover o submódulo e o alvo `git-clone` do `Makefile`; o `make copy` só traz as dependências do `webrepl`. **Consequências:** a versão do Blockly passa a ser a da pasta `blockly13` (e a do `package`/`VERSION` dentro do arquivo compilado). O `make offline` não copia mais o Blockly 6 por cima dos arquivos.
