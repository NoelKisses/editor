"use client";

import { useCallback, useEffect, useState } from "react";
import { Feather, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectFeatherPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const FEATHER_TAG = "__feather__";

export function ObjectFeatherPanel({ fabricCanvas, selectionVersion }: ObjectFeatherPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [hasEffect, setHasEffect] = useState(false);
  const [radius, setRadius] = useState(20);
  const [strength, setStrength] = useState(80);
  const [shape, setShape] = useState<"ellipse" | "rect">("ellipse");

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj);
      if (obj) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = (obj.filters ?? []).find((f: any) => f[FEATHER_TAG]);
        setHasEffect(!!existing);
        if (existing) {
          setRadius(existing._featherRadius ?? 20);
          setStrength(existing._featherStrength ?? 80);
        }
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    return fabricCanvas.getActiveObject() ?? null;
  }, [fabricCanvas]);

  const applyFeather = useCallback(() => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (obj.filters ?? []).filter((fl: any) => !fl[FEATHER_TAG]);

      const capturedRadius = radius;
      const capturedStrength = strength;
      const capturedShape = shape;

      const filter = new f.Image.filters.ColorMatrix({
        matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      });
      filter[FEATHER_TAG] = true;
      filter._featherRadius = capturedRadius;
      filter._featherStrength = capturedStrength;

      filter.applyTo2d = (options: { imageData: ImageData }) => {
        const { imageData } = options;
        const d = imageData.data;
        const w = imageData.width;
        const h = imageData.height;
        const cx = w / 2;
        const cy = h / 2;
        const a = cx;
        const b = cy;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (d[idx + 3] === 0) continue;

            let dist = 0;
            if (capturedShape === "ellipse") {
              const dx = (x - cx) / a;
              const dy = (y - cy) / b;
              dist = Math.sqrt(dx * dx + dy * dy);
            } else {
              const dx = Math.max(0, Math.abs(x - cx) - (a - capturedRadius));
              const dy = Math.max(0, Math.abs(y - cy) - (b - capturedRadius));
              dist = Math.sqrt(dx * dx + dy * dy) / capturedRadius;
            }

            const featherStart = 1 - capturedRadius / Math.max(a, b);
            if (dist > featherStart) {
              const t = (dist - featherStart) / (1 - featherStart);
              const alpha = 1 - Math.pow(t, 1.5) * (capturedStrength / 100);
              d[idx + 3] = Math.round(d[idx + 3] * Math.max(0, alpha));
            }
          }
        }
      };

      obj.filters = [...base, filter];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success("Desfoque de bordas (feather) aplicado");
    });
  }, [getObject, radius, strength, shape, fabricCanvas]);

  const removeFeather = useCallback(() => {
    const obj = getObject();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.filters = (obj.filters ?? []).filter((f: any) => !f[FEATHER_TAG]);
    obj.applyFilters();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    toast.success("Feather removido");
  }, [getObject, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Feather className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Desfoque de Bordas (Feather)</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Feather className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para aplicar feather</p>
        </div>
      ) : (
        <>
          {/* Shape */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Forma do feather</span>
            <div className="grid grid-cols-2 gap-1">
              {(["ellipse", "rect"] as const).map(s => (
                <button key={s} onClick={() => setShape(s)}
                  className={`py-1 rounded border text-[8px] transition-colors ${shape === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {s === "ellipse" ? "Elipse (oval)" : "Retangular"}
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Raio do feather</span>
              <span className="text-[9px] tabular-nums">{radius}%</span>
            </div>
            <input type="range" min={5} max={80} step={5} value={radius}
              onChange={e => setRadius(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Strength */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Intensidade</span>
              <span className="text-[9px] tabular-nums">{strength}%</span>
            </div>
            <input type="range" min={10} max={100} step={5} value={strength}
              onChange={e => setStrength(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Preview band */}
          <div className="h-8 rounded border border-border overflow-hidden"
            style={{
              background: `radial-gradient(${shape === "ellipse" ? "ellipse" : "circle"} at center, #6366f1 40%, transparent 100%)`,
              opacity: strength / 100,
            }} />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeFeather}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyFeather}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <Feather className="w-3 h-3" /> Aplicar Feather
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Transparência gradual nas bordas via canal alfa
          </p>
        </>
      )}
    </div>
  );
}
