"use client";

import { useCallback, useEffect, useState } from "react";
import { Radius, Link, Unlink } from "lucide-react";
import { toast } from "sonner";

interface ObjectCornerRadiusPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface CornerValues {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

const PRESETS: { label: string; tl: number; tr: number; br: number; bl: number }[] = [
  { label: "Quadrado", tl: 0, tr: 0, br: 0, bl: 0 },
  { label: "Suave", tl: 8, tr: 8, br: 8, bl: 8 },
  { label: "Arredondado", tl: 20, tr: 20, br: 20, bl: 20 },
  { label: "Pill", tl: 999, tr: 999, br: 999, bl: 999 },
  { label: "Tab ↑", tl: 16, tr: 16, br: 0, bl: 0 },
  { label: "Tab ↓", tl: 0, tr: 0, br: 16, bl: 16 },
  { label: "Seta →", tl: 0, tr: 999, br: 999, bl: 0 },
  { label: "Canto", tl: 0, tr: 0, br: 20, bl: 0 },
];

export function ObjectCornerRadiusPanel({ fabricCanvas, selectionVersion }: ObjectCornerRadiusPanelProps) {
  const [hasRect, setHasRect] = useState(false);
  const [linked, setLinked] = useState(true);
  const [corners, setCorners] = useState<CornerValues>({ tl: 0, tr: 0, br: 0, bl: 0 });

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isRect = obj?.type === "rect";
      setHasRect(isRect);
      if (isRect) {
        const rx = obj.rx ?? 0;
        const ry = obj.ry ?? 0;
        const r = Math.max(rx, ry);
        setCorners({ tl: r, tr: r, br: r, bl: r });
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getRect = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj?.type === "rect" ? obj : null;
  }, [fabricCanvas]);

  const applyCorners = useCallback((vals: CornerValues) => {
    const obj = getRect();
    if (!obj) return;
    const avg = (vals.tl + vals.tr + vals.br + vals.bl) / 4;
    obj.set({ rx: avg, ry: avg });
    fabricCanvas.requestRenderAll();
  }, [getRect, fabricCanvas]);

  const updateCorner = useCallback((key: keyof CornerValues, val: number) => {
    const clamped = Math.max(0, Math.min(999, val));
    if (linked) {
      const all = { tl: clamped, tr: clamped, br: clamped, bl: clamped };
      setCorners(all);
      applyCorners(all);
    } else {
      const updated = { ...corners, [key]: clamped };
      setCorners(updated);
      applyCorners(updated);
    }
  }, [linked, corners, applyCorners]);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    const obj = getRect();
    if (!obj) { toast.error("Selecione um retângulo"); return; }
    const vals = { tl: preset.tl, tr: preset.tr, br: preset.br, bl: preset.bl };
    setCorners(vals);
    const avg = (vals.tl + vals.tr + vals.br + vals.bl) / 4;
    obj.set({ rx: Math.min(avg, (obj.width ?? 100) / 2), ry: Math.min(avg, (obj.height ?? 100) / 2) });
    fabricCanvas.requestRenderAll();
    toast.success(`Preset "${preset.label}" aplicado`);
  }, [getRect, fabricCanvas]);

  const CORNER_LABELS: { key: keyof CornerValues; label: string }[] = [
    { key: "tl", label: "↖ Sup. Esq." },
    { key: "tr", label: "↗ Sup. Dir." },
    { key: "bl", label: "↙ Inf. Esq." },
    { key: "br", label: "↘ Inf. Dir." },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Radius className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Raio dos Cantos</span>
      </div>

      {!hasRect ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Radius className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um retângulo para ajustar os cantos</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-4 gap-1">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className="py-1.5 rounded border border-border text-[8px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Link toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cantos individuais</span>
            <button
              onClick={() => setLinked(v => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-[9px] transition-colors ${linked ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {linked ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
              {linked ? "Vinculado" : "Separado"}
            </button>
          </div>

          {/* Corner inputs */}
          <div className="grid grid-cols-2 gap-2">
            {CORNER_LABELS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-[8px] text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={1}
                    value={corners[key]}
                    onChange={e => updateCorner(key, Number(e.target.value))}
                    className="flex-1 accent-primary h-1"
                  />
                  <input
                    type="number"
                    min={0}
                    max={999}
                    step={1}
                    value={corners[key]}
                    onChange={e => updateCorner(key, Number(e.target.value))}
                    className="w-10 bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary text-center"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            tl:{corners.tl} tr:{corners.tr} br:{corners.br} bl:{corners.bl}
          </p>
        </>
      )}
    </div>
  );
}
