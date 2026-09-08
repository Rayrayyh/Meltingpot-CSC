import type { Metadata } from "next";
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

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
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
});

const figtree = Figtree({
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
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
});

export const metadata: Metadata = {
  title: {
    default: "MeltingPot",
    template: "%s | MeltingPot",
  },
  description:
    "A shared class vault where contributing knowledge is as easy as typing what you know.",
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
