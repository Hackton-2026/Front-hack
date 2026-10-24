<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import FlaticonIcon from '../FlaticonIcon.vue'

const props = defineProps({
  kind: { type: String, default: 'orbit' },
  lines: { type: Array, default: () => [] },
  animated: Boolean,
})
// O loop só roda com o card na tela; fora dela as animações ficam pausadas.
const root = ref(null)
const visible = ref(false)
let observer
onMounted(() => {
  if (!props.animated || !('IntersectionObserver' in window)) { visible.value = true; return }
  observer = new IntersectionObserver(([entry]) => { visible.value = entry.isIntersecting })
  observer.observe(root.value)
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div ref="root" class="editorial-art" :class="[`editorial-art--${kind}`, { 'editorial-art--animated': animated, 'is-visible': visible }]" aria-hidden="true">
    <div v-if="kind === 'orbit'" class="orbit-shapes"><span /><span /><em v-if="animated" class="motion orbit-sat"><i /></em><span /></div>
    <div v-else-if="kind === 'calendar'" class="calendar-shape"><div><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span></div><div><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span><b v-if="animated" class="motion cal-dot" /></div><i>Um passo de cada vez <FlaticonIcon name="arrow-up-right" /></i><div><span>26</span><span>27</span><span>28</span><span>29</span><span>30</span></div></div>
    <div v-else-if="kind === 'tasks'" class="task-shapes"><span><i><FlaticonIcon name="check" /></i> Definir o próximo passo</span><span><i><FlaticonIcon name="check" /></i> Dar contexto à entrega</span><span><i><FlaticonIcon name="circle" /><FlaticonIcon v-if="animated" name="check" class="motion task-tick" /></i> Fazer acontecer <b><FlaticonIcon name="arrow-up-right" /></b></span></div>
    <div v-else-if="kind === 'team'" class="team-shapes"><span>C</span><span>A</span><span>J</span><i /><em v-if="animated" class="motion team-bubble"><i /><i /><i /></em></div>
    <div v-else-if="kind === 'board'" class="board-shapes"><div><small>A FAZER <b>02</b></small><span /><span /></div><div><small>EM ANDAMENTO <b>01</b></small><span /><span v-if="animated" class="motion board-mover" /></div><div><small>CONCLUÍDO <b>02</b></small><span /><span /></div></div>
    <div v-else-if="kind === 'wiki'" class="wiki-shapes"><span /><div><small>WIKI DO TIME</small><strong>Uma boa ideia<br>merece contexto.</strong><i /><i /><i /><b><FlaticonIcon name="arrow-up-right" /></b></div></div>
    <div v-else-if="kind === 'focus'" class="focus-shapes"><span /><span /><span /><template v-if="animated"><em class="motion focus-ripple" /><em class="motion focus-ripple" /></template><b>01</b></div>
    <div v-else-if="kind === 'notes'" class="notes-shapes"><span>e se a gente<br><em>tentasse?</em><b><FlaticonIcon name="arrow-up-right" /></b></span><span>próximo passo:<br><em>começar.</em><i v-if="animated" class="motion notes-caret" /></span></div>

    <div class="art-caption"><span v-for="line in lines" :key="line">{{ line }}</span></div>
  </div>
</template>

<style scoped>
.editorial-art { position: relative; isolation: isolate; aspect-ratio: 1.48; overflow: hidden; padding: 22px; background: #2b2018; color: #fff2e3; }
.art-caption { position: absolute; z-index: 2; left: 22px; bottom: 23px; font: 500 clamp(19px, 2.1vw, 27px)/1.08 var(--lp-hero); letter-spacing: -.05em; }.art-caption > span { display: block; }
.editorial-art--orbit { background: #c65a20; }.orbit-shapes { position: absolute; width: 76%; aspect-ratio: 1; right: -10%; top: -4%; }.orbit-shapes > span { position: absolute; inset: 15%; border: 1px solid #ffe0b6a3; border-radius: 50%; transform: rotate(-35deg) scaleX(1.3); }.orbit-shapes > span:nth-of-type(2) { inset: 5%; transform: rotate(-35deg) scaleX(.65); }.orbit-shapes > span:nth-of-type(3) { inset: 26%; background: #76380f; border: 0; transform: none; box-shadow: inset -8px -9px 20px #2d110d77; }
.editorial-art--calendar { background: #ddd7cb; color: #2d2923; }.calendar-shape { width: 81%; margin: 28px 0 0 auto; transform: rotate(-7deg) translateX(12%); padding: 14px; border: 1px solid #91877a88; border-radius: 8px; background: #f0eae1; box-shadow: 0 20px 30px #5e483322; }.calendar-shape > div { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 10px; text-align: center; font: 9px var(--font-mono); }.calendar-shape > div:first-child { font-size: 6px; color: #6c6358; }.calendar-shape > div:nth-child(2) > span:nth-child(3) { border-radius: 50%; background: #e56515; color: #fff; }.calendar-shape > div > span { padding: 4px; }.calendar-shape > i { display: block; width: 78%; margin: 0 0 10px 10%; padding: 5px 8px; background: #e56515; color: #fff4e7; border-radius: 4px; font-size: 8px; font-style: normal; }
.editorial-art--tasks { background: #1b1c1b; }.task-shapes { display: grid; gap: 8px; position: absolute; width: 78%; top: 25%; left: 22%; transform: rotate(-9deg); }.task-shapes > span { display: flex; align-items: center; gap: 9px; padding: 12px; border: 1px solid #ffffff26; border-radius: 5px; font: 9px var(--lp-sans); background: #292925; box-shadow: 0 9px 20px #0002; }.task-shapes > span:nth-child(2) { margin-left: 10px; }.task-shapes > span:last-child { margin-left: 20px; color: #fba45c; border-color: #e5651580; background: #352217; }.task-shapes i { font-style: normal; color: #fba45c; }.task-shapes b { margin-left: auto; font-size: 16px; font-weight: 400; }
.editorial-art--team { background: #a4a49a; color: #202520; }.team-shapes { position: absolute; inset: 24% 8% auto 12%; display: flex; justify-content: center; }.team-shapes > span { position: relative; z-index: 1; display: grid; place-items: center; width: 65px; height: 65px; margin-left: -7px; border: 3px solid #a4a49a; border-radius: 50%; background: #d4d0c1; color: #605b4f; font: 500 24px var(--font-serif); }.team-shapes > span:nth-child(2) { background: #262e28; color: #dbddca; transform: translateY(-10px); }.team-shapes > span:nth-child(3) { background: #c65a20; color: #ffe0c6; transform: translateY(10px); }.team-shapes > i { position: absolute; inset: 10% -5% -35%; border: 1px solid #20252044; border-radius: 50%; transform: rotate(-12deg); }
.editorial-art--board { background: #67391f; }.board-shapes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; position: absolute; top: 25%; right: -7%; width: 90%; transform: rotate(-8deg); padding: 16px; background: #201f1b; border: 1px solid #a8958055; border-radius: 8px; box-shadow: 0 20px 30px #0004; }.board-shapes small { display: flex; justify-content: space-between; gap: 3px; color: #c3bbb0; font: 5px var(--font-mono); margin-bottom: 12px; }.board-shapes small b { color: #fba45c; font-weight: 400; }.board-shapes div > span { display: block; height: 34px; margin-bottom: 7px; border: 1px solid #ffffff1a; border-radius: 3px; background: #34312a; }.board-shapes > div:nth-child(2) > span { background: #ad5a2c; }
.editorial-art--wiki { background: #d9d3c9; color: #332d25; }.wiki-shapes { position: absolute; width: 51%; right: 13%; top: 21%; transform: rotate(9deg); aspect-ratio: .9; }.wiki-shapes > span, .wiki-shapes > div { position: absolute; inset: 0; border: 1px solid #8b7a6666; border-radius: 4px; background: #cec3b2; }.wiki-shapes > span { transform: rotate(-15deg) translateX(-12px); }.wiki-shapes > div { padding: 18px; background: #f1ece3; }.wiki-shapes small { display: block; font: 6px var(--font-mono); margin-bottom: 15px; color: #8a7460; }.wiki-shapes strong { font: 400 19px/1 var(--font-serif); letter-spacing: -.04em; }.wiki-shapes i { display: block; width: 100%; height: 2px; margin-top: 9px; background: #3d332524; }.wiki-shapes i:last-of-type { width: 70%; }.wiki-shapes b { position: absolute; bottom: 14px; right: 16px; color: #c65a20; font-size: 24px; font-weight: 400; }
.editorial-art--focus { background: #222321; }.focus-shapes { position: absolute; width: 65%; aspect-ratio: 1; top: 10%; right: 4%; }.focus-shapes > span { position: absolute; inset: 0; border: 1px solid #cdcdcb40; border-radius: 50%; }.focus-shapes > span:nth-child(2) { inset: 15%; }.focus-shapes > span:nth-child(3) { inset: 30%; border-color: #e56515; background: #e56515; }.focus-shapes > b { position: absolute; inset: 0; display: grid; place-items: center; color: #1c160f; font: 400 35px var(--font-serif); }
.editorial-art--notes { background: #593722; }.notes-shapes { position: absolute; inset: 23% 13% auto; display: flex; }.notes-shapes > span { position: relative; display: block; width: 140px; height: 125px; padding: 20px; transform: rotate(-12deg); background: #ded3b9; box-shadow: 0 12px 20px #0003; color: #423320; font-size: 10px; }.notes-shapes > span:last-child { background: #e18b4b; transform: rotate(9deg) translate(-20px, 12px); }.notes-shapes em { font: italic 24px var(--font-serif); }.notes-shapes b { position: absolute; bottom: 10px; right: 14px; font-size: 23px; font-weight: 400; }
@media (max-width: 760px) { .art-caption { font-size: 25px; }.editorial-art { padding: 20px; }.art-caption { left: 20px; bottom: 20px; } }
@media (min-width: 761px) and (max-width: 1050px) { .editorial-art { padding: 17px; }.art-caption { left: 17px; bottom: 17px; font-size: 23px; } }
/* Mini motion dos cards do blog: só transform/opacity, cada loop termina no estado em que começa. */
.motion { display: none; }
.editorial-art--animated:not(.is-visible) * { animation-play-state: paused !important; }
@media (prefers-reduced-motion: no-preference) {
  .editorial-art--animated .motion { display: block; }
  /* orbit: um satélite percorre a órbita e passa atrás do planeta */
  .orbit-sat { position: absolute; inset: 15%; transform: rotate(-35deg) scaleX(1.3); }
  .orbit-sat > i { position: absolute; inset: 0; animation: art-spin 8s linear infinite; }
  .orbit-sat > i::before { content: ''; position: absolute; top: -4px; left: calc(50% - 4px); width: 8px; height: 8px; border-radius: 50%; background: #ffe0b6; box-shadow: 0 0 10px #ffe0b6aa; }
  /* calendar: o destaque caminha pelos dias da semana */
  .editorial-art--animated .calendar-shape > div:nth-child(2) { position: relative; isolation: isolate; }
  .editorial-art--animated .calendar-shape > div:nth-child(2) > span:nth-child(3) { background: none; color: inherit; }
  .cal-dot { position: absolute; z-index: -1; top: 0; left: 0; width: calc((100% - 24px) / 5); height: 100%; border-radius: 50%; background: #e56515; animation: cal-walk 8s var(--ease, ease) infinite; }
  /* tasks: o último item é marcado como feito */
  .editorial-art--animated .task-shapes > span:last-child > i { display: grid; }
  .editorial-art--animated .task-shapes > span:last-child > i > * { grid-area: 1 / 1; }
  .editorial-art--animated .task-shapes > span:last-child > i > :first-child { animation: task-circle 6s ease infinite; }
  .task-tick { animation: task-tick 6s ease infinite; }
  .editorial-art--animated .task-shapes b { animation: task-nudge 6s ease infinite; }
  /* team: avatares respiram em sequência e alguém está digitando */
  .editorial-art--animated .team-shapes > span { --y: 0px; animation: team-bob 6s ease-in-out infinite; }
  .editorial-art--animated .team-shapes > span:nth-child(2) { --y: -10px; animation-delay: -2s; }
  .editorial-art--animated .team-shapes > span:nth-child(3) { --y: 10px; animation-delay: -4s; }
  .editorial-art--animated .team-bubble { position: absolute; z-index: 2; top: -30px; right: 22%; display: flex; gap: 4px; padding: 9px 11px; border-radius: 14px 14px 14px 3px; background: #f1ede2; box-shadow: 0 8px 18px #20252022; transform-origin: 0 100%; animation: team-bubble 6s ease infinite; }
  .team-bubble > i { width: 5px; height: 5px; border-radius: 50%; background: #605b4f; animation: team-dot 1.5s ease-in-out infinite; }
  .team-bubble > i:nth-child(2) { animation-delay: .2s; }
  .team-bubble > i:nth-child(3) { animation-delay: .4s; }
  /* board: um cartão avança de coluna em coluna */
  .editorial-art--animated .board-shapes > div:nth-child(2) { position: relative; }
  .editorial-art--animated .board-shapes > div:nth-child(odd) > span:nth-of-type(2) { opacity: 0; }
  .board-mover { position: absolute; width: 100%; box-shadow: 0 8px 16px #0005; animation: board-move 8s var(--ease, ease) infinite; }
  /* wiki: as linhas da página vão sendo escritas */
  .editorial-art--animated .wiki-shapes i { transform-origin: 0 50%; animation: wiki-line 8s ease infinite; }
  .editorial-art--animated .wiki-shapes i:nth-of-type(2) { animation-delay: -7.6s; }
  .editorial-art--animated .wiki-shapes i:nth-of-type(3) { animation-delay: -7.2s; }
  /* focus: ondas calmas saindo do centro */
  .focus-ripple { position: absolute; inset: 30%; border: 1px solid #e56515; border-radius: 50%; animation: focus-ripple 6s ease-out infinite; }
  .focus-ripple + .focus-ripple { animation-delay: -3s; }
  /* notes: as notas flutuam e o rascunho ainda está sendo escrito */
  .editorial-art--animated .notes-shapes > span { --r: -12deg; --tx: 0px; --ty: 0px; animation: notes-float 7s ease-in-out infinite; }
  .editorial-art--animated .notes-shapes > span:last-child { --r: 9deg; --tx: -20px; --ty: 12px; animation-delay: -3.5s; }
  .editorial-art--animated .notes-caret { display: inline-block; width: 1.5px; height: 18px; margin-left: 3px; vertical-align: -3px; background: currentColor; animation: notes-caret 1.2s steps(1) infinite; }
}
@keyframes art-spin { to { transform: rotate(360deg); } }
@keyframes cal-walk { 0% { transform: translateX(0); opacity: 0; } 6%, 18% { transform: translateX(0); opacity: 1; } 24%, 36% { transform: translateX(calc(100% + 6px)); } 42%, 54% { transform: translateX(calc(200% + 12px)); } 60%, 72% { transform: translateX(calc(300% + 18px)); } 78%, 92% { transform: translateX(calc(400% + 24px)); opacity: 1; } 100% { transform: translateX(calc(400% + 24px)); opacity: 0; } }
@keyframes task-circle { 0%, 30% { opacity: 1; } 36%, 84% { opacity: 0; } 94%, 100% { opacity: 1; } }
@keyframes task-tick { 0%, 30% { opacity: 0; transform: scale(.4); } 35% { opacity: 1; transform: scale(1.2); } 40%, 84% { opacity: 1; transform: none; } 94%, 100% { opacity: 0; transform: scale(.4); } }
@keyframes task-nudge { 0%, 34% { transform: none; } 42%, 80% { transform: translate(3px, -3px); } 92%, 100% { transform: none; } }
@keyframes team-bob { 0%, 100% { transform: translateY(var(--y)); } 50% { transform: translateY(calc(var(--y) - 5px)); } }
@keyframes team-bubble { 0%, 8% { opacity: 0; transform: scale(.6); } 16%, 80% { opacity: 1; transform: none; } 90%, 100% { opacity: 0; transform: scale(.6); } }
@keyframes team-dot { 0%, 100% { opacity: .35; transform: none; } 30% { opacity: 1; transform: translateY(-2px); } }
@keyframes board-move { 0% { transform: translateX(calc(-100% - 10px)); opacity: 0; } 6%, 26% { transform: translateX(calc(-100% - 10px)); opacity: 1; } 34% { transform: translate(-50%, -4px) rotate(3deg); } 42%, 60% { transform: none; } 68% { transform: translate(calc(50% + 5px), -4px) rotate(3deg); } 76%, 92% { transform: translateX(calc(100% + 10px)); opacity: 1; } 100% { transform: translateX(calc(100% + 10px)); opacity: 0; } }
@keyframes wiki-line { 0%, 5% { transform: scaleX(0); opacity: 1; } 20%, 80% { transform: none; opacity: 1; } 90%, 100% { transform: none; opacity: 0; } }
@keyframes focus-ripple { 0% { transform: scale(1); opacity: .8; } 100% { transform: scale(2.3); opacity: 0; } }
@keyframes notes-float { 0%, 100% { transform: rotate(var(--r)) translate(var(--tx), var(--ty)); } 50% { transform: rotate(calc(var(--r) + 2deg)) translate(var(--tx), calc(var(--ty) - 5px)); } }
@keyframes notes-caret { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
</style>
