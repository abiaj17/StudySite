import type { AppState, Assignment, ClassItem, StudySession, TestItem } from "./types";
import { addDays, toISODate, fromISODate } from "./date";

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

/** Generate spaced study sessions for a test: 7, 5, 3, 1 days before test.
 *  Total minutes = studyHours * 60 split by weights [0.2, 0.25, 0.3, 0.25]. */
export function generateStudySessions(test: TestItem): StudySession[] {
  const totalMin = Math.max(30, Math.round(test.studyHours * 60));
  const testDate = fromISODate(test.date);
  const plan: { daysBefore: number; weight: number; focus: string }[] = [
    { daysBefore: 7, weight: 0.15, focus: "Skim notes & mark weak spots" },
    { daysBefore: 5, weight: 0.2,  focus: "Read chapters & summarize" },
    { daysBefore: 3, weight: 0.25, focus: "Practice problems" },
    { daysBefore: 1, weight: 0.4,  focus: "Full review & mock quiz" },
  ];
  return plan
    .filter((p) => p.daysBefore >= 1)
    .map((p) => {
      const d = addDays(testDate, -p.daysBefore);
      return {
        id: makeId(),
        testId: test.id,
        date: toISODate(d),
        minutes: Math.round(totalMin * p.weight),
        focus: p.focus,
        done: false,
      } as StudySession;
    });
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
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.classes && parsed.assignments && parsed.tests) {
        return {
          studySessions: [],
          ...parsed,
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
