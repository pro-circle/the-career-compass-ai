import { ThemeToggle } from "@/components/theme-toggle";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { login, getCurrentSession } from "@/lib/auth.functions";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in · ATS Engine" }] }),
  beforeLoad: async () => {
    const session = await getCurrentSession();
    if (session?.userId && session.role) {
      if (session.role === "candidate" && !session.onboarded) {
        throw redirect({ to: "/candidate/onboarding" });
      }
      throw redirect({
        to: session.role === "candidate" ? "/candidate" : "/employer",
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await login({ data: { email, password } });
      if (!res.ok) {
        toast.error(res.error ?? "Sign in failed");
        return;
      }
      toast.success(`Signed in as ${res.role}`);
      if (res.role === "candidate" && !res.onboarded) {
        await router.navigate({ to: "/candidate/onboarding" });
      } else {
        await router.navigate({
          to: res.role === "candidate" ? "/candidate" : "/employer",
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full font-sans lg:grid-cols-2">
      <ThemeToggle className="fixed right-4 top-4 z-50 bg-background/80 backdrop-blur" />
      <aside className="relative hidden overflow-hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <a href="/" className="inline-flex items-center gap-2 font-display text-lg font-extrabold">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-foreground">
            A
          </span>
          ATS ENGINE
        </a>
        <div className="relative z-10 max-w-md">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-background/70">
            <Sparkles className="size-3 text-accent" /> Intelligent recruiting
          </div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Hire the top 1% <span className="text-accent">10× faster</span> with contextual AI.
          </h2>
          <p className="mt-4 text-sm text-background/70">
            Match, screen, interview and offer — all from one workspace that understands your team.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-40 -top-40 size-[500px] rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-[400px] rounded-full bg-accent/20 blur-3xl" />
      </aside>

      <section className="flex items-center justify-center bg-card p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-extrabold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to continue to your workspace.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                Work email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground/80">
                Password
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy ? (
                "Signing in…"
              ) : (
                <>
                  Sign in <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            New here?{" "}
            <a href="/auth/signup" className="font-semibold text-brand hover:underline">
              Create an account
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
