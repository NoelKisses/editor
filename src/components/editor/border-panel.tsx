"use client";

import { useCallback, useEffect, useState } from "react";
import { Square } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface BorderPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type StrokeStyle = "solid" | "dashed" | "dotted" | "double";

const BORDER_PRESETS = [
  { label: "Fina", strokeWidth: 1, stroke: "#ffffff" },
  { label: "Média", strokeWidth: 3, stroke: "#ffffff" },
  { label: "Grossa", strokeWidth: 6, stroke: "#ffffff" },
  { label: "Preta", strokeWidth: 2, stroke: "#000000" },
  { label: "Vermelha", strokeWidth: 2, stroke: "#ef4444" },
  { label: "Dourada", strokeWidth: 2, stroke: "#f59e0b" },
  { label: "Neon", strokeWidth: 3, stroke: "#00ffff" },
  { label: "Rosa", strokeWidth: 2, stroke: "#ec4899" },
];

export function BorderPanel({ fabricCanvas, selectionVersion }: BorderPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>("solid");
  const [rx, setRx] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion;

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setActive(null); return; }
      setActive(obj);
      setStrokeWidth(obj.strokeWidth ?? 0);
      setStrokeColor(typeof obj.stroke === "string" ? obj.stroke : "#ffffff");
      setRx(obj.rx ?? 0);
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const applyStroke = useCallback((props: Record<string, unknown>) => {
    if (!active || !fabricCanvas) return;
    active.set(props);
    fabricCanvas.requestRenderAll();
  }, [active, fabricCanvas]);

  const getDashArray = (style: StrokeStyle, width: number): number[] | null => {
    if (style === "dashed") return [width * 4, width * 2];
    if (style === "dotted") return [width, width * 2];
    return null;
  };

  const applyStyle = useCallback((style: StrokeStyle) => {
    setStrokeStyle(style);
    const dash = getDashArray(style, strokeWidth || 2);
    applyStroke({ strokeDashArray: dash });
  }, [strokeWidth, applyStroke]);

  const removeStroke = useCallback(() => {
    if (!active || !fabricCanvas) return;
    active.set({ stroke: null, strokeWidth: 0, strokeDashArray: null });
    fabricCanvas.requestRenderAll();
    setStrokeWidth(0);
    toast.success("Contorno removido");
  }, [active, fabricCanvas]);

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground px-3">
        <Square className="w-6 h-6 opacity-30" />
        <p className="text-[11px] text-center">Selecione um elemento para ajustar o contorno</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Square className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Contorno</span>
        {strokeWidth > 0 && (
          <button onClick={removeStroke} className="ml-auto text-[10px] text-destructive/70 hover:text-destructive">
            Remover
          </button>
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
        <div className="grid grid-cols-4 gap-1.5">
          {BORDER_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setStrokeWidth(p.strokeWidth);
                setStrokeColor(p.stroke);
                applyStroke({ stroke: p.stroke, strokeWidth: p.strokeWidth, strokeDashArray: null });
                toast.success(`Contorno "${p.label}" aplicado`);
              }}
              className="flex flex-col items-center gap-1 p-1.5 rounded border border-border hover:border-primary/40 hover:bg-accent/20 transition-all"
            >
              <div
                className="w-8 h-8 rounded bg-transparent"
                style={{ border: `${Math.min(p.strokeWidth, 4)}px solid ${p.stroke}` }}
              />
              <span className="text-[8px] text-muted-foreground">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stroke width */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Espessura</span>
          <div className="flex items-center gap-1">
            <button onClick={() => { const v = Math.max(0, strokeWidth - 1); setStrokeWidth(v); applyStroke({ strokeWidth: v, stroke: v > 0 ? strokeColor : null }); }} className="w-5 h-5 border border-border rounded text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center">−</button>
            <span className="text-[11px] tabular-nums w-6 text-center">{strokeWidth}</span>
            <button onClick={() => { const v = strokeWidth + 1; setStrokeWidth(v); applyStroke({ strokeWidth: v, stroke: strokeColor }); }} className="w-5 h-5 border border-border rounded text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center">+</button>
            <span className="text-[9px] text-muted-foreground">px</span>
          </div>
        </div>
        <Slider
          min={0} max={50} step={1}
          value={[strokeWidth]}
          onValueChange={(vals) => {
            const v = Array.isArray(vals) ? vals[0] : (vals as number);
            setStrokeWidth(v);
            applyStroke({ strokeWidth: v, stroke: v > 0 ? strokeColor : null });
          }}
        />
      </div>

      {/* Stroke color */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-12">Cor</span>
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => {
            setStrokeColor(e.target.value);
            if (strokeWidth > 0) applyStroke({ stroke: e.target.value });
          }}
          className="w-8 h-7 rounded cursor-pointer border border-border"
        />
        <input
          type="text"
          value={strokeColor}
          onChange={(e) => {
            setStrokeColor(e.target.value);
            if (strokeWidth > 0) applyStroke({ stroke: e.target.value });
          }}
          className="flex-1 text-[10px] bg-background border border-border rounded px-2 py-1 text-foreground"
        />
      </div>

      {/* Stroke style */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo</span>
        <div className="grid grid-cols-4 gap-1">
          {(["solid", "dashed", "dotted", "double"] as StrokeStyle[]).map((s) => (
            <button
              key={s}
              onClick={() => applyStyle(s)}
              className={`py-1.5 text-[9px] rounded border transition-colors ${strokeStyle === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent/30"}`}
            >
              {s === "solid" ? "Sólido" : s === "dashed" ? "Traço" : s === "dotted" ? "Ponto" : "Duplo"}
            </button>
          ))}
        </div>
      </div>

      {/* Border radius (for rect/textbox) */}
      {(active.type === "rect" || active.type === "textbox" || active.type === "i-text") && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Arredondamento</span>
            <span className="text-[10px] tabular-nums">{rx}px</span>
          </div>
          <Slider
            min={0} max={100} step={1}
            value={[rx]}
            onValueChange={(vals) => {
              const v = Array.isArray(vals) ? vals[0] : (vals as number);
              setRx(v);
              applyStroke({ rx: v, ry: v });
            }}
          />
        </div>
      )}

      {/* Preview */}
      <div className="flex items-center justify-center py-3 bg-muted/30 rounded-lg border border-border">
        <div
          className="w-16 h-12 bg-muted/50"
          style={{
            border: strokeWidth > 0 ? `${Math.min(strokeWidth, 8)}px ${strokeStyle === "dashed" ? "dashed" : strokeStyle === "dotted" ? "dotted" : "solid"} ${strokeColor}` : "1px solid rgba(255,255,255,0.1)",
            borderRadius: rx > 0 ? `${Math.min(rx, 20)}px` : 0,
          }}
        />
      </div>
    </div>
  );
}
