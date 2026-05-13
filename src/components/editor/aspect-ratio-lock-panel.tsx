"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, Unlock, RotateCcw, Maximize2 } from "lucide-react";
import { toast } from "sonner";

interface AspectRatioLockPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ObjState {
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  ratio: number;
}

const PRESETS: { label: string; w: number; h: number }[] = [
  { label: "1:1", w: 1, h: 1 },
  { label: "4:3", w: 4, h: 3 },
  { label: "16:9", w: 16, h: 9 },
  { label: "3:2", w: 3, h: 2 },
  { label: "2:3", w: 2, h: 3 },
  { label: "9:16", w: 9, h: 16 },
  { label: "3:4", w: 3, h: 4 },
  { label: "√2", w: 1.414, h: 1 },
];

export function AspectRatioLockPanel({ fabricCanvas, selectionVersion }: AspectRatioLockPanelProps) {
  const [locked, setLocked] = useState(false);
  const [objState, setObjState] = useState<ObjState | null>(null);
  const [inputW, setInputW] = useState("");
  const [inputH, setInputH] = useState("");

  const readObject = useCallback(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      const obj = fabricCanvas.getActiveObject();
      if (!obj) { setObjState(null); return; }
      const w = Math.round((obj.width ?? 0) * (obj.scaleX ?? 1));
      const h = Math.round((obj.height ?? 0) * (obj.scaleY ?? 1));
      const state: ObjState = {
        width: w,
        height: h,
        scaleX: obj.scaleX ?? 1,
        scaleY: obj.scaleY ?? 1,
        ratio: h > 0 ? w / h : 1,
      };
      setObjState(state);
      setInputW(String(w));
      setInputH(String(h));
    });
  }, [fabricCanvas]);

  useEffect(() => {
    readObject();
  }, [fabricCanvas, selectionVersion, readObject]);

  const applySize = useCallback((newW: number, newH: number) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    const baseW = obj.width ?? 1;
    const baseH = obj.height ?? 1;
    obj.set({
      scaleX: newW / baseW,
      scaleY: newH / baseH,
    });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setObjState(prev => prev ? { ...prev, width: newW, height: newH, scaleX: newW / baseW, scaleY: newH / baseH } : null);
  }, [fabricCanvas]);

  const handleWidthChange = useCallback((val: string) => {
    setInputW(val);
    const n = Number(val);
    if (!n || !objState) return;
    if (locked) {
      const newH = Math.round(n / objState.ratio);
      setInputH(String(newH));
      applySize(n, newH);
    } else {
      applySize(n, objState.height);
    }
  }, [locked, objState, applySize]);

  const handleHeightChange = useCallback((val: string) => {
    setInputH(val);
    const n = Number(val);
    if (!n || !objState) return;
    if (locked) {
      const newW = Math.round(n * objState.ratio);
      setInputW(String(newW));
      applySize(newW, n);
    } else {
      applySize(objState.width, n);
    }
  }, [locked, objState, applySize]);

  const applyPreset = useCallback((w: number, h: number) => {
    if (!objState) return;
    const maxSide = Math.max(objState.width, objState.height);
    const ratio = w / h;
    let newW: number, newH: number;
    if (ratio >= 1) {
      newW = maxSide;
      newH = Math.round(maxSide / ratio);
    } else {
      newH = maxSide;
      newW = Math.round(maxSide * ratio);
    }
    setInputW(String(newW));
    setInputH(String(newH));
    applySize(newW, newH);
    toast.success(`Proporção ${w}:${h} aplicada`);
  }, [objState, applySize]);

  const resetScale = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ scaleX: 1, scaleY: 1 });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    readObject();
    toast.success("Escala redefinida para 100%");
  }, [fabricCanvas, readObject]);

  const makeSquare = useCallback(() => {
    if (!objState) return;
    const side = Math.max(objState.width, objState.height);
    applySize(side, side);
    setInputW(String(side));
    setInputH(String(side));
    toast.success("Objeto tornado quadrado");
  }, [objState, applySize]);

  if (!objState) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Proporção e Tamanho</span>
        </div>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Maximize2 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para editar o tamanho</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Proporção e Tamanho</span>
      </div>

      {/* W/H inputs with lock */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Dimensões (px)</span>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[8px] text-muted-foreground">Largura</span>
            <input
              type="number"
              min={1}
              value={inputW}
              onChange={e => handleWidthChange(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => setLocked(v => !v)}
            className={`mt-4 flex-shrink-0 p-1.5 rounded border transition-colors ${locked ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/40"}`}
            title={locked ? "Desbloquear proporção" : "Bloquear proporção"}
          >
            {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[8px] text-muted-foreground">Altura</span>
            <input
              type="number"
              min={1}
              value={inputH}
              onChange={e => handleHeightChange(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        {locked && (
          <p className="text-[8px] text-primary/70 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Proporção bloqueada — altera W e H proporcionalmente
          </p>
        )}
      </div>

      {/* Current ratio display */}
      <div className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50">
        <span className="text-[9px] text-muted-foreground">Proporção atual</span>
        <span className="text-[9px] font-mono tabular-nums">
          {objState.width}:{objState.height} ({(objState.ratio).toFixed(2)})
        </span>
      </div>

      {/* Preset ratios */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Proporções predefinidas</span>
        <div className="grid grid-cols-4 gap-1">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.w, p.h)}
              className="py-1.5 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={makeSquare}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Maximize2 className="w-3 h-3" /> Tornar quadrado
        </button>
        <button
          onClick={resetScale}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/40 hover:text-primary transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Escala 100%
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Segure Shift ao redimensionar no canvas para manter a proporção
      </p>
    </div>
  );
}
