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
            "Create 2 recall flashcards from the material." +
            `\n\nReply with JSON alone, matching this schema:\n${JSON.stringify(schema)}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Osmosis is the movement of water across a semipermeable membrane, from lower to higher solute concentration.",
            },
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

console.log(`OK    HTTP 200 in ${elapsed}ms, JSON parsed.`);
console.log(`      Keys returned: ${Object.keys(parsed).join(", ") || "(none)"}`);

if (elapsed > STANDBY_BUDGET_MS) {
  console.warn(
    `\nWARN  ${elapsed}ms is over the ${STANDBY_BUDGET_MS}ms the standby gets on the study\n` +
      "      route, and this was a two card request against one short paragraph.\n" +
      "      A real deck or a practice test is much larger. This model will\n" +
      "      probably time out on the rescue it exists for. Pick a faster one,\n" +
      "      or the failover will trade one failure for another.",
  );
  process.exit(3);
}

console.log(
  `\n      Inside the ${STANDBY_BUDGET_MS}ms standby budget. Note this was a small\n` +
    "      request: a full deck or test is larger, so leave headroom.",
);
