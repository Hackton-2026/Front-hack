<script setup>
import { onMounted, onUnmounted } from 'vue'
import '../assets/landing.css'
import '../assets/infopage.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import { vReveal } from '../utils/motion'

const CASES = [
  { icon: 'code-branch', title: 'Times de produto e engenharia', to: '/solucoes/engenharia',
    text: 'Planeje em ciclos de duas semanas, agrupe o trabalho em módulos e traga o repositório do GitHub como projeto.',
    tags: ['Ciclos', 'Módulos', 'GitHub', 'Kanban'] },
  { icon: 'briefcase', title: 'Agências e consultorias', to: '/solucoes/agencias',
    text: 'Um projeto por cliente, com convite por link. O cliente entra só para comentar, sem mexer no que não deve.',
    tags: ['Convites', 'Permissões', 'Materiais de apoio'] },
  { icon: 'settings-sliders', title: 'Operações e rotinas', to: '/solucoes/operacoes',
    text: 'Rotinas com prazo e responsável. Um dia antes de vencer, a pessoa recebe o aviso no WhatsApp.',
    tags: ['Prazos', 'WhatsApp', 'Calendário'] },
  { icon: 'graduation-cap', title: 'Escolas e cursos', to: '/solucoes/educacao',
    text: 'Cada turma vira um projeto e cada trabalho, uma tarefa. O conteúdo da disciplina mora na wiki.',
    tags: ['Documentos', 'Projetos', 'Chat do projeto'] },
  { icon: 'palette', title: 'Design e criação', to: '/solucoes/design',
    text: 'Pedidos chegam como tarefas, as revisões ficam nos comentários e o quadro mostra o que está em aprovação.',
    tags: ['Quadros', 'Comentários', 'Visões salvas'] },
  { icon: 'user', title: 'Sua organização pessoal', to: '/produto/tarefas',
    text: 'Notas e favoritos para a sua semana. Peça para a Novexo IA montar a lista do dia.',
    tags: ['Notas', 'Favoritos', 'Novexo IA'] },
]

const DAY = [
  ['09:00', 'Começo do dia', 'Cada pessoa abre o Seu trabalho e vê só o que está com ela, ordenado por prazo.'],
  ['10:30', 'Pedido novo', 'No chat do projeto, alguém escreve “@novexo cria uma tarefa para revisar o contrato amanhã”. A tarefa aparece com responsável e prazo.'],
  ['14:00', 'Revisão', 'O cliente, convidado só para comentar, deixa o retorno direto na tarefa.'],
  ['17:45', 'Fim do dia', '/whatsapp avisa o time que a entrega de amanhã mudou. Quem cadastrou o número recebe no celular.'],
]

let previousTitle
onMounted(() => { previousTitle = document.title; document.title = 'Casos de uso | Novexo' })
onUnmounted(() => { document.title = previousTitle })
</script>

<template>
  <div id="topo" class="lp ip">
    <SiteNav />
    <main class="ip-main">
      <section class="ip-hero" aria-labelledby="cases-title">
        <div v-reveal.now>
          <p class="ip-kicker">Casos de uso</p>
          <h1 id="cases-title">Um jeito de trabalhar<br>para cada <em>time.</em></h1>
        </div>
        <p v-reveal.now="0.15" class="ip-lead">O Novexo não pede que você mude o seu processo. Os mesmos blocos, como tarefas, ciclos, wiki e chat, se encaixam do jeito que o seu time já trabalha.</p>
      </section>

      <section class="ip-section" aria-labelledby="cases-who">
        <header><h2 id="cases-who">Quem usa<br><span>e para quê.</span></h2></header>
        <div v-reveal.stagger class="ip-cards">
          <RouterLink v-for="c in CASES" :key="c.title" :to="c.to" class="ip-card">
            <FlaticonIcon :name="c.icon" framed :size="18" />
            <h3>{{ c.title }}</h3>
            <p>{{ c.text }}</p>
            <ul><li v-for="t in c.tags" :key="t">{{ t }}</li></ul>
          </RouterLink>
        </div>
      </section>

      <section class="ip-section" aria-labelledby="cases-day">
        <header>
          <h2 id="cases-day">Um dia<br><span>com o Novexo.</span></h2>
          <p>Um time de seis pessoas, uma entrega por semana e nenhuma planilha paralela.</p>
        </header>
        <ol v-reveal.stagger class="ip-list">
          <li v-for="[time, title, text] in DAY" :key="time">
            <span class="ip-num">{{ time }}</span>
            <div><h3>{{ title }}</h3><p>{{ text }}</p></div>
          </li>
        </ol>
      </section>

      <div v-reveal class="ip-cta">
        <h2>Seu time não está na lista?<br><em>Conta pra gente.</em></h2>
        <div class="ip-cta__actions">
          <GooeyButton variant="secondary" size="lg" to="/contato">Fale conosco</GooeyButton>
          <GooeyButton variant="primary" size="lg" to="/login">Começar grátis</GooeyButton>
        </div>
      </div>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>
