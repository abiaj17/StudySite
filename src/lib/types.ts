export type Priority = "low" | "med" | "high";

export interface ClassItem {
  id: string;
  name: string;
  code: string; // e.g. "CHEM 121"
  /** 0-1 offset from theme hue, used to distinguish classes within monochromatic palette (0-360 shift) */
  tint: number; // 0..360 additive to root hue; kept subtle
  createdAt: number;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  notes?: string;
  dueDate: string; // ISO date (YYYY-MM-DD)
  dueTime?: string; // HH:MM optional
  priority: Priority;
  estMinutes: number; // estimated minutes to complete
  completed: boolean;
  createdAt: number;
}

export interface TestItem {
  id: string;
  classId: string;
  title: string;
  notes?: string;
  date: string; // ISO date
  time?: string;
  studyHours: number; // total planned study time
  topics: string[];
  completed: boolean;
  createdAt: number;
}

/** A generated study session for a test, spaced across days leading up to the test */
export interface StudySession {
  id: string;
  testId: string;
  date: string; // ISO date
  minutes: number;
  focus: string; // e.g. "review Ch. 3", "practice problems"
  done: boolean;
}

export type Mode = "dark" | "light";

export interface AppState {
  classes: ClassItem[];
  assignments: Assignment[];
  tests: TestItem[];
  studySessions: StudySession[];
  themeHue: number;
  themeSat: number;
  themeName: string;
  mode: Mode;
}
