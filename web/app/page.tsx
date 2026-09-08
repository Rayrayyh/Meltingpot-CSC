import { getAuthUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { BrandLanding } from "@/components/landing/brand-landing";
import { CLOSED_POT_MESSAGE, INVALID_CODE_MESSAGE } from "@/components/landing/join-card";
import { SITE_ORIGIN } from "@/lib/site";

const LANDING_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      url: SITE_ORIGIN,
      name: "MeltingPot",
      description:
        "A shared class vault where contributing knowledge is as easy as typing what you know.",
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_ORIGIN}/#app`,
      name: "MeltingPot",
      url: SITE_ORIGIN,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description:
        "Students in a class build one shared vault of knowledge: rough notes in, organized notes out, flashcards and practice tests from what the class wrote.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isAccessibleForFree: true,
      audience: { "@type": "EducationalAudience", educationalRole: "student" },
      screenshot: `${SITE_ORIGIN}/opengraph-image.png`,
    },
  ],
};

const LANDING_ERRORS: Record<string, string> = {
  notfound: INVALID_CODE_MESSAGE,
  closed: CLOSED_POT_MESSAGE,
  busy: "Too many tries from this network. Wait a few minutes and try again.",
  error: "We couldn't reach that Pot just now. Try again in a moment.",
};

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : "";
  const errorKey = typeof params.error === "string" ? params.error : "";
  const message = LANDING_ERRORS[errorKey] ?? null;

  const user = await getAuthUser();

  // A signed-in user who followed a dead or failed invite link still needs the
  // failure; /home surfaces it next to its join field. Otherwise the landing
  // stays open to them, with the dashboard one click away.
  if (user && message) {
    redirect(
      `/home?code=${encodeURIComponent(code)}&error=${encodeURIComponent(errorKey)}`,
    );
  }

  return (
    <>
      {/* Structured data for the crawlers that read it: the site, the app
          and who makes it, in schema.org's terms. A data block, not a
          script, so the content security policy has no say in it. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LANDING_STRUCTURED_DATA) }}
      />
      <BrandLanding initialCode={code} initialError={message} signedIn={Boolean(user)} />
      {/* Smooth scrolling is the landing's alone. The signed-in shell has its
          own scrolling panes and would fight it. */}
    </>
  );
}
