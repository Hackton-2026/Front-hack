const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const DB_VIEWS = { table: 'Tabela', board: 'Quadro', gallery: 'Galeria', list: 'Lista', calendar: 'Calendário', timeline: 'Linha do tempo' }

const iso = (d) => d.toISOString().slice(0, 10)
const addDays = (s, n) => { const d = new Date(`${s}T12:00`); d.setDate(d.getDate() + n); return iso(d) }
const short = (s) => new Date(`${s}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

export function dbView(view, tasks, title, h) {
  const st = (t) => h.STATUSES.find((s) => s.id === t.status) || h.STATUSES[0]
  const pr = (t) => h.PRIORITIES.find((p) => p.id === t.priority)
  const dot = (t) => `<i class="db-dot" style="--c:${st(t).color}" title="${esc(st(t).name)}"></i>`
  const due = (t) => (t.due ? `<span class="db-due${t.due < h.today && t.status !== 'done' ? ' late' : ''}">${short(t.due)}</span>` : '')
  const who = (t) => t.assignees.map((id) => esc(h.member(id)?.name)).filter(Boolean).join(', ')
  const name = (t) => `<span class="db-code">${esc(h.code(t))}</span> ${esc(t.title)}`
  const card = (t) => `<button type="button" class="db-card" data-task="${t.id}">${dot(t)}<strong>${esc(t.title)}</strong><small>${esc(h.code(t))}${t.due ? `, ${short(t.due)}` : ''}</small>${t.tags.length ? `<span class="db-tags">${t.tags.map((g) => `<em>#${esc(g)}</em>`).join('')}</span>` : ''}</button>`
  let body
  if (!tasks.length) body = '<p class="db-empty">Nenhuma tarefa aqui ainda.</p>'
  else if (view === 'table') {
    body = `<div class="md-table"><table><thead><tr><th>Tarefa</th><th>Status</th><th>Prioridade</th><th>Prazo</th><th>Responsáveis</th><th>Projeto</th></tr></thead><tbody>${tasks.map((t) =>
      `<tr data-task="${t.id}"><td>${name(t)}</td><td>${dot(t)} ${esc(st(t).name)}</td><td>${esc(pr(t)?.name || '—')}</td><td>${due(t) || '—'}</td><td>${who(t) || '—'}</td><td>${esc(h.project(t.projectId)?.name || '—')}</td></tr>`).join('')}</tbody></table></div>`
  } else if (view === 'board') {
    body = `<div class="db-board">${h.STATUSES.map((s) => { const col = tasks.filter((t) => t.status === s.id); return `<div class="db-col"><h4><i class="db-dot" style="--c:${s.color}"></i>${esc(s.name)} <small>${col.length}</small></h4>${col.map(card).join('')}</div>` }).join('')}</div>`
  } else if (view === 'gallery') {
    body = `<div class="db-gallery">${tasks.map(card).join('')}</div>`
  } else if (view === 'calendar') {
    const first = `${h.today.slice(0, 8)}01`
    const start = addDays(first, -new Date(`${first}T12:00`).getDay())
    const days = Array.from({ length: 42 }, (_, k) => addDays(start, k))
    body = `<div class="db-cal"><b>${new Date(`${first}T12:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</b><div class="db-cal__grid">${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => `<span class="db-cal__wd">${d}</span>`).join('')}${days.map((d) =>
      `<div class="db-cal__day${d.slice(0, 7) !== first.slice(0, 7) ? ' out' : ''}${d === h.today ? ' today' : ''}"><span>${Number(d.slice(8))}</span>${tasks.filter((t) => t.due === d).map((t) => `<button type="button" data-task="${t.id}">${dot(t)}${esc(t.title)}</button>`).join('')}</div>`).join('')}</div></div>`
  } else if (view === 'timeline') {
    const from = addDays(h.today, -7), span = 35
    const pos = (s) => Math.min(span, Math.max(0, Math.round((new Date(`${s}T12:00`) - new Date(`${from}T12:00`)) / 864e5)))
    const dated = tasks.filter((t) => t.due || t.start)
    body = dated.length
      ? `<div class="db-tl" style="--span:${span}"><span class="db-tl__today" style="--x:${pos(h.today)}"></span>${dated.map((t) => { const a = pos(t.start || t.due), b = Math.max(a + 1, pos(t.due || t.start) + 1); return `<div class="db-tl__row" data-task="${t.id}"><span class="db-tl__name">${esc(t.title)}</span><span class="db-tl__track"><i style="--a:${a};--b:${b};--c:${st(t).color}"></i></span></div>` }).join('')}<div class="db-tl__axis"><span>${short(from)}</span><span>hoje</span><span>${short(addDays(from, span))}</span></div></div>`
      : '<p class="db-empty">Nenhuma tarefa com data. Dê um prazo para ela aparecer na linha do tempo.</p>'
  } else {
    body = `<ul class="db-list">${tasks.map((t) => `<li data-task="${t.id}">${dot(t)}${name(t)}${due(t)}</li>`).join('')}</ul>`
  }
  return `<div class="md-db" data-view="${esc(view)}"><header><strong>${esc(title)}</strong><small>${esc(DB_VIEWS[view] || 'Lista')}, ${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}</small></header>${body}</div>`
}
