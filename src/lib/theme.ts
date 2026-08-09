// Client-only theme helper. System-default with manual override, persisted.
export type Theme = "light" | "dark" | "system";
const KEY = "ats-engine-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function resolveTheme(t: Theme): "light" | "dark" {
  if (t !== "system") return t;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(t);
  // `color-scheme` is driven by CSS (:root / .dark in styles.css) so we never
  // touch inline styles — that would cause an SSR hydration mismatch.
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function setTheme(t: Theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, t);
  applyTheme(t);
  window.dispatchEvent(new CustomEvent("ats-theme-change", { detail: t }));
}

// Inline script (as a string) to avoid FOUC. Run in <head>.
export const THEME_BOOTSTRAP_SCRIPT = `
(function(){try{
  var s=localStorage.getItem("${KEY}");
  var t = (s==="light"||s==="dark") ? s : (window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  document.documentElement.classList.toggle("dark", t==="dark");
}catch(e){}})();
`;
