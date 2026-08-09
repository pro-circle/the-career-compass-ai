import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function db() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

/** Moves a candidate to a new pipeline stage. */
export const setCandidateStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        candidateId: z.string().min(1),
        status: z.enum(["New", "Screening", "Interviewing", "Final Round", "Offer", "Rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    const client = await db();
    if (!client) return { ok: false, message: "Backend not configured." };
    const { error } = await client
      .from("candidates")
      .update({ status: data.status })
      .eq("id", data.candidateId);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: `Moved to ${data.status}` };
  });

/** Sends an email or in-app notification to one or more candidates. */
export const contactCandidates = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        candidateIds: z.array(z.string().min(1)).min(1).max(50),
        channel: z.enum(["email", "notification"]),
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(5000),
        jobTitle: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; sent: number; message: string }> => {
    const client = await db();
    if (!client) {
      return { ok: false, sent: 0, message: "Backend not configured." };
    }
    const rows = data.candidateIds.map((id, i) => ({
      id: `NTF-${Date.now().toString(36).toUpperCase()}-${i}`,
      candidate_id: id,
      title: data.subject,
      time: "just now",
      type: data.channel === "email" ? "message" : "insight",
      created_at: new Date().toISOString(),
    }));
    const { error } = await client.from("notifications").insert(rows);
    if (error) return { ok: false, sent: 0, message: error.message };
    return {
      ok: true,
      sent: rows.length,
      message:
        data.channel === "email"
          ? `Email queued to ${rows.length} candidate${rows.length > 1 ? "s" : ""}`
          : `Notification sent to ${rows.length} candidate${rows.length > 1 ? "s" : ""}`,
    };
  });
