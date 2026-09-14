# A vendor's own component can be rendered on the live origin

One-line summary: to see what a third-party UI really looks like, mount it from
the page that already loads the vendor's script, instead of reconstructing it.

The owner asked for mockups of Clerk's prebuilt sign in screen. Two obvious
routes both failed:

- `accounts.meltingpots.xyz`, the Account Portal, returns 403 with
  `cf-mitigated: challenge`. That is a Cloudflare bot check, not Clerk refusing.
  A headless browser cannot pass it and should not try.
- `@clerk/clerk-js` is not in `node_modules`. It is fetched at runtime from
  `clerk.meltingpots.xyz`, so grepping the installed packages for Clerk's
  default appearance finds nothing. The docs do not publish the defaults
  either.

What worked: meltingpots.xyz already loads clerk-js, because `<ClerkProvider>`
is mounted. So drive a browser to the live `/login`, wait for
`window.Clerk.loaded`, replace the body with a bare mount node, and call
`window.Clerk.mountSignIn(node, { appearance })`. That renders the genuine
component with the real publishable key on an origin the production instance
accepts. Reconstruction was never necessary.

Three traps in doing it:

- **Site CSS bleeds in.** The first render showed an orange focus ring that
  looked like a Clerk setting and was the app's own `:focus-visible`. Strip the
  app's stylesheets for an honest "stock" shot.
- **Then the font falls apart.** Clerk's default `fontFamily` is `inherit`, so
  with the stylesheets gone the component renders in the browser's serif, which
  is not Clerk's look either. The stage has to supply a neutral sans.
- **Do not read metrics off the first matching element.** The sign in form's
  first `button` is a zero-height node at 16px. Sizing an injected control from
  it produced an oversized label and a dead 32px gap. Measure the real control.

Hashed class names (`cl-internal-1pnppin`) change per build, so nothing may
select on them. Guessing two of them as a way to hide the "Secured by Clerk"
badge matched the whole card and blanked the render. Find the badge by its
link or its text and climb to the largest ancestor that still contains only the
badge.

The script is `web/scripts/clerk-signin-mockups.mjs`; the renders and what they
mean are in `docs/reference/clerk-signin/`.
