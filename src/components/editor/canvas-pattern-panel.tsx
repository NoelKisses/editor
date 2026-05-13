"use client";

import { useCallback, useEffect, useState } from "react";
import { Repeat, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasPatternPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type PatternTarget = "canvas" | "object";
type PatternType = "dots" | "lines" | "checkerboard" | "diagonal" | "crosshatch" | "zigzag" | "hexagon" | "triangles";

interface PatternConfig {
  type: PatternType;
  label: string;
  size: number;
  color1: string;
  color2: string;
  opacity: number;
}

function generatePatternSVG(type: PatternType, size: number, color1: string, color2: string): string {
  const s = size;
  switch (type) {
    case "dots":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${color2}"/><circle cx="${s/2}" cy="${s/2}" r="${s/5}" fill="${color1}"/></svg>`;
    case "lines":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${color2}"/><line x1="0" y1="${s/2}" x2="${s}" y2="${s/2}" stroke="${color1}" stroke-width="${s/8}"/></svg>`;
    case "checkerboard":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s/2}" height="${s/2}" fill="${color1}"/><rect x="${s/2}" y="${s/2}" width="${s/2}" height="${s/2}" fill="${color1}"/><rect x="${s/2}" y="0" width="${s/2}" height="${s/2}" fill="${color2}"/><rect x="0" y="${s/2}" width="${s/2}" height="${s/2}" fill="${color2}"/></svg>`;
    case "diagonal":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${color2}"/><line x1="0" y1="${s}" x2="${s}" y2="0" stroke="${color1}" stroke-width="${s/6}"/></svg>`;
    case "crosshatch":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${color2}"/><line x1="0" y1="${s}" x2="${s}" y2="0" stroke="${color1}" stroke-width="${s/10}"/><line x1="0" y1="0" x2="${s}" y2="${s}" stroke="${color1}" stroke-width="${s/10}"/></svg>`;
    case "zigzag":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${color2}"/><polyline points="0,${s/2} ${s/4},0 ${s/2},${s/2} ${3*s/4},0 ${s},${s/2}" fill="none" stroke="${color1}" stroke-width="${s/8}"/></svg>`;
    case "hexagon":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${color2}"/><polygon points="${s/2},${s/8} ${7*s/8},${3*s/8} ${7*s/8},${5*s/8} ${s/2},${7*s/8} ${s/8},${5*s/8} ${s/8},${3*s/8}" fill="none" stroke="${color1}" stroke-width="${s/12}"/></svg>`;
    case "triangles":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${color2}"/><polygon points="${s/2},0 ${s},${s} 0,${s}" fill="${color1}"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${color2}"/></svg>`;
  }
}

const PATTERN_TYPES: { value: PatternType; label: string }[] = [
  { value: "dots", label: "Pontos" },
  { value: "lines", label: "Linhas" },
  { value: "checkerboard", label: "Xadrez" },
  { value: "diagonal", label: "Diagonal" },
  { value: "crosshatch", label: "Cruzado" },
  { value: "zigzag", label: "Zigzag" },
  { value: "hexagon", label: "Hexágono" },
  { value: "triangles", label: "Triângulos" },
];

export function CanvasPatternPanel({ fabricCanvas, selectionVersion }: CanvasPatternPanelProps) {
  const [target, setTarget] = useState<PatternTarget>("canvas");
  const [hasObject, setHasObject] = useState(false);
  const [config, setConfig] = useState<PatternConfig>({
    type: "dots",
    label: "Pontos",
    size: 30,
    color1: "#4f46e5",
    color2: "#f8fafc",
    opacity: 1,
  });

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj && obj.type !== "activeSelection");
    });
  }, [fabricCanvas, selectionVersion]);

  const updateConfig = useCallback((partial: Partial<PatternConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const applyPattern = useCallback(() => {
    if (!fabricCanvas) return;

    const svgStr = generatePatternSVG(config.type, config.size, config.color1, config.color2);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const patternCanvas = document.createElement("canvas");
      patternCanvas.width = config.size;
      patternCanvas.height = config.size;
      const ctx = patternCanvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return; }
      ctx.globalAlpha = config.opacity;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      import("fabric").then(m => {
        const fabric = m.fabric;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = fabric as any;
        const patternImg = new f.Pattern({
          source: patternCanvas,
          repeat: "repeat",
        });

        if (target === "canvas") {
          fabricCanvas.set({ backgroundColor: patternImg });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const obj: any = fabricCanvas.getActiveObject();
          if (!obj) { toast.error("Selecione um objeto"); return; }
          obj.set({ fill: patternImg });
        }
        fabricCanvas.requestRenderAll();
        toast.success("Padrão aplicado");
      });
    };
    img.src = url;
  }, [fabricCanvas, config, target]);

  const removePattern = useCallback(() => {
    if (!fabricCanvas) return;
    if (target === "canvas") {
      fabricCanvas.set({ backgroundColor: "#ffffff" });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { toast.error("Selecione um objeto"); return; }
      obj.set({ fill: "#ffffff" });
    }
    fabricCanvas.requestRenderAll();
    toast.success("Padrão removido");
  }, [fabricCanvas, target]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Repeat className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Padrões e Texturas</span>
      </div>

      {/* Target */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Aplicar em</span>
        <div className="grid grid-cols-2 gap-1">
          {([["canvas", "Canvas"], ["object", "Objeto Selecionado"]] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setTarget(val)}
              disabled={val === "object" && !hasObject}
              className={`py-1.5 rounded border text-[9px] transition-colors disabled:opacity-40 ${target === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern type */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo de Padrão</span>
        <div className="grid grid-cols-4 gap-1">
          {PATTERN_TYPES.map(p => (
            <button key={p.value} onClick={() => updateConfig({ type: p.value, label: p.label })}
              className={`py-1.5 rounded border text-[8px] transition-colors ${config.type === p.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cores</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-muted-foreground">Principal</span>
            <input type="color" value={config.color1} onChange={e => updateConfig({ color1: e.target.value })}
              className="w-8 h-7 rounded border border-border cursor-pointer" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-muted-foreground">Fundo</span>
            <input type="color" value={config.color2} onChange={e => updateConfig({ color2: e.target.value })}
              className="w-8 h-7 rounded border border-border cursor-pointer" />
          </div>
          <button onClick={() => updateConfig({ color1: config.color2, color2: config.color1 })}
            className="text-[8px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-border">
            ⇌
          </button>
        </div>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Tamanho da Célula</span>
          <span className="text-[9px] tabular-nums">{config.size}px</span>
        </div>
        <input type="range" min={10} max={100} step={5} value={config.size}
          onChange={e => updateConfig({ size: Number(e.target.value) })} className="w-full accent-primary h-1" />
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Opacidade</span>
          <span className="text-[9px] tabular-nums">{Math.round(config.opacity * 100)}%</span>
        </div>
        <input type="range" min={0.1} max={1} step={0.05} value={config.opacity}
          onChange={e => updateConfig({ opacity: Number(e.target.value) })} className="w-full accent-primary h-1" />
      </div>

      {/* Preview */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Prévia</span>
        <div
          className="h-12 rounded border border-border"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(generatePatternSVG(config.type, config.size, config.color1, config.color2))}")`,
            backgroundRepeat: "repeat",
            opacity: config.opacity,
          }}
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={removePattern}
          className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
          <RotateCcw className="w-3 h-3" /> Remover
        </button>
        <button onClick={applyPattern}
          className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
          <Repeat className="w-3 h-3" /> Aplicar
        </button>
      </div>
    </div>
  );
}
