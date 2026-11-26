// Builds the static site into ./dist from the JSON files in ./content.
// No dependencies: run with `node build.mjs`.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const readDir = (dir) => {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ slug: f.replace(/\.json$/, ''), ...read(join(dir, f)) }));
};

const profile = read('content/profile.json');
const experience = read('content/experience.json');
const writing = read('content/writing.json').sort((a, b) => String(b.date).localeCompare(String(a.date)));
const projects = readDir('content/projects').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const certifications = readDir('content/certifications').sort((a, b) => String(b.date).localeCompare(String(a.date)));

const professional = projects.filter((p) => p.category === 'professional');
const personal = projects.filter((p) => p.category === 'personal');

// ---------- helpers ----------
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// [text](url) -> link. Relative urls get the page's base prefix; external ones open in a new tab.
const inline = (text, base) =>
  esc(text).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) =>
    /^https?:/.test(url) ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>` : `<a href="${base}${url}">${label}</a>`
  );
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDay = (iso) => {
  const [, m, d] = String(iso).split('-');
  return m && d ? `${months[+m - 1]} ${d}` : '';
};
const year = (iso) => String(iso).slice(0, 4);
const hashtags = (list = []) => list.map((t) => `<span class="hash">#${esc(slugify(t))}</span>`).join('');

const icons = {
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
  ext: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ext"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7M8 7h9v9"/></svg>',
};

const nav = [
  ['', 'About'],
  ['experience/', 'Experience'],
  ['projects/', 'Projects'],
  ['writing/', 'Writing'],
];

// ---------- layout ----------
function page({ path, title, description, body }) {
  const depth = path.split('/').filter(Boolean).length;
  const base = depth ? '../'.repeat(depth) : '';
  const fullTitle = title ? `${title} · ${profile.name}` : `${profile.name} · ${profile.role}`;
  const desc = description || `${profile.name}: ${profile.role}. ${profile.tagline}.`;
  const url = `${profile.siteUrl}/${path}`;
  const jsonLd = path
    ? ''
    : `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        jobTitle: profile.role,
        url: profile.siteUrl,
        address: { '@type': 'PostalAddress', addressLocality: profile.location },
        sameAs: [profile.contact.linkedin, profile.contact.github, profile.contact.blog].filter(Boolean),
      })}</script>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(profile.siteUrl)}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}styles.css">
<script>try{const t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
${jsonLd}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="col header-inner">
    <a class="brand" href="${base || './'}">${esc(profile.name)}</a>
    <nav aria-label="Main">
      <ul>${nav
        .map(([p, label]) => `<li><a href="${base}${p || './'}"${p === path ? ' aria-current="page"' : ''}>${label}</a></li>`)
        .join('')}</ul>
    </nav>
    <button class="theme-toggle" type="button" aria-label="Toggle dark mode"><span class="i-sun">${icons.sun}</span><span class="i-moon">${icons.moon}</span></button>
  </div>
</header>
<main id="main" class="col">
${body(base)}
</main>
<footer class="site-footer">
  <div class="col footer-inner">
    <p class="footer-links">
      <a href="mailto:${esc(profile.contact.email)}">Email</a>
      <a href="${esc(profile.contact.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
      <a href="${esc(profile.contact.github)}" target="_blank" rel="noopener">GitHub</a>
      <a href="${esc(profile.contact.blog)}" target="_blank" rel="noopener">Blog</a>
    </p>
    <p>© ${new Date().getFullYear()} ${esc(profile.name)} · ${esc(profile.location)}</p>
  </div>
</footer>
<script>
document.querySelector('.theme-toggle').addEventListener('click',()=>{const d=document.documentElement;const dark=d.dataset.theme!=='light';d.dataset.theme=dark?'light':'dark';try{localStorage.setItem('theme',d.dataset.theme)}catch(e){}});
if(matchMedia('(prefers-reduced-motion: reduce)').matches)document.querySelectorAll('video[autoplay]').forEach(v=>{v.removeAttribute('autoplay');v.pause()});
document.querySelectorAll('[data-filter-group]').forEach(g=>{const list=document.getElementById(g.dataset.filterGroup);g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));const f=b.dataset.filter;list.querySelectorAll('[data-cat]').forEach(el=>{el.hidden=f!=='all'&&el.dataset.cat!==f});list.querySelectorAll('[data-group]').forEach(h=>{h.hidden=f!=='all'&&h.dataset.group!==f})})});
</script>
</body>
</html>
`;
}

// ---------- shared fragments ----------
const writingRow = (w) => `
  <li class="entry">
    <time class="entry-date" datetime="${esc(w.date)}">${fmtDay(w.date)}</time>
    <div class="entry-body">
      <a class="entry-title" href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.title)}</a>
      <p class="entry-meta"><span class="chip">${esc(w.where)}</span>${hashtags(w.tags)}</p>
    </div>
  </li>`;

const projectRow = (p) => `
  <li class="entry project" id="${esc(p.slug)}" data-cat="${esc(p.category)}">
    <span class="entry-date">${p.category === 'personal' ? 'Personal' : 'Client'}</span>
    <div class="entry-body">
      <h3 class="entry-title">${esc(p.title)}</h3>
      <p class="entry-org">${esc(p.org)}</p>
      <p class="entry-summary">${esc(p.summary)}</p>
      <p class="entry-impact"><strong>Impact.</strong> ${esc(p.impact)}</p>
      <details>
        <summary>Problem, solution and result</summary>
        <p><strong>Problem.</strong> ${esc(p.problem)}</p>
        <p><strong>Solution.</strong> ${esc(p.solution)}</p>
        <p><strong>Result.</strong> ${esc(p.result)}</p>
      </details>
      <p class="entry-meta">${hashtags(p.tech)}</p>
      ${p.links?.length ? `<p class="entry-links">${p.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${icons.ext}</a>`).join('')}</p>` : ''}
    </div>
  </li>`;

// ---------- pages ----------
const pages = [];

pages.push({
  path: '',
  body: (base) => `
<section class="intro">
  <div class="intro-row">
    <div class="intro-text">
      <h1>${esc(profile.greeting)}</h1>
      <p class="motto">${esc(profile.motto)}</p>
      ${profile.bio.slice(0, 1).map((p) => `<p>${inline(p, base)}</p>`).join('')}
    </div>
    <figure class="portrait">
      <video autoplay muted loop playsinline preload="metadata" poster="${base}waving-poster.jpg" width="480" height="692" aria-label="${esc(profile.name)} waving hello">
        <source src="${base}waving.webm" type="video/webm">
        <source src="${base}waving.mp4" type="video/mp4">
      </video>
    </figure>
  </div>
  ${profile.bio.slice(1).map((p) => `<p>${inline(p, base)}</p>`).join('\n  ')}
  <ul class="facts">${profile.stats.map((s) => `<li><strong>${esc(s.value)}</strong> ${esc(s.label)}</li>`).join('')}</ul>
</section>

<section>
  <h2 class="section-title">Selected work</h2>
  <ul class="list">${[...personal, ...professional.filter((p) => p.featured)]
    .map(
      (p) => `
    <li class="list-item">
      <a href="${base}projects/#${esc(p.slug)}">${esc(p.title)}</a>
      <span class="list-note">${esc(p.summary)}</span>
    </li>`
    )
    .join('')}
  </ul>
  <p class="more"><a href="${base}projects/">All ${projects.length} projects →</a></p>
</section>

<section>
  <h2 class="section-title">Recent writing</h2>
  <ul class="entries">${writing.slice(0, 4).map(writingRow).join('')}</ul>
  <p class="more"><a href="${base}writing/">All writing →</a></p>
</section>

<section>
  <h2 class="section-title">Skills</h2>
  <dl class="skills">${profile.skills.map((s) => `<div><dt>${esc(s.area)}</dt><dd>${s.items.map(esc).join(', ')}</dd></div>`).join('')}</dl>
</section>

<section>
  <h2 class="section-title">Get in touch</h2>
  <p>I'm always happy to talk about backend, platform and AI engineering. The quickest way to reach me is <a href="mailto:${esc(profile.contact.email)}">${esc(profile.contact.email)}</a>, or find me on <a href="${esc(profile.contact.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>.</p>
</section>`,
});

pages.push({
  path: 'experience/',
  title: 'Experience',
  description: `${profile.name}'s work experience, certifications and education.`,
  body: () => `
<h1 class="page-title">Experience</h1>
<p class="page-lede">9+ years across product companies and agencies, from junior engineer to technical lead, and now building AI systems for production.</p>

<ol class="timeline">${experience
    .map(
      (e) => `
  <li id="${slugify(e.company)}">
    <p class="tl-when">${esc(e.start)} – ${esc(e.end)}</p>
    <h2 class="tl-role">${esc(e.role)}</h2>
    <p class="tl-company">${esc(e.company)}</p>
    <ul>${e.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
  </li>`
    )
    .join('')}
</ol>

<section>
  <h2 class="section-title">Highlights</h2>
  <ul class="plain">${profile.achievements.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
</section>
${
  certifications.length
    ? `
<section id="certifications">
  <h2 class="section-title">Certifications</h2>
  <ul class="entries">${certifications
    .map(
      (c) => `
    <li class="entry">
      <span class="entry-date">${esc(c.displayDate || c.date)}</span>
      <div class="entry-body">
        ${c.url ? `<a class="entry-title" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a>` : `<span class="entry-title">${esc(c.title)}</span>`}
        <p class="entry-org">${esc(c.issuer)}</p>
        ${c.includes?.length ? `<p class="entry-meta">${c.includes.map((i) => (i.url ? `<a class="hash" href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.title)}</a>` : `<span class="hash">${esc(i.title)}</span>`)).join('')}</p>` : ''}
      </div>
    </li>`
    )
    .join('')}
  </ul>
</section>`
    : ''
}
<section>
  <h2 class="section-title">Education</h2>
  ${profile.education.map((e) => `<p><strong>${esc(e.degree)}</strong><br><span class="muted">${esc(e.school)} · ${esc(e.years)}</span></p>`).join('')}
</section>`,
});

pages.push({
  path: 'projects/',
  title: 'Projects',
  description: `Client platforms and open-source projects built by ${profile.name}.`,
  body: () => `
<h1 class="page-title">Projects <span class="count">(${projects.length})</span></h1>
<p class="page-lede">Two kinds of work: platforms I've built for clients, and things I build on my own to keep learning.</p>
<div class="filters" data-filter-group="project-list" role="group" aria-label="Filter projects">
  <button type="button" data-filter="all" aria-pressed="true">All <span>${projects.length}</span></button>
  <button type="button" data-filter="professional" aria-pressed="false">Professional <span>${professional.length}</span></button>
  <button type="button" data-filter="personal" aria-pressed="false">Personal upskilling <span>${personal.length}</span></button>
</div>
<div id="project-list">
  <h2 class="group-title" data-group="personal">Personal upskilling</h2>
  <ul class="entries">${personal.map(projectRow).join('')}</ul>
  <h2 class="group-title" data-group="professional">Professional experience</h2>
  <ul class="entries">${professional.map(projectRow).join('')}</ul>
</div>`,
});

pages.push({
  path: 'writing/',
  title: 'Writing',
  description: `Notes on system design, databases and AI engineering by ${profile.name}.`,
  body: () => {
    const years = [...new Set(writing.map((w) => year(w.date)))];
    return `
<h1 class="page-title">Writing <span class="count">(${writing.length})</span></h1>
<p class="page-lede">Notes on system design, databases and AI engineering, from <a href="${esc(profile.contact.blog)}" target="_blank" rel="noopener">my blog</a> and <a href="${esc(profile.contact.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>.</p>
${years
  .map((y) => {
    const items = writing.filter((w) => year(w.date) === y);
    return `<h2 class="year">${y} <span class="count">(${items.length})</span></h2>
<ul class="entries">${items.map(writingRow).join('')}</ul>`;
  })
  .join('\n')}`;
  },
});

// ---------- write ----------
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'public'), dist, { recursive: true });
cpSync(join(root, 'src/styles.css'), join(dist, 'styles.css'));
for (const p of pages) {
  const file = join(dist, p.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page(p));
}
writeFileSync(join(dist, '.nojekyll'), '');
console.log(`Built ${pages.length} pages: ${projects.length} projects, ${experience.length} roles, ${writing.length} posts, ${certifications.length} certifications`);
