"use client";

import { useCallback, useEffect, useState } from "react";
import { Highlighter, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

interface TextBackgroundPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const PRESET_COLORS = [
  "#ffffff", "#000000", "#fef08a", "#bbf7d0", "#bfdbfe",
  "#fecaca", "#e9d5ff", "#fed7aa", "#f1f5f9", "#1e293b",
];

const PADDING_PRESETS = [0, 4, 8, 12, 16, 24];

export function TextBackgroundPanel({ fabricCanvas, selectionVersion }: TextBackgroundPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [bgColor, setBgColor] = useState("#fef08a");
  const [padding, setPadding] = useState(8);
  const [borderRadius, setBorderRadius] = useState(4);
  const [borderColor, setBorderColor] = useState("");
  const [borderWidth, setBorderWidth] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    queueMicrotask(() => {
      const isText = ["i-text", "textbox", "text"].includes(obj?.type ?? "");
      setHasText(isText);
      if (isText) {
        const bg = obj.backgroundColor;
        setEnabled(!!bg && bg !== "" && bg !== "transparent");
        if (bg && bg !== "" && bg !== "transparent") setBgColor(bg);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meta = (obj as any).data?.textBg ?? {};
        setPadding(meta.padding ?? 8);
        setBorderRadius(meta.borderRadius ?? 4);
        setBorderColor(meta.borderColor ?? "");
        setBorderWidth(meta.borderWidth ?? 0);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const apply = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um texto"); return; }

    if (enabled) {
      obj.set({
        backgroundColor: bgColor,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { ...(obj.data ?? {}), textBg: { padding, borderRadius, borderColor, borderWidth } } as any,
      });

      if (borderWidth > 0 && borderColor) {
        obj.set({ stroke: borderColor, strokeWidth: borderWidth });
      }
    } else {
      obj.set({ backgroundColor: "", stroke: "", strokeWidth: 0 });
    }

    fabricCanvas.requestRenderAll();
    toast.success(enabled ? "Fundo de texto aplicado" : "Fundo removido");
  }, [fabricCanvas, enabled, bgColor, padding, borderRadius, borderColor, borderWidth]);

  const remove = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ backgroundColor: "", stroke: "", strokeWidth: 0 });
    fabricCanvas.requestRenderAll();
    setEnabled(false);
    toast.success("Fundo removido");
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Highlighter className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Fundo do Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Highlighter className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para adicionar fundo</p>
        </div>
      ) : (
        <>
          {/* Toggle */}
          <div className="flex items-center justify-between p-2 rounded border border-border">
            <span className="text-[10px] text-muted-foreground">Ativar fundo</span>
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
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor de fundo</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-border"
                  />
                  <span className="text-[9px] font-mono">{bgColor}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      className={`w-5 h-5 rounded-sm border hover:scale-110 transition-transform ${bgColor === c ? "border-primary ring-1 ring-primary" : "border-border/50"}`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Padding */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Espaçamento interno</span>
                  <span className="text-[9px] tabular-nums">{padding}px</span>
                </div>
                <div className="flex gap-1">
                  {PADDING_PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPadding(p)}
                      className={`flex-1 py-1 rounded border text-[8px] transition-colors ${padding === p ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border radius */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Arredondamento</span>
                  <span className="text-[9px] tabular-nums">{borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={borderRadius}
                  onChange={e => setBorderRadius(Number(e.target.value))}
                  className="w-full accent-primary h-1"
                />
              </div>

              {/* Border */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Borda (opcional)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={borderColor || "#000000"}
                    onChange={e => setBorderColor(e.target.value)}
                    className="w-8 h-7 rounded cursor-pointer border border-border"
                  />
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="text-[8px] text-muted-foreground">Espessura</span>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={1}
                      value={borderWidth}
                      onChange={e => setBorderWidth(Number(e.target.value))}
                      className="w-full accent-primary h-1"
                    />
                  </div>
                  <span className="text-[9px] tabular-nums w-6">{borderWidth}px</span>
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center justify-center p-3 rounded bg-muted/30">
                <span
                  className="text-sm font-medium px-2 py-1"
                  style={{
                    backgroundColor: bgColor,
                    borderRadius: `${borderRadius}px`,
                    border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
                    padding: `${padding / 4}px ${padding / 2}px`,
                  }}
                >
                  Texto de exemplo
                </span>
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

          <p className="text-[8px] text-muted-foreground/50 text-center">
            O fundo segue o tamanho da caixa de texto no Fabric.js
          </p>
        </>
      )}
    </div>
  );
}
