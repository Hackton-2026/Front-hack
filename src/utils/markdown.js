export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function inline(s, ctx = {}) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>')
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+|data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[\[([\w-]+)\|([^\]]*)\]\]/g, (_, id, t) => `<a href="?doc=${id}" class="md-page" data-doc="${id}">📄 ${ctx.docTitle?.(id) ? esc(ctx.docTitle(id)) : t || 'Sem título'}</a>`)
}

export const outline = (md) => md.split('\n').map((l) => l.match(/^(#{1,3}) (.+)/)).filter(Boolean).map(([, h, t]) => ({ level: h.length, text: t.trim(), id: slug(t) }))

const https = (u) => /^https:\/\/[^\s"<>]+$/.test(u)
function video(u) {
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)
  const vimeo = u.match(/vimeo\.com\/(\d+)/)
  const src = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : ''
  return src ? `<div class="md-video"><iframe src="${src}" title="Vídeo" loading="lazy" allowfullscreen></iframe></div>` : `<video class="md-media" src="${esc(u)}" controls preload="metadata"></video>`
}
const EMBEDS = [
  ['Google Drive', /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\/([\w-]+)/, (m) => `https://docs.google.com/${m[1]}/d/${m[2]}/${m[1] === 'forms' ? 'viewform?embedded=true' : 'preview'}`],
  ['Google Drive', /^https:\/\/drive\.google\.com\/file\/d\/([\w-]+)/, (m) => `https://drive.google.com/file/d/${m[1]}/preview`],
  ['Figma', /^https:\/\/(?:www\.)?figma\.com\/(?:file|design|proto|board)\//, (m, u) => `https://www.figma.com/embed?embed_host=novexo&url=${encodeURIComponent(u)}`],
  ['Loom', /^https:\/\/(?:www\.)?loom\.com\/share\/([\w]+)/, (m) => `https://www.loom.com/embed/${m[1]}`],
  ['Miro', /^https:\/\/miro\.com\/app\/board\/([\w=-]+)/, (m) => `https://miro.com/app/live-embed/${m[1]}/`],
  ['CodePen', /^https:\/\/codepen\.io\/([\w-]+)\/(?:pen|full)\/([\w]+)/, (m) => `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`],
  ['Spotify', /^https:\/\/open\.spotify\.com\/(track|album|playlist|episode|show)\/([\w]+)/, (m) => `https://open.spotify.com/embed/${m[1]}/${m[2]}`],
  ['X (Twitter)', /^https:\/\/(?:www\.)?(?:twitter|x)\.com\/\w+\/status\/(\d+)/, (m) => `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&theme=dark`],
  ['Typeform', /^https:\/\/[\w-]+\.typeform\.com\/to\/[\w]+/, (m, u) => u],
  ['Excalidraw', /^https:\/\/excalidraw\.com\//, (m, u) => u],
  ['PDF', /^https:\/\/\S+\.pdf(?:[?#]\S*)?$/i, (m, u) => u],
]
function embed(u) {
  const host = esc(new URL(u).hostname.replace(/^www\./, ''))
  const gist = u.match(/^https:\/\/gist\.github\.com\/([\w-]+)\/([\da-f]+)/)
  if (gist) return `<div class="md-embed"><iframe sandbox="allow-scripts allow-popups" title="GitHub Gist" srcdoc="${esc(`<base target="_blank"><style>body{margin:0}</style><script src="https://gist.github.com/${gist[1]}/${gist[2]}.js"></script>`)}"></iframe><a href="${esc(u)}" target="_blank" rel="noopener">GitHub Gist ↗</a></div>`
  const hit = EMBEDS.map(([name, re, to]) => { const m = u.match(re); return m && [name, to(m, u)] }).find(Boolean)
  const [name, src] = hit || [host, u]
  return `<div class="md-embed"><iframe src="${esc(src)}" title="${esc(name)}" loading="lazy" allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"></iframe><a href="${esc(u)}" target="_blank" rel="noopener">${esc(name)} ↗</a></div>`
}

function media(kind, arg) {
  if (kind === 'map') return arg.trim() ? `<div class="md-embed"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(arg)}&output=embed" title="Mapa" loading="lazy"></iframe><a href="https://maps.google.com/maps?q=${encodeURIComponent(arg)}" target="_blank" rel="noopener">Google Maps ↗</a></div>` : '<p class="md-empty">Escreva um endereço em @[map](…)</p>'
  if (!https(arg)) return `<p class="md-empty">Cole um link https:// em @[${esc(kind)}](…)</p>`
  const name = esc(decodeURIComponent(arg.split('/').pop().split('?')[0]) || arg)
  const host = esc(new URL(arg).hostname.replace(/^www\./, ''))
  if (kind === 'video') return video(arg)
  if (kind === 'embed') return embed(arg)
  if (kind === 'audio') return `<audio class="md-media" src="${esc(arg)}" controls preload="metadata"></audio>`
  if (kind === 'file') return `<a class="md-file" href="${esc(arg)}" target="_blank" rel="noopener" download>📎 <span>${name}</span><small>${host}</small></a>`
  return `<a class="md-bookmark" href="${esc(arg)}" target="_blank" rel="noopener"><strong>${host}</strong><small>${esc(arg)}</small></a>`
}

export function render(md, ctx = {}, base = 0) {
  const lines = md.split('\n')
  const out = []
  let list = null
  const close = () => { if (list) { out.push(`</${list}>`); list = null } }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      close()
      const lang = esc(line.slice(3).trim())
      const code = []
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(esc(lines[i]))
      out.push(`<pre${lang ? ` data-lang="${lang}"` : ''}><code>${code.join('\n')}</code></pre>`)
      continue
    }
    if (line.trim() === '$$') {
      close()
      const tex = []
      while (++i < lines.length && lines[i].trim() !== '$$') tex.push(lines[i])
      out.push(`<div class="md-math" data-tex="${esc(tex.join('\n'))}">${esc(tex.join('\n'))}</div>`)
      continue
    }
    let m = line.match(/^:::(toggle|callout|columns)\s*(.*)$/)
    if (m) {
      close()
      const start = i + 1
      let depth = 1
      while (++i < lines.length) {
        if (/^:::(toggle|callout|columns)/.test(lines[i])) depth++
        else if (lines[i].trim() === ':::' && !--depth) break
      }
      const inner = lines.slice(start, i)
      const sub = (from, to) => render(inner.slice(from, to).join('\n'), ctx, base + start + from)
      if (m[1] === 'toggle') {
        const h = m[2].match(/^(#{1,3}) (.*)/)
        const title = h ? `<h${h[1].length} id="${slug(h[2])}">${inline(h[2], ctx)}</h${h[1].length}>` : `<span>${inline(m[2] || 'Alternância', ctx)}</span>`
        out.push(`<details class="md-toggle"><summary>${title}</summary><div>${sub(0)}</div></details>`)
      } else if (m[1] === 'callout') {
        out.push(`<div class="md-callout"><span class="md-callout__icon">${esc(m[2] || '💡')}</span><div>${sub(0)}</div></div>`)
      } else {
        const cols = []
        let from = 0
        inner.forEach((l, k) => { if (l.trim() === '|||') { cols.push(sub(from, k)); from = k + 1 } })
        cols.push(sub(from))
        out.push(`<div class="md-cols" style="--n:${cols.length}">${cols.map((c) => `<div>${c}</div>`).join('')}</div>`)
      }
      continue
    }
    if ((m = line.match(/^@\[([\w:]+)\]\(([^)]*)\)\s*$/))) {
      close()
      const html = ctx.embed?.(m[1], m[2].trim())
      out.push(html ?? (['video', 'audio', 'file', 'bookmark', 'embed', 'map'].includes(m[1]) ? media(m[1], m[2].trim()) : `<p class="md-empty">Bloco ${esc(m[1])} indisponível aqui.</p>`))
      continue
    }
    if (line.trim() === '[toc]') {
      close()
      const items = outline(md)
      out.push(`<nav class="md-toc">${items.length ? items.map((h) => `<a href="#${h.id}" style="--l:${h.level}">${esc(h.text)}</a>`).join('') : '<span>Adicione títulos para montar o sumário.</span>'}</nav>`)
      continue
    }
    if (line.trim().startsWith('|') && line.trim() !== '|||') {
      close()
      const rows = []
      for (; i < lines.length && lines[i].trim().startsWith('|'); i++) rows.push(lines[i])
      i--
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim(), ctx))
      const isSep = (r) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(r.trim())
      const head = rows.length > 1 && isSep(rows[1]) ? cells(rows[0]) : null
      const body = (head ? rows.slice(2) : rows).filter((r) => !isSep(r)).map(cells)
      out.push(`<div class="md-table"><table>${head ? `<thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead>` : ''}<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
      continue
    }
    if ((m = line.match(/^(#{1,3}) (.+)/))) { close(); out.push(`<h${m[1].length} id="${slug(m[2])}">${inline(m[2], ctx)}</h${m[1].length}>`) }
    else if ((m = line.match(/^\s*[-*] \[( |x)\] (.*)/i))) {
      if (list !== 'ul') { close(); out.push('<ul class="md-check">'); list = 'ul' }
      out.push(`<li><input type="checkbox" data-line="${base + i}"${m[1].trim() ? ' checked' : ''} aria-label="Marcar item" /> ${inline(m[2], ctx)}</li>`)
    } else if ((m = line.match(/^\s*[-*] (.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul' } out.push(`<li>${inline(m[1], ctx)}</li>`) }
    else if ((m = line.match(/^\s*\d+\. (.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol' } out.push(`<li>${inline(m[1], ctx)}</li>`) }
    else if ((m = line.match(/^> ?(.*)/))) { close(); out.push(`<blockquote>${inline(m[1], ctx)}</blockquote>`) }
    else if (/^(-{3,}|\*{3,})$/.test(line.trim())) { close(); out.push('<hr />') }
    else if (!line.trim()) close()
    else { close(); out.push(`<p>${inline(line, ctx)}</p>`) }
  }
  close()
  return out.join('\n')
}

export const toggleCheck = (md, index) => md.split('\n').map((l, i) => (i === index ? l.replace(/\[( |x)\]/i, (_, c) => (c.trim() ? '[ ]' : '[x]')) : l)).join('\n')
