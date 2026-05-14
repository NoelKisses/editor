"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Zap, Type, Square, Circle, Minus, Triangle, Star, ArrowRight, Hash } from "lucide-react";
import { toast } from "sonner";

interface CanvasInsertQuickPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ShapePreset {
  key: string;
  label: string;
  icon: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (fabric: any, cx: number, cy: number) => any;
}

const DEFAULT_FILL = "#6366f1";
const DEFAULT_STROKE = "#4f46e5";

export function CanvasInsertQuickPanel({ fabricCanvas, selectionVersion: _sv }: CanvasInsertQuickPanelProps) {
  const [fillColor, setFillColor] = useState(DEFAULT_FILL);
  const [strokeColor, setStrokeColor] = useState(DEFAULT_STROKE);
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [fontSize, setFontSize] = useState(48);
  const [textContent, setTextContent] = useState("Texto");
  const [shortcutsActive, setShortcutsActive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const getCenter = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return { x: 200, y: 200 };
    return { x: cv.getWidth() / 2, y: cv.getHeight() / 2 };
  }, []);

  const insertObject = useCallback((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    creator: (fabric: any, cx: number, cy: number) => any,
    label: string
  ) => {
    const cv = canvasRef.current;
    if (!cv) { toast.error("Canvas não disponível"); return; }
    import("fabric").then(m => {
      const fabric = m.fabric;
      const { x, y } = getCenter();
      const obj = creator(fabric, x, y);
      cv.add(obj);
      cv.setActiveObject(obj);
      cv.requestRenderAll();
      toast.success(`${label} inserido`);
    });
  }, [getCenter]);

  const SHAPES: ShapePreset[] = [
    {
      key: "text",
      label: "Texto",
      icon: <Type className="w-4 h-4" />,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (f: any, cx: number, cy: number) => new f.IText(textContent, {
        left: cx - 80, top: cy - 30,
        fontSize, fill: fillColor, fontFamily: "Arial",
      }),
    },
    {
      key: "rect",
      label: "Retângulo",
      icon: <Square className="w-4 h-4" />,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (f: any, cx: number, cy: number) => new f.Rect({
        left: cx - 80, top: cy - 50, width: 160, height: 100,
        fill: fillColor, stroke: strokeColor, strokeWidth,
      }),
    },
    {
      key: "circle",
      label: "Círculo",
      icon: <Circle className="w-4 h-4" />,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (f: any, cx: number, cy: number) => new f.Circle({
        left: cx - 60, top: cy - 60, radius: 60,
        fill: fillColor, stroke: strokeColor, strokeWidth,
      }),
    },
    {
      key: "triangle",
      label: "Triângulo",
      icon: <Triangle className="w-4 h-4" />,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (f: any, cx: number, cy: number) => new f.Triangle({
        left: cx - 70, top: cy - 60, width: 140, height: 120,
        fill: fillColor, stroke: strokeColor, strokeWidth,
      }),
    },
    {
      key: "line",
      label: "Linha",
      icon: <Minus className="w-4 h-4" />,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (f: any, cx: number, cy: number) => new f.Line([cx - 100, cy, cx + 100, cy], {
        stroke: fillColor, strokeWidth: Math.max(2, strokeWidth), selectable: true,
      }),
    },
    {
      key: "arrow",
      label: "Seta",
      icon: <ArrowRight className="w-4 h-4" />,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (f: any, cx: number, cy: number) => {
        const path = `M ${cx - 80} ${cy} L ${cx + 50} ${cy} L ${cx + 30} ${cy - 20} M ${cx + 50} ${cy} L ${cx + 30} ${cy + 20}`;
        return new f.Path(path, {
          stroke: fillColor, strokeWidth: Math.max(2, strokeWidth),
          fill: "transparent", strokeLineCap: "round", strokeLineJoin: "round",
        });
      },
    },
    {
      key: "star",
      label: "Estrela",
      icon: <Star className="w-4 h-4" />,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (f: any, cx: number, cy: number) => {
        const pts: { x: number; y: number }[] = [];
        const outer = 70, inner = 30, n = 5;
        for (let i = 0; i < n * 2; i++) {
          const r = i % 2 === 0 ? outer : inner;
          const angle = (i * Math.PI) / n - Math.PI / 2;
          pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        }
        return new f.Polygon(pts, {
          left: cx - outer, top: cy - outer,
          fill: fillColor, stroke: strokeColor, strokeWidth,
        });
      },
    },
    {
      key: "rounded-rect",
      label: "Ret. Arredondado",
      icon: <Hash className="w-4 h-4" />,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (f: any, cx: number, cy: number) => new f.Rect({
        left: cx - 90, top: cy - 50, width: 180, height: 100, rx: 20, ry: 20,
        fill: fillColor, stroke: strokeColor, strokeWidth,
      }),
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    if (!shortcutsActive) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const cv = canvasRef.current;
      if (!cv) return;
      const key = e.key.toLowerCase();
      const shape = SHAPES.find(s => s.key[0] === key);
      if (shape) {
        e.preventDefault();
        insertObject(shape.create, shape.label);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcutsActive, fillColor, strokeColor, strokeWidth, fontSize, textContent]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Inserção Rápida</span>
      </div>

      {/* Shape grid */}
      <div className="grid grid-cols-4 gap-1">
        {SHAPES.map(shape => (
          <button key={shape.key}
            onClick={() => insertObject(shape.create, shape.label)}
            className="flex flex-col items-center gap-1 py-2 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
            title={shape.label}>
            {shape.icon}
            <span className="text-[7px]">{shape.label}</span>
          </button>
        ))}
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Conteúdo do texto</span>
        <input type="text" value={textContent} onChange={e => setTextContent(e.target.value)}
          className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
      </div>

      {/* Font size */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">Tamanho</span>
        <input type="number" min={8} max={200} value={fontSize}
          onChange={e => setFontSize(Number(e.target.value))}
          className="w-16 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
        <span className="text-[8px] text-muted-foreground">px</span>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground w-16">Preenchimento</span>
          <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)}
            className="w-7 h-6 rounded border border-border cursor-pointer" />
          <span className="text-[7px] font-mono text-muted-foreground">{fillColor}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground w-16">Contorno</span>
          <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)}
            className="w-7 h-6 rounded border border-border cursor-pointer" />
          <input type="number" min={0} max={20} value={strokeWidth}
            onChange={e => setStrokeWidth(Number(e.target.value))}
            className="w-12 bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
          <span className="text-[7px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* Keyboard shortcuts toggle */}
      <button onClick={() => setShortcutsActive(v => !v)}
        className={`py-1.5 rounded border text-[9px] font-medium transition-colors ${shortcutsActive ? "border-primary bg-primary/10 text-primary animate-pulse" : "border-border text-muted-foreground hover:border-primary/30"}`}>
        {shortcutsActive ? "Atalhos ativos (T/R/C/L/A/S)" : "Ativar atalhos de inserção"}
      </button>

      {shortcutsActive && (
        <div className="grid grid-cols-2 gap-0.5 text-[7px] text-muted-foreground/70">
          <span>T — Texto</span>
          <span>R — Retângulo</span>
          <span>C — Círculo</span>
          <span>L — Linha</span>
          <span>A — Seta</span>
          <span>S — Estrela</span>
          <span>Triang. — T</span>
          <span>Round — H (hash)</span>
        </div>
      )}

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Objetos inseridos no centro do canvas
      </p>
    </div>
  );
}
