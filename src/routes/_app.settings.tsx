import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/routes/_app";
import { SectionCard } from "@/components/dashboard/primitives";
import {
  User,
  Bell,
  CreditCard,
  Users2,
  Shield,
  Save,
  Sun,
  Moon,
  Monitor,
  SlidersHorizontal,
  MessagesSquare,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredTheme, setTheme as persistTheme, applyTheme, type Theme } from "@/lib/theme";
import { usePrefs } from "@/hooks/use-prefs";
import { candidateNav, employerNav } from "@/routes/_app";
import { getCurrentSession } from "@/lib/auth.functions";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · ATS Engine" }] }),
  loader: () => getCurrentSession(),
  component: SettingsPage,
});

type Tab =
  | "profile"
  | "appearance"
  | "features"
  | "notifications"
  | "billing"
  | "team"
  | "security";

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Sun },
  { id: "features", label: "Sidebar & features", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team", icon: Users2 },
  { id: "security", label: "Security", icon: Shield },
];

function SettingsPage() {
  const session = Route.useLoaderData();
  const isCandidate = session?.role === "candidate";
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your workspace, notifications, billing, and security preferences."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-brand/10 text-brand" : "text-foreground/70 hover:bg-surface"
              }`}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </nav>

        <div>
          {tab === "profile" && <ProfileTab />}
          {tab === "appearance" && <AppearanceTab />}
          {tab === "features" && <FeaturesTab isCandidate={isCandidate} />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "billing" && <BillingTab />}
          {tab === "team" && <TeamTab />}
          {tab === "security" && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  return (
    <SectionCard title="Profile information">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Profile updated");
        }}
        className="space-y-5 p-6"
      >
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-full bg-brand/15 text-lg font-bold text-brand">
            JD
          </div>
          <div>
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-surface"
            >
              Upload photo
            </button>
            <p className="mt-1 text-[10px] text-muted-foreground">PNG or JPG, up to 2MB.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" defaultValue="Julianne Deitch" />
          <Input label="Job title" defaultValue="Head of Talent" />
          <Input label="Work email" defaultValue="julianne@axon.ats" type="email" />
          <Input label="Phone" defaultValue="+1 (415) 555-0114" />
        </div>
        <Input label="Bio" defaultValue="Building the talent function at a Series B startup." />
        <div className="flex justify-end">
          <button className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground hover:opacity-90">
            <Save className="size-3.5" /> Save changes
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function AppearanceTab() {
  const [theme, setLocal] = useState<Theme>("system");

  useEffect(() => {
    const t = getStoredTheme();
    setLocal(t);
    applyTheme(t);
  }, []);

  const options: {
    id: Theme;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "light", label: "Light", desc: "Always use the light theme.", icon: Sun },
    { id: "dark", label: "Dark", desc: "Always use the dark theme.", icon: Moon },
    {
      id: "system",
      label: "System",
      desc: "Follow your device appearance automatically.",
      icon: Monitor,
    },
  ];

  return (
    <SectionCard title="Appearance">
      <div className="p-6">
        <p className="mb-5 text-xs text-muted-foreground">
          New sessions follow your operating-system setting until you pick an explicit preference
          here. Your choice is remembered on this device.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((o) => {
            const active = theme === o.id;
            return (
              <button
                key={o.id}
                onClick={() => {
                  setLocal(o.id);
                  persistTheme(o.id);
                  toast.success(`Theme: ${o.label}`);
                }}
                className={`rounded-xl border p-4 text-left transition-all ${
                  active
                    ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                    : "border-border bg-card hover:border-brand/40"
                }`}
              >
                <o.icon
                  className={`mb-2 size-5 ${active ? "text-brand" : "text-muted-foreground"}`}
                />
                <div className="text-sm font-semibold">{o.label}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">{o.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${
          on ? "left-0.5 translate-x-4" : "left-0.5"
        }`}
      />
    </button>
  );
}

function FeaturesTab({ isCandidate }: { isCandidate: boolean }) {
  const { hiddenNav, floatingAssistant, setNavVisible, setFloatingAssistant } = usePrefs();
  const groups = isCandidate ? candidateNav : employerNav;

  return (
    <div className="space-y-6">
      <SectionCard title="Sidebar features">
        <div className="divide-y divide-border">
          <div className="px-6 py-4 text-xs text-muted-foreground">
            Keep only the features you use. Hidden items disappear from the sidebar — their pages
            stay reachable by URL. Dashboard and Settings are always available.
          </div>
          {groups.map((g) => (
            <div key={g.label} className="p-5">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {g.label}
              </div>
              <div className="space-y-2">
                {g.items.map((item) => {
                  const locked = !!item.locked;
                  const visible = locked || !hiddenNav.includes(item.to);
                  return (
                    <div
                      key={item.to}
                      className="flex items-center gap-3 rounded-md bg-surface px-3 py-2"
                    >
                      <item.icon className="size-4 text-muted-foreground" />
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {locked ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Always on
                        </span>
                      ) : (
                        <Switch
                          on={visible}
                          label={item.label}
                          onChange={(v) => setNavVisible(item.to, v)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {isCandidate && (
        <SectionCard title="Career assistant">
          <div className="flex items-center gap-4 p-6">
            <MessagesSquare className="size-5 text-accent" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Floating assistant bubble</div>
              <div className="text-xs text-muted-foreground">
                Show a chat bubble in the corner of every page so you can ask the assistant without
                leaving what you are doing.
              </div>
            </div>
            <Switch
              on={floatingAssistant}
              label="Floating assistant"
              onChange={(v) => {
                setFloatingAssistant(v);
                toast.success(v ? "Floating assistant enabled" : "Floating assistant hidden");
              }}
            />
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function NotificationsTab() {
  const items = [
    {
      label: "New candidate matches",
      desc: "Get notified when a top-tier candidate applies.",
      channels: ["email", "push"],
    },
    {
      label: "Interview reminders",
      desc: "1 hour before scheduled interviews.",
      channels: ["email", "push", "sms"],
    },
    { label: "Weekly analytics digest", desc: "Every Monday at 9am.", channels: ["email"] },
    { label: "Product updates", desc: "New features and improvements.", channels: ["email"] },
  ];
  return (
    <SectionCard title="Notification preferences">
      <div className="divide-y divide-border">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-4 p-5">
            <div className="flex-1">
              <div className="text-sm font-semibold">{it.label}</div>
              <div className="text-xs text-muted-foreground">{it.desc}</div>
            </div>
            <div className="flex gap-2">
              {["email", "push", "sms"].map((c) => {
                const on = it.channels.includes(c);
                return (
                  <span
                    key={c}
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest ring-1 ${
                      on
                        ? "bg-brand/10 text-brand ring-brand/20"
                        : "bg-surface text-muted-foreground ring-border"
                    }`}
                  >
                    {c}
                  </span>
                );
              })}
            </div>
            <label className="relative inline-flex cursor-pointer">
              <input type="checkbox" defaultChecked className="peer sr-only" />
              <div className="h-5 w-9 rounded-full bg-border peer-checked:bg-brand" />
              <div className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
            </label>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Current plan">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand">
              Growth · Annual
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold">$4,800 / year</div>
            <div className="text-xs text-muted-foreground">
              Renews Mar 12, 2027 · 12 seats included
            </div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-surface">
              Change plan
            </button>
            <button className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:opacity-90">
              Add seats
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Payment method">
        <div className="flex items-center gap-4 p-6">
          <div className="grid size-12 place-items-center rounded-lg bg-foreground text-xs font-bold text-background">
            VISA
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Visa ending 4242</div>
            <div className="text-xs text-muted-foreground">Expires 08/28</div>
          </div>
          <button className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-surface">
            Update
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Invoices">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <th className="px-5 py-3">Invoice</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { id: "INV-2026-03", date: "Mar 12, 2026", amt: "$4,800.00" },
              { id: "INV-2025-03", date: "Mar 12, 2025", amt: "$3,600.00" },
              { id: "INV-2024-03", date: "Mar 12, 2024", amt: "$2,400.00" },
            ].map((i) => (
              <tr key={i.id} className="hover:bg-surface/50">
                <td className="px-5 py-3 font-mono text-xs">{i.id}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{i.date}</td>
                <td className="px-5 py-3 font-semibold">{i.amt}</td>
                <td className="px-5 py-3 text-right">
                  <button className="text-xs font-medium text-brand hover:underline">
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

function TeamTab() {
  const members = [
    { name: "Julianne Deitch", email: "julianne@axon.ats", role: "Owner", initials: "JD" },
    { name: "Marcus Cho", email: "marcus@axon.ats", role: "Admin", initials: "MC" },
    { name: "Priya Shah", email: "priya@axon.ats", role: "Recruiter", initials: "PS" },
    { name: "David Ortiz", email: "david@axon.ats", role: "Recruiter", initials: "DO" },
    { name: "Elena Ivanov", email: "elena@axon.ats", role: "Hiring Manager", initials: "EI" },
  ];
  return (
    <SectionCard
      title="Team members"
      action={
        <button
          onClick={() => toast.success("Invitation sent")}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:opacity-90"
        >
          + Invite
        </button>
      }
    >
      <div className="divide-y divide-border">
        {members.map((m) => (
          <div key={m.email} className="flex items-center gap-4 p-4">
            <div className="grid size-10 place-items-center rounded-full bg-brand/15 text-xs font-bold text-brand">
              {m.initials}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.email}</div>
            </div>
            <select
              className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold"
              defaultValue={m.role}
            >
              <option>Owner</option>
              <option>Admin</option>
              <option>Recruiter</option>
              <option>Hiring Manager</option>
              <option>Viewer</option>
            </select>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Password">
        <div className="space-y-4 p-6">
          <Input label="Current password" type="password" />
          <Input label="New password" type="password" />
          <div className="flex justify-end">
            <button
              onClick={() => toast.success("Password updated")}
              className="rounded-md bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground hover:opacity-90"
            >
              Update password
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Two-factor authentication">
        <div className="flex items-center justify-between gap-4 p-6">
          <div>
            <div className="text-sm font-semibold">Authenticator app</div>
            <div className="text-xs text-muted-foreground">
              Use Google Authenticator or 1Password.
            </div>
          </div>
          <span className="rounded bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-accent ring-1 ring-accent/20">
            Enabled
          </span>
        </div>
      </SectionCard>

      <SectionCard title="Active sessions">
        <div className="divide-y divide-border">
          {[
            { device: "MacBook Pro · Chrome", loc: "San Francisco, CA", when: "Active now" },
            { device: "iPhone 15 · Safari", loc: "San Francisco, CA", when: "2 hours ago" },
          ].map((s) => (
            <div key={s.device} className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-semibold">{s.device}</div>
                <div className="text-xs text-muted-foreground">
                  {s.loc} · {s.when}
                </div>
              </div>
              <button className="text-xs font-medium text-destructive hover:underline">
                Revoke
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function Input({
  label,
  type = "text",
  defaultValue,
}: {
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
