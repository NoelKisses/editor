"use client";

import { useCallback, useEffect, useState } from "react";
import { Sun, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageSaturationPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ColorAdjustments {
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  hueRotation: number;
  clarity: number;
}

const DEFAULT_ADJUSTMENTS: ColorAdjustments = {
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  hueRotation: 0,
  clarity: 0,
};

const COLOR_PRESETS: { name: string; adjustments: ColorAdjustments }[] = [
  { name: "Frio", adjustments: { ...DEFAULT_ADJUSTMENTS, temperature: -40, saturation: -10 } },
  { name: "Quente", adjustments: { ...DEFAULT_ADJUSTMENTS, temperature: 40, saturation: 10 } },
  { name: "Vívido", adjustments: { ...DEFAULT_ADJUSTMENTS, saturation: 60, vibrance: 30 } },
  { name: "P&B", adjustments: { ...DEFAULT_ADJUSTMENTS, saturation: -100 } },
  { name: "Vintage", adjustments: { ...DEFAULT_ADJUSTMENTS, temperature: 20, saturation: -20, tint: 10 } },
  { name: "Aqua", adjustments: { ...DEFAULT_ADJUSTMENTS, hueRotation: 180, saturation: 20 } },
];

export function ImageSaturationPanel({ fabricCanvas, selectionVersion }: ImageSaturationPanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [adjustments, setAdjustments] = useState<ColorAdjustments>(DEFAULT_ADJUSTMENTS);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const applyAdjustments = useCallback((adj: ColorAdjustments) => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const filters: unknown[] = [];

      // Saturation filter
      if (adj.saturation !== 0) {
        filters.push(new f.Image.filters.Saturation({ saturation: adj.saturation / 100 }));
      }

      // Vibrance (approximated via saturation with lower impact on already-saturated colors)
      if (adj.vibrance !== 0) {
        // Vibrance is modeled as partial saturation
        filters.push(new f.Image.filters.Saturation({ saturation: adj.vibrance / 200 }));
      }

      // Temperature (approximated via Color Matrix)
      if (adj.temperature !== 0) {
        const t = adj.temperature / 100;
        filters.push(new f.Image.filters.ColorMatrix({
          matrix: [
            1 + t * 0.3, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1 - t * 0.3, 0, 0,
            0, 0, 0, 1, 0,
          ],
        }));
      }

      // Tint (green/magenta shift via ColorMatrix)
      if (adj.tint !== 0) {
        const t = adj.tint / 100;
        filters.push(new f.Image.filters.ColorMatrix({
          matrix: [
            1, 0, 0, 0, 0,
            0, 1 + t * 0.3, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0,
          ],
        }));
      }

      // Hue rotation
      if (adj.hueRotation !== 0) {
        filters.push(new f.Image.filters.HueRotation({ rotation: adj.hueRotation / 360 }));
      }

      // Clarity (sharpening via Convolute)
      if (adj.clarity > 0) {
        filters.push(new f.Image.filters.Convolute({
          matrix: [
            0, -adj.clarity / 200, 0,
            -adj.clarity / 200, 1 + adj.clarity / 50, -adj.clarity / 200,
            0, -adj.clarity / 200, 0,
          ],
        }));
      }

      // Preserve existing filters (non-color)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingFilters: any[] = (obj.filters ?? []).filter((f: any) =>
        f.type && !["Saturation", "ColorMatrix", "HueRotation", "Convolute"].includes(f.type)
      );

      obj.filters = [...existingFilters, ...filters];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      toast.success("Ajustes de cor aplicados");
    });
  }, [getImage, fabricCanvas]);

  const update = useCallback((partial: Partial<ColorAdjustments>) => {
    const updated = { ...adjustments, ...partial };
    setAdjustments(updated);
    setSelectedPreset(null);
    applyAdjustments(updated);
  }, [adjustments, applyAdjustments]);

  const applyPreset = useCallback((preset: typeof COLOR_PRESETS[number]) => {
    setAdjustments(preset.adjustments);
    setSelectedPreset(preset.name);
    applyAdjustments(preset.adjustments);
  }, [applyAdjustments]);

  const reset = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setSelectedPreset(null);
    applyAdjustments(DEFAULT_ADJUSTMENTS);
  }, [applyAdjustments]);

  const renderSlider = (label: string, field: keyof ColorAdjustments, min: number, max: number, unit = "") => (
    <div key={field} className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground">{label}</span>
        <span className="text-[9px] tabular-nums">{adjustments[field] > 0 ? "+" : ""}{adjustments[field]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={adjustments[field]}
        onChange={e => update({ [field]: Number(e.target.value) })}
        className="w-full accent-primary h-1" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Cor e Saturação</span>
        </div>
        {hasImage && (
          <button onClick={reset}
            className="flex items-center gap-0.5 text-[8px] text-muted-foreground hover:text-primary transition-colors">
            <RotateCcw className="w-2.5 h-2.5" /> Reset
          </button>
        )}
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sun className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para ajustar as cores</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets de Cor</span>
            <div className="grid grid-cols-3 gap-1">
              {COLOR_PRESETS.map(p => (
                <button key={p.name} onClick={() => applyPreset(p)}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${selectedPreset === p.name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="flex flex-col gap-3">
            {renderSlider("Saturação", "saturation", -100, 100)}
            {renderSlider("Vibrance", "vibrance", -100, 100)}
            {renderSlider("Temperatura", "temperature", -100, 100)}
            {renderSlider("Tom (Tint)", "tint", -100, 100)}
            {renderSlider("Rotação de Matiz", "hueRotation", -180, 180, "°")}
            {renderSlider("Claridade", "clarity", 0, 100)}
          </div>

          {/* Visual indicator */}
          <div className="grid grid-cols-6 gap-0.5 h-3 rounded overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-full" style={{
                backgroundColor: `hsl(${(i * 60 + adjustments.hueRotation) % 360}, ${Math.max(0, 50 + adjustments.saturation / 2)}%, 50%)`,
              }} />
            ))}
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Ajustes aplicados como filtros Fabric.js sobre a imagem
          </p>
        </>
      )}
    </div>
  );
}
