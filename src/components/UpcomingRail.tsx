import type { Assignment, ClassItem, StudySession, TestItem } from "../lib/types";
import { today, daysBetween, fromISODate, friendlyDelta, formatShortDate } from "../lib/date";
import { IconFire, IconTarget, IconSpark, IconBook, IconClock, IconCheck } from "./icons";

interface Props {
  classes: ClassItem[];
  assignments: Assignment[];
  tests: TestItem[];
  studySessions: StudySession[];
  onJump: (iso: string) => void;
  onToggleAsg: (id: string) => void;
}

export function UpcomingRail(p: Props) {
  const classById = Object.fromEntries(p.classes.map((c) => [c.id, c]));
  const now = today();
  const todayISO = (() => { const d = today(); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,"0"); const dd = String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${dd}`; })();

  // Study today
  const studyToday = p.studySessions.filter((s) => s.date === todayISO && !s.done);
  const asgToday = p.assignments.filter((a) => a.dueDate === todayISO && !a.completed);

  // Overdue — open work whose due date already passed. Nothing else in the rail matters more.
  const overdue = p.assignments
    .filter((a) => !a.completed)
    .map((a) => ({ a, d: daysBetween(now, fromISODate(a.dueDate)) }))
    .filter(({ d }) => d < 0)
    .sort((x, y) => x.d - y.d);

  // Upcoming assignments (next 14 days, open only)
  const upcomingAsg = p.assignments
    .filter((a) => !a.completed)
    .map((a) => ({ a, d: daysBetween(now, fromISODate(a.dueDate)) }))
    .filter(({ d }) => d >= 0 && d <= 14)
    .sort((x, y) => x.d - y.d)
    .slice(0, 6);

  const upcomingTests = p.tests
    .filter((t) => !t.completed)
    .map((t) => ({ t, d: daysBetween(now, fromISODate(t.date)) }))
    .filter(({ d }) => d >= 0 && d <= 21)
    .sort((x, y) => x.d - y.d)
    .slice(0, 5);

  // Progress: this week
  const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - now.getDay());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  const inWeek = (iso: string) => {
    const d = fromISODate(iso);
    return d >= weekStart && d <= weekEnd;
  };
  const weekAsg = p.assignments.filter((a) => inWeek(a.dueDate));
  const weekDone = weekAsg.filter((a) => a.completed).length;
  const weekTotal = weekAsg.length;
  const weekPct = weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100);

  return (
    <div className="space-y-4">
      {/* Overdue — only rendered when there is something to answer for */}
      {overdue.length > 0 && (
        <div className="rounded-2xl p-4 animate-float-in late-panel">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "hsl(var(--accent))" }}>
              Overdue
            </div>
            <div className="text-xs font-semibold" style={{ color: "hsl(var(--accent))" }}>
              {overdue.length} late
            </div>
          </div>
          <div className="space-y-2">
            {overdue.slice(0, 5).map(({ a, d }) => {
              const cls = classById[a.classId];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 rounded-xl p-3"
                  style={{ background: "hsl(var(--bg-2))", border: "1px dashed hsl(var(--accent) / 0.55)" }}
                >
                  <button
                    onClick={() => p.onToggleAsg(a.id)}
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ border: "1.5px solid hsl(var(--accent))", color: "hsl(var(--accent))" }}
                    title="Mark done"
                  >
                    <IconCheck className="w-3 h-3 opacity-0 hover:opacity-100" />
                  </button>
                  <button onClick={() => p.onJump(a.dueDate)} className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-semibold truncate">{a.title}</div>
                    <div className="text-[11px] truncate" style={{ color: "hsl(var(--ink-3))" }}>
                      {cls?.code ?? "—"} · was due {formatShortDate(a.dueDate)}
                    </div>
                  </button>
                  <div className="font-display text-lg shrink-0" style={{ color: "hsl(var(--accent))" }}>
                    {-d}<span className="text-[10px]" style={{ color: "hsl(var(--ink-3))" }}>d</span>
                  </div>
                </div>
              );
            })}
            {overdue.length > 5 && (
              <div className="text-[11px] pt-0.5" style={{ color: "hsl(var(--ink-3))" }}>
                +{overdue.length - 5} more overdue
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly progress meter */}
      <div className="glass rounded-2xl p-4 animate-float-in">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "hsl(var(--ink-3))" }}>This week</div>
          <div className="text-xs font-semibold" style={{ color: "hsl(var(--accent))" }}>{weekDone}/{weekTotal} done</div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--bg-2))" }}>
          <div
            className="h-full rounded-full transition-all duration-700 shimmer"
            style={{
              width: `${weekPct}%`,
              background: "linear-gradient(90deg, hsl(var(--accent-soft)), hsl(var(--accent)))",
              boxShadow: "0 0 12px hsl(var(--accent) / 0.6)",
            }}
          />
        </div>
        <div className="mt-2 font-display text-2xl" style={{ color: "hsl(var(--ink-1))" }}>
          {weekPct === 100 && weekTotal > 0 ? "Week crushed" :
           weekPct >= 70 ? "Almost there" :
           weekPct >= 40 ? "Keep the pace" :
           weekTotal === 0 ? "Nothing due" : "Time to lock in"}
        </div>
      </div>

      {/* Study today */}
      <div className="glass rounded-2xl p-4 animate-float-in" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <IconSpark className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
          <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "hsl(var(--ink-3))" }}>Focus today</div>
        </div>
        {studyToday.length === 0 && asgToday.length === 0 && (
          <div className="text-sm" style={{ color: "hsl(var(--ink-2))" }}>
            No forced focus today. <span style={{ color: "hsl(var(--ink-3))" }}>Get ahead on what's coming.</span>
          </div>
        )}
        <div className="space-y-2">
          {studyToday.map((s) => {
            const test = p.tests.find((t) => t.id === s.testId);
            const cls = test ? classById[test.classId] : null;
            return (
              <button
                key={s.id}
                onClick={() => p.onJump(s.date)}
                className="w-full text-left rounded-xl p-3 transition-all hover:translate-x-1"
                style={{ background: "hsl(var(--bg-2))", border: "1px solid hsl(var(--line))" }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold truncate">
                  <IconBook className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--accent))" }} />
                  <span className="truncate">{s.focus}</span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <span className="chip">{cls?.code ?? "test"}</span>
                  <span className="chip"><IconClock className="w-3 h-3" />{s.minutes} min</span>
                </div>
              </button>
            );
          })}
          {asgToday.map((a) => {
            const cls = classById[a.classId];
            return (
              <button
                key={a.id}
                onClick={() => p.onJump(a.dueDate)}
                className="w-full text-left rounded-xl p-3 transition-all hover:translate-x-1"
                style={{
                  background: "hsl(var(--bg-2))",
                  border: `1px solid ${a.priority === "high" ? "hsl(var(--accent) / 0.5)" : "hsl(var(--line))"}`,
                }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold truncate">
                  {a.priority === "high" && <IconFire className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--accent))" }} />}
                  <span className="truncate">{a.title}</span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <span className="chip">{cls?.code ?? "—"}</span>
                  <span className="chip"><IconClock className="w-3 h-3" />{a.estMinutes} min</span>
                  <span className="chip" style={{ color: "hsl(var(--accent))" }}>due today</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming tests */}
      <div className="glass rounded-2xl p-4 animate-float-in" style={{ animationDelay: "160ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <IconTarget className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
          <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "hsl(var(--ink-3))" }}>Tests on the horizon</div>
        </div>
        {upcomingTests.length === 0 && (
          <div className="text-sm" style={{ color: "hsl(var(--ink-3))" }}>No tests in the next 3 weeks.</div>
        )}
        <div className="space-y-2">
          {upcomingTests.map(({ t, d }) => {
            const cls = classById[t.classId];
            return (
              <button
                key={t.id}
                onClick={() => p.onJump(t.date)}
                className="w-full text-left rounded-xl p-3 transition-all hover:translate-x-1"
                style={{ background: "hsl(var(--bg-2))", border: "1px solid hsl(var(--line))" }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm truncate flex-1">{cls?.code ?? ""} · {t.title}</div>
                  <div
                    className="font-display text-lg ml-2"
                    style={{ color: d <= 3 ? "hsl(var(--accent))" : "hsl(var(--ink-2))" }}
                  >
                    {d}<span className="text-xs" style={{ color: "hsl(var(--ink-3))" }}>d</span>
                  </div>
                </div>
                <div className="text-xs mt-1" style={{ color: "hsl(var(--ink-3))" }}>
                  {formatShortDate(t.date)} · {friendlyDelta(d)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming assignments */}
      <div className="glass rounded-2xl p-4 animate-float-in" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <IconFire className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
          <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "hsl(var(--ink-3))" }}>Next 14 days</div>
        </div>
        {upcomingAsg.length === 0 && (
          <div className="text-sm" style={{ color: "hsl(var(--ink-3))" }}>Nothing coming up. Suspicious.</div>
        )}
        <div className="space-y-2">
          {upcomingAsg.map(({ a, d }) => {
            const cls = classById[a.classId];
            const tint = cls?.tint ?? 0;
            return (
              <button
                key={a.id}
                onClick={() => p.onJump(a.dueDate)}
                className="w-full text-left rounded-xl p-3 transition-all hover:translate-x-1 flex items-center gap-3"
                style={{ background: "hsl(var(--bg-2))", border: "1px solid hsl(var(--line))" }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: `hsl(calc(var(--hue) + ${tint}) 80% 60%)`,
                    boxShadow: a.priority === "high" ? `0 0 6px hsl(calc(var(--hue) + ${tint}) 80% 60%)` : "none",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-[11px] truncate" style={{ color: "hsl(var(--ink-3))" }}>
                    {cls?.code ?? "—"} · {formatShortDate(a.dueDate)}
                  </div>
                </div>
                <div className="font-display text-lg" style={{ color: d <= 1 ? "hsl(var(--accent))" : "hsl(var(--ink-2))" }}>
                  {d === 0 ? "!" : d}<span className="text-[10px]" style={{ color: "hsl(var(--ink-3))" }}>{d === 0 ? "" : "d"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
