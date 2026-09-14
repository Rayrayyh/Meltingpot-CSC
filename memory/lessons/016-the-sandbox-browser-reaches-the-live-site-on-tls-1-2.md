# 016 The sandbox browser reaches the live site once TLS 1.3's post-quantum hello is off

Summary: Headless Chromium in the sandbox got ERR_CONNECTION_RESET on every https site through the agent proxy while curl worked; the egress proxy drops Chromium's TLS 1.3 client hello (post-quantum key share), and launching with `--disable-features=PostQuantumKyber,UseMLKEM,EncryptedClientHello --ssl-version-max=tls1.2` plus Playwright's `proxy: { server: process.env.HTTPS_PROXY }` gets through. Found 2026-09-08 while screenshotting the live Clerk sign in.

## What happened

Every attempt to open https://meltingpots.xyz in the container's Chromium, with
and without proxy arguments, ended in `net::ERR_CONNECTION_RESET`, while curl
and Node reached the same page through `HTTPS_PROXY`. The proxy's status
endpoint (`curl -sS "$HTTPS_PROXY/__agentproxy/status"`) showed
`ws_closed_mid_exchange` relay failures after about 1.7 KB sent, which is the
size of a TLS 1.3 client hello carrying a hybrid post-quantum key share.
Disabling the post-quantum features alone was not enough; capping the browser
at TLS 1.2 was.

## What to do

Launch through Playwright with the proxy option and these arguments:

```js
chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  proxy: { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" },
  args: ["--disable-features=PostQuantumKyber,UseMLKEM,EncryptedClientHello", "--ssl-version-max=tls1.2"],
});
```

and `ignoreHTTPSErrors: true` on the context (the proxy re-terminates TLS with
its own certificate). The Playwright suite is unaffected: it talks to
localhost, which bypasses the proxy. Live checks of the deployed site, the
owner's "step D" walk among them, can now be done from here, signed out; a
signed in walk still needs an account the owner provides, since creating one
on the production Clerk instance cannot be undone without the secret key.
