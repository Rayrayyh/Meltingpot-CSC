import { getAuthUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { BrandLanding } from "@/components/landing/brand-landing";
import { JOIN_ERRORS } from "@/lib/join-messages";
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

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : "";
  const errorKey = typeof params.error === "string" ? params.error : "";
  const message = JOIN_ERRORS[errorKey] ?? null;

  const user = await getAuthUser();

  // Someone who followed a dead or failed invite link still needs the reason,
  // and it has to appear beside a field they can retype the code into. The
  // landing has neither since the bento took section two, so the failure goes
  // where the field is: /home for a signed-in user, /join for anyone else.
  if (message) {
    const query = `code=${encodeURIComponent(code)}&error=${encodeURIComponent(errorKey)}`;
    redirect(user ? `/home?${query}` : `/join?${query}`);
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
      <BrandLanding signedIn={Boolean(user)} />
      {/* Smooth scrolling is the landing's alone. The signed-in shell has its
          own scrolling panes and would fight it. */}
    </>
  );
}
