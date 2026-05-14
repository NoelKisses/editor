"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageColorGradingPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const GRADING_TAG = "__colorGrading__";

type LutPreset = "none" | "cinematic" | "warm" | "cool" | "vintage" | "teal-orange" | "black-white" | "golden";

const PRESETS: { value: LutPreset; label: string }[] = [
  { value: "none", label: "Original" },
  { value: "cinematic", label: "Cinemático" },
  { value: "warm", label: "Quente" },
  { value: "cool", label: "Frio" },
  { value: "vintage", label: "Vintage" },
  { value: "teal-orange", label: "Teal/Laranja" },
  { value: "black-white", label: "P&B" },
  { value: "golden", label: "Dourado" },
];

interface GradingParams {
  shadows: { r: number; g: number; b: number };
  midtones: { r: number; g: number; b: number };
  highlights: { r: number; g: number; b: number };
  saturation: number;
  vibrance: number;
  lift: number;
  gamma: number;
  gain: number;
}

const DEFAULT_PARAMS: GradingParams = {
  shadows: { r: 0, g: 0, b: 0 },
  midtones: { r: 0, g: 0, b: 0 },
  highlights: { r: 0, g: 0, b: 0 },
  saturation: 1,
  vibrance: 0,
  lift: 0,
  gamma: 1,
  gain: 1,
};

function getPresetParams(preset: LutPreset): GradingParams {
  const p = { ...DEFAULT_PARAMS };
  if (preset === "cinematic") return { ...p, shadows: { r: -10, g: -5, b: 10 }, highlights: { r: 10, g: 5, b: -10 }, saturation: 0.85, lift: -5 };
  if (preset === "warm") return { ...p, midtones: { r: 15, g: 5, b: -10 }, highlights: { r: 10, g: 8, b: -5 }, saturation: 1.1 };
  if (preset === "cool") return { ...p, midtones: { r: -10, g: -5, b: 15 }, shadows: { r: 0, g: 0, b: 10 }, saturation: 0.95 };
  if (preset === "vintage") return { ...p, shadows: { r: 5, g: 5, b: -15 }, midtones: { r: 10, g: 5, b: -5 }, saturation: 0.75, lift: 10 };
  if (preset === "teal-orange") return { ...p, shadows: { r: -15, g: 5, b: 15 }, highlights: { r: 20, g: 5, b: -20 }, saturation: 1.15 };
  if (preset === "black-white") return { ...p, saturation: 0, vibrance: 0 };
  if (preset === "golden") return { ...p, midtones: { r: 20, g: 15, b: -10 }, highlights: { r: 15, g: 12, b: -5 }, saturation: 1.1, gamma: 0.95 };
  return DEFAULT_PARAMS;
}

export function ImageColorGradingPanel({ fabricCanvas, selectionVersion }: ImageColorGradingPanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [hasEffect, setHasEffect] = useState(false);
  const [preset, setPreset] = useState<LutPreset>("none");
  const [params, setParams] = useState<GradingParams>(DEFAULT_PARAMS);
  const [activeZone, setActiveZone] = useState<"shadows" | "midtones" | "highlights">("midtones");

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
      if (isImg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHasEffect((obj.filters ?? []).some((f: any) => f[GRADING_TAG]));
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const applyPreset = useCallback((p: LutPreset) => {
    setPreset(p);
    if (p !== "none") setParams(getPresetParams(p));
    else setParams(DEFAULT_PARAMS);
  }, []);

  const applyGrading = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    const capturedParams = { ...params };

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (obj.filters ?? []).filter((fl: any) => !fl[GRADING_TAG]);

      const filter = new f.Image.filters.ColorMatrix({
        matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      });
      filter[GRADING_TAG] = true;

      filter.applyTo2d = (options: { imageData: ImageData }) => {
        const { imageData } = options;
        const d = imageData.data;
        const len = d.length;

        const { shadows, midtones, highlights, saturation, vibrance, lift, gamma, gain } = capturedParams;

        for (let i = 0; i < len; i += 4) {
          let r = d[i] / 255;
          let g = d[i + 1] / 255;
          let b = d[i + 2] / 255;

          // Lift / Gamma / Gain
          r = Math.pow(Math.max(0, r * gain + lift / 255), 1 / Math.max(0.01, gamma));
          g = Math.pow(Math.max(0, g * gain + lift / 255), 1 / Math.max(0.01, gamma));
          b = Math.pow(Math.max(0, b * gain + lift / 255), 1 / Math.max(0.01, gamma));

          // Zone weights (luma-based)
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          const sw = Math.max(0, 1 - luma * 3);
          const mw = Math.max(0, 1 - Math.abs(luma - 0.5) * 3);
          const hw = Math.max(0, luma * 3 - 2);

          r += (shadows.r * sw + midtones.r * mw + highlights.r * hw) / 255;
          g += (shadows.g * sw + midtones.g * mw + highlights.g * hw) / 255;
          b += (shadows.b * sw + midtones.b * mw + highlights.b * hw) / 255;

          // Saturation
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + (r - gray) * saturation;
          g = gray + (g - gray) * saturation;
          b = gray + (b - gray) * saturation;

          // Vibrance (boost low-saturation colors more)
          if (vibrance !== 0) {
            const max = Math.max(r, g, b);
            const sat = max - Math.min(r, g, b);
            const vFactor = 1 + vibrance * (1 - sat);
            const gv = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gv + (r - gv) * vFactor;
            g = gv + (g - gv) * vFactor;
            b = gv + (b - gv) * vFactor;
          }

          d[i] = Math.min(255, Math.max(0, Math.round(r * 255)));
          d[i + 1] = Math.min(255, Math.max(0, Math.round(g * 255)));
          d[i + 2] = Math.min(255, Math.max(0, Math.round(b * 255)));
        }
      };

      obj.filters = [...base, filter];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success("Color grading aplicado");
    });
  }, [getImage, params, fabricCanvas]);

  const removeEffect = useCallback(() => {
    const obj = getImage();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.filters = (obj.filters ?? []).filter((f: any) => !f[GRADING_TAG]);
    obj.applyFilters();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    setPreset("none");
    setParams(DEFAULT_PARAMS);
    toast.success("Color grading removido");
  }, [getImage, fabricCanvas]);

  const updateZoneChannel = useCallback((channel: "r" | "g" | "b", value: number) => {
    setParams(prev => ({
      ...prev,
      [activeZone]: { ...prev[activeZone], [channel]: value },
    }));
  }, [activeZone]);

  const zoneData = params[activeZone];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Color Grading</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para aplicar color grading</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Predefinições</span>
            <div className="grid grid-cols-2 gap-1">
              {PRESETS.map(p => (
                <button key={p.value} onClick={() => applyPreset(p.value)}
                  className={`py-1 rounded border text-[8px] transition-colors ${preset === p.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zone selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Zona de cor</span>
            <div className="grid grid-cols-3 gap-1">
              {(["shadows", "midtones", "highlights"] as const).map(z => (
                <button key={z} onClick={() => setActiveZone(z)}
                  className={`py-1 rounded border text-[7px] transition-colors ${activeZone === z ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {z === "shadows" ? "Sombras" : z === "midtones" ? "Meios" : "Luzes"}
                </button>
              ))}
            </div>
          </div>

          {/* Zone RGB */}
          {(["r", "g", "b"] as const).map(ch => (
            <div key={ch} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">{ch === "r" ? "Vermelho" : ch === "g" ? "Verde" : "Azul"}</span>
                <span className="text-[9px] tabular-nums">{zoneData[ch]}</span>
              </div>
              <input type="range" min={-80} max={80} step={1} value={zoneData[ch]}
                onChange={e => updateZoneChannel(ch, Number(e.target.value))}
                className={`w-full h-1 ${ch === "r" ? "accent-red-500" : ch === "g" ? "accent-green-500" : "accent-blue-500"}`} />
            </div>
          ))}

          {/* Global controls */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border">
            <span className="text-[9px] text-muted-foreground font-medium">Controles globais</span>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Saturação</span>
                <span className="text-[9px] tabular-nums">{params.saturation.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={2} step={0.05} value={params.saturation}
                onChange={e => setParams(prev => ({ ...prev, saturation: Number(e.target.value) }))}
                className="w-full accent-primary h-1" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Vibrance</span>
                <span className="text-[9px] tabular-nums">{params.vibrance.toFixed(2)}</span>
              </div>
              <input type="range" min={-1} max={1} step={0.05} value={params.vibrance}
                onChange={e => setParams(prev => ({ ...prev, vibrance: Number(e.target.value) }))}
                className="w-full accent-primary h-1" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Lift (escuro)</span>
                <span className="text-[9px] tabular-nums">{params.lift}</span>
              </div>
              <input type="range" min={-50} max={50} step={1} value={params.lift}
                onChange={e => setParams(prev => ({ ...prev, lift: Number(e.target.value) }))}
                className="w-full accent-primary h-1" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Gamma (médios)</span>
                <span className="text-[9px] tabular-nums">{params.gamma.toFixed(2)}</span>
              </div>
              <input type="range" min={0.3} max={2.5} step={0.05} value={params.gamma}
                onChange={e => setParams(prev => ({ ...prev, gamma: Number(e.target.value) }))}
                className="w-full accent-primary h-1" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Gain (claro)</span>
                <span className="text-[9px] tabular-nums">{params.gain.toFixed(2)}</span>
              </div>
              <input type="range" min={0.5} max={2} step={0.05} value={params.gain}
                onChange={e => setParams(prev => ({ ...prev, gain: Number(e.target.value) }))}
                className="w-full accent-primary h-1" />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeEffect}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyGrading}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <TrendingUp className="w-3 h-3" /> Aplicar Grading
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Sombras · Meios · Luzes independentes · LGG pipeline
          </p>
        </>
      )}
    </div>
  );
}
