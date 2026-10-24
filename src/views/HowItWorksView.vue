<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import '../assets/landing.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import WorkflowDemo from '../components/landing/WorkflowDemo.vue'
import StepMotion from '../components/landing/StepMotion.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import sunset from '../assets/landing/footer-sunset.webp'
import { useEditorialMotion } from '../composables/useEditorialMotion'

const pageRoot = ref(null)
useEditorialMotion(pageRoot, { page: 'guide' })

const sections = [
  { id: 'visao-geral', label: 'O trabalho ganha contexto' },
  { id: 'seu-espaco', label: '01. Crie seu espaço' },
  { id: 'do-plano-a-acao', label: '02. Do plano à ação' },
  { id: 'seu-jeito', label: '03. Encontre sua visão' },
  { id: 'time-conectado', label: '04. Mantenha o time conectado' },
  { id: 'primeiros-passos', label: 'Seus primeiros passos' },
  { id: 'perguntas', label: 'Perguntas frequentes' },
]
const faqs = [
  { question: 'Por onde começar no Novexo?', answer: 'Entre na sua conta e abra a área Projetos. Crie um projeto com um objetivo claro e adicione sua primeira tarefa. Depois, defina um responsável, uma prioridade e um prazo para dar contexto ao trabalho.' },
  { question: 'Qual é a diferença entre um projeto e uma tarefa?', answer: 'O projeto reúne o trabalho necessário para alcançar um objetivo, como lançar uma campanha. A tarefa representa uma ação desse projeto, como revisar o texto do anúncio. Dividir a entrega em tarefas ajuda o time a entender o próximo passo.' },
  { question: 'Preciso escolher entre lista, quadro e calendário?', answer: 'Cada visualização ajuda em um momento: a lista facilita revisar detalhes, o quadro mostra o andamento e o calendário organiza os prazos. Você pode mudar a forma de olhar para as tarefas conforme a necessidade.' },
  { question: 'Esta demonstração altera meus projetos?', answer: 'Não. O exemplo deste guia é interativo e ilustrativo. Você pode trocar entre quadro e lista e avançar as tarefas à vontade. Para trabalhar com seus próprios projetos, entre na sua conta.' },
]
const activeSection = ref(sections[0].id)
const progress = ref(0)
const article = ref(null)
let frame = 0
let previousTitle

function updateReading() {
  frame = 0
  if (!article.value) return
  const rect = article.value.getBoundingClientRect()
  const distance = rect.height - innerHeight + 130
  progress.value = Math.max(0, Math.min(100, (130 - rect.top) / Math.max(1, distance) * 100))
  let current = sections[0].id
  for (const section of sections) {
    if (document.getElementById(section.id)?.getBoundingClientRect().top <= 180) current = section.id
  }
  activeSection.value = current
}
function onScroll() { if (!frame) frame = requestAnimationFrame(updateReading) }
onMounted(() => {
  previousTitle = document.title
  document.title = 'Como funciona o Novexo | Blog Novexo'
  updateReading()
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll)
})
onUnmounted(() => {
  document.title = previousTitle
  removeEventListener('scroll', onScroll)
  removeEventListener('resize', onScroll)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div id="topo" class="lp journal">
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <SiteNav />
    <main id="conteudo" ref="pageRoot" class="journal__main">
      <header class="article-head">
        <nav class="breadcrumbs" aria-label="Caminho da página"><RouterLink to="/">Início</RouterLink><span aria-hidden="true">/</span><RouterLink to="/blog">Blog</RouterLink><span aria-hidden="true">/</span><span aria-current="page">Como funciona</span></nav>
        <h1>Como funciona<br><em>o Novexo.</em></h1>
        <p class="article-head__lead">Da primeira ideia à próxima entrega: descubra como organizar seus projetos, conectar seu time e fazer o trabalho fluir com o Novexo.</p>
        <div class="article-head__byline"><span class="author-mark" aria-hidden="true">N</span><div><strong>Equipe Novexo</strong></div></div>
      </header>

      <figure class="article-cover">
        <img :src="sunset" alt="" class="article-cover__photo" fetchpriority="high" />
        <div class="article-cover__shade" />
        <div class="article-cover__words"><p>Projetos, tarefas e wiki do time em um só lugar.</p></div>
        <div class="article-cover__demo"><WorkflowDemo /></div>
      </figure>

      <div class="reading-layout">
        <aside class="reading-sidebar" aria-label="Navegação do artigo">
          <div class="reading-sidebar__sticky">
            <span class="toc-title">Neste guia</span>
            <nav aria-label="Índice do guia"><a v-for="section in sections" :key="section.id" :href="`#${section.id}`" :class="{ 'is-active': activeSection === section.id }" :aria-current="activeSection === section.id ? 'location' : undefined">{{ section.label }}</a></nav>
            <div class="reading-progress" role="progressbar" :aria-valuenow="Math.round(progress)" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso da leitura"><span :style="{ width: `${progress}%` }" /></div>
            <RouterLink to="/login" class="sidebar-cta">Seu próximo projeto<br>começa aqui. <span aria-hidden="true"><FlaticonIcon name="arrow-up-right" /></span></RouterLink>
          </div>
        </aside>

        <article ref="article" class="article-body" aria-label="Como funciona o Novexo">
          <section id="visao-geral" class="article-section intro-section">
            <h2>O trabalho fica mais leve<br>quando tudo faz sentido.</h2>
            <p>Uma ideia no chat, um prazo na planilha, uma decisão que se perdeu na reunião. Quando o trabalho está espalhado, até o próximo passo parece complicado.</p>
            <p>O Novexo reúne projetos, tarefas e conhecimento em um mesmo espaço. Assim, você consegue entender <strong>o que precisa ser feito, quem está cuidando e o que vem depois.</strong></p>
            <blockquote>Menos tempo procurando contexto.<br>Mais tempo construindo o que importa.</blockquote>
            <div class="overview-path" aria-label="Fluxo de organização"><span><small>01</small> Seu espaço</span><b aria-hidden="true"><FlaticonIcon name="arrow-small-right" /></b><span><small>02</small> Seu projeto</span><b aria-hidden="true"><FlaticonIcon name="arrow-small-right" /></b><span><small>03</small> Sua entrega</span></div>
          </section>

          <section id="seu-espaco" class="article-section">
            <span class="step-label">01</span>
            <h2>Dê um espaço às suas ideias.</h2>
            <p>Comece por um projeto: ele é o ponto de encontro entre o objetivo e as pessoas que vão fazê-lo acontecer. Pode ser uma campanha, uma nova versão do produto ou a organização da semana.</p>
            <p>Escolha um nome que o time reconheça e descreva a entrega esperada. Um projeto com contexto ajuda cada pessoa a entender como sua parte se conecta ao todo.</p>
            <StepMotion kind="project" />
            <div class="project-example"><div class="project-example__icon" aria-hidden="true"><FlaticonIcon name="folder" :size="20" /></div><div><h3>Lançamento da marca</h3><p>Organizar o briefing, criar a identidade e preparar a apresentação.</p></div><span class="project-example__badge">Planejamento</span></div>
            <p class="editor-note"> Comece pequeno. Um projeto real é melhor que uma estrutura perfeita sem nenhuma tarefa.</p>
          </section>

          <section id="do-plano-a-acao" class="article-section">
            <span class="step-label">02</span>
            <h2>Transforme planos em ações.</h2>
            <p>Divida o projeto em tarefas que descrevam ações concretas. “Revisar o texto da página” é um ponto de partida mais claro do que apenas “Página”.</p>
            <p>Adicione um responsável, defina a prioridade e combine um prazo. Quando uma entrega tiver várias partes, use o checklist da tarefa para organizar as etapas.</p>
            <StepMotion kind="checklist" />
            <div class="task-anatomy"><div class="task-anatomy__title"><span aria-hidden="true"><FlaticonIcon name="circle" /></span><h3>Revisar o texto da página</h3></div><p>Conferir os títulos, ajustar a mensagem principal e enviar a versão para revisão do time.</p><dl><div><dt>Responsável</dt><dd><span class="person-dot">AM</span> Ana Martins</dd></div><div><dt>Prioridade</dt><dd><span class="priority-dot" /> Alta</dd></div><div><dt>Prazo</dt><dd>Sexta-feira</dd></div></dl><span class="example-caption">Tarefa ilustrativa.</span></div>
          </section>

          <section id="seu-jeito" class="article-section">
            <span class="step-label">03</span>
            <h2>Encontre sua forma de ver.</h2>
            <p>Nem todo momento pede a mesma perspectiva. Para revisar os detalhes, uma lista. Para entender o fluxo, um quadro. Para visualizar os prazos, o calendário.</p>
            <div class="view-comparison"><div><FlaticonIcon name="list" framed :size="22" /><h3>Lista</h3><p>Os detalhes de cada tarefa, lado a lado.</p></div><div><FlaticonIcon name="layout-fluid" framed :size="22" /><h3>Quadro</h3><p>O que está a fazer, em andamento ou concluído.</p></div><div><FlaticonIcon name="calendar" framed :size="22" /><h3>Calendário</h3><p>As entregas distribuídas ao longo dos dias.</p></div></div>
            <h3 class="try-heading">Experimente</h3>
            <p>Alterne entre quadro e lista no exemplo abaixo. Clique em uma tarefa para avançar seu status e veja o projeto mudar de perspectiva.</p>
            <WorkflowDemo />
          </section>

          <section id="time-conectado" class="article-section">
            <span class="step-label">04</span>
            <h2>Conecte o que você sabe<br>ao que precisa fazer.</h2>
            <p>Uma boa organização também cuida do conhecimento. Use a wiki para reunir as orientações do projeto e as notas para registrar ideias que ainda estão tomando forma.</p>
            <p>Ao preparar uma entrega, registre os detalhes e os links de referência na descrição da tarefa. O contexto fica mais fácil de encontrar para quem já está no projeto e para quem chega depois.</p>
            <StepMotion kind="wiki" />
            <div class="context-note"><FlaticonIcon name="document" framed :size="18" /><div><h3>Crie uma fonte de contexto.</h3><p>Reúna o objetivo, o briefing e os critérios de entrega em uma página da wiki. Nas tarefas, indique o que consultar antes de começar.</p></div></div>
          </section>

          <section id="primeiros-passos" class="article-section">
            <h2>Seu primeiro projeto<br>começa com um passo.</h2>
            <p>Você não precisa organizar tudo de uma vez. Use esta sequência para tirar uma ideia do papel e evolua a estrutura junto com o time.</p>
            <ol class="starting-list"><li><span>01</span><div><strong>Entre no seu espaço</strong><p>Acesse sua conta e abra a área de projetos.</p></div></li><li><span>02</span><div><strong>Crie um projeto com um objetivo claro</strong><p>Dê um nome e descreva o resultado que você quer alcançar.</p></div></li><li><span>03</span><div><strong>Adicione a primeira tarefa</strong><p>Defina a ação, o responsável e o próximo prazo.</p></div></li></ol>
            <GooeyButton to="/login" variant="primary" size="lg">Começar no Novexo <span aria-hidden="true"><FlaticonIcon name="arrow-up-right" /></span></GooeyButton>
          </section>

          <section id="perguntas" class="article-section faq-section">
            <h2>Ficou alguma dúvida?</h2>
            <details v-for="faq in faqs" :key="faq.question"><summary>{{ faq.question }}<span class="faq-plus" aria-hidden="true"><FlaticonIcon name="plus" :size="17" /></span></summary><p>{{ faq.answer }}</p></details>
          </section>
        </article>
      </div>

      <section class="explore-section" aria-labelledby="explore-title"><div class="explore-section__head"><div><h2 id="explore-title">Da leitura à prática.</h2></div><RouterLink to="/">Conheça o Novexo <span aria-hidden="true"><FlaticonIcon name="arrow-up-right" /></span></RouterLink></div><div class="explore-grid"><a href="#do-plano-a-acao" class="explore-card"><div class="explore-card__art art-tasks" aria-hidden="true"><span><FlaticonIcon name="circle" /> Definir o próximo passo</span><span><FlaticonIcon name="circle" /> Dar contexto à entrega</span><span><FlaticonIcon name="check" /> Fazer acontecer</span></div><h3>Uma tarefa clara muda<br>o jeito de começar. <span><FlaticonIcon name="arrow-up-right" /></span></h3></a><a href="#seu-jeito" class="explore-card"><div class="explore-card__art art-views" aria-hidden="true"><span /><span /><span /></div><h3>Encontre a perspectiva<br>que faz o trabalho fluir. <span><FlaticonIcon name="arrow-up-right" /></span></h3></a></div></section>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.journal { --article-muted: #aaa8a4; --article-line: #ffffff26; }
.journal :is(a, button, summary):focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 5px; }
.skip-link { position: fixed; top: 12px; left: 20px; z-index: 100; padding: 12px 20px; background: var(--lp-white); color: #000; transform: translateY(-160%); }.skip-link:focus { transform: none; }
.journal__main { max-width: 1320px; padding: 142px 48px 0; margin: auto; }.breadcrumbs { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; color: #a4a19d; font-size: 12px; }.breadcrumbs a { color: inherit; text-decoration: none; }.breadcrumbs a:hover { color: var(--lp-orange-soft); }.breadcrumbs > span:last-child { color: #e0deda; }.breadcrumbs > span[aria-hidden] { color: #625e59; }
.article-head { max-width: 990px; }
.article-head h1 { margin: 25px 0; font: 600 clamp(48px, 6.4vw, 84px)/1.06 var(--lp-hero); letter-spacing: -.065em; color: var(--lp-white); }.article-head h1 em { font-family: var(--font-serif); font-weight: 400; letter-spacing: -.035em; color: var(--lp-orange-soft); }.article-head__lead { max-width: 670px; margin: 0; color: #b7b3af; font-size: clamp(15px, 1.5vw, 18px); line-height: 1.75; }
.article-head__byline { display: flex; align-items: center; gap: 12px; margin: 30px 0 42px; font-size: 11px; }.author-mark { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: 1px solid #ffffff26; border-radius: 50%; font: 800 17px var(--lp-display); }.article-head__byline strong { font-weight: 500; font-size: 12px; }
.article-cover { position: relative; isolation: isolate; display: grid; grid-template-columns: .85fr 1.3fr; align-items: center; gap: 25px; min-height: 490px; margin: 0; padding: 52px 45px 75px; border: 1px solid #ffffff24; border-radius: 12px; overflow: hidden; background: #492516; }.article-cover__photo, .article-cover__shade { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: center 60%; }.article-cover__shade { z-index: -1; background: linear-gradient(90deg, #180b04cc, #6c2c0d55), linear-gradient(0deg, #140c08ee, transparent 50%); }.article-cover__words > p { margin: 0; font: 600 clamp(28px, 3vw, 42px)/1.1 var(--lp-hero); letter-spacing: -.05em; color: #fff; }.article-cover__demo { transform: perspective(1500px) rotateY(-5deg) rotateZ(1deg); min-width: 0; }
.reading-layout { display: grid; grid-template-columns: 245px minmax(0, 720px); justify-content: space-between; gap: 60px; margin: 85px 0 100px; }.reading-sidebar__sticky { position: sticky; top: 125px; }.toc-title { color: #e5e1dc; font-size: 12px; }.reading-sidebar nav { display: flex; flex-direction: column; margin-top: 20px; border-left: 1px solid #ffffff24; }.reading-sidebar nav a { display: block; padding: 10px 0 10px 17px; margin-left: -1px; border-left: 2px solid transparent; font-size: 12px; text-decoration: none; color: #a6a29d; transition: color .2s, border-color .2s; }.reading-sidebar nav a:hover, .reading-sidebar nav a.is-active { color: var(--lp-orange-soft); }.reading-sidebar nav a.is-active { border-color: var(--lp-orange); }.reading-progress { height: 2px; margin-top: 27px; overflow: hidden; background: #ffffff1a; }.reading-progress > span { display: block; height: 100%; background: var(--lp-orange); }.sidebar-cta { display: block; position: relative; margin-top: 32px; border-top: 1px solid var(--article-line); padding-top: 24px; font-size: 16px; line-height: 1.4; letter-spacing: -.02em; color: #f8f8f8; text-decoration: none; }.sidebar-cta > span { position: absolute; right: 0; bottom: 4px; font-size: 22px; color: var(--lp-orange-soft); }
.article-body { min-width: 0; }.article-section { padding: 52px 0; border-bottom: 1px solid var(--article-line); scroll-margin-top: 125px; }.article-section:first-child { padding-top: 0; }.article-section h2 { color: #f3f1ee; margin: 19px 0 23px; font: 500 clamp(27px, 3vw, 36px)/1.18 var(--lp-hero); letter-spacing: -.045em; text-wrap: balance; }.article-section p { color: #b6b2ac; font-size: 15px; line-height: 1.85; margin: 0 0 18px; }.article-section p strong { color: #e7e3df; font-weight: 500; }.article-section > p:last-child { margin-bottom: 0; }.article-section blockquote { margin: 34px 0; padding: 7px 0 7px 23px; border-left: 2px solid var(--lp-orange); font-size: 22px; letter-spacing: -.03em; line-height: 1.45; color: #f3f1ee; }.overview-path { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 35px; padding: 22px 0 0; border-top: 1px solid #ffffff1c; font-size: 12px; }.overview-path small { display: block; margin-bottom: 6px; color: var(--lp-orange-soft); font: 11px var(--font-mono); }.overview-path b { color: #77716b; font-size: 17px; font-weight: 400; }
.step-label { display: inline-flex; align-items: center; gap: 15px; color: var(--lp-orange-soft); font: 11px var(--font-mono); }.project-example { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin: 28px 0; padding: 24px; border: 1px solid #ffffff26; border-radius: 8px; background: #111110; }.project-example__icon { display: grid; place-items: center; width: 42px; height: 42px; border: 1px solid #e5651555; border-radius: 10px; color: var(--lp-orange-soft); background: #e5651512; font-size: 24px; }.project-example > div:nth-child(2) { flex: 1; min-width: 160px; }.project-example h3 { margin: 0 0 8px; color: #f2efeb; font-size: 16px; font-weight: 500; }.project-example p { margin: 0; font-size: 11px; line-height: 1.6; }.project-example__badge { border: 1px solid #e5651533; border-radius: 4px; padding: 4px 8px; color: var(--lp-orange-soft); font-size: 11px; }.article-section .editor-note { display: flex; gap: 10px; color: #a8a19a; font-size: 12px; }
.task-anatomy { padding: 28px; margin-top: 28px; border: 1px solid #ffffff26; border-radius: 8px; background: #111110; }.task-anatomy__title { display: flex; gap: 10px; align-items: center; }.task-anatomy__title > span { color: var(--lp-orange-soft); font-size: 21px; }.task-anatomy h3 { color: #f5f2ee; font-size: 17px; font-weight: 500; margin: 0; letter-spacing: -.02em; }.task-anatomy > p { margin: 15px 0 25px; font-size: 12px; }.task-anatomy dl { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 12px; padding-block: 20px; margin: 0; border-top: 1px solid #ffffff19; }.task-anatomy dt { color: #a7a19a; font-size: 11px; margin-bottom: 12px; }.task-anatomy dd { display: flex; align-items: center; gap: 7px; margin: 0; color: #e5e0d9; font-size: 11px; min-height: 24px; }.person-dot { display: grid; place-items: center; width: 22px; height: 22px; background: #353e34; color: #c8d5c9; border-radius: 50%; font-size: 11px; }.priority-dot { width: 6px; height: 6px; background: var(--lp-orange); border-radius: 50%; }.example-caption { display: block; font-size: 11px; color: #a7a19a; }
.view-comparison { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; padding: 26px 0 30px; }.view-comparison > div { padding-top: 18px; border-top: 1px solid #ffffff33; }.view-comparison span { color: var(--lp-orange-soft); font-size: 26px; }.view-comparison h3 { margin: 15px 0 8px; color: #f3efea; font-size: 15px; font-weight: 500; }.view-comparison p { font-size: 12px; line-height: 1.7; }.try-heading { color: #e8e3dc; font-size: 17px; font-weight: 500; margin: 12px 0; }.context-note { display: flex; gap: 16px; margin-top: 30px; padding: 24px; border: 1px solid #e5651538; border-radius: 6px; background: #e565150c; }.context-note > span { color: var(--lp-orange-soft); font-size: 27px; }.context-note h3 { color: #eadbd0; margin: 0 0 10px; font-size: 15px; font-weight: 500; }.context-note p { font-size: 13px; margin: 0; }
.starting-list { margin: 28px 0 32px; padding: 0; list-style: none; }.starting-list li { display: flex; align-items: baseline; gap: 20px; padding: 16px 0; border-bottom: 1px solid #ffffff19; }.starting-list li > span { color: var(--lp-orange-soft); font: 11px var(--font-mono); }.starting-list strong { color: #ece7e0; font-size: 14px; font-weight: 500; }.starting-list p { margin: 5px 0 0; font-size: 12px; }.faq-section details { border-bottom: 1px solid #ffffff26; }.faq-section details:last-child { border-bottom: 0; }.faq-section summary { display: flex; justify-content: space-between; align-items: center; gap: 25px; padding: 21px 0; list-style: none; cursor: pointer; font-size: 14px; color: #e3ddd5; }.faq-section summary::-webkit-details-marker { display: none; }.faq-plus { color: var(--lp-orange-soft); font-size: 25px; font-weight: 400; transition: transform .2s; }.faq-section details[open] .faq-plus { transform: rotate(45deg); }.faq-section details p { margin: 0 35px 25px 0; font-size: 13px; }
.explore-section { padding: 50px 0 90px; border-top: 1px solid var(--article-line); }.explore-section__head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 35px; }.explore-section h2 { margin: 14px 0 0; color: #f4f0eb; font: 500 clamp(30px, 3.2vw, 43px)/1.1 var(--lp-hero); letter-spacing: -.04em; }.explore-section__head > a { color: #d2cbc3; font-size: 12px; text-decoration: none; }.explore-section__head > a > span { margin-left: 12px; color: var(--lp-orange-soft); }.explore-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }.explore-card { display: block; text-decoration: none; }.explore-card__art { position: relative; display: flex; align-items: center; justify-content: center; height: 225px; margin-bottom: 22px; padding: 30px; border: 1px solid #ffffff26; border-radius: 8px; overflow: hidden; transition: border-color .2s; }.explore-card:hover .explore-card__art { border-color: var(--lp-orange); }.explore-card h3 { display: block; position: relative; margin-top: 0; color: #eee8e0; font-size: clamp(17px, 1.8vw, 23px); font-weight: 500; line-height: 1.3; letter-spacing: -.03em; }.explore-card h3 > span { position: absolute; right: 4px; top: 0; color: var(--lp-orange-soft); }.art-tasks { flex-direction: column; gap: 9px; background: #1a130e; }.art-tasks > span { display: block; width: 75%; padding: 10px 14px; border: 1px solid #ffffff1c; background: #201c18; border-radius: 5px; color: #d1c5b8; font-size: 12px; transform: rotate(-5deg); }.art-tasks > span:last-child { color: var(--lp-orange-soft); border-color: #e5651544; transform: rotate(-5deg) translateX(12px); }.art-views { gap: 13px; background: #c66329; }.art-views > span { position: absolute; bottom: -35px; width: 25%; height: 80%; border: 1px solid #ffffff50; border-radius: 50px 50px 0 0; background: #ffffff13; transform: rotate(25deg); }.art-views > span:first-child { left: 10%; height: 60%; }.art-views > span:nth-child(2) { left: 38%; }.art-views > span:nth-child(3) { left: 66%; height: 100%; }
@media (min-width: 1600px) { .journal__main { max-width: 1400px; }.reading-layout { grid-template-columns: 260px minmax(0, 760px); } }
@media (max-width: 1050px) { .journal__main { padding: 110px 30px 0; }.article-cover { padding: 36px 25px 65px; min-height: 420px; gap: 20px; grid-template-columns: .65fr 1.3fr; }.article-cover__words > p { font-size: 29px; }.reading-layout { grid-template-columns: 190px minmax(0, 1fr); gap: 40px; }.reading-sidebar nav a { font-size: 11px; padding-left: 12px; }.project-example__badge { display: none; } }
@media (max-width: 760px) { .journal__main { padding: 95px 20px 0; }.article-head h1 { font-size: clamp(44px, 9vw, 65px); }.article-head__lead { font-size: 15px; }.article-cover { grid-template-columns: 1fr; padding: 30px 22px 65px; gap: 30px; }.article-cover__words > p { font-size: 32px; }.article-cover__demo { transform: none; }.reading-layout { grid-template-columns: 1fr; gap: 35px; margin: 45px 0 65px; }.reading-sidebar__sticky { position: static; }.reading-sidebar nav { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 14px; margin-top: 12px; }.reading-sidebar nav a { padding: 8px 0 8px 13px; font-size: 11px; }.reading-progress, .sidebar-cta { display: none; }.article-section { padding: 40px 0; scroll-margin-top: 85px; }.article-section h2 { font-size: 29px; }.article-section p { font-size: 14px; }.article-section blockquote { font-size: 19px; padding-left: 18px; }.explore-section { padding: 35px 0 55px; }.explore-section__head { align-items: flex-start; flex-direction: column; gap: 20px; }.explore-grid { gap: 24px; }.explore-card__art { height: 180px; padding: 15px; }.art-tasks > span { width: 100%; font-size: 11px; padding: 8px; }.view-comparison { gap: 15px; }.view-comparison p { font-size: 11px; } }
@media (max-width: 440px) { .journal__main { padding-inline: 16px; }.article-head h1 { font-size: 46px; }.article-cover { padding-inline: 10px; }.article-cover__words { padding-inline: 12px; }.article-cover__words > p { font-size: 28px; }.reading-sidebar nav { column-gap: 10px; }.task-anatomy { padding: 20px; }.task-anatomy dl { grid-template-columns: 1fr 1fr; row-gap: 18px; }.task-anatomy h3 { font-size: 15px; }.overview-path { font-size: 11px; }.view-comparison { gap: 12px; }.view-comparison h3 { font-size: 13px; }.explore-grid { grid-template-columns: 1fr; }.explore-card__art { height: 205px; }.art-tasks > span { width: 70%; font-size: 12px; } }
</style>
