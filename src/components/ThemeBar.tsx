import { useEffect, useRef, useState } from "react";
import { THEMES } from "../lib/store";
import { IconSlider } from "./icons";

interface Props {
  hue: number;
  sat: number;
  themeName: string;
  onChange: (hue: number, sat: number, name: string) => void;
}

export function ThemeBar({ hue, sat, themeName, onChange }: Props) {
  const [wheelOpen, setWheelOpen] = useState(false);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!wheelOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wheelRef.current && !wheelRef.current.contains(e.target as Node)) {
        setWheelOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [wheelOpen]);

  const applyFromEvent = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    const dist = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2 - 8));
    const s = Math.max(0, Math.min(85, Math.round(dist * 85)));
    onChange(Math.round(deg), s, "Custom");
  };

  return (
    <div className="flex items-center gap-2 relative">
      {THEMES.map((t) => {
        const active = themeName === t.name;
        return (
          <button
            key={t.name}
            onClick={() => onChange(t.hue, t.sat, t.name)}
            title={t.name}
            className={`w-8 h-8 rounded-full border transition-all relative ${
              active ? "scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"
            }`}
            style={{
              background: `radial-gradient(circle at 30% 30%, hsl(${t.hue} ${Math.min(90, t.sat + 30)}% 60%), hsl(${t.hue} ${t.sat}% 30%))`,
              borderColor: active ? `hsl(${t.hue} 90% 75%)` : `hsl(${t.hue} 40% 25%)`,
              boxShadow: active
                ? `0 0 0 2px hsl(${t.hue} 90% 55% / 0.35), 0 0 20px hsl(${t.hue} 90% 55% / 0.55)`
                : "none",
            }}
          >
            {active && (
              <span className="absolute inset-0 rounded-full animate-pulse-glow pointer-events-none" />
            )}
          </button>
        );
      })}

      <div className="w-px h-6 mx-1" style={{ background: "hsl(var(--line))" }} />

      <button
        className="btn btn-ghost btn-icon"
        title="Custom color"
        onClick={() => setWheelOpen((v) => !v)}
        style={{
          background: `conic-gradient(from 0deg, hsl(0 80% 55%), hsl(60 80% 55%), hsl(120 80% 55%), hsl(180 80% 55%), hsl(240 80% 55%), hsl(300 80% 55%), hsl(360 80% 55%))`,
          borderColor: wheelOpen ? "hsl(var(--accent) / 0.7)" : undefined,
        }}
      >
        <IconSlider className="w-4 h-4" style={{ color: "hsl(var(--hue) 20% 10%)" }} />
      </button>

      {wheelOpen && (
        <div
          className="absolute right-0 top-12 z-30 glass rounded-2xl p-4 animate-float-in"
          style={{ width: 240 }}
        >
          <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "hsl(var(--ink-3))" }}>
            Drag to pick hue & saturation
          </div>
          <div
            ref={wheelRef}
            onMouseDown={(e) => { draggingRef.current = true; applyFromEvent(e.clientX, e.clientY); }}
            onMouseMove={(e) => { if (draggingRef.current) applyFromEvent(e.clientX, e.clientY); }}
            onMouseUp={() => { draggingRef.current = false; }}
            onMouseLeave={() => { draggingRef.current = false; }}
            className="relative mx-auto rounded-full cursor-crosshair select-none"
            style={{
              width: 200,
              height: 200,
              background: `radial-gradient(circle, hsl(${hue} 0% 25%) 0%, transparent 55%), conic-gradient(from 0deg, hsl(0 90% 55%), hsl(60 90% 55%), hsl(120 90% 55%), hsl(180 90% 55%), hsl(240 90% 55%), hsl(300 90% 55%), hsl(360 90% 55%))`,
              boxShadow: "inset 0 0 20px hsl(var(--hue) 40% 5% / 0.6), 0 10px 30px hsl(var(--hue) 90% 30% / 0.4)",
            }}
          >
            {/* current position marker */}
            {(() => {
              const rad = (hue * Math.PI) / 180;
              const r = (sat / 85) * 92;
              const x = 100 + Math.cos(rad) * r;
              const y = 100 + Math.sin(rad) * r;
              return (
                <div
                  className="absolute w-4 h-4 rounded-full border-2 pointer-events-none"
                  style={{
                    left: x - 8, top: y - 8,
                    background: `hsl(${hue} ${Math.min(90, sat + 20)}% 55%)`,
                    borderColor: "white",
                    boxShadow: "0 0 0 1px hsl(0 0% 0% / 0.6), 0 4px 12px hsl(0 0% 0% / 0.5)",
                  }}
                />
              );
            })()}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: "hsl(var(--ink-2))" }}>
            <span>H {hue}°</span>
            <span>S {sat}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
