// Importar páginas para a Wiki (como o "Importar" do Notion): texto e Markdown, HTML, CSV, Word (.docx),
// exportação do Notion (.zip com .md e .csv) e Evernote (.enex). Tudo no navegador, sem dependência.
// Cada arquivo vira { title, body } em markdown.
import { parseCsv } from './csv'

export const IMPORT_KINDS = [
  { id: 'md', label: 'Texto e Markdown', hint: '.md, .txt', accept: '.md,.markdown,.txt,text/plain,text/markdown' },
  { id: 'html', label: 'HTML', hint: '.html', accept: '.html,.htm,text/html' },
  { id: 'csv', label: 'CSV', hint: 'vira uma tabela', accept: '.csv,text/csv' },
  { id: 'docx', label: 'Word', hint: '.docx', accept: '.docx' },
  { id: 'notion', label: 'Notion', hint: 'exportação em Markdown (.zip)', accept: '.zip' },
  { id: 'enex', label: 'Evernote', hint: '.enex', accept: '.enex' },
]

const dec = new TextDecoder()
const baseName = (n) => n.split('/').pop().replace(/\.[^.]+$/, '').replace(/\s+[0-9a-f]{32}$/i, '').trim() || 'Sem título' // Notion põe um id no fim do nome

// ---- zip (só o que precisamos: ler os arquivos; deflate pelo DecompressionStream do navegador)
export async function unzip(buf) {
  const v = new DataView(buf)
  let end = buf.byteLength - 22
  while (end >= 0 && v.getUint32(end, true) !== 0x06054b50) end--
  if (end < 0) throw new Error('Arquivo .zip inválido.')
  const count = v.getUint16(end + 10, true)
  let p = v.getUint32(end + 16, true)
  const files = new Map()
  for (let k = 0; k < count; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) break
    const method = v.getUint16(p + 10, true)
    const size = v.getUint32(p + 20, true)
    const nameLen = v.getUint16(p + 28, true), extraLen = v.getUint16(p + 30, true), commentLen = v.getUint16(p + 32, true)
    const local = v.getUint32(p + 42, true)
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen))
    p += 46 + nameLen + extraLen + commentLen
    if (name.endsWith('/')) continue
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true)
    const raw = new Uint8Array(buf, start, size)
    if (method === 0) files.set(name, raw.slice())
    else if (method === 8) files.set(name, new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()))
  }
  return files
}

// ---- HTML → markdown (títulos, parágrafos, listas, links, imagens, negrito/itálico, código, citação, tabelas)
export function htmlToMd(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const inl = (n) => [...n.childNodes].map((c) => {
    if (c.nodeType === 3) return c.textContent.replace(/\s+/g, ' ')
    if (c.nodeType !== 1) return ''
    const t = c.tagName.toLowerCase()
    if (t === 'script' || t === 'style') return ''
    const x = inl(c)
    if (t === 'strong' || t === 'b') return x.trim() ? `**${x.trim()}**` : ''
    if (t === 'em' || t === 'i') return x.trim() ? `*${x.trim()}*` : ''
    if (t === 's' || t === 'del') return `~~${x}~~`
    if (t === 'u') return `++${x}++`
    if (t === 'code') return `\`${c.textContent}\``
    if (t === 'br') return ' '
    if (t === 'a') { const h = c.getAttribute('href') || ''; return /^https?:|^mailto:/.test(h) ? `[${x.trim() || h}](${h})` : x }
    if (t === 'img') { const s = c.getAttribute('src') || ''; return /^https:/.test(s) ? `![${c.getAttribute('alt') || ''}](${s})` : '' }
    return x
  }).join('')
  const out = []
  const walk = (n, depth = 0) => {
    for (const c of n.children) {
      const t = c.tagName.toLowerCase()
      if (/^h[1-6]$/.test(t)) out.push(`${'#'.repeat(Math.min(3, Number(t[1])))} ${inl(c).trim()}`, '')
      else if (t === 'p') { const x = inl(c).trim(); if (x) out.push(x, '') }
      else if (t === 'ul' || t === 'ol') {
        [...c.children].filter((li) => li.tagName === 'LI').forEach((li, k) => {
          const box = li.querySelector(':scope > input[type=checkbox]')
          const own = li.cloneNode(true) // só o texto do item, sem as sublistas
          own.querySelectorAll('ul,ol').forEach((x) => x.remove())
          const text = inl(own).trim()
          out.push(`${'  '.repeat(depth)}${box ? `- [${box.checked ? 'x' : ' '}] ` : t === 'ol' ? `${k + 1}. ` : '- '}${text}`)
          li.querySelectorAll(':scope > ul, :scope > ol').forEach((sub) => walk({ children: [sub] }, depth + 1))
        })
        if (!depth) out.push('')
      } else if (t === 'blockquote') { out.push(`> ${inl(c).trim()}`, '') }
      else if (t === 'pre') { out.push('```', c.textContent.replace(/\n$/, ''), '```', '') }
      else if (t === 'hr') out.push('---', '')
      else if (t === 'table') {
        const rows = [...c.querySelectorAll('tr')].map((r) => [...r.children].map((td) => inl(td).trim().replace(/\|/g, '/')))
        if (rows.length) out.push(`| ${rows[0].join(' | ')} |`, `|${rows[0].map(() => '---').join('|')}|`, ...rows.slice(1).map((r) => `| ${r.join(' | ')} |`), '')
      } else if (t === 'img') { const x = inl({ childNodes: [c] }); if (x) out.push(x, '') }
      else if (['div', 'section', 'article', 'main', 'body', 'header', 'footer', 'figure', 'en-note', 'span'].includes(t)) {
        if ([...c.children].some((k) => /^(p|div|h\d|ul|ol|table|pre|blockquote|hr)$/i.test(k.tagName))) walk(c, depth)
        else { const x = inl(c).trim(); if (x) out.push(x, '') }
      }
    }
  }
  walk(doc.body)
  return { title: doc.querySelector('title')?.textContent.trim() || doc.querySelector('h1')?.textContent.trim() || '', body: out.join('\n').replace(/\n{3,}/g, '\n\n').trim() }
}

export function csvToMd(text) {
  const rows = parseCsv(text).map((r) => r.map((c) => c.replace(/\|/g, '/').replace(/\n/g, ' ')))
  if (!rows.length) return ''
  const n = Math.max(...rows.map((r) => r.length))
  const pad = (r) => [...r, ...Array(n - r.length).fill('')]
  return [`| ${pad(rows[0]).join(' | ')} |`, `|${Array(n).fill('---').join('|')}|`, ...rows.slice(1).map((r) => `| ${pad(r).join(' | ')} |`)].join('\n')
}

// ---- Word: document.xml → markdown (títulos pelo estilo, listas, negrito/itálico, tabelas)
export async function docxToMd(buf) {
  const files = await unzip(buf)
  const xml = files.get('word/document.xml')
  if (!xml) throw new Error('Não parece um arquivo do Word (.docx).')
  const doc = new DOMParser().parseFromString(dec.decode(xml), 'application/xml')
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
  const kids = (n, tag) => [...n.childNodes].filter((c) => c.namespaceURI === W && c.localName === tag)
  const attr = (n, tag) => n && kids(n, tag)[0]?.getAttributeNS(W, 'val')
  const runs = (p) => [...p.getElementsByTagNameNS(W, 'r')].map((r) => {
    const t = [...r.childNodes].map((c) => (c.localName === 't' ? c.textContent : c.localName === 'tab' ? '\t' : c.localName === 'br' ? ' ' : '')).join('')
    const pr = kids(r, 'rPr')[0]
    const on = (tag) => pr && kids(pr, tag).length && attr(pr, tag) !== '0' && attr(pr, tag) !== 'false'
    if (!t.trim()) return t
    return on('b') && on('i') ? `***${t.trim()}*** ` : on('b') ? `**${t.trim()}** ` : on('i') ? `*${t.trim()}* ` : t
  }).join('').replace(/ +/g, ' ').trim()
  const para = (p) => {
    const pr = kids(p, 'pPr')[0]
    const style = (attr(pr, 'pStyle') || '').toLowerCase()
    const text = runs(p)
    if (!text) return ''
    const h = style.match(/^(?:heading|t[ií]tulo|ttulo)(\d)/) // o Word em português chama de "Ttulo1"
    if (h) return `${'#'.repeat(Math.min(3, Number(h[1])))} ${text}`
    if (style === 'title') return `# ${text}`
    if (pr && kids(pr, 'numPr').length) return `- ${text}`
    return text
  }
  const body = doc.getElementsByTagNameNS(W, 'body')[0]
  const out = []
  for (const n of body.childNodes) {
    if (n.localName === 'p') out.push(para(n), '')
    else if (n.localName === 'tbl') {
      const rows = kids(n, 'tr').map((tr) => kids(tr, 'tc').map((tc) => kids(tc, 'p').map(runs).join(' ').replace(/\|/g, '/')))
      if (rows.length) out.push(`| ${rows[0].join(' | ')} |`, `|${rows[0].map(() => '---').join('|')}|`, ...rows.slice(1).map((r) => `| ${r.join(' | ')} |`), '')
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/(^- .*)\n\n(?=- )/gm, '$1\n').trim()
}

const fromMd = (name, text) => {
  const h = text.match(/^# (.+)$/m)
  // o título do Notion vem no "# " da primeira linha: ele vira o título e sai do corpo
  return h && text.trimStart().startsWith(h[0]) ? { title: h[1].trim(), body: text.trimStart().slice(h[0].length).trim() } : { title: baseName(name), body: text.trim() }
}

// Lê os arquivos escolhidos e devolve as páginas
export async function importFiles(files) {
  const pages = []
  for (const f of files) {
    const ext = f.name.split('.').pop().toLowerCase()
    if (['md', 'markdown', 'txt'].includes(ext)) pages.push(fromMd(f.name, await f.text()))
    else if (ext === 'html' || ext === 'htm') { const r = htmlToMd(await f.text()); pages.push({ title: r.title || baseName(f.name), body: r.body }) }
    else if (ext === 'csv') pages.push({ title: baseName(f.name), body: csvToMd(await f.text()) })
    else if (ext === 'docx') pages.push({ title: baseName(f.name), body: await docxToMd(await f.arrayBuffer()) })
    else if (ext === 'enex') {
      const x = new DOMParser().parseFromString(await f.text(), 'application/xml')
      for (const note of x.getElementsByTagName('note')) {
        const r = htmlToMd(note.getElementsByTagName('content')[0]?.textContent || '')
        pages.push({ title: note.getElementsByTagName('title')[0]?.textContent.trim() || 'Sem título', body: r.body })
      }
    } else if (ext === 'zip') pages.push(...(await fromZip(await f.arrayBuffer())))
    else throw new Error(`Não sei importar "${f.name}".`)
  }
  return pages
}
async function fromZip(buf, depth = 0) {
  const pages = []
  for (const [name, data] of await unzip(buf)) {
    const ext = name.split('.').pop().toLowerCase()
    if (ext === 'md') pages.push(fromMd(name, dec.decode(data)))
    else if (ext === 'csv' && !name.endsWith('_all.csv')) pages.push({ title: baseName(name), body: csvToMd(dec.decode(data)) })
    else if (ext === 'html') { const r = htmlToMd(dec.decode(data)); pages.push({ title: r.title || baseName(name), body: r.body }) }
    else if (ext === 'zip' && depth < 2) pages.push(...(await fromZip(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), depth + 1))) // o Notion às vezes põe um zip dentro do outro
  }
  if (!pages.length) throw new Error('O .zip não tem páginas em Markdown, CSV ou HTML.')
  return pages
}
