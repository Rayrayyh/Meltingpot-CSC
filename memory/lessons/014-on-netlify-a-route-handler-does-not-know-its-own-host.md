# 014 On Netlify's Next runtime a route handler does not know its own host

Summary: In a route handler deployed on Netlify, both `request.url` and `request.nextUrl` carry the deploy's internal permalink host (`<deploy-id>--site.netlify.app`), so a Location header built from either sends the person to a host where their session cookie does not exist; redirect relatively, or from a configured APP_ORIGIN, never from the request.

The classwork connect and callback routes built every redirect with `new URL(path, new URL(request.url).origin)`. Locally that is `http://localhost:3111`, so the end to end suite was green. On the deployed site a signed out visit to `/api/classwork/connect/google_classroom` answered `307 https://6a9c46bc...--meltingpot-csc.netlify.app/login?next=...`: the right path on the wrong host. Switching to `request.nextUrl.origin` changed nothing, because Next builds nextUrl from the same internal URL in a function; only the edge (proxy.ts) sees the forwarded host.

The fix is `redirectTo(path)` in `web/lib/classwork/route-helpers.ts`: an absolute Location on APP_ORIGIN when it is set, a relative Location otherwise. Browsers resolve a relative Location against the host they are on, which is the only host that matters. A cookie's `secure` flag is decided from `x-forwarded-proto` (or nextUrl's protocol), not from the origin the redirect used to carry.

Found by a read only sweep of the live site, not by any local test: the suite runs against one host and cannot see this class of bug. A live sweep after every deploy is the check that catches it.
