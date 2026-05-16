"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface CanvasGridBentoPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type Cell = { x: number; y: number; w: number; h: number };

const LAYOUTS: Array<{ id: string; label: string }> = [
  { id: "2x2", label: "2x2" },
  { id: "3x3", label: "3x3" },
  { id: "bento", label: "Bento Clássico" },
  { id: "magazine", label: "Magazine" },
  { id: "dashboard", label: "Dashboard" },
  { id: "mosaico", label: "Mosaico" },
];

function computeGrid(
  rows: number,
  cols: number,
  w: number,
  h: number,
  gap: number,
  padding: number,
): Cell[] {
  const cells: Cell[] = [];
  const innerW = w - padding * 2 - gap * (cols - 1);
  const innerH = h - padding * 2 - gap * (rows - 1);
  const cellW = innerW / cols;
  const cellH = innerH / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        x: padding + c * (cellW + gap),
        y: padding + r * (cellH + gap),
        w: cellW,
        h: cellH,
      });
    }
  }
  return cells;
}

function computeCellsForLayout(
  layout: string,
  w: number,
  h: number,
  gap: number,
  padding: number,
): Cell[] {
  switch (layout) {
    case "2x2":
      return computeGrid(2, 2, w, h, gap, padding);
    case "3x3":
      return computeGrid(3, 3, w, h, gap, padding);
    case "bento": {
      // 1 large (top-left 2x2), 2 medium (right column), 2 small (bottom)
      const cells: Cell[] = [];
      const innerW = w - padding * 2;
      const innerH = h - padding * 2;
      const colW = (innerW - gap * 2) / 3; // 3 col grid
      const rowH = (innerH - gap * 2) / 3; // 3 row grid
      // Large: spans cols 0-1, rows 0-1
      cells.push({
        x: padding,
        y: padding,
        w: colW * 2 + gap,
        h: rowH * 2 + gap,
      });
      // Medium top right
      cells.push({
        x: padding + (colW + gap) * 2,
        y: padding,
        w: colW,
        h: rowH,
      });
      // Medium mid right
      cells.push({
        x: padding + (colW + gap) * 2,
        y: padding + rowH + gap,
        w: colW,
        h: rowH,
      });
      // Small bottom-left (spans col 0-1)
      cells.push({
        x: padding,
        y: padding + (rowH + gap) * 2,
        w: colW * 1.5 + gap / 2,
        h: rowH,
      });
      // Small bottom-right
      cells.push({
        x: padding + colW * 1.5 + gap / 2 + gap,
        y: padding + (rowH + gap) * 2,
        w: colW * 1.5 + gap / 2 - gap,
        h: rowH,
      });
      return cells;
    }
    case "magazine": {
      // 1 large (left full height), 3 small (right stacked)
      const cells: Cell[] = [];
      const innerW = w - padding * 2 - gap;
      const innerH = h - padding * 2;
      const leftW = innerW * 0.6;
      const rightW = innerW * 0.4;
      const smallH = (innerH - gap * 2) / 3;
      cells.push({ x: padding, y: padding, w: leftW, h: innerH });
      for (let i = 0; i < 3; i++) {
        cells.push({
          x: padding + leftW + gap,
          y: padding + i * (smallH + gap),
          w: rightW,
          h: smallH,
        });
      }
      return cells;
    }
    case "dashboard": {
      // header (full width top), 2 cols middle, footer (full width bottom)
      const cells: Cell[] = [];
      const innerW = w - padding * 2;
      const innerH = h - padding * 2;
      const headerH = innerH * 0.18;
      const footerH = innerH * 0.18;
      const midH = innerH - headerH - footerH - gap * 2;
      const colW = (innerW - gap) / 2;
      cells.push({ x: padding, y: padding, w: innerW, h: headerH });
      cells.push({
        x: padding,
        y: padding + headerH + gap,
        w: colW,
        h: midH,
      });
      cells.push({
        x: padding + colW + gap,
        y: padding + headerH + gap,
        w: colW,
        h: midH,
      });
      cells.push({
        x: padding,
        y: padding + headerH + gap + midH + gap,
        w: innerW,
        h: footerH,
      });
      return cells;
    }
    case "mosaico": {
      // Irregular tiled layout
      const cells: Cell[] = [];
      const innerW = w - padding * 2;
      const innerH = h - padding * 2;
      const unitW = (innerW - gap * 3) / 4;
      const unitH = (innerH - gap * 3) / 4;
      // Tile 1: 2x2 top-left
      cells.push({
        x: padding,
        y: padding,
        w: unitW * 2 + gap,
        h: unitH * 2 + gap,
      });
      // Tile 2: 1x1 top mid
      cells.push({
        x: padding + (unitW + gap) * 2,
        y: padding,
        w: unitW,
        h: unitH,
      });
      // Tile 3: 1x2 top-right vertical
      cells.push({
        x: padding + (unitW + gap) * 3,
        y: padding,
        w: unitW,
        h: unitH * 2 + gap,
      });
      // Tile 4: 1x1
      cells.push({
        x: padding + (unitW + gap) * 2,
        y: padding + unitH + gap,
        w: unitW,
        h: unitH,
      });
      // Tile 5: 1x2 bottom-left vertical
      cells.push({
        x: padding,
        y: padding + (unitH + gap) * 2,
        w: unitW,
        h: unitH * 2 + gap,
      });
      // Tile 6: 2x1 horizontal
      cells.push({
        x: padding + unitW + gap,
        y: padding + (unitH + gap) * 2,
        w: unitW * 2 + gap,
        h: unitH,
      });
      // Tile 7: 1x1
      cells.push({
        x: padding + (unitW + gap) * 3,
        y: padding + (unitH + gap) * 2,
        w: unitW,
        h: unitH,
      });
      // Tile 8: 3x1 bottom row
      cells.push({
        x: padding + unitW + gap,
        y: padding + (unitH + gap) * 3,
        w: unitW * 3 + gap * 2,
        h: unitH,
      });
      return cells;
    }
    default:
      return computeGrid(2, 2, w, h, gap, padding);
  }
}

export function CanvasGridBentoPanel({ fabricCanvas }: CanvasGridBentoPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [layout, setLayout] = useState<string>("bento");
  const [gap, setGap] = useState<number>(12);
  const [padding, setPadding] = useState<number>(30);
  const [cellColor, setCellColor] = useState<string>("#f4f4f5");
  const [borderRadius, setBorderRadius] = useState<number>(12);
  const [borderColor, setBorderColor] = useState<string>("#e4e4e7");
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [addShadow, setAddShadow] = useState<boolean>(true);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    const w =
      typeof canvas.getWidth === "function" ? canvas.getWidth() : canvas.width;
    const h =
      typeof canvas.getHeight === "function"
        ? canvas.getHeight()
        : canvas.height;

    const cells = computeCellsForLayout(layout, w, h, gap, padding);

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric ?? (m as any);

        // Remove existing bento cells first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = canvas.getObjects().filter((o: any) => {
          return o?.data?.bentoCell === true;
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existing.forEach((o: any) => canvas.remove(o));

        cells.forEach((cell, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rectOpts: any = {
            left: cell.x,
            top: cell.y,
            width: cell.w,
            height: cell.h,
            fill: cellColor,
            stroke: borderWidth > 0 ? borderColor : undefined,
            strokeWidth: borderWidth,
            rx: borderRadius,
            ry: borderRadius,
            selectable: true,
            hasControls: true,
            data: { bentoCell: true, cellIndex: i },
          };

          if (addShadow) {
            rectOpts.shadow = new f.Shadow({
              color: "rgba(0,0,0,0.15)",
              blur: 12,
              offsetX: 0,
              offsetY: 4,
            });
          }

          const rect = new f.Rect(rectOpts);
          canvas.add(rect);
        });

        canvas.requestRenderAll?.();
        canvas.renderAll?.();
        toast.success(`Bento Grid criado (${cells.length} células)`);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Erro ao carregar fabric");
      });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cells = canvas.getObjects().filter((o: any) => o?.data?.bentoCell === true);
    if (cells.length === 0) {
      toast.info("Nenhum bento grid encontrado");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cells.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll?.();
    canvas.renderAll?.();
    toast.success("Grid removido");
  };

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Grid Bento (Layout Modular)</h3>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium">Preset de Layout</div>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setLayout(preset.id)}
              className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                layout === preset.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>Gap entre células</span>
            <span className="text-muted-foreground">{gap}px</span>
          </div>
          <input
            type="range"
            min={4}
            max={40}
            value={gap}
            onChange={(e) => setGap(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>Padding externo</span>
            <span className="text-muted-foreground">{padding}px</span>
          </div>
          <input
            type="range"
            min={10}
            max={80}
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>Cor da célula</span>
            <span className="text-muted-foreground">{cellColor}</span>
          </div>
          <input
            type="color"
            value={cellColor}
            onChange={(e) => setCellColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-md border border-border bg-background"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>Border radius</span>
            <span className="text-muted-foreground">{borderRadius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            value={borderRadius}
            onChange={(e) => setBorderRadius(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>Cor da borda</span>
            <span className="text-muted-foreground">{borderColor}</span>
          </div>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-md border border-border bg-background"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>Espessura da borda</span>
            <span className="text-muted-foreground">{borderWidth}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={4}
            value={borderWidth}
            onChange={(e) => setBorderWidth(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={addShadow}
            onChange={(e) => setAddShadow(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          <span>Adicionar sombra nas células</span>
        </label>
      </div>

      <div className="space-y-2 pt-2">
        <Button onClick={handleGenerate} className="w-full" size="sm">
          Gerar Bento Grid
        </Button>
        <Button
          onClick={handleRemove}
          variant="outline"
          className="w-full"
          size="sm"
        >
          Remover Grid
        </Button>
      </div>
    </div>
  );
}
