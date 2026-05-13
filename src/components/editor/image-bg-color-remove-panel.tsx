"use client";

import { useCallback, useEffect, useState } from "react";
import { Eraser, Pipette, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageBgColorRemovePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function ImageBgColorRemovePanel({ fabricCanvas, selectionVersion }: ImageBgColorRemovePanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [targetColor, setTargetColor] = useState("#ffffff");
  const [tolerance, setTolerance] = useState(30);
  const [feather, setFeather] = useState(5);
  const [processing, setProcessing] = useState(false);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = obj?.type === "image";
      setHasImage(isImg);
      if (isImg) setOriginalDataUrl(null);
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj?.type === "image" ? obj : null;
  }, [fabricCanvas]);

  const pickColorFromCorner = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }
    const el = obj.getElement() as HTMLImageElement;
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = el.naturalWidth || el.width;
    tmpCanvas.height = el.naturalHeight || el.height;
    const ctx = tmpCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(el, 0, 0);
    const px = ctx.getImageData(0, 0, 1, 1).data;
    const hex = "#" + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, "0")).join("");
    setTargetColor(hex);
    toast.success(`Cor selecionada: ${hex.toUpperCase()}`);
  }, [getImage]);

  const removeBackground = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    setProcessing(true);
    const el = obj.getElement() as HTMLImageElement;
    const w = el.naturalWidth || el.width;
    const h = el.naturalHeight || el.height;

    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    const ctx = tmpCanvas.getContext("2d");
    if (!ctx) { setProcessing(false); return; }

    ctx.drawImage(el, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const [tr, tg, tb] = hexToRgb(targetColor);
    const effectiveTolerance = tolerance + feather;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const dist = colorDist(r, g, b, tr, tg, tb);
      if (dist <= tolerance) {
        data[i + 3] = 0;
      } else if (dist <= effectiveTolerance && feather > 0) {
        const ratio = (dist - tolerance) / feather;
        data[i + 3] = Math.round(data[i + 3] * ratio);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const newDataUrl = tmpCanvas.toDataURL("image/png");

    if (!originalDataUrl) {
      setOriginalDataUrl(obj.getElement().src ?? null);
    }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fabric as any).Image.fromURL(newDataUrl, (newImg: any) => {
        newImg.set({
          left: obj.left,
          top: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          flipX: obj.flipX,
          flipY: obj.flipY,
          data: { ...obj.data, bgRemoved: true, originalDataUrl },
        });
        fabricCanvas.remove(obj);
        fabricCanvas.add(newImg);
        fabricCanvas.setActiveObject(newImg);
        fabricCanvas.requestRenderAll();
        setProcessing(false);
        toast.success("Fundo removido com sucesso");
      }, { crossOrigin: "anonymous" });
    });
  }, [getImage, fabricCanvas, targetColor, tolerance, feather, originalDataUrl]);

  const restoreOriginal = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }
    const origUrl = obj.data?.originalDataUrl;
    if (!origUrl) { toast.error("Original não encontrado"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fabric as any).Image.fromURL(origUrl, (restored: any) => {
        restored.set({
          left: obj.left,
          top: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
        });
        fabricCanvas.remove(obj);
        fabricCanvas.add(restored);
        fabricCanvas.setActiveObject(restored);
        fabricCanvas.requestRenderAll();
        setOriginalDataUrl(null);
        toast.success("Imagem original restaurada");
      }, { crossOrigin: "anonymous" });
    });
  }, [getImage, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Eraser className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Remover Fundo por Cor</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Eraser className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para remover o fundo</p>
        </div>
      ) : (
        <>
          {/* Target color */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor a remover</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded border border-border flex-shrink-0" style={{ backgroundColor: targetColor }} />
              <input
                type="color"
                value={targetColor}
                onChange={e => setTargetColor(e.target.value)}
                className="w-10 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[9px] font-mono text-foreground">{targetColor.toUpperCase()}</span>
              <button
                onClick={pickColorFromCorner}
                title="Usar cor do canto superior esquerdo da imagem"
                className="flex items-center gap-1 px-2 py-1 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Pipette className="w-3 h-3" /> Auto
              </button>
            </div>
          </div>

          {/* Common colors */}
          <div className="flex gap-1 flex-wrap">
            {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#00ffff", "#ff00ff"].map(c => (
              <button
                key={c}
                onClick={() => setTargetColor(c)}
                className="w-5 h-5 rounded border-2 transition-all hover:scale-110"
                style={{ backgroundColor: c, borderColor: targetColor === c ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                title={c}
              />
            ))}
          </div>

          {/* Tolerance */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tolerância</span>
              <span className="text-[9px] tabular-nums">{tolerance}</span>
            </div>
            <input type="range" min={0} max={200} step={5} value={tolerance}
              onChange={e => setTolerance(Number(e.target.value))} className="w-full accent-primary h-1" />
            <div className="flex justify-between text-[7px] text-muted-foreground/60 px-0.5">
              <span>Preciso</span><span>Amplo</span>
            </div>
          </div>

          {/* Feather */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Suavização das bordas</span>
              <span className="text-[9px] tabular-nums">{feather}</span>
            </div>
            <input type="range" min={0} max={50} step={1} value={feather}
              onChange={e => setFeather(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Info */}
          <div className="p-2 rounded border border-border bg-muted/10 text-[8px] text-muted-foreground">
            Funciona melhor com fundos de cor sólida (branco, verde-chroma, etc). Para remoção avançada use a IA.
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={restoreOriginal}
              className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Restaurar
            </button>
            <button
              onClick={removeBackground}
              disabled={processing}
              className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40"
            >
              <Eraser className="w-3 h-3" /> {processing ? "Removendo..." : "Remover fundo"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
