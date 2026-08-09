import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/routes/_app";
import { SectionCard } from "@/components/dashboard/primitives";
import { Mail, Plus, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/employer/templates")({
  head: () => ({ meta: [{ title: "Email Templates · ATS Engine" }] }),
  component: TemplatesPage,
});

type Template = { id: string; name: string; category: string; subject: string; body: string };

const templates: Template[] = [
  {
    id: "outreach",
    name: "Cold outreach",
    category: "Sourcing",
    subject: "Loved your work at {{previousCompany}} — {{roleTitle}} at ATS Engine?",
    body: "Hi {{firstName}},\n\nYour work on {{portfolioHighlight}} caught our eye. We're building something similar at ATS Engine and would love 15 minutes to share what we're up to.\n\nAre you open to a chat this week?\n\n— {{recruiterName}}",
  },
  {
    id: "screen",
    name: "Screening invitation",
    category: "Screening",
    subject: "Next step: 30-min chat with {{recruiterName}}",
    body: "Hi {{firstName}},\n\nThanks for applying to the {{roleTitle}} position. We'd love to set up a 30-minute intro call to learn more about your experience.\n\nPlease pick a time: {{schedulingLink}}\n\n— {{recruiterName}}",
  },
  {
    id: "onsite",
    name: "Onsite scheduling",
    category: "Interview",
    subject: "Your ATS Engine onsite — logistics & agenda",
    body: "Hi {{firstName}},\n\nWe're excited to have you on-site on {{date}}. Full agenda attached.\n\nParking is validated at the building lobby, and lunch will be provided.\n\nSee you soon!",
  },
  {
    id: "offer",
    name: "Offer letter follow-up",
    category: "Offer",
    subject: "Welcome to ATS Engine 🎉",
    body: "Hi {{firstName}},\n\nAttached is the formal offer for {{roleTitle}}. Please review at your leisure — happy to jump on a call to walk through it.\n\nCan't wait to have you on the team.",
  },
  {
    id: "reject",
    name: "Respectful rejection",
    category: "Rejection",
    subject: "Update on your ATS Engine application",
    body: "Hi {{firstName}},\n\nThank you for the time you invested with our team. After careful consideration we've decided to move forward with other candidates for this role.\n\nWe were genuinely impressed by {{strength}} and would love to stay in touch as future roles open.",
  },
  {
    id: "nurture",
    name: "Talent pool nurture",
    category: "Nurture",
    subject: "New roles at ATS Engine that fit your profile",
    body: "Hi {{firstName}},\n\nBased on our previous conversation, I wanted to share two roles that opened this quarter:\n\n· {{role1}}\n· {{role2}}\n\nInterested in exploring either?",
  },
];

function TemplatesPage() {
  const [active, setActive] = useState(templates[0]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Recruitment"
        title="Email templates"
        subtitle="Curated, AI-personalized templates for every step of the funnel."
        actions={
          <button
            onClick={() => toast.success("New template created")}
            className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:opacity-90"
          >
            <Plus className="size-3.5" /> New template
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Library" className="lg:col-span-1">
          <div className="divide-y divide-border">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t)}
                className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                  active.id === t.id ? "bg-brand/5" : "hover:bg-surface/50"
                }`}
              >
                <div className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{t.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t.category}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={active.name} className="lg:col-span-2">
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-xs">
              <Sparkles className="size-3.5 text-brand" />
              <span>
                Variables like{" "}
                <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[10px]">{`{{firstName}}`}</code>{" "}
                are auto-filled from candidate profiles.
              </span>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground/80">Subject</span>
              <input
                defaultValue={active.subject}
                key={active.id + "s"}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground/80">Body</span>
              <textarea
                defaultValue={active.body}
                key={active.id + "b"}
                rows={12}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => toast.success("Template duplicated")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-surface"
              >
                <Copy className="size-3.5" /> Duplicate
              </button>
              <button
                onClick={() => toast.success("Template saved")}
                className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:opacity-90"
              >
                Save changes
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
