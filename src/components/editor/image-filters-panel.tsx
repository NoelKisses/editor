"use client";

import { useCallback, useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface ImageFiltersPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const PRESETS = [
  { id: "none",    label: "Original",  filters: {} },
  { id: "vivid",   label: "Vivido",    filters: { Saturation: { saturation: 0.6 }, Brightness: { brightness: 0.05 }, Contrast: { contrast: 0.1 } } },
  { id: "matte",   label: "Matte",     filters: { Brightness: { brightness: 0.08 }, Contrast: { contrast: -0.15 }, Saturation: { saturation: -0.2 } } },
  { id: "vintage", label: "Vintage",   filters: { Sepia: {}, Brightness: { brightness: -0.05 }, Contrast: { contrast: 0.1 } } },
  { id: "bw",      label: "P&B",       filters: { Grayscale: {}, Contrast: { contrast: 0.2 } } },
  { id: "cold",    label: "Frio",      filters: { ColorMatrix: { matrix: [1,0,0,0,0, 0,1,0,0,0, 0,0,1.4,0,0, 0,0,0,1,0] } } },
  { id: "warm",    label: "Quente",    filters: { ColorMatrix: { matrix: [1.2,0,0,0,0, 0,1.05,0,0,0, 0,0,0.8,0,0, 0,0,0,1,0] } } },
  { id: "fade",    label: "Desbotado", filters: { Brightness: { brightness: 0.12 }, Contrast: { contrast: -0.2 }, Saturation: { saturation: -0.3 } } },
];

const ADJUSTMENTS = [
  { key: "Brightness", label: "Brilho",     prop: "brightness",  min: -1,   max: 1,   step: 0.01, scale: 1 },
  { key: "Contrast",   label: "Contraste",  prop: "contrast",    min: -1,   max: 1,   step: 0.01, scale: 1 },
  { key: "Saturation", label: "Saturação",  prop: "saturation",  min: -1,   max: 1,   step: 0.01, scale: 1 },
  { key: "Blur",       label: "Desfoque",   prop: "blur",        min: 0,    max: 1,   step: 0.01, scale: 1 },
];

export function ImageFiltersPanel({ fabricCanvas, selectionVersion }: ImageFiltersPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [currentPreset, setCurrentPreset] = useState("none");
  const [, forceRedraw] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    const isImg = obj && obj.type === "image";
    queueMicrotask(() => setActive(isImg ? obj : null));
  }, [fabricCanvas, selectionVersion]);

  const getFilterValue = useCallback((filterKey: string, prop: string): number => {
    if (!active?.filters) return 0;
    const f = (active.filters as { type?: string; [k: string]: unknown }[]).find(
      (f) => f?.type?.toLowerCase() === filterKey.toLowerCase()
    );
    return f ? ((f[prop] as number) ?? 0) : 0;
  }, [active]);

  const setAdjustment = useCallback(
    async (filterKey: string, prop: string, value: number) => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj || obj.type !== "image") return;
      const { fabric } = await import("fabric");
      const filters = [...((obj.filters as unknown[]) ?? [])];
      const idx = (filters as { type?: string }[]).findIndex(
        (f) => f?.type?.toLowerCase() === filterKey.toLowerCase()
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const FilterClass = (fabric.Image.filters as any)[filterKey];
      if (!FilterClass) return;
      const newFilter = new FilterClass({ [prop]: value });
      if (idx >= 0) filters[idx] = newFilter;
      else filters.push(newFilter);
      obj.filters = filters;
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      forceRedraw((n) => n + 1);
    },
    [fabricCanvas]
  );

  const applyPreset = useCallback(
    async (preset: typeof PRESETS[number]) => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj || obj.type !== "image") return;
      const { fabric } = await import("fabric");
      const newFilters: unknown[] = [];

      for (const [key, opts] of Object.entries(preset.filters)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FilterClass = (fabric.Image.filters as any)[key];
        if (!FilterClass) continue;
        newFilters.push(new FilterClass(opts));
      }

      obj.filters = newFilters;
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setCurrentPreset(preset.id);
      forceRedraw((n) => n + 1);
      toast.success(`Filtro "${preset.label}" aplicado`);
    },
    [fabricCanvas]
  );

  if (!active) {
    return (
      <div className="flex flex-col gap-2 pt-2 px-3">
        <h3 className="text-sm font-semibold text-foreground">Filtros de Imagem</h3>
        <p className="text-xs text-muted-foreground">Selecione uma imagem no canvas para editar filtros.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2 px-3 pb-3">
      <h3 className="text-sm font-semibold text-foreground">Filtros de Imagem</h3>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Presets</span>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded border transition-colors text-[9px] ${
                currentPreset === preset.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent/50 text-muted-foreground"
              }`}
            >
              <span className="text-base">🎨</span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual adjustments */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ajustes Manuais</span>
        {ADJUSTMENTS.map((adj) => {
          const value = getFilterValue(adj.key, adj.prop);
          return (
            <div key={adj.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{adj.label}</span>
                <span className="text-xs tabular-nums w-10 text-right">{value.toFixed(2)}</span>
              </div>
              <Slider
                value={[value]}
                min={adj.min}
                max={adj.max}
                step={adj.step}
                onValueChange={(vals) => setAdjustment(adj.key, adj.prop, (vals as number[])[0])}
                className="w-full"
              />
            </div>
          );
        })}
      </div>

      {/* Reset */}
      <button
        onClick={() => applyPreset(PRESETS[0])}
        className="text-xs text-muted-foreground hover:text-foreground text-center py-1 hover:bg-accent/40 rounded transition-colors"
      >
        Resetar todos os filtros
      </button>
    </div>
  );
}
