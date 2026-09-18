/**
 * The landing page's demo film, if the repo actually has one.
 *
 * The film lives in public/ rather than on YouTube, because the site's CSP is
 * frame-src 'self' plus Clerk and an embed is refused outright. A file in
 * public/ is not a file in the code, though, so the page has to cope with it
 * being absent: without this the section renders a dead frame and the hero
 * sends people to it.
 *
 * next.config.ts resolves which files are there on the build machine and
 * inlines the answer here, so a wrong answer is impossible rather than
 * unlikely: public/ is deployed as static assets, and whether it is also on
 * the serverless function's own filesystem is the host's business.
 *
 * Only the film is required. Add demo-poster.png, demo.vtt or
 * demo-preview.mp4 to public/ and the resting frame, the captions button and
 * the ambient loop come with them, with no code change.
 */
type Manifest = {
  src: string | null;
  poster: string | null;
  captions: string | null;
  preview: string | null;
};

function parse(): Manifest {
  try {
    return JSON.parse(process.env.DEMO_MEDIA ?? "{}") as Manifest;
  } catch {
    return { src: null, poster: null, captions: null, preview: null };
  }
}

const found = parse();

export const demoMedia = found.src
  ? {
      src: `/${found.src}`,
      poster: found.poster ? `/${found.poster}` : undefined,
      captions: found.captions ? `/${found.captions}` : undefined,
      previewSrc: found.preview ? `/${found.preview}` : undefined,
    }
  : null;
