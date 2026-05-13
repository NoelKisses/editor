"use client";

import { useCallback, useEffect, useState } from "react";
import { Eclipse, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectShadowPresetPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ShadowPreset {
  label: string;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
  desc: string;
}

const SHADOW_PRESETS: ShadowPreset[] = [
  { label: "Suave", color: "#000000", blur: 15, offsetX: 2, offsetY: 4, opacity: 0.25, desc: "Sombra leve e difusa" },
  { label: "Nítida", color: "#000000", blur: 3, offsetX: 3, offsetY: 3, opacity: 0.5, desc: "Sombra definida" },
  { label: "Neon Azul", color: "#00aaff", blur: 20, offsetX: 0, offsetY: 0, opacity: 0.9, desc: "Brilho azul neon" },
  { label: "Neon Rosa", color: "#ff00aa", blur: 20, offsetX: 0, offsetY: 0, opacity: 0.9, desc: "Brilho rosa neon" },
  { label: "Neon Verde", color: "#00ff88", blur: 20, offsetX: 0, offsetY: 0, opacity: 0.9, desc: "Brilho verde neon" },
  { label: "Longa", color: "#000000", blur: 0, offsetX: 8, offsetY: 8, opacity: 0.35, desc: "Sombra longa sem blur" },
  { label: "Retro", color: "#ff6600", blur: 0, offsetX: 5, offsetY: 5, opacity: 1, desc: "Sombra sólida laranja" },
  { label: "Elevado", color: "#000000", blur: 25, offsetX: 0, offsetY: 10, opacity: 0.3, desc: "Efeito flutuante" },
  { label: "Dupla", color: "#ffffff", blur: 10, offsetX: -3, offsetY: -3, opacity: 0.5, desc: "Sombra interna clara" },
  { label: "Dramática", color: "#000000", blur: 40, offsetX: 0, offsetY: 20, opacity: 0.6, desc: "Sombra intensa" },
  { label: "Contorno", color: "#ffffff", blur: 0, offsetX: 2, offsetY: 2, opacity: 1, desc: "Outline branco" },
  { label: "Profunda", color: "#1a0033", blur: 30, offsetX: 5, offsetY: 15, opacity: 0.8, desc: "Sombra escura profunda" },
];

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export function ObjectShadowPresetPanel({ fabricCanvas, selectionVersion }: ObjectShadowPresetPanelProps) {
  const [hasSelection, setHasSelection] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState("#000000");
  const [customBlur, setCustomBlur] = useState(10);
  const [customOffsetX, setCustomOffsetX] = useState(3);
  const [customOffsetY, setCustomOffsetY] = useState(3);
  const [customOpacity, setCustomOpacity] = useState(0.4);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasSelection(!!obj);
      if (obj?.shadow) {
        setActivePreset(null);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const applyPreset = useCallback((preset: ShadowPreset) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shadow = new (fabric as any).Shadow({
        color: hexToRgba(preset.color, preset.opacity),
        blur: preset.blur,
        offsetX: preset.offsetX,
        offsetY: preset.offsetY,
        affectStroke: false,
      });
      obj.set({ shadow });
      fabricCanvas.requestRenderAll();
      setActivePreset(preset.label);
      toast.success(`Sombra "${preset.label}" aplicada`);
    });
  }, [fabricCanvas]);

  const applyCustom = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shadow = new (fabric as any).Shadow({
        color: hexToRgba(customColor, customOpacity),
        blur: customBlur,
        offsetX: customOffsetX,
        offsetY: customOffsetY,
        affectStroke: false,
      });
      obj.set({ shadow });
      fabricCanvas.requestRenderAll();
      setActivePreset("custom");
      toast.success("Sombra personalizada aplicada");
    });
  }, [fabricCanvas, customColor, customBlur, customOffsetX, customOffsetY, customOpacity]);

  const removeShadow = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ shadow: null });
    fabricCanvas.requestRenderAll();
    setActivePreset(null);
    toast.success("Sombra removida");
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Eclipse className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Presets de Sombra</span>
      </div>

      {!hasSelection ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Eclipse className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para aplicar sombra</p>
        </div>
      ) : (
        <>
          {/* Presets grid */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilos prontos</span>
            <div className="grid grid-cols-2 gap-1">
              {SHADOW_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className={`flex flex-col items-start px-2 py-2 rounded border text-left transition-colors ${activePreset === preset.label ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: preset.color, boxShadow: `0 1px 3px ${hexToRgba(preset.color, preset.opacity)}` }}
                    />
                    <span className={`text-[9px] font-medium truncate ${activePreset === preset.label ? "text-primary" : "text-foreground"}`}>
                      {preset.label}
                    </span>
                  </div>
                  <span className="text-[7px] text-muted-foreground mt-0.5 leading-tight">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom shadow */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Personalizar</span>

            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground w-12">Cor</span>
              <input
                type="color"
                value={customColor}
                onChange={e => setCustomColor(e.target.value)}
                className="w-8 h-6 rounded border border-border cursor-pointer"
              />
              <span className="text-[8px] text-muted-foreground">{customColor}</span>
            </div>

            {[
              { label: "Blur", value: customBlur, min: 0, max: 100, step: 1, set: setCustomBlur },
              { label: "X", value: customOffsetX, min: -50, max: 50, step: 1, set: setCustomOffsetX },
              { label: "Y", value: customOffsetY, min: -50, max: 50, step: 1, set: setCustomOffsetY },
            ].map(ctrl => (
              <div key={ctrl.label} className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-12">{ctrl.label}</span>
                <input
                  type="range"
                  min={ctrl.min}
                  max={ctrl.max}
                  step={ctrl.step}
                  value={ctrl.value}
                  onChange={e => ctrl.set(Number(e.target.value))}
                  className="flex-1 accent-primary h-1"
                />
                <span className="text-[8px] tabular-nums w-6 text-right">{ctrl.value}</span>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground w-12">Opac.</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={customOpacity}
                onChange={e => setCustomOpacity(Number(e.target.value))}
                className="flex-1 accent-primary h-1"
              />
              <span className="text-[8px] tabular-nums w-6 text-right">{Math.round(customOpacity * 100)}%</span>
            </div>

            <button
              onClick={applyCustom}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
            >
              Aplicar sombra personalizada
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={removeShadow}
            className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-destructive/30 hover:text-destructive transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Remover sombra
          </button>
        </>
      )}
    </div>
  );
}
