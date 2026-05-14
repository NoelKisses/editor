"use client";

import { useCallback, useEffect, useState } from "react";
import { ScanLine, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageCropResizePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const PRESETS = [
  { label: "Livre", w: 0, h: 0 },
  { label: "1:1", w: 1, h: 1 },
  { label: "16:9", w: 16, h: 9 },
  { label: "9:16", w: 9, h: 16 },
  { label: "4:3", w: 4, h: 3 },
  { label: "3:4", w: 3, h: 4 },
  { label: "3:2", w: 3, h: 2 },
  { label: "2:3", w: 2, h: 3 },
];

export function ImageCropResizePanel({ fabricCanvas, selectionVersion }: ImageCropResizePanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [preset, setPreset] = useState("Livre");
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);
  const [newW, setNewW] = useState(400);
  const [newH, setNewH] = useState(300);
  const [lockAspect, setLockAspect] = useState(true);
  const [imgW, setImgW] = useState(1);
  const [imgH, setImgH] = useState(1);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
      if (isImg) {
        const w = Math.round(obj.width * obj.scaleX);
        const h = Math.round(obj.height * obj.scaleY);
        setNewW(w);
        setNewH(h);
        setImgW(w);
        setImgH(h);
        setCropX(0);
        setCropY(0);
        setCropW(Math.round(obj.width));
        setCropH(Math.round(obj.height));
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const applyPreset = useCallback((p: typeof PRESETS[0]) => {
    setPreset(p.label);
    if (p.w === 0) return;
    const ratio = p.w / p.h;
    const naturalW = imgW;
    const naturalH = imgH;
    let cw = naturalW;
    let ch = Math.round(cw / ratio);
    if (ch > naturalH) { ch = naturalH; cw = Math.round(ch * ratio); }
    setCropW(cw);
    setCropH(ch);
    setCropX(Math.round((naturalW - cw) / 2));
    setCropY(Math.round((naturalH - ch) / 2));
  }, [imgW, imgH]);

  const applyCrop = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }
    obj.set({ cropX, cropY, width: cropW, height: cropH });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success(`Recorte aplicado: ${cropW}×${cropH}px`);
  }, [getImage, cropX, cropY, cropW, cropH, fabricCanvas]);

  const applyResize = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }
    obj.set({
      scaleX: newW / obj.width,
      scaleY: newH / obj.height,
    });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success(`Redimensionado para ${newW}×${newH}px`);
  }, [getImage, newW, newH, fabricCanvas]);

  const resetCrop = useCallback(() => {
    const obj = getImage();
    if (!obj) return;
    obj.set({ cropX: 0, cropY: 0, width: obj._originalElement?.naturalWidth ?? obj.width, height: obj._originalElement?.naturalHeight ?? obj.height });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Recorte removido");
  }, [getImage, fabricCanvas]);

  const handleWidthChange = useCallback((v: number) => {
    setNewW(v);
    if (lockAspect && imgW > 0) setNewH(Math.round(v * imgH / imgW));
  }, [lockAspect, imgW, imgH]);

  const handleHeightChange = useCallback((v: number) => {
    setNewH(v);
    if (lockAspect && imgH > 0) setNewW(Math.round(v * imgW / imgH));
  }, [lockAspect, imgW, imgH]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <ScanLine className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Recortar e Redimensionar</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ScanLine className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para recortar ou redimensionar</p>
        </div>
      ) : (
        <>
          {/* Resize section */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
            <span className="text-[9px] font-medium text-muted-foreground">Redimensionar</span>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] text-muted-foreground">Largura</span>
                <input type="number" min={1} value={newW} onChange={e => handleWidthChange(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] text-muted-foreground">Altura</span>
                <input type="number" min={1} value={newH} onChange={e => handleHeightChange(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
              </div>
            </div>
            <button onClick={() => setLockAspect(v => !v)}
              className={`py-0.5 text-[7px] rounded border transition-colors ${lockAspect ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
              {lockAspect ? "Proporção travada" : "Proporção livre"}
            </button>
            <button onClick={applyResize}
              className="py-1 rounded border border-primary text-primary text-[8px] font-medium hover:bg-primary/10 transition-colors">
              Aplicar Redimensionamento
            </button>
          </div>

          {/* Crop section */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
            <span className="text-[9px] font-medium text-muted-foreground">Recortar</span>

            {/* Presets */}
            <div className="flex flex-wrap gap-0.5">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className={`px-1.5 py-0.5 rounded border text-[7px] transition-colors ${preset === p.label ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] text-muted-foreground">Offset X</span>
                <input type="number" min={0} value={cropX} onChange={e => setCropX(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] text-muted-foreground">Offset Y</span>
                <input type="number" min={0} value={cropY} onChange={e => setCropY(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] text-muted-foreground">Largura</span>
                <input type="number" min={1} value={cropW} onChange={e => setCropW(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] text-muted-foreground">Altura</span>
                <input type="number" min={1} value={cropH} onChange={e => setCropH(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <button onClick={resetCrop}
                className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Resetar
              </button>
              <button onClick={applyCrop}
                className="flex items-center justify-center gap-1 py-1.5 rounded border border-primary text-primary text-[8px] font-medium hover:bg-primary/10 transition-colors">
                <ScanLine className="w-3 h-3" /> Recortar
              </button>
            </div>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Usa cropX/cropY do Fabric.js para recorte não-destrutivo
          </p>
        </>
      )}
    </div>
  );
}
