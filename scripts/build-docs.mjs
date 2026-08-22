#!/usr/bin/env node
/**
 * SemantIQ Standalone Documentation Site Generator
 *
 * Compiles repository documentation in Docs/ into a static HTML documentation site.
 * Completely decoupled from product UI, requiring zero external UI frameworks.
 */

import { readdir, readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, relative, basename } from "node:path";

const DOCS_DIR = join(process.cwd(), "Docs");
const OUTPUT_DIR = join(process.cwd(), "dist", "docs");

const SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "🚀",
    path: "getting-started/README.md"
  },
  { id: "concepts", title: "Scientific Concepts", icon: "🛡️", path: "concepts/README.md" },
  { id: "architecture", title: "Architecture", icon: "📐", path: "architecture/README.md" },
  { id: "benchmarks", title: "Benchmarks", icon: "🧪", path: "benchmarks/README.md" },
  { id: "evidence", title: "Evidence Engine", icon: "📊", path: "evidence/README.md" },
  { id: "research", title: "Research Workflow", icon: "🔬", path: "research/README.md" },
  { id: "governance", title: "Governance & RFCs", icon: "🏛️", path: "governance/README.md" },
  { id: "partners", title: "Partner Protocols", icon: "📑", path: "partners/README.md" },
  { id: "api", title: "HTTP REST API", icon: "🌐", path: "api/README.md" },
  { id: "sdk", title: "SDKs (Python & TS)", icon: "📦", path: "sdk/README.md" },
  { id: "security", title: "Security & Privacy", icon: "🔒", path: "security/README.md" },
  { id: "releases", title: "Releases & Audits", icon: "🏷️", path: "releases/README.md" },
  { id: "adr", title: "ADRs", icon: "📜", path: "adr/README.md" }
];

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function markdownToHtml(md) {
  let html = md;

  // Code blocks
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || "text"}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, (match, code) => `<code>${escapeHtml(code)}</code>`);

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Blockquotes / Alerts
  html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

  // Math blocks (inline and block)
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-block"><code>$1</code></div>');
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, '<div class="math-block"><code>$1</code></div>');
  html = html.replace(/\\\((.*?)\\\)/g, '<span class="math-inline"><code>$1</code></span>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    // Transform markdown links to relative html links where appropriate
    let target = url;
    if (target.endsWith(".md")) {
      target = target.replace(/\.md$/, ".html");
    }
    return `<a href="${target}">${text}</a>`;
  });

  // Unordered list items
  html = html.replace(/^\s*-\s+(.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

  // Tables (basic conversion)
  html = html.replace(/\|(.+)\|/g, (match, content) => {
    const cells = content.split("|").map((c) => c.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c))) {
      return ""; // separator row
    }
    const isHeader = !html.includes("<th>");
    const tag = isHeader ? "th" : "td";
    const row = cells.map((c) => `<${tag}>${c}</${tag}>`).join("");
    return `<tr>${row}</tr>`;
  });

  // Paragraphs
  html = html
    .split("\n\n")
    .map((p) => {
      p = p.trim();
      if (!p) return "";
      if (
        p.startsWith("<h") ||
        p.startsWith("<pre") ||
        p.startsWith("<ul") ||
        p.startsWith("<table") ||
        p.startsWith("<tr") ||
        p.startsWith("<blockquote") ||
        p.startsWith("<div")
      ) {
        return p;
      }
      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}

function generateSiteHtml({ title, content, currentSectionId }) {
  const navItems = SECTIONS.map((s) => {
    const active = s.id === currentSectionId ? "active" : "";
    const href = s.id === "home" ? "index.html" : `${s.id}/index.html`;
    return `<li><a href="${href}" class="${active}"><span class="nav-icon">${s.icon}</span> ${escapeHtml(s.title)}</a></li>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — SemantIQ Documentation</title>
  <link rel="stylesheet" href="../style.css">
  <style>
    :root {
      --bg: #0d1117;
      --sidebar-bg: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --heading: #f0f6fc;
      --accent: #58a6ff;
      --accent-hover: #79c0ff;
      --code-bg: #1f242c;
      --code-text: #79c0ff;
      --tag-normative: #238636;
      --tag-reviewed: #1f6feb;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      display: flex;
      min-height: 100vh;
    }
    aside.sidebar {
      width: 280px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .brand {
      padding: 20px;
      border-bottom: 1px solid var(--border);
    }
    .brand h1 {
      font-size: 1.2rem;
      color: var(--heading);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand span.badge {
      font-size: 0.7rem;
      background: var(--tag-normative);
      color: #fff;
      padding: 2px 6px;
      border-radius: 12px;
    }
    nav.nav-menu {
      padding: 16px 8px;
      flex: 1;
    }
    nav.nav-menu ul { list-style: none; }
    nav.nav-menu li { margin-bottom: 4px; }
    nav.nav-menu a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      color: var(--text);
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.9rem;
      transition: background 0.15s ease;
    }
    nav.nav-menu a:hover {
      background: rgba(255,255,255,0.05);
      color: var(--heading);
    }
    nav.nav-menu a.active {
      background: rgba(88, 166, 255, 0.15);
      color: var(--accent);
      font-weight: 600;
    }
    main.content {
      flex: 1;
      max-width: 900px;
      padding: 40px 48px;
      overflow-x: hidden;
    }
    .content h1 { font-size: 2rem; color: var(--heading); margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
    .content h2 { font-size: 1.4rem; color: var(--heading); margin-top: 28px; margin-bottom: 12px; }
    .content h3 { font-size: 1.1rem; color: var(--heading); margin-top: 20px; margin-bottom: 8px; }
    .content p { margin-bottom: 16px; }
    .content a { color: var(--accent); text-decoration: none; }
    .content a:hover { text-decoration: underline; }
    .content pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      margin-bottom: 20px;
    }
    .content code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 0.85em;
      background: rgba(110, 118, 129, 0.2);
      padding: 2px 5px;
      border-radius: 4px;
    }
    .content pre code {
      background: transparent;
      padding: 0;
      color: #e6edf3;
    }
    .content ul, .content ol { margin-left: 24px; margin-bottom: 16px; }
    .content li { margin-bottom: 6px; }
    .content blockquote {
      border-left: 4px solid var(--accent);
      padding: 8px 16px;
      background: rgba(88, 166, 255, 0.05);
      margin-bottom: 16px;
      color: #8b949e;
    }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 0.9rem;
    }
    .content th, .content td {
      border: 1px solid var(--border);
      padding: 8px 12px;
      text-align: left;
    }
    .content th {
      background: var(--sidebar-bg);
      color: var(--heading);
    }
    .math-block {
      background: var(--sidebar-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      margin: 16px 0;
      text-align: center;
      color: var(--accent);
    }
    footer.site-footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      font-size: 0.85rem;
      color: #8b949e;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    <div class="brand">
      <h1>🔬 SemantIQ <span class="badge">Public Alpha 0.1.0-alpha.2</span></h1>
      <p style="font-size: 0.75rem; color: #8b949e; margin-top: 4px;">Behavioral Evidence Infrastructure</p>
    </div>
    <nav class="nav-menu">
      <ul>
        ${navItems}
      </ul>
    </nav>
  </aside>

  <main class="content">
    ${content}

    <footer class="site-footer">
      <div>SemantIQ Behavioral Evidence Infrastructure • MIT License</div>
      <div><a href="https://github.com/Logorythmus-org/Semantiq">GitHub Repository</a></div>
    </footer>
  </main>
</body>
</html>`;
}

async function buildDocs() {
  console.log("=========================================");
  console.log(" Building SemantIQ Documentation Site... ");
  console.log("=========================================");

  await mkdir(OUTPUT_DIR, { recursive: true });

  // 1. Build Root Index (DOCUMENTATION_INDEX.md)
  const masterIndexPath = join(DOCS_DIR, "DOCUMENTATION_INDEX.md");
  if (existsSync(masterIndexPath)) {
    const rawMd = await readFile(masterIndexPath, "utf-8");
    const htmlBody = markdownToHtml(rawMd);
    const fullHtml = generateSiteHtml({
      title: "Master Documentation Index",
      content: htmlBody,
      currentSectionId: "home"
    });
    await writeFile(join(OUTPUT_DIR, "index.html"), fullHtml, "utf-8");
    console.log("✓ Compiled root index: dist/docs/index.html");
  }

  // 2. Build Each Scalable Area Section
  for (const sec of SECTIONS) {
    const targetDir = join(OUTPUT_DIR, sec.id);
    await mkdir(targetDir, { recursive: true });

    const secFilePath = join(DOCS_DIR, sec.path);
    if (existsSync(secFilePath)) {
      const rawMd = await readFile(secFilePath, "utf-8");
      const htmlBody = markdownToHtml(rawMd);
      const fullHtml = generateSiteHtml({
        title: sec.title,
        content: htmlBody,
        currentSectionId: sec.id
      });
      await writeFile(join(targetDir, "index.html"), fullHtml, "utf-8");
      console.log(`✓ Compiled area [${sec.id}]: dist/docs/${sec.id}/index.html`);
    } else {
      console.warn(`! Section file not found: ${secFilePath}`);
    }
  }

  console.log("=========================================");
  console.log(" Documentation Site Build Complete!     ");
  console.log(` Output: ${OUTPUT_DIR}                  `);
  console.log("=========================================");
}

buildDocs().catch((err) => {
  console.error("Documentation build failed:", err);
  process.exit(1);
});
