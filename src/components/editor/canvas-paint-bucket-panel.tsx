"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PaintBucket, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasPaintBucketPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

export function CanvasPaintBucketPanel({ fabricCanvas, selectionVersion }: CanvasPaintBucketPanelProps) {
  const [isActive, setIsActive] = useState(false);
  const [fillColor, setFillColor] = useState("#6366f1");
  const [tolerance, setTolerance] = useState(30);
  const [mode, setMode] = useState<"object" | "canvas">("object");
  const [hasObject, setHasObject] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlerRef = useRef<any>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      setHasObject(!!fabricCanvas.getActiveObject());
    });
  }, [fabricCanvas, selectionVersion]);

  const colorsClose = useCallback((r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, tol: number) => {
    return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) < tol * 3;
  }, []);

  const floodFillCanvas = useCallback((startX: number, startY: number, color: string, tol: number) => {
    const cv = canvasRef.current;
    if (!cv) return;

    const htmlCanvas = cv.getElement ? cv.getElement() : cv.lowerCanvasEl;
    if (!htmlCanvas) return;
    const ctx = htmlCanvas.getContext("2d");
    if (!ctx) return;

    const w = htmlCanvas.width;
    const h = htmlCanvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    const hex = color.replace("#", "");
    const fr = parseInt(hex.slice(0, 2), 16);
    const fg = parseInt(hex.slice(2, 4), 16);
    const fb = parseInt(hex.slice(4, 6), 16);

    const ix = Math.floor(startX);
    const iy = Math.floor(startY);
    const startIdx = (iy * w + ix) * 4;
    const sr = d[startIdx];
    const sg = d[startIdx + 1];
    const sb = d[startIdx + 2];

    if (sr === fr && sg === fg && sb === fb) return;

    const stack: [number, number][] = [[ix, iy]];
    const visited = new Uint8Array(w * h);

    while (stack.length > 0) {
      const item = stack.pop();
      if (!item) break;
      const [x, y] = item;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const idx = y * w + x;
      if (visited[idx]) continue;
      visited[idx] = 1;
      const i = idx * 4;
      if (!colorsClose(d[i], d[i + 1], d[i + 2], sr, sg, sb, tol)) continue;
      d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imgData, 0, 0);
    toast.success("Flood fill aplicado no canvas");
  }, [colorsClose]);

  const fillObject = useCallback((color: string) => {
    const cv = canvasRef.current;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    obj.set({ fill: color });
    obj.setCoords();
    cv.requestRenderAll();
    toast.success("Cor aplicada ao objeto");
  }, []);

  const stopBucket = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    if (handlerRef.current) {
      cv.off("mouse:down", handlerRef.current);
      handlerRef.current = null;
    }
    cv.selection = true;
    cv.requestRenderAll();
    setIsActive(false);
    toast.success("Modo balde desativado");
  }, []);

  const startBucket = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || isActive) return;
    setIsActive(true);
    cv.selection = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      const pt = e.absolutePointer ?? e.pointer;
      if (!pt) return;
      if (mode === "canvas") {
        floodFillCanvas(pt.x, pt.y, fillColor, tolerance);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = cv.findTarget(e.e);
        if (obj) {
          cv.setActiveObject(obj);
          fillObject(fillColor);
        }
      }
    };

    cv.on("mouse:down", handler);
    handlerRef.current = handler;
    toast.success("Balde ativo — clique no canvas para preencher");
  }, [isActive, mode, fillColor, tolerance, floodFillCanvas, fillObject]);

  const applyToSelected = useCallback(() => {
    fillObject(fillColor);
  }, [fillColor, fillObject]);

  const applyToAll = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = cv.getObjects().filter((o: any) => o.selectable !== false && o.fill !== undefined);
    objs.forEach((o: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o as any).set({ fill: fillColor });
    });
    cv.requestRenderAll();
    toast.success(`Cor aplicada a ${objs.length} objeto(s)`);
  }, [fillColor]);

  const PRESETS = ["#000000", "#ffffff", "#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <PaintBucket className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Balde de Tinta</span>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Cor de preenchimento</span>
        <div className="flex items-center gap-2">
          <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)}
            className="w-8 h-7 rounded border border-border cursor-pointer" />
          <span className="text-[8px] font-mono text-muted-foreground">{fillColor}</span>
        </div>
        <div className="grid grid-cols-8 gap-0.5">
          {PRESETS.map(c => (
            <button key={c} onClick={() => setFillColor(c)}
              className={`w-6 h-6 rounded border-2 transition-all ${fillColor === c ? "border-primary scale-110" : "border-transparent hover:border-border"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Modo</span>
        <div className="grid grid-cols-2 gap-1">
          {(["object", "canvas"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`py-1 rounded border text-[8px] transition-colors ${mode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {m === "object" ? "Preencher objeto" : "Flood fill pixel"}
            </button>
          ))}
        </div>
      </div>

      {/* Tolerance (canvas mode only) */}
      {mode === "canvas" && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Tolerância</span>
            <span className="text-[9px] tabular-nums">{tolerance}</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={tolerance}
            onChange={e => setTolerance(Number(e.target.value))} className="w-full accent-primary h-1" />
        </div>
      )}

      {/* Activate */}
      <button onClick={isActive ? stopBucket : startBucket}
        className={`flex items-center justify-center gap-1 py-2 rounded border text-[9px] font-medium transition-colors ${isActive ? "border-destructive text-destructive hover:bg-destructive/10 animate-pulse" : "border-primary text-primary hover:bg-primary/10"}`}>
        <PaintBucket className="w-3 h-3" /> {isActive ? "Desativar balde" : "Ativar balde"}
      </button>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={applyToSelected} disabled={!hasObject}
          className="py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40">
          Aplicar ao selecionado
        </button>
        <button onClick={applyToAll}
          className="py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
          Aplicar a todos
        </button>
      </div>

      <button onClick={() => { setFillColor("#000000"); if (isActive) stopBucket(); }}
        className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors">
        <RotateCcw className="w-3 h-3" /> Resetar
      </button>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Modo objeto preenche fill; modo pixel usa flood-fill por coordenadas
      </p>
    </div>
  );
}
