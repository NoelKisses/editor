"use client";

import { useCallback, useEffect, useState } from "react";
import { Crop, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";

interface CropInteractivePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const RATIO_PRESETS = [
  { label: "Livre", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "9:16", ratio: 9 / 16 },
  { label: "3:4", ratio: 3 / 4 },
  { label: "2:3", ratio: 2 / 3 },
];

export function CropInteractivePanel({ fabricCanvas, selectionVersion }: CropInteractivePanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = obj?.type === "image";
      setHasImage(isImg);
      if (isImg) {
        const cX = obj.cropX ?? 0;
        const cY = obj.cropY ?? 0;
        const cW = obj.width ?? 100;
        const cH = obj.height ?? 100;
        setCropX(Math.round(cX));
        setCropY(Math.round(cY));
        setCropW(Math.round(cW));
        setCropH(Math.round(cH));
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getObj = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj?.type === "image" ? obj : null;
  }, [fabricCanvas]);

  const applyCrop = useCallback(() => {
    const obj = getObj();
    if (!obj) { toast.error("Selecione uma imagem"); return; }
    const el = obj.getElement();
    const naturalW = el.naturalWidth || el.width;
    const naturalH = el.naturalHeight || el.height;
    const scaleX = obj.scaleX ?? 1;
    const scaleY = obj.scaleY ?? 1;

    const pxX = Math.max(0, Math.min(cropX, naturalW - 1));
    const pxY = Math.max(0, Math.min(cropY, naturalH - 1));
    const pxW = Math.max(10, Math.min(cropW, naturalW - pxX));
    const pxH = Math.max(10, Math.min(cropH, naturalH - pxY));

    obj.set({
      cropX: pxX,
      cropY: pxY,
      width: pxW,
      height: pxH,
      scaleX,
      scaleY,
    });
    fabricCanvas.requestRenderAll();
    setIsCropping(false);
    toast.success("Recorte aplicado");
  }, [getObj, fabricCanvas, cropX, cropY, cropW, cropH]);

  const resetCrop = useCallback(() => {
    const obj = getObj();
    if (!obj) return;
    const el = obj.getElement();
    const naturalW = el.naturalWidth || el.width;
    const naturalH = el.naturalHeight || el.height;
    obj.set({ cropX: 0, cropY: 0, width: naturalW, height: naturalH });
    fabricCanvas?.requestRenderAll();
    setCropX(0);
    setCropY(0);
    setCropW(naturalW);
    setCropH(naturalH);
    toast.success("Recorte removido");
  }, [getObj, fabricCanvas]);

  const applyRatio = useCallback((ratio: number | null) => {
    setSelectedRatio(ratio);
    if (!ratio) return;
    const obj = getObj();
    if (!obj) return;
    const el = obj.getElement();
    const naturalW = el.naturalWidth || el.width;
    const naturalH = el.naturalHeight || el.height;
    const baseW = naturalW;
    const baseH = Math.round(baseW / ratio);
    const safeH = Math.min(baseH, naturalH);
    const safeW = safeH < naturalH ? Math.round(safeH * ratio) : baseW;
    setCropX(0);
    setCropY(0);
    setCropW(Math.round(safeW));
    setCropH(Math.round(safeH));
  }, [getObj]);

  const updateDimension = useCallback((field: "x" | "y" | "w" | "h", val: number) => {
    if (field === "x") { setCropX(val); return; }
    if (field === "y") { setCropY(val); return; }
    if (field === "w") {
      setCropW(val);
      if (selectedRatio) setCropH(Math.round(val / selectedRatio));
      return;
    }
    if (field === "h") {
      setCropH(val);
      if (selectedRatio) setCropW(Math.round(val * selectedRatio));
    }
  }, [selectedRatio]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Crop className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Recorte de Imagem</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Crop className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para recortar</p>
        </div>
      ) : (
        <>
          {/* Ratio presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Proporção</span>
            <div className="grid grid-cols-4 gap-1">
              {RATIO_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyRatio(p.ratio)}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${selectedRatio === p.ratio ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Crop fields */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Área de recorte (px)</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "X", field: "x" as const, value: cropX },
                { label: "Y", field: "y" as const, value: cropY },
                { label: "Largura", field: "w" as const, value: cropW },
                { label: "Altura", field: "h" as const, value: cropH },
              ].map(item => (
                <div key={item.field} className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-muted-foreground">{item.label}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={item.value}
                    onChange={e => updateDimension(item.field, Number(e.target.value))}
                    className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preview indicator */}
          {isCropping && (
            <div className="p-2 rounded border border-primary/30 bg-primary/5 text-[9px] text-primary text-center">
              Modo recorte ativo — ajuste os valores e clique em Aplicar
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setIsCropping(true)}
              className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Crop className="w-3 h-3" /> Recortar
            </button>
            <button
              onClick={applyCrop}
              className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
            >
              <Check className="w-3 h-3" /> Aplicar
            </button>
            <button
              onClick={resetCrop}
              className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Informe os valores em pixels relativos à imagem original
          </p>
        </>
      )}
    </div>
  );
}

