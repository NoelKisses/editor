"use client";

import { useCallback, useRef, useState } from "react";
import { Grid2X2, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasPixelArtPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const PIXEL_PALETTES = [
  { name: "Clássico", colors: ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"] },
  { name: "Pastel", colors: ["#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff", "#e8baff", "#ffd1dc", "#c9f0ff"] },
  { name: "Retro", colors: ["#1a1c2c", "#5d275d", "#b13e53", "#ef7d57", "#ffcd75", "#a7f070", "#38b764", "#257179"] },
  { name: "Monocromático", colors: ["#000000", "#1c1c1c", "#383838", "#555555", "#717171", "#8d8d8d", "#aaaaaa", "#c6c6c6"] },
];

const GRID_SIZES = [8, 16, 24, 32];
const PIXEL_TAG = "__pixel__";

export function CanvasPixelArtPanel({ fabricCanvas }: CanvasPixelArtPanelProps) {
  const [gridSize, setGridSize] = useState(16);
  const [pixelSize, setPixelSize] = useState(20);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [palette, setPalette] = useState(PIXEL_PALETTES[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pixelHandlersRef = useRef<{ down: any; move: any } | null>(null);
  const [offsetX, setOffsetX] = useState(50);
  const [offsetY, setOffsetY] = useState(50);

  const snapToGrid = useCallback((val: number, psize: number) => Math.round(val / psize) * psize, []);

  const drawPixel = useCallback((px: number, py: number) => {
    if (!fabricCanvas) return;

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const gx = snapToGrid(px - offsetX, pixelSize);
      const gy = snapToGrid(py - offsetY, pixelSize);

      // Remove existing pixel at same grid position
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = fabricCanvas.getObjects().find((o: any) =>
        o.data?.[PIXEL_TAG] && o.left === offsetX + gx && o.top === offsetY + gy
      );
      if (existing) fabricCanvas.remove(existing);

      if (selectedColor === "transparent") return;

      const rect = new f.Rect({
        left: offsetX + gx,
        top: offsetY + gy,
        width: pixelSize - 1,
        height: pixelSize - 1,
        fill: selectedColor,
        stroke: "none",
        selectable: false,
        evented: false,
        data: { [PIXEL_TAG]: true, gx, gy },
      });
      fabricCanvas.add(rect);
      fabricCanvas.requestRenderAll();
    });
  }, [fabricCanvas, selectedColor, pixelSize, offsetX, offsetY, snapToGrid]);

  const startDrawing = useCallback(() => {
    if (!fabricCanvas || isDrawing) return;
    setIsDrawing(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      const pt = e.absolutePointer ?? e.pointer;
      if (pt) drawPixel(pt.x, pt.y);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moveHandler = (e: any) => {
      if (e.e?.buttons !== 1) return;
      const pt = e.absolutePointer ?? e.pointer;
      if (pt) drawPixel(pt.x, pt.y);
    };

    fabricCanvas.on("mouse:down", handler);
    fabricCanvas.on("mouse:move", moveHandler);
    pixelHandlersRef.current = { down: handler, move: moveHandler };
    toast.success(`Desenhando pixels ${pixelSize}px — clique no canvas`);
  }, [fabricCanvas, isDrawing, drawPixel, pixelSize]);

  const stopDrawing = useCallback(() => {
    if (!fabricCanvas) return;
    const h = pixelHandlersRef.current;
    if (h) {
      fabricCanvas.off("mouse:down", h.down);
      fabricCanvas.off("mouse:move", h.move);
      pixelHandlersRef.current = null;
    }
    setIsDrawing(false);
    toast.success("Modo de desenho desativado");
  }, [fabricCanvas]);

  const drawGrid = useCallback(() => {
    if (!fabricCanvas) return;
    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // Remove old grid
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricCanvas.getObjects().filter((o: any) => o.data?.__pixelGrid__).forEach((o: unknown) => fabricCanvas.remove(o));

      const total = gridSize * pixelSize;
      for (let i = 0; i <= gridSize; i++) {
        const x = offsetX + i * pixelSize;
        const hLine = new f.Line([offsetX, offsetY + i * pixelSize, offsetX + total, offsetY + i * pixelSize], {
          stroke: "#cccccc33", strokeWidth: 0.5, selectable: false, evented: false,
          data: { __pixelGrid__: true },
        });
        const vLine = new f.Line([x, offsetY, x, offsetY + total], {
          stroke: "#cccccc33", strokeWidth: 0.5, selectable: false, evented: false,
          data: { __pixelGrid__: true },
        });
        fabricCanvas.add(hLine, vLine);
      }
      fabricCanvas.requestRenderAll();
      toast.success(`Grade ${gridSize}×${gridSize} desenhada`);
    });
  }, [fabricCanvas, gridSize, pixelSize, offsetX, offsetY]);

  const clearPixels = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().filter((o: any) => o.data?.[PIXEL_TAG] || o.data?.__pixelGrid__).forEach((o: unknown) => fabricCanvas.remove(o));
    fabricCanvas.requestRenderAll();
    toast.success("Canvas de pixels limpo");
  }, [fabricCanvas]);

  const flattenToImage = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pixels = fabricCanvas.getObjects().filter((o: any) => o.data?.[PIXEL_TAG]);
    if (pixels.length === 0) { toast.error("Nenhum pixel para achatar"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const total = gridSize * pixelSize;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = total;
      tempCanvas.height = total;
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pixels.forEach((p: any) => {
        ctx.fillStyle = p.fill;
        ctx.fillRect(p.left - offsetX, p.top - offsetY, p.width, p.height);
      });

      f.Image.fromURL(tempCanvas.toDataURL(), (img: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const i = img as any;
        i.set({ left: offsetX, top: offsetY, selectable: true });
        pixels.forEach((p: unknown) => fabricCanvas.remove(p));
        fabricCanvas.add(i);
        fabricCanvas.requestRenderAll();
        toast.success("Pixels achatados em imagem");
      });
    });
  }, [fabricCanvas, gridSize, pixelSize, offsetX, offsetY]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid2X2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Pixel Art</span>
        </div>
        <button onClick={clearPixels} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Grid size */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Tamanho da grade</span>
        <div className="grid grid-cols-4 gap-1">
          {GRID_SIZES.map(s => (
            <button key={s} onClick={() => setGridSize(s)}
              className={`py-1 rounded border text-[8px] transition-colors ${gridSize === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {s}×{s}
            </button>
          ))}
        </div>
      </div>

      {/* Pixel size */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Tamanho do pixel</span>
          <span className="text-[9px] tabular-nums">{pixelSize}px</span>
        </div>
        <input type="range" min={10} max={40} step={5} value={pixelSize}
          onChange={e => setPixelSize(Number(e.target.value))} className="w-full accent-primary h-1" />
      </div>

      {/* Origin */}
      <div className="grid grid-cols-2 gap-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Origem X</span>
          <input type="number" value={offsetX} onChange={e => setOffsetX(Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Origem Y</span>
          <input type="number" value={offsetY} onChange={e => setOffsetY(Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Color palette */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Paleta</span>
        <div className="flex gap-1 flex-wrap">
          {PIXEL_PALETTES.map(p => (
            <button key={p.name} onClick={() => setPalette(p)}
              className={`text-[7px] px-1.5 py-0.5 rounded border transition-colors ${palette.name === p.name ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-0.5">
          {palette.colors.map(c => (
            <button key={c} onClick={() => setSelectedColor(c)}
              className={`w-6 h-6 rounded border-2 transition-all ${selectedColor === c ? "border-primary scale-110" : "border-transparent hover:border-border"}`}
              style={{ backgroundColor: c }} />
          ))}
          {/* Eraser */}
          <button onClick={() => setSelectedColor("transparent")}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${selectedColor === "transparent" ? "border-primary scale-110" : "border-border"}`}>
            <RotateCcw className="w-3 h-3 text-muted-foreground" />
          </button>
          {/* Custom color */}
          <input type="color" value={selectedColor === "transparent" ? "#ffffff" : selectedColor}
            onChange={e => setSelectedColor(e.target.value)}
            className="w-6 h-6 rounded border border-border cursor-pointer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: selectedColor === "transparent" ? "transparent" : selectedColor }} />
          <span className="text-[7px] font-mono text-muted-foreground">{selectedColor}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={drawGrid}
          className="py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
          Mostrar grade
        </button>
        <button onClick={flattenToImage}
          className="py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
          Achatar
        </button>
      </div>

      <button onClick={isDrawing ? stopDrawing : startDrawing}
        className={`flex items-center justify-center gap-1 py-2 rounded border text-[9px] font-medium transition-colors ${isDrawing ? "border-destructive text-destructive hover:bg-destructive/10 animate-pulse" : "border-primary text-primary hover:bg-primary/10"}`}>
        <Grid2X2 className="w-3 h-3" /> {isDrawing ? "Parar desenho" : "Iniciar desenho"}
      </button>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Grade {gridSize}×{gridSize} — {pixelSize}px por pixel
      </p>
    </div>
  );
}
