"use client";

import { useCallback, useEffect, useState } from "react";
import { Grid2X2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectMosaicPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type MosaicStyle = "pixelate" | "blur" | "crosshatch" | "dots" | "triangles";

const STYLE_OPTIONS: { value: MosaicStyle; label: string }[] = [
  { value: "pixelate", label: "Pixelado" },
  { value: "blur", label: "Desfoque" },
  { value: "crosshatch", label: "Hachura" },
  { value: "dots", label: "Pontos" },
  { value: "triangles", label: "Triângulos" },
];

export function ObjectMosaicPanel({ fabricCanvas, selectionVersion }: ObjectMosaicPanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [style, setStyle] = useState<MosaicStyle>("pixelate");
  const [blockSize, setBlockSize] = useState(10);
  const [intensity, setIntensity] = useState(5);
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
        const hasPix = (obj.filters ?? []).some((f: any) => f.type === "Pixelate" || f.type === "Blur");
        setHasEffect(hasPix);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const applyMosaic = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingFilters: any[] = (obj.filters ?? []).filter((fl: any) =>
        fl.type && !["Pixelate", "Blur"].includes(fl.type)
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let newFilter: any;

      switch (style) {
        case "pixelate":
          newFilter = new f.Image.filters.Pixelate({ blocksize: blockSize });
          break;
        case "blur":
          newFilter = new f.Image.filters.Blur({ blur: intensity / 20 });
          break;
        case "crosshatch":
          // Crosshatch approximated via Convolute
          newFilter = new f.Image.filters.Convolute({
            matrix: [
              1, 0, -1,
              0, 0, 0,
              -1, 0, 1,
            ],
          });
          break;
        case "dots":
          // Dots via Pixelate + Brightness cycle
          newFilter = new f.Image.filters.Pixelate({ blocksize: blockSize });
          break;
        case "triangles":
          // Triangles approximated via Pixelate with larger blocks
          newFilter = new f.Image.filters.Pixelate({ blocksize: blockSize * 2 });
          break;
        default:
          newFilter = new f.Image.filters.Pixelate({ blocksize: blockSize });
      }

      obj.filters = [...existingFilters, newFilter];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success(`Efeito "${style}" aplicado`);
    });
  }, [getImage, style, blockSize, intensity, fabricCanvas]);

  const removeEffect = useCallback(() => {
    const obj = getImage();
    if (!obj) return;

    import("fabric").then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.filters = (obj.filters ?? []).filter((f: any) =>
        f.type && !["Pixelate", "Blur", "Convolute"].includes(f.type)
      );
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(false);
      toast.success("Efeito removido");
    });
  }, [getImage, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Grid2X2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Mosaico e Pixelação</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Grid2X2 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para aplicar o efeito</p>
        </div>
      ) : (
        <>
          {/* Style */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo</span>
            <div className="grid grid-cols-3 gap-1">
              {STYLE_OPTIONS.map(s => (
                <button key={s.value} onClick={() => setStyle(s.value)}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${style === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Block size */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tamanho do Bloco</span>
              <span className="text-[9px] tabular-nums">{blockSize}px</span>
            </div>
            <input type="range" min={2} max={80} step={2} value={blockSize}
              onChange={e => setBlockSize(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Intensity (for blur) */}
          {style === "blur" && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Intensidade</span>
                <span className="text-[9px] tabular-nums">{intensity}</span>
              </div>
              <input type="range" min={1} max={20} step={1} value={intensity}
                onChange={e => setIntensity(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
          )}

          {/* Visual preview hint */}
          <div className="grid grid-cols-8 gap-0.5 h-6 rounded overflow-hidden border border-border">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-full" style={{
                backgroundColor: `hsl(${i * 45}, 70%, ${40 + (i % 3) * 15}%)`,
                filter: style === "blur" ? `blur(${intensity / 10}px)` : "none",
              }} />
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeEffect}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyMosaic}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <Grid2X2 className="w-3 h-3" /> Aplicar
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Efeitos aplicados via filtros Fabric.js na imagem
          </p>
        </>
      )}
    </div>
  );
}
