"use client";

import { useCallback, useEffect, useState } from "react";
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

interface TextFormatBarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const GOOGLE_FONTS = [
  "Arial", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway",
  "Poppins", "Inter", "Playfair Display", "Merriweather", "Ubuntu", "Nunito",
  "Source Sans Pro", "PT Sans", "Bebas Neue", "Anton", "Pacifico",
  "Dancing Script", "Great Vibes", "Lobster", "Righteous", "Permanent Marker",
];

export function TextFormatBar({ fabricCanvas, selectionVersion }: TextFormatBarProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(48);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [color, setColor] = useState("#ffffff");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion;

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = obj && ["i-text", "textbox", "text"].includes(obj.type);
      if (!isText) { setActive(null); return; }
      setActive(obj);
      setFontFamily(obj.fontFamily ?? "Arial");
      setFontSize(Math.round(obj.fontSize ?? 48));
      setBold(obj.fontWeight === "bold");
      setItalic(obj.fontStyle === "italic");
      setUnderline(!!obj.underline);
      setStrikethrough(!!obj.linethrough);
      setTextAlign((obj.textAlign ?? "left") as typeof textAlign);
      setColor(typeof obj.fill === "string" ? obj.fill : "#ffffff");
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const apply = useCallback((props: Record<string, unknown>) => {
    if (!active || !fabricCanvas) return;
    active.set(props);
    fabricCanvas.requestRenderAll();
  }, [active, fabricCanvas]);

  const loadFont = useCallback(async (family: string) => {
    if (family === "Arial") return;
    const id = `gfont-${family.replace(/\s+/g, "-")}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
      document.head.appendChild(link);
      await document.fonts.ready;
    }
  }, []);

  if (!active) return null;

  return (
    <div className="flex flex-col gap-3 p-3">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Formatação de Texto</span>

      {/* Font + size */}
      <div className="flex gap-2">
        <select
          value={fontFamily}
          onChange={async (e) => {
            const f = e.target.value;
            setFontFamily(f);
            await loadFont(f);
            apply({ fontFamily: f });
          }}
          className="flex-1 text-[11px] bg-background border border-border rounded px-2 py-1 text-foreground outline-none focus:border-primary/50"
        >
          {GOOGLE_FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <input
          type="number"
          value={fontSize}
          min={6}
          max={400}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFontSize(v);
            apply({ fontSize: v });
          }}
          className="w-16 text-[11px] bg-background border border-border rounded px-2 py-1 text-foreground outline-none focus:border-primary/50 tabular-nums"
        />
      </div>

      {/* Style buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => { const v = !bold; setBold(v); apply({ fontWeight: v ? "bold" : "normal" }); }}
          className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${bold ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent/30"}`}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => { const v = !italic; setItalic(v); apply({ fontStyle: v ? "italic" : "normal" }); }}
          className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${italic ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent/30"}`}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => { const v = !underline; setUnderline(v); apply({ underline: v }); }}
          className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${underline ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent/30"}`}
          title="Sublinhado (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => { const v = !strikethrough; setStrikethrough(v); apply({ linethrough: v }); }}
          className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${strikethrough ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent/30"}`}
          title="Tachado"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border mx-0.5" />

        {(["left", "center", "right", "justify"] as const).map((a, i) => {
          const Icon = [AlignLeft, AlignCenter, AlignRight, AlignJustify][i];
          return (
            <button
              key={a}
              onClick={() => { setTextAlign(a); apply({ textAlign: a }); }}
              className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${textAlign === a ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent/30"}`}
              title={["Esquerda", "Centro", "Direita", "Justificado"][i]}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Cor do texto</span>
        <input
          type="color"
          value={color}
          onChange={(e) => { setColor(e.target.value); apply({ fill: e.target.value }); }}
          className="w-7 h-7 rounded cursor-pointer border border-border"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => { setColor(e.target.value); apply({ fill: e.target.value }); }}
          className="flex-1 text-[10px] bg-background border border-border rounded px-2 py-1 text-foreground"
        />

        {/* Quick colors */}
        <div className="flex gap-1">
          {["#ffffff", "#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b"].map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); apply({ fill: c }); }}
              className="w-4 h-4 rounded-full border border-border/60 hover:scale-110 transition-transform"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* Font size quick picks */}
      <div className="flex flex-wrap gap-1">
        {[12, 18, 24, 32, 48, 64, 96, 128].map((s) => (
          <button
            key={s}
            onClick={() => { setFontSize(s); apply({ fontSize: s }); }}
            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${fontSize === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
