"use client";

import { useCallback, useEffect, useState } from "react";
import { Crosshair, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

interface PreciseCoordsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type Unit = "px" | "cm" | "mm" | "in" | "%";

const PX_PER_CM = 37.7953;
const PX_PER_MM = 3.77953;
const PX_PER_IN = 96;

function pxTo(px: number, unit: Unit, canvasPx: number): number {
  switch (unit) {
    case "cm": return px / PX_PER_CM;
    case "mm": return px / PX_PER_MM;
    case "in": return px / PX_PER_IN;
    case "%": return (px / canvasPx) * 100;
    default: return px;
  }
}

function toPx(val: number, unit: Unit, canvasPx: number): number {
  switch (unit) {
    case "cm": return val * PX_PER_CM;
    case "mm": return val * PX_PER_MM;
    case "in": return val * PX_PER_IN;
    case "%": return (val / 100) * canvasPx;
    default: return val;
  }
}

const SNAP_SIZES = [1, 5, 10, 25, 50];
const ALIGN_PRESETS = [
  { label: "Centro H", action: "centerH" },
  { label: "Centro V", action: "centerV" },
  { label: "Topo", action: "top" },
  { label: "Base", action: "bottom" },
  { label: "Esq.", action: "left" },
  { label: "Dir.", action: "right" },
];

export function PreciseCoordsPanel({ fabricCanvas, selectionVersion }: PreciseCoordsProps) {
  const [hasObject, setHasObject] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [w, setW] = useState(100);
  const [h, setH] = useState(100);
  const [angle, setAngle] = useState(0);
  const [unit, setUnit] = useState<Unit>("px");
  const [lockWH, setLockWH] = useState(false);
  const [snapSize, setSnapSize] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  const cw = useCallback(() => (fabricCanvas ? fabricCanvas.getWidth() / fabricCanvas.getZoom() : 1000), [fabricCanvas]);
  const ch = useCallback(() => (fabricCanvas ? fabricCanvas.getHeight() / fabricCanvas.getZoom() : 1000), [fabricCanvas]);

  const fmt = useCallback((px: number, forW = false) => {
    const base = forW ? cw() : ch();
    const v = pxTo(px, unit, base);
    return unit === "px" ? Math.round(v) : parseFloat(v.toFixed(2));
  }, [unit, cw, ch]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { queueMicrotask(() => setHasObject(false)); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    queueMicrotask(() => {
      setHasObject(true);
      setX(fmt(o.left ?? 0, true));
      setY(fmt(o.top ?? 0));
      setW(fmt((o.width ?? 100) * (o.scaleX ?? 1), true));
      setH(fmt((o.height ?? 100) * (o.scaleY ?? 1)));
      setAngle(Math.round(o.angle ?? 0));
    });
  }, [fabricCanvas, selectionVersion, fmt]);

  const getObj = useCallback(() => fabricCanvas?.getActiveObject(), [fabricCanvas]);

  const applyPos = useCallback((nx: number, ny: number) => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    obj.set({
      left: toPx(nx, unit, cw()),
      top: toPx(ny, unit, ch()),
    });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, getObj, unit, cw, ch]);

  const applySize = useCallback((nw: number, nh: number) => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    const wPx = toPx(nw, unit, cw());
    const hPx = toPx(nh, unit, ch());
    const origW = o.width ?? 100;
    const origH = o.height ?? 100;
    obj.set({
      scaleX: wPx / origW,
      scaleY: hPx / origH,
    });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, getObj, unit, cw, ch]);

  const applyAngleVal = useCallback((a: number) => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    obj.set({ angle: a });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, getObj]);

  const handleX = (v: number) => { setX(v); applyPos(v, y); };
  const handleY = (v: number) => { setY(v); applyPos(x, v); };
  const handleW = (v: number) => {
    if (lockWH) {
      const ratio = w > 0 ? v / w : 1;
      const nh = parseFloat((h * ratio).toFixed(2));
      setW(v); setH(nh); applySize(v, nh);
    } else {
      setW(v); applySize(v, h);
    }
  };
  const handleH = (v: number) => {
    if (lockWH) {
      const ratio = h > 0 ? v / h : 1;
      const nw = parseFloat((w * ratio).toFixed(2));
      setH(v); setW(nw); applySize(nw, v);
    } else {
      setH(v); applySize(w, v);
    }
  };

  const alignPreset = useCallback((action: string) => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    const canvasW = cw();
    const canvasH = ch();
    const objW = (o.width ?? 0) * (o.scaleX ?? 1);
    const objH = (o.height ?? 0) * (o.scaleY ?? 1);
    const pos: { left?: number; top?: number } = {};
    switch (action) {
      case "centerH": pos.left = (canvasW - objW) / 2; break;
      case "centerV": pos.top = (canvasH - objH) / 2; break;
      case "top": pos.top = 0; break;
      case "bottom": pos.top = canvasH - objH; break;
      case "left": pos.left = 0; break;
      case "right": pos.left = canvasW - objW; break;
    }
    obj.set(pos);
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    const newX = fmt(o.left ?? 0, true);
    const newY = fmt(o.top ?? 0);
    setX(newX); setY(newY);
    toast.success("Posição aplicada");
  }, [fabricCanvas, getObj, cw, ch, fmt]);

  const toggleGrid = () => {
    if (!fabricCanvas) return;
    const next = !showGrid;
    setShowGrid(next);
    if (next && snapSize > 0) {
      fabricCanvas.set({ snapAngle: 0, snapThreshold: snapSize });
    } else {
      fabricCanvas.set({ snapAngle: 0, snapThreshold: 0 });
    }
    fabricCanvas.requestRenderAll();
    toast.success(next ? `Grade ${snapSize > 0 ? `${snapSize}px ` : ""}ativada` : "Grade desativada");
  };

  if (!hasObject) {
    return (
      <div className="flex flex-col gap-4 p-3">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Coordenadas Precisas</span>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <Crosshair className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-[11px] text-muted-foreground">Nenhum objeto selecionado</p>
        </div>

        {/* Canvas Grid / Snap — works even without selection */}
        <div className="flex flex-col gap-2 p-2 rounded border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Grade e Snap</span>
            <button
              onClick={toggleGrid}
              className={`relative w-8 h-4 rounded-full transition-colors ${showGrid ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${showGrid ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex gap-1">
            {SNAP_SIZES.map(s => (
              <button key={s} onClick={() => setSnapSize(s)} className={`flex-1 text-[8px] py-0.5 rounded border ${snapSize === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>{s}px</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Coordenadas Precisas</span>
        </div>
        {/* Unit selector */}
        <div className="flex gap-0.5">
          {(["px", "cm", "mm", "in", "%"] as Unit[]).map(u => (
            <button key={u} onClick={() => setUnit(u)} className={`px-1.5 py-0.5 rounded text-[8px] border transition-colors ${unit === u ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>{u}</button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Posição</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">X ({unit})</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handleX(x - 1)} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">−</button>
              <input
                type="number"
                value={x}
                onChange={e => handleX(Number(e.target.value))}
                step={unit === "px" ? 1 : 0.1}
                className="flex-1 text-center text-[10px] bg-background border border-border rounded py-1 outline-none focus:border-primary/50"
              />
              <button onClick={() => handleX(x + 1)} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Y ({unit})</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handleY(y - 1)} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">−</button>
              <input
                type="number"
                value={y}
                onChange={e => handleY(Number(e.target.value))}
                step={unit === "px" ? 1 : 0.1}
                className="flex-1 text-center text-[10px] bg-background border border-border rounded py-1 outline-none focus:border-primary/50"
              />
              <button onClick={() => handleY(y + 1)} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho</span>
          <button
            onClick={() => setLockWH(!lockWH)}
            className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded border transition-colors ${lockWH ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
          >
            {lockWH ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            {lockWH ? "Proporcional" : "Livre"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">L ({unit})</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handleW(Math.max(1, w - 1))} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">−</button>
              <input
                type="number"
                value={w}
                onChange={e => handleW(Number(e.target.value))}
                step={unit === "px" ? 1 : 0.1}
                className="flex-1 text-center text-[10px] bg-background border border-border rounded py-1 outline-none focus:border-primary/50"
              />
              <button onClick={() => handleW(w + 1)} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">A ({unit})</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handleH(Math.max(1, h - 1))} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">−</button>
              <input
                type="number"
                value={h}
                onChange={e => handleH(Number(e.target.value))}
                step={unit === "px" ? 1 : 0.1}
                className={`flex-1 text-center text-[10px] bg-background border border-border rounded py-1 outline-none focus:border-primary/50 ${lockWH ? "opacity-60" : ""}`}
                readOnly={lockWH}
              />
              <button onClick={() => handleH(h + 1)} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rotação</span>
          <span className="text-[10px] tabular-nums">{angle}°</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { setAngle(Math.max(0, angle - 1)); applyAngleVal(Math.max(0, angle - 1)); }} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">−</button>
          <input
            type="number"
            value={angle}
            min={0} max={359}
            onChange={e => { const v = Number(e.target.value); setAngle(v); applyAngleVal(v); }}
            className="flex-1 text-center text-[10px] bg-background border border-border rounded py-1 outline-none focus:border-primary/50"
          />
          <button onClick={() => { setAngle(Math.min(359, angle + 1)); applyAngleVal(Math.min(359, angle + 1)); }} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">+</button>
        </div>
        <div className="flex gap-1">
          {[0, 45, 90, 135, 180, 270].map(v => (
            <button key={v} onClick={() => { setAngle(v); applyAngleVal(v); }} className={`flex-1 text-[8px] py-0.5 rounded border transition-colors ${angle === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>{v}°</button>
          ))}
        </div>
      </div>

      {/* Quick align */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhar no Canvas</span>
        <div className="grid grid-cols-3 gap-1">
          {ALIGN_PRESETS.map(a => (
            <button key={a.action} onClick={() => alignPreset(a.action)} className="py-1.5 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">{a.label}</button>
          ))}
        </div>
      </div>

      {/* Snap to grid */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Snap / Grade</span>
          <button
            onClick={toggleGrid}
            className={`relative w-8 h-4 rounded-full transition-colors ${showGrid ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${showGrid ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div className="flex gap-1">
          {SNAP_SIZES.map(s => (
            <button key={s} onClick={() => setSnapSize(s)} className={`flex-1 text-[8px] py-0.5 rounded border ${snapSize === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>{s}px</button>
          ))}
        </div>
      </div>
    </div>
  );
}
