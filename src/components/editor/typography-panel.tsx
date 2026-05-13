"use client";

import { useCallback, useEffect, useState } from "react";
import { Type } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface TypographyPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 112, 128, 144, 160, 192, 220, 256];

const TEXT_ALIGNS = [
  { value: "left", icon: "⫷" },
  { value: "center", icon: "☰" },
  { value: "right", icon: "⫸" },
  { value: "justify", icon: "≡" },
] as const;

function NumericControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onChange(Math.max(min, value - step))}
            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground border border-border rounded text-[10px] transition-colors"
          >
            −
          </button>
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-14 text-center text-[11px] bg-background border border-border rounded py-0.5 text-foreground outline-none focus:border-primary/50"
          />
          <button
            onClick={() => onChange(Math.min(max, value + step))}
            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground border border-border rounded text-[10px] transition-colors"
          >
            +
          </button>
          {suffix && <span className="text-[9px] text-muted-foreground ml-0.5">{suffix}</span>}
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(vals) => onChange(Array.isArray(vals) ? vals[0] : (vals as number))}
        className="h-1"
      />
    </div>
  );
}

export function TypographyPanel({ fabricCanvas, selectionVersion }: TypographyPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [fontSize, setFontSize] = useState(48);
  const [lineHeight, setLineHeight] = useState(1.16);
  const [charSpacing, setCharSpacing] = useState(0);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [uppercase, setUppercase] = useState(false);

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
      setFontSize(Math.round(obj.fontSize ?? 48));
      setLineHeight(parseFloat((obj.lineHeight ?? 1.16).toFixed(2)));
      setCharSpacing(Math.round((obj.charSpacing ?? 0) / 100));
      setTextAlign((obj.textAlign ?? "left") as typeof textAlign);
      setUppercase((obj.data?.textTransform ?? "") === "uppercase");
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const apply = useCallback((props: Record<string, unknown>) => {
    if (!active || !fabricCanvas) return;
    active.set(props);
    fabricCanvas.requestRenderAll();
  }, [active, fabricCanvas]);

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground px-3">
        <Type className="w-6 h-6 opacity-30" />
        <p className="text-[11px] text-center">Selecione um texto para ajustar a tipografia</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Tipografia</span>
      </div>

      {/* Font size with presets */}
      <div className="flex flex-col gap-2">
        <NumericControl
          label="Tamanho"
          value={fontSize}
          min={6}
          max={400}
          step={1}
          suffix="px"
          onChange={(v) => { setFontSize(v); apply({ fontSize: v }); }}
        />
        {/* Quick size presets */}
        <div className="flex flex-wrap gap-1">
          {FONT_SIZES.filter((s) => s <= 96).map((s) => (
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

      {/* Line height */}
      <NumericControl
        label="Altura da Linha"
        value={lineHeight}
        min={0.5}
        max={4}
        step={0.05}
        onChange={(v) => { setLineHeight(v); apply({ lineHeight: v }); }}
      />

      {/* Letter spacing */}
      <NumericControl
        label="Espaçamento entre Letras"
        value={charSpacing}
        min={-20}
        max={100}
        step={1}
        onChange={(v) => { setCharSpacing(v); apply({ charSpacing: v * 100 }); }}
      />

      {/* Text align */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhamento</span>
        <div className="grid grid-cols-4 gap-1">
          {TEXT_ALIGNS.map(({ value, icon }) => (
            <button
              key={value}
              onClick={() => { setTextAlign(value); apply({ textAlign: value }); }}
              className={`py-1.5 rounded border text-sm transition-colors ${textAlign === value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent/30"}`}
              title={value}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Text transform */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Transformação</span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              const newVal = !uppercase;
              setUppercase(newVal);
              if (!active) return;
              const current = active.text ?? "";
              active.set({ text: newVal ? current.toUpperCase() : current.toLowerCase() });
              active.set({ data: { ...(active.data ?? {}), textTransform: newVal ? "uppercase" : "" } });
              fabricCanvas.requestRenderAll();
            }}
            className={`flex-1 text-[10px] py-1.5 rounded border transition-colors ${uppercase ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent/30"}`}
          >
            MAIÚSCULAS
          </button>
          <button
            onClick={() => {
              if (!active) return;
              const words = (active.text ?? "").toLowerCase().split(" ");
              const titled = words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
              active.set({ text: titled });
              fabricCanvas.requestRenderAll();
            }}
            className="flex-1 text-[10px] py-1.5 rounded border border-border text-muted-foreground hover:bg-accent/30 transition-colors"
          >
            Capitalizar
          </button>
        </div>
      </div>

      {/* Font weight shortcuts */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Peso da Fonte</span>
        <div className="grid grid-cols-3 gap-1">
          {(["300", "normal", "bold"] as const).map((w) => (
            <button
              key={w}
              onClick={() => apply({ fontWeight: w })}
              className={`text-[10px] py-1.5 rounded border transition-colors ${active.fontWeight === w ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent/30"}`}
              style={{ fontWeight: w === "300" ? 300 : w === "bold" ? 700 : 400 }}
            >
              {w === "300" ? "Light" : w === "normal" ? "Regular" : "Bold"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
