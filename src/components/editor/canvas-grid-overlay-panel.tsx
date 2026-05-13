"use client";

import { useCallback, useRef, useState } from "react";
import { Grid3X3, Eye, EyeOff, Trash2 } from "lucide-react";

interface CanvasGridOverlayPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type GridType = "square" | "dots" | "isometric" | "columns" | "rows";

const GRID_TYPES: { value: GridType; label: string }[] = [
  { value: "square", label: "Quadrado" },
  { value: "dots", label: "Pontos" },
  { value: "isometric", label: "Isométrico" },
  { value: "columns", label: "Colunas" },
  { value: "rows", label: "Linhas" },
];

function buildGridCanvas(type: GridType, size: number, color: string, opacity: number, cw: number, ch: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d")!;
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.5;

  switch (type) {
    case "square":
      for (let x = 0; x <= cw; x += size) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
      }
      for (let y = 0; y <= ch; y += size) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
      }
      break;
    case "dots":
      for (let x = 0; x <= cw; x += size) {
        for (let y = 0; y <= ch; y += size) {
          ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
        }
      }
      break;
    case "isometric": {
      const h = size * Math.sqrt(3) / 2;
      for (let y = -size; y <= ch + size; y += h) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y + (cw / size) * h * 0.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y - (cw / size) * h * 0.5); ctx.stroke();
      }
      for (let x = 0; x <= cw; x += size) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
      }
      break;
    }
    case "columns":
      for (let x = 0; x <= cw; x += size) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
      }
      break;
    case "rows":
      for (let y = 0; y <= ch; y += size) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
      }
      break;
  }
  return c;
}

export function CanvasGridOverlayPanel({ fabricCanvas }: CanvasGridOverlayPanelProps) {
  const [gridType, setGridType] = useState<GridType>("square");
  const [size, setSize] = useState(40);
  const [color, setColor] = useState("#6366f1");
  const [opacity, setOpacity] = useState(0.3);
  const [visible, setVisible] = useState(false);
  const [hasGrid, setHasGrid] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imgRef = useRef<any>(null);

  const removeGrid = useCallback(() => {
    if (imgRef.current && fabricCanvas) {
      try { fabricCanvas.remove(imgRef.current); } catch { /* ignore */ }
      imgRef.current = null;
      fabricCanvas.requestRenderAll();
    }
    setVisible(false);
    setHasGrid(false);
  }, [fabricCanvas]);

  const drawGrid = useCallback(async () => {
    if (!fabricCanvas) return;
    removeGrid();

    const cw = Math.round(fabricCanvas.getWidth() / fabricCanvas.getZoom());
    const ch = Math.round(fabricCanvas.getHeight() / fabricCanvas.getZoom());
    const gridCanvas = buildGridCanvas(gridType, size, color, opacity, cw, ch);
    const dataUrl = gridCanvas.toDataURL();

    const m = await import("fabric");
    const fabric = m.fabric;

    fabric.Image.fromURL(dataUrl, (img) => {
      img.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { isGridOverlay: true } as any,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricCanvas.add(img as any);
      // Move to just above background
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricCanvas.sendToBack(img as any);
      fabricCanvas.bringForward(img as unknown as Parameters<typeof fabricCanvas.bringForward>[0]);
      fabricCanvas.requestRenderAll();
      imgRef.current = img;
      setVisible(true);
      setHasGrid(true);
    });
  }, [fabricCanvas, gridType, size, color, opacity, removeGrid]);

  const toggleVisibility = useCallback(() => {
    if (!imgRef.current || !fabricCanvas) return;
    const next = !(imgRef.current.visible ?? true);
    imgRef.current.set({ visible: next });
    fabricCanvas.requestRenderAll();
    setVisible(next);
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Grade Visual</span>
        </div>
        {hasGrid && (
          <button onClick={toggleVisibility} className="text-muted-foreground hover:text-primary transition-colors" title={visible ? "Ocultar" : "Mostrar"}>
            {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo de grade</span>
        <div className="flex flex-wrap gap-1">
          {GRID_TYPES.map(g => (
            <button
              key={g.value}
              onClick={() => setGridType(g.value)}
              className={`px-2 py-1.5 rounded border text-[9px] transition-colors ${gridType === g.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Tamanho da célula</span>
          <span className="text-[9px] tabular-nums">{size}px</span>
        </div>
        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={size}
          onChange={e => setSize(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Opacidade</span>
          <span className="text-[9px] tabular-nums">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={opacity}
          onChange={e => setOpacity(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">Cor</span>
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-8 h-7 rounded cursor-pointer border border-border"
        />
        <div className="flex gap-1">
          {["#6366f1", "#ef4444", "#22c55e", "#f59e0b", "#64748b", "#ffffff"].map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-5 h-5 rounded-sm border border-border/50 hover:scale-110 transition-transform"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={drawGrid}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
        >
          <Grid3X3 className="w-3 h-3" /> Aplicar Grade
        </button>
        <button
          onClick={removeGrid}
          disabled={!hasGrid}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors disabled:opacity-30"
        >
          <Trash2 className="w-3 h-3" /> Remover
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/60 text-center">
        A grade é visual — não aparece na exportação
      </p>
    </div>
  );
}
