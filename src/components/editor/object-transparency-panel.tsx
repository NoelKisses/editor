"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectTransparencyPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const OPACITY_PRESETS = [10, 25, 50, 75, 100];

const BLEND_MODES = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiplicar" },
  { value: "screen", label: "Tela" },
  { value: "overlay", label: "Sobrepor" },
  { value: "darken", label: "Escurecer" },
  { value: "lighten", label: "Clarear" },
  { value: "color-dodge", label: "Dissipar cor" },
  { value: "color-burn", label: "Queimar cor" },
  { value: "hard-light", label: "Luz dura" },
  { value: "soft-light", label: "Luz suave" },
  { value: "difference", label: "Diferença" },
  { value: "exclusion", label: "Exclusão" },
  { value: "hue", label: "Matiz" },
  { value: "saturation", label: "Saturação" },
  { value: "color", label: "Cor" },
  { value: "luminosity", label: "Luminosidade" },
];

function OpacityBar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div
      className="relative w-full h-6 rounded overflow-hidden cursor-pointer border border-border"
      style={{
        background: "linear-gradient(to right, transparent, #000)",
        backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAB3RJTUUH4QMECiozFU3vAAAAGklEQVQY02NgYGD4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg=="), linear-gradient(to right, transparent, #000)`,
      }}
      onClick={e => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onChange(Math.round(pct * 100));
      }}
    >
      <div
        className="absolute top-0 bottom-0 w-2 bg-white border border-border rounded-sm shadow"
        style={{ left: `calc(${value}% - 4px)` }}
      />
    </div>
  );
}

export function ObjectTransparencyPanel({ fabricCanvas, selectionVersion }: ObjectTransparencyPanelProps) {
  const [hasObj, setHasObj] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [blendMode, setBlendMode] = useState("source-over");
  const [objType, setObjType] = useState("");

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setHasObj(false); return; }
      setHasObj(true);
      setObjType(obj.type ?? "");
      setOpacity(Math.round((obj.opacity ?? 1) * 100));
      setBlendMode(obj.globalCompositeOperation ?? "source-over");
    });
  }, [fabricCanvas, selectionVersion]);

  const applyOpacity = useCallback((val: number) => {
    setOpacity(val);
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ opacity: val / 100 });
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const applyBlendMode = useCallback((mode: string) => {
    setBlendMode(mode);
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ globalCompositeOperation: mode });
    fabricCanvas.requestRenderAll();
    toast.success(`Modo: ${BLEND_MODES.find(m => m.value === mode)?.label ?? mode}`);
  }, [fabricCanvas]);

  const resetAll = useCallback(() => {
    applyOpacity(100);
    applyBlendMode("source-over");
    toast.success("Transparência redefinida");
  }, [applyOpacity, applyBlendMode]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Transparência e Blend</span>
      </div>

      {!hasObj ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Layers className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para ajustar a transparência</p>
        </div>
      ) : (
        <>
          {/* Object badge */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-muted/20">
            <span className="text-[9px] text-muted-foreground">Objeto:</span>
            <span className="text-[9px] font-mono text-primary">{objType}</span>
            <span className="ml-auto text-[9px] text-muted-foreground/60">{opacity}% opacidade</span>
          </div>

          {/* Opacity slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Opacidade</span>
              <span className="text-[9px] tabular-nums font-mono">{opacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={opacity}
              onChange={e => applyOpacity(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
            <OpacityBar value={opacity} onChange={applyOpacity} />
            <div className="flex gap-1">
              {OPACITY_PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => applyOpacity(p)}
                  className={`flex-1 py-1 rounded border text-[8px] transition-colors ${opacity === p ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Blend mode */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Modo de mistura</span>
            <select
              value={blendMode}
              onChange={e => applyBlendMode(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-[9px] focus:outline-none focus:border-primary"
            >
              {BLEND_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            {/* Blend mode grid */}
            <div className="grid grid-cols-2 gap-1 mt-1">
              {BLEND_MODES.slice(0, 8).map(m => (
                <button
                  key={m.value}
                  onClick={() => applyBlendMode(m.value)}
                  className={`py-1 rounded border text-[8px] transition-colors truncate ${blendMode === m.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual preview */}
          <div className="flex items-center justify-center p-3 rounded bg-muted/30 border border-border/50 overflow-hidden">
            <div className="relative w-20 h-14">
              <div className="absolute inset-0 rounded" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }} />
              <div
                className="absolute inset-2 rounded bg-primary"
                style={{
                  opacity: opacity / 100,
                  mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"],
                }}
              />
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={resetAll}
            className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 hover:text-primary transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Redefinir
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Blend mode afeta como o objeto se mistura com os abaixo
          </p>
        </>
      )}
    </div>
  );
}
