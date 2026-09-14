# What Clerk's prebuilt sign in would look like

One-line summary: four renders of Clerk's own `<SignIn />` for a decision the
owner has not made, kept so nobody has to render them again.

**None of this is on meltingpots.xyz.** The app mounts no Clerk UI. The only
Clerk component in the tree is `<ClerkProvider>` in `web/app/layout.tsx`,
which renders nothing; `/login`, `/signup` and the settings panels are
MeltingPot's own markup calling `signIn.create` and friends. These images
answer one question only: what would the prebuilt component look like if it
were adopted. See the two entries in `docs/CLERK.md` under Things to know.

Rendered 2026-09-08 against clerk-js 6.31.0 and @clerk/ui 1.32.1.

## The files

| File | What it is |
|---|---|
| `1-stock.png` | Clerk exactly as it ships, badge included |
| `1-stock-step2.png` | The password screen that follows |
| `2-badge-removed.png` | The same, with the Secured by Clerk row gone |
| `3-site-palette.png` | Badge gone, MeltingPot tokens through `appearance` |
| `3-site-palette-step2.png` | Its password screen |
| `4-site-palette-google.png` | The palette version with a Google button added |
| `google.svg` | Clerk's own provider logo, cached from img.clerk.com |

## How it looks, in words

A centred card, about 400px wide, with a heading, a subheading, one field, one
full-width button, and a separate lighter footer strip.

- Heading **"Sign in to Meltingpot"**, subheading "Welcome back! Please sign in
  to continue". That name comes from the Clerk dashboard and the casing is
  wrong: it should be MeltingPot.
- One field, "Email address", placeholder "Enter your email address". Input and
  primary button are both 32px tall, 13px type, Inter.
- Footer strip: "Don't have an account? **Sign up**", then, on stock, a second
  strip with "Secured by clerk" and the Clerk wordmark.
- Stock chrome is achromatic: near-black button (#2f3037 or so), white card,
  6px radii, grey hairlines.
- On the palette version the button becomes brand orange (#ab5a14) and a pill,
  the card becomes warm white (#fffdf6) on cream (#faf4e6) with a #ede3cc
  border, the footer strip goes warm (#f7f0dd), and links pick up the orange.
- Step two replaces the field with "Enter your password", shows the email back
  with a pencil to edit it, and adds **Forgot password?** and **Use another
  method**.

## The two things that decide this

1. **Clerk is identifier-first.** Email, Continue, then password on a second
   screen. MeltingPot asks for both at once.
2. **It brings a forgot-password flow.** MeltingPot has none. That is the
   strongest argument in Clerk's favour.

Against it: the prebuilt component cannot carry the class-code path or its
copy ("Sign in to keep your spot", "Sign in and open Pot"), it says
"Sign in to Meltingpot" and nothing about a Pot, and adopting `<UserProfile />`
too would replace the two-step settings panel. Hiding the badge needs a paid
Clerk plan in production; it is free on a development instance.

## About the Google button

`4-site-palette-google.png` is the only part that is a mockup. Google is not an
enabled connection on the instance, so the real component will not draw it. It
is reconstructed from Clerk's own bundle rather than invented:
`socialButtonsBlockButton` is `"Continue with {{provider|titleize}}"`,
`dividerText` is `"or"`, and the logo is `img.clerk.com/static/<provider>.svg`.
Sizing was measured off the live component. The one judgement call is the pill
radius, which matches the house style rather than Clerk's 6px default.

Adding Google does **not** require adopting the prebuilt component.
`authenticateWithRedirect` works from the app's own markup, so this button
could sit on the existing `/login` with the class-code path and copy intact.
That is the smaller job and the recommended one.

Clerk's Google connection is also not the Google Classroom client. They are
separate OAuth clients for separate jobs: one signs a person in, the other
reads coursework. A student would still connect Classroom separately in
settings.

## Regenerating

From `web/`:

    node scripts/clerk-signin-mockups.mjs

The Account Portal at accounts.meltingpots.xyz sits behind a Cloudflare bot
check that a headless browser cannot pass, so the script instead loads the live
site, which already loads clerk-js, and calls `Clerk.mountSignIn()` on it. That
is the genuine component with the real key. See `memory/lessons/018`.
