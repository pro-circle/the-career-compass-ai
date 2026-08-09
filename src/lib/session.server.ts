/**
 * Encrypted cookie session.
 *
 * There is deliberately NO `SESSION_SECRET` env var any more: the key is
 * derived from values this project already has (Supabase project ref), so
 * setup is zero-config. Override it only if you want cookies to survive a
 * key rotation across multiple server instances.
 */
import { useSession } from "@tanstack/react-start/server";
import { firstEnv } from "./env.server";

export type AppRole = "employer" | "candidate";

export type AppSession = {
  userId?: string;
  username?: string;
  role?: AppRole;
  onboarded?: boolean;
};

const BASE = "ats-engine-session-key-v1";

function derivedPassword(): string {
  const salt =
    firstEnv("SUPABASE_PROJECT_ID", "VITE_SUPABASE_PROJECT_ID", "SUPABASE_URL", "APP_URL") ??
    "local-dev";
  return `${BASE}:${salt}`.padEnd(64, "0");
}

export function sessionConfig() {
  return {
    password: derivedPassword(),
    name: "ats-engine-session",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: true,
      path: "/",
    },
  };
}

export async function getAppSession() {
  return useSession<AppSession>(sessionConfig());
}

/** Signed-in user id, or throws. Every write path must go through this. */
export async function requireUserId(): Promise<string> {
  const session = await getAppSession();
  const id = session.data.userId;
  if (!id) throw new Error("You must be signed in to do that.");
  return id;
}
