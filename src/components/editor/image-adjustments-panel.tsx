"use client";

import { useCallback, useEffect, useState } from "react";
import { Sliders } from "lucide-react";
import { toast } from "sonner";

interface ImageAdjustmentsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface Adjustments {
  brightness: number;   // -1 to 1
  contrast: number;     // -1 to 1
  saturation: number;   // -1 to 1
  hue: number;          // -1 to 1
  blur: number;         // 0 to 1
  sharpen: number;      // 0 to 1
  noise: number;        // 0 to 400
  vibrance: number;     // -1 to 1
  gamma: number;        // 0.1 to 3
  pixelate: number;     // 2 to 50
}

const DEFAULTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  blur: 0,
  sharpen: 0,
  noise: 0,
  vibrance: 0,
  gamma: 1,
  pixelate: 2,
};

type AdjKey = keyof Adjustments;

const SLIDERS: { key: AdjKey; label: string; min: number; max: number; step: number; default: number }[] = [
  { key: "brightness", label: "Brilho", min: -1, max: 1, step: 0.01, default: 0 },
  { key: "contrast", label: "Contraste", min: -1, max: 1, step: 0.01, default: 0 },
  { key: "saturation", label: "Saturação", min: -1, max: 1, step: 0.01, default: 0 },
  { key: "hue", label: "Matiz", min: -1, max: 1, step: 0.01, default: 0 },
  { key: "vibrance", label: "Vibração", min: -1, max: 1, step: 0.01, default: 0 },
  { key: "blur", label: "Desfoque", min: 0, max: 1, step: 0.01, default: 0 },
  { key: "sharpen", label: "Nitidez", min: 0, max: 1, step: 0.01, default: 0 },
  { key: "noise", label: "Ruído/Grão", min: 0, max: 400, step: 1, default: 0 },
  { key: "gamma", label: "Gama", min: 0.1, max: 3, step: 0.05, default: 1 },
  { key: "pixelate", label: "Pixelar", min: 2, max: 50, step: 1, default: 2 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFilters(adj: Adjustments, fabric: any) {
  const filters = [];

  if (adj.brightness !== 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(new (fabric.Image.filters as any).Brightness({ brightness: adj.brightness }));

  if (adj.contrast !== 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(new (fabric.Image.filters as any).Contrast({ contrast: adj.contrast }));

  if (adj.saturation !== 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(new (fabric.Image.filters as any).Saturation({ saturation: adj.saturation }));

  if (adj.hue !== 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(new (fabric.Image.filters as any).HueRotation({ rotation: adj.hue }));

  if (adj.vibrance !== 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(new (fabric.Image.filters as any).Vibrance({ vibrance: adj.vibrance }));

  if (adj.blur > 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(new (fabric.Image.filters as any).Blur({ blur: adj.blur }));

  if (adj.noise > 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(new (fabric.Image.filters as any).Noise({ noise: adj.noise }));

  if (adj.gamma !== 1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(new (fabric.Image.filters as any).Gamma({ gamma: [adj.gamma, adj.gamma, adj.gamma] }));

  if (adj.pixelate > 2)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters.push(new (fabric.Image.filters as any).Pixelate({ blocksize: Math.round(adj.pixelate) }));

  return filters;
}

export function ImageAdjustmentsPanel({ fabricCanvas, selectionVersion }: ImageAdjustmentsPanelProps) {
  const [adj, setAdj] = useState<Adjustments>({ ...DEFAULTS });
  const [isImage, setIsImage] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    const imgType = obj?.type === "image";
    const stored = imgType ? (obj.data?.adjustments as Adjustments | undefined) : undefined;
    queueMicrotask(() => {
      setIsImage(imgType);
      if (imgType) setAdj(stored ?? { ...DEFAULTS });
    });
  }, [fabricCanvas, selectionVersion]);

  const applyAdjustments = useCallback(async (newAdj: Adjustments) => {
    if (!fabricCanvas || applying) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj || obj.type !== "image") return;

    setApplying(true);
    try {
      const { fabric } = await import("fabric").then((m) => m);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const img = obj as any;
      img.filters = buildFilters(newAdj, fabric);
      img.applyFilters();
      // Store adjustments in object data
      img.data = { ...(img.data ?? {}), adjustments: newAdj };
      fabricCanvas.requestRenderAll();
    } finally {
      setApplying(false);
    }
  }, [fabricCanvas, applying]);

  const handleSlider = useCallback((key: AdjKey, value: number) => {
    const newAdj = { ...adj, [key]: value };
    setAdj(newAdj);
    applyAdjustments(newAdj);
  }, [adj, applyAdjustments]);

  const handleReset = useCallback(async () => {
    const newAdj = { ...DEFAULTS };
    setAdj(newAdj);
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj || obj.type !== "image") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img = obj as any;
    img.filters = [];
    img.applyFilters();
    img.data = { ...(img.data ?? {}), adjustments: newAdj };
    fabricCanvas.requestRenderAll();
    toast.success("Ajustes resetados");
  }, [fabricCanvas]);

  const handleAutoEnhance = useCallback(() => {
    const newAdj: Adjustments = {
      ...DEFAULTS,
      brightness: 0.05,
      contrast: 0.1,
      saturation: 0.15,
      vibrance: 0.2,
    };
    setAdj(newAdj);
    applyAdjustments(newAdj);
    toast.success("Auto-aprimoramento aplicado");
  }, [applyAdjustments]);

  if (!isImage) {
    return (
      <div className="flex flex-col gap-3 p-4 items-center justify-center text-center">
        <Sliders className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground">Selecione uma imagem no canvas para ajustar brilho, contraste, saturação e mais</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Ajustes de Imagem</span>
        </div>
        {applying && <span className="text-[9px] text-muted-foreground animate-pulse">Aplicando...</span>}
      </div>

      {/* Auto enhance + Reset */}
      <div className="flex gap-2">
        <button
          onClick={handleAutoEnhance}
          className="flex-1 text-[10px] py-1.5 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-medium"
        >
          ✨ Auto-aprimorar
        </button>
        <button
          onClick={handleReset}
          className="flex-1 text-[10px] py-1.5 rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
        >
          Resetar tudo
        </button>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-3">
        {SLIDERS.map((s) => {
          const val = adj[s.key];
          const pct = s.key === "gamma"
            ? Math.round((val - 0.1) / (3 - 0.1) * 100)
            : s.key === "pixelate"
            ? Math.round((val - 2) / (50 - 2) * 100)
            : s.key === "noise"
            ? Math.round(val / 400 * 100)
            : Math.round((val + 1) / 2 * 100);

          const displayVal = s.key === "gamma"
            ? val.toFixed(2)
            : s.key === "noise" || s.key === "pixelate"
            ? Math.round(val).toString()
            : (val >= 0 ? "+" : "") + Math.round(val * 100);

          const isActive = s.key === "gamma" ? val !== 1 : s.key === "pixelate" ? val > 2 : val !== 0;

          return (
            <div key={s.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] tabular-nums w-8 text-right ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {displayVal}
                  </span>
                  {isActive && (
                    <button
                      onClick={() => handleSlider(s.key, s.default)}
                      className="text-[8px] text-muted-foreground hover:text-primary"
                      title="Reset"
                    >
                      ↺
                    </button>
                  )}
                </div>
              </div>
              <div className="relative h-1.5 bg-muted/40 rounded-full">
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-primary/30"
                  style={{ width: `${pct}%` }}
                />
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={val}
                  onChange={(e) => handleSlider(s.key, Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 ${isActive ? "border-primary bg-primary/20" : "border-muted-foreground/40 bg-background"} -translate-x-1/2 pointer-events-none`}
                  style={{ left: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[8px] text-muted-foreground text-center">
        Ajustes aplicados em tempo real via filtros WebGL
      </p>
    </div>
  );
}
