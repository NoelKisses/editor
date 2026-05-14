"use client";

import { useCallback, useEffect, useState } from "react";
import { LockIcon, Unlock, RotateCcw, Move } from "lucide-react";
import { toast } from "sonner";

interface ObjectAspectRatioPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type AspectPreset = "free" | "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "2:1" | "1:2" | "3:2" | "2:3" | "golden";

const ASPECT_PRESETS: { value: AspectPreset; label: string; ratio: number }[] = [
  { value: "free", label: "Livre", ratio: 0 },
  { value: "1:1", label: "1:1", ratio: 1 },
  { value: "4:3", label: "4:3", ratio: 4 / 3 },
  { value: "3:4", label: "3:4", ratio: 3 / 4 },
  { value: "16:9", label: "16:9", ratio: 16 / 9 },
  { value: "9:16", label: "9:16", ratio: 9 / 16 },
  { value: "2:1", label: "2:1", ratio: 2 },
  { value: "1:2", label: "1:2", ratio: 0.5 },
  { value: "3:2", label: "3:2", ratio: 3 / 2 },
  { value: "2:3", label: "2:3", ratio: 2 / 3 },
  { value: "golden", label: "Φ Ouro", ratio: 1.618 },
];

export function ObjectAspectRatioPanel({ fabricCanvas, selectionVersion }: ObjectAspectRatioPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [locked, setLocked] = useState(false);
  const [currentRatio, setCurrentRatio] = useState(1);
  const [preset, setPreset] = useState<AspectPreset>("free");
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setHasObject(false); return; }
      setHasObject(true);
      const w = Math.round(obj.getScaledWidth ? obj.getScaledWidth() : (obj.width ?? 100));
      const h = Math.round(obj.getScaledHeight ? obj.getScaledHeight() : (obj.height ?? 100));
      setWidth(w);
      setHeight(h);
      setCurrentRatio(h > 0 ? w / h : 1);
      setPosX(Math.round(obj.left ?? 0));
      setPosY(Math.round(obj.top ?? 0));
      setAngle(Math.round(obj.angle ?? 0));
      setLocked(!!obj.__aspectLocked);
    });
  }, [fabricCanvas, selectionVersion]);

  const getActive = useCallback(() => {
    if (!fabricCanvas) return null;
    return fabricCanvas.getActiveObject();
  }, [fabricCanvas]);

  const applySize = useCallback((w: number, h: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    if (!obj) return;
    const nativeW = obj.width ?? 1;
    const nativeH = obj.height ?? 1;
    obj.set({ scaleX: w / nativeW, scaleY: h / nativeH });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  }, [getActive, fabricCanvas]);

  const onWidthChange = useCallback((val: number) => {
    setWidth(val);
    if (locked && val > 0) {
      const newH = Math.round(val / currentRatio);
      setHeight(newH);
      applySize(val, newH);
    } else {
      applySize(val, height);
    }
  }, [locked, currentRatio, height, applySize]);

  const onHeightChange = useCallback((val: number) => {
    setHeight(val);
    if (locked && val > 0) {
      const newW = Math.round(val * currentRatio);
      setWidth(newW);
      applySize(newW, val);
    } else {
      applySize(width, val);
    }
  }, [locked, currentRatio, width, applySize]);

  const toggleLock = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    const next = !locked;
    setLocked(next);
    if (obj) {
      obj.__aspectLocked = next;
      if (next) setCurrentRatio(height > 0 ? width / height : 1);
    }
    toast.success(next ? "Proporção bloqueada" : "Proporção desbloqueada");
  }, [locked, getActive, width, height]);

  const applyPreset = useCallback((p: AspectPreset) => {
    setPreset(p);
    const found = ASPECT_PRESETS.find(a => a.value === p);
    if (!found || found.ratio === 0) return;
    // Keep current width, adjust height
    const newH = Math.round(width / found.ratio);
    setHeight(newH);
    setCurrentRatio(found.ratio);
    applySize(width, newH);
    toast.success(`Proporção ${p} aplicada`);
  }, [width, applySize]);

  const applyPosition = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    if (!obj) return;
    obj.set({ left: posX, top: posY });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Posição aplicada");
  }, [getActive, posX, posY, fabricCanvas]);

  const applyAngle = useCallback((a: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    if (!obj) return;
    obj.set({ angle: a });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  }, [getActive, fabricCanvas]);

  const resetTransform = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    if (!obj) return;
    obj.set({ scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    const w = Math.round(obj.width ?? 100);
    const h = Math.round(obj.height ?? 100);
    setWidth(w); setHeight(h); setAngle(0);
    setCurrentRatio(h > 0 ? w / h : 1);
    toast.success("Transformações resetadas");
  }, [getActive, fabricCanvas]);

  const centerOnCanvas = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    if (!obj) return;
    const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();
    const ow = obj.getScaledWidth();
    const oh = obj.getScaledHeight();
    const newX = Math.round((cw - ow) / 2);
    const newY = Math.round((ch - oh) / 2);
    obj.set({ left: newX, top: newY });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setPosX(newX); setPosY(newY);
    toast.success("Centralizado no canvas");
  }, [getActive, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <LockIcon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Proporção e Posição</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <LockIcon className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto</p>
        </div>
      ) : (
        <>
          {/* Size with lock */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-medium">Tamanho</span>
              <button onClick={toggleLock}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] transition-colors ${locked ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                {locked ? <LockIcon className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                {locked ? "Bloqueado" : "Livre"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-muted-foreground">Largura</span>
                <input type="number" min={1} max={5000} value={width}
                  onChange={e => onWidthChange(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-muted-foreground">Altura</span>
                <input type="number" min={1} max={5000} value={height}
                  onChange={e => onHeightChange(Number(e.target.value))}
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              </div>
            </div>

            {locked && (
              <div className="text-[7px] text-primary text-center">
                Proporção: {currentRatio.toFixed(3)}:1
              </div>
            )}
          </div>

          {/* Aspect presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Predefinições de proporção</span>
            <div className="grid grid-cols-4 gap-0.5">
              {ASPECT_PRESETS.map(p => (
                <button key={p.value} onClick={() => applyPreset(p.value)}
                  className={`py-1 rounded border text-[7px] transition-colors ${preset === p.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-medium">Posição</span>
              <button onClick={centerOnCanvas}
                className="text-[7px] text-primary hover:underline">Centralizar</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-muted-foreground">X</span>
                <input type="number" value={posX} onChange={e => setPosX(Number(e.target.value))}
                  onBlur={applyPosition}
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-muted-foreground">Y</span>
                <input type="number" value={posY} onChange={e => setPosY(Number(e.target.value))}
                  onBlur={applyPosition}
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div className="flex flex-col gap-1 p-2 rounded border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-medium">Rotação</span>
              <span className="text-[9px] tabular-nums">{angle}°</span>
            </div>
            <input type="range" min={-180} max={180} step={1} value={angle}
              onChange={e => { setAngle(Number(e.target.value)); applyAngle(Number(e.target.value)); }}
              className="w-full accent-primary h-1" />
            <div className="flex gap-1">
              {[-90, -45, 0, 45, 90, 180].map(a => (
                <button key={a} onClick={() => { setAngle(a); applyAngle(a); }}
                  className="flex-1 py-0.5 rounded border border-border text-[7px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
                  {a}°
                </button>
              ))}
            </div>
          </div>

          {/* Snap to canvas edges */}
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: "Topo", fn: () => { const obj = getActive(); if (!obj) return; obj.set({ top: 0 }); obj.setCoords(); fabricCanvas.requestRenderAll(); setPosY(0); } },
              { label: "Centro H", fn: () => { const obj = getActive(); if (!obj) return; const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom(); const oh = obj.getScaledHeight(); const y = Math.round((ch - oh) / 2); obj.set({ top: y }); obj.setCoords(); fabricCanvas.requestRenderAll(); setPosY(y); } },
              { label: "Fundo", fn: () => { const obj = getActive(); if (!obj) return; const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom(); const oh = obj.getScaledHeight(); const y = Math.round(ch - oh); obj.set({ top: y }); obj.setCoords(); fabricCanvas.requestRenderAll(); setPosY(y); } },
              { label: "Esq.", fn: () => { const obj = getActive(); if (!obj) return; obj.set({ left: 0 }); obj.setCoords(); fabricCanvas.requestRenderAll(); setPosX(0); } },
              { label: "Centro V", fn: () => { const obj = getActive(); if (!obj) return; const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom(); const ow = obj.getScaledWidth(); const x = Math.round((cw - ow) / 2); obj.set({ left: x }); obj.setCoords(); fabricCanvas.requestRenderAll(); setPosX(x); } },
              { label: "Dir.", fn: () => { const obj = getActive(); if (!obj) return; const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom(); const ow = obj.getScaledWidth(); const x = Math.round(cw - ow); obj.set({ left: x }); obj.setCoords(); fabricCanvas.requestRenderAll(); setPosX(x); } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                className="py-1 rounded border border-border text-muted-foreground text-[7px] hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-0.5">
                <Move className="w-2 h-2" /> {label}
              </button>
            ))}
          </div>

          <button onClick={resetTransform}
            className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors">
            <RotateCcw className="w-3 h-3" /> Resetar transformações
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Cadeado mantém proporção ao redimensionar · Enter confirma posição
          </p>
        </>
      )}
    </div>
  );
}
