import { useEffect, useMemo, useState } from "react";
import { Calendar } from "./components/Calendar";
import { DayPanel } from "./components/DayPanel";
import { UpcomingRail } from "./components/UpcomingRail";
import { ThemeBar } from "./components/ThemeBar";
import { AssignmentModal, TestModal, ClassesModal } from "./components/Modals";
import { IconPlus, IconTarget, IconBook } from "./components/icons";
import type { AppState, Assignment, ClassItem, TestItem } from "./lib/types";
import { loadState, saveState, generateStudySessions, makeId } from "./lib/store";
import { today, toISODate } from "./lib/date";

type ModalKind =
  | null
  | { kind: "assignment"; date?: string; existing?: Assignment }
  | { kind: "test"; date?: string; existing?: TestItem }
  | { kind: "classes" };

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [cursor, setCursor] = useState(() => {
    const t = today();
    return { year: t.getFullYear(), month: t.getMonth() };
  });
  const [monthKey, setMonthKey] = useState(0);
  const [selectedISO, setSelectedISO] = useState<string | null>(() => toISODate(today()));
  const [modal, setModal] = useState<ModalKind>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--hue", String(state.themeHue));
    root.style.setProperty("--sat", `${state.themeSat}%`);
  }, [state.themeHue, state.themeSat]);

  useEffect(() => { saveState(state); }, [state]);

  const goto = (year: number, month: number) => {
    setCursor({ year, month });
    setMonthKey((k) => k + 1);
  };
  const prevMonth = () => {
    const m = cursor.month - 1;
    if (m < 0) goto(cursor.year - 1, 11); else goto(cursor.year, m);
  };
  const nextMonth = () => {
    const m = cursor.month + 1;
    if (m > 11) goto(cursor.year + 1, 0); else goto(cursor.year, m);
  };
  const gotoToday = () => {
    const t = today();
    goto(t.getFullYear(), t.getMonth());
    setSelectedISO(toISODate(t));
  };

  const jumpToDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    if (d.getFullYear() !== cursor.year || d.getMonth() !== cursor.month) {
      goto(d.getFullYear(), d.getMonth());
    }
    setSelectedISO(iso);
  };

  const upsertAssignment = (payload: Omit<Assignment, "id" | "createdAt"> & { id?: string }) => {
    setState((s) => {
      const arr = [...s.assignments];
      if (payload.id) {
        const idx = arr.findIndex((a) => a.id === payload.id);
        if (idx !== -1) arr[idx] = { ...arr[idx], ...payload } as Assignment;
      } else {
        arr.push({ ...(payload as Assignment), id: makeId(), createdAt: Date.now() });
      }
      return { ...s, assignments: arr };
    });
    setModal(null);
  };

  const upsertTest = (payload: Omit<TestItem, "id" | "createdAt"> & { id?: string }) => {
    setState((s) => {
      let tests = [...s.tests];
      let sessions = [...s.studySessions];
      let saved: TestItem;
      if (payload.id) {
        const idx = tests.findIndex((t) => t.id === payload.id);
        if (idx === -1) return s;
        saved = { ...tests[idx], ...payload } as TestItem;
        tests[idx] = saved;
        sessions = sessions.filter((x) => x.testId !== saved.id).concat(generateStudySessions(saved));
      } else {
        saved = { ...(payload as TestItem), id: makeId(), createdAt: Date.now() };
        tests.push(saved);
        sessions = sessions.concat(generateStudySessions(saved));
      }
      return { ...s, tests, studySessions: sessions };
    });
    setModal(null);
  };

  const upsertClass = (payload: Omit<ClassItem, "id" | "createdAt"> & { id?: string }) => {
    setState((s) => {
      const arr = [...s.classes];
      if (payload.id) {
        const idx = arr.findIndex((c) => c.id === payload.id);
        if (idx !== -1) arr[idx] = { ...arr[idx], ...payload } as ClassItem;
      } else {
        arr.push({ ...(payload as ClassItem), id: makeId(), createdAt: Date.now() });
      }
      return { ...s, classes: arr };
    });
  };

  const deleteClass = (id: string) => {
    setState((s) => ({
      ...s,
      classes: s.classes.filter((c) => c.id !== id),
      assignments: s.assignments.filter((a) => a.classId !== id),
      tests: s.tests.filter((t) => t.classId !== id),
      studySessions: s.studySessions.filter((x) => {
        const t = s.tests.find((tt) => tt.id === x.testId);
        return t ? t.classId !== id : false;
      }),
    }));
  };

  const toggleAsg = (id: string) => setState((s) => ({
    ...s, assignments: s.assignments.map((a) => a.id === id ? { ...a, completed: !a.completed } : a),
  }));
  const deleteAsg = (id: string) => setState((s) => ({ ...s, assignments: s.assignments.filter((a) => a.id !== id) }));
  const toggleTest = (id: string) => setState((s) => ({
    ...s, tests: s.tests.map((t) => t.id === id ? { ...t, completed: !t.completed } : t),
  }));
  const deleteTest = (id: string) => setState((s) => ({
    ...s, tests: s.tests.filter((t) => t.id !== id),
    studySessions: s.studySessions.filter((x) => x.testId !== id),
  }));
  const toggleStudy = (id: string) => setState((s) => ({
    ...s, studySessions: s.studySessions.map((x) => x.id === id ? { ...x, done: !x.done } : x),
  }));

  const setTheme = (hue: number, sat: number, name: string) =>
    setState((s) => ({ ...s, themeHue: hue, themeSat: sat, themeName: name }));

  const stats = useMemo(() => {
    const openA = state.assignments.filter((a) => !a.completed).length;
    const openT = state.tests.filter((t) => !t.completed).length;
    const todayI = toISODate(today());
    const dueToday = state.assignments.filter((a) => a.dueDate === todayI && !a.completed).length;
    const studyMinToday = state.studySessions
      .filter((x) => x.date === todayI && !x.done)
      .reduce((sum, x) => sum + x.minutes, 0);
    return { openA, openT, dueToday, studyMinToday };
  }, [state.assignments, state.tests, state.studySessions]);

  return (
    <div className="min-h-screen w-full relative">
      {/* animated background orb */}
      <div
        className="pointer-events-none fixed -z-10 rounded-full animate-spin-slow"
        style={{
          top: "-30vw",
          right: "-30vw",
          width: "80vw",
          height: "80vw",
          background:
            "conic-gradient(from 0deg, hsl(var(--accent) / 0.25), transparent 40%, hsl(var(--accent) / 0.15) 60%, transparent 90%)",
          filter: "blur(80px)",
        }}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <header className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="hidden sm:block">
              <div className="font-display text-2xl leading-none">Study Orbit</div>
              <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "hsl(var(--ink-3))" }}>
                keep your work in gravity
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button className="btn btn-ghost" onClick={() => setModal({ kind: "classes" })}>
              <IconBook className="w-4 h-4" /> Classes
            </button>
            <button className="btn btn-ghost" onClick={() => setModal({ kind: "test", date: selectedISO ?? undefined })}>
              <IconTarget className="w-4 h-4" /> <span className="hidden sm:inline">Test</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setModal({ kind: "assignment", date: selectedISO ?? undefined })}
            >
              <IconPlus className="w-4 h-4" /> <span className="hidden sm:inline">Assignment</span>
            </button>
            <div className="w-px h-6 mx-1" style={{ background: "hsl(var(--line))" }} />
            <ThemeBar
              hue={state.themeHue}
              sat={state.themeSat}
              themeName={state.themeName}
              onChange={setTheme}
            />
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatTile label="Open assignments" value={stats.openA} />
          <StatTile label="Upcoming tests" value={stats.openT} highlight={stats.openT > 0} />
          <StatTile label="Due today" value={stats.dueToday} highlight={stats.dueToday > 0} />
          <StatTile label="Study min · today" value={stats.studyMinToday} suffix=" min" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div>
            <Calendar
              year={cursor.year}
              month={cursor.month}
              classes={state.classes}
              assignments={state.assignments}
              tests={state.tests}
              studySessions={state.studySessions}
              selectedISO={selectedISO}
              onSelect={setSelectedISO}
              onPrev={prevMonth}
              onNext={nextMonth}
              onToday={gotoToday}
              monthKey={monthKey}
            />

            {selectedISO && (
              <div className="mt-6 lg:hidden">
                <DayPanel
                  iso={selectedISO}
                  classes={state.classes}
                  assignments={state.assignments}
                  tests={state.tests}
                  studySessions={state.studySessions}
                  onToggleAsg={toggleAsg}
                  onDeleteAsg={deleteAsg}
                  onToggleTest={toggleTest}
                  onDeleteTest={deleteTest}
                  onToggleStudy={toggleStudy}
                  onAddAssignment={() => setModal({ kind: "assignment", date: selectedISO })}
                  onAddTest={() => setModal({ kind: "test", date: selectedISO })}
                  onClose={() => setSelectedISO(null)}
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            {selectedISO && (
              <div className="hidden lg:block">
                <DayPanel
                  iso={selectedISO}
                  classes={state.classes}
                  assignments={state.assignments}
                  tests={state.tests}
                  studySessions={state.studySessions}
                  onToggleAsg={toggleAsg}
                  onDeleteAsg={deleteAsg}
                  onToggleTest={toggleTest}
                  onDeleteTest={deleteTest}
                  onToggleStudy={toggleStudy}
                  onAddAssignment={() => setModal({ kind: "assignment", date: selectedISO })}
                  onAddTest={() => setModal({ kind: "test", date: selectedISO })}
                  onClose={() => setSelectedISO(null)}
                />
              </div>
            )}
            <UpcomingRail
              classes={state.classes}
              assignments={state.assignments}
              tests={state.tests}
              studySessions={state.studySessions}
              onJump={jumpToDate}
            />
          </div>
        </div>

        <footer className="mt-10 flex items-center justify-between text-[11px] flex-wrap gap-2" style={{ color: "hsl(var(--ink-3))" }}>
          <div>Theme: <span style={{ color: "hsl(var(--accent))" }}>{state.themeName}</span> · hue {state.themeHue}°</div>
          <div>Study Orbit · saved locally</div>
        </footer>
      </div>

      {modal?.kind === "assignment" && (
        <AssignmentModal
          classes={state.classes}
          initialDate={modal.date}
          initial={modal.existing}
          onSave={upsertAssignment}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "test" && (
        <TestModal
          classes={state.classes}
          initialDate={modal.date}
          initial={modal.existing}
          onSave={upsertTest}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "classes" && (
        <ClassesModal
          classes={state.classes}
          onSave={upsertClass}
          onDelete={deleteClass}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function Logo() {
  return (
    <div className="relative w-10 h-10 shrink-0">
      <div
        className="absolute inset-0 rounded-full animate-spin-slow"
        style={{
          background:
            "conic-gradient(from 0deg, hsl(var(--accent) / 0.9), transparent 30%, hsl(var(--accent) / 0.5) 60%, transparent 90%)",
          filter: "blur(4px)",
        }}
      />
      <div
        className="absolute inset-1 rounded-full flex items-center justify-center font-display text-lg"
        style={{
          background: "hsl(var(--bg-0))",
          border: "1px solid hsl(var(--accent) / 0.5)",
          color: "hsl(var(--accent))",
          boxShadow: "inset 0 0 12px hsl(var(--accent) / 0.3)",
        }}
      >
        SO
      </div>
    </div>
  );
}

function StatTile({
  label, value, suffix, highlight,
}: { label: string; value: number; suffix?: string; highlight?: boolean }) {
  return (
    <div
      className="glass rounded-2xl px-4 py-3 relative overflow-hidden transition-all"
      style={{ borderColor: highlight ? "hsl(var(--accent) / 0.45)" : undefined }}
    >
      <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "hsl(var(--ink-3))" }}>{label}</div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className="font-display leading-none"
          style={{
            fontSize: 40,
            color: highlight ? "hsl(var(--accent))" : "hsl(var(--ink-1))",
            textShadow: highlight ? "0 0 24px hsl(var(--accent) / 0.55)" : "none",
          }}
        >
          {value}
        </span>
        {suffix && <span className="text-xs" style={{ color: "hsl(var(--ink-3))" }}>{suffix}</span>}
      </div>
      {highlight && (
        <div
          className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full"
          style={{ background: "hsl(var(--accent) / 0.15)", filter: "blur(20px)" }}
        />
      )}
    </div>
  );
}
