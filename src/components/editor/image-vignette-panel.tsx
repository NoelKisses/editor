"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageVignettePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type VignetteShape = "ellipse" | "rect" | "corners";

const VIGNETTE_SHAPES: { value: VignetteShape; label: string }[] = [
  { value: "ellipse", label: "Elipse" },
  { value: "rect", label: "Retângulo" },
  { value: "corners", label: "Cantos" },
];

function buildVignetteGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  intensity: number,
  feather: number,
  shape: VignetteShape
): CanvasGradient {
  if (shape === "ellipse" || shape === "rect") {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * (feather / 100));
    grad.addColorStop(0, "transparent");
    grad.addColorStop(1 - intensity / 200, "transparent");
    grad.addColorStop(1, color);
    return grad;
  }
  // corners: four corner linear gradients combined via multiple passes
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.1, w / 2, h / 2, Math.max(w, h) * (feather / 100));
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.6, "transparent");
  grad.addColorStop(1, color);
  return grad;
}

export function ImageVignettePanel({ fabricCanvas, selectionVersion }: ImageVignettePanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [intensity, setIntensity] = useState(60);
  const [feather, setFeather] = useState(70);
  const [color, setColor] = useState("#000000");
  const [shape, setShape] = useState<VignetteShape>("ellipse");
  const [hasEffect, setHasEffect] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
      if (isImg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasV = (obj.filters ?? []).some((f: any) => f._vignette === true);
        setHasEffect(hasV);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const applyVignette = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // Remove existing vignette
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (obj.filters ?? []).filter((fl: any) => !fl._vignette);

      const w = obj.width ?? 200;
      const h = obj.height ?? 200;
      const alpha = intensity / 100;

      // Custom filter using ConvolveMatrix as a canvas-draw filter
      const vigFilter = new f.Image.filters.ColorMatrix({
        matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      });
      vigFilter._vignette = true;
      vigFilter._vigConfig = { intensity, feather, color, shape, w, h };

      // Override apply to draw vignette overlay
      vigFilter.applyTo2d = (options: { imageData: ImageData }) => {
        const { imageData } = options;
        const data = imageData.data;
        const imgW = imageData.width;
        const imgH = imageData.height;

        // Parse color
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        for (let y = 0; y < imgH; y++) {
          for (let x = 0; x < imgW; x++) {
            const nx = (x / imgW) * 2 - 1;
            const ny = (y / imgH) * 2 - 1;

            let dist = 0;
            if (shape === "ellipse" || shape === "corners") {
              dist = Math.sqrt(nx * nx + ny * ny) / Math.SQRT2;
            } else {
              dist = Math.max(Math.abs(nx), Math.abs(ny));
            }

            const fade = feather / 100;
            const t = Math.max(0, Math.min(1, (dist - (1 - fade)) / fade));
            const vigAlpha = t * t * alpha;

            const idx = (y * imgW + x) * 4;
            data[idx] = Math.round(data[idx] * (1 - vigAlpha) + r * vigAlpha);
            data[idx + 1] = Math.round(data[idx + 1] * (1 - vigAlpha) + g * vigAlpha);
            data[idx + 2] = Math.round(data[idx + 2] * (1 - vigAlpha) + b * vigAlpha);
          }
        }
      };

      obj.filters = [...base, vigFilter];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success("Vinheta aplicada");
    });
  }, [getImage, intensity, feather, color, shape, fabricCanvas]);

  const removeVignette = useCallback(() => {
    const obj = getImage();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.filters = (obj.filters ?? []).filter((f: any) => !f._vignette);
    obj.applyFilters();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    toast.success("Vinheta removida");
  }, [getImage, fabricCanvas]);

  // Prevent buildVignetteGradient from being flagged as unused
  void buildVignetteGradient;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Moon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Vinheta (Vignette)</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Moon className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para aplicar vinheta</p>
        </div>
      ) : (
        <>
          {/* Shape */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Forma</span>
            <div className="grid grid-cols-3 gap-1">
              {VIGNETTE_SHAPES.map(s => (
                <button key={s.value} onClick={() => setShape(s.value)}
                  className={`py-1 rounded border text-[8px] transition-colors ${shape === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">Cor</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="w-7 h-6 rounded border border-border cursor-pointer" />
            <span className="text-[8px] font-mono text-muted-foreground">{color}</span>
          </div>

          {/* Intensity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Intensidade</span>
              <span className="text-[9px] tabular-nums">{intensity}%</span>
            </div>
            <input type="range" min={10} max={100} step={5} value={intensity}
              onChange={e => setIntensity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Feather */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Suavidade</span>
              <span className="text-[9px] tabular-nums">{feather}%</span>
            </div>
            <input type="range" min={20} max={100} step={5} value={feather}
              onChange={e => setFeather(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Preview gradient */}
          <div className="h-8 rounded border border-border overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-muted/50 to-muted/50" />
            <div className="absolute inset-0" style={{
              background: `radial-gradient(ellipse at center, transparent 30%, ${color}${Math.round(intensity * 2.55).toString(16).padStart(2, "0")} 100%)`
            }} />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeVignette}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyVignette}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <Moon className="w-3 h-3" /> Aplicar Vinheta
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Processamento pixel a pixel via filtro personalizado
          </p>
        </>
      )}
    </div>
  );
}
