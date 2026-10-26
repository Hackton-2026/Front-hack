const PRIORITY = { urgente: 'urgent', alta: 'high', normal: 'normal', baixa: 'low' }
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function parseQuick(text, now = new Date()) {
  const tags = []
  let priority = ''
  let due = null
  const words = []
  for (const w of text.trim().split(/\s+/)) {
    const low = w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (/^#[\p{L}\p{N}_-]+$/u.test(w)) { tags.push(w.slice(1).toLowerCase()); continue }
    if (low.startsWith('!') && PRIORITY[low.slice(1)]) { priority = PRIORITY[low.slice(1)]; continue }
    if (low === 'hoje' || low === 'amanha') { const d = new Date(now); d.setDate(d.getDate() + (low === 'hoje' ? 0 : 1)); due = iso(d); continue }
    const m = low.match(/^(\d{1,2})\/(\d{1,2})$/)
    if (m && +m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12) {
      const d = new Date(now.getFullYear(), +m[2] - 1, +m[1])
      if (iso(d) < iso(now)) d.setFullYear(d.getFullYear() + 1)
      due = iso(d)
      continue
    }
    if (w) words.push(w)
  }
  return { title: words.join(' '), tags: [...new Set(tags)], priority, due }
}
