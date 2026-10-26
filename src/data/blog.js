export const BLOG_CATEGORIES = ['Todas', 'Produto', 'Guias', 'Produtividade', 'Equipes']

export const BLOG_POSTS = [
  {
    slug: 'seu-trabalho-em-uma-so-visao', category: 'Produto', date: '2026-10-23', art: 'orbit',
    title: 'Seu trabalho merece uma visão mais clara.',
    excerpt: 'Um lugar para enxergar suas tarefas, encontrar prioridades e escolher o próximo passo com mais intenção.',
    coverLine: ['Tudo no seu', 'campo de visão.'],
    sections: [
      { title: 'Comece pelo que está nas suas mãos', text: ['Abrir vários projetos para descobrir o que fazer primeiro transforma uma decisão simples em uma pequena investigação. A área Seu trabalho do Novexo reúne as tarefas atribuídas a você, para que a leitura do dia comece por aquilo que precisa da sua atenção.', 'Antes de iniciar uma nova atividade, percorra essa lista. Observe os prazos, identifique o que já está em andamento e separe o que depende de uma resposta. A intenção é construir uma visão útil da rotina, sem transformar o planejamento em outra entrega.'] },
      { title: 'Uma lista para decidir, um quadro para acompanhar', text: ['A lista ajuda a conferir o conjunto de tarefas e seus detalhes. O quadro muda a perspectiva: as colunas deixam visível o que ainda vai começar, o que está acontecendo e o que já foi concluído.', 'Experimente começar a manhã pela lista e revisar o andamento pelo quadro. O importante é que a visualização responda à pergunta do momento. Se você está procurando o próximo passo, os detalhes importam. Se está revisando o fluxo, o status ganha espaço.'] },
      { title: 'Feche o dia com contexto', text: ['Reserve alguns minutos para atualizar o status do que avançou e registrar na descrição os detalhes que serão úteis amanhã. Uma tarefa em andamento com um próximo passo claro exige menos esforço para ser retomada.', 'Sua organização não precisa prever todas as possibilidades. Ela precisa ajudar você a continuar de onde parou, com uma leitura honesta do que está pronto e do que ainda pede atenção.'] },
    ],
  },
  {
    slug: 'planejamento-da-semana', category: 'Produtividade', date: '2026-10-22', art: 'calendar',
    title: 'Uma segunda-feira com menos abas abertas.',
    excerpt: 'Um ritual simples para organizar a semana sem passar a manhã inteira planejando.',
    coverLine: ['Uma semana.', 'Um pouco de direção.'],
    sections: [
      { title: 'Primeiro, veja a semana inteira', text: ['Antes de criar uma nova lista, observe o que já está combinado. Entregas próximas, atividades em andamento e compromissos fixos ocupam espaço real na semana. Planejar a partir desse cenário ajuda a definir expectativas mais claras.', 'No calendário do projeto, confira como os prazos estão distribuídos. Quando várias entregas caem no mesmo dia, vale conversar sobre a sequência do trabalho antes que a concentração vire urgência.'] },
      { title: 'Escolha um resultado que faça diferença', text: ['Uma semana pode ter muitas tarefas, mas nem todas precisam ser o centro da atenção. Escolha um resultado importante e identifique as ações necessárias para chegar até ele. Escreva cada ação com um verbo e um resultado reconhecível.', 'Em vez de preencher todos os espaços, deixe margem para revisão e imprevistos. Uma rotina que só funciona quando nada muda costuma exigir mais manutenção do que o próprio trabalho.'] },
      { title: 'Faça uma revisão curta no caminho', text: ['No meio da semana, confira se a direção ainda faz sentido. O objetivo não é recomeçar o planejamento, mas ajustar o que mudou: um prazo, uma dependência ou uma atividade que ficou maior do que parecia.', 'Na sexta, registre o que avançou e o que precisa continuar. Esse pequeno fechamento evita que toda segunda-feira comece com a reconstrução da semana anterior.'] },
    ],
  },
  {
    slug: 'tarefas-que-se-explicam', category: 'Guias', date: '2026-10-21', art: 'tasks',
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
    slug: 'menos-reunioes-mais-contexto', category: 'Equipes', date: '2026-10-20', art: 'team',
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
    slug: 'lista-quadro-ou-calendario', category: 'Guias', date: '2026-10-19', art: 'board',
    title: 'Lista, quadro ou calendário: qual visão usar agora?',
    excerpt: 'O mesmo projeto pode responder a perguntas diferentes. Encontre a perspectiva certa para cada momento.',
    coverLine: ['O mesmo projeto.', 'Outro olhar.'],
    sections: [
      { title: 'Lista: quando o detalhe faz diferença', text: ['A lista funciona bem para revisar o conjunto de tarefas e comparar informações. É uma boa perspectiva para organizar prioridades, conferir responsáveis e verificar se as ações estão descritas com clareza.', 'Use essa leitura quando a pergunta for “o que precisa ser feito?”. Percorra os títulos, identifique tarefas sem contexto e complete os detalhes antes de iniciar uma nova sequência de trabalho.'] },
      { title: 'Quadro: quando você precisa entender o fluxo', text: ['No quadro, o status ganha destaque. A distribuição das tarefas ajuda a perceber quando há muita coisa começada e pouca coisa chegando à conclusão. O valor está em observar o fluxo, não apenas em mover cartões.', 'Experimente revisar as colunas com o time e perguntar o que pode avançar. Às vezes, ajudar a concluir uma tarefa em andamento é mais útil do que começar outra.'] },
      { title: 'Calendário: quando a conversa é sobre tempo', text: ['O calendário coloca os prazos no centro da leitura. Ele ajuda a observar a sequência das entregas e a perceber concentrações que podem passar despercebidas em uma lista.', 'Alterne a visualização conforme a decisão que você precisa tomar. Não é necessário escolher um único formato para sempre: uma boa ferramenta de organização acompanha a pergunta do momento.'] },
    ],
  },
  {
    slug: 'wiki-do-time', category: 'Produto', date: '2026-10-16', art: 'wiki',
    title: 'O conhecimento do time também precisa de uma casa.',
    excerpt: 'Briefings, orientações e decisões: um ponto de partida para criar uma wiki que as pessoas consultam.',
    coverLine: ['O que o time sabe,', 'o time encontra.'],
    sections: [
      { title: 'Comece pelas perguntas que sempre voltam', text: ['Uma wiki útil não precisa nascer completa. Comece pelos assuntos que geram dúvidas recorrentes: onde está o briefing, como preparar uma entrega ou qual orientação deve ser seguida em determinado projeto.', 'A wiki do Novexo oferece um espaço para reunir esse contexto. Escolha um assunto real e escreva uma primeira página que ajude alguém a seguir em frente sem depender da memória de outra pessoa.'] },
      { title: 'Organize para quem vai procurar', text: ['Use títulos que descrevam o conteúdo e uma estrutura simples. Uma pessoa que entra no projeto pela primeira vez precisa entender onde começar. Evite nomes internos que só fazem sentido para quem criou o documento.', 'Se uma página ficar longa, separe o essencial das referências. Um resumo no início, seguido por orientações e links, ajuda a transformar informação acumulada em um caminho de leitura.'] },
      { title: 'Cuide do conhecimento durante o trabalho', text: ['Quando uma orientação mudar, atualize o registro próximo da decisão. Quando uma dúvida aparecer várias vezes, considere transformá-la em uma nova página. Assim, a wiki cresce a partir do uso real.', 'Não tente documentar tudo. Priorize o conhecimento que ajuda alguém a começar, decidir ou entregar. Uma base pequena e compreensível costuma ser mais útil do que um arquivo enorme que ninguém sabe navegar.'] },
    ],
  },
  {
    slug: 'prioridade-sem-urgencia', category: 'Produtividade', date: '2026-10-15', art: 'focus',
    title: 'Se tudo é prioridade, por onde a gente começa?',
    excerpt: 'Um jeito mais simples de conversar sobre importância, prazo e o que pode esperar.',
    coverLine: ['Uma coisa', 'de cada vez.'],
    sections: [
      { title: 'Prazo e prioridade contam histórias diferentes', text: ['O prazo indica quando uma entrega está combinada. A prioridade ajuda a discutir a importância dela em relação ao restante do trabalho. Quando os dois conceitos se misturam, qualquer data próxima pode parecer uma emergência.', 'Antes de marcar uma tarefa como alta prioridade, observe o efeito dela no projeto. Ela libera outra pessoa? Resolve uma dependência? Protege uma entrega importante? Ter uma razão clara torna a escolha mais fácil de explicar.'] },
      { title: 'Compare escolhas concretas', text: ['Em vez de perguntar se uma atividade é importante, compare duas ações reais. Qual delas precisa avançar primeiro para que o projeto continue? Qual pode esperar sem criar um problema maior?', 'A conversa fica mais objetiva quando o time enxerga o conjunto. Uma lista organizada por projeto e responsável pode revelar que a disputa não é entre tarefas, mas entre compromissos que precisam ser renegociados.'] },
      { title: 'Revise quando o cenário mudar', text: ['Prioridades não são etiquetas definitivas. Uma decisão do projeto, uma resposta de cliente ou uma mudança de prazo pode alterar a sequência do trabalho. Registrar esse ajuste ajuda o time a continuar alinhado.', 'O objetivo é dar direção suficiente para começar, sem transformar toda escolha em uma discussão longa. Escolha o próximo passo, explique o motivo e reavalie quando houver informação nova.'] },
    ],
  },
  {
    slug: 'do-rascunho-ao-projeto', category: 'Produto', date: '2026-10-14', art: 'notes',
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
    slug: 'briefing-que-ajuda', category: 'Guias', date: '2026-10-13', art: 'wiki',
    title: 'Um briefing que abre caminhos, não mais dúvidas.',
    excerpt: 'O que vale registrar antes de começar um projeto criativo — e o que pode ficar para depois.',
    coverLine: ['Uma boa pergunta.', 'Um bom começo.'],
    sections: [
      { title: 'Explique o problema antes da solução', text: ['Um briefing ganha força quando descreve o que precisa mudar e para quem essa mudança importa. Começar pela solução pode esconder a necessidade real e limitar as possibilidades cedo demais.', 'Registre o contexto do projeto em linguagem simples. O que motivou essa iniciativa? Quem vai usar a entrega? Qual resultado indica que o trabalho seguiu na direção certa? Essas perguntas ajudam o time a construir uma leitura comum.'] },
      { title: 'Torne os limites visíveis', text: ['Prazos, formatos e referências são úteis quando deixam claro o espaço de criação. Se existe algo obrigatório, diga por quê. Se uma referência serve apenas para indicar uma sensação, explique qual parte dela importa.', 'Também registre o que ainda está aberto. Uma dúvida identificada no início pode virar uma conversa de alinhamento, em vez de uma surpresa na revisão final.'] },
      { title: 'Conecte o briefing à execução', text: ['Guarde o documento em um lugar que o time consiga encontrar e indique a referência na descrição das tarefas. Assim, o contexto continua perto das ações ao longo do projeto.', 'O briefing pode evoluir. Quando uma decisão mudar o escopo, atualize a orientação e revise as tarefas afetadas. Um documento útil acompanha o trabalho em vez de ficar preso ao dia em que foi escrito.'] },
    ],
  },
  {
    slug: 'rituais-de-time', category: 'Equipes', date: '2026-10-12', art: 'team',
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
    slug: 'checklist-sem-complicar', category: 'Produtividade', date: '2026-10-09', art: 'tasks',
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
    slug: 'fechar-projeto-com-contexto', category: 'Equipes', date: '2026-10-08', art: 'orbit',
    title: 'Entregou? Guarde também o que você aprendeu.',
    excerpt: 'Um fechamento de projeto que ajuda a próxima ideia a começar um pouco melhor.',
    coverLine: ['Toda entrega', 'deixa um começo.'],
    sections: [
      { title: 'Olhe para o caminho, não só para o resultado', text: ['Depois de uma entrega, é comum começar o próximo projeto antes de entender o que aconteceu no anterior. Uma revisão curta pode preservar aprendizados que, de outra forma, ficam espalhados nas conversas.', 'Escolha perguntas concretas: o que ajudou a avançar, onde houve espera e qual informação chegou tarde? Essas perguntas abrem espaço para observar o processo sem transformar a revisão em uma busca por culpados.'] },
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
