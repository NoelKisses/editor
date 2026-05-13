"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface TextAutofitPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type FitMode = "shrink" | "grow" | "both" | "linebreak";

const FIT_MODES: { value: FitMode; label: string; desc: string }[] = [
  { value: "shrink", label: "Diminuir", desc: "Reduz a fonte até caber" },
  { value: "grow", label: "Crescer", desc: "Aumenta a fonte para preencher" },
  { value: "both", label: "Ambos", desc: "Ajusta em qualquer direção" },
  { value: "linebreak", label: "Quebrar Linha", desc: "Ajusta a largura da caixa" },
];

export function TextAutofitPanel({ fabricCanvas, selectionVersion }: TextAutofitPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [fitMode, setFitMode] = useState<FitMode>("shrink");
  const [minFontSize, setMinFontSize] = useState(8);
  const [maxFontSize, setMaxFontSize] = useState(120);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [padding, setPadding] = useState(8);
  const [currentFontSize, setCurrentFontSize] = useState<number | null>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = !!obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text");
      setHasText(isText);
      if (isText) {
        setCurrentFontSize(obj.fontSize ?? 24);
        if (!targetWidth) setTargetWidth(Math.round((obj.width ?? 200) * (obj.scaleX ?? 1)));
        if (!targetHeight) setTargetHeight(Math.round((obj.height ?? 100) * (obj.scaleY ?? 1)));
      }
    });
  }, [fabricCanvas, selectionVersion, targetWidth, targetHeight]);

  const getTextObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text") ? obj : null;
  }, [fabricCanvas]);

  const applyAutofit = useCallback(() => {
    const obj = getTextObject();
    if (!obj) { toast.error("Selecione um texto"); return; }

    const tw = targetWidth || Math.round((obj.width ?? 200) * (obj.scaleX ?? 1));
    const th = targetHeight || Math.round((obj.height ?? 100) * (obj.scaleY ?? 1));
    const availW = tw - padding * 2;
    const availH = th - padding * 2;

    if (fitMode === "linebreak") {
      obj.set({
        width: availW,
        scaleX: 1,
        scaleY: 1,
      });
      obj.setCoords();
      fabricCanvas.requestRenderAll();
      toast.success(`Largura da caixa ajustada para ${availW}px`);
      return;
    }

    // Binary search for optimal font size
    let lo = minFontSize;
    let hi = maxFontSize;
    let bestSize = obj.fontSize ?? 24;

    const testFit = (size: number) => {
      obj.set({ fontSize: size });
      const textW = obj.getScaledWidth?.() ?? obj.width ?? 0;
      const textH = obj.getScaledHeight?.() ?? obj.height ?? 0;
      return { fits: textW <= availW && textH <= availH, textW, textH };
    };

    if (fitMode === "shrink" || fitMode === "both") {
      // Find largest size that fits
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const { fits } = testFit(mid);
        if (fits) {
          bestSize = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
    } else if (fitMode === "grow") {
      // Find smallest size that overflows (then use previous)
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const { fits } = testFit(mid);
        if (fits) {
          bestSize = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
    }

    obj.set({ fontSize: bestSize });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setCurrentFontSize(bestSize);
    toast.success(`Fonte ajustada para ${bestSize}px`);
  }, [getTextObject, fitMode, minFontSize, maxFontSize, targetWidth, targetHeight, padding, fabricCanvas]);

  const captureContainer = useCallback(() => {
    const obj = getTextObject();
    if (!obj) return;
    setTargetWidth(Math.round((obj.width ?? 200) * (obj.scaleX ?? 1)));
    setTargetHeight(Math.round((obj.height ?? 100) * (obj.scaleY ?? 1)));
    toast.success("Dimensões capturadas do objeto");
  }, [getTextObject]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Ajuste Automático de Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ArrowLeftRight className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para ajustar automaticamente</p>
        </div>
      ) : (
        <>
          {currentFontSize !== null && (
            <div className="px-2 py-1.5 rounded border border-border bg-muted/10">
              <span className="text-[8px] text-muted-foreground">Tamanho atual: </span>
              <span className="text-[9px] font-medium">{currentFontSize}px</span>
            </div>
          )}

          {/* Fit mode */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Modo de Ajuste</span>
            <div className="flex flex-col gap-1">
              {FIT_MODES.map(m => (
                <button key={m.value} onClick={() => setFitMode(m.value)}
                  className={`flex items-start gap-2 px-2 py-1.5 rounded border text-left transition-colors ${fitMode === m.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                  <div className="flex-1">
                    <span className={`text-[9px] font-medium ${fitMode === m.value ? "text-primary" : ""}`}>{m.label}</span>
                    <p className="text-[7px] text-muted-foreground">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target dimensions */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Dimensões Alvo</span>
              <button onClick={captureContainer}
                className="flex items-center gap-0.5 text-[8px] text-primary hover:underline">
                <RefreshCw className="w-2.5 h-2.5" /> Capturar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-muted-foreground">Largura (px)</span>
                <input type="number" value={targetWidth} onChange={e => setTargetWidth(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-muted-foreground">Altura (px)</span>
                <input type="number" value={targetHeight} onChange={e => setTargetHeight(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Font size range */}
          {fitMode !== "linebreak" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-muted-foreground">Fonte mínima</span>
                <input type="number" min={4} max={maxFontSize - 1} value={minFontSize}
                  onChange={e => setMinFontSize(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-muted-foreground">Fonte máxima</span>
                <input type="number" min={minFontSize + 1} max={400} value={maxFontSize}
                  onChange={e => setMaxFontSize(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {/* Padding */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Margem Interna</span>
              <span className="text-[9px] tabular-nums">{padding}px</span>
            </div>
            <input type="range" min={0} max={40} step={2} value={padding}
              onChange={e => setPadding(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          <button onClick={applyAutofit}
            className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
            <ArrowLeftRight className="w-3 h-3" /> Ajustar Automaticamente
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Usa busca binária para encontrar o tamanho de fonte ideal
          </p>
        </>
      )}
    </div>
  );
}
