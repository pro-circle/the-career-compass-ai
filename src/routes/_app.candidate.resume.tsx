import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/routes/_app";
import { SectionCard } from "@/components/dashboard/primitives";
import { UploadCloud, FileText, Wand2, Languages, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";

type Tab = "upload" | "builder" | "optimizer" | "translator";

export const Route = createFileRoute("/_app/candidate/resume")({
  head: () => ({ meta: [{ title: "Resume Studio · ATS Engine" }] }),
  component: ResumeStudio,
});

function ResumeStudio() {
  const [tab, setTab] = useState<Tab>("optimizer");
  const { profile, resume } = useProfile();
  const [score, setScore] = useState(72);
  const [optimizing, setOptimizing] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "upload", label: "Upload", icon: UploadCloud },
    { id: "builder", label: "Builder", icon: FileText },
    { id: "optimizer", label: "Optimizer", icon: Wand2 },
    { id: "translator", label: "Translator", icon: Languages },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Resume studio"
        title="Perfect your resume"
        subtitle="Upload, build, optimize, and translate — all in one place."
      />

      <div className="mb-6 inline-flex rounded-lg border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
              tab === t.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="size-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "upload" && (
        <SectionCard>
          <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-surface">
              <UploadCloud className="size-7 text-brand" />
            </div>
            <div>
              <div className="font-display text-lg font-bold">Drop your resume here</div>
              <div className="text-xs text-muted-foreground">
                PDF, DOCX, TXT · up to 10 MB — we parse in seconds
              </div>
            </div>
            <button
              onClick={() => toast.success("Resume uploaded and parsed")}
              className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground"
            >
              Browse files
            </button>
          </div>
        </SectionCard>
      )}

      {tab === "builder" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Details">
            <div className="space-y-3 p-5">
              {[
                "Full name",
                "Headline",
                "Location",
                "Summary",
                "Experience",
                "Education",
                "Skills",
              ].map((f) => (
                <div key={f}>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {f}
                  </label>
                  {f === "Summary" || f === "Experience" ? (
                    <textarea
                      rows={3}
                      placeholder={`Add your ${f.toLowerCase()}…`}
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  ) : (
                    <input
                      placeholder={`Add your ${f.toLowerCase()}…`}
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={() => toast.success("Resume generated and formatted")}
                className="mt-2 w-full rounded-md bg-accent py-2.5 text-sm font-semibold text-accent-foreground"
              >
                Generate ATS-ready resume
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Live preview">
            <div className="space-y-4 p-8 font-sans text-sm">
              <div>
                <div className="font-display text-2xl font-extrabold">
                  {profile?.fullName || "Your name"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {[profile?.headline, profile?.location].filter(Boolean).join(" · ") ||
                    "Add a headline in onboarding"}
                </div>
              </div>
              {(resume?.summary || profile?.resumeText) && (
                <div className="border-t border-border pt-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Summary
                  </div>
                  <p className="mt-1 text-xs text-foreground/80">
                    {resume?.summary ?? profile?.resumeText.slice(0, 240)}
                  </p>
                </div>
              )}
              {!!resume?.experience?.length && (
                <div className="border-t border-border pt-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Experience
                  </div>
                  <div className="mt-2 space-y-2">
                    {resume.experience.slice(0, 5).map((e, i) => (
                      <div key={i}>
                        <div className="text-xs font-semibold">
                          {[e.title, e.company].filter(Boolean).join(" · ")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{e.dates}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "optimizer" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="ATS Score" className="lg:col-span-1">
            <div className="p-6 text-center">
              <div className="relative mx-auto grid size-36 place-items-center">
                <svg className="absolute inset-0" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="var(--surface)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="var(--accent)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 264} 264`}
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div>
                  <div className="font-display text-4xl font-extrabold">{score}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    / 100
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm font-semibold">
                {score >= 90 ? "Elite" : score >= 80 ? "Strong" : "Needs work"}
              </div>
              <button
                disabled={optimizing || score >= 96}
                onClick={() => {
                  setOptimizing(true);
                  toast.success("AI is optimizing your resume…");
                  setTimeout(() => {
                    setScore(96);
                    setOptimizing(false);
                    toast.success("ATS score updated");
                  }, 1200);
                }}
                className="mt-5 w-full rounded-md bg-accent py-2 text-xs font-semibold text-accent-foreground disabled:opacity-60"
              >
                {optimizing ? "Optimizing…" : score >= 96 ? "Optimized ✓" : "Auto-optimize"}
              </button>
            </div>
          </SectionCard>

          <SectionCard title="AI recommendations" className="lg:col-span-2">
            <div className="divide-y divide-border">
              {[
                {
                  done: score >= 96,
                  title: "Add quantifiable impact metrics",
                  body: "Rewrite 3 bullets with numbers (e.g. shipped v2 to 40k users).",
                },
                {
                  done: score >= 96,
                  title: "Strengthen keyword density",
                  body: "Add: 'design systems', 'component library', 'a11y'.",
                },
                {
                  done: true,
                  title: "Fix section ordering",
                  body: "Move 'Experience' above 'Education' for senior roles.",
                },
                {
                  done: true,
                  title: "Improve action verbs",
                  body: "Replaced 'worked on' with 'shipped', 'led', 'owned'.",
                },
              ].map((r, i) => (
                <div key={i} className="flex gap-3 p-4">
                  <div
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${r.done ? "bg-accent text-accent-foreground" : "bg-surface text-muted-foreground ring-1 ring-border"}`}
                  >
                    {r.done ? <Check className="size-3" /> : <Sparkles className="size-3" />}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-semibold ${r.done ? "line-through decoration-accent/50" : ""}`}
                    >
                      {r.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "translator" && (
        <SectionCard title="Translate resume">
          <div className="grid gap-4 p-6 sm:grid-cols-3">
            {["Spanish", "French", "German", "Portuguese", "Japanese", "Mandarin"].map((lang) => (
              <button
                key={lang}
                onClick={() => toast.success(`Translated resume to ${lang}`)}
                className="rounded-lg border border-border bg-surface p-4 text-left hover:border-accent/40"
              >
                <div className="mb-1 text-sm font-semibold">{lang}</div>
                <div className="text-xs text-muted-foreground">
                  Preserves formatting · ATS-safe output
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
