export const BLOG_CATEGORIES = ['Todas', 'Novexo Inc', 'Produto', 'Engenharia', 'Guias', 'Produtividade', 'Equipes']

export const BLOG_POSTS = [
  {
    slug: 'conheca-a-novexo-inc', tabTitle: 'Novexo Inc', category: 'Novexo Inc', date: '2026-11-26', art: 'orbit',
    title: 'Conheça a Novexo Inc: a empresa por trás da plataforma e da nossa visão.',
    excerpt: 'Como nasceu a Novexo Inc, os princípios de engenharia e design que guiam nossos produtos e por que construímos software pensado para tirar o peso da rotina.',
    coverLine: ['Novexo Inc.', 'Software sem atrito.'],
    sections: [
      {
        title: 'Por que a Novexo Inc existe',
        text: [
          'A Novexo Inc nasceu de um incômodo real vivido por equipes de produto, engenharia e operações todos os dias: o trabalho moderno foi fragmentado em dezenas de ferramentas lentas, caras e desconectadas. Uma tarefa ficava em um aplicativo, o briefing em outro, a conversa em um terceiro e o acompanhamento de prazos em planilhas improvisadas.',
          'Em vez de aceitar que coordenar um time precisa ser burocrático, fundamos a Novexo Inc com uma missão direta: criar produtos digitais rápidos, elegantes e integrados de ponta a ponta, onde clareza operacional vem de fábrica — do primeiro projeto individual até operações com centenas de pessoas.',
        ],
      },
      {
        title: 'Nossos pilares: velocidade, clareza e autonomia',
        text: [
          'Na Novexo Inc, tratamos performance como respeito ao tempo de quem usa o software. Cada tela, quadro Kanban, busca instantânea e mensagem em tempo real é construída para responder em milissegundos, sem telas de carregamento desnecessárias nem menus labirínticos.',
          'Também acreditamos em inteligência artificial útil de verdade. Em vez de enfeites que atrapalham o fluxo, projetamos a Novexo IA para entender o contexto real dos projetos — resumindo conversas, estruturando listas de tarefas e ajudando equipes a destravarem decisões mantendo total controle humano.',
        ],
      },
      {
        title: 'Um ecossistema feito para crescer com você',
        text: [
          'O Novexo é o carro-chefe da Novexo Inc: uma plataforma unificada que reúne tarefas, quadros, calendário, cronograma Gantt, ciclos, wiki colaborativa, chat por projeto, integrações com WhatsApp e Google Meet, além de API aberta e webhooks para desenvolvedores.',
          'Seguimos evoluindo o ecossistema da Novexo Inc com ciclos curtos de engenharia, ouvindo de perto quem usa a ferramenta todos os dias. Nosso compromisso é manter uma base transparente, segura e acessível, construída no Brasil com padrão global de qualidade.',
        ],
      },
    ],
    cta: {
      title: 'Conheça o ecossistema da Novexo Inc.',
      text: 'Explore nossa história, iniciativas e produtos no portal institucional oficial ou comece gratuitamente no Novexo agora mesmo.',
      href: 'https://official.novexo.cloud',
      label: 'Visitar Novexo Inc',
      external: true,
    },
  },
  {
    slug: 'novexo-ia-na-pratica', tabTitle: 'IA na prática', category: 'Produto', date: '2026-11-24', art: 'focus',
    title: 'Novexo IA na prática: menos trabalho repetitivo, mais foco na decisão.',
    excerpt: 'Veja como usar inteligência artificial dentro das tarefas, documentos e conversas do projeto sem perder o controle das entregas.',
    coverLine: ['IA com contexto.', 'Decisão no comando.'],
    sections: [
      {
        title: 'IA que entende o projeto antes de responder',
        text: [
          'Copiar e colar contexto em chats genéricos fora da ferramenta de trabalho desperdiça tempo e quebra o sigilo operacional. A Novexo IA foi projetada pelo time da Novexo Inc para ler os projetos, tarefas, prazos e documentos do seu workspace apenas quando você autoriza.',
          'Ao mencionar @novexo no chat do projeto ou abrir o assistente dedicado, você pode pedir um resumo do que mudou na semana, identificar tarefas atrasadas ou quebrar uma entrega grande em subtarefas concretas em segundos.',
        ],
      },
      {
        title: 'Do briefing solto ao plano executável',
        text: [
          'Uma das maiores travas no início de um projeto é transformar uma ideia ampla em tarefas claras. Com o modo de estruturação da Novexo IA, você descreve o objetivo — por exemplo, lançar uma nova página comercial — e recebe sugestões de etapas com prioridades e checklists prontos para ajustar.',
          'Nada é publicado no escuro: você revisa, edita responsáveis e aprova cada item antes de levar para o quadro do time.',
        ],
      },
      {
        title: 'Controle total nas mãos do administrador',
        text: [
          'Cada empresa tem políticas próprias sobre uso de IA. Em Ajustes → Produtos → Novexo IA, administradores podem ligar ou desligar o assistente e definir se ele pode consultar dados do workspace.',
          'Tecnologia boa serve ao ritmo da equipe, nunca o contrário.',
        ],
      },
    ],
  },
  {
    slug: 'kanban-sem-gargalos-limites-wip', tabTitle: 'Kanban e WIP', category: 'Guias', date: '2026-11-22', art: 'board',
    title: 'Kanban sem gargalos: como limites de colunas fazem seu time entregar mais.',
    excerpt: 'Começar menos tarefas ao mesmo tempo parece contraintuitivo — até o quadro começar a fluir sem travas nem acumular revisões.',
    coverLine: ['Menos aberto.', 'Mais entregue.'],
    sections: [
      {
        title: 'O custo escondido de ter dez tarefas “em andamento”',
        text: [
          'Quando uma coluna Em andamento acumula quinze cards para um time de quatro pessoas, ninguém está realmente mais produtivo. O que acontece na prática é troca constante de contexto, revisões atrasadas e uma sensação permanente de correria sem entregas fechadas.',
          'No quadro Kanban do Novexo, você pode definir um limite de itens por coluna clicando no menu da própria coluna. Quando o número passa do combinado, o quadro destaca visualmente o excesso antes que o atraso se espalhe.',
        ],
      },
      {
        title: 'Como escolher um bom primeiro limite',
        text: [
          'Uma regra simples para começar: defina o limite da coluna Em andamento como o número de pessoas do time mais um, e o limite de Revisão ainda menor. Isso cria um incentivo saudável para destravar o que está quase pronto antes de puxar algo novo.',
          'Combine o limite com raias agrupadas por prioridade ou responsável para enxergar rapidamente quem precisa de apoio.',
        ],
      },
      {
        title: 'Olhe o quadro da direita para a esquerda',
        text: [
          'Nas revisões rápidas com a equipe, comece pela coluna mais próxima de Concluído. Perguntar “o que falta para fechar o que está em revisão?” acelera muito mais o fluxo do que listar novas demandas na coluna A fazer.',
          'Um quadro saudável tem movimento constante para a direita, não pilhas de boas intenções paradas no meio.',
        ],
      },
    ],
  },
  {
    slug: 'como-rodar-sprints-com-ciclos', tabTitle: 'Sprints e Ciclos', category: 'Engenharia', date: '2026-11-19', art: 'calendar',
    title: 'Como rodar sprints saudáveis com Ciclos e gráfico de burn-down.',
    excerpt: 'Defina um recorte realista para a quinzena, acompanhe o ritmo real da entrega e transforme encerramentos em aprendizado contínuo.',
    coverLine: ['Ritmo claro.', 'Entregas previsíveis.'],
    sections: [
      {
        title: 'Por que trabalhar em janelas curtas funciona',
        text: [
          'Listas infinitas de tarefas desmotivam qualquer equipe. Os Ciclos do Novexo criam uma janela fechada — normalmente de uma ou duas semanas — com objetivo claro, data de início, data de término e um conjunto combinado de entregas.',
          'Quando o time olha para um ciclo focado, fica evidente o que precisa entrar agora e o que pode esperar o próximo recorte sem gerar culpa ou ruído.',
        ],
      },
      {
        title: 'Lendo o gráfico de burn-down sem neurose',
        text: [
          'O burn-down compara o ritmo ideal de conclusão com o avanço real do ciclo. Ele não existe para cobrar horas, mas para dar sinal precoce: se na metade da semana a linha real ainda não desceu, talvez as tarefas estejam grandes demais ou bloqueadas por uma dependência externa.',
          'Ajustar o escopo no quarto dia do ciclo é sinal de maturidade operacional, não de falha.',
        ],
      },
      {
        title: 'Fechando um ciclo e abrindo o próximo em um clique',
        text: [
          'No Novexo, o botão Próximo ciclo aproveita a duração do ciclo anterior e já sugere datas sequenciais. O que ficou pendente continua seguro no projeto, pronto para ser priorizado ou descartado com consciência.',
          'Com o tempo, o histórico de ciclos mostra a capacidade real da equipe — e estimar prazos deixa de ser adivinhação.',
        ],
      },
    ],
  },
  {
    slug: 'arquitetura-em-tempo-real-no-novexo', tabTitle: 'Tempo real', category: 'Engenharia', date: '2026-11-16', art: 'wiki',
    title: 'Por baixo do capô: como tornamos o quadro e o chat instantâneos.',
    excerpt: 'Os bastidores da engenharia da Novexo Inc para eliminar latência no drag-and-drop, otimizar autenticação na borda e sincronizar eventos em tempo real.',
    coverLine: ['Milissegundos', 'importam muito.'],
    sections: [
      {
        title: 'Por que cada 100ms faz diferença na sensação do app',
        text: [
          'Quando você arrasta um card de uma coluna para outra e a interface engasga ou devolve o item para trás por meio segundo, a confiança na ferramenta cai imediatamente. A equipe de engenharia da Novexo Inc trata fluidez de interação como requisito de primeira classe.',
          'Para eliminar travamentos, combinamos atualizações otimistas com controle de versão por tarefa: mesmo que você mova vários cards em sequência rápida, alterações pendentes são mescladas com segurança e respostas antigas da rede nunca sobrescrevem o estado mais recente.',
        ],
      },
      {
        title: 'Verificação criptográfica na borda e trabalho em segundo plano',
        text: [
          'No servidor, substituímos checagens externas repetitivas por validação local de assinatura JWT via Web Crypto com chaves públicas em cache. Também movemos registro de histórico e notificações de seguidores para execução assíncrona fora do caminho crítico da resposta.',
          'O resultado é uma API enxuta, que confirma mudanças de tarefa muito mais rápido enquanto o restante do time recebe atualizações ao vivo via canais Realtime.',
        ],
      },
      {
        title: 'Menos trabalho no navegador a cada quadro',
        text: [
          'No front-end, pré-indexamos contadores de subtarefas, prioridades e ciclos em memória e removemos gravações síncronas pesadas no armazenamento local durante cada edição. Assim, o navegador mantém 60 quadros por segundo mesmo em projetos grandes.',
          'Você pode acompanhar todas essas entregas em detalhes na nossa página de Engenharia e changelog público.',
        ],
      },
    ],
  },
  {
    slug: 'gestao-de-projetos-para-agencias', tabTitle: 'Agências sem caos', category: 'Equipes', date: '2026-11-13', art: 'team',
    title: 'Agências sem caos: gerenciando múltiplos clientes sem perder prazos.',
    excerpt: 'Como separar projetos por cliente, manter briefings acessíveis e equilibrar a carga de trabalho da equipe criativa.',
    coverLine: ['Vários clientes.', 'Um único controle.'],
    sections: [
      {
        title: 'Um projeto por cliente ou campanha, nunca um balaio único',
        text: [
          'Em agências de design, marketing ou software, misturar contas diferentes no mesmo quadro cria confusão de prioridades e risco de vazamento de informações. No Novexo, cada projeto tem permissões próprias, prefixo de identificação, chat dedicado e documentos vinculados.',
          'Assim, você pode convidar clientes ou freelancers apenas para o projeto específico em que colaboram, preservando o restante do workspace.',
        ],
      },
      {
        title: 'Enxergue a carga real antes de aceitar mais um prazo',
        text: [
          'A visão de Painéis e a aba de Pessoas mostram quantos itens abertos e atrasados estão com cada membro do time em todos os projetos simultaneamente. Isso evita sobrecarregar quem já está no limite enquanto outro colega tem margem para ajudar.',
          'Combinar essa leitura com modelos de tarefa reduz pela metade o tempo de abertura de cada novo cliente.',
        ],
      },
      {
        title: 'Aprovações registradas junto da entrega',
        text: [
          'Em vez de caçar aprovações em áudios espalhados, registre links finais, anexos e comentários de revisão diretamente no painel da tarefa. Quando surgir uma dúvida meses depois, o histórico mostra exatamente o que foi combinado e quando.',
        ],
      },
    ],
  },
  {
    slug: 'cronograma-gantt-e-dependencias', tabTitle: 'Cronograma Gantt', category: 'Guias', date: '2026-11-10', art: 'tasks',
    title: 'Gantt sem planilhas quebradas: enxergue dependências antes do atraso.',
    excerpt: 'Quando uma entrega bloqueia outra, ver início, duração e relações na linha do tempo evita surpresas na reta final.',
    coverLine: ['Do início ao fim,', 'sem surpresas.'],
    sections: [
      {
        title: 'Quando a lista não basta para enxergar o caminho crítico',
        text: [
          'Projetos de lançamento, eventos ou desenvolvimento de produto costumam ter tarefas encadeadas: o layout precisa terminar antes da implementação, que precisa terminar antes dos testes. Em uma lista simples, essa ordem fica invisível.',
          'A visualização Gantt do Novexo posiciona automaticamente cada tarefa que tem data de início e prazo em uma linha do tempo interativa, deixando evidente onde há sobreposição ou folga.',
        ],
      },
      {
        title: 'Use relações de bloqueio para proteger entregas sensíveis',
        text: [
          'Dentro do painel da tarefa, adicione relações do tipo “Bloqueia” ou “Bloqueada por”. O Novexo impede que uma tarefa bloqueada seja concluída por engano antes do pré-requisito e avisa automaticamente os responsáveis assim que o bloqueio é liberado.',
          'É uma camada leve de proteção que economiza horas de coordenação manual.',
        ],
      },
      {
        title: 'Mantenha o cronograma vivo em 5 minutos por semana',
        text: [
          'Um Gantt só funciona quando reflete a realidade. Toda semana, ajuste as datas das entregas que mudaram e confira os módulos ativos. Se o cronograma é simples de atualizar, ele vira ferramenta diária de decisão — e não um slide esquecido.',
        ],
      },
    ],
  },
  {
    slug: 'chat-por-projeto-sem-ruido', tabTitle: 'Chat por projeto', category: 'Equipes', date: '2026-11-06', art: 'notes',
    title: 'Chat conectado ao projeto: o fim das decisões perdidas no grupo.',
    excerpt: 'Conversar ao lado do quadro e das tarefas reduz interrupções, mantém o assunto focado e facilita retomar qualquer decisão.',
    coverLine: ['Conversa certa,', 'no lugar certo.'],
    sections: [
      {
        title: 'O problema dos grupos genéricos onde tudo se mistura',
        text: [
          'Quando a mesma janela de chat mistura avisos de almoço, bugs urgentes, dúvidas de design e links de cliente, tudo vira ruído. As pessoas silenciam notificações e informações críticas passam batido.',
          'No Novexo, cada projeto possui seu próprio chat lateral acessível com um clique — além de mensagens diretas para alinhamentos pontuais. Quem entra no projeto vê na hora tanto o quadro quanto o histórico recente das conversas daquela iniciativa.',
        ],
      },
      {
        title: 'Do chat direto para a ação',
        text: [
          'Conversou sobre um ajuste necessário? Transforme a decisão em tarefa no mesmo minuto ou mencione @novexo para resumir os pontos combinados na thread.',
          'Decisões que viram tarefas com dono e prazo param de depender da memória de quem leu a mensagem por último.',
        ],
      },
      {
        title: 'Respeite o tempo de foco do time',
        text: [
          'Com o contexto organizado no projeto, ninguém precisa mandar “oi, tudo bem? tem 5 minutinhos?” só para saber em que pé está uma entrega. O status já responde o básico, e o chat fica livre para o que realmente exige troca humana.',
        ],
      },
    ],
  },
  {
    slug: 'integrando-novexo-com-whatsapp-e-webhooks', tabTitle: 'Integrações', category: 'Produto', date: '2026-11-02', art: 'orbit',
    title: 'WhatsApp, Google Meet e Webhooks: o Novexo conectado à sua rotina.',
    excerpt: 'Receba avisos essenciais no celular, crie reuniões em um clique e integre eventos do workspace aos sistemas da sua empresa.',
    coverLine: ['Tudo conectado,', 'no seu fluxo.'],
    sections: [
      {
        title: 'Alertas importantes direto no WhatsApp',
        text: [
          'Nem todo mundo fica com o navegador aberto o dia inteiro, especialmente times de operações, comercial e liderança em trânsito. Conectando seu número em Ajustes → WhatsApp, você recebe lembretes de prazos, menções e tarefas críticas onde já acompanha mensagens.',
          'Você escolhe quais avisos fazem sentido para não transformar conveniência em excesso de notificações.',
        ],
      },
      {
        title: 'Reuniões rápidas com Google Meet e agenda sincronizada',
        text: [
          'Quando uma tarefa realmente precisa de conversa ao vivo, você pode abrir uma chamada com Google Meet ou enviar o prazo da entrega para o Google Agenda diretamente do painel da tarefa.',
          'Depois da ligação, a ata e os próximos passos ficam registrados na própria tarefa ou documento do projeto.',
        ],
      },
      {
        title: 'API pública e Webhooks para ir além',
        text: [
          'Times técnicos podem gerar tokens de API e cadastrar webhooks em Ajustes → Desenvolvedores para conectar o Novexo a pipelines de deploy, CRMs internos ou painéis analíticos próprios.',
          'A documentação completa está sempre disponível em /docs para sua equipe integrar sem fricção.',
        ],
      },
    ],
  },
  {
    slug: 'seguranca-e-governanca-em-times-que-crescem', tabTitle: 'Governança', category: 'Engenharia', date: '2026-10-29', art: 'wiki',
    title: 'Permissões, auditoria e isolamento: organizando times que crescem rápido.',
    excerpt: 'Como equilibrar autonomia e segurança com acesso granular por projeto, governança de workspace e proteção de dados desde o dia um.',
    coverLine: ['Autonomia com', 'proteção real.'],
    sections: [
      {
        title: 'Segurança que não trava a colaboração',
        text: [
          'À medida que uma equipe cresce de cinco para cinquenta pessoas, deixar todo mundo como administrador total vira um risco desnecessário — basta um clique acidental para arquivar um projeto importante ou expor um documento sensível.',
          'No Novexo, cada pessoa recebe papéis claros tanto no workspace quanto por projeto (visualizar, editar ou gerenciar), garantindo que cada colaborador tenha exatamente o acesso necessário para trabalhar bem.',
        ],
      },
      {
        title: 'Isolamento de dados e políticas de entrada',
        text: [
          'Nossa arquitetura aplica políticas de segurança em nível de linha no banco de dados (RLS), garantindo isolamento rigoroso entre workspaces. Em Ajustes → Identidade e Governança, administradores podem restringir quem cria projetos, quem apaga tarefas e se páginas públicas estão liberadas.',
          'Essas travas simples protegem o negócio sem criar filas de aprovação para tarefas corriqueiras.',
        ],
      },
      {
        title: 'Histórico transparente e recuperação sem pânico',
        text: [
          'Todas as mudanças relevantes em tarefas ficam registradas na aba de Histórico, e projetos, itens ou páginas arquivados podem ser restaurados com facilidade na área de Arquivados.',
          'Segurança madura dá tranquilidade para o time experimentar, entregar e crescer sem medo.',
        ],
      },
    ],
  },
  {
    slug: 'seu-trabalho-em-uma-so-visao', tabTitle: 'Visão do trabalho', category: 'Produto', date: '2026-10-23', art: 'orbit',
    title: 'Seu trabalho merece uma visão mais clara.',
    excerpt: 'Um lugar para enxergar suas tarefas, encontrar prioridades e escolher o próximo passo com mais intenção.',
    coverLine: ['Tudo no seu', 'campo de visão.'],
    sections: [
      { title: 'Comece pelo que está nas suas mãos', text: ['Abrir vários projetos para descobrir o que fazer primeiro transforma uma decisão simples em uma pequena investigação. A área Seu trabalho do Novexo reúne as tarefas atribuídas a você, para que a leitura do dia comece por aquilo que precisa da sua atenção.', 'Antes de iniciar uma nova atividade, percorra essa lista. Observe os prazos, identifique o que já está em andamento e separe o que depende de uma resposta. A intenção é construir uma visão útil da rotina, sem transformar o planejamento em outra entrega.'] },
      { title: 'Uma lista para decidir, um quadro para acompanhar', text: ['A lista ajuda a conferir o conjunto de tarefas e seus detalhes. O quadro muda a perspectiva: as colunas deixam visível o que ainda vai começar, o que está acontecendo e o que já foi concluído.', 'Experimente começar a manhã pela lista e revisar o andamento pelo quadro. O importante é que a visualização responda à pergunta do momento. Se você está procurando o próximo passo, os detalhes importam. Se está revisando o fluxo, o status ganha espaço.'] },
      { title: 'Feche o dia com contexto', text: ['Reserve alguns minutos para atualizar o status do que avançou e registrar na descrição os detalhes que serão úteis amanhã. Uma tarefa em andamento com um próximo passo claro exige menos esforço para ser retomada.', 'Sua organização não precisa prever todas as possibilidades. Ela precisa ajudar você a continuar de onde parou, com uma leitura clara do que está pronto e do que ainda pede atenção.'] },
    ],
  },
  {
    slug: 'planejamento-da-semana', tabTitle: 'Semana organizada', category: 'Produtividade', date: '2026-10-22', art: 'calendar',
    title: 'Uma segunda-feira com menos abas abertas.',
    excerpt: 'Um ritual simples para organizar a semana sem passar a manhã inteira planejando.',
    coverLine: ['Uma semana.', 'Um pouco de direção.'],
    sections: [
      { title: 'Primeiro, veja a semana inteira', text: ['Antes de criar uma nova lista, observe o que já está combinado. Entregas próximas, atividades em andamento e compromissos fixos ocupam espaço na semana. Planejar a partir desse cenário ajuda a definir expectativas mais claras.', 'No calendário do projeto, confira como os prazos estão distribuídos. Quando várias entregas caem no mesmo dia, vale conversar sobre a sequência do trabalho antes que a concentração vire urgência.'] },
      { title: 'Escolha um resultado que faça diferença', text: ['Uma semana pode ter muitas tarefas, mas nem todas precisam ser o centro da atenção. Escolha um resultado importante e identifique as ações necessárias para chegar até ele. Escreva cada ação com um verbo e um resultado reconhecível.', 'Em vez de preencher todos os espaços, deixe margem para revisão e imprevistos. Uma rotina que só funciona quando nada muda costuma exigir mais manutenção do que o próprio trabalho.'] },
      { title: 'Faça uma revisão curta no caminho', text: ['No meio da semana, confira se a direção ainda faz sentido. O objetivo não é recomeçar o planejamento, mas ajustar o que mudou: um prazo, uma dependência ou uma atividade que ficou maior do que parecia.', 'Na sexta, registre o que avançou e o que precisa continuar. Esse pequeno fechamento evita que toda segunda-feira comece com a reconstrução da semana anterior.'] },
    ],
  },
  {
    slug: 'tarefas-que-se-explicam', tabTitle: 'Tarefas claras', category: 'Guias', date: '2026-10-21', art: 'tasks',
    title: 'Como escrever tarefas que se explicam sozinhas.',
    excerpt: 'Título, contexto e critério de entrega: três detalhes que ajudam uma tarefa a sair do papel.',
    coverLine: ['Um bom começo', 'cabe em uma tarefa.'],
    sections: [
      { title: 'Troque o assunto pela ação', text: ['“Página de lançamento” descreve um assunto. “Revisar o texto da página de lançamento” descreve uma ação. A diferença parece pequena, mas muda a forma como a pessoa responsável entende o que precisa fazer.', 'Comece o título com um verbo e identifique o objeto da entrega. Quando duas ações exigem pessoas ou prazos diferentes, considere separá-las. O título deve facilitar a leitura da lista, não carregar todos os detalhes do projeto.'] },
      { title: 'Dê contexto sem escrever um romance', text: ['Na descrição, explique por que a tarefa existe, indique o material de referência e deixe claro o resultado esperado. Um link para o briefing e duas frases objetivas podem ser mais úteis do que um texto longo sem direção.', 'Quando houver várias etapas pequenas, use um checklist. Ele ajuda a acompanhar o caminho sem esconder o objetivo principal. Evite misturar decisões abertas com instruções definitivas: sinalize o que ainda precisa ser combinado.'] },
      { title: 'Combine o que significa estar pronto', text: ['Uma tarefa fica mais fácil de revisar quando a entrega esperada é visível. “Texto revisado, com títulos conferidos e versão final anexada na descrição” oferece uma referência concreta para quem executa e para quem recebe.', 'Antes de começar, confira responsável, prazo e prioridade. Se algum desses pontos depende de uma conversa, resolva a combinação cedo. Clareza no início poupa idas e voltas durante a execução.'] },
    ],
  },
  {
    slug: 'menos-reunioes-mais-contexto', tabTitle: 'Menos reuniões', category: 'Equipes', date: '2026-10-20', art: 'team',
    title: 'Nem toda atualização precisa virar uma reunião.',
    excerpt: 'Como registrar contexto e deixar as conversas do time mais úteis, dentro e fora da agenda.',
    coverLine: ['Mais contexto.', 'Boas conversas.'],
    sections: [
      { title: 'Separe atualização de decisão', text: ['Há conversas que precisam de troca ao vivo: resolver um impasse, explorar uma ideia ou alinhar expectativas delicadas. Outras existem apenas para descobrir em que ponto uma entrega está. Identificar essa diferença ajuda a usar melhor o tempo do time.', 'Uma atualização pode começar pelo registro do status, do próximo passo e de um bloqueio concreto. Quando essas informações estão disponíveis, a conversa pode partir do problema que realmente precisa de atenção.'] },
      { title: 'Deixe um rastro fácil de encontrar', text: ['Registre orientações gerais na wiki e detalhes de execução na descrição da tarefa. O objetivo é que uma pessoa consiga encontrar a informação sem precisar perguntar quem participou da última reunião.', 'Uma decisão útil costuma incluir três pontos: o que foi escolhido, por que essa direção faz sentido e quem cuida da próxima ação. O registro não precisa ser formal, apenas compreensível para quem vai continuar o trabalho.'] },
      { title: 'Use a reunião para construir algo', text: ['Antes de marcar um encontro, escreva a pergunta que precisa ser respondida. Se ela puder ser resolvida com uma atualização objetiva, experimente começar por esse caminho. Se precisar de discussão, compartilhe o contexto antes.', 'No fim da conversa, transforme as decisões em ações visíveis. Uma reunião termina melhor quando todo mundo sabe o que mudou e qual é o próximo passo.'] },
    ],
  },
  {
    slug: 'lista-quadro-ou-calendario', tabTitle: 'Visões de projeto', category: 'Guias', date: '2026-10-19', art: 'board',
    title: 'Lista, quadro ou calendário: qual visão usar agora?',
    excerpt: 'O mesmo projeto pode responder a perguntas diferentes. Encontre a perspectiva certa para cada momento.',
    coverLine: ['O mesmo projeto.', 'Outro olhar.'],
    sections: [
      { title: 'Lista: quando o detalhe faz diferença', text: ['A lista funciona bem para revisar o conjunto de tarefas e comparar informações. É uma boa perspectiva para organizar prioridades, conferir responsáveis e verificar se as ações estão descritas com clareza.', 'Use essa leitura quando a pergunta for “o que precisa ser feito?”. Percorra os títulos, identifique tarefas sem contexto e complete os detalhes antes de iniciar uma nova sequência de trabalho.'] },
      { title: 'Quadro: quando você precisa entender o fluxo', text: ['No quadro, o status ganha destaque. A distribuição das tarefas ajuda a perceber quando há muita coisa começada e pouca coisa chegando à conclusão. O valor está em observar o fluxo.', 'Experimente revisar as colunas com o time e perguntar o que pode avançar. Às vezes, ajudar a concluir uma tarefa em andamento é mais útil do que começar outra.'] },
      { title: 'Calendário: quando o prazo decide', text: ['O calendário coloca os prazos no centro da leitura. Ele ajuda a observar a sequência das entregas e a perceber concentrações que podem passar despercebidas em uma lista.', 'Alterne a visualização conforme a decisão que você precisa tomar. Não é necessário escolher um único formato para sempre: uma boa ferramenta de organização acompanha a pergunta do momento.'] },
    ],
  },
  {
    slug: 'wiki-do-time', tabTitle: 'Wiki do time', category: 'Produto', date: '2026-10-16', art: 'wiki',
    title: 'O conhecimento do time também precisa de uma casa.',
    excerpt: 'Briefings, orientações e decisões: um ponto de partida para criar uma wiki que as pessoas consultam.',
    coverLine: ['O que o time sabe,', 'o time encontra.'],
    sections: [
      { title: 'Comece pelas perguntas que sempre voltam', text: ['Uma wiki útil não precisa nascer completa. Comece pelos assuntos que geram dúvidas recorrentes: onde está o briefing, como preparar uma entrega ou qual orientação deve ser seguida em determinado projeto.', 'A wiki do Novexo oferece um espaço para reunir esse contexto. Escolha um assunto e escreva uma primeira página que ajude alguém a seguir em frente sem depender da memória de outra pessoa.'] },
      { title: 'Organize para quem vai procurar', text: ['Use títulos que descrevam o conteúdo e uma estrutura simples. Uma pessoa que entra no projeto pela primeira vez precisa entender onde começar. Evite nomes internos que só fazem sentido para quem criou o documento.', 'Se uma página ficar longa, separe o essencial das referências. Um resumo no início, seguido por orientações e links, ajuda a transformar informação acumulada em um caminho de leitura.'] },
      { title: 'Cuide do conhecimento durante o trabalho', text: ['Quando uma orientação mudar, atualize o registro próximo da decisão. Quando uma dúvida aparecer várias vezes, considere transformá-la em uma nova página. Assim, a wiki cresce a partir do uso.', 'Não tente documentar tudo. Priorize o conhecimento que ajuda alguém a começar, decidir ou entregar. Uma base pequena e compreensível costuma ser mais útil do que um arquivo enorme que ninguém sabe navegar.'] },
    ],
  },
  {
    slug: 'prioridade-sem-urgencia', tabTitle: 'Prioridades', category: 'Produtividade', date: '2026-10-15', art: 'focus',
    title: 'Se tudo é prioridade, por onde a gente começa?',
    excerpt: 'Um jeito mais simples de conversar sobre importância, prazo e o que pode esperar.',
    coverLine: ['Uma coisa', 'de cada vez.'],
    sections: [
      { title: 'Prazo e prioridade contam histórias diferentes', text: ['O prazo indica quando uma entrega está combinada. A prioridade ajuda a discutir a importância dela em relação ao restante do trabalho. Quando os dois conceitos se misturam, qualquer data próxima pode parecer uma emergência.', 'Antes de marcar uma tarefa como alta prioridade, observe o efeito dela no projeto. Ela libera outra pessoa? Resolve uma dependência? Protege uma entrega importante? Ter uma razão clara torna a escolha mais fácil de explicar.'] },
      { title: 'Compare escolhas concretas', text: ['Em vez de perguntar se uma atividade é importante, compare duas ações. Qual delas precisa avançar primeiro para que o projeto continue? Qual pode esperar sem criar um problema maior?', 'A conversa fica mais objetiva quando o time enxerga o conjunto. Uma lista organizada por projeto e responsável pode revelar que a disputa não é entre tarefas, mas entre compromissos que precisam ser renegociados.'] },
      { title: 'Revise quando o cenário mudar', text: ['Uma decisão do projeto, uma resposta de cliente ou uma mudança de prazo pode alterar a sequência do trabalho. Registrar esse ajuste ajuda o time a continuar alinhado.', 'O objetivo é dar direção suficiente para começar, sem transformar toda escolha em uma discussão longa. Escolha o próximo passo, explique o motivo e reavalie quando houver informação nova.'] },
    ],
  },
  {
    slug: 'do-rascunho-ao-projeto', tabTitle: 'Notas e projetos', category: 'Produto', date: '2026-10-14', art: 'notes',
    title: 'Nem toda ideia chega pronta. Ainda bem.',
    excerpt: 'Use notas e rascunhos para dar espaço ao pensamento antes de transformá-lo em compromisso.',
    coverLine: ['Ideias primeiro.', 'Estrutura depois.'],
    sections: [
      { title: 'Guarde a ideia antes de organizar', text: ['Uma observação durante uma conversa, uma melhoria possível ou uma pergunta que ainda não tem resposta: nem tudo precisa virar uma tarefa imediatamente. Às vezes, o primeiro passo é apenas registrar.', 'As notas do Novexo ajudam a guardar esses pensamentos. Escreva o suficiente para lembrar por que a ideia chamou sua atenção. O registro precisa preservar o contexto, não resolver todas as dúvidas de uma vez.'] },
      { title: 'Dê forma quando houver uma ação', text: ['Quando a ideia começar a apontar para algo concreto, um rascunho de tarefa ajuda a organizar o próximo passo. Pense no resultado esperado, no projeto relacionado e nas informações que ainda faltam.', 'Esse intervalo entre pensar e publicar é útil para evitar listas cheias de compromissos vagos. Uma pergunta aberta pode continuar sendo uma nota até que exista uma ação que alguém consiga executar.'] },
      { title: 'Revise o que ficou pelo caminho', text: ['De tempos em tempos, volte às notas e aos rascunhos. Algumas ideias vão fazer sentido agora, outras podem ser descartadas. Manter tudo indefinidamente também gera ruído.', 'Quando um rascunho estiver pronto, escolha o projeto e publique a tarefa. A passagem da ideia para o trabalho fica mais clara quando existe um objetivo e contexto suficiente para começar.'] },
    ],
  },
  {
    slug: 'briefing-que-ajuda', tabTitle: 'Briefing claro', category: 'Guias', date: '2026-10-13', art: 'wiki',
    title: 'Um briefing que abre caminhos, não mais dúvidas.',
    excerpt: 'O que vale registrar antes de começar um projeto criativo, e o que pode ficar para depois.',
    coverLine: ['Uma boa pergunta.', 'Um bom começo.'],
    sections: [
      { title: 'Explique o problema antes da solução', text: ['Um briefing ganha força quando descreve o que precisa mudar e para quem essa mudança importa. Começar pela solução pode esconder a necessidade e limitar as possibilidades cedo demais.', 'Registre o contexto do projeto em linguagem simples. O que motivou essa iniciativa? Quem vai usar a entrega? Qual resultado indica que o trabalho seguiu na direção certa? Essas perguntas ajudam o time a construir uma leitura comum.'] },
      { title: 'Torne os limites visíveis', text: ['Prazos, formatos e referências são úteis quando deixam claro o espaço de criação. Se existe algo obrigatório, diga por quê. Se uma referência serve apenas para indicar uma sensação, explique qual parte dela importa.', 'Também registre o que ainda está aberto. Uma dúvida identificada no início pode virar uma conversa de alinhamento, em vez de uma surpresa na revisão final.'] },
      { title: 'Conecte o briefing à execução', text: ['Guarde o documento em um lugar que o time consiga encontrar e indique a referência na descrição das tarefas. Assim, o contexto continua perto das ações ao longo do projeto.', 'O briefing pode evoluir. Quando uma decisão mudar o escopo, atualize a orientação e revise as tarefas afetadas. Um documento útil acompanha o trabalho em vez de ficar preso ao dia em que foi escrito.'] },
    ],
  },
  {
    slug: 'rituais-de-time', tabTitle: 'Rituais de time', category: 'Equipes', date: '2026-10-12', art: 'team',
    title: 'Pequenos combinados. Um time mais alinhado.',
    excerpt: 'Rituais simples para dar visibilidade ao trabalho sem lotar a agenda de todo mundo.',
    coverLine: ['Cada pessoa.', 'Uma direção.'],
    sections: [
      { title: 'Combine como o trabalho aparece', text: ['Um time pode usar a mesma ferramenta e ainda entender os status de formas diferentes. Para uma pessoa, “em andamento” significa que começou. Para outra, significa que está esperando revisão. Vale alinhar o significado das etapas.', 'Crie um acordo simples sobre quando atualizar uma tarefa e quais informações devem estar na descrição. O combinado funciona melhor quando ajuda a rotina, sem exigir um manual para cada pequena mudança.'] },
      { title: 'Faça uma revisão que tenha propósito', text: ['Uma revisão de projeto pode começar pelo que está parado e pelo que está perto de ser entregue. Essa perspectiva coloca a conversa nas dependências e nas decisões necessárias, em vez de transformar o encontro em uma leitura de tarefas.', 'Escolha uma frequência que faça sentido para o ritmo do projeto. Trabalhos com entregas curtas podem precisar de ajustes mais frequentes; outras iniciativas ganham com intervalos maiores de execução.'] },
      { title: 'Ajuste os combinados junto com o time', text: ['Observe quais informações continuam sendo perguntadas e quais registros ninguém consulta. Esses sinais ajudam a simplificar o processo. Um ritual que perdeu o propósito pode ser reduzido ou substituído.', 'Alinhamento cresce quando as pessoas entendem por que uma prática existe. Explique o problema que o combinado resolve e abra espaço para mudar o formato quando a rotina pedir.'] },
    ],
  },
  {
    slug: 'checklist-sem-complicar', tabTitle: 'Checklists', category: 'Produtividade', date: '2026-10-09', art: 'tasks',
    title: 'O poder de um checklist que cabe na rotina.',
    excerpt: 'Etapas pequenas para não esquecer o essencial e manter a entrega em movimento.',
    coverLine: ['Pequenos passos.', 'Trabalho em movimento.'],
    sections: [
      { title: 'Use etapas para tirar peso da memória', text: ['Uma entrega pode ser simples e ainda exigir várias verificações. Um checklist ajuda a lembrar do essencial sem precisar reconstruir a sequência toda vez que a tarefa é retomada.', 'Comece pelas etapas que realmente mudam a qualidade da entrega. Revisar o texto, conferir um link e registrar a versão final são ações verificáveis. “Fazer com atenção” é uma boa intenção, mas não descreve algo que possa ser marcado como pronto.'] },
      { title: 'Mantenha o tamanho útil', text: ['Se a lista ficar grande demais, pode ser sinal de que a tarefa reúne entregas diferentes. Separe o que tem responsáveis ou prazos próprios e mantenha o checklist para etapas que pertencem à mesma ação.', 'Escreva cada item de forma curta e objetiva. A pessoa deve conseguir entender o que precisa conferir com uma leitura rápida, sem abrir uma nova investigação a cada linha.'] },
      { title: 'Melhore depois de usar', text: ['A primeira versão do checklist não precisa prever todos os erros possíveis. Depois de algumas entregas, revise o que faltou, o que se repetiu e o que deixou de ser necessário.', 'O melhor checklist é aquele que encontra espaço na rotina. Ele ajuda a manter consistência e libera atenção para as partes do trabalho que exigem julgamento e criatividade.'] },
    ],
  },
  {
    slug: 'fechar-projeto-com-contexto', tabTitle: 'Fechar projetos', category: 'Equipes', date: '2026-10-08', art: 'orbit',
    title: 'Entregou? Guarde também o que você aprendeu.',
    excerpt: 'Um fechamento de projeto que ajuda a próxima ideia a começar um pouco melhor.',
    coverLine: ['Toda entrega', 'deixa um começo.'],
    sections: [
      { title: 'Olhe para o caminho até o resultado', text: ['Depois de uma entrega, é comum começar o próximo projeto antes de entender o que aconteceu no anterior. Uma revisão curta pode preservar aprendizados que, de outra forma, ficam espalhados nas conversas.', 'Escolha perguntas concretas: o que ajudou a avançar, onde houve espera e qual informação chegou tarde? Essas perguntas abrem espaço para observar o processo sem transformar a revisão em uma busca por culpados.'] },
      { title: 'Registre o que pode ser reutilizado', text: ['Uma boa estrutura de briefing, um checklist de revisão ou uma orientação de projeto podem ajudar outras entregas. Guarde esses materiais junto com uma explicação de quando eles fazem sentido.', 'Na wiki, priorize o aprendizado que alguém conseguirá aplicar. Um texto que descreve o problema, a escolha feita e o resultado observado costuma ser mais útil do que uma lista solta de recomendações.'] },
      { title: 'Escolha uma melhoria para levar adiante', text: ['Toda revisão pode gerar muitas ideias, mas tentar mudar tudo de uma vez dificulta perceber o que funcionou. Escolha um ajuste pequeno e teste na próxima oportunidade.', 'Fechar um projeto com contexto é uma forma de cuidar do próximo começo. O trabalho concluído deixa de ser apenas uma entrega e passa a contribuir para a maneira como o time trabalha.'] },
    ],
  },
]

export const postUrl = (post) => `/blog/${post.slug}`
export const formatPostDate = (date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
export const readingMinutes = (post) => Math.max(2, Math.ceil(post.sections.flatMap(section => [section.title, ...section.text]).join(' ').split(/\s+/).length / 200))
export const normalizeSearch = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()

export function filterPosts(category, query) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean)
  return BLOG_POSTS.filter(post => (category === 'Todas' || post.category === category) && words.every(word => normalizeSearch(`${post.title} ${post.excerpt} ${post.category}`).includes(word)))
}
