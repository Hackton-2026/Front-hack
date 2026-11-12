// Quem concluiu o quê e quando, para a quinzena e o mapa do ano na Visão geral e a lista em Membros.
// O crédito vai para os responsáveis da tarefa; sem responsável, para quem criou.

export const dayKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export const doneTasks = (tasks) => tasks.filter((t) => t.status === 'done' && t.completedAt)

export const creditedTo = (t) => (t.assignees?.length ? t.assignees : t.creator ? [t.creator] : [])

// os últimos `n` dias até `end` (inclusive), em ordem, como 'AAAA-MM-DD' no fuso do navegador
export function lastDays(n, end = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(end)
    d.setDate(d.getDate() - (n - 1 - i))
    return dayKey(d)
  })
}

// dias seguidos com ao menos uma tarefa concluída (`days` em ordem)
export function longestStreak(days, count) {
  let best = 0
  let run = 0
  for (const d of days) {
    run = count(d) ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

// 'AAAA-MM-DD' -> "13 nov"
export const shortDay = (key) => new Date(`${key}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
