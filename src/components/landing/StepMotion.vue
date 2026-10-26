<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import FlaticonIcon from '../FlaticonIcon.vue'
import { prefersReducedMotion } from '../../utils/motion'

defineProps({ kind: { type: String, required: true } })

const root = ref(null)
const running = ref(false)
const still = ref(false)
let observer

onMounted(() => {
  still.value = prefersReducedMotion()
  if (still.value) return
  observer = new IntersectionObserver(([entry]) => { running.value = entry.isIntersecting })
  observer.observe(root.value)
})
onUnmounted(() => observer?.disconnect())

const checklist = ['Conferir os títulos', 'Ajustar a mensagem principal', 'Enviar para revisão do time']
</script>

<template>
  <div ref="root" :class="['step-motion', `step-motion--${kind}`, { 'is-running': running, 'is-still': still }]" aria-hidden="true">
    <div v-if="kind === 'project'" class="sm-projects">
      <div class="sm-tile sm-tile--old"><FlaticonIcon name="folder" :size="13" /><span class="sm-bar" /><span class="sm-bar sm-bar--short" /></div>
      <div class="sm-tile sm-tile--old"><FlaticonIcon name="folder" :size="13" /><span class="sm-bar" /><span class="sm-bar sm-bar--short" /></div>
      <div class="sm-tile sm-slot">
        <span class="sm-plus"><FlaticonIcon name="plus" :size="14" /></span>
        <div class="sm-new">
          <span class="sm-folder"><FlaticonIcon name="folder" :size="13" /></span>
          <strong class="sm-type">Lançamento da marca<i class="sm-mask" /></strong>
          <span class="sm-team"><i>CL</i><i>AM</i><i>JP</i></span>
          <span class="sm-meter"><b /></span>
        </div>
      </div>
    </div>

    <div v-else-if="kind === 'checklist'" class="sm-task">
      <div class="sm-task__head">
        <span class="sm-status"><i /><i class="sm-status__done" /></span>
        <strong>Revisar o texto da página</strong>
        <span class="sm-avatar">AM</span>
      </div>
      <ul>
        <li v-for="(item, index) in checklist" :key="item" :class="`sm-row sm-row--${index + 1}`">
          <span class="sm-row__base"><span class="sm-box" />{{ item }}</span>
          <span class="sm-row__done"><span class="sm-box"><FlaticonIcon name="check" :size="8" /></span>{{ item }}</span>
        </li>
      </ul>
      <span class="sm-meter"><b /></span>
    </div>

    <div v-else class="sm-wiki">
      <div class="sm-page">
        <div class="sm-page__head"><FlaticonIcon name="document" :size="13" /><strong>Briefing do lançamento</strong></div>
        <span class="sm-line sm-line--1" /><span class="sm-line sm-line--2" /><span class="sm-line sm-line--3" />
      </div>
      <span class="sm-wire" />
      <div class="sm-chip"><FlaticonIcon name="link" :size="11" /><span>Revisar o texto da página</span></div>
    </div>
  </div>
</template>

<style scoped>
.step-motion { --cycle: 7s; display: grid; place-items: center; min-height: 172px; margin: 28px 0; padding: 26px 22px; border: 1px solid #ffffff1f; border-radius: 8px; background: radial-gradient(120% 90% at 85% 0%, #e5651514, transparent 60%), #0e0e0d; overflow: hidden; color: #e5e1dc; font-family: var(--lp-sans); }
.step-motion * { animation-duration: var(--cycle); animation-iteration-count: infinite; animation-timing-function: cubic-bezier(.65, 0, .35, 1); animation-fill-mode: both; animation-play-state: paused; }
.step-motion.is-running * { animation-play-state: running; }
.step-motion.is-still * { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .step-motion * { animation: none !important; } }
.step-motion i { font-style: normal; }
.sm-meter { display: block; height: 3px; border-radius: 3px; background: #ffffff14; overflow: hidden; }
.sm-meter b { display: block; height: 100%; background: var(--lp-orange); transform-origin: left; }

.sm-projects { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; width: min(100%, 470px); }
.sm-tile { position: relative; display: flex; flex-direction: column; gap: 9px; min-height: 118px; padding: 14px; border: 1px solid #ffffff14; border-radius: 7px; background: #161615; }
.sm-tile--old { color: #77716b; }
.sm-bar { display: block; width: 75%; height: 5px; border-radius: 3px; background: #ffffff12; }.sm-bar--short { width: 45%; }
.sm-slot { border: 1px dashed #e5651555; background: #e5651508; }
.sm-plus { position: absolute; inset: 0; display: grid; place-items: center; color: var(--lp-orange-soft); opacity: 0; animation-name: sm-plus; }
.sm-new { position: absolute; inset: -1px; display: flex; flex-direction: column; gap: 9px; padding: 14px; border: 1px solid #e5651566; border-radius: 7px; background: #1c1c1a; animation-name: sm-new; }
.sm-folder { color: var(--lp-orange-soft); }
.sm-type { position: relative; overflow: hidden; font-size: 11px; font-weight: 500; line-height: 1.4; color: #f2efeb; }
.sm-mask { position: absolute; inset: 0; background: #1c1c1a; transform: translateX(101%); animation-name: sm-mask; }
.sm-team { display: flex; margin-top: auto; }
.sm-team i { display: grid; place-items: center; width: 19px; height: 19px; margin-right: -4px; border: 2px solid #1c1c1a; border-radius: 50%; background: #41352b; color: #e6c7ad; font-size: 7px; animation-name: sm-pop; }
.sm-team i:nth-child(2) { background: #303b35; color: #c8d5c9; animation-delay: .18s; }
.sm-team i:nth-child(3) { background: #34373e; color: #ccd4df; animation-delay: .36s; }
.sm-new .sm-meter b { transform: scaleX(.34); animation-name: sm-meter-third; }
@keyframes sm-plus { 0%, 9% { opacity: 1; transform: scale(1); } 15%, 85% { opacity: 0; transform: scale(.6); } 95%, 100% { opacity: 1; transform: scale(1); } }
@keyframes sm-new { 0%, 11% { opacity: 0; transform: scale(.94); } 20%, 84% { opacity: 1; transform: scale(1); } 93%, 100% { opacity: 0; transform: scale(.97); } }
@keyframes sm-mask { 0%, 20% { transform: translateX(0); } 38%, 100% { transform: translateX(101%); } }
@keyframes sm-pop { 0%, 42% { opacity: 0; transform: scale(.4); } 49%, 100% { opacity: 1; transform: scale(1); } }
@keyframes sm-meter-third { 0%, 54% { transform: scaleX(0); } 70%, 100% { transform: scaleX(.34); } }

.sm-task { width: min(100%, 380px); padding: 16px 18px 18px; border: 1px solid #ffffff1a; border-radius: 7px; background: #1c1c1a; }
.sm-task__head { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; }
.sm-task__head strong { flex: 1; font-size: 12px; font-weight: 500; color: #f5f2ee; }
.sm-status { position: relative; width: 8px; height: 8px; }
.sm-status i { position: absolute; inset: 0; border-radius: 50%; background: var(--lp-orange); }
.sm-status .sm-status__done { background: #adc0a0; animation-name: sm-status; }
.sm-avatar { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #353e34; color: #c8d5c9; font-size: 7px; }
.sm-task ul { margin: 0 0 14px; padding: 0; list-style: none; }
.sm-row { position: relative; padding: 7px 0; border-top: 1px solid #ffffff0f; font-size: 11px; }
.sm-row > span { display: flex; align-items: center; gap: 9px; }
.sm-row__base { color: #d1ccc6; }
.sm-row__done { position: absolute; inset: 7px 0 0; color: #8f8a84; background: #1c1c1a; }
.sm-box { display: grid; place-items: center; flex-shrink: 0; width: 13px; height: 13px; border: 1px solid #ffffff38; border-radius: 3px; }
.sm-row__done .sm-box { border-color: var(--lp-orange); background: var(--lp-orange); color: #1c1c1a; }
.sm-row--1 .sm-row__done { animation-name: sm-check-1; }
.sm-row--2 .sm-row__done { animation-name: sm-check-2; }
.sm-row--3 .sm-row__done { animation-name: sm-check-3; }
.sm-task .sm-meter b { animation-name: sm-meter-steps; }
@keyframes sm-check-1 { 0%, 13% { opacity: 0; } 18%, 85% { opacity: 1; } 93%, 100% { opacity: 0; } }
@keyframes sm-check-2 { 0%, 30% { opacity: 0; } 35%, 85% { opacity: 1; } 93%, 100% { opacity: 0; } }
@keyframes sm-check-3 { 0%, 47% { opacity: 0; } 52%, 85% { opacity: 1; } 93%, 100% { opacity: 0; } }
@keyframes sm-status { 0%, 56% { opacity: 0; } 62%, 85% { opacity: 1; } 93%, 100% { opacity: 0; } }
@keyframes sm-meter-steps { 0%, 13% { transform: scaleX(0); } 18%, 30% { transform: scaleX(.334); } 35%, 47% { transform: scaleX(.667); } 52%, 85% { opacity: 1; transform: scaleX(1); } 93% { opacity: 0; transform: scaleX(1); } 94% { opacity: 0; transform: scaleX(0); } 100% { opacity: 1; transform: scaleX(0); } }

.sm-wiki { display: grid; grid-template-columns: minmax(0, 1.25fr) 42px minmax(0, 1fr); align-items: center; width: min(100%, 520px); }
.sm-page { display: flex; flex-direction: column; gap: 9px; padding: 16px; border: 1px solid #ffffff1a; border-radius: 7px; background: #1c1c1a; }
.sm-page__head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; color: var(--lp-orange-soft); }
.sm-page__head strong { font-size: 11px; font-weight: 500; color: #f2efeb; }
.sm-line { display: block; height: 5px; border-radius: 3px; background: #ffffff1c; transform-origin: left; }
.sm-line--2 { width: 86%; }.sm-line--3 { width: 62%; }
.sm-line--1 { animation-name: sm-write-1; }.sm-line--2 { animation-name: sm-write-2; }.sm-line--3 { animation-name: sm-write-3; }
.sm-wire { display: block; height: 1px; background: linear-gradient(90deg, #ffffff30, var(--lp-orange)); transform-origin: left; animation-name: sm-wire; }
.sm-chip { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid #e5651544; border-radius: 6px; background: #e565150f; color: var(--lp-orange-soft); font-size: 10px; animation-name: sm-chip; }
.sm-chip span { color: #eadbd0; }
@keyframes sm-write-1 { 0%, 6% { opacity: 1; transform: scaleX(0); } 20%, 85% { opacity: 1; transform: scaleX(1); } 93% { opacity: 0; transform: scaleX(1); } 94%, 100% { opacity: 0; transform: scaleX(0); } }
@keyframes sm-write-2 { 0%, 20% { opacity: 1; transform: scaleX(0); } 33%, 85% { opacity: 1; transform: scaleX(1); } 93% { opacity: 0; transform: scaleX(1); } 94%, 100% { opacity: 0; transform: scaleX(0); } }
@keyframes sm-write-3 { 0%, 33% { opacity: 1; transform: scaleX(0); } 44%, 85% { opacity: 1; transform: scaleX(1); } 93% { opacity: 0; transform: scaleX(1); } 94%, 100% { opacity: 0; transform: scaleX(0); } }
@keyframes sm-wire { 0%, 48% { opacity: 1; transform: scaleX(0); } 56%, 85% { opacity: 1; transform: scaleX(1); } 93% { opacity: 0; transform: scaleX(1); } 94%, 100% { opacity: 0; transform: scaleX(0); } }
@keyframes sm-chip { 0%, 55% { opacity: 0; transform: translateX(-8px); } 63%, 85% { opacity: 1; transform: translateX(0); } 93%, 100% { opacity: 0; transform: translateX(0); } }

@media (max-width: 520px) {
  .step-motion { padding: 22px 14px; }
  .sm-projects { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm-projects > .sm-tile--old:first-child { display: none; }
  .sm-wiki { grid-template-columns: 1fr; gap: 12px; }
  .sm-wire { display: none; }
}
</style>
