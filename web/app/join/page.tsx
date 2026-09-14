import { getUser } from "@/lib/data/user";
import { UserShell } from "@/components/shell/user-shell";
import { Wordmark } from "@/components/shell/wordmark";
import { JoinCard } from "@/components/landing/join-card";
import { JOIN_ERRORS } from "@/lib/join-messages";

export const metadata = { title: "Join a Pot", robots: { index: false, follow: false } };

/**
 * The one code field in the product. Section two of the landing became the
 * bento on 2026-09-10 and took the old inline field with it, so everything
 * that used to scroll to it now comes here: the header pill, the hero, the
 * closing band, and a dead invite link carrying its reason. Signed out it is
 * the same centred column as the preview it leads to, because a sign in ahead
 * of seeing the Pot is exactly what the product does not do.
 */
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : "";
  const errorKey = typeof params.error === "string" ? params.error : "";
  const initialError = JOIN_ERRORS[errorKey] ?? null;
  const user = await getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <Wordmark size="lg" />
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-tight">Join a Pot</h1>
            <p className="text-sm text-ink-muted">
              Enter the class code your classmate or teacher shared.
            </p>
          </div>
          <JoinCard initialCode={code} initialError={initialError} />
        </div>
      </div>
    );
  }

  return (
    <UserShell>
      <div className="mx-auto w-full max-w-xl space-y-6 px-6 py-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Join a Pot</h1>
          <p className="text-sm text-ink-muted">
            Enter the class code your classmate or teacher shared.
          </p>
        </div>
        <JoinCard initialCode={code} initialError={initialError} />
      </div>
    </UserShell>
  );
}
