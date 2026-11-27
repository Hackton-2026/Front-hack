<script setup>
import TutorialGuidePage from '../components/landing/TutorialGuidePage.vue'

const steps = [
  {
    title: 'Escolha a ferramenta',
    text: 'A proposta é reunir as conexões na aba Integrações dos Ajustes. Google Meet e Discord são exemplos de ferramentas previstas para esse espaço.',
    caption: 'Escolher uma ferramenta para conectar',
    video: '/tutoriais/integracoes/passo-1.mp4',
  },
  {
    title: 'Conecte a conta',
    text: 'No fluxo previsto, você autoriza a conexão na ferramenta escolhida e revisa as permissões solicitadas. A conexão deve ser feita com a conta que você pretende usar no trabalho.',
    caption: 'Autorizar a conexão com uma conta externa',
    video: '/tutoriais/integracoes/passo-2.mp4',
  },
  {
    title: 'Defina como usar no projeto',
    text: 'Exemplos de uso a configurar são vincular reuniões do Google Meet ao projeto ou enviar avisos para um canal do Discord. Cada ferramenta terá suas próprias opções.',
    caption: 'Configurar o uso da integração no projeto',
    video: '/tutoriais/integracoes/passo-3.mp4',
  },
]
</script>

<template>
  <TutorialGuidePage
    guide-class="integracoestutorial-guide"
    id-prefix="integracoestutorial-step"
    page-title="Integrações | Novexo"
    title="Como funcionam as"
    emphasis="integrações"
    lead="Conexões com ferramentas externas, como Google Meet e Discord, para usar junto dos seus projetos."
    availability="Em preparação. Exemplos do fluxo previsto."
    :steps="steps"
    end-note="As conexões externas ainda não estão disponíveis nesta versão. Esta página apresenta os usos previstos; não realiza a conexão com Google Meet ou Discord."
    cta-label="Abrir ajustes"
    cta-to="/ajustes"
  />
</template>
