import type { Assignment, ClassItem, StudySession, TestItem } from "../lib/types";
import { fromISODate, DAY_NAMES_LONG, MONTH_NAMES, daysBetween, today, friendlyDelta } from "../lib/date";
import { IconCheck, IconTrash, IconClock, IconTarget, IconBook, IconPlus, IconClose, IconPen } from "./icons";

interface Props {
  iso: string;
  classes: ClassItem[];
  assignments: Assignment[];
  tests: TestItem[];
  studySessions: StudySession[];
  onToggleAsg: (id: string) => void;
  onDeleteAsg: (id: string) => void;
  onEditAsg: (a: Assignment) => void;
  onToggleTest: (id: string) => void;
  onDeleteTest: (id: string) => void;
  onEditTest: (t: TestItem) => void;
  onToggleStudy: (id: string) => void;
  onAddAssignment: () => void;
  onAddTest: () => void;
  onClose: () => void;
}

export function DayPanel(p: Props) {
  const d = fromISODate(p.iso);
  const dayName = DAY_NAMES_LONG[d.getDay()];
  const monthName = MONTH_NAMES[d.getMonth()];
  const daysAway = daysBetween(today(), d);
  const classById = Object.fromEntries(p.classes.map((c) => [c.id, c]));

  const dayAsg = p.assignments.filter((a) => a.dueDate === p.iso);
  const dayTests = p.tests.filter((t) => t.date === p.iso);
  const dayStudies = p.studySessions.filter((s) => s.date === p.iso);

  const isEmpty = dayAsg.length === 0 && dayTests.length === 0 && dayStudies.length === 0;

  return (
    <div className="glass rounded-2xl p-5 animate-float-in relative" style={{ boxShadow: "0 20px 60px -20px hsl(var(--hue) 90% 20% / 0.5)" }}>
      <button
        className="absolute top-3 right-3 btn btn-ghost btn-icon"
        onClick={p.onClose}
        title="Close"
        style={{ width: 30, height: 30 }}
      >
        <IconClose className="w-3.5 h-3.5" />
      </button>

      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.3em]" style={{ color: "hsl(var(--ink-3))" }}>
          {dayName}
        </div>
        <div className="flex items-baseline gap-3 mt-1">
          <span className="font-display" style={{ fontSize: 52, lineHeight: 1, color: "hsl(var(--ink-1))" }}>
            {d.getDate()}
          </span>
          <span className="font-display" style={{ fontSize: 28, color: "hsl(var(--accent))" }}>
            {monthName}
          </span>
          <span className="text-xs ml-auto" style={{ color: daysAway < 0 ? "hsl(var(--ink-3))" : "hsl(var(--accent))" }}>
            {friendlyDelta(daysAway)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button className="btn btn-primary flex-1" onClick={p.onAddAssignment}>
          <IconPlus className="w-4 h-4" /> Assignment
        </button>
        <button className="btn btn-ghost flex-1" onClick={p.onAddTest}>
          <IconTarget className="w-4 h-4" /> Test
        </button>
      </div>

      {isEmpty && (
        <div className="text-center py-8 rounded-xl" style={{ background: "hsl(var(--bg-2) / 0.5)", border: "1px dashed hsl(var(--line))" }}>
          <div className="font-display text-2xl mb-1" style={{ color: "hsl(var(--ink-2))" }}>Clear sky</div>
          <div className="text-xs" style={{ color: "hsl(var(--ink-3))" }}>
            Nothing due. Add something or enjoy the calm.
          </div>
        </div>
      )}

      {dayTests.length > 0 && (
        <Section label="Tests & Quizzes">
          {dayTests.map((t) => {
            const cls = classById[t.classId];
            return (
              <ItemRow
                key={t.id}
                accent
                done={t.completed}
                onToggle={() => p.onToggleTest(t.id)}
                onDelete={() => p.onDeleteTest(t.id)}
                onEdit={() => p.onEditTest(t)}
                icon={<IconTarget className="w-4 h-4" />}
                title={t.title}
                meta={
                  <>
                    <span className="chip">{cls?.code ?? "—"}</span>
                    <span className="chip"><IconClock className="w-3 h-3" /> {t.studyHours}h study</span>
                    {t.topics.length > 0 && <span className="chip">{t.topics.length} topics</span>}
                  </>
                }
                notes={t.notes}
              />
            );
          })}
        </Section>
      )}

      {dayAsg.length > 0 && (
        <Section label="Assignments">
          {dayAsg.map((a) => {
            const cls = classById[a.classId];
            const tint = cls?.tint ?? 0;
            return (
              <ItemRow
                key={a.id}
                done={a.completed}
                onToggle={() => p.onToggleAsg(a.id)}
                onDelete={() => p.onDeleteAsg(a.id)}
                onEdit={() => p.onEditAsg(a)}
                icon={
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: `hsl(calc(var(--hue) + ${tint}) 80% 60%)`,
                      boxShadow: a.priority === "high" ? `0 0 8px hsl(calc(var(--hue) + ${tint}) 80% 60%)` : "none",
                    }}
                  />
                }
                title={a.title}
                meta={
                  <>
                    <span className="chip">{cls?.code ?? "—"}</span>
                    <span className="chip"><IconClock className="w-3 h-3" /> {a.estMinutes} min</span>
                    <PriorityChip priority={a.priority} />
                    {daysAway < 0 && !a.completed && (
                      <span className="chip chip-late">{-daysAway}d late</span>
                    )}
                  </>
                }
                notes={a.notes}
              />
            );
          })}
        </Section>
      )}

      {dayStudies.length > 0 && (
        <Section label="Study sessions">
          {dayStudies.map((s) => {
            const test = p.tests.find((t) => t.id === s.testId);
            const cls = test ? classById[test.classId] : null;
            return (
              <ItemRow
                key={s.id}
                muted
                done={s.done}
                onToggle={() => p.onToggleStudy(s.id)}
                icon={<IconBook className="w-4 h-4" />}
                title={s.focus}
                meta={
                  <>
                    <span className="chip">for {cls?.code ?? "test"}</span>
                    <span className="chip"><IconClock className="w-3 h-3" /> {s.minutes} min</span>
                  </>
                }
              />
            );
          })}
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "hsl(var(--ink-3))" }}>{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PriorityChip({ priority }: { priority: "low" | "med" | "high" }) {
  const label = priority === "high" ? "high" : priority === "med" ? "med" : "low";
  const c =
    priority === "high" ? "hsl(var(--accent))" :
    priority === "med" ? "hsl(var(--ink-2))" : "hsl(var(--ink-3))";
  return (
    <span className="chip" style={{ color: c, borderColor: priority === "high" ? "hsl(var(--accent) / 0.5)" : undefined }}>
      {priority === "high" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />}
      {label} priority
    </span>
  );
}

interface ItemRowProps {
  icon: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  notes?: string;
  done: boolean;
  accent?: boolean;
  muted?: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

function ItemRow({ icon, title, meta, notes, done, accent, muted, onToggle, onDelete, onEdit }: ItemRowProps) {
  return (
    <div
      className="group flex items-start gap-3 rounded-xl p-3 transition-all"
      style={{
        background: accent ? "hsl(var(--bg-2))" : "hsl(var(--bg-1))",
        border: `1px solid ${accent ? "hsl(var(--accent) / 0.35)" : "hsl(var(--line))"}`,
        opacity: done ? 0.55 : muted ? 0.85 : 1,
      }}
    >
      <button
        onClick={onToggle}
        className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
        style={{
          background: done ? "hsl(var(--accent))" : "transparent",
          border: `1.5px solid ${done ? "hsl(var(--accent))" : "hsl(var(--line))"}`,
          color: done ? "hsl(var(--hue) 30% 8%)" : "hsl(var(--ink-1))",
        }}
        title={done ? "Mark undone" : "Mark done"}
      >
        {done && <IconCheck className="w-3 h-3 animate-tick" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ color: accent ? "hsl(var(--accent))" : "hsl(var(--ink-2))" }}>{icon}</span>
          <div className="font-semibold text-sm truncate" style={{ textDecoration: done ? "line-through" : "none" }}>
            {title}
          </div>
        </div>
        {meta && <div className="flex flex-wrap gap-1.5 mt-2">{meta}</div>}
        {notes && <div className="text-xs mt-2" style={{ color: "hsl(var(--ink-3))" }}>{notes}</div>}
      </div>
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={onEdit}
            className="btn btn-ghost btn-icon"
            style={{ width: 30, height: 30 }}
            title="Edit"
          >
            <IconPen className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="btn btn-ghost btn-icon"
            style={{ width: 30, height: 30 }}
            title="Delete"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
