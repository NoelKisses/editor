"use client";

import { useCallback, useEffect, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Focus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ZoomControlsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const ZOOM_PRESETS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.50 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1.00 },
  { label: "150%", value: 1.50 },
  { label: "200%", value: 2.00 },
  { label: "300%", value: 3.00 },
  { label: "400%", value: 4.00 },
];

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 10;

export function ZoomControlsPanel({ fabricCanvas }: ZoomControlsPanelProps) {
  const [currentZoom, setCurrentZoom] = useState(1);

  const readZoom = useCallback(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      setCurrentZoom(fabricCanvas.getZoom());
    });
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    readZoom();
    fabricCanvas.on("mouse:wheel", readZoom);
    return () => fabricCanvas.off("mouse:wheel", readZoom);
  }, [fabricCanvas, readZoom]);

  const setZoom = useCallback((zoom: number, toCenter = true) => {
    if (!fabricCanvas) return;
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

    if (toCenter) {
      const cx = fabricCanvas.getWidth() / 2;
      const cy = fabricCanvas.getHeight() / 2;
      fabricCanvas.zoomToPoint({ x: cx, y: cy }, clamped);
    } else {
      fabricCanvas.setZoom(clamped);
    }

    fabricCanvas.requestRenderAll();
    setCurrentZoom(clamped);
  }, [fabricCanvas]);

  const zoomIn = useCallback(() => {
    const steps = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const next = steps.find(s => s > currentZoom + 0.01) ?? MAX_ZOOM;
    setZoom(next);
  }, [currentZoom, setZoom]);

  const zoomOut = useCallback(() => {
    const steps = [0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const prev = [...steps].reverse().find(s => s < currentZoom - 0.01) ?? MIN_ZOOM;
    setZoom(prev);
  }, [currentZoom, setZoom]);

  const fitToScreen = useCallback(() => {
    if (!fabricCanvas) return;
    const canvasW = fabricCanvas.getWidth();
    const canvasH = fabricCanvas.getHeight();
    const contentW = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const contentH = fabricCanvas.getHeight() / fabricCanvas.getZoom();
    const scaleX = (canvasW * 0.9) / contentW;
    const scaleY = (canvasH * 0.9) / contentH;
    const zoom = Math.min(scaleX, scaleY);
    setZoom(zoom);
    toast.success("Ajustado à tela");
  }, [fabricCanvas, setZoom]);

  const fitToSelection = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    const br = obj.getBoundingRect();
    const canvasW = fabricCanvas.getWidth();
    const canvasH = fabricCanvas.getHeight();
    const scaleX = (canvasW * 0.7) / br.width;
    const scaleY = (canvasH * 0.7) / br.height;
    const zoom = Math.min(scaleX, scaleY, MAX_ZOOM);
    setZoom(zoom);
    toast.success("Centralizado na seleção");
  }, [fabricCanvas, setZoom]);

  const reset = useCallback(() => {
    if (!fabricCanvas) return;
    const cx = fabricCanvas.getWidth() / 2;
    const cy = fabricCanvas.getHeight() / 2;
    fabricCanvas.zoomToPoint({ x: cx, y: cy }, 1);
    fabricCanvas.requestRenderAll();
    setCurrentZoom(1);
    toast.success("Zoom redefinido para 100%");
  }, [fabricCanvas]);

  const zoomPercent = Math.round(currentZoom * 100);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <ZoomIn className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Controle de Zoom</span>
      </div>

      {/* Current zoom display */}
      <div className="flex flex-col items-center gap-2 py-3 rounded border border-border bg-muted/20">
        <span className="text-3xl font-bold tabular-nums text-primary">{zoomPercent}%</span>
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={currentZoom <= MIN_ZOOM}
            className="flex items-center justify-center w-8 h-8 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
            title="Diminuir zoom (⌘-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={5}
            max={400}
            step={5}
            value={zoomPercent}
            onChange={e => setZoom(Number(e.target.value) / 100)}
            className="w-24 accent-primary h-1"
          />
          <button
            onClick={zoomIn}
            disabled={currentZoom >= MAX_ZOOM}
            className="flex items-center justify-center w-8 h-8 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
            title="Aumentar zoom (⌘+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
        <div className="grid grid-cols-4 gap-1">
          {ZOOM_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setZoom(p.value)}
              className={`py-1.5 rounded border text-[9px] transition-colors ${Math.abs(currentZoom - p.value) < 0.01 ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ações</span>
        <div className="grid grid-cols-1 gap-1">
          <button
            onClick={fitToScreen}
            className="flex items-center gap-2 px-3 py-2 rounded border border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Ajustar à tela
          </button>
          <button
            onClick={fitToSelection}
            className="flex items-center gap-2 px-3 py-2 rounded border border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Focus className="w-3.5 h-3.5" />
            Centralizar na seleção
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-3 py-2 rounded border border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Redefinir (100%)
          </button>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="flex flex-col gap-1 p-2 rounded bg-muted/30 border border-border/50">
        <span className="text-[9px] text-muted-foreground font-medium">Atalhos de teclado</span>
        {[
          ["⌘ +", "Aumentar zoom"],
          ["⌘ -", "Diminuir zoom"],
          ["⌘ 0", "100% (redefinir)"],
          ["⌘ Shift F", "Ajustar à tela"],
          ["Scroll", "Zoom no cursor"],
        ].map(([key, desc]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[8px] text-muted-foreground/70">{desc}</span>
            <kbd className="text-[7px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{key}</kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
