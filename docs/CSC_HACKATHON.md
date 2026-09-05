# CSC Back-to-School Hackathon

The entry this repository is now aimed at. Written 2026-09-04 so the facts survive a
context window, not as marketing. Everything here was read off the Devpost page rather
than remembered.

**Devpost:** https://csc-back-to-school.devpost.com/
**Authoritative text:** `CSC_Hackathon-Rules.txt` at the repository root. Where this file
and the Devpost page disagree, the rules file wins; it is fuller.

## The brief

"Build an app, tool, website, or gadget that helps students, teachers, or schools solve a
real school-life problem."

MeltingPot already answers this without being bent: a class pours rough notes into a shared
vault, an organizer structures them, the writer approves before anything is shared, and
corrections go through maintainer review. The school-life problem is that a class generates
knowledge constantly and almost all of it evaporates.

## Deadline

**5 October 2026, 12:00am PDT.** Far enough out that nothing needs to be rushed, which is a
different footing from the last entry.

## Eligibility, and the thing to check first

- **Ages 13 to 18 only, students only.** Companies and professional organisations are
  excluded.
- Teams of up to four, or an individual.
- Open to all countries and territories except the usual excluded list.

The age and student rules are pass or fail before any judging happens. Confirm they hold
before spending more effort.

## How it is judged

Five criteria, and Devpost publishes **no point values or weights** for them. That is a real
difference from the Prometheus challenge, which was four categories of 25. Do not assume a
100 point scale.

1. **Learning** - "Can the team clearly identify what they built, why they built it, how it
   works, and what they learned? AI tools are allowed and will not lower anyone's score, but
   disclosure must reveal the use of AI and show understanding of the final product."
2. **Design** - "Is the project easy to understand and use? A strong project will have a
   clear interface, thoughtful design, simple user flow, and practical use cases."
3. **Creativity** - "Is the idea thoughtful, original, or interesting? A strong project does
   not need to be complicated, but it should show a clear, non-generic approach."
4. **Functionality** - "How well does the project work?" A working app, demo or clear proof
   of concept.
5. **Impact** - "Does the project address a real school-life problem?" Naming who it affects
   and why the solution helps.

Read those descriptions rather than the one word titles. Learning is scored on the team's
own account of the build, and it explicitly ties the AI disclosure to showing understanding,
not to owning up to something. This repository is unusually well placed there: `memory/`
holds one note per decision, written when the decision was made.

Two of those five, Design and Functionality, are where the sidebar work in this round pays.
Learning is scored on the team's own account of what they built, which means the write up
matters as much as the code.

## What must be submitted

- Project name.
- "Short description of the problem you are solving".
- "Explanation of what your project does".
- "Demo link, website link, video, screenshots, photos, or another way for judges to
  understand the project".
- "List of tools, technologies, APIs, datasets, hardware, or AI tools used".
- "AI-use disclosure explaining how your team used AI".
- Team member names.
- "Source code, build files, or design files if available".

A **1 to 2 minute demo video is optional but encouraged**. Shorter than the last entry's two
minute cap, and no longer mandatory.

For the tools field, as of 5 September 2026: Next.js 16, React 19, TypeScript, Tailwind,
Framer Motion, Supabase (Postgres, Auth, Storage, Vault, pg_cron, pg_net), Netlify, Google's
Gemini API for the organizer and study material, Google Classroom API with Google OAuth 2.0,
and the Canvas LMS REST API with Canvas OAuth2 (against a stub until the school's developer
key lands). Classwork is read-only import (`docs/CLASSWORK.md`); it changes nothing about the
Gemini clause below, since no imported text reaches the model until a person makes a note of it
and shares it, and that share goes through the same organizer path as any other note.

## AI rules

"AI tools are allowed and encouraged", ChatGPT and Claude named explicitly. The condition:
"Teams must disclose how they used AI and must be able to explain their project, their
decisions, and how their final product works."

That disclosure is a submission field, so it needs writing. This repository is unusually well
placed for it: `memory/decisions/` and `docs/BUILDLOG.md` already record what was chosen and
why, one note per decision, at the moment it was made.

## Prizes, and the opt in they require

Gold $250, Silver $100, Bronze $50, plus sponsor credits, and five honourable mentions.

Every award requires the team to **opt in** and agree to six terms. Two of them are worth
knowing before submission day:

1. "The project must be open source or publicly viewable after submission." This one is
   already satisfied: MIT licence, public repository.
2. CSC may feature and promote the project on its own channels, and may contact the team
   afterwards about sharing it more widely. Ownership stays with the creators.

The rest are the AI disclosure and being able to explain what was built.

One sponsor condition has a build implication: the **Render** credits require that "the
winning project must use Render Workflows", and Render prohibits use by anyone under 16.
This project deploys on Netlify, so that prize is not reachable without changing hosting.
The Momen, n8n, Boot.dev and KnowledgeOwl prizes carry no such requirement.

## The sponsor perk that matters here

Participants get a month of **Featherless.ai**, hosted AI models with no inference cost.
That is worth a hard look, because of a problem this project already has: the Gemini
Developer API terms say a user "must be 18 years of age or older" and forbid use in a
service "likely to be accessed by individuals under the age of 18". This hackathon is for
students aged 13 to 18 building tools for school, so the clause bites harder here than it
did before. Featherless, or Vertex AI with the Cloud Data Processing Addendum, are the two
routes out. Do not ship a school-facing AI feature on the Developer API without settling
this.

## Hosting

The Prometheus deploy at `meltingpot-prometheus.netlify.app` is **not** the target any more.
This entry lives at https://meltingpot-csc.netlify.app (Netlify site id
`f8138e4f-b2cf-4351-b930-ec14bbb74668`, same team, same Supabase project as before). The deploy
shape is unchanged from the old one, described in `web/netlify.toml`: `web/` is the package root,
and `@netlify/plugin-nextjs` must be declared explicitly or every route 404s. As of 5 September
2026 the site carries the Supabase URL and anon key and the two model names, but not the model
API key or any classwork variable; the organizer runs deterministic and Connected classes reads
"not set up on this site" until the owner sets them.

## What this repository is, and what it is missing

`Rayrayyh/Meltingpot-CSC`, cloned shallow at `main` = `f2cab37`, which is the merge of pull
request #1 in the older repository. It is a copy taken at that point.

It therefore **does not contain** four commits made in `Rayrayyh/Melting-Pot` on 2026-09-04:

1. The README corrected against what shipped, including the test counts.
2. A pass making the repository's own documents true, including removing the false claim in
   `CLAUDE.md` that there are no live model calls.
3. The landing mockups renamed to the class's own names.
4. The practice test fix: study material moved to the fast model, and the model call
   deadlined from the start of the request so a timeout returns the app's own message rather
   than a gateway error.

Number 4 is a real bug fix and this repository still has the bug. Decide deliberately whether
to port these across rather than discovering the gap later.

Also still present here, and deleted from the other repository: `404 Page.dc.html`, two
ChatGPT PNGs, `Meltingpot Palette.pdf`, and `Prometheus August AI Challenge.txt`. That last
one names the previous hackathon at the repository root.
