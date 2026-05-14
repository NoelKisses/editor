"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectOutlineGlowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type GlowStyle = "soft" | "hard" | "double" | "neon" | "inner";

const GLOW_STYLES: { value: GlowStyle; label: string; desc: string }[] = [
  { value: "soft", label: "Suave", desc: "Brilho difuso" },
  { value: "hard", label: "Nítido", desc: "Contorno sólido" },
  { value: "double", label: "Duplo", desc: "Contorno + brilho" },
  { value: "neon", label: "Neon", desc: "Brilho intenso neon" },
  { value: "inner", label: "Interno", desc: "Sombra interna" },
];

export function ObjectOutlineGlowPanel({ fabricCanvas, selectionVersion }: ObjectOutlineGlowPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [style, setStyle] = useState<GlowStyle>("soft");
  const [color, setColor] = useState("#00e5ff");
  const [size, setSize] = useState(15);
  const [opacity, setOpacity] = useState(80);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [hasEffect, setHasEffect] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const valid = !!obj && ["rect", "circle", "triangle", "polygon", "path", "textbox", "text", "i-text", "image"].includes(obj.type);
      setHasObject(valid);
      if (valid) setHasEffect(!!(obj.shadow || (obj.stroke && obj._hasGlow)));
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj ?? null;
  }, [fabricCanvas]);

  const applyGlow = useCallback(() => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const alpha = opacity / 100;

      // Store originals if not already
      if (!obj._hasGlow) {
        obj._origStroke = obj.stroke;
        obj._origStrokeWidth = obj.strokeWidth;
        obj._origShadow = obj.shadow;
      }

      switch (style) {
        case "soft":
          obj.set({ stroke: null, strokeWidth: 0 });
          obj.shadow = new f.Shadow({ color: `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`, blur: size, offsetX: 0, offsetY: 0 });
          break;
        case "hard":
          obj.set({ stroke: color, strokeWidth, strokeDashArray: null });
          obj.shadow = null;
          break;
        case "double":
          obj.set({ stroke: color, strokeWidth });
          obj.shadow = new f.Shadow({ color: `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`, blur: size, offsetX: 0, offsetY: 0 });
          break;
        case "neon": {
          const neonAlpha = Math.round(alpha * 255).toString(16).padStart(2, "0");
          obj.set({ stroke: color, strokeWidth: strokeWidth + 1 });
          obj.shadow = new f.Shadow({ color: `${color}${neonAlpha}`, blur: size * 2, offsetX: 0, offsetY: 0 });
          break;
        }
        case "inner":
          obj.set({ stroke: color, strokeWidth: strokeWidth * 2 });
          obj.shadow = new f.Shadow({ color: `rgba(0,0,0,${alpha * 0.5})`, blur: size / 2, offsetX: 2, offsetY: 2 });
          break;
      }

      obj._hasGlow = true;
      obj.setCoords();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success(`Brilho "${style}" aplicado`);
    });
  }, [getObject, style, color, size, opacity, strokeWidth, fabricCanvas]);

  const removeGlow = useCallback(() => {
    const obj = getObject();
    if (!obj) return;

    obj.set({
      stroke: obj._origStroke ?? null,
      strokeWidth: obj._origStrokeWidth ?? 0,
      shadow: obj._origShadow ?? null,
    });
    obj._hasGlow = false;
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    toast.success("Brilho removido");
  }, [getObject, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Contorno com Brilho</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para aplicar brilho</p>
        </div>
      ) : (
        <>
          {/* Style */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Estilo</span>
            <div className="flex flex-col gap-1">
              {GLOW_STYLES.map(s => (
                <button key={s.value} onClick={() => setStyle(s.value)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded border text-left transition-colors ${style === s.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                  <span className={`text-[9px] font-medium ${style === s.value ? "text-primary" : ""}`}>{s.label}</span>
                  <span className="text-[7px] text-muted-foreground">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">Cor</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="w-7 h-6 rounded border border-border cursor-pointer" />
            <span className="text-[8px] font-mono text-muted-foreground">{color}</span>
          </div>

          {/* Size */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tamanho do brilho</span>
              <span className="text-[9px] tabular-nums">{size}px</span>
            </div>
            <input type="range" min={2} max={50} step={1} value={size}
              onChange={e => setSize(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Stroke width */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espessura do contorno</span>
              <span className="text-[9px] tabular-nums">{strokeWidth}px</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={strokeWidth}
              onChange={e => setStrokeWidth(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Opacidade</span>
              <span className="text-[9px] tabular-nums">{opacity}%</span>
            </div>
            <input type="range" min={10} max={100} step={5} value={opacity}
              onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Preview swatch */}
          <div className="flex items-center justify-center py-3 rounded border border-border bg-muted/20">
            <div className="w-10 h-10 rounded" style={{
              backgroundColor: `${color}22`,
              border: `${strokeWidth}px solid ${color}`,
              boxShadow: `0 0 ${size}px ${color}${Math.round(opacity * 2.55).toString(16).padStart(2, "0")}`,
            }} />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeGlow}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyGlow}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <Sparkles className="w-3 h-3" /> Aplicar Brilho
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Usa fabric.Shadow + stroke para efeitos de contorno
          </p>
        </>
      )}
    </div>
  );
}
