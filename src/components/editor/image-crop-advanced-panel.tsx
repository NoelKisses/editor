"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, RotateCcw, FlipHorizontal, FlipVertical, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ImageCropAdvancedPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "3:4" | "9:16" | "2:3" | "3:2";

const RATIOS: { label: string; value: AspectRatio; ratio?: number }[] = [
  { label: "Livre", value: "free" },
  { label: "1:1", value: "1:1", ratio: 1 },
  { label: "4:3", value: "4:3", ratio: 4 / 3 },
  { label: "16:9", value: "16:9", ratio: 16 / 9 },
  { label: "3:4", value: "3:4", ratio: 3 / 4 },
  { label: "9:16", value: "9:16", ratio: 9 / 16 },
  { label: "2:3", value: "2:3", ratio: 2 / 3 },
  { label: "3:2", value: "3:2", ratio: 3 / 2 },
];

function RatioBadge({ item, selected, onClick }: { item: typeof RATIOS[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[9px] px-2 py-1 rounded border transition-colors ${selected ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
    >
      {item.label}
    </button>
  );
}

export function ImageCropAdvancedPanel({ fabricCanvas, selectionVersion }: ImageCropAdvancedPanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [ratio, setRatio] = useState<AspectRatio>("free");
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objRef = useRef<any>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    queueMicrotask(() => {
      const isImg = obj?.type === "image";
      setHasImage(isImg);
      if (isImg) {
        objRef.current = obj;
        const cr = obj.getCropRect?.() ?? {};
        setCropX(Math.round(cr.left ?? 0));
        setCropY(Math.round(cr.top ?? 0));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCropW(Math.round((obj as any).width ?? 100));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCropH(Math.round((obj as any).height ?? 100));
        setRotation(Math.round(obj.angle ?? 0));
        setFlipX(obj.flipX ?? false);
        setFlipY(obj.flipY ?? false);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const updateCropH = useCallback((w: number, r: AspectRatio) => {
    const found = RATIOS.find(x => x.value === r);
    if (found?.ratio) {
      setCropH(Math.round(w / found.ratio));
    }
  }, []);

  const handleRatio = useCallback((r: AspectRatio) => {
    setRatio(r);
    updateCropH(cropW, r);
  }, [cropW, updateCropH]);

  const handleCropW = useCallback((v: number) => {
    setCropW(v);
    updateCropH(v, ratio);
  }, [ratio, updateCropH]);

  const applyCrop = useCallback(() => {
    const obj = objRef.current;
    if (!obj || !fabricCanvas) return;

    obj.set({
      cropX,
      cropY,
      width: cropW,
      height: cropH,
      angle: rotation,
      flipX,
      flipY,
    });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Recorte aplicado");
  }, [fabricCanvas, cropX, cropY, cropW, cropH, rotation, flipX, flipY]);

  const resetCrop = useCallback(() => {
    const obj = objRef.current;
    if (!obj || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = (obj as any).getElement?.() as HTMLImageElement | undefined;
    if (el) {
      obj.set({
        cropX: 0,
        cropY: 0,
        width: el.naturalWidth || el.width,
        height: el.naturalHeight || el.height,
        angle: 0,
        flipX: false,
        flipY: false,
      });
      obj.setCoords();
      fabricCanvas.requestRenderAll();
      setCropX(0);
      setCropY(0);
      setCropW(el.naturalWidth || el.width);
      setCropH(el.naturalHeight || el.height);
      setRotation(0);
      setFlipX(false);
      setFlipY(false);
      setRatio("free");
      toast.success("Recorte redefinido");
    }
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Crop className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Recorte Avançado</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Crop className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para recortar</p>
        </div>
      ) : (
        <>
          {/* Aspect ratio */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Proporção</span>
            <div className="flex flex-wrap gap-1">
              {RATIOS.map(r => (
                <RatioBadge key={r.value} item={r} selected={ratio === r.value} onClick={() => handleRatio(r.value)} />
              ))}
            </div>
          </div>

          {/* Crop region */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Região do recorte (px)</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "X inicial", value: cropX, set: setCropX },
                { label: "Y inicial", value: cropY, set: setCropY },
                { label: "Largura", value: cropW, set: handleCropW },
                { label: "Altura", value: cropH, set: setCropH },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                  <input
                    type="number"
                    value={value}
                    onChange={e => set(Number(e.target.value))}
                    className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-[10px] tabular-nums focus:outline-none focus:border-primary"
                    min={0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rotation */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Rotação</span>
              <span className="text-[9px] tabular-nums">{rotation}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={e => setRotation(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>

          {/* Flip */}
          <div className="flex gap-2">
            <button
              onClick={() => setFlipX(v => !v)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border text-[10px] transition-colors ${flipX ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              <FlipHorizontal className="w-3 h-3" /> Espelhar H
            </button>
            <button
              onClick={() => setFlipY(v => !v)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border text-[10px] transition-colors ${flipY ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              <FlipVertical className="w-3 h-3" /> Espelhar V
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={applyCrop}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
            >
              <Check className="w-3 h-3" /> Aplicar
            </button>
            <button
              onClick={resetCrop}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors"
            >
              <X className="w-3 h-3" /> Redefinir
            </button>
          </div>

          <div className="flex items-center justify-center gap-1">
            <RotateCcw className="w-3 h-3 text-muted-foreground/40" />
            <p className="text-[8px] text-muted-foreground/50 text-center">
              Ajuste a região, proporção e rotação e clique em Aplicar
            </p>
          </div>
        </>
      )}
    </div>
  );
}
