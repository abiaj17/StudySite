import { useMemo, useState } from "react";
import type { ClassItem } from "../lib/types";
import {
  AP_CLASSES, SORT_MODES, SUBJECT_TINT, groupClasses,
  type PresetClass, type SortMode,
} from "../lib/apClasses";
import { IconCheck, IconPlus, IconClose } from "./icons";

interface Props {
  existing: ClassItem[];
  onAdd: (preset: PresetClass) => void;
}

export function ClassPicker({ existing, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SortMode>("subject");

  const addedCodes = useMemo(
    () => new Set(existing.map((c) => c.code.toLowerCase())),
    [existing],
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? AP_CLASSES.filter((c) =>
          `${c.code} ${c.name} ${c.subject}`.toLowerCase().includes(q))
      : AP_CLASSES;
    return groupClasses(filtered, mode);
  }, [query, mode]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "hsl(var(--ink-3))" }}>
          Leander ISD AP catalog
        </div>
        <div className="text-[11px]" style={{ color: "hsl(var(--ink-3))" }}>
          {total} {total === 1 ? "course" : "courses"}
        </div>
      </div>

      <div className="relative mb-2">
        <input
          className="field"
          placeholder="Search — calc, bio, apush, spanish…"
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

      <div className="seg mb-3 w-full" style={{ display: "flex" }}>
        {SORT_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`seg-btn flex-1 ${mode === m.id ? "is-active" : ""}`}
            style={{ textTransform: "none", fontSize: 12, padding: "6px 4px" }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div
        className="max-h-[280px] overflow-y-auto rounded-xl p-2"
        style={{ background: "hsl(var(--bg-0) / 0.5)", border: "1px solid hsl(var(--line-soft))" }}
      >
        {total === 0 && (
          <div className="text-sm text-center py-8" style={{ color: "hsl(var(--ink-3))" }}>
            No AP course matches “{query}”. Type it in by hand below.
          </div>
        )}

        {groups.map((g) => (
          <div key={g.label} className="mb-3 last:mb-0">
            <div
              className="text-[10px] uppercase tracking-[0.25em] px-1 pb-1.5"
              style={{ color: "hsl(var(--ink-3))" }}
            >
              {g.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((c) => {
                const added = addedCodes.has(c.code.toLowerCase());
                const tint = SUBJECT_TINT[c.subject];
                return (
                  <button
                    key={c.code}
                    onClick={() => !added && onAdd(c)}
                    disabled={added}
                    title={added ? `${c.name} — already added` : `Add ${c.name}`}
                    className="preset-pill"
                    style={{
                      borderColor: added ? "hsl(var(--accent) / 0.5)" : undefined,
                      opacity: added ? 0.55 : 1,
                      cursor: added ? "default" : "pointer",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: `hsl(calc(var(--hue) + ${tint}) 80% 60%)` }}
                    />
                    <span className="font-semibold">{c.code}</span>
                    <span style={{ color: "hsl(var(--ink-3))" }}>{c.name}</span>
                    {added
                      ? <IconCheck className="w-3 h-3 shrink-0" style={{ color: "hsl(var(--accent))" }} />
                      : <IconPlus className="w-3 h-3 shrink-0" style={{ color: "hsl(var(--ink-3))" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
