// CSV simples (aspas duplas escapam vírgula, quebra de linha e aspas). O separador é , ou ; (Excel em português usa ;).
export function toCsv(rows) {
  const cell = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\n') // BOM: o Excel lê os acentos certo
}

export function parseCsv(text) {
  text = text.replace(/^﻿/, '')
  const firstLine = text.slice(0, text.indexOf('\n') + 1 || undefined)
  const sep = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === sep) { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim()))
}
