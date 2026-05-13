"use client";

import { useCallback, useEffect, useState } from "react";
import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ObjectFlipMirrorPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type RotateStep = 45 | 90 | 180;

export function ObjectFlipMirrorPanel({ fabricCanvas, selectionVersion }: ObjectFlipMirrorPanelProps) {
  const [hasSelection, setHasSelection] = useState(false);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasSelection(!!obj);
      if (obj) {
        setFlipX(!!obj.flipX);
        setFlipY(!!obj.flipY);
        setAngle(Math.round(obj.angle ?? 0));
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getObj = useCallback(() => {
    if (!fabricCanvas) return null;
    return fabricCanvas.getActiveObject() ?? null;
  }, [fabricCanvas]);

  const doFlipX = useCallback(() => {
    const obj = getObj();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    const newFlip = !obj.flipX;
    obj.set({ flipX: newFlip });
    fabricCanvas.requestRenderAll();
    setFlipX(newFlip);
    toast.success(newFlip ? "Espelhado horizontalmente" : "Espelho horizontal removido");
  }, [getObj, fabricCanvas]);

  const doFlipY = useCallback(() => {
    const obj = getObj();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    const newFlip = !obj.flipY;
    obj.set({ flipY: newFlip });
    fabricCanvas.requestRenderAll();
    setFlipY(newFlip);
    toast.success(newFlip ? "Espelhado verticalmente" : "Espelho vertical removido");
  }, [getObj, fabricCanvas]);

  const rotateBy = useCallback((deg: RotateStep) => {
    const obj = getObj();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    const newAngle = ((obj.angle ?? 0) + deg) % 360;
    obj.set({ angle: newAngle });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setAngle(Math.round(newAngle));
    toast.success(`Rotacionado ${deg}°`);
  }, [getObj, fabricCanvas]);

  const rotateByNeg = useCallback((deg: RotateStep) => {
    const obj = getObj();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    const newAngle = ((obj.angle ?? 0) - deg + 360) % 360;
    obj.set({ angle: newAngle });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setAngle(Math.round(newAngle));
    toast.success(`Rotacionado -${deg}°`);
  }, [getObj, fabricCanvas]);

  const setExactAngle = useCallback((val: number) => {
    const obj = getObj();
    if (!obj) return;
    const clamped = ((val % 360) + 360) % 360;
    obj.set({ angle: clamped });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setAngle(clamped);
  }, [getObj, fabricCanvas]);

  const resetTransform = useCallback(() => {
    const obj = getObj();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    obj.set({ angle: 0, flipX: false, flipY: false });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setAngle(0);
    setFlipX(false);
    setFlipY(false);
    toast.success("Transformação resetada");
  }, [getObj, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <FlipHorizontal2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Espelhar e Rotacionar</span>
      </div>

      {!hasSelection ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <FlipHorizontal2 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para espelhar ou rotacionar</p>
        </div>
      ) : (
        <>
          {/* Flip buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Espelhar</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={doFlipX}
                className={`flex items-center justify-center gap-1.5 py-2 rounded border text-[10px] font-medium transition-colors ${flipX ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
              >
                <FlipHorizontal2 className="w-3.5 h-3.5" />
                Horizontal
              </button>
              <button
                onClick={doFlipY}
                className={`flex items-center justify-center gap-1.5 py-2 rounded border text-[10px] font-medium transition-colors ${flipY ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
              >
                <FlipVertical2 className="w-3.5 h-3.5" />
                Vertical
              </button>
            </div>
            {(flipX || flipY) && (
              <p className="text-[8px] text-primary/60 text-center">
                {[flipX && "Espelhado ↔", flipY && "Espelhado ↕"].filter(Boolean).join(" + ")}
              </p>
            )}
          </div>

          {/* Rotation presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rotação Rápida</span>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => rotateByNeg(90)}
                className="flex items-center justify-center py-2 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                title="−90°"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={() => rotateByNeg(45)}
                className="flex items-center justify-center py-2 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                title="−45°"
              >
                <span>−45°</span>
              </button>
              <button
                onClick={() => rotateBy(45)}
                className="flex items-center justify-center py-2 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                title="+45°"
              >
                <span>+45°</span>
              </button>
              <button
                onClick={() => rotateBy(90)}
                className="flex items-center justify-center py-2 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                title="+90°"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => rotateBy(180)}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Inverter 180°
            </button>
          </div>

          {/* Precise angle */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Ângulo exato</span>
              <span className="text-[9px] tabular-nums">{angle}°</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={359}
                step={1}
                value={angle}
                onChange={e => setExactAngle(Number(e.target.value))}
                className="flex-1 accent-primary h-1"
              />
              <input
                type="number"
                min={0}
                max={359}
                step={1}
                value={angle}
                onChange={e => setExactAngle(Number(e.target.value))}
                className="w-14 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary text-center"
              />
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={resetTransform}
            className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-destructive/30 hover:text-destructive transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Resetar transformação
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            {angle}° {flipX ? "↔" : ""}{flipY ? "↕" : ""}
          </p>
        </>
      )}
    </div>
  );
}
