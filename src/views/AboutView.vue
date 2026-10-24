<script setup>
// Sobre: a história do projeto (o que foi construído, na ordem) e os princípios que guiam as decisões do produto
import { onMounted, onUnmounted } from 'vue'
import '../assets/landing.css'
import '../assets/infopage.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import { vReveal } from '../utils/motion'

const PRINCIPLES = [
  ['Menos telas, mais trabalho feito', 'Cada recurso precisa tirar um passo da rotina do time. Se só deixa a tela mais cheia, fica de fora.'],
  ['A IA trabalha para você, não no seu lugar', 'A Novexo IA cria e organiza, mas segue as suas permissões e pede confirmação antes de qualquer coisa que não dá para desfazer.'],
  ['Falar onde o time já está', 'Por isso os avisos chegam pelo WhatsApp e o calendário abre no Google Agenda, em vez de pedir mais um aplicativo.'],
  ['Honestidade sobre o que falta', 'As páginas de segurança e status dizem o que ainda não existe. Confiança se constrói com isso.'],
]

const STORY = [
  ['Começo', 'Tarefas, projetos e quadros', 'A base: listas, Kanban, calendário e o menu de projeto com ciclos, módulos, visões e páginas.'],
  ['Depois', 'A Novexo IA', 'Uma IA que cria tarefas, ciclos e páginas falando em português, com os mesmos limites de quem pede.'],
  ['Em seguida', 'Times de verdade', 'Convites por link, quatro níveis de permissão, cargos por pessoa e um chat em cada projeto.'],
  ['Agora', 'Fora da tela', 'Planos com Pix e cartão, avisos de prazo no WhatsApp, GitHub e Google Agenda.'],
]

let previousTitle
onMounted(() => { previousTitle = document.title; document.title = 'Sobre | Novexo' })
onUnmounted(() => { document.title = previousTitle })
</script>

<template>
  <div id="topo" class="lp ip">
    <SiteNav />
    <main class="ip-main">
      <section class="ip-hero" aria-labelledby="about-title">
        <div v-reveal.now>
          <p class="ip-kicker">Sobre o Novexo</p>
          <h1 id="about-title">Feito por um time<br>que também <em>se perdia.</em></h1>
        </div>
        <p v-reveal.now="0.15" class="ip-lead">O Novexo nasceu no <strong>Hackathon 2026</strong>, de um time pequeno cansado de ver o trabalho espalhado entre planilha, grupo de mensagens e post-it. A ideia era simples: um lugar só, que cresce junto com o time.</p>
      </section>

      <section class="ip-section" aria-labelledby="about-story">
        <header><h2 id="about-story">Como chegamos<br><span>até aqui.</span></h2></header>
        <ol v-reveal.stagger class="ip-list">
          <li v-for="([when, title, text]) in STORY" :key="title">
            <span class="ip-num about-when">{{ when }}</span>
            <div><h3>{{ title }}</h3><p>{{ text }}</p></div>
          </li>
        </ol>
      </section>

      <section class="ip-section" aria-labelledby="about-principles">
        <header><h2 id="about-principles">No que<br><span>a gente acredita.</span></h2></header>
        <ol v-reveal.stagger class="ip-list">
          <li v-for="([title, text], i) in PRINCIPLES" :key="title">
            <span class="ip-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div><h3>{{ title }}</h3><p>{{ text }}</p></div>
          </li>
        </ol>
      </section>

      <div v-reveal class="ip-cta">
        <h2>Quer ver como funciona<br><em>na prática?</em></h2>
        <div class="ip-cta__actions">
          <GooeyButton variant="secondary" size="lg" to="/blog/como-funciona">Como funciona</GooeyButton>
          <GooeyButton variant="primary" size="lg" to="/login">Começar grátis</GooeyButton>
        </div>
      </div>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.ip-list > li:has(.about-when) { grid-template-columns: 92px 1fr; }
.about-when { text-transform: uppercase; letter-spacing: .06em; }
</style>
