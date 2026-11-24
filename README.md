# satya-portfolio

Personal portfolio of Satya Prakash Tiwari. It's a small multi-page static site (About, Experience, Projects, Writing) built from JSON content files by a small Node script with no dependencies. Every push to `main` builds and deploys it to GitHub Pages.

## Preview locally

```bash
npm run dev          # builds into dist/ and serves it at http://localhost:3000
```

Or just `node build.mjs` and open `dist/index.html`.

## Where the content lives

| What | File |
|---|---|
| Name, greeting, bio (supports `[text](url)` links), stats, skills, contact, highlights, education | `content/profile.json` |
| Work history | `content/experience.json` |
| Projects (one file each) | `content/projects/*.json` |
| Certifications (one file each) | `content/certifications/*.json` |
| Blog and LinkedIn posts | `content/writing.json` |
| Waving intro video (+ poster), link preview image, favicon | `public/waving.webm`, `public/waving.mp4`, `public/waving-poster.jpg`, `public/og.png`, `public/favicon.svg` |
| Styling | `src/styles.css` |

## Add a new project

Copy an existing file in `content/projects/`, rename it (the file name becomes the anchor, e.g. `#project-my-new-tool`) and edit it:

```json
{
  "title": "My new tool",
  "category": "personal",
  "featured": false,
  "order": 2,
  "org": "Open source · personal project",
  "summary": "One sentence on what it does.",
  "impact": "One line on the result.",
  "tech": ["Python", "FastAPI"],
  "problem": "What problem it solves.",
  "solution": "What you built and how.",
  "result": "What changed because of it.",
  "links": [{ "label": "GitHub", "url": "https://github.com/..." }]
}
```

- `category`: `"personal"` goes under **Personal upskilling**, `"professional"` under **Professional experience**.
- `featured: true` lists a professional project under **Selected work** on the About page.
- `order` sets the position within its group (lower comes first).

## Add a certification

Add a file to `content/certifications/` (see the README there). The newest certification appears first.

## Add a post

Add an entry to `content/writing.json` with `title`, `date` (YYYY-MM-DD), `where` (e.g. `Hashnode` or `LinkedIn`), `url` and `tags`. Posts are grouped by year, newest first, and the latest four show on the About page.

## Publish

Commit and push to `main`. The **Deploy to GitHub Pages** workflow builds the site, and it is live at https://tiwari1910.github.io/satya-portfolio/ a minute or two later.

One-time setup: in the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
