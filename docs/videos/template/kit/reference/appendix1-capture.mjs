// Captures the product's REAL UI at each moment the video needs: for every shot, the page's markup (NN-name.html),
// its visible text (NN-name.txt) and a 2x PNG (NN-name.png); the stylesheets once (styles.css). tools/ui-to-video.mjs
// turns these into the states the composition shows. Nothing is typed into the video by hand: every word comes from here.
// Needs: npm i -D playwright (or playwright-core with a Chromium path in CONFIG.executablePath).
// Usage (from the video's source folder): node tools/capture.mjs
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { chromium } = await import('playwright').catch(() => import('playwright-core'));

const CONFIG = {
  out: 'reference/ui',
  // A web app: its URL (a local build with demo data). A Chrome extension: leave url null and set extension + page.
  url: 'http://localhost:5173/',
  extension: null, // absolute path to the unpacked build, e.g. '/path/to/dist'
  page: 'sidepanel.html', // the extension page to open (shown in a tab sized like the panel)
  width: 360, // the UI's size in the video
  height: 765,
  colorScheme: 'dark',
  timezoneId: 'America/New_York',
  // The capture clock: a fixed date and time, so "Saturday at 9" reads as written (not "tomorrow"). null = real time.
  clock: null, // e.g. '2026-10-01T16:12:00'
  executablePath: process.env.CHROMIUM_PATH || undefined,
  profile: '.cache/capture-profile', // a throwaway profile; never a real one
  stepTimeout: 30_000,
};

// The story, as the product really runs it. Each step: { goto }, { type: [selector, text] }, { press: key },
// { click: selector }, { wait: ms }, { waitFor: selector, timeout }, { waitGone: selector, timeout }, { eval: js },
// { shot: name }. Names become the states the composition uses (keep them; the video's script refers to them).
const STEPS = [
  { shot: 'rest' },
  // { type: ['#cmd', 'the AI sentence'] }, { shot: 'typed-sentence' },
  // { press: 'Enter' }, { wait: 1500 }, { shot: 'ai-thinking' },
  // { waitFor: '[role=dialog]', timeout: 240_000 }, { wait: 900 }, { shot: 'two-actions' },
  // { click: '[data-testid=confirm]' }, { wait: 1500 }, { shot: 'two-actions-done' },
];

const OUT = resolve(CONFIG.out);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const log = [];
const note = (s) => {
  log.push(s);
  console.log(s);
};

const args = CONFIG.extension ? [`--disable-extensions-except=${CONFIG.extension}`, `--load-extension=${CONFIG.extension}`] : [];
rmSync(CONFIG.profile, { recursive: true, force: true });
const ctx = await chromium.launchPersistentContext(CONFIG.profile, {
  headless: !CONFIG.extension, // extensions need a headed Chromium (use xvfb-run on a server)
  executablePath: CONFIG.executablePath,
  args,
  viewport: { width: CONFIG.width, height: CONFIG.height },
  deviceScaleFactor: 2,
  colorScheme: CONFIG.colorScheme,
  timezoneId: CONFIG.timezoneId,
});
// Words the product says outside the page (notifications, spoken replies) are logged where they are made, so the video
// shows the product's own strings, never ones typed in by hand.
await ctx.addInitScript(() => {
  const said = (globalThis.__captured = []);
  const N = globalThis.Notification;
  if (N) {
    const Wrapped = function (title, opts) {
      said.push({ kind: 'notification', title, body: opts?.body ?? '' });
      return new N(title, opts);
    };
    Wrapped.permission = N.permission;
    Wrapped.requestPermission = (...a) => N.requestPermission(...a);
    globalThis.Notification = Wrapped;
  }
  const speak = globalThis.speechSynthesis?.speak?.bind(globalThis.speechSynthesis);
  if (speak) globalThis.speechSynthesis.speak = (u) => (said.push({ kind: 'spoken', text: u.text }), speak(u));
});
if (CONFIG.clock) await ctx.clock.install({ time: new Date(CONFIG.clock) });
let n = 0;
let cssDone = false;
try {
  let url = CONFIG.url;
  if (CONFIG.extension) {
    const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'));
    url = `chrome-extension://${new URL(sw.url()).host}/${CONFIG.page}`;
  }
  const p = ctx.pages()[0] ?? (await ctx.newPage());
  await p.goto(url);
  await p.waitForLoadState('networkidle').catch(() => undefined);
  for (const s of STEPS) {
    const t = s.timeout ?? CONFIG.stepTimeout;
    if (s.goto) await p.goto(s.goto);
    else if (s.type) {
      await p.click(s.type[0], { timeout: t });
      await p.fill(s.type[0], '');
      await p.keyboard.insertText(s.type[1]); // real input events, as a person's typing makes
    } else if (s.press) await p.keyboard.press(s.press);
    else if (s.click) await p.click(s.click, { timeout: t });
    else if (s.wait) await p.waitForTimeout(s.wait);
    else if (s.waitFor) await p.waitForSelector(s.waitFor, { timeout: t });
    else if (s.waitGone) await p.waitForSelector(s.waitGone, { state: 'detached', timeout: t });
    else if (s.eval) note(`eval: ${JSON.stringify(await p.evaluate(s.eval))}`);
    else if (s.shot) {
      n += 1;
      const base = resolve(OUT, `${String(n).padStart(2, '0')}-${s.shot}`);
      await p.screenshot({ path: `${base}.png` });
      writeFileSync(`${base}.html`, await p.content());
      const text = await p.evaluate(() => document.body.innerText);
      writeFileSync(`${base}.txt`, text);
      note(`## ${n} ${s.shot}\n${text.split('\n').filter(Boolean).slice(0, 40).join(' | ')}\n`);
      const words = await p.evaluate(() => globalThis.__captured ?? []);
      if (words.length) note(`said outside the page so far: ${JSON.stringify(words)}`);
      if (!cssDone) {
        // Every stylesheet the page uses, as text (linked files are fetched; inline <style> blocks read directly).
        const css = await p.evaluate(async () => {
          const parts = [];
          for (const el of document.querySelectorAll('link[rel=stylesheet], style')) {
            if (el.tagName === 'STYLE') parts.push(el.textContent ?? '');
            else parts.push(await (await fetch(el.href)).text());
          }
          return parts.join('\n');
        });
        writeFileSync(resolve(OUT, 'styles.css'), css);
        cssDone = true;
      }
    }
  }
} catch (e) {
  note(`ERROR: ${e?.stack ?? e}`);
  process.exitCode = 1;
} finally {
  writeFileSync(resolve(OUT, 'capture-log.md'), `# The product's UI, captured for the video\n\n${log.join('\n')}\n`);
  await ctx.close().catch(() => undefined);
}
