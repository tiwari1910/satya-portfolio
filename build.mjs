// Builds the static site into ./dist from the JSON files in ./content.
// No dependencies: run with `node build.mjs`.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
const writing = read('content/writing.json');
const projects = readDir('content/projects').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const certifications = readDir('content/certifications').sort((a, b) => String(b.date).localeCompare(String(a.date)));

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const icons = {
  github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 6h18v12H3zM3 7l9 6 9-6"/></svg>',
  pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7M8 7h9v9"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
};

const initials = profile.name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('');
const tags = (list) => `<ul class="tags">${list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
const linkHost = (url) => new URL(url).host.replace(/^www\./, '');

const projectCard = (p, size) => `
<article class="project ${size}" id="project-${esc(p.slug)}">
  <div class="project-head">
    <p class="project-org">${esc(p.org)}</p>
    <h4>${esc(p.title)}</h4>
  </div>
  <p class="project-summary">${esc(p.summary)}</p>
  <p class="project-impact"><span>Impact</span>${esc(p.impact)}</p>
  ${tags(p.tech)}
  <details>
    <summary>Problem, solution &amp; result</summary>
    <dl>
      <dt>Problem</dt><dd>${esc(p.problem)}</dd>
      <dt>Solution</dt><dd>${esc(p.solution)}</dd>
      <dt>Result</dt><dd>${esc(p.result)}</dd>
    </dl>
  </details>
  ${p.links?.length ? `<p class="project-links">${p.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ${icons.arrow}</a>`).join('')}</p>` : ''}
</article>`;

const professional = projects.filter((p) => p.category === 'professional');
const personal = projects.filter((p) => p.category === 'personal');
const featured = professional.filter((p) => p.featured);
const more = professional.filter((p) => !p.featured);

const navItems = [
  ['about', 'About'],
  ['experience', 'Experience'],
  ['projects', 'Projects'],
  writing.length && ['writing', 'Writing'],
  certifications.length && ['certifications', 'Certifications'],
  ['contact', 'Contact'],
].filter(Boolean);

const description = `${profile.name}: ${profile.role}. ${profile.tagline}.`;
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.role,
  url: profile.siteUrl,
  address: { '@type': 'PostalAddress', addressLocality: profile.location },
  sameAs: [profile.contact.linkedin, profile.contact.github, profile.contact.blog].filter(Boolean),
  knowsAbout: profile.skills.flatMap((s) => s.items).slice(0, 20),
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(profile.name)} · ${esc(profile.role)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(profile.siteUrl)}/">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(profile.name)} · ${esc(profile.role)}">
<meta property="og:description" content="${esc(profile.tagline)}">
<meta property="og:url" content="${esc(profile.siteUrl)}/">
<meta property="og:image" content="${esc(profile.siteUrl)}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<script>try{const t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="#top" aria-label="${esc(profile.name)}, back to top"><span class="brand-mark">${esc(initials)}</span><span class="brand-name">${esc(profile.name)}</span></a>
    <nav aria-label="Sections"><ul>${navItems.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join('')}</ul></nav>
    <button class="theme-toggle" type="button" aria-label="Toggle dark mode"><span class="i-sun">${icons.sun}</span><span class="i-moon">${icons.moon}</span></button>
  </div>
</header>

<main id="main">
<section class="hero" id="top">
  <div class="wrap hero-grid">
    <div>
      <p class="kicker">${esc(profile.role)}</p>
      <h1>${esc(profile.name)}</h1>
      <p class="tagline">${esc(profile.tagline)}</p>
      <p class="intro">${esc(profile.intro)}</p>
      <div class="cta">
        <a class="btn primary" href="#projects">View my work</a>
        <a class="btn" href="#contact">Get in touch</a>
        <a class="icon-btn" href="${esc(profile.contact.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${icons.linkedin}</a>
        <a class="icon-btn" href="${esc(profile.contact.github)}" target="_blank" rel="noopener" aria-label="GitHub">${icons.github}</a>
      </div>
    </div>
    <aside class="hero-card" aria-label="Currently">
      <div class="avatar" aria-hidden="true">${esc(initials)}</div>
      <p class="hero-card-loc">${esc(profile.location)}</p>
      <div class="terminal" aria-label="Latest open-source project">
        <p class="term-bar"><span></span><span></span><span></span></p>
<pre><code><span class="c"># my open-source router for Claude Code</span>
<span class="p">$</span> pip install claude-code-router
<span class="c"># every prompt gets the right model:</span>
"fix typo in README"      <span class="o">→ haiku · low</span>
"migrate payments schema" <span class="o">→ opus · xhigh</span></code></pre>
      </div>
    </aside>
  </div>
  <div class="wrap">
    <ul class="stats">${profile.stats.map((s) => `<li><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`).join('')}</ul>
  </div>
</section>

<section id="about" class="section">
  <div class="wrap two-col">
    <div>
      <h2>About</h2>
      ${profile.about.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
      <h3 class="sub">Highlights</h3>
      <ul class="checks">${profile.achievements.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      <h3 class="sub">Education</h3>
      ${profile.education.map((e) => `<p class="edu"><strong>${esc(e.degree)}</strong><br>${esc(e.school)} · ${esc(e.years)}</p>`).join('')}
    </div>
    <div>
      <h2 class="h2-alt">Skills</h2>
      <dl class="skills">${profile.skills.map((s) => `<div><dt>${esc(s.area)}</dt><dd>${tags(s.items)}</dd></div>`).join('')}</dl>
    </div>
  </div>
</section>

<section id="experience" class="section alt">
  <div class="wrap">
    <h2>Experience</h2>
    <ol class="timeline">${experience
      .map(
        (e) => `
      <li>
        <div class="tl-when">${esc(e.start)} – ${esc(e.end)}</div>
        <div class="tl-body">
          <h3>${esc(e.role)}</h3>
          <p class="tl-company">${esc(e.company)}</p>
          <ul>${e.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        </div>
      </li>`
      )
      .join('')}
    </ol>
  </div>
</section>

<section id="projects" class="section">
  <div class="wrap">
    <h2>Projects</h2>
    <p class="lede">Two kinds of work: platforms I've built for clients, and things I build on my own to keep learning.</p>

    <h3 class="group">Personal upskilling</h3>
    <div class="grid one">${personal.map((p) => projectCard(p, 'spotlight')).join('')}</div>

    <h3 class="group">Professional experience</h3>
    <div class="grid two">${featured.map((p) => projectCard(p, 'featured')).join('')}</div>
    <div class="grid three">${more.map((p) => projectCard(p, 'compact')).join('')}</div>
  </div>
</section>
${
  writing.length
    ? `
<section id="writing" class="section alt">
  <div class="wrap">
    <h2>Writing</h2>
    <p class="lede">Notes on system design and AI engineering, on <a href="${esc(profile.contact.blog)}" target="_blank" rel="noopener">my blog</a> and LinkedIn.</p>
    <div class="grid three">${writing
      .map(
        (w) => `
      <a class="post" href="${esc(w.url)}" target="_blank" rel="noopener">
        <span class="post-where">${esc(w.where)}</span>
        <span class="post-title">${esc(w.title)}</span>
        <span class="post-summary">${esc(w.summary)}</span>
        <span class="post-go">Read ${icons.arrow}</span>
      </a>`
      )
      .join('')}
    </div>
  </div>
</section>`
    : ''
}
${
  certifications.length
    ? `
<section id="certifications" class="section">
  <div class="wrap">
    <h2>Certifications</h2>
    <ul class="certs">${certifications
      .map(
        (c) => `<li>
        <div class="cert-main"><strong>${esc(c.title)}</strong><span>${esc(c.issuer)} · ${esc(c.displayDate || c.date)}</span></div>
        ${c.url ? `<a class="cert-link" href="${esc(c.url)}" target="_blank" rel="noopener">Credential ${icons.arrow}</a>` : ''}
        ${c.includes?.length ? `<ul class="cert-includes">${c.includes.map((i) => `<li>${i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.title)}</a>` : esc(i.title)}</li>`).join('')}</ul>` : ''}
      </li>`
      )
      .join('')}</ul>
  </div>
</section>`
    : ''
}
<section id="contact" class="section contact">
  <div class="wrap">
    <h2>Get in touch</h2>
    <p class="lede">I'm happy to talk about backend, platform and AI engineering roles. Email is the quickest way to reach me.</p>
    <ul class="contact-list">
      <li><a href="mailto:${esc(profile.contact.email)}">${icons.mail}<span>${esc(profile.contact.email)}</span></a></li>
      <li><a href="${esc(profile.contact.linkedin)}" target="_blank" rel="noopener">${icons.linkedin}<span>${esc(linkHost(profile.contact.linkedin))}${esc(new URL(profile.contact.linkedin).pathname.replace(/\/$/, ''))}</span></a></li>
      <li><a href="${esc(profile.contact.github)}" target="_blank" rel="noopener">${icons.github}<span>${esc(linkHost(profile.contact.github))}${esc(new URL(profile.contact.github).pathname)}</span></a></li>
      <li><a href="${esc(profile.contact.blog)}" target="_blank" rel="noopener">${icons.pen}<span>${esc(linkHost(profile.contact.blog))}</span></a></li>
    </ul>
  </div>
</section>
</main>

<footer class="site-footer"><div class="wrap">© ${new Date().getFullYear()} ${esc(profile.name)} · ${esc(profile.location)}</div></footer>
<script>
const b=document.querySelector('.theme-toggle');
b.addEventListener('click',()=>{const d=document.documentElement;const dark=d.dataset.theme?d.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;d.dataset.theme=dark?'light':'dark';try{localStorage.setItem('theme',d.dataset.theme)}catch(e){}});
</script>
</body>
</html>
`;

const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'public'), dist, { recursive: true });
cpSync(join(root, 'src/styles.css'), join(dist, 'styles.css'));
writeFileSync(join(dist, 'index.html'), html);
writeFileSync(join(dist, '.nojekyll'), '');
console.log(`Built dist/: ${projects.length} projects, ${experience.length} roles, ${writing.length} posts, ${certifications.length} certifications`);
