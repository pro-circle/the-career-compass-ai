import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const urlInput = z.object({ url: z.string().url() });

type ParsedJob = {
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  preferences: string[];
  tags: string[];
  companyDetails: string;
};

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ATSEngineBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
  const html = await res.text();
  // Strip scripts/styles, then tags.
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 18000);
}

async function extractJobWithAI(url: string, text: string): Promise<ParsedJob> {
  const { runAgent, hasAnyProvider } = await import("@/lib/ai-provider.server");
  if (!hasAnyProvider()) {
    const { MISSING_KEYS_MESSAGE } = await import("@/lib/ai-provider.server");
    throw new Error(MISSING_KEYS_MESSAGE);
  }
  const { text: out } = await runAgent({
    kind: "agent",
    system:
      "You extract job postings from page text. Return ONLY strict JSON, no prose. Schema: {title, company, location, type, salary, description, requirements:[], preferences:[], tags:[], companyDetails}. Use empty strings/arrays when unknown.",
    prompt: `Source URL: ${url}\n\nPage text:\n${text}`,
  });
  const match = out.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return JSON");
  const parsed = JSON.parse(match[0]) as Partial<ParsedJob>;
  return {
    title: parsed.title ?? "",
    company: parsed.company ?? "",
    location: parsed.location ?? "",
    type: parsed.type ?? "Full-time",
    salary: parsed.salary ?? "",
    description: parsed.description ?? "",
    requirements: parsed.requirements ?? [],
    preferences: parsed.preferences ?? [],
    tags: parsed.tags ?? [],
    companyDetails: parsed.companyDetails ?? "",
  };
}

export const parseJobUrl = createServerFn({ method: "POST" })
  .validator((d: unknown) => urlInput.parse(d))
  .handler(async ({ data }): Promise<ParsedJob> => {
    const text = await fetchPageText(data.url);
    return extractJobWithAI(data.url, text);
  });

export const importJobFromUrl = createServerFn({ method: "POST" })
  .validator((d: unknown) => urlInput.parse(d))
  .handler(async ({ data }) => {
    const { requireUserId } = await import("@/lib/session.server");
    const employerId = await requireUserId();

    const text = await fetchPageText(data.url);
    const job = await extractJobWithAI(data.url, text);

    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = getSupabaseAdmin();
    const id = `JOB-${Date.now().toString().slice(-6)}`;
    if (db) {
      await db.from("jobs").insert({
        id,
        employer_id: employerId,
        title: job.title || "Untitled role",
        department: "",
        location: job.location,
        type: job.type || "Full-time",
        status: "Draft",
        applicants: 0,
        new_count: 0,
        match_avg: 0,
        salary: job.salary,
        description: [
          job.description,
          job.requirements.length ? `\n\nRequirements:\n- ${job.requirements.join("\n- ")}` : "",
          job.preferences.length ? `\n\nNice to have:\n- ${job.preferences.join("\n- ")}` : "",
          job.companyDetails ? `\n\nAbout ${job.company}:\n${job.companyDetails}` : "",
        ].join(""),
        tags: job.tags,
      });
    }
    return { ok: true as const, id, job };
  });

const JOB_HINTS = [
  "responsibilities",
  "qualifications",
  "requirements",
  "apply now",
  "job description",
  "what you'll do",
  "what you will do",
  "years of experience",
  "full-time",
  "part-time",
  "internship",
  "we're hiring",
  "we are hiring",
  "benefits",
  "salary",
  "compensation",
  "job id",
  "employment type",
];

/** Heuristic: does this page look like a single job posting? */
function looksLikeJob(text: string, title: string): boolean {
  const t = `${title} ${text}`.toLowerCase();
  const hits = JOB_HINTS.filter((h) => t.includes(h)).length;
  const titleHit =
    /(engineer|developer|designer|manager|analyst|scientist|intern|hiring|careers?|job|vacancy|recruit)/i.test(
      title,
    );
  return hits >= 3 || (titleHit && hits >= 2);
}

export const evaluateJobUrl = createServerFn({ method: "POST" })
  .validator((d: unknown) => urlInput.parse(d))
  .handler(async ({ data }) => {
    const { requireUserId } = await import("@/lib/session.server");
    const userId = await requireUserId();

    const { fetchReadableText } = await import("@/lib/linkfetch.server");
    const { text: pageText, preview } = await fetchReadableText(data.url);
    const text = pageText.slice(0, 18000);

    if (!looksLikeJob(text, preview.title)) {
      return {
        preview,
        isJob: false as const,
        job: null,
        evaluation: null,
        message:
          "That link does not look like a job posting — here is a preview of the page instead.",
      };
    }

    const job = await extractJobWithAI(data.url, text);

    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = getSupabaseAdmin();
    let profile: Record<string, unknown> = {};
    if (db) {
      const { data: p } = await db
        .from("profiles")
        .select("full_name,headline,skills,years_exp,target_roles,resume_text")
        .eq("id", userId)
        .maybeSingle();
      if (p) profile = p;
    }

    type Evaluation = {
      matchScore: number;
      strengths: string[];
      gaps: string[];
      summary: string;
      interviewPlan: { stage: string; focus: string; questions: string[] }[];
      preparationTips: string[];
    };
    let evaluation: Evaluation | null = null;
    const { runAgent: runEval, hasAnyProvider: hasProv } = await import("@/lib/ai-provider.server");
    if (hasProv()) {
      const { text: out } = await runEval({
        kind: "agent",
        system:
          "Evaluate a candidate for a job posting. Return ONLY strict JSON: {matchScore:0-100, strengths:[], gaps:[], summary, interviewPlan:[{stage,focus,questions:[]}], preparationTips:[]}",
        prompt: `Job:\n${JSON.stringify(job)}\n\nCandidate:\n${JSON.stringify(profile).slice(0, 8000)}`,
      });
      const m = out.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]) as Partial<Evaluation>;
          evaluation = {
            matchScore: Number(parsed.matchScore ?? 0),
            strengths: parsed.strengths ?? [],
            gaps: parsed.gaps ?? [],
            summary: parsed.summary ?? "",
            interviewPlan: (parsed.interviewPlan ?? []).map((s) => ({
              stage: s.stage ?? "",
              focus: s.focus ?? "",
              questions: s.questions ?? [],
            })),
            preparationTips: parsed.preparationTips ?? [],
          };
        } catch {
          /* ignore */
        }
      }
    }
    return { preview, isJob: true as const, job, evaluation, message: "" };
  });
