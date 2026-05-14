"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Maximize2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImagePerspectivePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const PERSP_TAG = "__perspective__";

function CornerSlider({ label, axis, corner, offsets, setOffsets }: {
  label: string;
  axis: "x" | "y";
  corner: keyof PerspectivePoint;
  offsets: PerspectiveOffsets;
  setOffsets: React.Dispatch<React.SetStateAction<PerspectiveOffsets>>;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[8px] text-muted-foreground">{label} {axis.toUpperCase()}</span>
        <span className="text-[8px] tabular-nums">{offsets[axis][corner]}</span>
      </div>
      <input type="range" min={-80} max={80} step={1}
        value={offsets[axis][corner]}
        onChange={e => setOffsets(prev => ({
          ...prev,
          [axis]: { ...prev[axis], [corner]: Number(e.target.value) }
        }))}
        className="w-full accent-primary h-1" />
    </div>
  );
}

type PresetName = "none" | "left-lean" | "right-lean" | "top-lean" | "bottom-lean" | "trapezoid-top" | "trapezoid-bottom";

interface PerspectivePoint { tl: number; tr: number; bl: number; br: number }
interface PerspectiveOffsets { x: PerspectivePoint; y: PerspectivePoint }

const DEFAULT_OFFSETS: PerspectiveOffsets = {
  x: { tl: 0, tr: 0, bl: 0, br: 0 },
  y: { tl: 0, tr: 0, bl: 0, br: 0 },
};

function getPresetOffsets(preset: PresetName): PerspectiveOffsets {
  if (preset === "left-lean")       return { x: { tl: 30, tr: 0, bl: 30, br: 0 }, y: { tl: 0, tr: 0, bl: 0, br: 0 } };
  if (preset === "right-lean")      return { x: { tl: 0, tr: -30, bl: 0, br: -30 }, y: { tl: 0, tr: 0, bl: 0, br: 0 } };
  if (preset === "top-lean")        return { x: { tl: 0, tr: 0, bl: 0, br: 0 }, y: { tl: 30, tr: 30, bl: 0, br: 0 } };
  if (preset === "bottom-lean")     return { x: { tl: 0, tr: 0, bl: 0, br: 0 }, y: { tl: 0, tr: 0, bl: -30, br: -30 } };
  if (preset === "trapezoid-top")   return { x: { tl: 30, tr: -30, bl: 0, br: 0 }, y: { tl: 0, tr: 0, bl: 0, br: 0 } };
  if (preset === "trapezoid-bottom")return { x: { tl: 0, tr: 0, bl: 30, br: -30 }, y: { tl: 0, tr: 0, bl: 0, br: 0 } };
  return DEFAULT_OFFSETS;
}

const PRESETS: { value: PresetName; label: string }[] = [
  { value: "none", label: "Nenhum" },
  { value: "left-lean", label: "Inclinar ←" },
  { value: "right-lean", label: "Inclinar →" },
  { value: "top-lean", label: "Inclinar ↑" },
  { value: "bottom-lean", label: "Inclinar ↓" },
  { value: "trapezoid-top", label: "Trapézio ↑" },
  { value: "trapezoid-bottom", label: "Trapézio ↓" },
];

export function ImagePerspectivePanel({ fabricCanvas, selectionVersion }: ImagePerspectivePanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [hasEffect, setHasEffect] = useState(false);
  const [preset, setPreset] = useState<PresetName>("none");
  const [offsets, setOffsets] = useState<PerspectiveOffsets>(DEFAULT_OFFSETS);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
      if (isImg) {
        setHasEffect(!!(obj[PERSP_TAG]));
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const applyPreset = useCallback((p: PresetName) => {
    setPreset(p);
    setOffsets(p === "none" ? DEFAULT_OFFSETS : getPresetOffsets(p));
  }, []);

  const applyPerspective = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const capturedOffsets = { ...offsets };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (obj.filters ?? []).filter((fl: any) => !fl[PERSP_TAG]);

      const filter = new f.Image.filters.ColorMatrix({
        matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      });
      filter[PERSP_TAG] = true;

      filter.applyTo2d = (options: { imageData: ImageData }) => {
        const { imageData } = options;
        const src = new Uint8ClampedArray(imageData.data);
        const d = imageData.data;
        const w = imageData.width;
        const h = imageData.height;

        const { x: ox, y: oy } = capturedOffsets;

        // Bilinear sample
        const sample = (sx: number, sy: number) => {
          const x0 = Math.floor(sx), y0 = Math.floor(sy);
          const x1 = x0 + 1, y1 = y0 + 1;
          const fx = sx - x0, fy = sy - y0;
          const clampX = (v: number) => Math.max(0, Math.min(w - 1, v));
          const clampY = (v: number) => Math.max(0, Math.min(h - 1, v));
          const i00 = (clampY(y0) * w + clampX(x0)) * 4;
          const i10 = (clampY(y0) * w + clampX(x1)) * 4;
          const i01 = (clampY(y1) * w + clampX(x0)) * 4;
          const i11 = (clampY(y1) * w + clampX(x1)) * 4;
          return [0, 1, 2, 3].map(c =>
            (1 - fx) * (1 - fy) * src[i00 + c] +
            fx * (1 - fy) * src[i10 + c] +
            (1 - fx) * fy * src[i01 + c] +
            fx * fy * src[i11 + c]
          );
        };

        for (let y = 0; y < h; y++) {
          const ty = y / h;
          for (let x = 0; x < w; x++) {
            const tx = x / w;
            // Bilinear interpolation of offsets
            const dxOffset =
              (1 - tx) * (1 - ty) * ox.tl +
              tx * (1 - ty) * ox.tr +
              (1 - tx) * ty * ox.bl +
              tx * ty * ox.br;
            const dyOffset =
              (1 - tx) * (1 - ty) * oy.tl +
              tx * (1 - ty) * oy.tr +
              (1 - tx) * ty * oy.bl +
              tx * ty * oy.br;

            const srcX = x + dxOffset;
            const srcY = y + dyOffset;
            const idx = (y * w + x) * 4;
            const pixel = sample(srcX, srcY);
            d[idx] = pixel[0]; d[idx + 1] = pixel[1]; d[idx + 2] = pixel[2]; d[idx + 3] = pixel[3];
          }
        }
      };

      obj.filters = [...base, filter];
      obj[PERSP_TAG] = true;
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success("Perspectiva aplicada");
    });
  }, [getImage, offsets, fabricCanvas]);

  const removeEffect = useCallback(() => {
    const obj = getImage();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.filters = (obj.filters ?? []).filter((f: any) => !f[PERSP_TAG]);
    obj[PERSP_TAG] = false;
    obj.applyFilters();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    setPreset("none");
    setOffsets(DEFAULT_OFFSETS);
    toast.success("Perspectiva removida");
  }, [getImage, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Maximize2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Perspectiva / Warp</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Maximize2 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para aplicar perspectiva</p>
        </div>
      ) : (
        <>
          {/* Visual preview of perspective points */}
          <div className="relative w-full h-24 bg-muted/30 rounded border border-border overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
              <polygon
                points={`
                  ${10 + offsets.x.tl},${5 + offsets.y.tl}
                  ${190 + offsets.x.tr},${5 + offsets.y.tr}
                  ${190 + offsets.x.br},${75 + offsets.y.br}
                  ${10 + offsets.x.bl},${75 + offsets.y.bl}
                `}
                fill="hsl(var(--primary) / 0.15)"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
              />
              {/* Corner dots */}
              {[
                { cx: 10 + offsets.x.tl, cy: 5 + offsets.y.tl, label: "TL" },
                { cx: 190 + offsets.x.tr, cy: 5 + offsets.y.tr, label: "TR" },
                { cx: 10 + offsets.x.bl, cy: 75 + offsets.y.bl, label: "BL" },
                { cx: 190 + offsets.x.br, cy: 75 + offsets.y.br, label: "BR" },
              ].map(p => (
                <g key={p.label}>
                  <circle cx={p.cx} cy={p.cy} r="4" fill="hsl(var(--primary))" />
                  <text x={p.cx + 5} y={p.cy + 3} fontSize="8" fill="hsl(var(--primary))">{p.label}</text>
                </g>
              ))}
            </svg>
          </div>

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

          {/* Manual controls */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border">
            <span className="text-[9px] text-muted-foreground font-medium">Controle manual dos cantos</span>
            <div className="grid grid-cols-2 gap-2">
              <CornerSlider label="TL" axis="x" corner="tl" offsets={offsets} setOffsets={setOffsets} />
              <CornerSlider label="TR" axis="x" corner="tr" offsets={offsets} setOffsets={setOffsets} />
              <CornerSlider label="BL" axis="x" corner="bl" offsets={offsets} setOffsets={setOffsets} />
              <CornerSlider label="BR" axis="x" corner="br" offsets={offsets} setOffsets={setOffsets} />
              <CornerSlider label="TL" axis="y" corner="tl" offsets={offsets} setOffsets={setOffsets} />
              <CornerSlider label="TR" axis="y" corner="tr" offsets={offsets} setOffsets={setOffsets} />
              <CornerSlider label="BL" axis="y" corner="bl" offsets={offsets} setOffsets={setOffsets} />
              <CornerSlider label="BR" axis="y" corner="br" offsets={offsets} setOffsets={setOffsets} />
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
            <button onClick={applyPerspective}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <Maximize2 className="w-3 h-3" /> Aplicar Perspectiva
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Distorce os 4 cantos independentemente via pixel mapping
          </p>
        </>
      )}
    </div>
  );
}
