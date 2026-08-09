import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/routes/_app";
import { SectionCard } from "@/components/dashboard/primitives";
import { useDataset } from "@/hooks/use-dataset";
import { useProfile } from "@/hooks/use-profile";
import { Plus, Image as ImageIcon, ExternalLink, Github, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/candidate/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio · ATS Engine" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { portfolioProjects: projects } = useDataset();
  const { profile, initials } = useProfile();
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Career suite"
        title="Portfolio"
        subtitle="Showcase your best work. Auto-formatted for public sharing and PDF export."
        actions={
          <>
            <a
              href="#"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-surface"
            >
              <ExternalLink className="size-3.5" /> jordan.rivera.co
            </a>
            <button
              onClick={() => toast.success("New project drafted")}
              className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:opacity-90"
            >
              <Plus className="size-3.5" /> Add project
            </button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <SectionCard title="Public profile">
          <div className="p-5 text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-accent/15 text-lg font-bold text-accent">
              {initials}
            </div>
            <div className="mt-3 font-display text-lg font-extrabold">
              {profile?.fullName || "Your name"}
            </div>
            <div className="text-xs text-muted-foreground">
              {profile?.headline || "Add a headline in onboarding"}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <a className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground">
                <Globe className="size-3.5" />
              </a>
              <a className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground">
                <Github className="size-3.5" />
              </a>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
              {[
                { k: "12", v: "Projects" },
                { k: "8y", v: "Experience" },
                { k: "94", v: "Views/wk" },
              ].map((s) => (
                <div key={s.v} className="rounded-md bg-surface p-2">
                  <div className="font-display text-sm font-extrabold">{s.k}</div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Projects"
          action={
            <div className="flex rounded-md border border-border bg-surface p-0.5 text-xs">
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded px-3 py-1 font-medium capitalize ${
                    view === v ? "bg-card ring-1 ring-border" : "text-muted-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          }
        >
          {view === "grid" ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {projects.map((p) => (
                <div
                  key={p.title}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${p.gradient} text-white/90`}
                  >
                    <ImageIcon className="size-8 opacity-40" />
                    <span className="absolute right-3 top-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
                      {p.year}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground">{p.role}</div>
                    <p className="mt-2 line-clamp-2 text-xs text-foreground/70">{p.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground/70 ring-1 ring-border"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects.map((p) => (
                <div key={p.title} className="flex items-center gap-4 p-4">
                  <div className={`size-12 shrink-0 rounded-lg bg-gradient-to-br ${p.gradient}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.role} · {p.year}
                    </div>
                  </div>
                  <div className="hidden gap-1.5 md:flex">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
