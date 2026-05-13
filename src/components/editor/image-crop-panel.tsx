"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface ImageCropPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

export function ImageCropPanel({ fabricCanvas, selectionVersion }: ImageCropPanelProps) {
  const [isImage, setIsImage] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  // crop values as % of original image size (0-100)
  const [cropLeft, setCropLeft] = useState(0);
  const [cropTop, setCropTop] = useState(0);
  const [cropRight, setCropRight] = useState(0);
  const [cropBottom, setCropBottom] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalImageRef = useRef<any>(null);

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      const obj = fabricCanvas.getActiveObject();
      setIsImage(!!obj && obj.type === "image");
      if (!obj || obj.type !== "image") {
        setIsCropping(false);
        setCropLeft(0); setCropTop(0); setCropRight(0); setCropBottom(0);
      }
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const startCrop = useCallback(() => {
    const obj = fabricCanvas?.getActiveObject();
    if (!obj || obj.type !== "image") return;
    originalImageRef.current = obj;
    // Read existing clipPath if any to restore current crop values
    if (obj.clipPath) {
      const cp = obj.clipPath;
      const iw = obj.width ?? 1;
      const ih = obj.height ?? 1;
      const cl = Math.round(((cp.left ?? 0) + iw / 2) / iw * 100);
      const ct = Math.round(((cp.top ?? 0) + ih / 2) / ih * 100);
      const cr = Math.round((1 - ((cp.left ?? 0) + iw / 2 + (cp.width ?? iw)) / iw) * 100);
      const cb = Math.round((1 - ((cp.top ?? 0) + ih / 2 + (cp.height ?? ih)) / ih) * 100);
      setCropLeft(Math.max(0, cl));
      setCropTop(Math.max(0, ct));
      setCropRight(Math.max(0, cr));
      setCropBottom(Math.max(0, cb));
    } else {
      setCropLeft(0); setCropTop(0); setCropRight(0); setCropBottom(0);
    }
    setIsCropping(true);
  }, [fabricCanvas]);

  const applyClipPath = useCallback(async (l: number, t: number, r: number, b: number) => {
    const obj = originalImageRef.current ?? fabricCanvas?.getActiveObject();
    if (!obj || obj.type !== "image") return;
    const fabric = await import("fabric").then(m => m.fabric);

    const iw = obj.width ?? 1;
    const ih = obj.height ?? 1;

    const clipX = (l / 100) * iw - iw / 2;
    const clipY = (t / 100) * ih - ih / 2;
    const clipW = ((100 - l - r) / 100) * iw;
    const clipH = ((100 - t - b) / 100) * ih;

    if (clipW <= 0 || clipH <= 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rect = new (fabric as any).Rect({
      left: clipX,
      top: clipY,
      width: clipW,
      height: clipH,
      absolutePositioned: false,
    });

    obj.set("clipPath", rect);
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const applyCrop = useCallback(async () => {
    await applyClipPath(cropLeft, cropTop, cropRight, cropBottom);
    setIsCropping(false);
    toast.success("Recorte aplicado");
  }, [applyClipPath, cropLeft, cropTop, cropRight, cropBottom]);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
    setCropLeft(0); setCropTop(0); setCropRight(0); setCropBottom(0);
  }, []);

  const resetCrop = useCallback(() => {
    const obj = fabricCanvas?.getActiveObject();
    if (!obj) return;
    obj.set("clipPath", null);
    fabricCanvas.requestRenderAll();
    setCropLeft(0); setCropTop(0); setCropRight(0); setCropBottom(0);
    toast.success("Recorte removido");
  }, [fabricCanvas]);

  // Live preview while sliders move
  useEffect(() => {
    if (!isCropping) return;
    applyClipPath(cropLeft, cropTop, cropRight, cropBottom);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropLeft, cropTop, cropRight, cropBottom, isCropping]);

  if (!isImage) {
    return (
      <div className="p-3 text-[11px] text-muted-foreground/60 text-center">
        Selecione uma imagem para recortar
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Crop className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Recorte de Imagem</span>
      </div>

      {!isCropping ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={startCrop}
            className="w-full py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
          >
            <Crop className="w-3.5 h-3.5" />
            Iniciar Recorte
          </button>
          <button
            onClick={resetCrop}
            className="w-full py-1.5 rounded-lg border border-border text-muted-foreground text-xs hover:text-foreground hover:bg-accent/30 transition-colors"
          >
            Remover Recorte
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-muted-foreground/70">
            Arraste os sliders para recortar a imagem
          </p>

          {[
            { label: "Topo", value: cropTop, set: setCropTop },
            { label: "Base", value: cropBottom, set: setCropBottom },
            { label: "Esquerda", value: cropLeft, set: setCropLeft },
            { label: "Direita", value: cropRight, set: setCropRight },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">{label}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">{value}%</span>
              </div>
              <Slider
                min={0}
                max={49}
                step={1}
                value={[value]}
                onValueChange={(v) => set((v as number[])[0])}
                className="w-full"
              />
            </div>
          ))}

          <div className="flex gap-2 mt-1">
            <button
              onClick={applyCrop}
              className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Aplicar
            </button>
            <button
              onClick={cancelCrop}
              className="flex-1 py-1.5 rounded-lg border border-border text-muted-foreground text-xs hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
