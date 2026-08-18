import { useMemo, useState } from "react";
import type { Assignment, ClassItem, TestItem } from "../lib/types";
import { daysBetween, formatShortDate, friendlyDelta, fromISODate, today, MONTH_NAMES } from "../lib/date";
import { IconCheck, IconTrash, IconPen, IconTarget, IconClock, IconClose } from "./icons";

interface Props {
  classes: ClassItem[];
  assignments: Assignment[];
  tests: TestItem[];
  onJump: (iso: string) => void;
  onToggleAsg: (id: string) => void;
  onDeleteAsg: (id: string) => void;
  onEditAsg: (a: Assignment) => void;
  onToggleTest: (id: string) => void;
  onDeleteTest: (id: string) => void;
  onEditTest: (t: TestItem) => void;
}

type Status = "open" | "done" | "all";

type Row =
  | { kind: "assignment"; id: string; date: string; title: string; classId: string; completed: boolean; a: Assignment }
  | { kind: "test"; id: string; date: string; title: string; classId: string; completed: boolean; t: TestItem };

export function ListView(p: Props) {
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState<string>("all");
  const [status, setStatus] = useState<Status>("open");

  const classById = useMemo(
    () => Object.fromEntries(p.classes.map((c) => [c.id, c])),
    [p.classes],
  );

  const rows = useMemo(() => {
    const all: Row[] = [
      ...p.assignments.map((a): Row => ({
        kind: "assignment", id: a.id, date: a.dueDate, title: a.title,
        classId: a.classId, completed: a.completed, a,
      })),
      ...p.tests.map((t): Row => ({
        kind: "test", id: t.id, date: t.date, title: t.title,
        classId: t.classId, completed: t.completed, t,
      })),
    ];

    const q = query.trim().toLowerCase();
    return all
      .filter((r) => {
        if (status === "open" && r.completed) return false;
        if (status === "done" && !r.completed) return false;
        if (classId !== "all" && r.classId !== classId) return false;
        if (!q) return true;
        const cls = classById[r.classId];
        const notes = r.kind === "assignment" ? r.a.notes : r.t.notes;
        const topics = r.kind === "test" ? r.t.topics.join(" ") : "";
        return [r.title, cls?.code, cls?.name, notes, topics]
          .filter(Boolean).join(" ").toLowerCase().includes(q);
      })
      .sort((x, y) => x.date.localeCompare(y.date));
  }, [p.assignments, p.tests, query, classId, status, classById]);

  // Month dividers so a long list stays readable while scrolling.
  const now = today();
  let lastMonth = "";

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 px-1 flex-wrap">
        <h1
          className="font-display text-gradient"
          style={{ fontSize: "clamp(40px, 5.5vw, 72px)", lineHeight: 1.15, paddingBottom: "0.05em" }}
        >
          Everything
        </h1>
        <div className="text-[11px] uppercase tracking-[0.3em] pb-3" style={{ color: "hsl(var(--ink-3))" }}>
          {rows.length} {rows.length === 1 ? "item" : "items"}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <input
            className="field"
            placeholder="Search title, class, notes, topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md"
              style={{ color: "hsl(var(--ink-3))" }}
              title="Clear search"
            >
              <IconClose className="w-3 h-3" />
            </button>
          )}
        </div>

        <select
          className="field"
          style={{ width: "auto", minWidth: 140 }}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="all">All classes</option>
          {p.classes.map((c) => (
            <option key={c.id} value={c.id}>{c.code}</option>
          ))}
        </select>

        <div className="seg">
          {(["open", "done", "all"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`seg-btn ${status === s ? "is-active" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 && (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "hsl(var(--bg-1) / 0.5)", border: "1px dashed hsl(var(--line))" }}
        >
          <div className="font-display text-3xl mb-1" style={{ color: "hsl(var(--ink-2))" }}>
            {query || classId !== "all" ? "No match" : "Nothing here"}
          </div>
          <div className="text-xs" style={{ color: "hsl(var(--ink-3))" }}>
            {query || classId !== "all"
              ? "Try a looser search or a different filter."
              : "Add an assignment or a test to fill this up."}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => {
          const d = daysBetween(now, fromISODate(r.date));
          const cls = classById[r.classId];
          const tint = cls?.tint ?? 0;
          const monthLabel = `${MONTH_NAMES[fromISODate(r.date).getMonth()]} ${fromISODate(r.date).getFullYear()}`;
          const showDivider = monthLabel !== lastMonth;
          if (showDivider) lastMonth = monthLabel;
          const late = d < 0 && !r.completed;

          return (
            <div key={`${r.kind}-${r.id}`}>
              {showDivider && (
                <div
                  className="text-[10px] uppercase tracking-[0.3em] pt-4 pb-2 px-1"
                  style={{ color: "hsl(var(--ink-3))" }}
                >
                  {monthLabel}
                </div>
              )}
              <div
                className="group flex items-center gap-3 rounded-xl p-3 transition-all"
                style={{
                  background: r.kind === "test" ? "hsl(var(--bg-2))" : "hsl(var(--bg-1))",
                  border: late
                    ? "1px dashed hsl(var(--accent) / 0.55)"
                    : `1px solid ${r.kind === "test" ? "hsl(var(--accent) / 0.35)" : "hsl(var(--line))"}`,
                  opacity: r.completed ? 0.5 : 1,
                }}
              >
                <button
                  onClick={() => r.kind === "assignment" ? p.onToggleAsg(r.id) : p.onToggleTest(r.id)}
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    background: r.completed ? "hsl(var(--accent))" : "transparent",
                    border: `1.5px solid ${r.completed ? "hsl(var(--accent))" : "hsl(var(--line))"}`,
                    color: r.completed ? "hsl(var(--hue) 30% 8%)" : "hsl(var(--ink-1))",
                  }}
                  title={r.completed ? "Mark undone" : "Mark done"}
                >
                  {r.completed && <IconCheck className="w-3 h-3" />}
                </button>

                <button onClick={() => p.onJump(r.date)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    {r.kind === "test" ? (
                      <IconTarget className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--accent))" }} />
                    ) : (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: `hsl(calc(var(--hue) + ${tint}) 80% 60%)` }}
                      />
                    )}
                    <span
                      className="font-semibold text-sm truncate"
                      style={{ textDecoration: r.completed ? "line-through" : "none" }}
                    >
                      {r.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="chip">{cls?.code ?? "—"}</span>
                    <span className="chip">{formatShortDate(r.date)}</span>
                    {r.kind === "assignment" ? (
                      <span className="chip"><IconClock className="w-3 h-3" />{r.a.estMinutes} min</span>
                    ) : (
                      <span className="chip"><IconClock className="w-3 h-3" />{r.t.studyHours}h study</span>
                    )}
                    {late && <span className="chip chip-late">{-d}d late</span>}
                    {!late && !r.completed && <span className="chip">{friendlyDelta(d)}</span>}
                  </div>
                </button>

                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={() => r.kind === "assignment" ? p.onEditAsg(r.a) : p.onEditTest(r.t)}
                    className="btn btn-ghost btn-icon"
                    style={{ width: 30, height: 30 }}
                    title="Edit"
                  >
                    <IconPen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => r.kind === "assignment" ? p.onDeleteAsg(r.id) : p.onDeleteTest(r.id)}
                    className="btn btn-ghost btn-icon"
                    style={{ width: 30, height: 30 }}
                    title="Delete"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
