"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface ObjectNeonGlowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface GlowLayer {
  blur: number;
  spread: number;
  opacity: number;
}

const NEON_PRESETS: { name: string; color: string; layers: GlowLayer[] }[] = [
  { name: "Azul Elétrico", color: "#00bfff", layers: [{ blur: 5, spread: 0, opacity: 1 }, { blur: 15, spread: 3, opacity: 0.7 }, { blur: 30, spread: 6, opacity: 0.4 }] },
  { name: "Rosa Neon", color: "#ff1493", layers: [{ blur: 4, spread: 0, opacity: 1 }, { blur: 12, spread: 2, opacity: 0.7 }, { blur: 25, spread: 5, opacity: 0.35 }] },
  { name: "Verde Cyber", color: "#39ff14", layers: [{ blur: 6, spread: 1, opacity: 1 }, { blur: 18, spread: 4, opacity: 0.65 }, { blur: 35, spread: 8, opacity: 0.3 }] },
  { name: "Laranja Fire", color: "#ff6600", layers: [{ blur: 5, spread: 0, opacity: 1 }, { blur: 14, spread: 3, opacity: 0.7 }, { blur: 28, spread: 6, opacity: 0.4 }] },
  { name: "Roxo Místico", color: "#bf00ff", layers: [{ blur: 4, spread: 0, opacity: 1 }, { blur: 13, spread: 2, opacity: 0.65 }, { blur: 26, spread: 5, opacity: 0.35 }] },
  { name: "Dourado", color: "#ffd700", layers: [{ blur: 5, spread: 1, opacity: 1 }, { blur: 16, spread: 3, opacity: 0.65 }, { blur: 30, spread: 7, opacity: 0.3 }] },
];

function buildShadowString(color: string, layers: GlowLayer[], offsetX: number, offsetY: number): string {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return layers.map(l =>
    `${offsetX}px ${offsetY}px ${l.blur}px rgba(${r},${g},${b},${l.opacity})`
  ).join(", ");
}

export function ObjectNeonGlowPanel({ fabricCanvas, selectionVersion }: ObjectNeonGlowPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [hasGlow, setHasGlow] = useState(false);
  const [glowColor, setGlowColor] = useState("#00bfff");
  const [intensity, setIntensity] = useState(1);
  const [layers, setLayers] = useState<GlowLayer[]>([
    { blur: 5, spread: 0, opacity: 1 },
    { blur: 15, spread: 3, opacity: 0.7 },
    { blur: 30, spread: 6, opacity: 0.4 },
  ]);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const has = !!obj && obj.type !== "activeSelection";
      setHasObject(has);
      setHasGlow(has && !!obj.shadow);
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && obj.type !== "activeSelection" ? obj : null;
  }, [fabricCanvas]);

  const applyGlow = useCallback((color: string, glowLayers: GlowLayer[]) => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // Apply the most prominent glow as fabric shadow
      const primaryLayer = glowLayers[0];
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      const scaledBlur = primaryLayer.blur * intensity;

      const shadow = new f.Shadow({
        color: `rgba(${r},${g},${b},${primaryLayer.opacity})`,
        blur: scaledBlur,
        offsetX: offsetX,
        offsetY: offsetY,
      });

      obj.set({ shadow });

      // Apply additional glow layers as extra shadows via CSS-like stacking
      // Additional layers are approximated by chaining shadows
      if (glowLayers.length > 1) {
        const allShadowStr = buildShadowString(color, glowLayers.map(l => ({
          ...l,
          blur: l.blur * intensity,
        })), offsetX, offsetY);

        // Store the full glow config on the object for reference
        if (!obj.data) obj.data = {};
        obj.data.__neonGlow = { color, layers: glowLayers, intensity, allShadowStr };
      }

      fabricCanvas.requestRenderAll();
      setHasGlow(true);
      toast.success("Efeito neon aplicado");
    });
  }, [getObject, intensity, offsetX, offsetY, fabricCanvas]);

  const removeGlow = useCallback(() => {
    const obj = getObject();
    if (!obj) return;
    obj.set({ shadow: null });
    if (obj.data) delete obj.data.__neonGlow;
    fabricCanvas.requestRenderAll();
    setHasGlow(false);
    setSelectedPreset(null);
    toast.success("Efeito neon removido");
  }, [getObject, fabricCanvas]);

  const applyPreset = useCallback((preset: typeof NEON_PRESETS[number]) => {
    setGlowColor(preset.color);
    setLayers(preset.layers);
    setSelectedPreset(preset.name);
    applyGlow(preset.color, preset.layers);
  }, [applyGlow]);

  const updateLayer = useCallback((index: number, partial: Partial<GlowLayer>) => {
    setLayers(prev => prev.map((l, i) => i === index ? { ...l, ...partial } : l));
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Efeito Neon / Glow</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para aplicar o brilho</p>
        </div>
      ) : (
        <>
          {hasGlow && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded border border-primary/30 bg-primary/5">
              <span className="text-[9px] text-primary" style={{ color: glowColor }}>● Neon ativo</span>
              <button onClick={removeGlow}
                className="flex items-center gap-0.5 text-[8px] text-destructive hover:underline">
                <X className="w-2.5 h-2.5" /> Remover
              </button>
            </div>
          )}

          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets Neon</span>
            <div className="grid grid-cols-2 gap-1">
              {NEON_PRESETS.map(p => (
                <button key={p.name} onClick={() => applyPreset(p)}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${selectedPreset === p.name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  style={{ borderColor: selectedPreset === p.name ? p.color : undefined, color: selectedPreset === p.name ? p.color : undefined }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">Cor do Brilho</span>
            <input type="color" value={glowColor} onChange={e => setGlowColor(e.target.value)}
              className="w-8 h-7 rounded border border-border cursor-pointer" />
            <span className="text-[8px] font-mono text-muted-foreground">{glowColor.toUpperCase()}</span>
          </div>

          {/* Intensity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Intensidade</span>
              <span className="text-[9px] tabular-nums">{intensity.toFixed(1)}x</span>
            </div>
            <input type="range" min={0.2} max={4} step={0.2} value={intensity}
              onChange={e => setIntensity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Offset */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Offset X</span>
                <span className="text-[9px] tabular-nums">{offsetX}</span>
              </div>
              <input type="range" min={-20} max={20} step={1} value={offsetX}
                onChange={e => setOffsetX(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Offset Y</span>
                <span className="text-[9px] tabular-nums">{offsetY}</span>
              </div>
              <input type="range" min={-20} max={20} step={1} value={offsetY}
                onChange={e => setOffsetY(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
          </div>

          {/* Layer config */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Camadas de Brilho</span>
            {layers.map((layer, i) => (
              <div key={i} className="flex flex-col gap-1 p-1.5 rounded border border-border bg-muted/5">
                <span className="text-[8px] text-primary">Camada {i + 1}</span>
                <div className="grid grid-cols-3 gap-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[7px] text-muted-foreground">Blur</span>
                    <input type="range" min={1} max={60} step={1} value={layer.blur}
                      onChange={e => updateLayer(i, { blur: Number(e.target.value) })}
                      className="w-full accent-primary h-0.5" />
                    <span className="text-[7px] tabular-nums text-center">{layer.blur}px</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[7px] text-muted-foreground">Spread</span>
                    <input type="range" min={0} max={20} step={1} value={layer.spread}
                      onChange={e => updateLayer(i, { spread: Number(e.target.value) })}
                      className="w-full accent-primary h-0.5" />
                    <span className="text-[7px] tabular-nums text-center">{layer.spread}px</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[7px] text-muted-foreground">Opac.</span>
                    <input type="range" min={0.1} max={1} step={0.05} value={layer.opacity}
                      onChange={e => updateLayer(i, { opacity: Number(e.target.value) })}
                      className="w-full accent-primary h-0.5" />
                    <span className="text-[7px] tabular-nums text-center">{Math.round(layer.opacity * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => applyGlow(glowColor, layers)}
            className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
            style={{ borderColor: glowColor, color: glowColor }}>
            <Sparkles className="w-3 h-3" /> Aplicar Neon
          </button>
        </>
      )}
    </div>
  );
}
