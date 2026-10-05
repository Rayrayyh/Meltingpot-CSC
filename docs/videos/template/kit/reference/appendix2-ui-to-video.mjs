// Turns the product's real UI, captured state by state (capture.mjs: reference/ui/NN-name.html + one .css), into
// states the video can show: the product's own markup and stylesheet, each in a shadow root, fixed to one theme and
// size, with the product's own animations switched off (every motion in the video comes from its seekable timeline).
// Output: a classic script, window[CONFIG.global] = { css, width, height, states }.
// Usage (from the video's source folder): node tools/ui-to-video.mjs
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CONFIG = {
  ref: 'reference/ui', // the captures
  out: 'assets/product-ui.js',
  global: 'PRODUCT_UI',
  start: '<div id="root">', // where the app's markup starts in a captured page (its mount element)
  width: 360, // the UI's size in the video, in CSS px (Tabbit's docked side panel: 360 × 765)
  height: 765,
  theme: 'dark', // which prefers-color-scheme rules to keep
  // Image URLs the render can't load (extension or app-internal URLs): [pattern, replacer]. Point them at local files.
  rewrite: [
    // Tabbit: Chrome's favicon service inside the extension → assets/favicons/<host>.png
    [/src="chrome-extension:\/\/[^/]+\/_favicon\/\?pageUrl=([^&"]+)[^"]*"/g, (_, u) => `src="assets/favicons/${new URL(decodeURIComponent(u)).hostname.replace(/^www\./, '')}.png"`],
  ],
  // Markup that isn't part of the story (e.g. a toast left over from setting up the capture).
  drop: [],
  // CSS variables read from each page and set on its root (Tabbit: --top-h, the measured header height).
  readVars: ['--top-h'],
};

/** Each @media block: keep its rules (unwrap), drop it, or leave it as it is. */
function media(css, decide) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf('@media', i);
    if (at < 0) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, at);
    const open = css.indexOf('{', at);
    const query = css.slice(at + 6, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    const d = decide(query);
    if (d === 'keep') out += css.slice(open + 1, j - 1);
    else if (d === 'as-is') out += css.slice(at, j);
    i = j;
  }
  return out;
}

function scopeCss(raw) {
  const other = CONFIG.theme === 'dark' ? 'light' : 'dark';
  let css = media(raw, (q) => {
    if (new RegExp(`prefers-color-scheme:\\s*${CONFIG.theme}`).test(q)) return 'keep';
    if (new RegExp(`prefers-color-scheme:\\s*${other}`).test(q)) return 'drop';
    if (/hover:\s*hover/.test(q)) return 'keep';
    if (/hover:\s*none/.test(q)) return 'drop';
    if (/prefers-reduced-motion/.test(q)) return 'drop';
    const lt = /width\s*<=\s*(\d+)px/.exec(q) ?? /max-width:\s*(\d+)px/.exec(q);
    if (lt) return CONFIG.width <= Number(lt[1]) ? 'keep' : 'drop';
    const gt = /width\s*>=\s*(\d+)px/.exec(q) ?? /min-width:\s*(\d+)px/.exec(q);
    if (gt) return CONFIG.width >= Number(gt[1]) ? 'keep' : 'drop';
    return 'as-is';
  });
  css = css
    .replace(/:root/g, '.ui-root')
    .replace(/(^|[}{,\s>+~])html(?=[\s,{:.[])/g, '$1.ui-root')
    .replace(/(^|[}{,\s>+~])body(?=[\s,{:.[])/g, '$1.ui-body')
    .replace(/\b100d?vh\b/g, 'var(--ui-h)')
    .replace(/\b(\d{1,2})d?vh\b/g, (_, n) => `calc(var(--ui-h) * .${n.padStart(2, '0')})`);
  // Fixed layers (sheets, toasts) anchor to the UI: the host gets a transform, so "fixed" means "in the UI".
  return `:host{display:block;contain:paint}${css}*,*::before,*::after{animation:none!important;transition:none!important}`;
}

function markup(html) {
  const start = html.indexOf(CONFIG.start);
  const end = html.lastIndexOf('</body>');
  if (start < 0) throw new Error(`no ${CONFIG.start} in a capture: set CONFIG.start to the app's mount element`);
  let m = html.slice(start, end).replace(/<script[\s\S]*?<\/script>/g, '');
  for (const [re, fn] of CONFIG.rewrite) m = m.replace(re, fn);
  for (const re of CONFIG.drop) m = m.replace(re, '');
  const vars = CONFIG.readVars.map((v) => {
    const val = new RegExp(`${v}:\\s*([^;"]+)`).exec(html)?.[1];
    return val ? `${v}:${val.trim()};` : '';
  }).join('');
  return `<div class="ui-root" data-theme="${CONFIG.theme}" style="${vars}--ui-h:${CONFIG.height}px;width:${CONFIG.width}px;height:${CONFIG.height}px;position:relative;overflow:hidden;background:var(--bg);color:var(--text)"><div class="ui-body" style="height:100%">${m}</div></div>`;
}

const REF = resolve(CONFIG.ref);
const files = readdirSync(REF).filter((f) => /^\d\d-.+\.html$/.test(f)).sort();
const states = {};
for (const f of files) states[f.replace(/^\d\d-|\.html$/g, '')] = markup(readFileSync(resolve(REF, f), 'utf8'));
const css = scopeCss(readdirSync(REF).filter((f) => f.endsWith('.css')).map((f) => readFileSync(resolve(REF, f), 'utf8')).join('\n'));
mkdirSync(dirname(resolve(CONFIG.out)), { recursive: true });
writeFileSync(resolve(CONFIG.out), `// Generated by tools/ui-to-video.mjs from ${CONFIG.ref} (the product's real UI). Do not edit.\nwindow.${CONFIG.global} = ${JSON.stringify({ css, width: CONFIG.width, height: CONFIG.height, states })};\n`);
console.log(`states: ${Object.keys(states).join(', ')}; css ${css.length} chars`);
