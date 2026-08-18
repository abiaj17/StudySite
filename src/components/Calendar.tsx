import { useMemo } from "react";
import type { Assignment, ClassItem, StudySession, TestItem } from "../lib/types";
import { buildMonthGrid, buildWeekGrid, DAY_NAMES_SHORT, MONTH_NAMES, toISODate, today, daysBetween, fromISODate } from "../lib/date";
import { IconChevronLeft, IconChevronRight, IconBook, IconFlask, IconTarget } from "./icons";

export type CalScale = "month" | "week";

interface Props {
  year: number;
  month: number; // 0-11
  scale: CalScale;
  classes: ClassItem[];
  assignments: Assignment[];
  tests: TestItem[];
  studySessions: StudySession[];
  selectedISO: string | null;
  onSelect: (iso: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  monthKey: number; // increments on nav to trigger re-mount for animation
}

export function Calendar(p: Props) {
  const isWeek = p.scale === "week";
  const grid = useMemo(
    () => isWeek
      ? buildWeekGrid(fromISODate(p.selectedISO ?? toISODate(today())))
      : buildMonthGrid(p.year, p.month),
    [isWeek, p.selectedISO, p.year, p.month],
  );
  const todayISO = toISODate(today());
  const classById = useMemo(() => Object.fromEntries(p.classes.map((c) => [c.id, c])), [p.classes]);

  // Bucket items by day
  const byDay = useMemo(() => {
    const map: Record<string, { assignments: Assignment[]; tests: TestItem[]; studies: StudySession[] }> = {};
    for (const a of p.assignments) {
      (map[a.dueDate] ??= { assignments: [], tests: [], studies: [] }).assignments.push(a);
    }
    for (const t of p.tests) {
      (map[t.date] ??= { assignments: [], tests: [], studies: [] }).tests.push(t);
    }
    for (const s of p.studySessions) {
      (map[s.date] ??= { assignments: [], tests: [], studies: [] }).studies.push(s);
    }
    return map;
  }, [p.assignments, p.tests, p.studySessions]);

  // Week scale can straddle a month (or, rarely, a year) boundary, so the big
  // display text becomes a date range instead of a bare month name.
  const headline = isWeek
    ? (() => {
        const first = grid[0], last = grid[6];
        const fm = MONTH_NAMES[first.getMonth()].slice(0, 3);
        const lm = MONTH_NAMES[last.getMonth()].slice(0, 3);
        return fm === lm ? `${fm} ${first.getDate()}–${last.getDate()}` : `${fm} ${first.getDate()} – ${lm} ${last.getDate()}`;
      })()
    : MONTH_NAMES[p.month];
  const headlineYear = isWeek ? grid[6].getFullYear() : p.year;

  return (
    <div className="w-full">
      {/* Header — huge month name, or a date range when zoomed to a week */}
      <div className="flex items-end justify-between gap-4 mb-6 px-1">
        <div key={p.monthKey} className="animate-month-in min-w-0">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1
              className="font-display text-gradient"
              style={{ fontSize: isWeek ? "clamp(32px, 5vw, 64px)" : "clamp(48px, 7.5vw, 104px)", lineHeight: 1.15, paddingBottom: "0.05em" }}
            >
              {headline}
            </h1>
            <div className="flex flex-col">
              <span className="font-display" style={{ fontSize: "clamp(24px, 2.5vw, 40px)", lineHeight: 1.15, color: "hsl(var(--ink-2))" }}>
                {headlineYear}
              </span>
              <span className="text-[11px] uppercase tracking-[0.3em] mt-1" style={{ color: "hsl(var(--ink-3))" }}>
                {(() => {
                  const upcoming = p.assignments.filter((a) => !a.completed).length +
                                   p.tests.filter((t) => !t.completed).length;
                  return `${upcoming} items in orbit`;
                })()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="btn btn-ghost btn-icon" onClick={p.onPrev} title={isWeek ? "Previous week" : "Previous month"}>
            <IconChevronLeft className="w-4 h-4" />
          </button>
          <button className="btn btn-ghost" onClick={p.onToday}>Today</button>
          <button className="btn btn-ghost btn-icon" onClick={p.onNext} title={isWeek ? "Next week" : "Next month"}>
            <IconChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-2 mb-2 px-1">
        {DAY_NAMES_SHORT.map((d, i) => (
          <div
            key={d}
            className="text-[10px] uppercase tracking-[0.25em] text-center py-1"
            style={{ color: i === 0 || i === 6 ? "hsl(var(--accent) / 0.8)" : "hsl(var(--ink-3))" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div key={p.monthKey + "-g"} className="grid grid-cols-7 gap-2 animate-month-in">
        {grid.map((date, idx) => {
          const iso = toISODate(date);
          // Week scale has no "other month" concept — every visible day counts.
          const isCurrentMonth = isWeek || date.getMonth() === p.month;
          const isToday = iso === todayISO;
          const isSelected = iso === p.selectedISO;
          const bucket = byDay[iso];
          const daysAway = daysBetween(today(), date);

          const openAsg = bucket?.assignments.filter((a) => !a.completed) ?? [];
          const doneAsg = bucket?.assignments.filter((a) => a.completed) ?? [];
          const tests = bucket?.tests ?? [];
          const studies = bucket?.studies ?? [];

          const totalItems = openAsg.length + tests.length + studies.length;
          const hasHighPriority = openAsg.some((a) => a.priority === "high") || tests.length > 0;
          const isOverdue = isCurrentMonth && daysAway < 0 && openAsg.length > 0;
          const heatClass =
            !isCurrentMonth ? "" :
            totalItems === 0 ? "" :
            (hasHighPriority && daysAway >= 0 && daysAway <= 2) ? "heat-3" :
            (totalItems >= 2 && daysAway >= 0 && daysAway <= 5) ? "heat-2" :
            (totalItems >= 1 && daysAway >= 0 && daysAway <= 7) ? "heat-1" : "";

          return (
            <button
              key={iso}
              onClick={() => p.onSelect(iso)}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              aria-label={[
                `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
                isToday ? "today" : null,
                tests.length ? `${tests.length} test${tests.length > 1 ? "s" : ""}` : null,
                openAsg.length ? `${openAsg.length} assignment${openAsg.length > 1 ? "s" : ""} due` : null,
                studies.length ? `${studies.length} study session${studies.length > 1 ? "s" : ""}` : null,
                isOverdue ? "overdue" : null,
                totalItems === 0 ? "nothing scheduled" : null,
              ].filter(Boolean).join(", ")}
              className={`cell ${isCurrentMonth ? "" : "other-month"} ${isToday ? "today" : ""} ${isOverdue ? "overdue" : ""} ${heatClass} text-left rounded-xl overflow-hidden`}
              style={{
                background: isSelected
                  ? "hsl(var(--bg-3))"
                  : "hsl(var(--bg-1))",
                border: "1px solid hsl(var(--line))",
                minHeight: isWeek ? 220 : 96,
                padding: "8px 10px",
                animationDelay: `${Math.min(400, idx * 8)}ms`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-display leading-none ${isToday ? "" : ""}`}
                  style={{
                    fontSize: 24,
                    color: isToday ? "hsl(var(--accent))" : "hsl(var(--ink-1))",
                  }}
                >
                  {date.getDate()}
                </span>
                {isToday && (
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full animate-breathe"
                    style={{
                      background: "hsl(var(--accent) / 0.15)",
                      color: "hsl(var(--accent))",
                      border: "1px solid hsl(var(--accent) / 0.4)",
                    }}
                  >
                    Now
                  </span>
                )}
              </div>

              {/* Items summary — week scale has room to skip the truncation */}
              <div className="mt-2 space-y-1">
                {tests.slice(0, isWeek ? undefined : 1).map((t) => {
                  const cls = classById[t.classId];
                  return (
                    <div key={t.id} className="flex items-center gap-1.5 text-[11px] font-semibold truncate"
                         style={{ color: "hsl(var(--accent))" }}>
                      <IconTarget className="w-3 h-3 shrink-0" />
                      <span className="truncate">{cls?.code ?? ""} {t.title}</span>
                    </div>
                  );
                })}
                {openAsg.slice(0, isWeek ? undefined : (tests.length > 0 ? 1 : 2)).map((a) => {
                  const cls = classById[a.classId];
                  const tint = cls?.tint ?? 0;
                  return (
                    <div key={a.id} className="flex items-center gap-1.5 text-[11px] truncate">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background: `hsl(calc(var(--hue) + ${tint}) 80% 60%)`,
                          boxShadow: a.priority === "high" ? `0 0 6px hsl(calc(var(--hue) + ${tint}) 80% 60%)` : "none",
                        }}
                      />
                      <span className="truncate" style={{ color: "hsl(var(--ink-2))" }}>
                        {a.title}
                      </span>
                    </div>
                  );
                })}
                {studies.length > 0 && (isWeek || (openAsg.length + tests.length) < 3) && (
                  <div className="flex items-center gap-1.5 text-[10px] truncate" style={{ color: "hsl(var(--ink-3))" }}>
                    <IconBook className="w-3 h-3 shrink-0" />
                    <span className="truncate">study · {studies.length}</span>
                  </div>
                )}
                {!isWeek && (openAsg.length + tests.length + studies.length) > 3 && (
                  <div className="text-[10px]" style={{ color: "hsl(var(--ink-3))" }}>
                    +{openAsg.length + tests.length + studies.length - 3} more
                  </div>
                )}
                {doneAsg.length > 0 && openAsg.length === 0 && tests.length === 0 && studies.length === 0 && (
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "hsl(var(--ink-3))" }}>
                    <IconFlask className="w-3 h-3 shrink-0 opacity-40" />
                    <span className="line-through">all done</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
