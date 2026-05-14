"use client";

import { useCallback, useEffect, useState } from "react";
import { PencilRuler, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TextFormattingPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type TextAlign = "left" | "center" | "right" | "justify";
type TextDecoration = "underline" | "linethrough" | "overline";

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72, 96];

const ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
  { value: "left", label: "Esq" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Dir" },
  { value: "justify", label: "Justif." },
];

export function TextFormattingPanel({ fabricCanvas, selectionVersion }: TextFormattingPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [linethrough, setLinethrough] = useState(false);
  const [overline, setOverline] = useState(false);
  const [align, setAlign] = useState<TextAlign>("left");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [lineHeight, setLineHeight] = useState(1.2);
  const [charSpacing, setCharSpacing] = useState(0);
  const [uppercase, setUppercase] = useState(false);
  const [superscript, setSuperscript] = useState(false);
  const [subscript, setSubscript] = useState(false);

  const COMMON_FONTS = ["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Helvetica", "Trebuchet MS", "Impact", "Comic Sans MS"];

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = !!obj && (obj.type === "text" || obj.type === "i-text" || obj.type === "textbox");
      setHasText(isText);
      if (isText) {
        setBold(obj.fontWeight === "bold");
        setItalic(obj.fontStyle === "italic");
        setUnderline(!!obj.underline);
        setLinethrough(!!obj.linethrough);
        setOverline(!!obj.overline);
        setAlign((obj.textAlign as TextAlign) ?? "left");
        setFontSize(Math.round(obj.fontSize ?? 24));
        setFontFamily(obj.fontFamily ?? "Arial");
        setTextColor(typeof obj.fill === "string" ? obj.fill : "#000000");
        setLineHeight(obj.lineHeight ?? 1.2);
        setCharSpacing(obj.charSpacing ?? 0);
        setUppercase(obj._textUppercase ?? false);
        setSuperscript(obj._superscript ?? false);
        setSubscript(obj._subscript ?? false);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getTextObj = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "text" || obj.type === "i-text" || obj.type === "textbox") ? obj : null;
  }, [fabricCanvas]);

  const applyProp = useCallback(<T,>(prop: string, value: T, label?: string) => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }
    obj.set({ [prop]: value });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    if (label) toast.success(label);
  }, [getTextObj, fabricCanvas]);

  const toggleBold = useCallback(() => {
    const next = !bold;
    setBold(next);
    applyProp("fontWeight", next ? "bold" : "normal");
  }, [bold, applyProp]);

  const toggleItalic = useCallback(() => {
    const next = !italic;
    setItalic(next);
    applyProp("fontStyle", next ? "italic" : "normal");
  }, [italic, applyProp]);

  const toggleDecoration = useCallback((dec: TextDecoration) => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }
    const newVal = !obj[dec];
    const setters: Record<TextDecoration, () => void> = {
      underline: () => { setUnderline(newVal); },
      linethrough: () => { setLinethrough(newVal); },
      overline: () => { setOverline(newVal); },
    };
    setters[dec]();
    obj.set({ [dec]: newVal });
    fabricCanvas.requestRenderAll();
  }, [getTextObj, fabricCanvas]);

  const toggleUppercase = useCallback(() => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }
    const next = !uppercase;
    setUppercase(next);
    const originalText = obj._origText ?? obj.text;
    if (!obj._origText) obj._origText = obj.text;
    obj.set({ text: next ? originalText.toUpperCase() : originalText });
    obj._textUppercase = next;
    fabricCanvas.requestRenderAll();
    toast.success(next ? "CAIXA ALTA ativada" : "Caixa alta desativada");
  }, [uppercase, getTextObj, fabricCanvas]);

  const toggleSuperscript = useCallback(() => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }
    const next = !superscript;
    setSuperscript(next);
    if (next) setSubscript(false);
    obj.set({
      fontSize: next ? Math.round((obj._baseFontSize ?? obj.fontSize) * 0.65) : (obj._baseFontSize ?? obj.fontSize),
      top: next ? (obj.top ?? 0) - 8 : (obj.top ?? 0) + 8,
    });
    if (next) obj._baseFontSize = fontSize;
    obj._superscript = next;
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  }, [superscript, getTextObj, fabricCanvas, fontSize]);

  const toggleSubscript = useCallback(() => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }
    const next = !subscript;
    setSubscript(next);
    if (next) setSuperscript(false);
    obj.set({
      fontSize: next ? Math.round((obj._baseFontSize ?? obj.fontSize) * 0.65) : (obj._baseFontSize ?? obj.fontSize),
      top: next ? (obj.top ?? 0) + 8 : (obj.top ?? 0) - 8,
    });
    if (next) obj._baseFontSize = fontSize;
    obj._subscript = next;
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  }, [subscript, getTextObj, fabricCanvas, fontSize]);

  const applyAlign = useCallback((a: TextAlign) => {
    setAlign(a);
    applyProp("textAlign", a, `Alinhamento: ${a}`);
  }, [applyProp]);

  const applyFontSize = useCallback((size: number) => {
    setFontSize(size);
    applyProp("fontSize", size);
  }, [applyProp]);

  const applyFontFamily = useCallback((family: string) => {
    setFontFamily(family);
    applyProp("fontFamily", family, `Fonte: ${family}`);
  }, [applyProp]);

  const applyColor = useCallback((color: string) => {
    setTextColor(color);
    applyProp("fill", color);
  }, [applyProp]);

  const applyLineHeight = useCallback((lh: number) => {
    setLineHeight(lh);
    applyProp("lineHeight", lh);
  }, [applyProp]);

  const applyCharSpacing = useCallback((cs: number) => {
    setCharSpacing(cs);
    applyProp("charSpacing", cs);
  }, [applyProp]);

  const resetAll = useCallback(() => {
    const obj = getTextObj();
    if (!obj) return;
    obj.set({
      fontWeight: "normal", fontStyle: "normal", underline: false,
      linethrough: false, overline: false, textAlign: "left",
      fontSize: 24, fontFamily: "Arial", fill: "#000000",
      lineHeight: 1.2, charSpacing: 0,
    });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setBold(false); setItalic(false); setUnderline(false); setLinethrough(false);
    setOverline(false); setAlign("left"); setFontSize(24); setFontFamily("Arial");
    setTextColor("#000000"); setLineHeight(1.2); setCharSpacing(0);
    setUppercase(false); setSuperscript(false); setSubscript(false);
    toast.success("Formatação resetada");
  }, [getTextObj, fabricCanvas]);

  const btnClass = (active: boolean) =>
    `h-7 px-2 rounded border text-[9px] font-medium transition-colors ${active ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PencilRuler className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Formatação de Texto</span>
        </div>
        {hasText && (
          <button onClick={resetAll} className="text-[7px] text-muted-foreground hover:text-destructive">Reset</button>
        )}
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <PencilRuler className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para formatar</p>
        </div>
      ) : (
        <>
          {/* Style toggles */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Estilo</span>
            <div className="flex flex-wrap gap-1">
              <button onClick={toggleBold} className={btnClass(bold)}><strong>N</strong></button>
              <button onClick={toggleItalic} className={btnClass(italic)}><em>I</em></button>
              <button onClick={() => toggleDecoration("underline")} className={btnClass(underline)}><u>S</u></button>
              <button onClick={() => toggleDecoration("linethrough")} className={btnClass(linethrough)}><s>T</s></button>
              <button onClick={() => toggleDecoration("overline")} className={btnClass(overline)}>O̅</button>
              <button onClick={toggleUppercase} className={btnClass(uppercase)}>AA</button>
              <button onClick={toggleSuperscript} className={btnClass(superscript)}>x²</button>
              <button onClick={toggleSubscript} className={btnClass(subscript)}>x₂</button>
            </div>
          </div>

          {/* Alignment */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Alinhamento</span>
            <div className="flex gap-1">
              {ALIGN_OPTIONS.map(a => (
                <button key={a.value} onClick={() => applyAlign(a.value)}
                  className={`flex-1 py-1 rounded border text-[8px] transition-colors ${align === a.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font family */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Fonte</span>
            <select value={fontFamily} onChange={e => applyFontFamily(e.target.value)}
              className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary">
              {COMMON_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Font size */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Tamanho</span>
            <div className="flex items-center gap-1">
              <input type="number" min={6} max={200} value={fontSize}
                onChange={e => applyFontSize(Number(e.target.value))}
                className="w-16 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              <div className="flex flex-wrap gap-0.5 flex-1">
                {[12, 16, 24, 32, 48].map(s => (
                  <button key={s} onClick={() => applyFontSize(s)}
                    className={`px-1.5 py-0.5 rounded border text-[7px] transition-colors ${fontSize === s ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-0.5 flex-wrap">
              {FONT_SIZES.filter(s => s >= 8 && s <= 36).map(s => (
                <button key={s} onClick={() => applyFontSize(s)}
                  className={`px-1 py-0.5 rounded text-[7px] transition-colors ${fontSize === s ? "bg-primary/20 text-primary" : "text-muted-foreground/50 hover:text-primary"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">Cor</span>
            <input type="color" value={textColor} onChange={e => applyColor(e.target.value)}
              className="w-7 h-6 rounded border border-border cursor-pointer" />
            <span className="text-[7px] font-mono text-muted-foreground">{textColor}</span>
          </div>

          {/* Line height */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Altura da linha</span>
              <span className="text-[9px] tabular-nums">{lineHeight.toFixed(1)}</span>
            </div>
            <input type="range" min={0.8} max={3} step={0.1} value={lineHeight}
              onChange={e => applyLineHeight(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Char spacing */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espaçamento de letras</span>
              <span className="text-[9px] tabular-nums">{charSpacing}</span>
            </div>
            <input type="range" min={-200} max={800} step={10} value={charSpacing}
              onChange={e => applyCharSpacing(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          <button onClick={resetAll}
            className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors">
            <RotateCcw className="w-3 h-3" /> Resetar formatação
          </button>
        </>
      )}
    </div>
  );
}
