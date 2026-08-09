import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

/** Vanity alias shown to recruiters, e.g. share.JOB-123.ats.com */
export function shareAlias(jobId: string) {
  return `share.${jobId}.ats.com`;
}

/** The real, working shareable link for a job. */
export function shareUrl(jobId: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share/${jobId}`;
}

export function ShareLink({ jobId, compact = false }: { jobId: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        navigator.clipboard?.writeText(shareUrl(jobId));
        setCopied(true);
        toast.success("Shareable link copied");
        setTimeout(() => setCopied(false), 1800);
      }}
      title={`Copy ${shareUrl(jobId)}`}
      className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-surface font-mono text-[10px] text-foreground/80 hover:border-brand/40 hover:text-foreground ${
        compact ? "px-2 py-1" : "px-3 py-1.5 text-xs"
      }`}
    >
      {copied ? <Check className="size-3 text-accent" /> : <Copy className="size-3" />}
      {shareAlias(jobId)}
    </button>
  );
}
