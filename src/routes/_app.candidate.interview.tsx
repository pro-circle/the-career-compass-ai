import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/routes/_app";
import { SectionCard } from "@/components/dashboard/primitives";
import { useDataset } from "@/hooks/use-dataset";
import { Mic, Play, Sparkles, Square, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/candidate/interview")({
  head: () => ({ meta: [{ title: "Mock Interview · ATS Engine" }] }),
  component: MockInterview,
});

function MockInterview() {
  const { interviewQuestions } = useDataset();
  const questions = [
    ...(interviewQuestions.technical ?? []),
    ...(interviewQuestions.behavioral ?? []),
  ];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const voice = useSpeechInput();

  useEffect(() => {
    if (voice.error) toast.error(voice.error);
  }, [voice.error]);

  function next() {
    if (voice.listening) voice.stop();
    setAnswers((a) => [...a, voice.transcript || "(no answer captured)"]);
    voice.reset();
    if (step + 1 >= questions.length) {
      setDone(true);
      toast.success("Interview complete — generating report");
    } else {
      setStep(step + 1);
    }
  }

  if (done)
    return (
      <Report
        onRestart={() => {
          setDone(false);
          setStep(0);
          setAnswers([]);
        }}
      />
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="AI mock interview"
        title="Practice like it's real"
        subtitle="Speak your answers out loud — the coach transcribes and scores you live."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title={`Question ${step + 1} of ${questions.length}`}
          className="lg:col-span-2"
        >
          <div className="p-6">
            <div className="mb-6 h-1 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${((step + 1) / questions.length) * 100}%` }}
              />
            </div>
            <div className="mb-6 rounded-xl bg-surface p-6">
              <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
                Interviewer
              </div>
              <div className="font-display text-xl font-bold leading-snug">{questions[step]}</div>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface/40 px-6 py-10">
              <button
                onClick={() => (voice.listening ? voice.stop() : voice.start())}
                disabled={!voice.supported}
                aria-pressed={voice.listening}
                aria-label={voice.listening ? "Stop recording" : "Start recording"}
                className={`grid size-16 place-items-center rounded-full transition-transform hover:scale-105 disabled:opacity-40 ${
                  voice.listening
                    ? "animate-pulse bg-accent text-accent-foreground ring-8 ring-accent/20"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {voice.listening ? <Square className="size-5" /> : <Mic className="size-6" />}
              </button>
              <div className="text-xs text-muted-foreground">
                {!voice.supported
                  ? "Voice input isn't supported in this browser."
                  : voice.listening
                    ? "Listening — speak your answer"
                    : "Tap to record your answer"}
              </div>
              {(voice.transcript || voice.interim) && (
                <p className="max-h-40 w-full overflow-y-auto rounded-lg bg-card p-4 text-sm leading-relaxed">
                  {voice.transcript} <span className="text-muted-foreground">{voice.interim}</span>
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={next}
                className="inline-flex items-center gap-1 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground"
              >
                {step + 1 >= questions.length ? "Finish" : "Next question"}{" "}
                <Play className="size-3" />
              </button>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Live coach">
            <div className="space-y-3 p-5 text-xs">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
                <span>Use the STAR framework — Situation, Task, Action, Result.</span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
                <span>Quantify impact wherever possible ("led 4 designers", "40% adoption").</span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
                <span>Keep answers under 2 minutes when spoken.</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Session stats">
            <div className="space-y-3 p-5 text-xs">
              <Stat label="Answered" value={`${step + answers.length}/${questions.length}`} />
              <Stat label="Avg pacing" value="1m 42s" />
              <Stat label="Filler words" value="12" />
              <Stat label="Confidence" value="8.2 / 10" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}

function Report({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Interview report"
        title="Your evaluation is ready"
        subtitle="Detailed AI feedback across technical, communication, and soft-skill dimensions."
        actions={
          <button
            onClick={onRestart}
            className="rounded-md border border-border px-3 py-2 text-xs font-semibold"
          >
            Run another session
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-foreground p-6 text-background">
          <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-background/60">
            Overall score
          </div>
          <div className="font-display text-6xl font-extrabold">87</div>
          <div className="mt-1 text-xs text-background/70">
            Strong performance · top 12% of sessions
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-accent">
            <TrendingUp className="size-4" /> +14 vs last session
          </div>
        </div>

        {[
          { label: "Technical depth", val: 91, tone: "text-accent" },
          { label: "Communication clarity", val: 84, tone: "text-brand" },
          { label: "Soft skills / STAR usage", val: 79, tone: "text-amber-500" },
        ].map((d) => (
          <SectionCard key={d.label} title={d.label}>
            <div className="p-6">
              <div className={`font-display text-5xl font-extrabold ${d.tone}`}>{d.val}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                Improve by adding more specific metrics and concrete outcomes.
              </div>
            </div>
          </SectionCard>
        ))}

        <SectionCard title="Highlights & feedback" className="lg:col-span-3">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-accent">
                What worked
              </div>
              <ul className="space-y-1 text-xs text-foreground/80">
                <li>· Clear framing of trade-offs in system design answer</li>
                <li>· Strong use of concrete metrics in leadership story</li>
                <li>· Concise pacing (1m 40s average)</li>
              </ul>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                Where to improve
              </div>
              <ul className="space-y-1 text-xs text-foreground/80">
                <li>· Reduce filler words ("um", "like") — flagged 12 times</li>
                <li>· Expand on the "Result" phase of STAR answers</li>
                <li>· Show more curiosity — ask 1–2 clarifying questions</li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
