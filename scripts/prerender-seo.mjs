import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ALL_PUBLIC_SEO_PAGES,
  DEFAULT_IMAGE,
  SITE_NAME,
  SITE_ORIGIN,
  SITELINK_PAGES,
} from '../src/data/seo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist')
const templatePath = path.join(distDir, 'index.html')

if (!fs.existsSync(templatePath)) {
  console.error('dist/index.html não encontrado. Rode vite build primeiro.')
  process.exit(1)
}

const template = fs.readFileSync(templatePath, 'utf8')

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildJsonLd(page, canonical) {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: page.name, item: canonical },
    ],
  }

  const mainNode =
    page.type === 'article'
      ? {
          '@type': 'Article',
          headline: page.name,
          description: page.description,
          url: canonical,
          datePublished: page.datePublished,
          inLanguage: 'pt-BR',
          author: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/logo-mark.png` },
          },
          image: DEFAULT_IMAGE,
        }
      : {
          '@type': 'WebPage',
          name: page.title,
          description: page.description,
          url: canonical,
          inLanguage: 'pt-BR',
          isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
        }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [mainNode, breadcrumb] })
}

function buildFallbackBody(page) {
  const navLinks = SITELINK_PAGES.map(
    (s) =>
      `<li><a href="${s.path}" style="color:#fba45c;text-decoration:none;font-weight:600">${escapeHtml(s.name)}</a> — ${escapeHtml(s.description)}</li>`,
  ).join('')

  return `<noscript>
      <main style="max-width:760px;margin:0 auto;padding:48px 24px;font-family:Inter,system-ui,sans-serif;color:#f8f8f8;background:#000">
        <p><a href="/" style="color:#fba45c;text-decoration:none;font-weight:700">${SITE_NAME}</a></p>
        <h1>${escapeHtml(page.name)}</h1>
        <p>${escapeHtml(page.description)}</p>
        <nav aria-label="Links principais do Novexo">
          <ul style="line-height:1.8;padding-left:20px">${navLinks}</ul>
        </nav>
      </main>
    </noscript>`
}

let count = 0
for (const page of ALL_PUBLIC_SEO_PAGES) {
  const canonical = `${SITE_ORIGIN}${page.path}`
  const titleEsc = escapeHtml(page.title)
  const descEsc = escapeHtml(page.description)
  const jsonLd = buildJsonLd(page, canonical)

  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${titleEsc}</title>`)
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${descEsc}" />`,
  )
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`,
  )
  html = html.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${page.type === 'article' ? 'article' : 'website'}" />`,
  )
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`,
  )
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${titleEsc}" />`,
  )
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${descEsc}" />`,
  )
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${titleEsc}" />`,
  )
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${descEsc}" />`,
  )
  html = html.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json">${jsonLd}</script>`,
  )
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, buildFallbackBody(page))

  const relDir = page.path.replace(/^\/+/, '')
  const outDir = path.join(distDir, relDir)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8')
  count++
}

console.log(`✓ SEO prerender: ${count} páginas estáticas geradas em dist/*/index.html`)
