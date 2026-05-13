"use client";

import { useCallback, useEffect, useState } from "react";
import { Palette, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ColorGradientTextPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type GradientDir = "horizontal" | "vertical" | "diagonal" | "radial";

const GRADIENT_PRESETS = [
  { name: "Aurora", c1: "#a855f7", c2: "#3b82f6" },
  { name: "Fogo", c1: "#f97316", c2: "#ef4444" },
  { name: "Oceano", c1: "#06b6d4", c2: "#22c55e" },
  { name: "Ouro", c1: "#f59e0b", c2: "#fde68a" },
  { name: "Pôr do sol", c1: "#ec4899", c2: "#f97316" },
  { name: "Neon", c1: "#a3e635", c2: "#06b6d4" },
];

const DIRS: { label: string; value: GradientDir }[] = [
  { label: "→ Horizontal", value: "horizontal" },
  { label: "↓ Vertical", value: "vertical" },
  { label: "↘ Diagonal", value: "diagonal" },
  { label: "● Radial", value: "radial" },
];

export function ColorGradientTextPanel({ fabricCanvas, selectionVersion }: ColorGradientTextPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [color1, setColor1] = useState("#a855f7");
  const [color2, setColor2] = useState("#3b82f6");
  const [dir, setDir] = useState<GradientDir>("horizontal");
  const [midStop, setMidStop] = useState(false);
  const [colorMid, setColorMid] = useState("#ec4899");

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    queueMicrotask(() => {
      setHasText(["i-text", "textbox", "text"].includes(obj?.type ?? ""));
    });
  }, [fabricCanvas, selectionVersion]);

  const buildGradient = useCallback(async () => {
    const m = await import("fabric");
    const fabric = m.fabric;
    const obj = fabricCanvas?.getActiveObject();
    if (!obj) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = (obj as any).width ?? 200;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = (obj as any).height ?? 50;

    const colorStops = midStop
      ? [{ offset: 0, color: color1 }, { offset: 0.5, color: colorMid }, { offset: 1, color: color2 }]
      : [{ offset: 0, color: color1 }, { offset: 1, color: color2 }];

    if (dir === "radial") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (fabric as any).Gradient({
        type: "radial",
        coords: { x1: w / 2, y1: h / 2, x2: w / 2, y2: h / 2, r1: 0, r2: Math.max(w, h) / 2 },
        colorStops,
        gradientUnits: "pixels",
      });
    }

    const coords = {
      horizontal: { x1: 0, y1: 0, x2: w, y2: 0 },
      vertical: { x1: 0, y1: 0, x2: 0, y2: h },
      diagonal: { x1: 0, y1: 0, x2: w, y2: h },
    }[dir as "horizontal" | "vertical" | "diagonal"];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (fabric as any).Gradient({
      type: "linear",
      coords,
      colorStops,
      gradientUnits: "pixels",
    });
  }, [fabricCanvas, color1, color2, colorMid, dir, midStop]);

  const apply = useCallback(async () => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um texto"); return; }

    const grad = await buildGradient();
    if (!grad) return;
    obj.set({ fill: grad });
    fabricCanvas.requestRenderAll();
    toast.success("Gradiente aplicado ao texto");
  }, [fabricCanvas, buildGradient]);

  const resetSolid = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ fill: "#ffffff" });
    fabricCanvas.requestRenderAll();
    toast.success("Cor sólida restaurada");
  }, [fabricCanvas]);

  const previewStyle = dir === "radial"
    ? `radial-gradient(circle, ${color1}, ${midStop ? colorMid + ", " : ""}${color2})`
    : `linear-gradient(${dir === "horizontal" ? "90deg" : dir === "vertical" ? "180deg" : "135deg"}, ${color1}${midStop ? ", " + colorMid : ""}, ${color2})`;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Gradiente no Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Palette className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para aplicar gradiente</p>
        </div>
      ) : (
        <>
          {/* Preview */}
          <div
            className="w-full h-10 rounded border border-border flex items-center justify-center"
            style={{ background: previewStyle }}
          >
            <span className="text-white font-bold text-sm drop-shadow" style={{ background: previewStyle, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Texto
            </span>
          </div>

          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-3 gap-1">
              {GRADIENT_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { setColor1(p.c1); setColor2(p.c2); }}
                  className="h-7 rounded border border-border/50 text-[8px] text-white font-medium hover:scale-105 transition-transform"
                  style={{ background: `linear-gradient(90deg, ${p.c1}, ${p.c2})` }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cores</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-muted-foreground">Cor inicial</span>
                <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="w-full h-8 rounded cursor-pointer border border-border" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-muted-foreground">Cor final</span>
                <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="w-full h-8 rounded cursor-pointer border border-border" />
              </div>
            </div>

            {/* Mid stop */}
            <div className="flex items-center justify-between p-2 rounded border border-border">
              <span className="text-[9px] text-muted-foreground">Cor intermediária</span>
              <button
                onClick={() => setMidStop(v => !v)}
                className={`relative w-8 h-4 rounded-full transition-colors ${midStop ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${midStop ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            {midStop && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground flex-shrink-0">Cor do meio</span>
                <input type="color" value={colorMid} onChange={e => setColorMid(e.target.value)} className="w-8 h-7 rounded cursor-pointer border border-border" />
              </div>
            )}
          </div>

          {/* Direction */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Direção</span>
            <div className="grid grid-cols-2 gap-1">
              {DIRS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDir(d.value)}
                  className={`py-1.5 rounded border text-[9px] transition-colors ${dir === d.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={apply}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Aplicar
            </button>
            <button
              onClick={resetSolid}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors"
            >
              <Palette className="w-3 h-3" /> Cor sólida
            </button>
          </div>
        </>
      )}
    </div>
  );
}
