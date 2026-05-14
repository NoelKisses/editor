"use client";

import { useCallback, useEffect, useState } from "react";
import { Pin, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectTransformOriginPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type OriginX = "left" | "center" | "right";
type OriginY = "top" | "center" | "bottom";

const ORIGINS_X: OriginX[] = ["left", "center", "right"];
const ORIGINS_Y: OriginY[] = ["top", "center", "bottom"];

const LABEL_X: Record<OriginX, string> = { left: "Esq", center: "Centro", right: "Dir" };
const LABEL_Y: Record<OriginY, string> = { top: "Topo", center: "Centro", bottom: "Baixo" };

const PRESETS: { label: string; ox: OriginX; oy: OriginY }[] = [
  { label: "Topo Esq", ox: "left", oy: "top" },
  { label: "Topo Centro", ox: "center", oy: "top" },
  { label: "Topo Dir", ox: "right", oy: "top" },
  { label: "Meio Esq", ox: "left", oy: "center" },
  { label: "Centro", ox: "center", oy: "center" },
  { label: "Meio Dir", ox: "right", oy: "center" },
  { label: "Base Esq", ox: "left", oy: "bottom" },
  { label: "Base Centro", ox: "center", oy: "bottom" },
  { label: "Base Dir", ox: "right", oy: "bottom" },
];

export function ObjectTransformOriginPanel({ fabricCanvas, selectionVersion }: ObjectTransformOriginPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [originX, setOriginX] = useState<OriginX>("center");
  const [originY, setOriginY] = useState<OriginY>("center");
  const [rotation, setRotation] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj);
      if (obj) {
        setOriginX((obj.originX as OriginX) ?? "center");
        setOriginY((obj.originY as OriginY) ?? "center");
        setRotation(Math.round(obj.angle ?? 0));
        setScaleX(Math.round((obj.scaleX ?? 1) * 100) / 100);
        setScaleY(Math.round((obj.scaleY ?? 1) * 100) / 100);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    return fabricCanvas.getActiveObject() ?? null;
  }, [fabricCanvas]);

  const applyOrigin = useCallback((ox: OriginX, oy: OriginY) => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    obj.set({ originX: ox, originY: oy });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setOriginX(ox);
    setOriginY(oy);
    toast.success(`Origem: ${LABEL_X[ox]} / ${LABEL_Y[oy]}`);
  }, [getObject, fabricCanvas]);

  const applyRotation = useCallback(() => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    obj.set({ angle: rotation });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success(`Rotação aplicada: ${rotation}°`);
  }, [getObject, fabricCanvas, rotation]);

  const applyScale = useCallback(() => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    obj.set({ scaleX, scaleY });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success(`Escala: ${scaleX}×${scaleY}`);
  }, [getObject, fabricCanvas, scaleX, scaleY]);

  const resetTransform = useCallback(() => {
    const obj = getObject();
    if (!obj) return;
    obj.set({ angle: 0, scaleX: 1, scaleY: 1, originX: "center", originY: "center" });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setOriginX("center");
    setOriginY("center");
    setRotation(0);
    setScaleX(1);
    setScaleY(1);
    toast.success("Transformações resetadas");
  }, [getObject, fabricCanvas]);

  const rotateStep = useCallback((step: number) => {
    const obj = getObject();
    if (!obj) return;
    const newAngle = ((obj.angle ?? 0) + step + 360) % 360;
    obj.set({ angle: newAngle });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setRotation(Math.round(newAngle));
  }, [getObject, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Pin className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Origem da Transformação</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Pin className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para ajustar a origem</p>
        </div>
      ) : (
        <>
          {/* Origin grid 3x3 */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Ponto de origem (pivot)</span>
            <div className="grid grid-cols-3 gap-0.5 p-2 bg-muted/20 rounded border border-border">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyOrigin(p.ox, p.oy)}
                  className={`h-8 rounded border text-[7px] flex items-center justify-center transition-colors ${originX === p.ox && originY === p.oy ? "border-primary bg-primary/20 text-primary" : "border-transparent hover:border-border text-muted-foreground/50"}`}
                  title={p.label}>
                  <div className={`w-2 h-2 rounded-full ${originX === p.ox && originY === p.oy ? "bg-primary" : "bg-muted-foreground/30"}`} />
                </button>
              ))}
            </div>
            <div className="text-center text-[8px] text-muted-foreground">
              {LABEL_X[originX]} / {LABEL_Y[originY]}
            </div>
          </div>

          {/* Origin X/Y selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Horizontal</span>
              <div className="flex gap-0.5">
                {ORIGINS_X.map(ox => (
                  <button key={ox} onClick={() => applyOrigin(ox, originY)}
                    className={`flex-1 py-0.5 rounded border text-[7px] transition-colors ${originX === ox ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    {LABEL_X[ox]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Vertical</span>
              <div className="flex gap-0.5">
                {ORIGINS_Y.map(oy => (
                  <button key={oy} onClick={() => applyOrigin(originX, oy)}
                    className={`flex-1 py-0.5 rounded border text-[7px] transition-colors ${originY === oy ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    {LABEL_Y[oy]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div className="flex flex-col gap-1 p-2 rounded border border-border bg-muted/10">
            <span className="text-[9px] text-muted-foreground">Rotação</span>
            <div className="flex items-center gap-1">
              <input type="number" min={-360} max={360} value={rotation}
                onChange={e => setRotation(Number(e.target.value))}
                className="flex-1 bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
              <span className="text-[8px] text-muted-foreground">°</span>
              <button onClick={applyRotation}
                className="px-2 py-0.5 rounded border border-primary text-primary text-[7px] hover:bg-primary/10 transition-colors">
                OK
              </button>
            </div>
            <div className="flex gap-0.5">
              {[-90, -45, -15, 15, 45, 90].map(s => (
                <button key={s} onClick={() => rotateStep(s)}
                  className="flex-1 py-0.5 rounded border border-border text-muted-foreground text-[7px] hover:border-primary/30 hover:text-primary transition-colors">
                  {s > 0 ? `+${s}` : s}°
                </button>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div className="flex flex-col gap-1 p-2 rounded border border-border bg-muted/10">
            <span className="text-[9px] text-muted-foreground">Escala</span>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] text-muted-foreground">X</span>
                <input type="number" step={0.1} min={0.01} value={scaleX}
                  onChange={e => setScaleX(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] text-muted-foreground">Y</span>
                <input type="number" step={0.1} min={0.01} value={scaleY}
                  onChange={e => setScaleY(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
              </div>
            </div>
            <button onClick={applyScale}
              className="py-1 rounded border border-primary text-primary text-[7px] hover:bg-primary/10 transition-colors">
              Aplicar Escala
            </button>
          </div>

          {/* Reset */}
          <button onClick={resetTransform}
            className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
            <RotateCcw className="w-3 h-3" /> Resetar Transformações
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Controla originX/Y, angle e scale do Fabric.js
          </p>
        </>
      )}
    </div>
  );
}
