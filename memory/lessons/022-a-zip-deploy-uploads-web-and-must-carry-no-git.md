# 022 A zip deploy uploads web/, and must carry no .git

Summary: Two ways to break the meltingpot-csc deploy, both hit in one session on 2026-09-18. A `git worktree` export carries a `.git` pointer file that Netlify's prepare stage dies on, and uploading the repo root instead of `web/` hides netlify.toml so every route 404s while the deploy still reports success.

## Build the export with git archive, not git worktree

```
git worktree add --detach /tmp/csc-deploy HEAD
```

looks right and fails:

```
Failed during stage 'preparing repo': failed to initialize git repository:
fatal: not a git repository: /home/user/meltingpot-csc/.git/worktrees/csc-deploy
: exit status 128
```

A worktree's `.git` is a *file* holding a path back into the parent repo's
`.git/worktrees/`. The upload carries the file and not the parent, so nothing
on the other end can resolve it. `git archive` writes the committed tree with
no `.git` at all, which is exactly what a zip deploy wants:

```
rm -rf /tmp/csc-deploy && mkdir -p /tmp/csc-deploy
git archive HEAD | tar -x -C /tmp/csc-deploy
```

It also cannot pick up an uncommitted file or a stray `node_modules`, which a
worktree can if anything has written into it.

## Upload web/, not the repo root

`netlify.toml` lives at `web/netlify.toml`, because the deploy treats `web/`
as the package root. Upload the repo root and Netlify finds no config, so the
`@netlify/plugin-nextjs` runtime is never declared, the raw `.next` directory
gets published, and every route 404s.

The failure is quiet in the worst way: the deploy reports **"Deploy is
ready!"** and the site is entirely down. Nothing in the deploy output says so.

So `cd /tmp/csc-deploy/web` before running the deploy command, and guard it:

```
[ -f /tmp/csc-deploy/web/netlify.toml ] || exit 1
[ -d /tmp/csc-deploy/web/node_modules ] && exit 1
```

## Always curl the site after a deploy that says it succeeded

`https://meltingpots.xyz/` returning 200, plus one more route, takes a second
and is the only thing that actually distinguishes a deploy that worked from
one that reported that it did. The `.netlify.app` alias 308-redirects to
`APP_ORIGIN`, so check the real host.
