"use client";

import { useCallback, useEffect, useState } from "react";
import { Contrast, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageContrastBrightnessPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const ADJ_TAG = "__cbAdj__";

const DEFAULTS = { brightness: 0, contrast: 0, exposure: 0, highlights: 0, shadows: 0, temperature: 0 };
type AdjKey = keyof typeof DEFAULTS;

const CONTROLS: { key: AdjKey; label: string; min: number; max: number }[] = [
  { key: "brightness", label: "Brilho", min: -100, max: 100 },
  { key: "contrast", label: "Contraste", min: -100, max: 100 },
  { key: "exposure", label: "Exposição", min: -100, max: 100 },
  { key: "highlights", label: "Realces", min: -100, max: 100 },
  { key: "shadows", label: "Sombras", min: -100, max: 100 },
  { key: "temperature", label: "Temperatura", min: -100, max: 100 },
];

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function ImageContrastBrightnessPanel({ fabricCanvas, selectionVersion }: ImageContrastBrightnessPanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [hasEffect, setHasEffect] = useState(false);
  const [adj, setAdj] = useState({ ...DEFAULTS });

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
      if (isImg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = (obj.filters ?? []).find((f: any) => f[ADJ_TAG]);
        if (existing) {
          setHasEffect(true);
          setAdj({ ...DEFAULTS, ...existing._adjValues });
        } else {
          setHasEffect(false);
          setAdj({ ...DEFAULTS });
        }
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const applyAdj = useCallback((newAdj: typeof DEFAULTS) => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (obj.filters ?? []).filter((fl: any) => !fl[ADJ_TAG]);

      const filter = new f.Image.filters.ColorMatrix({
        matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      });
      filter[ADJ_TAG] = true;
      filter._adjValues = { ...newAdj };

      filter.applyTo2d = (options: { imageData: ImageData }) => {
        const { imageData } = options;
        const d = imageData.data;
        const len = d.length;
        const br = newAdj.brightness / 100;
        const cr = newAdj.contrast / 100;
        const ex = newAdj.exposure / 100;
        const hi = newAdj.highlights / 100;
        const sh = newAdj.shadows / 100;
        const tm = newAdj.temperature / 100;

        const contrastFactor = cr >= 0 ? 1 + cr * 2 : 1 + cr;

        for (let i = 0; i < len; i += 4) {
          let r = d[i] / 255;
          let g = d[i + 1] / 255;
          let b = d[i + 2] / 255;

          // Brightness
          r += br; g += br; b += br;
          // Contrast
          r = clamp((r - 0.5) * contrastFactor + 0.5, 0, 1);
          g = clamp((g - 0.5) * contrastFactor + 0.5, 0, 1);
          b = clamp((b - 0.5) * contrastFactor + 0.5, 0, 1);
          // Exposure (gamma)
          const expFactor = ex >= 0 ? 1 + ex * 2 : 1 + ex;
          r = clamp(r * expFactor, 0, 1);
          g = clamp(g * expFactor, 0, 1);
          b = clamp(b * expFactor, 0, 1);
          // Highlights (apply to bright areas)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 0.6) {
            const blend = (lum - 0.6) / 0.4;
            r = clamp(r + hi * blend * 0.5, 0, 1);
            g = clamp(g + hi * blend * 0.5, 0, 1);
            b = clamp(b + hi * blend * 0.5, 0, 1);
          }
          // Shadows (apply to dark areas)
          if (lum < 0.4) {
            const blend = (0.4 - lum) / 0.4;
            r = clamp(r + sh * blend * 0.5, 0, 1);
            g = clamp(g + sh * blend * 0.5, 0, 1);
            b = clamp(b + sh * blend * 0.5, 0, 1);
          }
          // Temperature (warm/cool)
          r = clamp(r + tm * 0.15, 0, 1);
          b = clamp(b - tm * 0.15, 0, 1);

          d[i] = Math.round(r * 255);
          d[i + 1] = Math.round(g * 255);
          d[i + 2] = Math.round(b * 255);
        }
      };

      obj.filters = [...base, filter];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
    });
  }, [getImage, fabricCanvas]);

  const update = useCallback((key: AdjKey, val: number) => {
    const next = { ...adj, [key]: val };
    setAdj(next);
    applyAdj(next);
  }, [adj, applyAdj]);

  const removeEffect = useCallback(() => {
    const obj = getImage();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.filters = (obj.filters ?? []).filter((f: any) => !f[ADJ_TAG]);
    obj.applyFilters();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    setAdj({ ...DEFAULTS });
    toast.success("Ajustes removidos");
  }, [getImage, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Contrast className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Contraste e Brilho</span>
        </div>
        {hasEffect && (
          <button onClick={removeEffect} className="text-[7px] text-destructive hover:underline">Remover</button>
        )}
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Contrast className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para ajustar</p>
        </div>
      ) : (
        <>
          {CONTROLS.map(ctrl => (
            <div key={ctrl.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">{ctrl.label}</span>
                <span className="text-[9px] tabular-nums">{adj[ctrl.key]}</span>
              </div>
              <input type="range" min={ctrl.min} max={ctrl.max} step={1} value={adj[ctrl.key]}
                onChange={e => update(ctrl.key, Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
          ))}

          <button onClick={() => { setAdj({ ...DEFAULTS }); applyAdj({ ...DEFAULTS }); }}
            className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
            <RotateCcw className="w-3 h-3" /> Zerar todos
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Processamento pixel a pixel em tempo real
          </p>
        </>
      )}
    </div>
  );
}
