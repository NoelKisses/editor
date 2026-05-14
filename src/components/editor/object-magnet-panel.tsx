"use client";

import { useCallback, useEffect, useState } from "react";
import { Move } from "lucide-react";
import { toast } from "sonner";

interface ObjectMagnetPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type SnapTarget = "grid" | "objects" | "canvas-center" | "canvas-edges";

const SNAP_TARGETS: { value: SnapTarget; label: string; desc: string }[] = [
  { value: "grid", label: "Grade", desc: "Encaixa na grade" },
  { value: "objects", label: "Objetos", desc: "Encaixa em outros objetos" },
  { value: "canvas-center", label: "Centro", desc: "Encaixa no centro do canvas" },
  { value: "canvas-edges", label: "Bordas", desc: "Encaixa nas bordas do canvas" },
];

export function ObjectMagnetPanel({ fabricCanvas, selectionVersion }: ObjectMagnetPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [threshold, setThreshold] = useState(10);
  const [activeTargets, setActiveTargets] = useState<SnapTarget[]>(["grid"]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj);
    });
  }, [fabricCanvas, selectionVersion]);

  const toggleTarget = useCallback((t: SnapTarget) => {
    setActiveTargets(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }, []);

  const snapToGrid = useCallback((val: number, size: number) => Math.round(val / size) * size, []);

  const applySnap = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    let left = obj.left ?? 0;
    let top = obj.top ?? 0;
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    const cw = fabricCanvas.width ?? 0;
    const ch = fabricCanvas.height ?? 0;

    if (activeTargets.includes("grid")) {
      left = snapToGrid(left, gridSize);
      top = snapToGrid(top, gridSize);
    }

    if (activeTargets.includes("canvas-center")) {
      const cx = cw / 2 - w / 2;
      const cy = ch / 2 - h / 2;
      if (Math.abs(left - cx) < threshold) left = cx;
      if (Math.abs(top - cy) < threshold) top = cy;
    }

    if (activeTargets.includes("canvas-edges")) {
      if (Math.abs(left) < threshold) left = 0;
      if (Math.abs(top) < threshold) top = 0;
      if (Math.abs(left + w - cw) < threshold) left = cw - w;
      if (Math.abs(top + h - ch) < threshold) top = ch - h;
    }

    if (activeTargets.includes("objects")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const others = fabricCanvas.getObjects().filter((o: any) => o !== obj);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const other of others as any[]) {
        const ol = other.left ?? 0;
        const ot = other.top ?? 0;
        const ow = (other.width ?? 0) * (other.scaleX ?? 1);
        const oh = (other.height ?? 0) * (other.scaleY ?? 1);
        if (Math.abs(left - ol) < threshold) left = ol;
        if (Math.abs(top - ot) < threshold) top = ot;
        if (Math.abs(left - (ol + ow)) < threshold) left = ol + ow;
        if (Math.abs(top - (ot + oh)) < threshold) top = ot + oh;
      }
    }

    obj.set({ left, top });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Objeto encaixado (snap aplicado)");
  }, [fabricCanvas, activeTargets, gridSize, threshold, snapToGrid]);

  const enableLiveSnap = useCallback(() => {
    if (!fabricCanvas) return;
    if (enabled) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricCanvas.off("object:moving");
      setEnabled(false);
      toast.success("Snap ao vivo desativado");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.on("object:moving", (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = e.target;
      if (!obj) return;
      if (activeTargets.includes("grid")) {
        obj.set({
          left: Math.round((obj.left ?? 0) / gridSize) * gridSize,
          top: Math.round((obj.top ?? 0) / gridSize) * gridSize,
        });
      }
    });
    setEnabled(true);
    toast.success("Snap ao vivo ativado");
  }, [fabricCanvas, enabled, activeTargets, gridSize]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Move className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Magneto / Snap</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Move className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para usar o snap</p>
        </div>
      ) : (
        <>
          {/* Snap targets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Encaixar em</span>
            <div className="flex flex-col gap-1">
              {SNAP_TARGETS.map(t => (
                <button key={t.value} onClick={() => toggleTarget(t.value)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded border text-left transition-colors ${activeTargets.includes(t.value) ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                  <div>
                    <span className={`text-[9px] font-medium ${activeTargets.includes(t.value) ? "text-primary" : ""}`}>{t.label}</span>
                    <p className="text-[7px] text-muted-foreground">{t.desc}</p>
                  </div>
                  <div className={`w-3 h-3 rounded border flex-shrink-0 ${activeTargets.includes(t.value) ? "bg-primary border-primary" : "border-border"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Grid size */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tamanho da grade</span>
              <span className="text-[9px] tabular-nums">{gridSize}px</span>
            </div>
            <input type="range" min={5} max={50} step={5} value={gridSize}
              onChange={e => setGridSize(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Threshold */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Limiar de atração</span>
              <span className="text-[9px] tabular-nums">{threshold}px</span>
            </div>
            <input type="range" min={2} max={30} step={2} value={threshold}
              onChange={e => setThreshold(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            <button onClick={enableLiveSnap}
              className={`flex items-center justify-center gap-1 py-2 rounded border text-[9px] font-medium transition-colors ${enabled ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
              <Move className="w-3 h-3" /> {enabled ? "Live On" : "Live Snap"}
            </button>
            <button onClick={applySnap}
              className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              <Move className="w-3 h-3" /> Aplicar
            </button>
          </div>

          {enabled && (
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[8px] text-primary">Snap ao vivo ativo</span>
            </div>
          )}

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Grade {gridSize}px — limiar {threshold}px
          </p>
        </>
      )}
    </div>
  );
}
