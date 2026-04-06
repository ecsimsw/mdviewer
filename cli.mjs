#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { marked } from "marked";

const CSS = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { font-size: 16px; -webkit-font-smoothing: antialiased; }

  body {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #222;
    background: #fff;
    line-height: 1.8;
  }

  article {
    max-width: 780px;
    margin: 0 auto;
    padding: 72px 24px 96px;
  }

  article > :first-child { margin-top: 0; }

  h1 {
    font-size: 22px; font-weight: 700; line-height: 1.35;
    color: #111; margin: 52px 0 16px; letter-spacing: -0.3px;
    border-bottom: 1px solid #eee; padding-bottom: 12px;
  }

  h2 {
    font-size: 19px; font-weight: 700;
    margin: 44px 0 12px; color: #111;
  }

  h3 {
    font-size: 17px; font-weight: 700;
    margin: 36px 0 8px; color: #111;
  }

  h4 {
    font-size: 15px; font-weight: 600;
    margin: 28px 0 6px; color: #555;
  }

  p {
    margin-bottom: 4px;
    font-size: 15.5px;
    color: #333;
    word-break: keep-all;
  }

  hr {
    border: none; border-top: 1px solid #eee; margin: 40px 0;
  }

  ul, ol {
    margin: 14px 0; padding-left: 22px;
  }

  li {
    margin-bottom: 6px; font-size: 15.5px; color: #333;
  }

  strong { color: #111; }

  code {
    font-family: 'SF Mono', 'Consolas', 'Liberation Mono', monospace;
    background: #f3f3f3; padding: 1px 5px; border-radius: 3px;
    font-size: 0.88em; color: #333;
  }

  pre {
    background: #f7f7f7;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    padding: 18px 20px;
    margin: 24px 0;
    overflow-x: auto;
    font-size: 13.5px;
    line-height: 1.65;
  }

  pre code {
    background: none; padding: 0; border-radius: 0;
    font-size: inherit; color: #333;
  }

  blockquote {
    border-left: 2px solid #ddd;
    padding: 10px 18px; margin: 24px 0; color: #666;
    font-size: 14px;
  }

  table {
    width: 100%; border-collapse: collapse;
    margin: 24px 0; font-size: 15px; color: #333;
  }

  th, td {
    border: 1px solid #e0e0e0;
    padding: 10px 14px; text-align: left; line-height: 1.6;
  }

  th { background: #f7f7f7; font-weight: 600; }
  tr:nth-child(even) td { background: #fafafa; }

  .toolbar {
    position: fixed;
    top: 20px;
    right: 24px;
    display: flex;
    gap: 4px;
    align-items: center;
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 4px;
    border-radius: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06);
    z-index: 1000;
  }

  .toolbar button {
    background: transparent;
    color: #8e8e93;
    border: none;
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 15px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
    min-width: 36px;
  }

  .toolbar button:hover { background: rgba(0,0,0,0.05); }
  .toolbar button:active { background: rgba(0,0,0,0.08); }

  .toolbar .zoom-label {
    font-size: 12px;
    color: #8e8e93;
    min-width: 38px;
    text-align: center;
    user-select: none;
    font-weight: 500;
  }

  @media print {
    html { font-size: 11pt; }
    body { background: #fff; }
    article { max-width: none; padding: 0; margin: 0; }
    h1, h2, h3 { page-break-after: avoid; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
    .toolbar { display: none; }
  }

  @page { margin: 2cm; size: A4; }
`;

function buildHtml(mdContent, title) {
  const body = marked(mdContent);
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="zoom(-10)">\u2212</button>
    <span class="zoom-label" id="zoomLabel">100%</span>
    <button onclick="zoom(10)">+</button>
    <button onclick="window.print()">PDF</button>
  </div>
  <article id="content">${body}</article>
  <script>
    let scale = 100;
    const content = document.getElementById('content');
    const label = document.getElementById('zoomLabel');
    function zoom(d) {
      scale = Math.max(50, Math.min(200, scale + d));
      content.style.zoom = scale / 100;
      label.textContent = scale + '%';
    }
  </script>
</body>
</html>`;
}

function openBrowser(filePath) {
  const platform = os.platform();
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  execSync(`${cmd} "${filePath}"`);
}

function convert(inputPath, outDir) {
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const md = fs.readFileSync(inputPath, "utf-8");
  const baseName = path.basename(inputPath, ".md");
  fs.mkdirSync(outDir, { recursive: true });

  const html = buildHtml(md, baseName);
  const htmlPath = path.join(outDir, `${baseName}.html`);
  fs.writeFileSync(htmlPath, html);

  openBrowser(htmlPath);
  console.log(htmlPath);

  // 임시 파일이면 브라우저 로딩 후 삭제
  if (outDir.startsWith(os.tmpdir())) {
    setTimeout(() => {
      fs.rmSync(outDir, { recursive: true, force: true });
    }, 60000);
  }
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
  mdviewer - Markdown to styled HTML viewer

  Usage:
    mdviewer <file.md|folder> [--out <dir>]

  Examples:
    mdviewer README.md
    mdviewer ./docs
    mdviewer README.md --out ./export

  Output: opens in browser. HTML is saved to a temp directory by default.
  Use --out to specify a custom output directory.
  PDF: use the PDF button in the browser toolbar.
`);
  process.exit(0);
}

const target = path.resolve(args[0]);
const outIdx = args.indexOf("--out");
const outDirArg = outIdx !== -1 ? path.resolve(args[outIdx + 1]) : null;
const defaultOut = () => outDirArg || fs.mkdtempSync(path.join(os.tmpdir(), "mdviewer-"));

if (fs.statSync(target).isDirectory()) {
  const files = fs.readdirSync(target).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.log("No .md files found.");
    process.exit(0);
  }
  const outDir = defaultOut();
  for (const f of files) {
    convert(path.join(target, f), outDir);
  }
} else {
  const outDir = defaultOut();
  convert(target, outDir);
}
