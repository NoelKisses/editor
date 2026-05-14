"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
} from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

interface CanvasZoomControlsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.1;
const PAN_STEP = 50;

const QUICK_ZOOM_PRESETS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1.0 },
  { label: "150%", value: 1.5 },
  { label: "200%", value: 2.0 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clampZoom(zoom: any): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(zoom)));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyZoomToCenter(canvas: FabricCanvas, zoom: number): void {
  const clamped = clampZoom(zoom);
  const cx = canvas.getWidth() / 2;
  const cy = canvas.getHeight() / 2;
  canvas.zoomToPoint({ x: cx, y: cy }, clamped);
  canvas.requestRenderAll();
}

export function CanvasZoomControlsPanel({ fabricCanvas }: CanvasZoomControlsPanelProps) {
  const canvasRef = useRef<FabricCanvas>(null);
  const [currentZoom, setCurrentZoom] = useState(1);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const syncZoom = useCallback(() => {
    if (!canvasRef.current) return;
    const z = canvasRef.current.getZoom();
    queueMicrotask(() => {
      setCurrentZoom(clampZoom(z));
    });
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;
    syncZoom();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onWheel = (_opt: any) => {
      syncZoom();
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onZoomChanged = (_opt: any) => {
      syncZoom();
    };

    fabricCanvas.on("mouse:wheel", onWheel);
    fabricCanvas.on("zoom:changed", onZoomChanged);

    return () => {
      fabricCanvas.off("mouse:wheel", onWheel);
      fabricCanvas.off("zoom:changed", onZoomChanged);
    };
  }, [fabricCanvas, syncZoom]);

  const handleSetZoom = useCallback(
    (zoom: number) => {
      if (!canvasRef.current) return;
      const clamped = clampZoom(zoom);
      applyZoomToCenter(canvasRef.current, clamped);
      queueMicrotask(() => {
        setCurrentZoom(clamped);
      });
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    if (!canvasRef.current) return;
    const next = clampZoom(currentZoom + ZOOM_STEP);
    handleSetZoom(next);
  }, [currentZoom, handleSetZoom]);

  const handleZoomOut = useCallback(() => {
    if (!canvasRef.current) return;
    const next = clampZoom(currentZoom - ZOOM_STEP);
    handleSetZoom(next);
  }, [currentZoom, handleSetZoom]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSetZoom(Number(e.target.value) / 100);
    },
    [handleSetZoom]
  );

  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const canvasW = canvas.getWidth();
    const canvasH = canvas.getHeight();
    // Use getObjects to determine bounding box of all content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = canvas.getObjects();
    if (objects.length === 0) {
      // Fit the canvas itself
      handleSetZoom(1);
      toast.success("Ajustado à tela");
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((obj: any) => {
      const br = obj.getBoundingRect(true, true);
      if (br.left < minX) minX = br.left;
      if (br.top < minY) minY = br.top;
      if (br.left + br.width > maxX) maxX = br.left + br.width;
      if (br.top + br.height > maxY) maxY = br.top + br.height;
    });
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    if (contentW <= 0 || contentH <= 0) {
      handleSetZoom(1);
      toast.success("Ajustado à tela");
      return;
    }
    const scaleX = (canvasW * 0.9) / contentW;
    const scaleY = (canvasH * 0.9) / contentH;
    const zoom = clampZoom(Math.min(scaleX, scaleY));
    handleSetZoom(zoom);
    toast.success("Ajustado à tela");
  }, [handleSetZoom]);

  const handleResetZoom = useCallback(() => {
    if (!canvasRef.current) return;
    applyZoomToCenter(canvasRef.current, 1);
    queueMicrotask(() => {
      setCurrentZoom(1);
    });
    toast.success("Zoom redefinido para 100%");
  }, []);

  const handlePan = useCallback(
    (dx: number, dy: number) => {
      if (!canvasRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvasRef.current.relativePan({ x: dx, y: dy } as any);
      canvasRef.current.requestRenderAll();
    },
    []
  );

  const handleCenterView = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    // Reset viewport transform to identity (centered)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vt: any = canvas.viewportTransform;
    if (vt) {
      vt[4] = 0;
      vt[5] = 0;
      canvas.setViewportTransform(vt);
    }
    canvas.requestRenderAll();
    toast.success("Viewport centralizado");
  }, []);

  const zoomPercent = Math.round(currentZoom * 100);

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ZoomIn className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Zoom &amp; Viewport</span>
      </div>

      {/* Current zoom display + slider */}
      <div className="flex flex-col items-center gap-2 py-3 px-3 rounded border border-border bg-muted/20">
        <span className="text-3xl font-bold tabular-nums text-primary">{zoomPercent}%</span>
        <input
          type="range"
          min={10}
          max={400}
          step={5}
          value={zoomPercent}
          onChange={handleSliderChange}
          className="w-full accent-primary h-1"
          title={`Zoom: ${zoomPercent}%`}
        />
        <div className="flex items-center justify-between w-full">
          <span className="text-[9px] text-muted-foreground">10%</span>
          <span className="text-[9px] text-muted-foreground">400%</span>
        </div>
      </div>

      {/* Zoom In / Out buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          disabled={currentZoom <= MIN_ZOOM}
          className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded border border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
          title="Diminuir zoom (-10%)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
          Zoom Out
        </button>
        <button
          onClick={handleZoomIn}
          disabled={currentZoom >= MAX_ZOOM}
          className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded border border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
          title="Aumentar zoom (+10%)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          Zoom In
        </button>
      </div>

      {/* Quick zoom presets — 3x2 grid */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets rápidos</span>
        <div className="grid grid-cols-3 gap-1">
          {QUICK_ZOOM_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleSetZoom(p.value)}
              className={`py-1.5 rounded border text-[10px] font-medium transition-colors ${
                Math.abs(currentZoom - p.value) < 0.01
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fit to Screen + Reset Zoom */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ações de zoom</span>
        <div className="flex flex-col gap-1">
          <button
            onClick={handleFitToScreen}
            className="flex items-center gap-2 px-3 py-2 rounded border border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Ajustar à tela
          </button>
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-2 px-3 py-2 rounded border border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Resetar zoom (100%)
          </button>
        </div>
      </div>

      {/* Pan controls */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Panorâmica</span>
        <div className="flex flex-col items-center gap-1">
          {/* Up */}
          <button
            onClick={() => handlePan(0, -PAN_STEP)}
            className="flex items-center justify-center w-8 h-8 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            title="Mover para cima"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          {/* Left / Center / Right */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePan(-PAN_STEP, 0)}
              className="flex items-center justify-center w-8 h-8 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              title="Mover para esquerda"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCenterView}
              className="flex items-center justify-center w-8 h-8 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              title="Centralizar viewport"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePan(PAN_STEP, 0)}
              className="flex items-center justify-center w-8 h-8 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              title="Mover para direita"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Down */}
          <button
            onClick={() => handlePan(0, PAN_STEP)}
            className="flex items-center justify-center w-8 h-8 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            title="Mover para baixo"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground text-center">
          Passo: {PAN_STEP}px | Botão central: centralizar
        </p>
      </div>
    </div>
  );
}
