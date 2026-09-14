// Renders Clerk's prebuilt sign in screen four ways, into
// docs/reference/clerk-signin/. Run from web/:
//
//   node scripts/clerk-signin-mockups.mjs
//
// These are not drawings. The Account Portal sits behind a Cloudflare bot
// check that a headless browser cannot pass, so instead this loads the live
// site, which already loads clerk-js from clerk.meltingpots.xyz, and calls
// Clerk.mountSignIn() on it. The result is the genuine component with the
// real publishable key and the instance's real settings.
//
// The app itself mounts no Clerk UI at all (only <ClerkProvider>), so nothing
// here reflects what meltingpots.xyz shows a visitor today. It answers one
// question: what would the prebuilt component look like if it were adopted.
// See docs/reference/clerk-signin/README.md.

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pw from "@playwright/test";

const { chromium } = pw;
const OUT = fileURLToPath(new URL("../../docs/reference/clerk-signin/", import.meta.url));
const SITE = process.env.CLERK_MOCKUP_ORIGIN ?? "https://meltingpots.xyz";

const CHROMIUM = [
  process.env.PW_CHROMIUM_PATH,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
].find((p) => p && existsSync(p));

// The egress proxy drops Chromium's TLS 1.3 post-quantum hello, so the live
// site is unreachable without these flags. See memory/lessons/016.
const LAUNCH_ARGS = [
  "--disable-features=PostQuantumKyber,UseMLKEM,EncryptedClientHello",
  "--ssl-version-max=tls1.2",
];

// MeltingPot's tokens from web/app/globals.css, expressed as Clerk's
// appearance prop. Both the old and new variable names are given: Clerk
// ignores the ones its version does not know.
const SITE_PALETTE = {
  variables: {
    colorPrimary: "#ab5a14",
    colorText: "#24222c",
    colorForeground: "#24222c",
    colorTextSecondary: "#5c5952",
    colorMutedForeground: "#5c5952",
    colorBackground: "#fffdf6",
    colorInputBackground: "#fffdf6",
    colorInput: "#fffdf6",
    colorInputText: "#24222c",
    colorNeutral: "#24222c",
    colorDanger: "#bf4b2b",
    colorTextOnPrimaryBackground: "#fffdf6",
    colorPrimaryForeground: "#fffdf6",
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontFamilyButtons: 'Inter, ui-sans-serif, system-ui, sans-serif',
    borderRadius: "0.75rem",
  },
  elements: {
    card: { border: "1px solid #ede3cc", boxShadow: "0 1px 2px rgba(36,34,44,.05)", background: "#fffdf6" },
    formButtonPrimary: { borderRadius: "999px", fontWeight: 600, textTransform: "none" },
    formFieldInput: { borderColor: "#dbcfaf" },
    footer: { background: "#f7f0dd", borderTop: "1px solid #ede3cc" },
    footerActionLink: { color: "#ab5a14" },
  },
};

// Runs in the page. Hides the "Secured by Clerk" row the way the dashboard
// toggle would, by climbing from the badge to the largest wrapper that still
// contains nothing but the badge. Clerk's class names are hashed per build,
// so nothing here may depend on them.
const hideBadge = () => {
  const link = document.querySelector('#mount a[href*="clerk.com"]');
  const seed =
    link ||
    [...document.querySelectorAll("#mount *")].find(
      (n) => n.children.length === 0 && /secured by/i.test(n.textContent || ""),
    );
  if (!seed) return "no badge found";
  let node = seed;
  while (
    node.parentElement &&
    node.parentElement.id !== "mount" &&
    /^\s*secured by\s*(clerk)?\s*$/i.test(node.parentElement.textContent || "")
  ) {
    node = node.parentElement;
  }
  node.style.display = "none";
  return "hidden";
};

// Google is not an enabled connection on the instance, so the real component
// will not draw this block. It is reconstructed from Clerk's own bundle
// (@clerk/ui, ui-common): socialButtonsBlockButton is
// "Continue with {{provider|titleize}}", dividerText is "or", and the logo is
// https://img.clerk.com/static/<provider>.svg. The metrics are measured off
// the live component rather than guessed: input and primary button are both
// 32px tall at 13px. The form's first child is a zero-height node, so the
// form already carries its own 32px of leading and this block needs no
// bottom margin.
const addGoogleButton = ({ logo }) => {
  const form = document.querySelector("#mount form");
  if (!form) return "no form";
  const input = form.querySelector("input");
  const fontFamily = getComputedStyle(input).fontFamily;
  const h = Math.round(input.getBoundingClientRect().height);

  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:1.5rem";
  wrap.innerHTML = `
    <button type="button" style="
      display:flex;align-items:center;justify-content:center;gap:.625rem;
      width:100%;height:${h}px;border:1px solid #dbcfaf;border-radius:999px;
      background:#fffdf6;color:#24222c;cursor:pointer;
      font-family:${fontFamily};font-size:13px;font-weight:500;line-height:1;
      box-shadow:0 1px 1px rgba(36,34,44,.04);">
      <img src="${logo}" alt="" width="16" height="16" style="display:block">
      <span>Continue with Google</span>
    </button>
    <div style="display:flex;align-items:center;gap:1rem;color:#756f5e;
                font-family:${fontFamily};font-size:13px;line-height:1">
      <span style="flex:1;height:1px;background:#ede3cc"></span>
      <span>or</span>
      <span style="flex:1;height:1px;background:#ede3cc"></span>
    </div>`;
  form.parentElement.insertBefore(wrap, form);
  return `added at ${h}px`;
};

async function googleLogoDataUri() {
  const local = new URL("../../docs/reference/clerk-signin/google.svg", import.meta.url);
  let svg;
  try {
    const res = await fetch("https://img.clerk.com/static/google.svg");
    if (!res.ok) throw new Error(`status ${res.status}`);
    svg = await res.text();
    await writeFile(local, svg);
  } catch {
    svg = await readFile(local, "utf8");
  }
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const logo = await googleLogoDataUri();
  const proxy = process.env.HTTPS_PROXY?.replace(/^https?:\/\//, "");

  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    args: LAUNCH_ARGS,
    proxy: proxy ? { server: `http://${proxy}` } : undefined,
  });
  const ctx = await browser.newContext({
    viewport: { width: 760, height: 980 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });

  // `keepSiteCss` matters. Clerk's default fontFamily is `inherit`, so with
  // the app's stylesheets stripped the component falls back to the browser's
  // serif, which is not Clerk's look either; the stock shots therefore supply
  // a neutral system sans. The palette shots keep the site's own stylesheet,
  // because that is where Inter and the brand focus ring come from.
  const variants = [
    { file: "1-stock", appearance: null, badge: true, bg: "#f4f4f5", step2: true },
    { file: "2-badge-removed", appearance: null, badge: false, bg: "#f4f4f5" },
    { file: "3-site-palette", appearance: SITE_PALETTE, badge: false, bg: "#faf4e6", siteCss: true, step2: true },
    { file: "4-site-palette-google", appearance: SITE_PALETTE, badge: false, bg: "#faf4e6", siteCss: true, google: true },
  ];

  for (const v of variants) {
    const page = await ctx.newPage();
    await page.goto(`${SITE}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, { timeout: 30_000 });

    await page.evaluate(({ bg, siteCss }) => {
      if (!siteCss) document.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => n.remove());
      document.body.innerHTML = '<div id="stage"><div id="mount"></div></div>';
      const s = document.createElement("style");
      const font = siteCss
        ? ""
        : '#stage{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}';
      // The card is screenshotted with its own padding rather than the whole
      // stage, so the output is tight and deterministic instead of a card
      // adrift in a viewport-sized field of background.
      s.textContent =
        `*{margin:0;box-sizing:border-box}#stage{min-height:100vh;display:flex;align-items:center;` +
        `justify-content:center;background:${bg}}#mount{padding:44px;background:${bg}}` + font;
      document.head.appendChild(s);
    }, { bg: v.bg, siteCss: !!v.siteCss });

    await page.evaluate(
      (a) => window.Clerk.mountSignIn(document.getElementById("mount"), a ? { appearance: a } : {}),
      v.appearance,
    );
    await page.waitForTimeout(5500);

    if (!v.badge) await page.evaluate(hideBadge);
    if (v.google) console.log(`  ${v.file} google block:`, await page.evaluate(addGoogleButton, { logo }));
    await page.waitForTimeout(400);

    await page.locator("#mount").screenshot({ path: `${OUT}${v.file}.png` });
    console.log(`${v.file}:`, (await page.locator("#mount").innerText()).replace(/\n+/g, " | "));

    if (v.step2) {
      // Clerk is identifier-first: the password lives on a second screen.
      // The probe account is documented in docs/CLERK.md and owns nothing.
      await page.locator('#mount input[type="email"], #mount input[name="identifier"]').first()
        .fill("probe.mtsttlzz@meltingpots.xyz");
      await page.locator('#mount button:has-text("Continue")').first().click();
      await page.waitForTimeout(6000);
      if (!v.badge) await page.evaluate(hideBadge);
      await page.locator("#mount").screenshot({ path: `${OUT}${v.file}-step2.png` });
      console.log(`${v.file}-step2:`, (await page.locator("#mount").innerText()).replace(/\n+/g, " | "));
    }
    await page.close();
  }

  await browser.close();
  console.log(`\nWrote ${OUT}`);
}

await main();
