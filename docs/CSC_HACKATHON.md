# CSC Back-to-School Hackathon

The entry this repository is now aimed at. Written 2026-09-04 so the facts survive a
context window, not as marketing. Everything here was read off the Devpost page rather
than remembered.

**Devpost:** https://csc-back-to-school.devpost.com/

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

1. **Learning** - understanding of what was built, and what the team learned.
2. **Design** - clarity, interface, usability.
3. **Creativity** - originality and a thoughtful approach.
4. **Functionality** - how well it works and demonstrates the concept.
5. **Impact** - addresses a real school problem with clear usefulness.

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

## AI rules

"AI tools are allowed and encouraged", ChatGPT and Claude named explicitly. The condition:
"Teams must disclose how they used AI and must be able to explain their project, their
decisions, and how their final product works."

That disclosure is a submission field, so it needs writing. This repository is unusually well
placed for it: `memory/decisions/` and `docs/BUILDLOG.md` already record what was chosen and
why, one note per decision, at the moment it was made.

## Prizes

Gold $250 plus sponsor credits, Silver $100, Bronze $50, and five honourable mentions.

## Hosting

The Prometheus deploy at `meltingpot-prometheus.netlify.app` is **not** the target any more.
This entry deploys to its own Netlify subdomain, `meltingpot-csc`. A new Netlify site has to
be created; the deploy shape is unchanged from the old one, described in `web/netlify.toml`:
`web/` is the package root, and `@netlify/plugin-nextjs` must be declared explicitly or every
route 404s.

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
