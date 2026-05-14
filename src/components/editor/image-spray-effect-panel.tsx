"use client";

import { useCallback, useEffect, useState } from "react";
import { SprayCan, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageSprayEffectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const SPRAY_TAG = "__spray__";

type SprayType = "noise" | "grain" | "splatter" | "dots";

const SPRAY_TYPES: { value: SprayType; label: string }[] = [
  { value: "noise", label: "Ruído" },
  { value: "grain", label: "Granulado" },
  { value: "splatter", label: "Respingo" },
  { value: "dots", label: "Pontos" },
];

export function ImageSprayEffectPanel({ fabricCanvas, selectionVersion }: ImageSprayEffectPanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [hasEffect, setHasEffect] = useState(false);
  const [sprayType, setSprayType] = useState<SprayType>("grain");
  const [intensity, setIntensity] = useState(30);
  const [size, setSize] = useState(2);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(50);
  const [blendMode, setBlendMode] = useState<"overlay" | "multiply" | "screen" | "normal">("overlay");

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
      if (isImg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHasEffect((obj.filters ?? []).some((f: any) => f[SPRAY_TAG]));
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const parseColor = useCallback((hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }), []);

  const applySpray = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (obj.filters ?? []).filter((fl: any) => !fl[SPRAY_TAG]);

      const capturedType = sprayType;
      const capturedIntensity = intensity;
      const capturedSize = size;
      const capturedColor = parseColor(color);
      const capturedOpacity = opacity / 100;
      const capturedBlend = blendMode;

      const seed = Math.random() * 999999 | 0;

      function mulberry32(a: number) {
        let t = a + 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      }

      const filter = new f.Image.filters.ColorMatrix({
        matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      });
      filter[SPRAY_TAG] = true;

      filter.applyTo2d = (options: { imageData: ImageData }) => {
        const { imageData } = options;
        const d = imageData.data;
        const w = imageData.width;
        const h = imageData.height;
        let rng = seed;

        const blend = (src: number, dst: number, mode: string, a: number) => {
          let result = dst;
          if (mode === "overlay") result = dst < 128 ? (2 * src * dst) / 255 : 255 - 2 * (255 - src) * (255 - dst) / 255;
          else if (mode === "multiply") result = src * dst / 255;
          else if (mode === "screen") result = 255 - (255 - src) * (255 - dst) / 255;
          else result = src;
          return Math.round(dst + (result - dst) * a);
        };

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            rng = (rng * 1664525 + 1013904223) & 0xffffffff;
            const rand = mulberry32(rng >>> 0);

            const prob = capturedType === "noise" ? capturedIntensity / 100
              : capturedType === "grain" ? capturedIntensity / 200
              : capturedType === "dots" ? capturedIntensity / 400
              : capturedIntensity / 300;

            if (rand > prob) continue;

            const idx = (y * w + x) * 4;
            let sprayVal = 0;

            if (capturedType === "noise") sprayVal = (mulberry32((rng * 7919 + 3571) >>> 0) * 255) | 0;
            else if (capturedType === "grain") sprayVal = ((mulberry32((rng * 6271 + 2053) >>> 0) - 0.5) * capturedSize * 40 + 128) | 0;
            else if (capturedType === "splatter") sprayVal = mulberry32((rng * 4253) >>> 0) > 0.5 ? 255 : 0;
            else sprayVal = 128;

            const useCustomColor = capturedType === "dots" || capturedType === "splatter";
            const sr = useCustomColor ? capturedColor.r : sprayVal;
            const sg = useCustomColor ? capturedColor.g : sprayVal;
            const sb = useCustomColor ? capturedColor.b : sprayVal;

            d[idx] = Math.min(255, Math.max(0, blend(sr, d[idx], capturedBlend, capturedOpacity)));
            d[idx + 1] = Math.min(255, Math.max(0, blend(sg, d[idx + 1], capturedBlend, capturedOpacity)));
            d[idx + 2] = Math.min(255, Math.max(0, blend(sb, d[idx + 2], capturedBlend, capturedOpacity)));
          }
        }
      };

      obj.filters = [...base, filter];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success(`Efeito spray "${capturedType}" aplicado`);
    });
  }, [getImage, sprayType, intensity, size, color, opacity, blendMode, parseColor, fabricCanvas]);

  const removeEffect = useCallback(() => {
    const obj = getImage();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.filters = (obj.filters ?? []).filter((f: any) => !f[SPRAY_TAG]);
    obj.applyFilters();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    toast.success("Efeito spray removido");
  }, [getImage, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <SprayCan className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Efeito Spray / Granulado</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <SprayCan className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para aplicar spray</p>
        </div>
      ) : (
        <>
          {/* Type */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Tipo de spray</span>
            <div className="grid grid-cols-2 gap-1">
              {SPRAY_TYPES.map(s => (
                <button key={s.value} onClick={() => setSprayType(s.value)}
                  className={`py-1 rounded border text-[8px] transition-colors ${sprayType === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Intensidade</span>
              <span className="text-[9px] tabular-nums">{intensity}%</span>
            </div>
            <input type="range" min={5} max={100} step={5} value={intensity}
              onChange={e => setIntensity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Size (for grain) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tamanho do grão</span>
              <span className="text-[9px] tabular-nums">{size}</span>
            </div>
            <input type="range" min={1} max={8} step={1} value={size}
              onChange={e => setSize(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Opacidade do efeito</span>
              <span className="text-[9px] tabular-nums">{opacity}%</span>
            </div>
            <input type="range" min={10} max={100} step={5} value={opacity}
              onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Blend mode */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Modo de mistura</span>
            <div className="grid grid-cols-2 gap-1">
              {(["normal", "overlay", "multiply", "screen"] as const).map(bm => (
                <button key={bm} onClick={() => setBlendMode(bm)}
                  className={`py-1 rounded border text-[7px] transition-colors ${blendMode === bm ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {bm.charAt(0).toUpperCase() + bm.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Color (dots/splatter) */}
          {(sprayType === "dots" || sprayType === "splatter") && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground">Cor</span>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-7 h-6 rounded border border-border cursor-pointer" />
              <span className="text-[7px] font-mono text-muted-foreground">{color}</span>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeEffect}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applySpray}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <SprayCan className="w-3 h-3" /> Aplicar Spray
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Cada aplicação usa semente aleatória diferente
          </p>
        </>
      )}
    </div>
  );
}
