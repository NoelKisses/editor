"use client";

import { useCallback, useEffect, useState } from "react";
import { Type, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

interface TextOutlineShadowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: FabricCanvas;
}

type DashPreset = "solid" | "dashed" | "dotted";

interface OutlineState {
  enabled: boolean;
  color: string;
  width: number;
  dashed: boolean;
  dashPreset: DashPreset;
}

interface ShadowState {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

const TEXT_TYPES = ["text", "i-text", "textbox"];

const DASH_PRESETS: Record<DashPreset, number[]> = {
  solid: [],
  dashed: [8, 4],
  dotted: [2, 4],
};

const PRESET_COLORS = [
  "#ffffff", "#000000", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#06b6d4", "#3b82f6",
  "#a855f7", "#ec4899",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedTextObjects(fabricCanvas: any): any[] {
  if (!fabricCanvas) return [];
  const active = fabricCanvas.getActiveObject();
  if (!active) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (active.type === "activeSelection") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (active as any).getObjects().filter((o: any) => TEXT_TYPES.includes(o.type));
  }
  return TEXT_TYPES.includes(active.type) ? [active] : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectDashPreset(dashArray: any): DashPreset {
  if (!dashArray || dashArray.length === 0) return "solid";
  if (dashArray[0] === 2) return "dotted";
  return "dashed";
}

export function TextOutlineShadowPanel({ fabricCanvas }: TextOutlineShadowPanelProps) {
  const [hasText, setHasText] = useState(false);

  const [outline, setOutline] = useState<OutlineState>({
    enabled: false,
    color: "#ffffff",
    width: 2,
    dashed: false,
    dashPreset: "solid",
  });

  const [shadow, setShadow] = useState<ShadowState>({
    enabled: false,
    color: "#000000",
    blur: 10,
    offsetX: 4,
    offsetY: 4,
  });

  // Sync state from canvas selection
  useEffect(() => {
    if (!fabricCanvas) return;
    const objs = getSelectedTextObjects(fabricCanvas);
    queueMicrotask(() => {
      if (objs.length === 0) {
        setHasText(false);
        return;
      }
      setHasText(true);
      const first = objs[0];

      // Outline
      const hasStroke = !!(first.stroke && first.stroke !== "" && first.strokeWidth > 0);
      setOutline({
        enabled: hasStroke,
        color: first.stroke || "#ffffff",
        width: first.strokeWidth || 2,
        dashed: !!(first.strokeDashArray && first.strokeDashArray.length > 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dashPreset: detectDashPreset((first as any).strokeDashArray),
      });

      // Shadow
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = (first as any).shadow;
      setShadow({
        enabled: !!(s && s.blur !== undefined),
        color: s?.color ?? "#000000",
        blur: s?.blur ?? 10,
        offsetX: s?.offsetX ?? 4,
        offsetY: s?.offsetY ?? 4,
      });
    });
  }, [fabricCanvas]);

  const patchOutline = useCallback((patch: Partial<OutlineState>) => {
    setOutline(prev => ({ ...prev, ...patch }));
  }, []);

  const patchShadow = useCallback((patch: Partial<ShadowState>) => {
    setShadow(prev => ({ ...prev, ...patch }));
  }, []);

  const applyEffects = useCallback(() => {
    const objs = getSelectedTextObjects(fabricCanvas);
    if (objs.length === 0) {
      toast.error("Selecione um texto");
      return;
    }

    import("fabric").then(m => {
      for (const obj of objs) {
        // Outline
        if (outline.enabled) {
          const dashArray = DASH_PRESETS[outline.dashPreset];
          obj.set({
            stroke: outline.color,
            strokeWidth: outline.width,
            strokeDashArray: dashArray,
          });
        } else {
          obj.set({ stroke: "", strokeWidth: 0, strokeDashArray: [] });
        }

        // Shadow
        if (shadow.enabled) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fabricShadow = new (m.fabric as any).Shadow({
            color: shadow.color,
            blur: shadow.blur,
            offsetX: shadow.offsetX,
            offsetY: shadow.offsetY,
            affectStroke: false,
            nonScaling: false,
          });
          obj.set({ shadow: fabricShadow });
        } else {
          obj.set({ shadow: null });
        }
      }
      fabricCanvas.requestRenderAll();
      toast.success("Efeitos aplicados");
    });
  }, [fabricCanvas, outline, shadow]);

  const clearEffects = useCallback(() => {
    const objs = getSelectedTextObjects(fabricCanvas);
    if (objs.length === 0) {
      toast.error("Selecione um texto");
      return;
    }
    for (const obj of objs) {
      obj.set({ stroke: "", strokeWidth: 0, strokeDashArray: [], shadow: null });
    }
    fabricCanvas.requestRenderAll();
    patchOutline({ enabled: false });
    patchShadow({ enabled: false });
    toast.success("Efeitos limpos");
  }, [fabricCanvas, patchOutline, patchShadow]);

  const applyNeonPreset = useCallback(() => {
    const neonColor = "#a855f7";
    setOutline(prev => ({
      ...prev,
      enabled: true,
      color: neonColor,
      width: 2,
      dashed: false,
      dashPreset: "solid",
    }));
    setShadow({
      enabled: true,
      color: neonColor,
      blur: 30,
      offsetX: 0,
      offsetY: 0,
    });
    toast.info("Preset Neon carregado — clique em Aplicar");
  }, []);

  const applyRetroPreset = useCallback(() => {
    setOutline({
      enabled: true,
      color: "#000000",
      width: 6,
      dashed: false,
      dashPreset: "solid",
    });
    setShadow({
      enabled: true,
      color: "#000000",
      blur: 0,
      offsetX: 5,
      offsetY: 5,
    });
    toast.info("Preset Retro carregado — clique em Aplicar");
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Contorno &amp; Sombra</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Type className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">
            Selecione um objeto de texto para editar contorno e sombra
          </p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={applyNeonPreset}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-[10px] text-purple-400 hover:border-purple-400/60 hover:bg-purple-400/5 transition-colors"
              >
                ✦ Neon
              </button>
              <button
                onClick={applyRetroPreset}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-[10px] text-yellow-500 hover:border-yellow-500/60 hover:bg-yellow-500/5 transition-colors"
              >
                ★ Retro
              </button>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* Outline Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium">Contorno</span>
              {/* Toggle */}
              <button
                onClick={() => patchOutline({ enabled: !outline.enabled })}
                className={`relative w-8 h-4 rounded-full transition-colors ${outline.enabled ? "bg-primary" : "bg-muted"}`}
                aria-label="Ativar contorno"
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${outline.enabled ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            {outline.enabled && (
              <>
                {/* Outline color */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={outline.color}
                      onChange={e => patchOutline({ color: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer border border-border"
                    />
                    <span className="text-[9px] font-mono">{outline.color}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => patchOutline({ color: c })}
                        className={`w-5 h-5 rounded-sm border hover:scale-110 transition-transform ${outline.color === c ? "border-primary ring-1 ring-primary" : "border-border/50"}`}
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Outline width */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Espessura</span>
                    <span className="text-[9px] tabular-nums">{outline.width}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={outline.width}
                    onChange={e => patchOutline({ width: Number(e.target.value) })}
                    className="w-full accent-primary h-1"
                  />
                </div>

                {/* Dash toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Tracejado</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={outline.dashed}
                      onChange={e => patchOutline({ dashed: e.target.checked, dashPreset: e.target.checked ? "dashed" : "solid" })}
                      className="accent-primary w-3.5 h-3.5"
                    />
                    <span className="text-[9px] text-muted-foreground">Ativar</span>
                  </label>
                </div>

                {/* Dash pattern presets */}
                {outline.dashed && (
                  <div className="flex gap-1">
                    {(["solid", "dashed", "dotted"] as DashPreset[]).map(preset => (
                      <button
                        key={preset}
                        onClick={() => patchOutline({ dashPreset: preset })}
                        className={`flex-1 py-1 rounded border text-[9px] transition-colors capitalize ${outline.dashPreset === preset ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                      >
                        {preset === "solid" ? "Sólido" : preset === "dashed" ? "Traço" : "Ponto"}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* Shadow Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium">Sombra</span>
              {/* Toggle */}
              <button
                onClick={() => patchShadow({ enabled: !shadow.enabled })}
                className={`relative w-8 h-4 rounded-full transition-colors ${shadow.enabled ? "bg-primary" : "bg-muted"}`}
                aria-label="Ativar sombra"
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${shadow.enabled ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            {shadow.enabled && (
              <>
                {/* Shadow color */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={shadow.color}
                      onChange={e => patchShadow({ color: e.target.value })}
                      className="w-10 h-8 rounded cursor-pointer border border-border"
                    />
                    <span className="text-[9px] font-mono">{shadow.color}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => patchShadow({ color: c })}
                        className={`w-5 h-5 rounded-sm border hover:scale-110 transition-transform ${shadow.color === c ? "border-primary ring-1 ring-primary" : "border-border/50"}`}
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Blur */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Blur</span>
                    <span className="text-[9px] tabular-nums">{shadow.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={1}
                    value={shadow.blur}
                    onChange={e => patchShadow({ blur: Number(e.target.value) })}
                    className="w-full accent-primary h-1"
                  />
                </div>

                {/* Offset X */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Offset X</span>
                    <span className="text-[9px] tabular-nums">{shadow.offsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={1}
                    value={shadow.offsetX}
                    onChange={e => patchShadow({ offsetX: Number(e.target.value) })}
                    className="w-full accent-primary h-1"
                  />
                </div>

                {/* Offset Y */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">Offset Y</span>
                    <span className="text-[9px] tabular-nums">{shadow.offsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={1}
                    value={shadow.offsetY}
                    onChange={e => patchShadow({ offsetY: Number(e.target.value) })}
                    className="w-full accent-primary h-1"
                  />
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <hr className="border-border" />

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={applyEffects}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Aplicar Efeitos
            </button>
            <button
              onClick={clearEffects}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors"
            >
              <X className="w-3 h-3" /> Limpar Efeitos
            </button>
          </div>
        </>
      )}
    </div>
  );
}
