<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import FlaticonIcon from '../FlaticonIcon.vue'
import { prefersReducedMotion } from '../../utils/motion'

gsap.registerPlugin(Flip)

const view = ref('board')
const tasks = ref([
  { id: 1, title: 'Definir o objetivo do projeto', tag: 'Planejamento', owner: 'CL', status: 'todo' },
  { id: 2, title: 'Desenhar a primeira versão', tag: 'Design', owner: 'AM', status: 'doing' },
  { id: 3, title: 'Compartilhar o briefing', tag: 'Conteúdo', owner: 'JP', status: 'done' },
])
const columns = [{ id: 'todo', title: 'A fazer' }, { id: 'doing', title: 'Em andamento' }, { id: 'done', title: 'Concluído' }]
const completed = computed(() => tasks.value.filter(task => task.status === 'done').length)
const root = ref(null)
async function advance(task) {
  const el = root.value
  const animar = el && !prefersReducedMotion()
  const estado = animar ? Flip.getState(el.querySelectorAll('[data-flip-id]')) : null
  const antes = animar ? el.offsetHeight : 0
  task.status = columns[(columns.findIndex(column => column.id === task.status) + 1) % columns.length].id
  if (!animar) return
  gsap.killTweensOf(el)
  el.style.height = ''
  await nextTick()
  const depois = el.offsetHeight
  Flip.from(estado, { targets: el.querySelectorAll('[data-flip-id]'), duration: 0.75, ease: 'power3.inOut' })
  if (antes !== depois) gsap.fromTo(el, { height: antes }, { height: depois, duration: 0.75, ease: 'power3.inOut', clearProps: 'height' })
}

const touched = ref(false)
let visible = false
let step = 0
let lastDone = 0
let timer = 0
let observer
function idleTick() {
  if (!visible || document.hidden || view.value !== 'board') return
  const phase = step++ % 3
  const task = phase === 0 ? tasks.value.find(t => t.status === 'doing')
    : phase === 1 ? tasks.value.find(t => t.status === 'todo')
    : tasks.value.find(t => t.status === 'done' && t.id !== lastDone)
  if (phase === 0) lastDone = task.id
  advance(task)
}
function stopIdle() {
  touched.value = true
  clearInterval(timer)
  observer?.disconnect()
}
onMounted(() => {
  if (prefersReducedMotion()) return
  observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0.4 })
  observer.observe(root.value)
  timer = setInterval(idleTick, 2600)
})
onUnmounted(stopIdle)
</script>

<template>
  <div ref="root" class="workflow" @pointerdown="stopIdle" @keydown="stopIdle">
    <div class="workflow__top"><strong>Área de trabalho</strong><span class="workflow__dots" aria-hidden="true"><FlaticonIcon name="menu-dots" :size="16" /></span></div>
    <div class="workflow__head"><div><span class="workflow__eyebrow">DO PLANO À ENTREGA</span><h3>Uma ideia. Todo o time.</h3></div><span class="workflow__team" aria-label="Três pessoas no projeto"><i>CL</i><i>AM</i><i>JP</i></span></div>
    <div class="workflow__toolbar"><div class="workflow__tabs" role="group" aria-label="Visualização do projeto"><button type="button" :aria-pressed="view === 'board'" @click="view = 'board'"><FlaticonIcon name="layout-fluid" :size="12" /> Quadro</button><button type="button" :aria-pressed="view === 'list'" @click="view = 'list'"><FlaticonIcon name="list" :size="12" /> Lista</button></div><span :aria-live="touched ? 'polite' : 'off'">{{ completed }} de 3 entregas concluídas</span></div>
    <div v-if="view === 'board'" class="workflow__board">
      <div v-for="column in columns" :key="column.id" class="workflow__column">
        <div class="workflow__label"><span :class="['workflow__dot', column.id]" />{{ column.title }}<span>{{ tasks.filter(task => task.status === column.id).length }}</span></div>
        <button v-for="task in tasks.filter(task => task.status === column.id)" :key="task.id" :data-flip-id="task.id" type="button" class="workflow__task" :aria-label="`${task.title}. ${column.title}. Clique para avançar o status.`" @click="advance(task)"><span class="workflow__tag">{{ task.tag }}</span><strong>{{ task.title }}</strong><span class="workflow__task-bottom"><span><FlaticonIcon :name="task.status === 'done' ? 'check' : 'arrow-small-right'" :size="10" /> {{ task.status === 'done' ? 'Concluído' : 'Avançar' }}</span><i>{{ task.owner }}</i></span></button>
      </div>
    </div>
    <div v-else class="workflow__list">
      <button v-for="task in tasks" :key="task.id" type="button" :aria-label="`${task.title}. ${columns.find(column => column.id === task.status).title}. Clique para avançar o status.`" @click="advance(task)"><span :class="['workflow__check', { done: task.status === 'done' }]"><FlaticonIcon :name="task.status === 'done' ? 'check' : 'arrow-small-right'" :size="12" /></span><strong>{{ task.title }}</strong><span>{{ columns.find(column => column.id === task.status).title }}</span><i>{{ task.owner }}</i></button>
    </div>
    <div class="workflow__bottom"><span><span class="workflow__live" /> Demonstração interativa</span><span>Clique em uma tarefa para mudar o status <FlaticonIcon name="arrow-up-right" :size="10" /></span></div>
  </div>
</template>

<style scoped>
.workflow__tabs button { display: inline-flex; align-items: center; gap: 6px; }
.workflow__task-bottom > span, .workflow__bottom > span { display: inline-flex; align-items: center; gap: 4px; }
.workflow { border: 1px solid #45413e; border-radius: 12px; background: #121211; color: var(--lp-white); overflow: hidden; text-align: left; box-shadow: 0 24px 80px #0005; }
.workflow__top { display: flex; align-items: center; gap: 12px; padding: 16px 22px; border-bottom: 1px solid #ffffff12; font-size: 11px; color: #b8b5b1; }
.workflow__top strong { font-weight: 500; color: #eeece9; }.workflow__dots { margin-left: auto; letter-spacing: 3px; }
.workflow__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 24px 24px 20px; }.workflow__eyebrow { font: 10px var(--font-mono); color: var(--lp-orange-soft); letter-spacing: .1em; }.workflow h3 { margin: 8px 0 0; font: 500 clamp(18px, 2vw, 25px)/1.3 var(--lp-sans); color: #fff; letter-spacing: -.04em; }
.workflow i { display: grid; flex-shrink: 0; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #41352b; color: #e6c7ad; font-size: 8px; font-style: normal; }.workflow__team { display: flex; }.workflow__team i { width: 29px; height: 29px; margin-left: -6px; border: 2px solid #121211; }.workflow__team i:nth-child(2) { background: #303b35; color: #c8d5c9; }.workflow__team i:nth-child(3) { background: #34373e; color: #ccd4df; }
.workflow__toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin: 0 24px; padding-bottom: 14px; border-bottom: 1px solid #ffffff12; font-size: 10px; color: #a6a39f; }.workflow__tabs { display: flex; gap: 4px; }.workflow__tabs button { padding: 7px 12px; border: 0; border-radius: 5px; background: none; color: #aaa6a1; font: 11px var(--lp-sans); cursor: pointer; }.workflow__tabs button[aria-pressed='true'] { background: #ffffff12; color: #fff; }
.workflow__board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; min-height: 192px; padding: 20px 24px 30px; }.workflow__column { min-width: 0; }.workflow__label { display: flex; align-items: center; gap: 7px; margin-bottom: 14px; font-size: 10px; color: #d5d2cf; }.workflow__label > span:last-child { color: #aaa6a1; margin-left: auto; }.workflow__dot { width: 6px; height: 6px; border-radius: 50%; background: #8d8d8b; }.workflow__dot.doing { background: var(--lp-orange); }.workflow__dot.done { background: #adc0a0; }
.workflow__task { display: flex; flex-direction: column; width: 100%; gap: 14px; margin-bottom: 10px; padding: 13px; border: 1px solid #ffffff14; border-radius: 6px; background: #1c1c1a; color: #e5e3df; text-align: left; font-family: var(--lp-sans); cursor: pointer; transition: border-color .2s, translate .2s; }.workflow__task:hover { border-color: var(--lp-orange); translate: 0 -2px; }.workflow__tag { align-self: flex-start; padding: 3px 6px; border: 1px solid #e565152e; border-radius: 3px; color: #fba45c; background: #e565150c; font-size: 8px; }.workflow__task strong { min-height: 30px; font-size: 11px; font-weight: 500; line-height: 1.5; }.workflow__task-bottom { display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #b1aca6; }
.workflow__bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 12px 24px; border-top: 1px solid #ffffff12; font-size: 9px; color: #b1aca6; }.workflow__live { display: inline-block; width: 5px; height: 5px; margin-right: 5px; border-radius: 50%; background: var(--lp-orange); }
.workflow__list { min-height: 192px; padding: 15px 24px 25px; }.workflow__list button { display: flex; align-items: center; width: 100%; gap: 12px; padding: 12px 0; border: 0; border-bottom: 1px solid #ffffff12; background: none; color: #e5e3df; text-align: left; cursor: pointer; font: 10px var(--lp-sans); }.workflow__list strong { flex: 1; font-weight: 500; }.workflow__list button > span:not(:first-child) { color: #b1aca6; font-size: 9px; }.workflow__check { color: var(--lp-orange-soft); }.workflow__check.done { color: #adc0a0; }
.workflow button:focus-visible { outline: 2px solid var(--lp-orange-soft); outline-offset: 3px; }
@media (max-width: 560px) { .workflow__top { padding: 12px; font-size: 9px; }.workflow__slash { margin: 0 3px; }.workflow__head { padding: 20px 14px; }.workflow__toolbar { margin-inline: 14px; }.workflow__board { gap: 7px; padding: 18px 10px; }.workflow__label { font-size: 8px; gap: 4px; }.workflow__task { padding: 8px; gap: 10px; }.workflow__task strong { font-size: 10px; }.workflow__tag { font-size: 7px; padding: 2px 4px; }.workflow__task-bottom > span { font-size: 7px; }.workflow__bottom { padding: 12px 14px; }.workflow__list { padding-inline: 14px; }.workflow__list button > span:not(:first-child) { display: none; } }
</style>
