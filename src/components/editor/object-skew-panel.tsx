"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoveHorizontal, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectSkewPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface SkewConfig {
  skewX: number;
  skewY: number;
}

const SKEW_PRESETS: { label: string; skewX: number; skewY: number }[] = [
  { label: "Nenhum", skewX: 0, skewY: 0 },
  { label: "Itálico leve", skewX: -10, skewY: 0 },
  { label: "Itálico forte", skewX: -20, skewY: 0 },
  { label: "Inclinado direita", skewX: 10, skewY: 0 },
  { label: "Perspectiva sup.", skewX: 0, skewY: -10 },
  { label: "Perspectiva inf.", skewX: 0, skewY: 10 },
  { label: "Diagonal 3D", skewX: -15, skewY: -8 },
  { label: "Espelho oblíquo", skewX: 20, skewY: 10 },
];

export function ObjectSkewPanel({ fabricCanvas, selectionVersion }: ObjectSkewPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [config, setConfig] = useState<SkewConfig>({ skewX: 0, skewY: 0 });
  const canvasRef = useRef<unknown>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setHasObject(false); return; }
      setHasObject(true);
      setConfig({
        skewX: Math.round(obj.skewX ?? 0),
        skewY: Math.round(obj.skewY ?? 0),
      });
    });
  }, [fabricCanvas, selectionVersion]);

  const applySkew = useCallback((skewX: number, skewY: number) => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    obj.set({ skewX, skewY });
    obj.setCoords?.();
    cv.requestRenderAll();
    setConfig({ skewX, skewY });
  }, []);

  const handleSlider = useCallback((axis: "skewX" | "skewY", value: number) => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) return;
    obj.set({ [axis]: value });
    obj.setCoords?.();
    cv.requestRenderAll();
    setConfig((prev) => ({ ...prev, [axis]: value }));
  }, []);

  const reset = useCallback(() => {
    applySkew(0, 0);
    toast.success("Distorção removida");
  }, [applySkew]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <MoveHorizontal className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Distorção (Skew)</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <MoveHorizontal className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto no canvas</p>
        </div>
      ) : (
        <>
          {/* Live preview indicator */}
          <div className="flex items-center justify-center p-3 rounded border border-border bg-muted/10">
            <div
              className="w-16 h-10 rounded bg-primary/30 border border-primary/50"
              style={{
                transform: `skewX(${config.skewX}deg) skewY(${config.skewY}deg)`,
              }}
            />
          </div>

          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Presets</span>
            <div className="grid grid-cols-2 gap-1">
              {SKEW_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applySkew(p.skewX, p.skewY)}
                  className={`py-1 rounded border text-[7px] transition-colors ${
                    config.skewX === p.skewX && config.skewY === p.skewY
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skew X slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Skew X (horizontal)</span>
              <span className="text-[8px] font-mono">{config.skewX}°</span>
            </div>
            <input
              type="range" min={-60} max={60} step={1} value={config.skewX}
              onChange={(e) => handleSlider("skewX", Number(e.target.value))}
              className="w-full h-1 accent-primary"
            />
            <div className="flex justify-between">
              <span className="text-[7px] text-muted-foreground">-60°</span>
              <button onClick={() => handleSlider("skewX", 0)}
                className="text-[7px] text-muted-foreground hover:text-primary">0</button>
              <span className="text-[7px] text-muted-foreground">+60°</span>
            </div>
          </div>

          {/* Skew Y slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Skew Y (vertical)</span>
              <span className="text-[8px] font-mono">{config.skewY}°</span>
            </div>
            <input
              type="range" min={-60} max={60} step={1} value={config.skewY}
              onChange={(e) => handleSlider("skewY", Number(e.target.value))}
              className="w-full h-1 accent-primary"
            />
            <div className="flex justify-between">
              <span className="text-[7px] text-muted-foreground">-60°</span>
              <button onClick={() => handleSlider("skewY", 0)}
                className="text-[7px] text-muted-foreground hover:text-primary">0</button>
              <span className="text-[7px] text-muted-foreground">+60°</span>
            </div>
          </div>

          {/* Numeric inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[7px] text-muted-foreground">Skew X exato</span>
              <input type="number" min={-60} max={60} value={config.skewX}
                onChange={(e) => handleSlider("skewX", Number(e.target.value))}
                className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[7px] text-muted-foreground">Skew Y exato</span>
              <input type="number" min={-60} max={60} value={config.skewY}
                onChange={(e) => handleSlider("skewY", Number(e.target.value))}
                className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
            </div>
          </div>

          <button onClick={reset}
            className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
            <RotateCcw className="w-3 h-3" /> Remover distorção
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Fabric.js suporta skewX e skewY nativos · em graus
          </p>
        </>
      )}
    </div>
  );
}
