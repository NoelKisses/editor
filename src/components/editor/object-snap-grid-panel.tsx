"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Grid3X3, Magnet, Target, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectSnapGridPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface SnapConfig {
  snapToGrid: boolean;
  gridSize: number;
  snapToObjects: boolean;
  snapThreshold: number;
  snapToCenter: boolean;
  snapToEdges: boolean;
  showGrid: boolean;
  gridOpacity: number;
  gridColor: string;
  gridStyle: "lines" | "dots" | "crosses";
}

const DEFAULT_CONFIG: SnapConfig = {
  snapToGrid: true,
  gridSize: 20,
  snapToObjects: true,
  snapThreshold: 8,
  snapToCenter: true,
  snapToEdges: true,
  showGrid: true,
  gridOpacity: 0.2,
  gridColor: "#6366f1",
  gridStyle: "lines",
};

const GRID_PRESETS: { label: string; gridSize: number; gridStyle: SnapConfig["gridStyle"] }[] = [
  { label: "Fino (10px)", gridSize: 10, gridStyle: "dots" },
  { label: "Normal (20px)", gridSize: 20, gridStyle: "lines" },
  { label: "Largo (40px)", gridSize: 40, gridStyle: "lines" },
  { label: "Grade A4", gridSize: 28, gridStyle: "crosses" },
];

let gridOverlayId: string | null = null;

function removeGridOverlay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cv: any
): void {
  if (!gridOverlayId) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = cv.getObjects();
  const overlay = objects.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (o: any) => o.__gridOverlay === gridOverlayId
  );
  if (overlay) {
    cv.remove(overlay);
  }
  gridOverlayId = null;
}

function drawGridOverlay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cv: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any,
  config: SnapConfig
): void {
  removeGridOverlay(cv);

  const cw = cv.getWidth();
  const ch = cv.getHeight();
  const { gridSize, gridColor, gridOpacity, gridStyle } = config;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fabric as any;

  const offscreen = document.createElement("canvas");
  offscreen.width = cw;
  offscreen.height = ch;
  const ctx = offscreen.getContext("2d");
  if (!ctx) return;

  ctx.strokeStyle = gridColor;
  ctx.fillStyle = gridColor;
  ctx.globalAlpha = gridOpacity;
  ctx.lineWidth = 0.5;

  if (gridStyle === "lines") {
    for (let x = 0; x <= cw; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
    }
    for (let y = 0; y <= ch; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
    }
  } else if (gridStyle === "dots") {
    for (let x = 0; x <= cw; x += gridSize) {
      for (let y = 0; y <= ch; y += gridSize) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (gridStyle === "crosses") {
    const arm = 4;
    for (let x = 0; x <= cw; x += gridSize) {
      for (let y = 0; y <= ch; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
        ctx.stroke();
      }
    }
  }

  const dataURL = offscreen.toDataURL();
  f.Image.fromURL(dataURL, (img: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imgObj = img as any;
    const id = `grid_${Date.now()}`;
    imgObj.set({
      left: 0, top: 0,
      selectable: false, evented: false,
      __gridOverlay: id,
    });
    cv.add(imgObj);
    cv.sendToBack(imgObj);
    gridOverlayId = id;
    cv.requestRenderAll();
  });
}

function snapObjectToGrid(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  gridSize: number
): void {
  obj.set({
    left: Math.round((obj.left ?? 0) / gridSize) * gridSize,
    top: Math.round((obj.top ?? 0) / gridSize) * gridSize,
  });
  obj.setCoords?.();
}

function snapAllToGrid(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cv: any,
  gridSize: number
): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objs: any[] = cv.getObjects().filter((o: any) => o.selectable);
  objs.forEach((o) => snapObjectToGrid(o, gridSize));
  cv.requestRenderAll();
  return objs.length;
}

export function ObjectSnapGridPanel({ fabricCanvas, selectionVersion }: ObjectSnapGridPanelProps) {
  const [config, setConfig] = useState<SnapConfig>(DEFAULT_CONFIG);
  const [selectedCount, setSelectedCount] = useState(0);
  const canvasRef = useRef<unknown>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (obj?.type === "activeSelection") {
        setSelectedCount(obj.getObjects?.()?.length ?? 0);
      } else if (obj) {
        setSelectedCount(1);
      } else {
        setSelectedCount(0);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const set = useCallback(<K extends keyof SnapConfig>(key: K, value: SnapConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyGridOverlay = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    import("fabric").then((m) => {
      drawGridOverlay(cv, m.fabric, config);
      toast.success("Grade aplicada ao canvas");
    });
  }, [config]);

  const removeGrid = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    removeGridOverlay(cv);
    cv.requestRenderAll();
    toast.success("Grade removida");
  }, []);

  const snapSelectedToGrid = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    if (obj.type === "activeSelection") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.getObjects().forEach((o: any) => snapObjectToGrid(o, config.gridSize));
    } else {
      snapObjectToGrid(obj, config.gridSize);
    }
    cv.requestRenderAll();
    toast.success("Objeto(s) alinhado(s) à grade");
  }, [config.gridSize]);

  const snapAllObjectsToGrid = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    const count = snapAllToGrid(cv, config.gridSize);
    toast.success(`${count} objeto(s) alinhado(s) à grade`);
  }, [config.gridSize]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Grid3X3 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Grade e Snap</span>
      </div>

      {/* Grid presets */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Presets de Grade</span>
        <div className="grid grid-cols-2 gap-1">
          {GRID_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setConfig((prev) => ({ ...prev, gridSize: p.gridSize, gridStyle: p.gridStyle }))}
              className={`py-1.5 rounded border text-[7px] transition-colors ${
                config.gridSize === p.gridSize && config.gridStyle === p.gridStyle
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid size */}
      <div className="flex items-center gap-2">
        <span className="text-[8px] text-muted-foreground w-16">Tamanho</span>
        <input type="range" min={4} max={80} step={2} value={config.gridSize}
          onChange={(e) => set("gridSize", Number(e.target.value))}
          className="flex-1 h-1 accent-primary" />
        <span className="text-[8px] font-mono w-8 text-right">{config.gridSize}px</span>
      </div>

      {/* Grid style */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Estilo da Grade</span>
        <div className="grid grid-cols-3 gap-1">
          {(["lines", "dots", "crosses"] as SnapConfig["gridStyle"][]).map((s) => (
            <button key={s} onClick={() => set("gridStyle", s)}
              className={`py-1 rounded border text-[7px] capitalize transition-colors ${
                config.gridStyle === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}>
              {s === "lines" ? "Linhas" : s === "dots" ? "Pontos" : "Cruzes"}
            </button>
          ))}
        </div>
      </div>

      {/* Color + opacity */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Cor</span>
          <div className="flex items-center gap-1">
            <input type="color" value={config.gridColor}
              onChange={(e) => set("gridColor", e.target.value)}
              className="w-6 h-5 rounded border border-border cursor-pointer" />
            <span className="text-[7px] font-mono text-muted-foreground">{config.gridColor}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Opacidade</span>
          <input type="range" min={0.05} max={0.8} step={0.05} value={config.gridOpacity}
            onChange={(e) => set("gridOpacity", Number(e.target.value))}
            className="w-full h-1 accent-primary mt-1.5" />
        </div>
      </div>

      {/* Snap options */}
      <div className="flex flex-col gap-1.5 p-2 rounded border border-border">
        <span className="text-[8px] font-medium">Opções de Snap</span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={config.snapToGrid}
            onChange={(e) => set("snapToGrid", e.target.checked)}
            className="w-3 h-3 accent-primary" />
          <Magnet className="w-3 h-3 text-muted-foreground" />
          <span className="text-[8px] text-muted-foreground">Snap à grade</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={config.snapToObjects}
            onChange={(e) => set("snapToObjects", e.target.checked)}
            className="w-3 h-3 accent-primary" />
          <Target className="w-3 h-3 text-muted-foreground" />
          <span className="text-[8px] text-muted-foreground">Snap a outros objetos</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={config.snapToCenter}
            onChange={(e) => set("snapToCenter", e.target.checked)}
            className="w-3 h-3 accent-primary" />
          <span className="text-[8px] text-muted-foreground">Snap ao centro</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={config.snapToEdges}
            onChange={(e) => set("snapToEdges", e.target.checked)}
            className="w-3 h-3 accent-primary" />
          <span className="text-[8px] text-muted-foreground">Snap às bordas</span>
        </label>
        {config.snapToObjects && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[7px] text-muted-foreground w-16">Tolerância</span>
            <input type="range" min={2} max={30} value={config.snapThreshold}
              onChange={(e) => set("snapThreshold", Number(e.target.value))}
              className="flex-1 h-1 accent-primary" />
            <span className="text-[7px] font-mono w-6">{config.snapThreshold}px</span>
          </div>
        )}
      </div>

      {/* Grid overlay buttons */}
      <div className="flex gap-2">
        <button onClick={applyGridOverlay}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-primary text-primary text-[8px] hover:bg-primary/10 transition-colors">
          <Grid3X3 className="w-3 h-3" /> Mostrar Grade
        </button>
        <button onClick={removeGrid}
          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Snap actions */}
      <div className="flex flex-col gap-1">
        <button onClick={snapSelectedToGrid}
          disabled={selectedCount === 0}
          className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-[8px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40">
          <Magnet className="w-3 h-3" />
          Alinhar seleção à grade
          {selectedCount > 0 && <span className="ml-1 text-[7px]">({selectedCount})</span>}
        </button>
        <button onClick={snapAllObjectsToGrid}
          className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-[8px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
          <Target className="w-3 h-3" />
          Alinhar todos à grade
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Grade visual é uma imagem · snap é comportamento de arraste
      </p>
    </div>
  );
}
