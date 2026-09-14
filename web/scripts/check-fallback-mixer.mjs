// Checks that the standby mixer actually works, before trusting it to rescue
// a class mid-lesson.
//
//   FALLBACK_MODEL_API_KEY=sk-... FALLBACK_FAST_MODEL=<model> \
//     node scripts/check-fallback-mixer.mjs
//
// Both values come from the shell, not .env.local: nothing in scripts/ loads
// that file, and a blank there would not mean the same as absent.
//
// It sends the same request lib/mix/providers.ts sends, so a pass here means
// the wire format is right rather than merely that the key works. It answers
// the three things that decide whether the standby is usable at all:
//
//   1. Is the model name the one the API expects? A wrong name is worse than
//      no standby, because the rescue fails instead of the primary.
//   2. Does it accept JSON mode on chat completions? Some newer models want a
//      different surface or refuse the parameter, and the failover path is the
//      wrong place to discover that.
//   3. Does it answer inside the budget? The standby gets roughly twelve
//      seconds on the study route. A model that needs longer will time out
//      every time, which looks identical to the outage it was meant to fix.
//
// The third question is the reason the sample below is large rather than
// convenient. A one paragraph prompt returns in a couple of seconds from
// almost anything and proves nothing: the study route sends up to 60,000
// characters of notes and asks for 12 to 20 cards, and on a reasoning model
// both the thinking and the writing grow with that. A toy request that passes
// is how you ship a standby that times out on every real deck.
//
// The key is never printed, and nothing is stored.

const apiKey = process.env.FALLBACK_MODEL_API_KEY;
const model = process.env.FALLBACK_FAST_MODEL;

if (!apiKey || !model) {
  console.error(
    "Set both FALLBACK_MODEL_API_KEY and FALLBACK_FAST_MODEL in the shell, for example:\n" +
      "  FALLBACK_MODEL_API_KEY=sk-... FALLBACK_FAST_MODEL=<model> node scripts/check-fallback-mixer.mjs",
  );
  process.exit(2);
}

/** The budget the standby actually gets on the study route. */
const STANDBY_BUDGET_MS = 12_000;

const schema = {
  type: "object",
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: { front: { type: "string" }, back: { type: "string" } },
      },
    },
  },
};

/**
 * Roughly what a real Pot sends. Not the 60,000 character ceiling, because a
 * check that takes a minute does not get run, but far enough past a toy to
 * show whether the model's thinking scales into the budget.
 */
const NOTES = [
  "Osmosis is the net movement of water across a selectively permeable membrane, from a region of higher water potential to one of lower water potential.",
  "Tonicity describes what a surrounding solution does to a cell's volume. A hypotonic solution has a lower solute concentration than the cell, so water enters and the cell swells.",
  "A hypertonic solution has a higher solute concentration, so water leaves and the cell shrinks, a process called plasmolysis in plant cells.",
  "An isotonic solution has the same effective solute concentration, so there is no net movement and the cell holds its volume.",
  "Water potential combines solute potential and pressure potential. Adding solute lowers water potential; pressure raises it.",
  "Plant cells rely on turgor pressure from the cell wall pushing back against the swollen vacuole, which is what keeps a leaf rigid rather than wilted.",
  "Animal cells have no wall, so a hypotonic surrounding can burst them, which is called lysis, while a hypertonic one leaves them crenated.",
  "Facilitated diffusion moves solutes down their gradient through channel or carrier proteins, without spending ATP.",
  "Active transport moves solutes against their gradient and does spend ATP, as in the sodium potassium pump that exchanges three sodium out for two potassium in.",
  "Aquaporins are channel proteins that let water cross far faster than it could through the lipid bilayer alone, which matters in kidney tubules.",
].join(" ");

// About 20,000 characters, the shape of a mid sized Pot.
const material = `${NOTES} `.repeat(Math.ceil(20_000 / (NOTES.length + 1))).slice(0, 20_000);

const started = Date.now();
const controller = new AbortController();
// Deliberately generous, so a slow model reports its real time rather than an
// abort. The verdict below compares against the real budget.
const timeout = setTimeout(() => controller.abort(), 60_000);

let response;
try {
  response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Create 16 recall flashcards from the material. Avoid duplicates and trivia." +
            `\n\nReply with JSON alone, matching this schema:\n${JSON.stringify(schema)}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: material },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
    signal: controller.signal,
  });
} catch (error) {
  clearTimeout(timeout);
  console.error(`FAIL  the request did not complete: ${error.message}`);
  console.error("      A bad host or a severed connection, not a model problem.");
  process.exit(1);
}
clearTimeout(timeout);

const elapsed = Date.now() - started;
const payload = await response.json().catch(() => null);

if (!response.ok) {
  const message = payload?.error?.message ?? "no message";
  console.error(`FAIL  HTTP ${response.status} after ${elapsed}ms`);
  console.error(`      ${message}`);
  if (response.status === 404 || /does not exist|unknown model/i.test(message)) {
    console.error(
      "\n      That model name is not one this key can call. Get the exact id from\n" +
        "      the OpenAI dashboard, or list what the key can see:\n" +
        '        curl https://api.openai.com/v1/models -H "Authorization: Bearer $FALLBACK_MODEL_API_KEY" \\\n' +
        "          | grep '\"id\"'",
    );
  }
  if (/response_format|json_object|unsupported/i.test(message)) {
    console.error(
      "\n      This model will not take JSON mode on chat completions. The standby\n" +
        "      adapter in lib/mix/providers.ts needs a different surface for it.",
    );
  }
  process.exit(1);
}

const content = payload?.choices?.[0]?.message?.content;
if (typeof content !== "string") {
  console.error(`FAIL  HTTP 200 after ${elapsed}ms, but the reply had no message content.`);
  console.error("      lib/mix/providers.ts reads choices[0].message.content.");
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(content);
} catch {
  console.error(`FAIL  HTTP 200 after ${elapsed}ms, but the content was not JSON.`);
  console.error(`      First 200 characters: ${content.slice(0, 200)}`);
  process.exit(1);
}

const cards = Array.isArray(parsed.cards) ? parsed.cards.length : 0;
console.log(`OK    HTTP 200 in ${elapsed}ms, JSON parsed.`);
console.log(`      ${material.length} characters in, ${cards} cards out.`);

if (elapsed > STANDBY_BUDGET_MS) {
  console.warn(
    `\nWARN  ${elapsed}ms is over the ${STANDBY_BUDGET_MS}ms the standby gets on the\n` +
      "      study route. This model will time out on the rescue it exists for,\n" +
      "      which trades one failure for another. Try a faster sibling.",
  );
  process.exit(3);
}

console.log(
  `\n      Inside the ${STANDBY_BUDGET_MS}ms standby budget. The study route can send\n` +
    "      up to 60,000 characters, three times this, so leave headroom.",
);
