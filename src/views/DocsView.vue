<script setup>
// Documentação da API pública (a mesma que o app usa). Exemplos e rotas conferidos no Back-hack: urls.py de cada app.
import { onMounted, onUnmounted } from 'vue'
import '../assets/landing.css'
import '../assets/infopage.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import FlaticonIcon from '../components/FlaticonIcon.vue'
import { API_URL } from '../config'
import { vReveal } from '../utils/motion'

const BASE = `${API_URL || window.location.origin}/api` // sem VITE_API_URL a API está no mesmo endereço do site

const TOC = [['comecar', 'Começar'], ['autenticacao', 'Autenticação'], ['referencia', 'Referência'], ['limites', 'Limites e erros'], ['webhooks', 'Webhooks']]

const ENDPOINTS = [
  ['GET', '/projects/', 'Projetos que você pode ver.'],
  ['POST', '/projects/', 'Cria um projeto: name, color, icon, description.'],
  ['GET', '/tasks/?project=ID', 'Tarefas, com filtro opcional por projeto.'],
  ['POST', '/tasks/', 'Cria uma tarefa: project, title, description, status, priority, assignees, due.'],
  ['PATCH', '/tasks/ID/', 'Muda só os campos enviados.'],
  ['POST', '/tasks/ID/comments/', 'Comenta numa tarefa.'],
  ['GET', '/cycles/ · /modules/', 'Ciclos (start_date, end_date) e módulos (state, lead, due_date).'],
  ['GET', '/pages/', 'Páginas da wiki dos projetos.'],
  ['GET', '/inbox/', 'Suas notificações.'],
  ['POST', '/ai/chat/', 'Fala com a Novexo IA: messages [{role, content}]. Ela age com as suas permissões.'],
]

const LIMITS = [
  ['Novexo IA', '20 pedidos por minuto'],
  ['Checkout', '10 pedidos por minuto'],
  ['Código do WhatsApp', '5 pedidos por minuto'],
]

let previousTitle
onMounted(() => { previousTitle = document.title; document.title = 'Documentação | Novexo' })
onUnmounted(() => { document.title = previousTitle })
</script>

<template>
  <div id="topo" class="lp ip">
    <SiteNav />
    <main class="ip-main">
      <section class="ip-hero" aria-labelledby="docs-title">
        <div v-reveal.now>
          <p class="ip-kicker">Desenvolvedores</p>
          <h1 id="docs-title">Leve o Novexo<br>para o seu <em>código.</em></h1>
        </div>
        <div v-reveal.now="0.15">
          <p class="ip-lead">A API é a mesma que o app usa: <strong>REST, JSON e as mesmas permissões</strong> que você tem na tela.</p>
          <nav class="docs-toc" aria-label="Nesta página">
            <a v-for="([id, label], i) in TOC" :key="id" :href="`#${id}`"><span class="ip-num">{{ String(i + 1).padStart(2, '0') }}</span>{{ label }}</a>
          </nav>
        </div>
      </section>

      <section id="comecar" class="ip-section docs-anchor" aria-labelledby="docs-start">
        <header><h2 id="docs-start">Começar<br><span>em dois minutos.</span></h2>
          <p>Gere um token em Ajustes › Tokens de API e faça o primeiro pedido.</p></header>
        <div v-reveal>
          <p class="docs-p">Todas as rotas ficam em <code>{{ BASE }}</code>. Envie e receba JSON.</p>
          <pre class="ip-code"><span class="c"># lista os seus projetos</span>
curl {{ BASE }}/projects/ \
  -H <span class="k">"Authorization: Token nvx_seu_token"</span></pre>
          <pre class="ip-code"><span class="c"># cria uma tarefa com prazo</span>
curl -X POST {{ BASE }}/tasks/ \
  -H <span class="k">"Authorization: Token nvx_seu_token"</span> \
  -H "Content-Type: application/json" \
  -d '{"project": 3, "title": "Revisar contrato", "due": "2026-11-03"}'</pre>
        </div>
      </section>

      <section id="autenticacao" class="ip-section docs-anchor" aria-labelledby="docs-auth">
        <header><h2 id="docs-auth">Autenticação<br><span>de dois jeitos.</span></h2></header>
        <ol v-reveal.stagger class="ip-list">
          <li>
            <span class="ip-num">01</span>
            <div><h3>Token pessoal (para scripts e integrações)</h3>
              <p>Crie em Ajustes › Tokens de API e envie <code>Authorization: Token nvx_…</code>. O token aparece uma vez só. Guarde num cofre de senhas e revogue quando não usar mais.</p></div>
          </li>
          <li>
            <span class="ip-num">02</span>
            <div><h3>JWT (para apps com login)</h3>
              <p><code>POST /auth/login/</code> com <code>username</code> (aceita e-mail) e <code>password</code> devolve <code>access</code> e <code>refresh</code>. Envie <code>Authorization: Bearer &lt;access&gt;</code>. O access vale 1 dia e é renovado em <code>POST /auth/login/refresh/</code>.</p></div>
          </li>
        </ol>
      </section>

      <section id="referencia" class="ip-section docs-anchor" aria-labelledby="docs-ref">
        <header><h2 id="docs-ref">Referência<br><span>das rotas principais.</span></h2>
          <p>Os IDs são números. Cada rota só mostra o que você tem permissão para ver.</p></header>
        <div v-reveal>
          <table class="ip-table">
            <thead><tr><th>Rota</th><th>O que faz</th></tr></thead>
            <tbody>
              <tr v-for="[verb, path, text] in ENDPOINTS" :key="verb + path">
                <td><span class="ip-verb">{{ verb }}</span><code>{{ path }}</code></td>
                <td>{{ text }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="limites" class="ip-section docs-anchor" aria-labelledby="docs-limits">
        <header><h2 id="docs-limits">Limites<br><span>e erros.</span></h2></header>
        <div v-reveal>
          <table class="ip-table">
            <thead><tr><th>Rota</th><th>Limite por pessoa</th></tr></thead>
            <tbody><tr v-for="[name, limit] in LIMITS" :key="name"><td>{{ name }}</td><td>{{ limit }}</td></tr></tbody>
          </table>
          <p class="docs-p">Erros vêm com o status HTTP certo e um <code>detail</code> em português, pronto para mostrar a quem usa: <code>400</code> dado inválido, <code>401</code> sem login, <code>403</code> sem permissão no projeto, <code>429</code> passou do limite.</p>
        </div>
      </section>

      <section id="webhooks" class="ip-section docs-anchor" aria-labelledby="docs-hooks">
        <header><h2 id="docs-hooks">Webhooks<br><span>em breve.</span></h2></header>
        <div v-reveal>
          <p class="docs-p">Já dá para cadastrar o endereço e os eventos em Ajustes › Webhooks, e cada um ganha um segredo próprio.</p>
          <p class="ip-note">O envio ainda não está ligado. Quando estiver, cada aviso vai chegar assinado com HMAC desse segredo, para você conferir que veio do Novexo.</p>
        </div>
      </section>

      <div v-reveal class="ip-cta">
        <h2>Precisa de uma rota<br><em>que não está aqui?</em></h2>
        <div class="ip-cta__actions">
          <GooeyButton variant="secondary" size="lg" to="/status">Ver status <FlaticonIcon name="arrow-up-right" :size="14" /></GooeyButton>
          <GooeyButton variant="primary" size="lg" to="/contato">Pedir para o time</GooeyButton>
        </div>
      </div>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>

<style scoped>
.docs-toc { display: grid; margin-top: 30px; border-top: 1px solid var(--ip-line); }
.docs-toc a { display: flex; gap: 16px; align-items: baseline; padding: 11px 0; border-bottom: 1px solid var(--ip-line); color: #d8d0c7; font-size: 13px; text-decoration: none; transition: color .2s, padding .25s; }
.docs-toc a:hover { color: var(--lp-orange-soft); padding-left: 6px; }
.docs-anchor { scroll-margin-top: 90px; }
.docs-p { margin: 0 0 4px; color: var(--ip-muted); font-size: 13px; line-height: 1.85; }
.docs-p + .ip-table, .ip-table + .docs-p { margin-top: 20px; }
</style>
