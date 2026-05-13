"use client";

import { useCallback, useEffect, useState } from "react";
import { Move, RotateCw, Link, Unlink } from "lucide-react";

interface PositionSizePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

function NumField({
  label,
  value,
  onChange,
  suffix = "",
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  const start = () => { setRaw(value.toString()); setEditing(true); };
  const commit = () => {
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(min !== undefined ? Math.max(min, max !== undefined ? Math.min(max, n) : n) : n);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center border border-border rounded bg-background hover:border-primary/40 focus-within:border-primary/60 transition-colors">
        <input
          type="number"
          value={editing ? raw : value}
          step={step}
          min={min}
          max={max}
          onFocus={start}
          onChange={(e) => editing ? setRaw(e.target.value) : onChange(Number(e.target.value))}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          className="w-full bg-transparent text-[11px] text-foreground px-1.5 py-1 outline-none tabular-nums"
        />
        {suffix && <span className="text-[9px] text-muted-foreground pr-1.5 flex-shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

export function PositionSizePanel({ fabricCanvas, selectionVersion }: PositionSizePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [w, setW] = useState(100);
  const [h, setH] = useState(100);
  const [angle, setAngle] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [lockRatio, setLockRatio] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion;

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setActive(null); return; }
      setActive(obj);
      setX(Math.round(obj.left ?? 0));
      setY(Math.round(obj.top ?? 0));
      setW(Math.round(obj.getScaledWidth?.() ?? obj.width ?? 0));
      setH(Math.round(obj.getScaledHeight?.() ?? obj.height ?? 0));
      setAngle(Math.round(obj.angle ?? 0));
      setOpacity(Math.round((obj.opacity ?? 1) * 100));
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const apply = useCallback((props: Record<string, unknown>) => {
    if (!active || !fabricCanvas) return;
    active.set(props);
    active.setCoords?.();
    fabricCanvas.requestRenderAll();
  }, [active, fabricCanvas]);

  const applyW = useCallback((val: number) => {
    if (!active || !fabricCanvas) return;
    const origW = active.getScaledWidth?.() ?? active.width ?? 1;
    const origH = active.getScaledHeight?.() ?? active.height ?? 1;
    const scaleX = val / (active.width ?? 1);
    if (lockRatio) {
      const ratio = origH / origW;
      const newH = val * ratio;
      const scaleY = newH / (active.height ?? 1);
      setH(Math.round(newH));
      apply({ scaleX, scaleY });
    } else {
      apply({ scaleX });
    }
    setW(val);
  }, [active, fabricCanvas, lockRatio, apply]);

  const applyH = useCallback((val: number) => {
    if (!active || !fabricCanvas) return;
    const origW = active.getScaledWidth?.() ?? active.width ?? 1;
    const origH = active.getScaledHeight?.() ?? active.height ?? 1;
    const scaleY = val / (active.height ?? 1);
    if (lockRatio) {
      const ratio = origW / origH;
      const newW = val * ratio;
      const scaleX = newW / (active.width ?? 1);
      setW(Math.round(newW));
      apply({ scaleX, scaleY });
    } else {
      apply({ scaleY });
    }
    setH(val);
  }, [active, fabricCanvas, lockRatio, apply]);

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground px-3">
        <Move className="w-6 h-6 opacity-30" />
        <p className="text-[11px] text-center">Selecione um elemento para ajustar posição e tamanho</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Move className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Posição e Tamanho</span>
      </div>

      {/* Position */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Posição</span>
        <div className="grid grid-cols-2 gap-2">
          <NumField
            label="X"
            value={x}
            onChange={(v) => { setX(v); apply({ left: v }); }}
            suffix="px"
          />
          <NumField
            label="Y"
            value={y}
            onChange={(v) => { setY(v); apply({ top: v }); }}
            suffix="px"
          />
        </div>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho</span>
          <button
            onClick={() => setLockRatio((v) => !v)}
            className={`flex items-center gap-1 text-[9px] transition-colors ${lockRatio ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title={lockRatio ? "Proporção travada" : "Travar proporção"}
          >
            {lockRatio ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
            {lockRatio ? "Travado" : "Livre"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumField
            label="Largura"
            value={w}
            min={1}
            onChange={applyW}
            suffix="px"
          />
          <NumField
            label="Altura"
            value={h}
            min={1}
            onChange={applyH}
            suffix="px"
          />
        </div>
      </div>

      {/* Rotation */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rotação</span>
        <div className="flex items-center gap-2">
          <RotateCw className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <NumField
            label=""
            value={angle}
            min={-360}
            max={360}
            onChange={(v) => { setAngle(v); apply({ angle: v }); }}
            suffix="°"
          />
          <div className="flex gap-1">
            {[0, 45, 90, 180].map((a) => (
              <button
                key={a}
                onClick={() => { setAngle(a); apply({ angle: a }); }}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${angle === a ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                {a}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Opacidade</span>
          <span className="text-[10px] tabular-nums">{opacity}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(e) => {
            const v = Number(e.target.value);
            setOpacity(v);
            apply({ opacity: v / 100 });
          }}
          className="w-full accent-primary"
        />
        <div className="flex gap-1">
          {[25, 50, 75, 100].map((v) => (
            <button
              key={v}
              onClick={() => { setOpacity(v); apply({ opacity: v / 100 }); }}
              className={`flex-1 text-[9px] py-0.5 rounded border transition-colors ${opacity === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ações Rápidas</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
              const ow = active.getScaledWidth?.() ?? active.width ?? 0;
              apply({ left: (cw - ow) / 2 });
              setX(Math.round((cw - ow) / 2));
            }}
            className="text-[10px] py-1.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            Centrar H
          </button>
          <button
            onClick={() => {
              const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();
              const oh = active.getScaledHeight?.() ?? active.height ?? 0;
              apply({ top: (ch - oh) / 2 });
              setY(Math.round((ch - oh) / 2));
            }}
            className="text-[10px] py-1.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            Centrar V
          </button>
          <button
            onClick={() => { apply({ left: 0 }); setX(0); }}
            className="text-[10px] py-1.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            Alinhar Esq.
          </button>
          <button
            onClick={() => { apply({ top: 0 }); setY(0); }}
            className="text-[10px] py-1.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            Alinhar Topo
          </button>
        </div>
      </div>
    </div>
  );
}
