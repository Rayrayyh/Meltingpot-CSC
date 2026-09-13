import Link from "next/link";
import { GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/shell/wordmark";
import { MAKERS, REPO_URL } from "@/components/landing/site-content";
import { GoesOutComesInUnderline } from "@/components/ui/goes-out-comes-in-underline";

/**
 * The public pages' shared footer: the three people who made it first, then
 * the brand and its two verifiable credits, then the legal pages. The makers'
 * row is set in the pixel face, the one place this app lets itself wink.
 */
export function SiteFooter() {
  return (
    <footer className="px-6 sm:px-10 pt-12 pb-8 border-t border-edge">
      {/* The people lead. Pixel type on purpose: the one place the app winks. */}
      <div className="mx-auto w-full max-w-5xl flex flex-col items-center gap-5 [font-family:var(--font-silkscreen)]">
        <p className="text-[24px] leading-tight tracking-[0.12em] uppercase text-ink text-center">
          Designed and Developed by
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {MAKERS.map((maker) => (
            <li key={maker.name}>
              <a
                href={maker.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-center gap-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={maker.avatar}
                  alt=""
                  width={128}
                  height={128}
                  // React hoists a <link rel=preload> for every eager image
                  // it renders on the server, so these four faces, which live
                  // at the very bottom of every page, were being fetched
                  // ahead of the hero. Same trap as the 404 artwork in
                  // melt-frame.tsx; same way out.
                  loading="lazy"
                  decoding="async"
                  className="size-8 rounded-lg border border-edge object-cover transition-transform duration-300 group-hover:-translate-y-0.5"
                />
                <GoesOutComesInUnderline className="text-[12px] text-ink transition-colors group-hover:text-primary">
                  {maker.name}
                </GoesOutComesInUnderline>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-5xl mt-12 border-t border-edge pt-10 flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Wordmark idPrefix="mp-pot-footer" />
          <p className="max-w-xs text-[13px] text-ink-muted">
            Everything your class knows, in one Pot. Built in the open, MIT
            licensed.
          </p>
        </div>
        {/* Two credits, one mark each, sharing a baseline. The repository sits
            beside the challenge this was entered in because both are the same
            claim: this is a real thing you can go and look at. */}
        <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-8 sm:justify-end">
          <Credit
            href={REPO_URL}
            label="Open source on GitHub"
            mark={
              <GithubLogo
                className="size-7 text-ink transition-transform duration-300 group-hover:-translate-y-0.5"
                weight="fill"
                aria-hidden
              />
            }
          />
          <span aria-hidden className="hidden h-10 w-px bg-edge sm:block" />
          <Credit
            href="https://csc-back-to-school.devpost.com/"
            label="Built for the CSC Back-to-School Hackathon"
            mark={
              /* The hackathon's own lockup, taken from the banner on its Devpost
                 page, which sets it in navy and gold on cream. Neither colour
                 survives a theme switch, so the cream is keyed out and what is
                 left is painted as a mask: the alpha channel gives the letter
                 shapes and the box colour gives the ink. One file reads
                 correctly in light and dark, and it still will if the palette
                 moves again. The gold rules and the line drawing of the
                 campus sit at about a third of the navy's opacity, which a
                 single ink flattens to a wash, so the alpha is floored to
                 drop the export's noise and then gamma lifted to bring the
                 drawing back up beside the type. 591x168 after trimming. */
              <span
                aria-hidden
                className="block h-14 w-[197px] max-w-full bg-ink transition-transform duration-300 group-hover:-translate-y-0.5"
                style={{
                  maskImage: "url(/csc-logo.png)",
                  WebkitMaskImage: "url(/csc-logo.png)",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                }}
              />
            }
          />
        </div>
      </div>

      {/* Legal, quiet and last. */}
      <div className="mx-auto w-full max-w-5xl mt-10 border-t border-edge pt-6 flex flex-col items-center justify-between gap-3 sm:flex-row text-[12px] text-ink-faint">
        <p>MeltingPot, 2026. Made by students, for students.</p>
        <nav className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-primary transition-colors">
            <GoesOutComesInUnderline>Terms of service</GoesOutComesInUnderline>
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            <GoesOutComesInUnderline>Privacy policy</GoesOutComesInUnderline>
          </Link>
        </nav>
      </div>
    </footer>
  );
}

/**
 * A mark above a line of text, linking somewhere a visitor can verify a claim.
 * Both footer credits share it so their baselines and their hover agree.
 */
function Credit({
  href,
  label,
  mark,
}: {
  href: string;
  label: string;
  mark: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group inline-flex flex-col items-center gap-2.5"
    >
      <span className="flex h-14 items-end">{mark}</span>
      <GoesOutComesInUnderline className="text-center text-sm font-semibold tracking-tight text-ink transition-colors group-hover:text-primary">
        {label}
      </GoesOutComesInUnderline>
    </a>
  );
}
