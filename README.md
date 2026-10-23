# Front-hack (Novexo)

Frontend do Novexo em Vue 3 + Vite. A API fica no [Back-hack](https://github.com/Hackton-2026/Back-hack).

```bash
npm install
cp .env.example .env   # VITE_GOOGLE_CLIENT_ID = o mesmo GOOGLE_CLIENT_ID do backend
npm run dev            # http://localhost:5173 (repassa /api e /media para o Django em :8000)
```

## Branches

- `main`: versão estável. Só recebe merge vindo da `dev`.
- `dev`: integração. Toda branch nova sai daqui e volta para cá por pull request.
- `nome-da-feature` (ex.: `landing-page`): uma branch por funcionalidade, criada a partir da `dev`.

## Estrutura

- `src/views/`: páginas (`LandingView`, `LoginView`…)
- `src/components/`: componentes reutilizáveis; `GooeyButton` é o botão universal do site
- `src/components/landing/`: seções da landing (`SiteNav`, `HeroParallax`, `PricingPlans`, `ContactCta`, `SiteFooter`)
- `src/assets/landing/`: imagens da landing (camadas do parallax e foto do rodapé)
- `src/components/app/` e `src/views/`: área logada (casca, projetos em Lista/Quadro/Calendário, painel da tarefa, Ctrl K…)
- Menu do projeto como no Plane: visão geral, itens de trabalho, ciclos (burn-down), módulos, visões salvas e páginas; o "Mais" do workspace tem visões, ciclos ativos, análises, arquivados e painéis. Personalizar navegação (o que fica na barra lateral) é pessoal e fica no navegador
- `src/composables/useWorkspace.js`: dados da área logada. Projetos, tarefas, checklist, membros, atividade e caixa de entrada vêm da API do Back-hack (`/api/...`, branch `dev`); rascunhos, wiki e preferências ficam no navegador

A área logada exige login e o Back-hack rodando em `:8000`.
