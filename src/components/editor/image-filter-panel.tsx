"use client";

import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageFilterPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sepia: number;
  invert: number;
  blur: number;
  noise: number;
  pixelate: number;
  vibrance: number;
}

const DEFAULT_FILTERS: Filters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  sepia: 0,
  invert: 0,
  blur: 0,
  noise: 0,
  pixelate: 0,
  vibrance: 0,
};

const PRESETS: { label: string; filters: Partial<Filters> }[] = [
  { label: "Original", filters: {} },
  { label: "Vintage", filters: { sepia: 0.6, contrast: 0.1, brightness: -0.05 } },
  { label: "P&B", filters: { saturation: -1 } },
  { label: "Frio", filters: { hue: 180, saturation: 0.2, brightness: 0.05 } },
  { label: "Quente", filters: { hue: 30, saturation: 0.3, brightness: 0.1 } },
  { label: "Neon", filters: { saturation: 0.8, contrast: 0.4, brightness: 0.1 } },
  { label: "Faded", filters: { contrast: -0.2, brightness: 0.15, saturation: -0.3 } },
  { label: "Dramático", filters: { contrast: 0.5, brightness: -0.1, saturation: -0.2 } },
];

const FILTER_DEFS: { key: keyof Filters; label: string; min: number; max: number; step: number; fabricClass: string; fabricProp: string }[] = [
  { key: "brightness", label: "Brilho", min: -1, max: 1, step: 0.05, fabricClass: "Brightness", fabricProp: "brightness" },
  { key: "contrast", label: "Contraste", min: -1, max: 1, step: 0.05, fabricClass: "Contrast", fabricProp: "contrast" },
  { key: "saturation", label: "Saturação", min: -1, max: 1, step: 0.05, fabricClass: "Saturation", fabricProp: "saturation" },
  { key: "hue", label: "Matiz", min: -360, max: 360, step: 5, fabricClass: "HueRotation", fabricProp: "rotation" },
  { key: "sepia", label: "Sépia", min: 0, max: 1, step: 0.05, fabricClass: "Sepia", fabricProp: "saturation" },
  { key: "invert", label: "Inverter", min: 0, max: 1, step: 1, fabricClass: "Invert", fabricProp: "invert" },
  { key: "blur", label: "Desfoque", min: 0, max: 1, step: 0.05, fabricClass: "Blur", fabricProp: "blur" },
  { key: "noise", label: "Ruído", min: 0, max: 200, step: 5, fabricClass: "Noise", fabricProp: "noise" },
  { key: "pixelate", label: "Pixelado", min: 1, max: 50, step: 1, fabricClass: "Pixelate", fabricProp: "blocksize" },
  { key: "vibrance", label: "Vibração", min: -1, max: 1, step: 0.05, fabricClass: "Vibrance", fabricProp: "vibrance" },
];

export function ImageFilterPanel({ fabricCanvas, selectionVersion }: ImageFilterPanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasImage(obj?.type === "image");
      if (obj?.type === "image") {
        setFilters({ ...DEFAULT_FILTERS });
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj?.type === "image" ? obj : null;
  }, [fabricCanvas]);

  const applyFilters = useCallback((newFilters: Filters) => {
    const obj = getImage();
    if (!obj) return;

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeFilters: any[] = [];

      if (newFilters.brightness !== 0) activeFilters.push(new f.Image.filters.Brightness({ brightness: newFilters.brightness }));
      if (newFilters.contrast !== 0) activeFilters.push(new f.Image.filters.Contrast({ contrast: newFilters.contrast }));
      if (newFilters.saturation !== 0) activeFilters.push(new f.Image.filters.Saturation({ saturation: newFilters.saturation }));
      if (newFilters.hue !== 0) activeFilters.push(new f.Image.filters.HueRotation({ rotation: (newFilters.hue / 360) * 2 * Math.PI }));
      if (newFilters.sepia > 0) activeFilters.push(new f.Image.filters.Sepia());
      if (newFilters.invert > 0) activeFilters.push(new f.Image.filters.Invert());
      if (newFilters.blur > 0) activeFilters.push(new f.Image.filters.Blur({ blur: newFilters.blur }));
      if (newFilters.noise > 0) activeFilters.push(new f.Image.filters.Noise({ noise: newFilters.noise }));
      if (newFilters.pixelate > 1) activeFilters.push(new f.Image.filters.Pixelate({ blocksize: newFilters.pixelate }));
      if (newFilters.vibrance !== 0) activeFilters.push(new f.Image.filters.Vibrance({ vibrance: newFilters.vibrance }));

      obj.filters = activeFilters;
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
    });
  }, [getImage, fabricCanvas]);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, val: Filters[K]) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    applyFilters(next);
  }, [filters, applyFilters]);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }
    const next = { ...DEFAULT_FILTERS, ...preset.filters } as Filters;
    setFilters(next);
    applyFilters(next);
    if (preset.label !== "Original") toast.success(`Filtro "${preset.label}" aplicado`);
  }, [getImage, applyFilters]);

  const reset = useCallback(() => {
    const obj = getImage();
    if (!obj) return;
    const next = { ...DEFAULT_FILTERS };
    setFilters(next);
    import("fabric").then(() => {
      obj.filters = [];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
    });
    toast.success("Filtros removidos");
  }, [getImage, fabricCanvas]);

  const formatVal = (key: keyof Filters, val: number) => {
    if (key === "hue") return `${val}°`;
    if (key === "noise" || key === "pixelate") return String(Math.round(val));
    return val > 0 ? `+${(val * 100).toFixed(0)}%` : `${(val * 100).toFixed(0)}%`;
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Filtros de Imagem</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <SlidersHorizontal className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para aplicar filtros</p>
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

          {/* Filter sliders */}
          <div className="flex flex-col gap-2">
            {FILTER_DEFS.map(({ key, label, min, max, step }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                  <span className="text-[9px] tabular-nums text-foreground">{formatVal(key, filters[key])}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={filters[key]}
                  onChange={e => updateFilter(key, Number(e.target.value) as Filters[typeof key])}
                  className="w-full accent-primary h-1"
                />
              </div>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={reset}
            className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Remover todos os filtros
          </button>
        </>
      )}
    </div>
  );
}
