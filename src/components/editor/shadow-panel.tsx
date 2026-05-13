"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface ShadowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const SHADOW_PRESETS = [
  { label: "Suave", color: "rgba(0,0,0,0.3)", offsetX: 2, offsetY: 2, blur: 10 },
  { label: "Forte", color: "rgba(0,0,0,0.7)", offsetX: 4, offsetY: 4, blur: 8 },
  { label: "Dramática", color: "rgba(0,0,0,0.85)", offsetX: 8, offsetY: 8, blur: 20 },
  { label: "Neon Azul", color: "rgba(59,130,246,0.8)", offsetX: 0, offsetY: 0, blur: 20 },
  { label: "Neon Rosa", color: "rgba(236,72,153,0.8)", offsetX: 0, offsetY: 0, blur: 20 },
  { label: "Neon Verde", color: "rgba(34,197,94,0.8)", offsetX: 0, offsetY: 0, blur: 20 },
  { label: "Dourada", color: "rgba(234,179,8,0.7)", offsetX: 3, offsetY: 3, blur: 12 },
  { label: "Interna", color: "rgba(0,0,0,0.5)", offsetX: 0, offsetY: 0, blur: 5 },
];

export function ShadowPanel({ fabricCanvas, selectionVersion }: ShadowPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [enabled, setEnabled] = useState(false);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(50);
  const [offsetX, setOffsetX] = useState(4);
  const [offsetY, setOffsetY] = useState(4);
  const [blur, setBlur] = useState(10);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion;

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setActive(null); return; }
      setActive(obj);
      const shadow = obj.shadow;
      if (shadow) {
        setEnabled(true);
        const sc = shadow.color ?? "rgba(0,0,0,0.5)";
        // Parse rgba to hex + opacity
        const match = sc.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          const a = match[4] ? parseFloat(match[4]) : 1;
          setColor(`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`);
          setOpacity(Math.round(a * 100));
        }
        setOffsetX(shadow.offsetX ?? 4);
        setOffsetY(shadow.offsetY ?? 4);
        setBlur(shadow.blur ?? 10);
      } else {
        setEnabled(false);
      }
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const buildShadowString = useCallback((hex: string, op: number, ox: number, oy: number, b: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const bl = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${bl},${op / 100}) ${ox}px ${oy}px ${b}px`;
  }, []);

  const applyShadow = useCallback((hex: string, op: number, ox: number, oy: number, b: number) => {
    if (!active || !fabricCanvas) return;
    const shadowStr = buildShadowString(hex, op, ox, oy, b);
    active.set({ shadow: shadowStr });
    fabricCanvas.requestRenderAll();
  }, [active, fabricCanvas, buildShadowString]);

  const removeShadow = useCallback(() => {
    if (!active || !fabricCanvas) return;
    active.set({ shadow: null });
    fabricCanvas.requestRenderAll();
    setEnabled(false);
    toast.success("Sombra removida");
  }, [active, fabricCanvas]);

  const applyPreset = useCallback((preset: typeof SHADOW_PRESETS[0]) => {
    if (!active || !fabricCanvas) return;
    const shadowStr = `${preset.color} ${preset.offsetX}px ${preset.offsetY}px ${preset.blur}px`;
    active.set({ shadow: shadowStr });
    fabricCanvas.requestRenderAll();
    setEnabled(true);
    // Parse preset color for UI
    const match = preset.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const a = match[4] ? parseFloat(match[4]) : 1;
      setColor(`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`);
      setOpacity(Math.round(a * 100));
    }
    setOffsetX(preset.offsetX);
    setOffsetY(preset.offsetY);
    setBlur(preset.blur);
    toast.success(`Sombra "${preset.label}" aplicada`);
  }, [active, fabricCanvas]);

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground px-3">
        <Layers className="w-6 h-6 opacity-30" />
        <p className="text-[11px] text-center">Selecione um elemento para ajustar a sombra</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Sombra</span>
        <div className="ml-auto flex items-center gap-2">
          {enabled && (
            <button onClick={removeShadow} className="text-[10px] text-destructive/70 hover:text-destructive">
              Remover
            </button>
          )}
          <button
            onClick={() => {
              if (enabled) {
                removeShadow();
              } else {
                setEnabled(true);
                applyShadow(color, opacity, offsetX, offsetY, blur);
              }
            }}
            className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
        <div className="grid grid-cols-4 gap-1.5">
          {SHADOW_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="flex flex-col items-center gap-0.5 p-1.5 rounded border border-border hover:border-primary/40 hover:bg-accent/20 transition-all"
            >
              <div
                className="w-8 h-6 rounded bg-card"
                style={{
                  boxShadow: `${preset.color} ${preset.offsetX}px ${preset.offsetY}px ${preset.blur}px`,
                }}
              />
              <span className="text-[8px] text-muted-foreground text-center leading-tight">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom controls */}
      <div className="flex flex-col gap-3">
        {/* Color + Opacity */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16">Cor</span>
          <input
            type="color"
            value={color}
            onChange={(e) => { setColor(e.target.value); if (enabled) applyShadow(e.target.value, opacity, offsetX, offsetY, blur); }}
            className="w-8 h-7 rounded cursor-pointer border border-border"
          />
          <span className="text-[10px] text-muted-foreground ml-2 w-16">Opacidade</span>
          <input
            type="number"
            value={opacity}
            min={0}
            max={100}
            onChange={(e) => { const v = Number(e.target.value); setOpacity(v); if (enabled) applyShadow(color, v, offsetX, offsetY, blur); }}
            className="w-14 text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-foreground"
          />
          <span className="text-[9px] text-muted-foreground">%</span>
        </div>

        {/* Offset X */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">Deslocamento X</span>
            <span className="text-[10px] tabular-nums">{offsetX}px</span>
          </div>
          <Slider
            min={-100} max={100} step={1}
            value={[offsetX]}
            onValueChange={(vals) => { const v = Array.isArray(vals) ? vals[0] : (vals as number); setOffsetX(v); if (enabled) applyShadow(color, opacity, v, offsetY, blur); }}
          />
        </div>

        {/* Offset Y */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">Deslocamento Y</span>
            <span className="text-[10px] tabular-nums">{offsetY}px</span>
          </div>
          <Slider
            min={-100} max={100} step={1}
            value={[offsetY]}
            onValueChange={(vals) => { const v = Array.isArray(vals) ? vals[0] : (vals as number); setOffsetY(v); if (enabled) applyShadow(color, opacity, offsetX, v, blur); }}
          />
        </div>

        {/* Blur */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">Desfoque</span>
            <span className="text-[10px] tabular-nums">{blur}px</span>
          </div>
          <Slider
            min={0} max={100} step={1}
            value={[blur]}
            onValueChange={(vals) => { const v = Array.isArray(vals) ? vals[0] : (vals as number); setBlur(v); if (enabled) applyShadow(color, opacity, offsetX, offsetY, v); }}
          />
        </div>

        {/* Preview */}
        <div className="flex items-center justify-center py-3 bg-muted/30 rounded-lg border border-border">
          <span
            className="text-2xl font-bold text-white"
            style={{
              textShadow: enabled ? buildShadowString(color, opacity, offsetX, offsetY, blur) : "none",
            }}
          >
            Texto
          </span>
        </div>
      </div>
    </div>
  );
}
