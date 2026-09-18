/**
 * Which pieces of the demo film are actually in the repo.
 *
 * The landing page links to a two minute film that lives in public/ rather
 * than on YouTube, because the site's CSP is frame-src 'self' plus Clerk and
 * an embed is refused outright. A file in public/ is not a file in the code,
 * though, so the page has to cope with the film being absent: without this
 * the section renders a dead frame and the hero sends people to it.
 *
 * The check runs on the build machine, in next.config.ts, and arrives here as
 * an inlined constant. It cannot run in the serverless function instead:
 * public/ is deployed as static assets, and whether it is also on the
 * function's own filesystem is the host's business, not something to depend
 * on. Building it in means a wrong answer is impossible rather than unlikely.
 *
 * Nothing needs changing when the film lands. Commit public/demo.mp4 and the
 * next build picks it up; add demo-poster.png, demo.vtt or demo-preview.mp4
 * and the resting frame, the captions button and the ambient loop come with
 * it.
 */
const present = new Set(
  (process.env.DEMO_MEDIA ?? "").split(",").filter(Boolean),
);

export const demoMedia = present.has("demo.mp4")
  ? {
      src: "/demo.mp4",
      poster: present.has("demo-poster.png") ? "/demo-poster.png" : undefined,
      captions: present.has("demo.vtt") ? "/demo.vtt" : undefined,
      previewSrc: present.has("demo-preview.mp4")
        ? "/demo-preview.mp4"
        : undefined,
    }
  : null;
