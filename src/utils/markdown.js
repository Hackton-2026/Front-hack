// Markdown simples da Wiki e das tarefas (sem dependência): títulos, negrito, itálico, sublinhado (++x++), imagem, código, listas, checklist,
// citação, divisória, tabelas e links. O texto é escapado antes, então HTML digitado não vira HTML de verdade.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>')
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}

// Títulos do documento (para o sumário)
export const outline = (md) => md.split('\n').map((l) => l.match(/^(#{1,3}) (.+)/)).filter(Boolean).map(([, h, t]) => ({ level: h.length, text: t.trim(), id: slug(t) }))

export function render(md) {
  const lines = md.split('\n')
  const out = []
  let list = null // 'ul' | 'ol'
  const close = () => { if (list) { out.push(`</${list}>`); list = null } }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      close()
      const code = []
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(esc(lines[i]))
      out.push(`<pre><code>${code.join('\n')}</code></pre>`)
      continue
    }
    // tabela: linhas seguidas começando com "|"; a 2ª linha "|---|---|" separa o cabeçalho
    if (line.trim().startsWith('|')) {
      close()
      const rows = []
      for (; i < lines.length && lines[i].trim().startsWith('|'); i++) rows.push(lines[i])
      i--
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()))
      const isSep = (r) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(r.trim())
      const head = rows.length > 1 && isSep(rows[1]) ? cells(rows[0]) : null
      const body = (head ? rows.slice(2) : rows).filter((r) => !isSep(r)).map(cells)
      out.push(`<div class="md-table"><table>${head ? `<thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead>` : ''}<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
      continue
    }
    let m
    if ((m = line.match(/^(#{1,3}) (.+)/))) { close(); out.push(`<h${m[1].length} id="${slug(m[2])}">${inline(m[2])}</h${m[1].length}>`) }
    else if ((m = line.match(/^\s*[-*] \[( |x)\] (.*)/i))) {
      if (list !== 'ul') { close(); out.push('<ul class="md-check">'); list = 'ul' }
      out.push(`<li><input type="checkbox" data-line="${i}"${m[1].trim() ? ' checked' : ''} aria-label="Marcar item" /> ${inline(m[2])}</li>`)
    } else if ((m = line.match(/^\s*[-*] (.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul' } out.push(`<li>${inline(m[1])}</li>`) }
    else if ((m = line.match(/^\s*\d+\. (.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol' } out.push(`<li>${inline(m[1])}</li>`) }
    else if ((m = line.match(/^> ?(.*)/))) { close(); out.push(`<blockquote>${inline(m[1])}</blockquote>`) }
    else if (/^(-{3,}|\*{3,})$/.test(line.trim())) { close(); out.push('<hr />') }
    else if (!line.trim()) close()
    else { close(); out.push(`<p>${inline(line)}</p>`) }
  }
  close()
  return out.join('\n')
}

// Marca/desmarca o item de checklist da linha `index`
export const toggleCheck = (md, index) => md.split('\n').map((l, i) => (i === index ? l.replace(/\[( |x)\]/i, (_, c) => (c.trim() ? '[ ]' : '[x]')) : l)).join('\n')
