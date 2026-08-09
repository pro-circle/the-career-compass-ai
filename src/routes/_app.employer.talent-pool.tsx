import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/routes/_app";
import { Avatar, ScoreBar, SectionCard } from "@/components/dashboard/primitives";
import { useDataset } from "@/hooks/use-dataset";
import { Search, Tag, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/employer/talent-pool")({
  head: () => ({ meta: [{ title: "Talent Pool · ATS Engine" }] }),
  component: TalentPoolPage,
});

function TalentPoolPage() {
  const { candidates, talentPools: pools } = useDataset();
  const [pool, setPool] = useState("all");
  const [q, setQ] = useState("");

  const filtered = candidates.filter((c) =>
    (c.name + c.title + c.company + c.skills.join(" ")).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Sourcing"
        title="Talent pool"
        subtitle="Nurture silver medalists, referrals, and past applicants for future roles."
        actions={
          <button
            onClick={() => toast.success("Nurture campaign scheduled")}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:opacity-90"
          >
            <Mail className="size-3.5" /> Launch campaign
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <SectionCard title="Pools">
          <div className="p-2">
            {pools.map((p) => (
              <button
                key={p.id}
                onClick={() => setPool(p.id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pool === p.id ? "bg-brand/10 text-brand" : "text-foreground/70 hover:bg-surface"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Tag className="size-3.5" />
                  {p.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">{p.count}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={pools.find((p) => p.id === pool)?.label}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-56 rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          }
        >
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-surface/30"
              >
                <input type="checkbox" className="accent-brand" />
                <Avatar initials={c.initials} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.title} · {c.company} · {c.years}y
                  </div>
                </div>
                <div className="hidden gap-1.5 md:flex">
                  {c.skills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded bg-surface px-2 py-0.5 text-[10px] font-medium text-foreground/70 ring-1 ring-border"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <ScoreBar score={c.matchScore} />
                <button
                  onClick={() => toast.success(`Message sent to ${c.name}`)}
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold hover:bg-surface"
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
