
const BRANDS = [
  { id: 'elo', label: 'Elo', re: /^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/, groups: [4, 4, 4, 4], cvv: 3 },
  { id: 'hipercard', label: 'Hipercard', re: /^(606282|3841)/, groups: [4, 4, 4, 4], cvv: 3 },
  { id: 'amex', label: 'Amex', re: /^3[47]/, groups: [4, 6, 5], cvv: 4 },
  { id: 'master', label: 'Mastercard', re: /^(5[1-5]|2[2-7])/, groups: [4, 4, 4, 4], cvv: 3 },
  { id: 'visa', label: 'Visa', re: /^4/, groups: [4, 4, 4, 4], cvv: 3 },
]
const DEFAULT = { id: 'card', label: 'Cartão', groups: [4, 4, 4, 4], cvv: 3 }

export const digits = (v) => String(v || '').replace(/\D/g, '')
export const brandOf = (number) => BRANDS.find((b) => b.re.test(digits(number))) || DEFAULT
export const cardLength = (brand) => brand.groups.reduce((a, b) => a + b, 0)

export function formatCard(value) {
  const d = digits(value)
  const brand = brandOf(d)
  const out = []
  let i = 0
  for (const g of brand.groups) {
    if (i >= d.length) break
    out.push(d.slice(i, i + g))
    i += g
  }
  return out.join(' ')
}

export function luhn(number) {
  const d = digits(number)
  if (d.length < 13) return false
  let sum = 0
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i])
    if (i % 2) { n *= 2; if (n > 9) n -= 9 }
    sum += n
  }
  return sum % 10 === 0
}

export const formatExp = (v) => { const d = digits(v).slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }
export function expValid(v, now = new Date()) {
  const d = digits(v)
  if (d.length !== 4) return false
  const month = Number(d.slice(0, 2))
  const year = 2000 + Number(d.slice(2))
  if (month < 1 || month > 12) return false
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

export const formatCpf = (v) => digits(v).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
export function cpfValid(v) {
  const d = digits(v)
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  for (const n of [9, 10]) {
    let s = 0
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i)
    if (((s * 10) % 11) % 10 !== Number(d[n])) return false
  }
  return true
}

export const brl = (cents) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
