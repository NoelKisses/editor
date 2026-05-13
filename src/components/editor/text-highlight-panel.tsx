"use client";

import { useCallback, useEffect, useState } from "react";
import { Highlighter, X } from "lucide-react";
import { toast } from "sonner";

interface TextHighlightPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type HighlightStyle = "full" | "underline" | "strikethrough" | "overline";
type HighlightShape = "rect" | "rounded" | "wave";

const PRESET_COLORS = [
  "#ffff00", "#adff2f", "#00ffff", "#ff69b4", "#ffa500",
  "#ff6347", "#7fff00", "#e0e0e0", "#ffffff00",
];

const STYLES: { value: HighlightStyle; label: string }[] = [
  { value: "full", label: "Fundo Cheio" },
  { value: "underline", label: "Sublinhado" },
  { value: "strikethrough", label: "Tachado" },
  { value: "overline", label: "Sobrelinhado" },
];

const SHAPES: { value: HighlightShape; label: string }[] = [
  { value: "rect", label: "Retângulo" },
  { value: "rounded", label: "Arredondado" },
  { value: "wave", label: "Ondulado" },
];

function buildWavePath(x: number, y: number, w: number, amplitude: number, freq: number): string {
  let d = `M ${x},${y}`;
  for (let i = 0; i <= w; i += freq) {
    const cy = y + (Math.sin((i / w) * Math.PI * 4) * amplitude);
    d += ` L ${x + i},${cy}`;
  }
  d += ` L ${x + w},${y}`;
  return d;
}

export function TextHighlightPanel({ fabricCanvas, selectionVersion }: TextHighlightPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#ffff00");
  const [highlightOpacity, setHighlightOpacity] = useState(0.5);
  const [style, setStyle] = useState<HighlightStyle>("full");
  const [shape, setShape] = useState<HighlightShape>("rect");
  const [padding, setPadding] = useState(4);
  const [lineHeight, setLineHeight] = useState(8);
  const [hasHighlight, setHasHighlight] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = !!obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text");
      setHasText(isText);
      setHasHighlight(isText && !!obj.data?.__highlight);
    });
  }, [fabricCanvas, selectionVersion]);

  const getTextObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) return null;
    return (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text") ? obj : null;
  }, [fabricCanvas]);

  const applyHighlight = useCallback(() => {
    const obj = getTextObject();
    if (!obj) { toast.error("Selecione um texto"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const textW = obj.width * (obj.scaleX ?? 1);
      const textH = obj.height * (obj.scaleY ?? 1);
      const objL = obj.left ?? 0;
      const objT = obj.top ?? 0;

      const hex = highlightColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const fillColor = `rgba(${r},${g},${b},${highlightOpacity})`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let highlightShape: any;

      if (style === "full") {
        const opts = {
          left: objL - padding,
          top: objT - padding,
          width: textW + padding * 2,
          height: textH + padding * 2,
          fill: fillColor,
          selectable: false,
          evented: false,
          data: { __highlight: true, forObject: obj.data?.id ?? obj.type },
        };

        if (shape === "rect") {
          highlightShape = new f.Rect(opts);
        } else if (shape === "rounded") {
          highlightShape = new f.Rect({ ...opts, rx: 6, ry: 6 });
        } else {
          highlightShape = new f.Rect(opts);
        }
      } else {
        const lineY =
          style === "underline" ? objT + textH + 2 :
          style === "overline" ? objT - lineHeight - 2 :
          objT + textH / 2;

        if (shape === "wave" && style === "underline") {
          const path = buildWavePath(objL, lineY, textW, 3, 8);
          highlightShape = new f.Path(path, {
            stroke: fillColor,
            strokeWidth: 2,
            fill: "",
            selectable: false,
            evented: false,
            data: { __highlight: true },
          });
        } else {
          highlightShape = new f.Rect({
            left: objL,
            top: lineY,
            width: textW,
            height: lineHeight,
            fill: fillColor,
            selectable: false,
            evented: false,
            data: { __highlight: true },
          });
        }
      }

      // Remove previous highlight for this object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = fabricCanvas.getObjects().filter((o: any) => o.data?.__highlight);
      existing.forEach((o: unknown) => fabricCanvas.remove(o));

      fabricCanvas.add(highlightShape);
      fabricCanvas.sendObjectToBack(highlightShape);
      fabricCanvas.requestRenderAll();
      setHasHighlight(true);
      toast.success("Destaque aplicado");
    });
  }, [getTextObject, highlightColor, highlightOpacity, style, shape, padding, lineHeight, fabricCanvas]);

  const removeHighlight = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = fabricCanvas?.getObjects().filter((o: any) => o.data?.__highlight);
    existing?.forEach((o: unknown) => fabricCanvas.remove(o));
    fabricCanvas?.requestRenderAll();
    setHasHighlight(false);
    toast.success("Destaque removido");
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Highlighter className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Marcador de Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Highlighter className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para aplicar destaque</p>
        </div>
      ) : (
        <>
          {hasHighlight && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded border border-primary/30 bg-primary/5">
              <span className="text-[9px] text-primary">Destaque ativo</span>
              <button onClick={removeHighlight}
                className="flex items-center gap-0.5 text-[8px] text-destructive hover:underline">
                <X className="w-2.5 h-2.5" /> Remover
              </button>
            </div>
          )}

          {/* Color */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor do Destaque</span>
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setHighlightColor(c)}
                  title={c}
                  className={`w-6 h-6 rounded border-2 transition-all ${highlightColor === c ? "border-primary scale-110" : "border-border hover:scale-105"}`}
                  style={{ backgroundColor: c === "#ffffff00" ? "transparent" : c, backgroundImage: c === "#ffffff00" ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)" : undefined, backgroundSize: "6px 6px" }} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={highlightColor} onChange={e => setHighlightColor(e.target.value)}
                className="w-8 h-7 rounded border border-border cursor-pointer" />
              <span className="text-[8px] font-mono text-muted-foreground">{highlightColor.toUpperCase()}</span>
            </div>
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Opacidade</span>
              <span className="text-[9px] tabular-nums">{Math.round(highlightOpacity * 100)}%</span>
            </div>
            <input type="range" min={0.05} max={1} step={0.05} value={highlightOpacity}
              onChange={e => setHighlightOpacity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Style */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo</span>
            <div className="grid grid-cols-2 gap-1">
              {STYLES.map(s => (
                <button key={s.value} onClick={() => setStyle(s.value)}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${style === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shape (only for full style) */}
          {style === "full" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Forma</span>
              <div className="grid grid-cols-3 gap-1">
                {SHAPES.map(s => (
                  <button key={s.value} onClick={() => setShape(s.value)}
                    className={`py-1.5 rounded border text-[8px] transition-colors ${shape === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Padding (full style) / Line height (others) */}
          {style === "full" ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Margem Interna</span>
                <span className="text-[9px] tabular-nums">{padding}px</span>
              </div>
              <input type="range" min={0} max={20} step={1} value={padding}
                onChange={e => setPadding(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Espessura da Linha</span>
                <span className="text-[9px] tabular-nums">{lineHeight}px</span>
              </div>
              <input type="range" min={1} max={20} step={1} value={lineHeight}
                onChange={e => setLineHeight(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
          )}

          {/* Apply */}
          <button onClick={applyHighlight}
            className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
            <Highlighter className="w-3 h-3" /> Aplicar Destaque
          </button>
        </>
      )}
    </div>
  );
}
