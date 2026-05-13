"use client";

import { useCallback, useEffect, useState } from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Type } from "lucide-react";

interface TextSpacingPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const TEXT_TYPES = ["i-text", "textbox", "text"];

const ALIGN_OPTIONS = [
  { value: "left", icon: AlignLeft, label: "Esquerda" },
  { value: "center", icon: AlignCenter, label: "Centro" },
  { value: "right", icon: AlignRight, label: "Direita" },
  { value: "justify", icon: AlignJustify, label: "Justificado" },
] as const;

type TextAlign = "left" | "center" | "right" | "justify";

export function TextSpacingPanel({ fabricCanvas, selectionVersion }: TextSpacingPanelProps) {
  const [isText, setIsText] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.16);
  const [charSpacing, setCharSpacing] = useState(0);
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [fontSize, setFontSize] = useState(24);
  const [textTransform, setTextTransform] = useState<"none" | "uppercase" | "lowercase" | "capitalize">("none");

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj || !TEXT_TYPES.includes(obj.type)) {
      queueMicrotask(() => setIsText(false));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = obj as any;
    queueMicrotask(() => {
      setIsText(true);
      setLineHeight(t.lineHeight ?? 1.16);
      setCharSpacing(t.charSpacing ?? 0);
      setTextAlign((t.textAlign ?? "left") as TextAlign);
      setFontSize(t.fontSize ?? 24);
      setTextTransform(t.data?.textTransform ?? "none");
    });
  }, [fabricCanvas, selectionVersion]);

  const applyProp = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: Record<string, any>) => {
      if (!fabricCanvas) return;
      const obj = fabricCanvas.getActiveObject();
      if (!obj || !TEXT_TYPES.includes(obj.type)) return;
      obj.set(props);
      fabricCanvas.requestRenderAll();
    },
    [fabricCanvas]
  );

  const handleLineHeight = (v: number) => {
    setLineHeight(v);
    applyProp({ lineHeight: v });
  };

  const handleCharSpacing = (v: number) => {
    setCharSpacing(v);
    applyProp({ charSpacing: v });
  };

  const handleAlign = (align: TextAlign) => {
    setTextAlign(align);
    applyProp({ textAlign: align });
  };

  const handleFontSize = (v: number) => {
    setFontSize(v);
    applyProp({ fontSize: v });
  };

  const handleTextTransform = (transform: typeof textTransform) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj || !TEXT_TYPES.includes(obj.type)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = obj as any;
    const originalText: string = t.data?.originalText ?? t.text ?? "";
    let newText = originalText;
    if (transform === "uppercase") newText = originalText.toUpperCase();
    else if (transform === "lowercase") newText = originalText.toLowerCase();
    else if (transform === "capitalize") newText = originalText.replace(/\b\w/g, (c) => c.toUpperCase());
    t.set({ text: newText });
    t.data = { ...(t.data ?? {}), textTransform: transform, originalText };
    setTextTransform(transform);
    fabricCanvas.requestRenderAll();
  };

  if (!isText) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Type className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground">Selecione um elemento de texto para ajustar espaçamento e alinhamento</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Espaçamento de Texto</span>
      </div>

      {/* Alignment */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhamento</span>
        <div className="flex gap-1">
          {ALIGN_OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => handleAlign(value)}
              title={label}
              className={`flex-1 flex items-center justify-center py-2 rounded border transition-colors ${textAlign === value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho</span>
          <div className="flex items-center gap-1">
            <button onClick={() => handleFontSize(Math.max(8, fontSize - 2))} className="w-5 h-5 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 text-[10px]">−</button>
            <span className="text-[11px] tabular-nums w-8 text-center">{fontSize}</span>
            <button onClick={() => handleFontSize(Math.min(400, fontSize + 2))} className="w-5 h-5 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 text-[10px]">+</button>
          </div>
        </div>
        <input
          type="range" min={8} max={400} step={1} value={fontSize}
          onChange={(e) => handleFontSize(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
        <div className="flex gap-1">
          {[16, 24, 36, 48, 72, 96].map((s) => (
            <button key={s} onClick={() => handleFontSize(s)} className={`flex-1 text-[8px] py-0.5 rounded border transition-colors ${fontSize === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Line height */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Entrelinha</span>
          <span className="text-[10px] tabular-nums">{lineHeight.toFixed(2)}×</span>
        </div>
        <input
          type="range" min={0.5} max={4} step={0.05} value={lineHeight}
          onChange={(e) => handleLineHeight(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
        <div className="flex gap-1">
          {[0.8, 1, 1.15, 1.5, 2].map((v) => (
            <button key={v} onClick={() => handleLineHeight(v)} className={`flex-1 text-[8px] py-0.5 rounded border transition-colors ${Math.abs(lineHeight - v) < 0.03 ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Letter spacing */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Espaç. letras</span>
          <span className="text-[10px] tabular-nums">{charSpacing > 0 ? "+" : ""}{charSpacing}</span>
        </div>
        <input
          type="range" min={-200} max={1000} step={10} value={charSpacing}
          onChange={(e) => handleCharSpacing(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
        <div className="flex gap-1">
          {[-100, 0, 100, 300, 600].map((v) => (
            <button key={v} onClick={() => handleCharSpacing(v)} className={`flex-1 text-[8px] py-0.5 rounded border transition-colors ${charSpacing === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>{v > 0 ? `+${v}` : v}</button>
          ))}
        </div>
      </div>

      {/* Text transform */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Transformação</span>
        <div className="grid grid-cols-4 gap-1">
          {(["none", "uppercase", "lowercase", "capitalize"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTextTransform(t)}
              className={`py-1.5 rounded border text-[8px] transition-colors ${textTransform === t ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {t === "none" ? "Aa" : t === "uppercase" ? "AA" : t === "lowercase" ? "aa" : "Aa*"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {["Normal", "MAIÚSC.", "minúsc.", "Capital"].map((l) => (
            <span key={l} className="text-center text-[7px] text-muted-foreground/50">{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
