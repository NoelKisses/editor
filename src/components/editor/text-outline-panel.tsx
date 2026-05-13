"use client";

import { useCallback, useEffect, useState } from "react";
import { PenLine, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

interface TextOutlinePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type StrokeStyle = "solid" | "dashed" | "dotted";

const COLORS = [
  "#ffffff", "#000000", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899",
];

const STYLES: { value: StrokeStyle; label: string; dash: number[] }[] = [
  { value: "solid", label: "Sólido", dash: [] },
  { value: "dashed", label: "Tracejado", dash: [8, 4] },
  { value: "dotted", label: "Pontilhado", dash: [2, 4] },
];

export function TextOutlinePanel({ fabricCanvas, selectionVersion }: TextOutlinePanelProps) {
  const [hasText, setHasText] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [width, setWidth] = useState(2);
  const [style, setStyle] = useState<StrokeStyle>("solid");
  const [paintFirst, setPaintFirst] = useState<"fill" | "stroke">("fill");

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    queueMicrotask(() => {
      const isText = ["i-text", "textbox", "text"].includes(obj?.type ?? "");
      setHasText(isText);
      if (isText) {
        setEnabled(!!(obj.stroke && obj.stroke !== "" && obj.strokeWidth > 0));
        setColor(obj.stroke || "#ffffff");
        setWidth(obj.strokeWidth || 2);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dashArr = (obj as any).strokeDashArray;
        if (!dashArr || dashArr.length === 0) setStyle("solid");
        else if (dashArr[0] === 2) setStyle("dotted");
        else setStyle("dashed");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPaintFirst((obj as any).paintFirst ?? "fill");
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const apply = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um texto"); return; }

    const dashArr = STYLES.find(s => s.value === style)?.dash ?? [];
    obj.set({
      stroke: enabled ? color : "",
      strokeWidth: enabled ? width : 0,
      strokeDashArray: enabled ? dashArr : [],
      paintFirst,
    });
    fabricCanvas.requestRenderAll();
    toast.success(enabled ? "Contorno aplicado" : "Contorno removido");
  }, [fabricCanvas, enabled, color, width, style, paintFirst]);

  const remove = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ stroke: "", strokeWidth: 0, strokeDashArray: [] });
    fabricCanvas.requestRenderAll();
    setEnabled(false);
    toast.success("Contorno removido");
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Contorno do Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <PenLine className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para adicionar contorno</p>
        </div>
      ) : (
        <>
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-2 rounded border border-border">
            <span className="text-[10px] text-muted-foreground">Ativar contorno</span>
            <button
              onClick={() => setEnabled(v => !v)}
              className={`relative w-8 h-4 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          {enabled && (
            <>
              {/* Color */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor do contorno</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-border"
                  />
                  <span className="text-[9px] font-mono">{color}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-5 h-5 rounded-sm border hover:scale-110 transition-transform ${color === c ? "border-primary ring-1 ring-primary" : "border-border/50"}`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Width */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Espessura</span>
                  <span className="text-[9px] tabular-nums">{width}px</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={width}
                  onChange={e => setWidth(Number(e.target.value))}
                  className="w-full accent-primary h-1"
                />
              </div>

              {/* Style */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo</span>
                <div className="flex gap-1">
                  {STYLES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`flex-1 py-1.5 rounded border text-[9px] transition-colors ${style === s.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paint order */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ordem de pintura</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPaintFirst("fill")}
                    className={`flex-1 py-1.5 rounded border text-[9px] transition-colors ${paintFirst === "fill" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  >
                    Fill sobre stroke
                  </button>
                  <button
                    onClick={() => setPaintFirst("stroke")}
                    className={`flex-1 py-1.5 rounded border text-[9px] transition-colors ${paintFirst === "stroke" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  >
                    Stroke sobre fill
                  </button>
                </div>
                <p className="text-[8px] text-muted-foreground/60">&ldquo;Fill sobre stroke&rdquo; oculta metade da espessura atrás do preenchimento</p>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={apply}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Aplicar
            </button>
            <button
              onClick={remove}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors"
            >
              <X className="w-3 h-3" /> Remover
            </button>
          </div>
        </>
      )}
    </div>
  );
}
