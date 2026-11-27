<script setup>
import { computed, ref } from 'vue'
import { vTutorialMotion } from '../utils/tutorialMotion'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'

const formatDate = (date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(date))

const activeCategory = ref('Todas')

const sprints = [
  {
    sprint: 'Sprint 14',
    version: 'v2.2',
    category: 'Performance',
    title: 'Kanban instantâneo, JWT local e novos controles Novexo',
    date: '2026-11-26T20:00:00-03:00',
    summary:
      'Refatoração completa de latência no drag-and-drop, autenticação local por JWKS na Edge e padronização de todos os controles de interface.',
    items: [
      'Kanban redesenhado para 60fps: removemos o layout thrashing durante o arrasto, pré-indexamos subtarefas e adicionamos versionamento/coalescing nas mutações para evitar que cards voltem de coluna em movimentos rápidos.',
      'Autenticação JWT ES256 verificada localmente via Web Crypto + JWKS na Edge Function, reduzindo drasticamente a latência de cada chamada da API.',
      'Consultas duplicadas eliminadas em PATCH /api/tasks e gravação de histórico/notificações movida para background assíncrono (EdgeRuntime.waitUntil).',
      'Componentes próprios AppCheckbox e AppSelect padronizados em todo o app e landing, FAQs com abertura suave e nova tela de Ajustes em largura cheia com tópicos destacados.',
    ],
  },
  {
    sprint: 'Sprint 13',
    version: 'v2.1',
    category: 'Novidades',
    title: 'Arquitetura 100% Supabase + Hono Edge Functions e SEO completo',
    date: '2026-11-26T17:30:00-03:00',
    summary:
      'Migração integral do backend legado para PostgreSQL 17, Row Level Security nas 53 tabelas, Realtime nativo e API Hono em TypeScript.',
    items: [
      'API reconstruída em Hono rodando nativamente em Supabase Edge Functions, com 0 alertas no Supabase Security & Performance Advisors.',
      'Chat de projetos e mensagens diretas migrados de WebSocket legado para Supabase Realtime (postgres_changes) com sincronização automática de JWT.',
      'Checkout transparente em produção com Mercado Pago (Pix + Cartão + webhook validado por HMAC-SHA256) e e-mails transacionais autenticados via Brevo.',
      'SEO técnico completo: pré-renderização estática das rotas públicas, robots.txt, sitemap.xml, llms.txt, JSON-LD estruturado e IndexNow.',
    ],
  },
  {
    sprint: 'Sprint 12',
    version: 'v2.0',
    category: 'Novidades',
    title: 'Google Meet integrado e autenticação OAuth dedicada',
    date: '2026-11-12T12:27:48-03:00',
    summary:
      'Criação de salas de reunião com um clique diretamente do chat de projeto e do cabeçalho das tarefas.',
    items: [
      'Botão "Criar sala" com suporte a cliente OAuth próprio para a Google Meet REST API.',
      'Compartilhamento automático do link da reunião no histórico da conversa do projeto.',
      'Proteção anti-robô com Cloudflare Turnstile no cadastro de novas contas e verificação de e-mail obrigatória.',
    ],
  },
  {
    sprint: 'Sprint 11',
    version: 'v1.9',
    category: 'Melhorias',
    title: 'Novexo IA com ações reais no workspace e formulários interativos',
    date: '2026-11-05T18:10:00-03:00',
    summary:
      'A assistente @novexo passou a executar ações estruturadas, criar múltiplos itens e responder dentro do chat do projeto.',
    items: [
      'Menções @novexo no chat lateral com pré-visualização de itens gerados e aprovação em um clique.',
      'Roteamento multi-provedor de IA (Groq, Gemini e OpenRouter) com fallback automático para máxima disponibilidade.',
      'Formulários guiados de perguntas quando a IA precisa esclarecer prazo, responsável ou escopo antes de criar tarefas.',
    ],
  },
  {
    sprint: 'Sprint 10',
    version: 'v1.8',
    category: 'Novidades',
    title: 'Notificações WhatsApp e lembretes horários automáticos',
    date: '2026-10-31T16:40:00-03:00',
    summary:
      'Conexão verificada com WhatsApp para alertas de tarefas atribuídas, prazos próximos e comandos rápidos.',
    items: [
      'Verificação em duas etapas do número de WhatsApp diretamente em Ajustes → Minha conta.',
      'Job agendado de lembretes horários (pg_cron) para avisar automaticamente tarefas que vencem em menos de 24 horas.',
      'Push notifications no navegador e celular via Firebase Cloud Messaging com gerenciamento de dispositivos conectados.',
    ],
  },
  {
    sprint: 'Sprint 9',
    version: 'v1.7',
    category: 'Melhorias',
    title: 'Planos Essencial, Business e Enterprise com checkout transparente',
    date: '2026-10-28T14:20:00-03:00',
    summary:
      'Cobrança por assento mensal ou anual, teste gratuito de 14 dias do Business e recibos integrados em Ajustes.',
    items: [
      'Fluxo de checkout nativo com Pix QR Code (copia e cola) e cartão parcelado com idempotência por tentativa.',
      'Ativação atômica do plano no banco assim que o pagamento é confirmado via webhook.',
      'Construtor de plano Enterprise personalizado para times com demandas específicas de governança.',
    ],
  },
  {
    sprint: 'Sprint 8',
    version: 'v1.6',
    category: 'Novidades',
    title: 'Wiki do time, páginas por projeto e notas rápidas',
    date: '2026-10-25T19:00:00-03:00',
    summary:
      'Documentação colaborativa integrada ao lado das tarefas, com coleções, etiquetas e editor Markdown.',
    items: [
      'Editor Markdown com pré-visualização limpa, suporte a fórmulas KaTeX e atalhos de teclado.',
      'Páginas vinculadas diretamente a cada projeto para manter briefings e decisões próximos da execução.',
      'Dock flutuante de Notas rápidas para capturar rascunhos antes de transformá-los em tarefas formais.',
    ],
  },
  {
    sprint: 'Sprint 7',
    version: 'v1.5',
    category: 'Novidades',
    title: 'Visualizações múltiplas: Gantt, Tabela, Mapa Mental e Painéis',
    date: '2026-10-23T19:56:14-03:00',
    summary:
      'Novo cronograma Gantt, visualizações salvas e fixadas na barra do projeto, cargos por membro e biblioteca de ícones Flaticon.',
    items: [
      'Visão Gantt interativa com barras de início/prazo e visão em Tabela editável para revisões rápidas.',
      'Visões personalizadas com filtros salvos, opções privadas ou compartilhadas e fixação na barra superior.',
      'Cargos customizados por projeto e controle granular de permissões (Admin, Membro, Limitado e Convidado).',
    ],
  },
  {
    sprint: 'Sprint 6',
    version: 'v1.4',
    category: 'Melhorias',
    title: 'Painel completo da tarefa, dependências e checklists avançados',
    date: '2026-10-23T19:15:25-03:00',
    summary:
      'Drawer lateral redesenhado com subtarefas multinível, bloqueadores, reações e histórico auditável.',
    items: [
      'Checklists com modo compartilhado, paralelo ou sequencial e auto-início automático da tarefa ao marcar a primeira etapa.',
      'Relações de bloqueio entre tarefas com detecção de ciclos e aviso automático quando um bloqueador é concluído.',
      'Comentários com reações por emoji, anexos no Storage e nota de conclusão opcional/obrigatória por perfil.',
    ],
  },
  {
    sprint: 'Sprint 5',
    version: 'v1.3',
    category: 'Correções',
    title: 'Estabilização do Kanban, agrupamento por raias e limites WIP',
    date: '2026-10-21T17:30:00-03:00',
    summary:
      'Ajustes de acessibilidade por teclado, colunas recolhíveis por projeto e agrupamento dinâmico.',
    items: [
      'Agrupamento do quadro por Prioridade, Responsável ou Projeto com opção de ocultar colunas vazias.',
      'Limites de itens por coluna (WIP) com alerta visual quando uma etapa excede a capacidade combinada.',
      'Navegação por setas do teclado (esquerda/direita) para avançar ou recuar cards sem tirar a mão do teclado.',
    ],
  },
  {
    sprint: 'Sprint 4',
    version: 'v1.2',
    category: 'Novidades',
    title: 'Ciclos, Módulos e Análises de progresso',
    date: '2026-10-18T15:00:00-03:00',
    summary:
      'Planejamento em ciclos curtos (sprints), agrupamento por módulos de entrega e mapas de calor de atividade.',
    items: [
      'Ciclos com datas de início e fim, taxa de conclusão em tempo real e filtro rápido de tarefas ativas.',
      'Módulos com status próprio (Backlog, Planejado, Em andamento, Pausado, Concluído) para entregas maiores.',
      'Página de Análises com heatmap quinzenal e anual de entregas por membro e por projeto.',
    ],
  },
  {
    sprint: 'Sprint 3',
    version: 'v1.1',
    category: 'Novidades',
    title: 'API pública, Tokens pessoais e Webhooks assinados',
    date: '2026-10-14T11:45:00-03:00',
    summary:
      'Abertura do workspace para automações externas com autenticação por token nvx_ e webhooks HMAC-SHA256.',
    items: [
      'Geração de tokens pessoais com expiração configurável e prefixo identificável em Ajustes → Desenvolvedores.',
      'Webhooks filtráveis por grupo de eventos (tarefas, projetos, comentários e membros) e suporte nativo a Slack/Discord.',
      'Importação e exportação em CSV para migrar planilhas e fazer backup dos projetos a qualquer momento.',
    ],
  },
  {
    sprint: 'Sprint 2',
    version: 'v1.0.5',
    category: 'Melhorias',
    title: 'Convites por link, Caixa de entrada e Paleta de comandos',
    date: '2026-10-10T16:20:00-03:00',
    summary:
      'Colaboração multi-membro completa com convites seguros e navegação rápida via Ctrl K.',
    items: [
      'Paleta de comandos (Ctrl K) para saltar entre projetos, tarefas, documentos e atalhos sem usar o mouse.',
      'Caixa de entrada unificada reunindo menções, atribuições, aprovações e convites de projetos.',
      'Lixeira com restauração de tarefas excluídas e arquivamento seguro de projetos concluídos.',
    ],
  },
  {
    sprint: 'Sprint 1',
    version: 'v1.0',
    category: 'Novidades',
    title: 'Fundação do Novexo: Workspaces, Projetos, Lista e Calendário',
    date: '2026-10-05T10:00:00-03:00',
    summary:
      'Lançamento inicial da plataforma unificando projetos, tarefas, prazos e identidade visual editorial da Novexo Inc.',
    items: [
      'Criação automática de workspace com projeto inicial guiado e checklist de primeiros passos.',
      'Visualizações base em Lista, Kanban e Calendário sincronizadas com tema escuro, claro e cores de destaque.',
      'Arquitetura preparada para escalar do uso individual até equipes multidisciplinares.',
    ],
  },
]

const CATEGORIES = ['Todas', 'Novidades', 'Performance', 'Melhorias', 'Correções']
const filteredSprints = computed(() =>
  activeCategory.value === 'Todas'
    ? sprints
    : sprints.filter((s) => s.category === activeCategory.value),
)
</script>

<template>
  <div id="topo" v-tutorial-motion class="tutorial-page engineering-guide">
    <SiteNav />
    <main class="guide">
      <header class="intro">
        <p class="eyebrow">ENGENHARIA &amp; CHANGELOG</p>
        <h1>Sprints e atualizações<br /><em>do Novexo</em></h1>
        <p>
          Acompanhe cada sprint publicado pelo time de engenharia: novas capacidades, ganhos reais
          de performance, correções e decisões de arquitetura.
        </p>

        <div class="filters" role="tablist" aria-label="Filtrar sprints por categoria">
          <button
            v-for="cat in CATEGORIES"
            :key="cat"
            type="button"
            role="tab"
            class="filter-pill"
            :class="{ active: activeCategory === cat }"
            :aria-selected="activeCategory === cat"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </header>

      <section v-for="entry in filteredSprints" :key="entry.sprint" class="update-entry">
        <div class="entry-meta">
          <span class="sprint-badge">{{ entry.sprint }}</span>
          <span class="version-tag">{{ entry.version }}</span>
          <span class="cat-tag" :data-cat="entry.category">{{ entry.category }}</span>
          <time class="entry-date" :datetime="entry.date">{{ formatDate(entry.date) }}</time>
        </div>

        <h2>{{ entry.title }}</h2>
        <p class="entry-summary">{{ entry.summary }}</p>

        <ul class="entry-list">
          <li v-for="(item, idx) in entry.items" :key="idx">{{ item }}</li>
        </ul>
      </section>

      <div class="guide-end">
        <p>
          Todas as melhorias são liberadas continuamente em produção. Para acompanhar os bastidores
          da empresa e do ecossistema, visite também o
          <RouterLink to="/blog" class="inline-link">Blog do Novexo</RouterLink>.
        </p>
        <GooeyButton to="/inicio" size="lg">
          Abrir o Novexo <FlaticonIcon name="arrow-up-right" :size="14" />
        </GooeyButton>
      </div>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.engineering-guide {
  --lp-orange: #e56515;
  --lp-orange-soft: #fba45c;
  --lp-grey: #919599;
  --lp-grey-light: #cdcdcb;
  --lp-white: #f8f8f8;
  --lp-display: 'Lexend', 'Geist', system-ui, sans-serif;
  --lp-sans: 'Geist', 'Helvetica Neue', system-ui, sans-serif;
  background: #000;
  color: #f8f8f8;
  font-family: var(--lp-sans);
}
:global(html:has(.engineering-guide)),
:global(html:has(.engineering-guide) body) {
  background: #000;
}
h1,
h2,
p,
figure {
  margin: 0;
}
h1,
h2 {
  color: inherit;
}
.guide {
  width: min(1040px, calc(100% - 48px));
  margin: auto;
  padding: 150px 0 70px;
}
.intro {
  max-width: 720px;
  margin-bottom: 52px;
}
.eyebrow {
  color: #fba45c;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  margin-bottom: 16px;
}
h1 {
  font:
    700 clamp(42px, 6vw, 72px)/1.04 'Inter',
    'Geist',
    system-ui,
    sans-serif;
  letter-spacing: -0.05em;
  margin-bottom: 24px;
}
h1 em {
  font:
    italic 400 1.06em/1.05 'Instrument Serif',
    Georgia,
    serif;
  letter-spacing: -0.05em;
}
p {
  color: #bfb5ac;
  line-height: 1.7;
  font-size: 16px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 28px;
}
.filter-pill {
  padding: 7px 14px;
  border: 1px solid #ffffff22;
  border-radius: 999px;
  background: #ffffff08;
  color: #bfb5ac;
  font: 500 13px/1 var(--lp-sans);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.filter-pill:hover {
  border-color: #fba45c66;
  color: #fff;
}
.filter-pill.active {
  border-color: #e56515;
  background: #e56515;
  color: #000;
  font-weight: 600;
}
.update-entry {
  padding: 34px 0;
  border-top: 1px solid #ffffff1f;
}
.entry-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.sprint-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(229 101 21 / 0.16);
  border: 1px solid rgb(229 101 21 / 0.45);
  color: #fba45c;
  font: 600 11.5px/1 'Geist Mono', monospace;
  letter-spacing: 0.04em;
}
.version-tag {
  padding: 4px 9px;
  border-radius: 999px;
  background: #ffffff10;
  color: #d6cec6;
  font: 500 11.5px/1 'Geist Mono', monospace;
}
.cat-tag {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fba45c;
}
.cat-tag[data-cat='Performance'] {
  color: #7fc47a;
}
.cat-tag[data-cat='Correções'] {
  color: #f2c46d;
}
.entry-date {
  margin-left: auto;
  font-size: 13px;
  color: #91867c;
}
h2 {
  font-size: 25px;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.025em;
  margin-bottom: 10px;
}
.entry-summary {
  max-width: 760px;
  color: #d8cfc6;
  margin-bottom: 16px;
}
.entry-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
  color: #a99e94;
  font-size: 14.5px;
  line-height: 1.65;
}
.entry-list li::marker {
  color: #e56515;
}
.inline-link {
  color: #fba45c;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.guide-end {
  border-top: 1px solid #ffffff20;
  margin-top: 32px;
  padding-top: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}
.guide-end p {
  font-size: 14px;
  max-width: 590px;
}
.guide-end > :last-child {
  flex-shrink: 0;
}
@media (max-width: 640px) {
  .guide {
    width: calc(100% - 32px);
    padding-top: 110px;
    padding-bottom: 42px;
  }
  .intro {
    margin-bottom: 36px;
  }
  h2 {
    font-size: 21px;
  }
  p {
    font-size: 15px;
  }
  .entry-date {
    margin-left: 0;
    flex-basis: 100%;
  }
  .guide-end {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
}
</style>
