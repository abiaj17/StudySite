import type { AppState, StudySession, TestItem } from "./types";
import { addDays, toISODate, fromISODate, today, daysBetween } from "./date";

// Intentionally left as the old app name — this key is invisible to users, and
// changing it would silently drop everyone's existing saved data on next load.
const STORAGE_KEY = "study-orbit-v1";

export const THEMES = [
  { name: "Midnight", hue: 220, sat: 55 },
  { name: "Rose",     hue: 340, sat: 55 },
  { name: "Forest",   hue: 148, sat: 50 },
  { name: "Sunset",   hue: 24,  sat: 65 },
  { name: "Ash",      hue: 0,   sat: 0  },
] as const;

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Generate spaced study sessions for a test at 7, 5, 3, 1 days before.
 *  Total minutes = studyHours * 60 split by weights [0.15, 0.2, 0.25, 0.4].
 *
 *  Slots that would land in the past are dropped and the remaining weights are
 *  re-normalized, so a test added 3 days out still schedules the full study time
 *  instead of silently losing it to dates nobody will ever see. */
export function generateStudySessions(test: TestItem, from: Date = today()): StudySession[] {
  const totalMin = Math.max(30, Math.round(test.studyHours * 60));
  const testDate = fromISODate(test.date);
  const daysUntil = daysBetween(from, testDate);

  const plan: { daysBefore: number; weight: number; focus: string }[] = [
    { daysBefore: 7, weight: 0.15, focus: "Skim notes & mark weak spots" },
    { daysBefore: 5, weight: 0.2,  focus: "Read chapters & summarize" },
    { daysBefore: 3, weight: 0.25, focus: "Practice problems" },
    { daysBefore: 1, weight: 0.4,  focus: "Full review & mock quiz" },
  ];

  const usable = plan.filter((p) => p.daysBefore <= daysUntil);
  if (usable.length === 0) return [];
  const weightSum = usable.reduce((sum, p) => sum + p.weight, 0);

  return usable.map((p) => ({
    id: makeId(),
    testId: test.id,
    date: toISODate(addDays(testDate, -p.daysBefore)),
    minutes: Math.round((totalMin * p.weight) / weightSum),
    focus: p.focus,
    done: false,
  } as StudySession));
}

function seed(): AppState {
  // Clean slate — no demo data. First-time users start empty.
  return {
    classes: [],
    assignments: [],
    tests: [],
    studySessions: [],
    themeHue: 220,
    themeSat: 55,
    themeName: "Midnight",
    mode: "dark",
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.classes && parsed.assignments && parsed.tests) {
        return {
          ...parsed,
          studySessions: parsed.studySessions ?? [],
          // Everyone before this field existed was using the app in dark mode
          // (it was the only mode) — default old saves to "dark", not a guess.
          mode: parsed.mode === "light" ? "light" : "dark",
        };
      }
    }
  } catch { /* fall through to seed */ }
  return seed();
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

/* ---- Backup ----------------------------------------------------------
   localStorage is one browser-clear away from gone. Until accounts land,
   export/import is the only thing standing between a student and a wiped term. */

export function exportState(state: AppState): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), state }, null, 2);
}

/** Parse an exported backup. Returns null if the file isn't one of ours. */
export function parseImport(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw);
    const s = parsed?.state ?? parsed;
    if (!s || !Array.isArray(s.classes) || !Array.isArray(s.assignments) || !Array.isArray(s.tests)) {
      return null;
    }
    return {
      classes: s.classes,
      assignments: s.assignments,
      tests: s.tests,
      studySessions: Array.isArray(s.studySessions) ? s.studySessions : [],
      themeHue: typeof s.themeHue === "number" ? s.themeHue : 220,
      themeSat: typeof s.themeSat === "number" ? s.themeSat : 55,
      themeName: typeof s.themeName === "string" ? s.themeName : "Midnight",
      mode: s.mode === "light" ? "light" : "dark",
    };
  } catch {
    return null;
  }
}
