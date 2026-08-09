import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/routes/_app";
import { SectionCard, ScoreBar } from "@/components/dashboard/primitives";
import { evaluateJobUrl } from "@/lib/joblink.functions";
import {
  Link2,
  Loader2,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle2,
  Mic,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/candidate/external")({
  head: () => ({
    meta: [
      { title: "External Job Preparation · ATS Engine" },
      {
        name: "description",
        content:
          "Paste any external job posting link and get an AI fit score, gap analysis, and a full interview preparation plan.",
      },
    ],
  }),
  component: ExternalPrep,
});

type Result = Awaited<ReturnType<typeof evaluateJobUrl>>;

function ExternalPrep() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    const u = url.trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await evaluateJobUrl({ data: { url: u } });
      setResult(res);
      toast.success("Preparation plan ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not analyse that posting";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const ev = result?.evaluation ?? null;
  const job = result?.job ?? null;
  const preview = result?.preview ?? null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Flagship feature"
        title="External job preparation"
        subtitle="Applying somewhere outside this ATS? Paste the posting link — we read it, score your fit, and build a stage-by-stage interview plan."
      />

      <div className="mb-6 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-6">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
          <Sparkles className="size-3" /> Highlighted
        </div>
        <p className="mb-4 max-w-2xl text-sm text-foreground/80">
          Works with any careers page, job board, or company posting. The page is fetched
          server-side and analysed against your stored profile and resume — nothing is shared with
          the employer.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="https://company.com/careers/senior-product-designer"
              className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent/25"
            />
          </div>
          <button
            onClick={run}
            disabled={loading || !url.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-xs font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Target className="size-3.5" />
            )}
            {loading ? "Analysing…" : "Prepare me"}
          </button>
        </div>
        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="size-3.5" /> {error}
          </p>
        )}
      </div>

      {preview && (
        <SectionCard title={result?.isJob ? "Link preview" : "Page preview"} className="mb-6">
          <div className="flex flex-col gap-4 p-5 sm:flex-row">
            {preview.image && (
              <img
                src={preview.image}
                alt={preview.title || "Link preview"}
                loading="lazy"
                className="h-32 w-full shrink-0 rounded-lg border border-border object-cover sm:w-56"
              />
            )}
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
                {preview.favicon && (
                  <img src={preview.favicon} alt="" className="size-3.5 shrink-0 rounded" />
                )}
                <span className="truncate">{preview.siteName || preview.finalUrl}</span>
              </div>
              <div className="mt-1 font-display text-base font-bold">
                {preview.title || preview.finalUrl}
              </div>
              {preview.description && (
                <p className="mt-1 line-clamp-3 text-xs text-foreground/70">
                  {preview.description}
                </p>
              )}
              <a
                href={preview.finalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <Link2 className="size-3.5" /> Open link
              </a>
              {result && !result.isJob && (
                <p className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {result.message || "This link is not a job posting."}
                </p>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {job && (
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="Role summary" className="lg:col-span-2">
            <div className="space-y-4 p-6">
              <div>
                <div className="font-display text-xl font-extrabold">
                  {job.title || "Untitled role"}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="size-3.5" />
                  {[job.company, job.location, job.type, job.salary].filter(Boolean).join(" · ")}
                </div>
              </div>
              {job.description && (
                <p className="text-sm leading-relaxed text-foreground/80">
                  {job.description.slice(0, 900)}
                </p>
              )}
              {job.requirements.length > 0 && (
                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Requirements
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {job.requirements.map((r) => (
                      <li key={r} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {job.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-surface px-2 py-0.5 text-[10px] font-semibold text-foreground/70 ring-1 ring-border"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="Your fit">
              <div className="space-y-4 p-5">
                {ev ? (
                  <>
                    <div className="font-display text-4xl font-extrabold text-accent">
                      {ev.matchScore}%
                    </div>
                    <ScoreBar score={ev.matchScore} />
                    <p className="text-xs leading-relaxed text-muted-foreground">{ev.summary}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Add an AI key to <code>.env</code> to unlock scoring.
                  </p>
                )}
              </div>
            </SectionCard>

            {ev && (
              <SectionCard title="Strengths & gaps">
                <div className="space-y-3 p-5 text-xs">
                  {ev.strengths.map((s) => (
                    <div key={s} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                      <span>{s}</span>
                    </div>
                  ))}
                  {ev.gaps.map((g) => (
                    <div key={g} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {ev && ev.interviewPlan.length > 0 && (
            <SectionCard title="Interview preparation plan" className="lg:col-span-3">
              <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
                {ev.interviewPlan.map((stage) => (
                  <div key={stage.stage} className="rounded-xl border border-border bg-surface p-4">
                    <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                      <Mic className="size-3.5 text-accent" /> {stage.stage}
                    </div>
                    <div className="mb-3 text-[11px] text-muted-foreground">{stage.focus}</div>
                    <ul className="space-y-1.5 text-xs">
                      {stage.questions.map((q) => (
                        <li key={q} className="flex gap-2">
                          <span className="text-accent">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {ev && ev.preparationTips.length > 0 && (
            <SectionCard title="Preparation checklist" className="lg:col-span-3">
              <ul className="grid gap-2 p-6 text-xs sm:grid-cols-2">
                {ev.preparationTips.map((t) => (
                  <li key={t} className="flex gap-2 rounded-md bg-surface p-3">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
