"use client";

import { useCallback, useEffect, useState } from "react";
import { Blend } from "lucide-react";

interface OpacityBlendPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const BLEND_MODES = [
  { value: "", label: "Normal" },
  { value: "multiply", label: "Multiplicar" },
  { value: "screen", label: "Tela" },
  { value: "overlay", label: "Sobreposição" },
  { value: "darken", label: "Escurecer" },
  { value: "lighten", label: "Clarear" },
  { value: "color-dodge", label: "Dodge" },
  { value: "color-burn", label: "Burn" },
  { value: "hard-light", label: "Luz dura" },
  { value: "soft-light", label: "Luz suave" },
  { value: "difference", label: "Diferença" },
  { value: "exclusion", label: "Exclusão" },
  { value: "hue", label: "Matiz" },
  { value: "saturation", label: "Saturação" },
  { value: "color", label: "Cor" },
  { value: "luminosity", label: "Luminosidade" },
];

export function OpacityBlendPanel({ fabricCanvas, selectionVersion }: OpacityBlendPanelProps) {
  const [opacity, setOpacity] = useState(100);
  const [blendMode, setBlendMode] = useState("");
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      const obj = fabricCanvas.getActiveObject();
      if (!obj) {
        setHasSelection(false);
        return;
      }
      setHasSelection(true);
      setOpacity(Math.round((obj.opacity ?? 1) * 100));
      setBlendMode(obj.globalCompositeOperation ?? "");
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const applyOpacity = useCallback((val: number) => {
    const obj = fabricCanvas?.getActiveObject();
    if (!obj) return;
    obj.set({ opacity: val / 100 });
    fabricCanvas.requestRenderAll();
    setOpacity(val);
  }, [fabricCanvas]);

  const applyBlend = useCallback((val: string) => {
    const obj = fabricCanvas?.getActiveObject();
    if (!obj) return;
    obj.set({ globalCompositeOperation: val || undefined });
    fabricCanvas.requestRenderAll();
    setBlendMode(val);
  }, [fabricCanvas]);

  if (!hasSelection) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-2">
          <Blend className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Opacidade e Mistura</span>
        </div>
        <p className="text-[11px] text-muted-foreground/60 text-center py-4">
          Selecione um objeto para ajustar
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Blend className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Opacidade e Mistura</span>
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Opacidade</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => applyOpacity(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground text-right outline-none focus:border-primary/50"
            />
            <span className="text-[10px] text-muted-foreground">%</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={opacity}
          onChange={(e) => applyOpacity(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
        {/* Quick presets */}
        <div className="flex gap-1">
          {[25, 50, 75, 100].map((v) => (
            <button
              key={v}
              onClick={() => applyOpacity(v)}
              className={`flex-1 text-[10px] py-0.5 rounded border transition-colors ${
                opacity === v
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>

      {/* Blend Mode */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Modo de mistura</label>
        <select
          value={blendMode}
          onChange={(e) => applyBlend(e.target.value)}
          className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
        >
          {BLEND_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Visual blend mode grid */}
        <div className="grid grid-cols-4 gap-1 mt-1">
          {BLEND_MODES.slice(0, 8).map((m) => (
            <button
              key={m.value}
              onClick={() => applyBlend(m.value)}
              className={`text-[9px] py-1 px-0.5 rounded border transition-colors truncate ${
                blendMode === m.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
              title={m.label}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
