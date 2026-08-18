import { useEffect, useRef, useState } from "react";
import type { Assignment, ClassItem, Priority, TestItem } from "../lib/types";
import { IconClose, IconPlus, IconTrash } from "./icons";

/* ------------------------------------------------------------------ */
/* Modal shell                                                          */
/* ------------------------------------------------------------------ */
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={ref}
          className="glass rounded-2xl w-full max-w-lg animate-float-in pointer-events-auto glow-accent overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "hsl(var(--line))" }}>
            <div className="font-display text-2xl" style={{ color: "hsl(var(--ink-1))" }}>{title}</div>
            <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ width: 32, height: 32 }}>
              <IconClose className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Assignment modal                                                    */
/* ------------------------------------------------------------------ */
export function AssignmentModal({
  classes, initialDate, onSave, onClose, initial,
}: {
  classes: ClassItem[];
  initialDate?: string;
  initial?: Assignment | null;
  onSave: (a: Omit<Assignment, "id" | "createdAt"> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [classId, setClassId] = useState(initial?.classId ?? classes[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? initialDate ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "med");
  const [estMinutes, setEstMinutes] = useState(initial?.estMinutes ?? 60);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  if (classes.length === 0) {
    return (
      <Modal title="Add an assignment" onClose={onClose}>
        <div className="text-sm mb-4" style={{ color: "hsl(var(--ink-2))" }}>
          You need a class first — assignments live inside classes.
        </div>
        <button className="btn btn-primary w-full" onClick={onClose}>Got it</button>
      </Modal>
    );
  }

  const canSave = title.trim().length > 0 && dueDate && classId;

  return (
    <Modal title={initial ? "Edit assignment" : "New assignment"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title">
          <input className="field" autoFocus placeholder="e.g. Problem set 3" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Class">
            <select className="field" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className="field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <div className="flex gap-1">
              {(["low", "med", "high"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="btn flex-1"
                  style={{
                    background: priority === p ? "hsl(var(--accent) / 0.15)" : "hsl(var(--bg-2))",
                    borderColor: priority === p ? "hsl(var(--accent))" : "hsl(var(--line))",
                    color: priority === p ? "hsl(var(--accent))" : "hsl(var(--ink-2))",
                    borderWidth: 1, borderStyle: "solid",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Estimated time — ${estMinutes} min`}>
            <input
              type="range" min={15} max={300} step={15}
              value={estMinutes}
              onChange={(e) => setEstMinutes(parseInt(e.target.value, 10))}
              className="w-full mt-2 accent-current"
              style={{ accentColor: "hsl(var(--accent))" }}
            />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <textarea className="field" rows={3} placeholder="chapters, page numbers, reminders…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="flex gap-2 pt-2">
          <button className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary flex-1"
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.5, pointerEvents: canSave ? "auto" : "none" }}
            onClick={() =>
              onSave({
                id: initial?.id,
                classId, title: title.trim(), dueDate,
                priority, estMinutes,
                notes: notes.trim() || undefined,
                completed: initial?.completed ?? false,
              })
            }
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Test modal                                                          */
/* ------------------------------------------------------------------ */
export function TestModal({
  classes, initialDate, onSave, onClose, initial,
}: {
  classes: ClassItem[];
  initialDate?: string;
  initial?: TestItem | null;
  onSave: (t: Omit<TestItem, "id" | "createdAt"> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [classId, setClassId] = useState(initial?.classId ?? classes[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "Midterm");
  const [date, setDate] = useState(initial?.date ?? initialDate ?? "");
  const [studyHours, setStudyHours] = useState(initial?.studyHours ?? 6);
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState<string[]>(initial?.topics ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  if (classes.length === 0) {
    return (
      <Modal title="Add a test" onClose={onClose}>
        <div className="text-sm mb-4" style={{ color: "hsl(var(--ink-2))" }}>
          You need a class first — tests belong to a class.
        </div>
        <button className="btn btn-primary w-full" onClick={onClose}>Got it</button>
      </Modal>
    );
  }

  const canSave = title.trim().length > 0 && date && classId;
  const addTopic = () => {
    const v = topicInput.trim();
    if (!v) return;
    setTopics([...topics, v]);
    setTopicInput("");
  };

  return (
    <Modal title={initial ? "Edit test" : "New test / quiz"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title">
          <input className="field" autoFocus placeholder="e.g. Midterm 1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Class">
            <select className="field" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label={`Total study time — ${studyHours}h`}>
          <input
            type="range" min={1} max={20}
            value={studyHours}
            onChange={(e) => setStudyHours(parseInt(e.target.value, 10))}
            className="w-full mt-2"
            style={{ accentColor: "hsl(var(--accent))" }}
          />
          <div className="text-[11px] mt-1" style={{ color: "hsl(var(--ink-3))" }}>
            Study sessions will be scheduled automatically at 7, 5, 3, and 1 days before, split by weight.
          </div>
        </Field>
        <Field label="Topics">
          <div className="flex gap-2">
            <input
              className="field" placeholder="e.g. Ch 4: bonding"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } }}
            />
            <button className="btn btn-ghost btn-icon" onClick={addTopic}><IconPlus className="w-4 h-4" /></button>
          </div>
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {topics.map((t, i) => (
                <span key={i} className="chip pr-1">
                  {t}
                  <button
                    onClick={() => setTopics(topics.filter((_, j) => j !== i))}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/20"
                  >
                    <IconClose className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Field>
        <Field label="Notes (optional)">
          <textarea className="field" rows={2} placeholder="format, location, what's covered…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="flex gap-2 pt-2">
          <button className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary flex-1"
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.5, pointerEvents: canSave ? "auto" : "none" }}
            onClick={() =>
              onSave({
                id: initial?.id,
                classId, title: title.trim(), date,
                studyHours, topics,
                notes: notes.trim() || undefined,
                completed: initial?.completed ?? false,
              })
            }
          >
            Save & schedule sessions
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Classes modal                                                       */
/* ------------------------------------------------------------------ */
export function ClassesModal({
  classes, onSave, onDelete, onClose,
}: {
  classes: ClassItem[];
  onSave: (c: Omit<ClassItem, "id" | "createdAt"> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [tint, setTint] = useState(0);

  const submit = () => {
    if (!name.trim() || !code.trim()) return;
    onSave({ name: name.trim(), code: code.trim(), tint });
    setName(""); setCode(""); setTint((tint + 45) % 360);
  };

  return (
    <Modal title="Your classes" onClose={onClose}>
      <div className="space-y-2 mb-5">
        {classes.length === 0 && (
          <div className="text-sm" style={{ color: "hsl(var(--ink-3))" }}>No classes yet — add one below.</div>
        )}
        {classes.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl group" style={{ background: "hsl(var(--bg-2))", border: "1px solid hsl(var(--line))" }}>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: `hsl(calc(var(--hue) + ${c.tint}) 80% 60%)`, boxShadow: `0 0 8px hsl(calc(var(--hue) + ${c.tint}) 80% 60%)` }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{c.code}</div>
              <div className="text-xs truncate" style={{ color: "hsl(var(--ink-3))" }}>{c.name}</div>
            </div>
            <button
              onClick={() => onDelete(c.id)}
              className="btn btn-ghost btn-icon opacity-0 group-hover:opacity-100"
              style={{ width: 30, height: 30 }}
              title="Delete class (and its items)"
            >
              <IconTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-4" style={{ borderColor: "hsl(var(--line))" }}>
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "hsl(var(--ink-3))" }}>Add class</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <input className="field" placeholder="Code (CHEM 121)" value={code} onChange={(e) => setCode(e.target.value)} />
          <input className="field col-span-2" placeholder="Name (Organic Chemistry)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </div>
        <div className="mb-3">
          <div className="text-[11px] mb-1.5" style={{ color: "hsl(var(--ink-3))" }}>Tint (subtle hue shift within your theme)</div>
          <input
            type="range" min={-90} max={90}
            value={tint}
            onChange={(e) => setTint(parseInt(e.target.value, 10))}
            className="w-full"
            style={{ accentColor: `hsl(calc(var(--hue) + ${tint}) 80% 60%)` }}
          />
          <div className="mt-1.5 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{ background: `hsl(calc(var(--hue) + ${tint}) 80% 60%)`, boxShadow: `0 0 10px hsl(calc(var(--hue) + ${tint}) 80% 60%)` }} />
            <span className="text-[11px]" style={{ color: "hsl(var(--ink-3))" }}>preview</span>
          </div>
        </div>
        <button className="btn btn-primary w-full" onClick={submit} disabled={!name.trim() || !code.trim()}>
          <IconPlus className="w-4 h-4" /> Add class
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.25em] mb-1.5" style={{ color: "hsl(var(--ink-3))" }}>{label}</div>
      {children}
    </label>
  );
}
