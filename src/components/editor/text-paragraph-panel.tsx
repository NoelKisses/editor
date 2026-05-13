"use client";

import { useCallback, useEffect, useState } from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Pilcrow } from "lucide-react";
import { toast } from "sonner";

interface TextParagraphPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type TextAlign = "left" | "center" | "right" | "justify";

const ALIGN_OPTIONS: { value: TextAlign; icon: React.ElementType; label: string }[] = [
  { value: "left", icon: AlignLeft, label: "Esquerda" },
  { value: "center", icon: AlignCenter, label: "Centro" },
  { value: "right", icon: AlignRight, label: "Direita" },
  { value: "justify", icon: AlignJustify, label: "Justificado" },
];

export function TextParagraphPanel({ fabricCanvas, selectionVersion }: TextParagraphPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [lineHeight, setLineHeight] = useState(1.16);
  const [charSpacing, setCharSpacing] = useState(0);
  const [fontSize, setFontSize] = useState(20);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [padding, setPadding] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = ["i-text", "textbox", "text"].includes(obj?.type ?? "");
      setHasText(isText);
      if (isText) {
        setTextAlign((obj.textAlign as TextAlign) ?? "left");
        setLineHeight(obj.lineHeight ?? 1.16);
        setCharSpacing(obj.charSpacing ?? 0);
        setFontSize(obj.fontSize ?? 20);
        setDirection((obj.direction as "ltr" | "rtl") ?? "ltr");
        setPadding(obj.padding ?? 0);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getTextObj = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return ["i-text", "textbox", "text"].includes(obj?.type ?? "") ? obj : null;
  }, [fabricCanvas]);

  const applyAlign = useCallback((align: TextAlign) => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }
    obj.set({ textAlign: align });
    fabricCanvas.requestRenderAll();
    setTextAlign(align);
  }, [getTextObj, fabricCanvas]);

  const applyLineHeight = useCallback((val: number) => {
    const obj = getTextObj();
    if (!obj) return;
    obj.set({ lineHeight: val });
    fabricCanvas.requestRenderAll();
    setLineHeight(val);
  }, [getTextObj, fabricCanvas]);

  const applyCharSpacing = useCallback((val: number) => {
    const obj = getTextObj();
    if (!obj) return;
    obj.set({ charSpacing: val });
    fabricCanvas.requestRenderAll();
    setCharSpacing(val);
  }, [getTextObj, fabricCanvas]);

  const applyFontSize = useCallback((val: number) => {
    const obj = getTextObj();
    if (!obj) return;
    const clamped = Math.max(1, Math.min(500, val));
    obj.set({ fontSize: clamped });
    fabricCanvas.requestRenderAll();
    setFontSize(clamped);
  }, [getTextObj, fabricCanvas]);

  const applyDirection = useCallback((dir: "ltr" | "rtl") => {
    const obj = getTextObj();
    if (!obj) return;
    obj.set({ direction: dir });
    fabricCanvas.requestRenderAll();
    setDirection(dir);
    toast.success(dir === "rtl" ? "Direção direita-para-esquerda" : "Direção esquerda-para-direita");
  }, [getTextObj, fabricCanvas]);

  const applyPadding = useCallback((val: number) => {
    const obj = getTextObj();
    if (!obj) return;
    obj.set({ padding: val });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setPadding(val);
  }, [getTextObj, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Pilcrow className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Parágrafo</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Pilcrow className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para ajustar o parágrafo</p>
        </div>
      ) : (
        <>
          {/* Alignment */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhamento</span>
            <div className="grid grid-cols-4 gap-1">
              {ALIGN_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => applyAlign(opt.value)}
                    title={opt.label}
                    className={`flex items-center justify-center py-2 rounded border text-[10px] transition-colors ${textAlign === opt.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font size */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tamanho da fonte</span>
              <span className="text-[9px] tabular-nums">{fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={6}
                max={300}
                step={1}
                value={fontSize}
                onChange={e => applyFontSize(Number(e.target.value))}
                className="flex-1 accent-primary h-1"
              />
              <input
                type="number"
                min={1}
                max={500}
                step={1}
                value={fontSize}
                onChange={e => applyFontSize(Number(e.target.value))}
                className="w-14 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary text-center"
              />
            </div>
          </div>

          {/* Line height */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espaçamento entre linhas</span>
              <span className="text-[9px] tabular-nums">{lineHeight.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.5}
                max={4}
                step={0.05}
                value={lineHeight}
                onChange={e => applyLineHeight(Number(e.target.value))}
                className="flex-1 accent-primary h-1"
              />
              <input
                type="number"
                min={0.5}
                max={4}
                step={0.05}
                value={lineHeight}
                onChange={e => applyLineHeight(Number(e.target.value))}
                className="w-14 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary text-center"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 mt-0.5">
              {[1, 1.2, 1.5, 2].map(v => (
                <button
                  key={v}
                  onClick={() => applyLineHeight(v)}
                  className={`py-1 rounded border text-[8px] transition-colors ${Math.abs(lineHeight - v) < 0.01 ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {v}×
                </button>
              ))}
            </div>
          </div>

          {/* Char spacing */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espaçamento entre letras</span>
              <span className="text-[9px] tabular-nums">{charSpacing}</span>
            </div>
            <input
              type="range"
              min={-200}
              max={800}
              step={10}
              value={charSpacing}
              onChange={e => applyCharSpacing(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
            <div className="grid grid-cols-4 gap-1">
              {[-100, 0, 100, 300].map(v => (
                <button
                  key={v}
                  onClick={() => applyCharSpacing(v)}
                  className={`py-1 rounded border text-[8px] transition-colors ${charSpacing === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espaçamento interno (padding)</span>
              <span className="text-[9px] tabular-nums">{padding}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={padding}
              onChange={e => applyPadding(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>

          {/* Text direction */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Direção do texto</span>
            <div className="grid grid-cols-2 gap-1">
              {(["ltr", "rtl"] as const).map(dir => (
                <button
                  key={dir}
                  onClick={() => applyDirection(dir)}
                  className={`py-1.5 rounded border text-[9px] font-medium transition-colors ${direction === dir ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {dir === "ltr" ? "← Esq. para Dir." : "→ Dir. para Esq."}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            {textAlign} · lh {lineHeight.toFixed(2)} · cs {charSpacing}
          </p>
        </>
      )}
    </div>
  );
}
