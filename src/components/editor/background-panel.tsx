"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { toast } from "sonner";

interface BackgroundPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BgMode = "solid" | "linear" | "radial";

const GRADIENT_PRESETS = [
  { label: "Pôr do Sol", colors: ["#f97316", "#ec4899"] },
  { label: "Oceano", colors: ["#0ea5e9", "#6366f1"] },
  { label: "Floresta", colors: ["#22c55e", "#06b6d4"] },
  { label: "Noite", colors: ["#1e1b4b", "#312e81"] },
  { label: "Fogo", colors: ["#ef4444", "#f97316"] },
  { label: "Aurora", colors: ["#8b5cf6", "#06b6d4"] },
  { label: "Rosa", colors: ["#ec4899", "#f43f5e"] },
  { label: "Ouro", colors: ["#f59e0b", "#fbbf24"] },
];

const SOLID_PRESETS = [
  "#000000", "#1a1a2e", "#16213e", "#0f3460",
  "#ffffff", "#f8fafc", "#1e293b", "#0f172a",
  "#7c3aed", "#2563eb", "#059669", "#dc2626",
  "#d97706", "#0891b2", "#db2777", "#65a30d",
];

export function BackgroundPanel({ fabricCanvas }: BackgroundPanelProps) {
  const { template } = useEditorStore();
  const [mode, setMode] = useState<BgMode>("solid");
  const [solidColor, setSolidColor] = useState(template?.backgroundColor ?? "#1a1a2e");
  const [gradColor1, setGradColor1] = useState("#6366f1");
  const [gradColor2, setGradColor2] = useState("#ec4899");
  const [gradAngle, setGradAngle] = useState(135);

  const applySolid = useCallback(
    (color: string) => {
      if (!fabricCanvas) return;
      fabricCanvas.setBackgroundColor(color, () => fabricCanvas.requestRenderAll());
      setSolidColor(color);
      toast.success("Fundo aplicado");
    },
    [fabricCanvas]
  );

  const applyLinearGradient = useCallback(
    (c1: string, c2: string, angle: number) => {
      if (!fabricCanvas) return;
      const w: number = fabricCanvas.getWidth();
      const h: number = fabricCanvas.getHeight();
      const rad = (angle * Math.PI) / 180;
      const x1 = 0.5 - 0.5 * Math.cos(rad);
      const y1 = 0.5 - 0.5 * Math.sin(rad);
      const x2 = 0.5 + 0.5 * Math.cos(rad);
      const y2 = 0.5 + 0.5 * Math.sin(rad);

      import("fabric").then(({ fabric }) => {
        const gradient = new fabric.Gradient({
          type: "linear",
          coords: { x1: x1 * w, y1: y1 * h, x2: x2 * w, y2: y2 * h },
          colorStops: [
            { offset: 0, color: c1 },
            { offset: 1, color: c2 },
          ],
        });
        fabricCanvas.setBackgroundColor(gradient, () => fabricCanvas.requestRenderAll());
        toast.success("Gradiente aplicado");
      });
    },
    [fabricCanvas]
  );

  const applyRadialGradient = useCallback(
    (c1: string, c2: string) => {
      if (!fabricCanvas) return;
      const w: number = fabricCanvas.getWidth();
      const h: number = fabricCanvas.getHeight();
      const cx = w / 2, cy = h / 2;
      const r = Math.sqrt(cx * cx + cy * cy);

      import("fabric").then(({ fabric }) => {
        const gradient = new fabric.Gradient({
          type: "radial",
          coords: { x1: cx, y1: cy, r1: 0, x2: cx, y2: cy, r2: r },
          colorStops: [
            { offset: 0, color: c1 },
            { offset: 1, color: c2 },
          ],
        });
        fabricCanvas.setBackgroundColor(gradient, () => fabricCanvas.requestRenderAll());
        toast.success("Gradiente radial aplicado");
      });
    },
    [fabricCanvas]
  );

  const handleApply = () => {
    if (mode === "solid") applySolid(solidColor);
    else if (mode === "linear") applyLinearGradient(gradColor1, gradColor2, gradAngle);
    else applyRadialGradient(gradColor1, gradColor2);
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      <h3 className="text-sm font-semibold text-foreground">Fundo</h3>

      {/* Mode tabs */}
      <div className="flex rounded-md overflow-hidden border border-border">
        {(["solid", "linear", "radial"] as BgMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 text-xs py-1.5 transition-colors ${
              mode === m ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            {m === "solid" ? "Sólido" : m === "linear" ? "Linear" : "Radial"}
          </button>
        ))}
      </div>

      {/* Solid */}
      {mode === "solid" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0"
            />
            <input
              type="text"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
            />
          </div>
          <div className="grid grid-cols-8 gap-1">
            {SOLID_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => { setSolidColor(c); applySolid(c); }}
                className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Linear / Radial */}
      {(mode === "linear" || mode === "radial") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground">Cor 1</span>
              <div className="flex items-center gap-1.5">
                <input type="color" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0" />
                <input type="text" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)}
                  className="flex-1 text-[10px] bg-background border border-border rounded px-1.5 py-1 text-foreground" />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground">Cor 2</span>
              <div className="flex items-center gap-1.5">
                <input type="color" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0" />
                <input type="text" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)}
                  className="flex-1 text-[10px] bg-background border border-border rounded px-1.5 py-1 text-foreground" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div
            className="w-full h-10 rounded border border-border"
            style={{
              background:
                mode === "radial"
                  ? `radial-gradient(circle, ${gradColor1}, ${gradColor2})`
                  : `linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2})`,
            }}
          />

          {mode === "linear" && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">Ângulo</span>
                <span className="text-[10px] tabular-nums">{gradAngle}°</span>
              </div>
              <input
                type="range"
                min={0} max={360} step={15}
                value={gradAngle}
                onChange={(e) => setGradAngle(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          {/* Gradient presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {GRADIENT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setGradColor1(p.colors[0]);
                  setGradColor2(p.colors[1]);
                  if (mode === "linear") applyLinearGradient(p.colors[0], p.colors[1], gradAngle);
                  else applyRadialGradient(p.colors[0], p.colors[1]);
                }}
                className="flex flex-col items-center gap-0.5"
                title={p.label}
              >
                <div
                  className="w-full h-8 rounded border border-border/50 hover:scale-105 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})` }}
                />
                <span className="text-[9px] text-muted-foreground">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button size="sm" onClick={handleApply} disabled={!fabricCanvas} className="w-full">
        Aplicar Fundo
      </Button>
    </div>
  );
}
