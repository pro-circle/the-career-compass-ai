import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/routes/_app";
import { SectionCard } from "@/components/dashboard/primitives";
import { useDataset } from "@/hooks/use-dataset";
import { Sparkles, Download, Send, Award } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/employer/offers")({
  head: () => ({ meta: [{ title: "Offer Letters · ATS Engine" }] }),
  component: OffersPage,
});

const statusTone: Record<string, string> = {
  Signed: "bg-accent/10 text-accent ring-accent/20",
  Sent: "bg-brand/10 text-brand ring-brand/20",
  Drafted: "bg-surface text-foreground/70 ring-border",
  Declined: "bg-red-50 text-red-600 ring-red-200",
};

function OffersPage() {
  const { offers } = useDataset();
  const [candidate, setCandidate] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [equity, setEquity] = useState("");
  const [start, setStart] = useState("");

  const body = `Dear ${candidate || "candidate"},\n\nWe are thrilled to extend an offer for the position of ${role} at ATS Engine. Based on your interviews and portfolio, our team is unanimously excited to have you join us.\n\n· Base salary: $${salary ? Number(salary).toLocaleString() : "—"}\n· Equity: ${equity}% (4-year vest, 1-year cliff)\n· Start date: ${start}\n· PTO: Unlimited, with a 3-week minimum\n· Health, dental, vision covered 100% (dependents 80%)\n\nThis offer is open for 7 days. Reply here to accept or discuss.\n\nWarmly,\nJulianne Deitch\nHead of Talent, ATS Engine`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Recruitment"
        title="Offer letters"
        subtitle="Generate, review, and dispatch offers with AI-assisted market benchmarks."
        actions={
          <button
            onClick={() => toast.success("Offer sent to candidate")}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:opacity-90"
          >
            <Send className="size-3.5" /> Send offer
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <SectionCard title="Offer builder" className="lg:col-span-3">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Candidate" value={candidate} onChange={setCandidate} />
            <Field label="Role" value={role} onChange={setRole} />
            <Field label="Base salary (USD)" value={salary} onChange={setSalary} />
            <Field label="Equity (%)" value={equity} onChange={setEquity} />
            <Field label="Start date" type="date" value={start} onChange={setStart} />
          </div>

          <div className="border-t border-border bg-surface/40 px-5 py-3">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="size-3.5 text-brand" />
              <span>
                AI benchmark: <strong>${Number(salary).toLocaleString()}</strong> is at the{" "}
                <strong className="text-accent">72nd percentile</strong> for {role} in SF / remote.
              </span>
            </div>
          </div>

          <div className="p-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Preview
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-card p-5 font-sans text-xs leading-relaxed text-foreground/80">
              {body}
            </pre>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => toast.success("PDF exported")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-surface"
              >
                <Download className="size-3.5" /> Export PDF
              </button>
              <button
                onClick={() => toast.success("Sent to DocuSign")}
                className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90"
              >
                Send via DocuSign
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Recent offers" className="lg:col-span-2">
          <div className="divide-y divide-border">
            {offers.map((o) => (
              <div key={o.candidate} className="flex items-start gap-3 p-4">
                <div className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Award className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{o.candidate}</div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ring-1 ${statusTone[o.status]}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{o.role}</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-foreground/70">
                    <span className="font-mono">{o.salary}</span> ·{" "}
                    <span className="font-mono">{o.equity}</span> · <span>{o.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
