"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Magnet } from "lucide-react";
import { toast } from "sonner";

interface CanvasGridSnapPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type GridStyle = "dots" | "lines" | "cross";

const GRID_SIZES = [5, 10, 20, 25, 50, 100];

export function CanvasGridSnapPanel({ fabricCanvas }: CanvasGridSnapPanelProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [gridStyle, setGridStyle] = useState<GridStyle>("lines");
  const [gridColor, setGridColor] = useState("#cccccc");
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [snapThreshold, setSnapThreshold] = useState(8);
  const [showRulers, setShowRulers] = useState(false);
  const [snapToObjects, setSnapToObjects] = useState(false);

  const GRID_LINE_ID = "__grid__";

  const removeGrid = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gridObjs = fabricCanvas.getObjects().filter((o: any) => o.data?.isGrid);
    gridObjs.forEach((o: unknown) => fabricCanvas.remove(o));
  }, [fabricCanvas]);

  const drawGrid = useCallback((size: number, style: GridStyle, color: string, opacity: number) => {
    if (!fabricCanvas) return;
    removeGrid();

    import("fabric").then(m => {
      const fabric = m.fabric;
      const cw = fabricCanvas.width ?? 800;
      const ch = fabricCanvas.height ?? 600;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const makeOpts = () => ({
        stroke: color,
        strokeWidth: style === "cross" ? 1 : 0.5,
        opacity,
        selectable: false,
        evented: false,
        data: { isGrid: true, key: GRID_LINE_ID },
      });

      if (style === "dots") {
        for (let x = 0; x <= cw; x += size) {
          for (let y = 0; y <= ch; y += size) {
            const dot = new f.Circle({ left: x - 1, top: y - 1, radius: 1, fill: color, opacity, selectable: false, evented: false, data: { isGrid: true, key: GRID_LINE_ID } });
            fabricCanvas.add(dot);
            fabricCanvas.sendToBack(dot);
          }
        }
      } else {
        for (let x = 0; x <= cw; x += size) {
          const line = new f.Line([x, 0, x, ch], makeOpts());
          fabricCanvas.add(line);
          fabricCanvas.sendToBack(line);
        }
        for (let y = 0; y <= ch; y += size) {
          const line = new f.Line([0, y, cw, y], makeOpts());
          fabricCanvas.add(line);
          fabricCanvas.sendToBack(line);
        }
        if (style === "cross") {
          const v = new f.Line([cw / 2, 0, cw / 2, ch], { ...makeOpts(), stroke: "hsl(var(--primary))", opacity: 0.3 });
          const h = new f.Line([0, ch / 2, cw, ch / 2], { ...makeOpts(), stroke: "hsl(var(--primary))", opacity: 0.3 });
          fabricCanvas.add(v); fabricCanvas.add(h);
          fabricCanvas.sendToBack(v); fabricCanvas.sendToBack(h);
        }
      }
      fabricCanvas.requestRenderAll();
    });
  }, [fabricCanvas, removeGrid]);

  const toggleGrid = useCallback(() => {
    if (!fabricCanvas) return;
    const next = !showGrid;
    setShowGrid(next);
    if (next) {
      drawGrid(gridSize, gridStyle, gridColor, gridOpacity);
      toast.success("Grade ativada");
    } else {
      removeGrid();
      fabricCanvas.requestRenderAll();
      toast.success("Grade desativada");
    }
  }, [showGrid, fabricCanvas, drawGrid, removeGrid, gridSize, gridStyle, gridColor, gridOpacity]);

  const refreshGrid = useCallback(() => {
    if (showGrid) drawGrid(gridSize, gridStyle, gridColor, gridOpacity);
  }, [showGrid, drawGrid, gridSize, gridStyle, gridColor, gridOpacity]);

  useEffect(() => { refreshGrid(); }, [gridSize, gridStyle, gridColor, gridOpacity, refreshGrid]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMove = (e: any) => {
      if (!snapEnabled) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = e.target;
      if (!obj || obj.data?.isGrid) return;
      const snapX = Math.round(obj.left / gridSize) * gridSize;
      const snapY = Math.round(obj.top / gridSize) * gridSize;
      if (Math.abs(obj.left - snapX) < snapThreshold) obj.set({ left: snapX });
      if (Math.abs(obj.top - snapY) < snapThreshold) obj.set({ top: snapY });
    };

    fabricCanvas.on("object:moving", onMove);
    return () => { fabricCanvas.off("object:moving", onMove); };
  }, [fabricCanvas, snapEnabled, gridSize, snapThreshold]);

  const STYLES: { value: GridStyle; label: string }[] = [
    { value: "lines", label: "Linhas" },
    { value: "dots", label: "Pontos" },
    { value: "cross", label: "Cruz" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Grade e Magnetismo</span>
      </div>

      {/* Grid toggle */}
      <div className="flex items-center justify-between px-2 py-2 rounded border border-border">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px]">Mostrar Grade</span>
        </div>
        <button
          onClick={toggleGrid}
          className={`w-8 h-4 rounded-full transition-colors ${showGrid ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${showGrid ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Snap toggle */}
      <div className="flex items-center justify-between px-2 py-2 rounded border border-border">
        <div className="flex items-center gap-2">
          <Magnet className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px]">Magnetismo à Grade</span>
        </div>
        <button
          onClick={() => { setSnapEnabled(v => !v); toast.success(!snapEnabled ? "Magnetismo ativado" : "Magnetismo desativado"); }}
          className={`w-8 h-4 rounded-full transition-colors ${snapEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${snapEnabled ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Snap to objects */}
      <div className="flex items-center justify-between px-2 py-2 rounded border border-border">
        <div className="flex items-center gap-2">
          <Magnet className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px]">Snap a Objetos</span>
        </div>
        <button
          onClick={() => { setSnapToObjects(v => !v); toast.success(!snapToObjects ? "Snap a objetos ativado" : "Snap desativado"); }}
          className={`w-8 h-4 rounded-full transition-colors ${snapToObjects ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${snapToObjects ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Rulers */}
      <div className="flex items-center justify-between px-2 py-2 rounded border border-border">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px]">Réguas (simulado)</span>
        </div>
        <button
          onClick={() => { setShowRulers(v => !v); toast.success(!showRulers ? "Réguas visíveis" : "Réguas ocultas"); }}
          className={`w-8 h-4 rounded-full transition-colors ${showRulers ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${showRulers ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Grid size */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho da Célula</span>
        <div className="grid grid-cols-6 gap-1">
          {GRID_SIZES.map(s => (
            <button key={s} onClick={() => setGridSize(s)}
              className={`py-1 rounded border text-[8px] transition-colors ${gridSize === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="range" min={5} max={100} step={5} value={gridSize}
            onChange={e => setGridSize(Number(e.target.value))} className="flex-1 accent-primary h-1" />
          <span className="text-[9px] tabular-nums w-8 text-right">{gridSize}px</span>
        </div>
      </div>

      {/* Snap threshold */}
      {snapEnabled && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Distância de Snap</span>
            <span className="text-[9px] tabular-nums">{snapThreshold}px</span>
          </div>
          <input type="range" min={1} max={30} step={1} value={snapThreshold}
            onChange={e => setSnapThreshold(Number(e.target.value))} className="w-full accent-primary h-1" />
        </div>
      )}

      {/* Grid style */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo da Grade</span>
        <div className="grid grid-cols-3 gap-1">
          {STYLES.map(({ value, label }) => (
            <button key={value} onClick={() => setGridStyle(value)}
              className={`py-1.5 rounded border text-[8px] transition-colors ${gridStyle === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid color + opacity */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">Cor</span>
        <input type="color" value={gridColor} onChange={e => setGridColor(e.target.value)}
          className="w-8 h-6 rounded border border-border cursor-pointer" />
        <input type="range" min={0.1} max={1} step={0.05} value={gridOpacity}
          onChange={e => setGridOpacity(Number(e.target.value))} className="flex-1 accent-primary h-1" />
        <span className="text-[8px] text-muted-foreground">{Math.round(gridOpacity * 100)}%</span>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        A grade não é exportada com o design
      </p>
    </div>
  );
}
