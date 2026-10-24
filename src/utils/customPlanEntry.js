export const CUSTOM_PLAN_PATH = '/precos/personalizado'

let pendingEntries = 0

// Mantém este fluxo nos botões Enterprise e permite recarregar a entrada atual.
// É controle de navegação, sem servir de autorização para dados privados.
export async function openCustomPlan(router) {
  pendingEntries++
  try {
    return await router.push({ path: CUSTOM_PLAN_PATH, state: { customPlanEntry: true } })
  } finally {
    pendingEntries--
  }
}

export function canEnterCustomPlan() {
  return pendingEntries > 0 || (typeof window !== 'undefined'
    && window.location.pathname === CUSTOM_PLAN_PATH
    && window.history.state?.customPlanEntry === true)
}
