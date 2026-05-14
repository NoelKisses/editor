"use client";

import { useCallback, useEffect, useState } from "react";
import { Disc, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageHalftonePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type HalftoneShape = "circle" | "square" | "diamond" | "line";

const HALFTONE_SHAPES: { value: HalftoneShape; label: string }[] = [
  { value: "circle", label: "Círculo" },
  { value: "square", label: "Quadrado" },
  { value: "diamond", label: "Diamante" },
  { value: "line", label: "Linha" },
];

const HALFTONE_TAG = "__halftone__";

export function ImageHalftonePanel({ fabricCanvas, selectionVersion }: ImageHalftonePanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [dotSize, setDotSize] = useState(6);
  const [spacing, setSpacing] = useState(10);
  const [shape, setShape] = useState<HalftoneShape>("circle");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [hasEffect, setHasEffect] = useState(false);
  const [angle, setAngle] = useState(45);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
      if (isImg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHasEffect((obj.filters ?? []).some((f: any) => f._halftone === true));
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });

  const applyHalftone = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = (obj.filters ?? []).filter((fl: any) => !fl._halftone);

      const fg = hexToRgb(fgColor);
      const bg = hexToRgb(bgColor);
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const capturedDotSize = dotSize;
      const capturedSpacing = spacing;
      const capturedShape = shape;

      const halftoneFilter = new f.Image.filters.ColorMatrix({
        matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      });
      halftoneFilter._halftone = true;

      halftoneFilter.applyTo2d = (options: { imageData: ImageData }) => {
        const { imageData } = options;
        const data = imageData.data;
        const w = imageData.width;
        const h = imageData.height;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;

            // Rotate coordinates
            const rx = x * cos + y * sin;
            const ry = -x * sin + y * cos;
            const cx = ((rx % capturedSpacing) + capturedSpacing) % capturedSpacing - capturedSpacing / 2;
            const cy = ((ry % capturedSpacing) + capturedSpacing) % capturedSpacing - capturedSpacing / 2;

            let inside = false;
            const maxR = (capturedDotSize / 2) * (1 - lum);

            switch (capturedShape) {
              case "circle":
                inside = Math.sqrt(cx * cx + cy * cy) < maxR;
                break;
              case "square":
                inside = Math.abs(cx) < maxR && Math.abs(cy) < maxR;
                break;
              case "diamond":
                inside = Math.abs(cx) + Math.abs(cy) < maxR * 1.4;
                break;
              case "line":
                inside = Math.abs(cy) < maxR * 0.5;
                break;
            }

            if (inside) {
              data[idx] = fg.r; data[idx + 1] = fg.g; data[idx + 2] = fg.b;
            } else {
              data[idx] = bg.r; data[idx + 1] = bg.g; data[idx + 2] = bg.b;
            }
          }
        }
      };

      obj.filters = [...base, halftoneFilter];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success("Efeito halftone aplicado");
    });
  }, [getImage, dotSize, spacing, shape, fgColor, bgColor, angle, fabricCanvas]);

  const removeEffect = useCallback(() => {
    const obj = getImage();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.filters = (obj.filters ?? []).filter((f: any) => !f._halftone);
    obj.applyFilters();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    toast.success("Halftone removido");
  }, [getImage, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Disc className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Halftone / Pontilhado</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Disc className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para aplicar halftone</p>
        </div>
      ) : (
        <>
          {/* Shape */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Forma do ponto</span>
            <div className="grid grid-cols-2 gap-1">
              {HALFTONE_SHAPES.map(s => (
                <button key={s.value} onClick={() => setShape(s.value)}
                  className={`py-1 rounded border text-[8px] transition-colors ${shape === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dot size */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tamanho máx. do ponto</span>
              <span className="text-[9px] tabular-nums">{dotSize}px</span>
            </div>
            <input type="range" min={2} max={20} step={1} value={dotSize}
              onChange={e => setDotSize(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Spacing */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espaçamento da grade</span>
              <span className="text-[9px] tabular-nums">{spacing}px</span>
            </div>
            <input type="range" min={4} max={30} step={2} value={spacing}
              onChange={e => setSpacing(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Angle */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Ângulo da grade</span>
              <span className="text-[9px] tabular-nums">{angle}°</span>
            </div>
            <input type="range" min={0} max={90} step={15} value={angle}
              onChange={e => setAngle(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Ponto</span>
              <div className="flex items-center gap-1">
                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                  className="w-7 h-6 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{fgColor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Fundo</span>
              <div className="flex items-center gap-1">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="w-7 h-6 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{bgColor}</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="h-6 rounded border border-border overflow-hidden"
            style={{ background: `radial-gradient(circle, ${fgColor} 30%, ${bgColor} 70%)`, backgroundSize: `${spacing}px ${spacing}px` }} />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeEffect}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyHalftone}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <Disc className="w-3 h-3" /> Aplicar Halftone
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Processamento pixel a pixel com grade rotacionada
          </p>
        </>
      )}
    </div>
  );
}
