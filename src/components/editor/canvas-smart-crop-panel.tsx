"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crop } from "lucide-react";
import { toast } from "sonner";

interface CanvasSmartCropPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type Anchor =
  | "tl" | "tc" | "tr"
  | "ml" | "mc" | "mr"
  | "bl" | "bc" | "br";

interface AspectPreset {
  label: string;
  ratio: number | null;
}

const ASPECT_PRESETS: AspectPreset[] = [
  { label: "Livre",  ratio: null },
  { label: "1:1",   ratio: 1 },
  { label: "4:3",   ratio: 4 / 3 },
  { label: "3:4",   ratio: 3 / 4 },
  { label: "16:9",  ratio: 16 / 9 },
  { label: "9:16",  ratio: 9 / 16 },
  { label: "3:2",   ratio: 3 / 2 },
  { label: "2:3",   ratio: 2 / 3 },
  { label: "21:9",  ratio: 21 / 9 },
];

const ANCHORS: { value: Anchor; label: string }[] = [
  { value: "tl", label: "↖" }, { value: "tc", label: "↑" }, { value: "tr", label: "↗" },
  { value: "ml", label: "←" }, { value: "mc", label: "⊙" }, { value: "mr", label: "→" },
  { value: "bl", label: "↙" }, { value: "bc", label: "↓" }, { value: "br", label: "↘" },
];

function computeClipRect(
  imgW: number,
  imgH: number,
  ratio: number | null,
  customW: number,
  customH: number,
  anchor: Anchor
): { left: number; top: number; width: number; height: number } {
  let targetW: number;
  let targetH: number;

  if (ratio === null) {
    // Freeform: use custom dimensions clamped to image size
    targetW = Math.min(Math.max(customW, 1), imgW);
    targetH = Math.min(Math.max(customH, 1), imgH);
  } else {
    // Fit the ratio inside the image (largest rectangle with given ratio)
    const imgRatio = imgW / imgH;
    if (ratio <= imgRatio) {
      // Ratio is taller (or equal): constrained by height
      targetH = imgH;
      targetW = imgH * ratio;
    } else {
      // Ratio is wider: constrained by width
      targetW = imgW;
      targetH = imgW / ratio;
    }
  }

  // Determine offset based on anchor within the image coordinate system
  const colIndex = anchor[1] === "l" ? 0 : anchor[1] === "c" ? 1 : 2;
  const rowIndex = anchor[0] === "t" ? 0 : anchor[0] === "m" ? 1 : 2;

  // Horizontal position fractions: 0, 0.5, 1
  const hFrac = colIndex * 0.5;
  // Vertical position fractions: 0, 0.5, 1
  const vFrac = rowIndex * 0.5;

  const left = hFrac * (imgW - targetW);
  const top = vFrac * (imgH - targetH);

  return { left, top, width: targetW, height: targetH };
}

export function CanvasSmartCropPanel({
  fabricCanvas,
  selectionVersion,
}: CanvasSmartCropPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [hasImage, setHasImage] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(0); // index into ASPECT_PRESETS
  const [anchor, setAnchor] = useState<Anchor>("mc");
  const [customW, setCustomW] = useState(400);
  const [customH, setCustomH] = useState(400);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasImage(!!obj && obj.type === "image");
    });
  }, [fabricCanvas, selectionVersion]);

  const handleApplyCrop = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj || obj.type !== "image") {
      toast.error("Selecione uma imagem para aplicar o recorte.");
      return;
    }

    const imgW = obj.width as number;
    const imgH = obj.height as number;
    const preset = ASPECT_PRESETS[selectedPreset];
    const clipRect = computeClipRect(imgW, imgH, preset.ratio, customW, customH, anchor);

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = m.fabric as any;
        const rect = new f.Rect({
          left: clipRect.left,
          top: clipRect.top,
          width: clipRect.width,
          height: clipRect.height,
          absolutePositioned: false,
        });
        obj.clipPath = rect;
        cv.requestRenderAll();
        toast.success("Recorte aplicado com sucesso.");
      })
      .catch(() => {
        toast.error("Erro ao carregar Fabric.js para aplicar recorte.");
      });
  }, [selectedPreset, anchor, customW, customH]);

  const handleRemoveCrop = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj || obj.type !== "image") {
      toast.error("Selecione uma imagem para remover o recorte.");
      return;
    }

    obj.clipPath = null;
    cv.requestRenderAll();
    toast.success("Recorte removido.");
  }, []);

  const isFreeform = ASPECT_PRESETS[selectedPreset].ratio === null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Crop className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Recorte Inteligente</span>
      </div>

      {!hasImage ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          Selecione uma imagem no canvas para usar o recorte inteligente.
        </div>
      ) : (
        <>
          {/* Aspect ratio presets — 3x3 grid */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Proporção
            </p>
            <div className="grid grid-cols-3 gap-1">
              {ASPECT_PRESETS.map((preset, idx) => (
                <button
                  key={preset.label}
                  onClick={() => setSelectedPreset(idx)}
                  className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    selectedPreset === idx
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom dimensions — only shown for freeform */}
          {isFreeform && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Dimensões personalizadas (px)
              </p>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Largura</label>
                  <input
                    type="number"
                    min={1}
                    value={customW}
                    onChange={(e) => setCustomW(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Altura</label>
                  <input
                    type="number"
                    min={1}
                    value={customH}
                    onChange={(e) => setCustomH(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Anchor point selector — 3x3 grid */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Ponto de ancoragem
            </p>
            <div className="grid w-fit grid-cols-3 gap-1">
              {ANCHORS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setAnchor(value)}
                  title={value}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
                    anchor === value
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleApplyCrop}
              className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-75"
            >
              Aplicar Recorte
            </button>
            <button
              onClick={handleRemoveCrop}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent active:opacity-75"
            >
              Remover Recorte
            </button>
          </div>
        </>
      )}
    </div>
  );
}
