<script setup>
// Segurança: só o que o sistema faz de verdade (cada item tem o código por trás) e, à parte, o que ainda não faz
import { onMounted, onUnmounted } from 'vue'
import '../assets/landing.css'
import '../assets/infopage.css'
import SiteNav from '../components/landing/SiteNav.vue'
import SiteFooter from '../components/landing/SiteFooter.vue'
import GooeyButton from '../components/GooeyButton.vue'
import { vReveal } from '../utils/motion'

const ACCESS = [
  ['Senhas que nem nós conseguimos ler', 'As senhas são guardadas só como hash, com os validadores de força do Django. Também dá para entrar com o Google, e o e-mail é confirmado por link.'],
  ['Quatro níveis de permissão por projeto', 'Ver, comentar, editar ou acesso total. Cada pessoa recebe o nível certo em cada projeto, e o servidor confere de novo a cada pedido.'],
  ['Tokens de API que aparecem uma vez', 'O token pessoal (nvx_…) é mostrado só na hora de criar. No banco fica apenas o hash, e você pode revogar o token quando quiser.'],
  ['Limite de pedidos', 'A IA, o envio pelo WhatsApp e o checkout têm um número máximo de pedidos por minuto por pessoa. Isso evita abuso e gasto acidental.'],
]

const DATA = [
  ['A IA age com as suas permissões', 'A Novexo IA só faz o que você mesmo poderia fazer. Para ações sensíveis, como apagar ou trocar alguém de papel, ela apenas propõe, e quem confirma é você, num botão.'],
  ['WhatsApp só para quem pediu', 'O número é confirmado com um código de 6 dígitos, que vale 10 minutos e aceita até 5 tentativas. Ninguém cadastra o número de outra pessoa, e você pode remover o seu quando quiser.'],
  ['O cartão não passa pelo nosso servidor', 'Os dados do cartão são digitados num formulário do Mercado Pago e viram um token no seu navegador. Os avisos de pagamento chegam assinados (HMAC) e são conferidos antes de liberar o plano.'],
]

const NOT_YET = [
  ['Certificações (SOC 2, ISO 27001)', 'Ainda não temos. Quando tivermos, o relatório vai estar nesta página.'],
  ['Login em dois fatores', 'Está no plano. Por enquanto, entrar com o Google usa a verificação em duas etapas da sua conta Google.'],
  ['Envio dos webhooks', 'Já dá para cadastrar o endereço e os eventos, mas o envio assinado ainda não está ligado.'],
]

let previousTitle
onMounted(() => { previousTitle = document.title; document.title = 'Segurança | Novexo' })
onUnmounted(() => { document.title = previousTitle })
</script>

<template>
  <div id="topo" class="lp ip">
    <SiteNav />
    <main class="ip-main">
      <section class="ip-hero" aria-labelledby="sec-title">
        <div v-reveal.now>
          <p class="ip-kicker">Segurança</p>
          <h1 id="sec-title">O trabalho do seu time,<br>bem <em>guardado.</em></h1>
        </div>
        <p v-reveal.now="0.15" class="ip-lead">Sem promessas vagas: aqui está <strong>o que o Novexo faz hoje</strong> para proteger contas, projetos e pagamentos, e também o que ainda falta fazer.</p>
      </section>

      <section class="ip-section" aria-labelledby="sec-access">
        <header><h2 id="sec-access">Quem entra<br><span>e o que pode fazer.</span></h2></header>
        <ol v-reveal.stagger class="ip-list">
          <li v-for="([title, text], i) in ACCESS" :key="title">
            <span class="ip-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div><h3>{{ title }}</h3><p>{{ text }}</p></div>
          </li>
        </ol>
      </section>

      <section class="ip-section" aria-labelledby="sec-data">
        <header><h2 id="sec-data">IA, WhatsApp<br><span>e pagamentos.</span></h2>
          <p>As partes que falam com serviços de fora são as que pedem mais cuidado.</p></header>
        <ol v-reveal.stagger class="ip-list">
          <li v-for="([title, text], i) in DATA" :key="title">
            <span class="ip-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div><h3>{{ title }}</h3><p>{{ text }}</p></div>
          </li>
        </ol>
      </section>

      <section class="ip-section" aria-labelledby="sec-not-yet">
        <header><h2 id="sec-not-yet">O que<br><span>ainda não temos.</span></h2>
          <p>Preferimos contar do que deixar você descobrir depois.</p></header>
        <ol v-reveal.stagger class="ip-list">
          <li v-for="([title, text], i) in NOT_YET" :key="title">
            <span class="ip-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div><h3>{{ title }}</h3><p>{{ text }}</p></div>
          </li>
        </ol>
      </section>

      <div v-reveal class="ip-cta">
        <h2>Achou uma falha?<br><em>Fale direto com a gente.</em></h2>
        <div class="ip-cta__actions">
          <GooeyButton variant="primary" size="lg" href="mailto:contato@novexo.app?subject=Seguran%C3%A7a%20%E2%80%94%20Novexo">Relatar um problema</GooeyButton>
        </div>
      </div>
    </main>
    <SiteFooter blend-from-black />
  </div>
</template>
