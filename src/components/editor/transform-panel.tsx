"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, RotateCw, FlipHorizontal2, FlipVertical2, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";

interface TransformPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

export function TransformPanel({ fabricCanvas, selectionVersion }: TransformPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [angle, setAngle] = useState(0);
  const [scaleX, setScaleX] = useState(100);
  const [scaleY, setScaleY] = useState(100);
  const [lockAspect, setLockAspect] = useState(true);
  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { queueMicrotask(() => setHasObject(false)); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    queueMicrotask(() => {
      setHasObject(true);
      setAngle(Math.round(o.angle ?? 0));
      setScaleX(Math.round((o.scaleX ?? 1) * 100));
      setScaleY(Math.round((o.scaleY ?? 1) * 100));
      setSkewX(Math.round(o.skewX ?? 0));
      setSkewY(Math.round(o.skewY ?? 0));
    });
  }, [fabricCanvas, selectionVersion]);

  const getObj = () => fabricCanvas?.getActiveObject();

  const applyAngle = useCallback((v: number) => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    obj.set({ angle: v });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const applyScale = useCallback((sx: number, sy: number) => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    obj.set({ scaleX: sx / 100, scaleY: sy / 100 });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const applySkew = useCallback((sx: number, sy: number) => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    obj.set({ skewX: sx, skewY: sy });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const handleAngle = (v: number) => { setAngle(v); applyAngle(v); };
  const handleScaleX = (v: number) => {
    if (lockAspect) { setScaleX(v); setScaleY(v); applyScale(v, v); }
    else { setScaleX(v); applyScale(v, scaleY); }
  };
  const handleScaleY = (v: number) => {
    if (lockAspect) { setScaleX(v); setScaleY(v); applyScale(v, v); }
    else { setScaleY(v); applyScale(scaleX, v); }
  };

  const rotate = useCallback((deg: number) => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    const newAngle = ((obj.angle ?? 0) + deg + 360) % 360;
    obj.set({ angle: newAngle });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setAngle(Math.round(newAngle));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const flip = useCallback((axis: "X" | "Y") => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    if (axis === "X") obj.set({ flipX: !o.flipX });
    else obj.set({ flipY: !o.flipY });
    fabricCanvas.requestRenderAll();
    toast.success(`Espelhado ${axis === "X" ? "horizontalmente" : "verticalmente"}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const resetTransform = useCallback(() => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    obj.set({ angle: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0, flipX: false, flipY: false });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setAngle(0); setScaleX(100); setScaleY(100); setSkewX(0); setSkewY(0);
    toast.success("Transformações resetadas");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const fitToCanvas = useCallback(() => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ow = (obj as any).width ?? 100;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oh = (obj as any).height ?? 100;
    const scale = Math.min(cw / ow, ch / oh) * 0.9;
    obj.set({ scaleX: scale, scaleY: scale, left: cw / 2, top: ch / 2, originX: "center", originY: "center" });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setScaleX(Math.round(scale * 100));
    setScaleY(Math.round(scale * 100));
    toast.success("Ajustado ao canvas");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const fillCanvas = useCallback(() => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ow = (obj as any).width ?? 100;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oh = (obj as any).height ?? 100;
    const scale = Math.max(cw / ow, ch / oh);
    obj.set({ scaleX: scale, scaleY: scale, left: cw / 2, top: ch / 2, originX: "center", originY: "center" });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setScaleX(Math.round(scale * 100));
    setScaleY(Math.round(scale * 100));
    toast.success("Preencheu o canvas");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  if (!hasObject) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <RefreshCw className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground">Selecione um objeto para transformar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Transformações</span>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => rotate(-90)} className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> -90°
        </button>
        <button onClick={() => rotate(90)} className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors">
          <RotateCw className="w-3.5 h-3.5" /> +90°
        </button>
        <button onClick={() => flip("X")} className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors">
          <FlipHorizontal2 className="w-3.5 h-3.5" /> Horizontal
        </button>
        <button onClick={() => flip("Y")} className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors">
          <FlipVertical2 className="w-3.5 h-3.5" /> Vertical
        </button>
        <button onClick={fitToCanvas} className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors">
          <Minimize2 className="w-3.5 h-3.5" /> Caber
        </button>
        <button onClick={fillCanvas} className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors">
          <Maximize2 className="w-3.5 h-3.5" /> Preencher
        </button>
      </div>

      {/* Rotation */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rotação</span>
          <span className="text-[10px] tabular-nums">{angle}°</span>
        </div>
        <input
          type="range" min={0} max={359} step={1} value={angle}
          onChange={(e) => handleAngle(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
        <div className="flex gap-1">
          {[0, 45, 90, 135, 180, 270].map((v) => (
            <button key={v} onClick={() => handleAngle(v)} className={`flex-1 text-[8px] py-0.5 rounded border transition-colors ${angle === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>{v}°</button>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Escala</span>
          <button
            onClick={() => setLockAspect(!lockAspect)}
            className={`text-[8px] px-1.5 py-0.5 rounded border transition-colors ${lockAspect ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
          >
            {lockAspect ? "🔒 Proporcional" : "🔓 Livre"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Largura %</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handleScaleX(Math.max(10, scaleX - 10))} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px] text-muted-foreground hover:border-primary/30">−</button>
              <input
                type="number" min={10} max={1000} value={scaleX}
                onChange={(e) => handleScaleX(Number(e.target.value))}
                className="flex-1 text-center text-[10px] bg-background border border-border rounded py-1 outline-none focus:border-primary/50"
              />
              <button onClick={() => handleScaleX(Math.min(1000, scaleX + 10))} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px] text-muted-foreground hover:border-primary/30">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Altura %</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handleScaleY(Math.max(10, scaleY - 10))} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px] text-muted-foreground hover:border-primary/30">−</button>
              <input
                type="number" min={10} max={1000} value={scaleY}
                onChange={(e) => handleScaleY(Number(e.target.value))}
                className={`flex-1 text-center text-[10px] bg-background border border-border rounded py-1 outline-none focus:border-primary/50 ${lockAspect ? "opacity-50" : ""}`}
                readOnly={lockAspect}
              />
              <button onClick={() => handleScaleY(Math.min(1000, scaleY + 10))} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px] text-muted-foreground hover:border-primary/30">+</button>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {[25, 50, 75, 100, 150, 200].map((v) => (
            <button key={v} onClick={() => { setScaleX(v); setScaleY(v); applyScale(v, v); }} className={`flex-1 text-[8px] py-0.5 rounded border transition-colors ${scaleX === v && scaleY === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>{v}%</button>
          ))}
        </div>
      </div>

      {/* Skew */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Inclinação (Skew)</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">X</span>
              <span className="text-[9px] tabular-nums">{skewX}°</span>
            </div>
            <input type="range" min={-45} max={45} step={1} value={skewX} onChange={(e) => { setSkewX(Number(e.target.value)); applySkew(Number(e.target.value), skewY); }} className="w-full accent-primary h-1" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Y</span>
              <span className="text-[9px] tabular-nums">{skewY}°</span>
            </div>
            <input type="range" min={-45} max={45} step={1} value={skewY} onChange={(e) => { setSkewY(Number(e.target.value)); applySkew(skewX, Number(e.target.value)); }} className="w-full accent-primary h-1" />
          </div>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={resetTransform}
        className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-red-400/30 hover:text-red-400 transition-colors"
      >
        <RefreshCw className="w-3 h-3" /> Resetar Transformações
      </button>
    </div>
  );
}
