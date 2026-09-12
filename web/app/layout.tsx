import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/site";
import {
  Baloo_2,
  Bricolage_Grotesque,
  Figtree,
  Fraunces,
  Inter,
  Silkscreen,
  Source_Serif_4,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { usingClerk } from "@/lib/auth/provider";
import { CARD_FACE_IDS, DEFAULT_CARD_FACE } from "@/lib/card-face";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Long-form note bodies, which live behind sign in. Not preloaded: every
// font declared here gets a preload link on every page by default, and three
// of these seven are single-surface faces that were competing with the hero
// for the first bytes of every visit. They still load the moment something
// actually renders in them.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  preload: false,
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

// The 404's two faces, from the design file. They live only on that page.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  preload: false,
});

const figtree = Figtree({
  variable: "--font-figtree",
  // 800 is section two's bento: the reference sheets set their headlines in a
  // heavier weight than anything else on the site uses. Not preloaded: the
  // bento is below the fold on every screen, so this was competing with the
  // hero's own two faces for the first connections.
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  preload: false,
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
});

// Pixel face for the footer credits alone. One weight, because it appears in
// exactly one place and a second weight would ship for nothing.
const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "MeltingPot",
    template: "%s | MeltingPot",
  },
  description:
    "A shared class vault where contributing knowledge is as easy as typing what you know. Rough notes in, organized notes out, flashcards and practice tests from what the class wrote.",
  applicationName: "MeltingPot",
  // Resolved against the page's own path, so every public page names itself
  // as its canonical address and the netlify.app alias never is one.
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "MeltingPot",
    locale: "en_US",
    // The card's own line rather than the brand name, which the site name
    // already carries: Slack prints both, and printing MeltingPot twice
    // spent a line saying nothing. This way the words match the picture.
    title: "The notes have names on them.",
    description:
      "Everyone takes notes. MeltingPot brings them together: one shared vault a class builds and studies from.",
    // The card itself is app/opengraph-image.png. Naming it there rather
    // than listing a URL here is what makes a new card actually show up:
    // Next serves it at
    // /opengraph-image.png?<hash of the file>, and every platform caches an
    // embed against the image URL. A card swapped in place under an unchanged
    // URL stays stale on Discord and the rest for as long as they feel like
    // holding it; a changed hash misses every one of those caches at once.
    //
    // No og:image:alt: an opengraph-image.alt.txt beside the picture would
    // emit one, and the owner asked on 2026-09-08 for the card to carry no
    // alt text. Facebook and LinkedIn are where that text would have been
    // read aloud.
  },
  twitter: {
    card: "summary_large_image",
    title: "The notes have names on them.",
    description:
      "Everyone takes notes. MeltingPot brings them together: one shared vault a class builds and studies from.",
    // No images listed here on purpose. The opengraph-image file emits
    // twitter:image as well as og:image, both on the hashed URL, so a copy
    // named here would only be a second one to keep in step.
  },
  robots: { index: true, follow: true },
};

// Applies the persisted theme before first paint so neither theme flashes,
// and leaves the reader's time zone in a cookie so the server can cut the
// days of their own record where they live rather than in UTC.
// Nothing stored means light: the owner's call, 2026-09-08, decision 020,
// and DEFAULT_THEME in lib/theme.ts must say the same. It has to be stamped
// here rather than left to the system preference, or a viewer whose machine
// is dark would see dark before the choice they never made is even
// readable. Only "system" leaves the attribute off and lets the media query
// decide.
const themeInit = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("mp-theme");if(t==="light"||t==="dark"){d.setAttribute("data-theme",t)}else if(t!=="system"){d.setAttribute("data-theme","light")}if(localStorage.getItem("mp:nav-collapsed")==="1"){d.setAttribute("data-nav","collapsed")}var f=localStorage.getItem("mp-card-face");if(f&&/^(${CARD_FACE_IDS.filter((id) => id !== DEFAULT_CARD_FACE).join("|")})$/.test(f)){d.setAttribute("data-card-face",f)}}catch(e){d.setAttribute("data-theme","light")}try{document.cookie="mp-tz="+encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)+";path=/;max-age=31536000;SameSite=Lax"}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const page = (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} ${fraunces.variable} ${bricolage.variable} ${figtree.variable} ${baloo.variable} ${silkscreen.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
  // Clerk's provider is a context, not markup, so it wraps the document
  // without changing it; when Supabase is the provider it is not mounted at
  // all and the page is exactly what it was.
  return usingClerk() ? <ClerkProvider afterSignOutUrl="/" telemetry={false}>{page}</ClerkProvider> : page;
}
