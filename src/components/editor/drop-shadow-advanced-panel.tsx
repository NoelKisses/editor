"use client";

import { useCallback, useEffect, useState } from "react";
import { Eclipse } from "lucide-react";
import { toast } from "sonner";

interface DropShadowAdvancedPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ShadowConfig {
  enabled: boolean;
  color: string;
  opacity: number;
  blur: number;
  offsetX: number;
  offsetY: number;
}

const SHADOW_PRESETS = [
  { label: "Suave", color: "#000000", opacity: 30, blur: 20, offsetX: 4, offsetY: 4 },
  { label: "Forte", color: "#000000", opacity: 60, blur: 10, offsetX: 6, offsetY: 6 },
  { label: "Neon", color: "#6366f1", opacity: 80, blur: 30, offsetX: 0, offsetY: 0 },
  { label: "Longa", color: "#000000", opacity: 40, blur: 5, offsetX: 20, offsetY: 20 },
  { label: "Colorida", color: "#ff00ff", opacity: 70, blur: 25, offsetX: 5, offsetY: -5 },
  { label: "Dupla", color: "#00ffff", opacity: 60, blur: 15, offsetX: -8, offsetY: 8 },
  { label: "Elevação", color: "#0000ff", opacity: 20, blur: 40, offsetX: 0, offsetY: 10 },
  { label: "Retro", color: "#ff6600", opacity: 100, blur: 0, offsetX: 8, offsetY: 8 },
];

function hexToRgba(hex: string, opacity: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
}

export function DropShadowAdvancedPanel({ fabricCanvas, selectionVersion }: DropShadowAdvancedPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [shadow, setShadow] = useState<ShadowConfig>({
    enabled: false,
    color: "#000000",
    opacity: 40,
    blur: 15,
    offsetX: 5,
    offsetY: 5,
  });

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) {
      queueMicrotask(() => setHasObject(false));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (obj as any).shadow;
    queueMicrotask(() => {
      setHasObject(true);
      if (existing) {
        // Parse existing shadow
        const colorStr: string = existing.color ?? "rgba(0,0,0,0.4)";
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
          const r = parseInt(match[1]).toString(16).padStart(2, "0");
          const g = parseInt(match[2]).toString(16).padStart(2, "0");
          const b = parseInt(match[3]).toString(16).padStart(2, "0");
          const a = match[4] ? Math.round(parseFloat(match[4]) * 100) : 40;
          setShadow({
            enabled: true,
            color: `#${r}${g}${b}`,
            opacity: a,
            blur: existing.blur ?? 15,
            offsetX: existing.offsetX ?? 5,
            offsetY: existing.offsetY ?? 5,
          });
        }
      } else {
        setShadow((s) => ({ ...s, enabled: false }));
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const applyShadow = useCallback(async (cfg: ShadowConfig) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    const { fabric } = await import("fabric").then((m) => m);
    if (!cfg.enabled) {
      obj.set({ shadow: null });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.set({ shadow: new (fabric as any).Shadow({
        color: hexToRgba(cfg.color, cfg.opacity),
        blur: cfg.blur,
        offsetX: cfg.offsetX,
        offsetY: cfg.offsetY,
      })});
    }
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const handleChange = useCallback(<K extends keyof ShadowConfig>(key: K, value: ShadowConfig[K]) => {
    const newShadow = { ...shadow, [key]: value };
    setShadow(newShadow);
    if (newShadow.enabled) applyShadow(newShadow);
  }, [shadow, applyShadow]);

  const handleToggle = useCallback(() => {
    const newShadow = { ...shadow, enabled: !shadow.enabled };
    setShadow(newShadow);
    applyShadow(newShadow);
    toast.success(newShadow.enabled ? "Sombra ativada" : "Sombra removida");
  }, [shadow, applyShadow]);

  const applyPreset = useCallback((preset: typeof SHADOW_PRESETS[0]) => {
    const newShadow: ShadowConfig = {
      enabled: true,
      color: preset.color,
      opacity: preset.opacity,
      blur: preset.blur,
      offsetX: preset.offsetX,
      offsetY: preset.offsetY,
    };
    setShadow(newShadow);
    applyShadow(newShadow);
    toast.success(`Preset "${preset.label}" aplicado`);
  }, [applyShadow]);

  if (!hasObject) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Eclipse className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground">Selecione um objeto para adicionar sombra avançada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eclipse className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Sombra Avançada</span>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-10 h-5 rounded-full transition-colors ${shadow.enabled ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${shadow.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
        <div className="grid grid-cols-4 gap-1">
          {SHADOW_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="flex flex-col items-center gap-0.5 p-1.5 rounded border border-border hover:border-primary/40 transition-all group"
            >
              <div
                className="w-6 h-6 rounded-sm"
                style={{
                  background: "#4f4f4f",
                  boxShadow: `${p.offsetX}px ${p.offsetY}px ${p.blur}px ${hexToRgba(p.color, p.opacity)}`,
                }}
              />
              <span className="text-[7px] text-muted-foreground group-hover:text-foreground">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className={`flex flex-col gap-3 ${!shadow.enabled ? "opacity-40 pointer-events-none" : ""}`}>
        {/* Color + Opacity */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">Cor</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={shadow.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent"
              />
              <span className="text-[9px] text-muted-foreground">{shadow.color}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Opacidade</span>
              <span className="text-[10px] tabular-nums">{shadow.opacity}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={1} value={shadow.opacity}
              onChange={(e) => handleChange("opacity", Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>
        </div>

        {/* Blur */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Desfoque</span>
            <span className="text-[10px] tabular-nums">{shadow.blur}px</span>
          </div>
          <input
            type="range" min={0} max={80} step={1} value={shadow.blur}
            onChange={(e) => handleChange("blur", Number(e.target.value))}
            className="w-full accent-primary h-1"
          />
          <div className="flex gap-1">
            {[0, 10, 20, 40].map((v) => (
              <button key={v} onClick={() => handleChange("blur", v)} className={`flex-1 text-[8px] py-0.5 rounded border transition-colors ${shadow.blur === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>{v}px</button>
            ))}
          </div>
        </div>

        {/* Offset X */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Deslocamento X</span>
            <span className="text-[10px] tabular-nums">{shadow.offsetX > 0 ? "+" : ""}{shadow.offsetX}px</span>
          </div>
          <input
            type="range" min={-50} max={50} step={1} value={shadow.offsetX}
            onChange={(e) => handleChange("offsetX", Number(e.target.value))}
            className="w-full accent-primary h-1"
          />
        </div>

        {/* Offset Y */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Deslocamento Y</span>
            <span className="text-[10px] tabular-nums">{shadow.offsetY > 0 ? "+" : ""}{shadow.offsetY}px</span>
          </div>
          <input
            type="range" min={-50} max={50} step={1} value={shadow.offsetY}
            onChange={(e) => handleChange("offsetY", Number(e.target.value))}
            className="w-full accent-primary h-1"
          />
        </div>

        {/* Quick directions */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Direção rápida</span>
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: "↖", x: -5, y: -5 }, { label: "↑", x: 0, y: -5 },
              { label: "↗", x: 5, y: -5 }, { label: "←", x: -5, y: 0 },
              { label: "·", x: 0, y: 0 }, { label: "→", x: 5, y: 0 },
              { label: "↙", x: -5, y: 5 }, { label: "↓", x: 0, y: 5 },
            ].map(({ label, x, y }) => (
              <button
                key={label}
                onClick={() => { handleChange("offsetX", x); setTimeout(() => handleChange("offsetY", y), 10); }}
                className="py-1 rounded border border-border text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {shadow.enabled && (
        <button
          onClick={() => { handleChange("enabled", false); toast.success("Sombra removida"); }}
          className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors text-center"
        >
          Remover sombra
        </button>
      )}
    </div>
  );
}
