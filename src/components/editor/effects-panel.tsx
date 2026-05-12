"use client";

import { useCallback, useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ClipMaskPanel } from "@/components/editor/clip-mask-panel";

interface EffectsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type StrokeDashArray = number[] | null;

const STROKE_PRESETS = [
  { label: "Sólida", dash: null },
  { label: "Tracejada", dash: [10, 6] },
  { label: "Pontilhada", dash: [2, 6] },
  { label: "Traço-ponto", dash: [10, 4, 2, 4] },
];

const SHADOW_PRESETS = [
  { label: "Nenhuma", shadow: null },
  { label: "Suave", shadow: { color: "rgba(0,0,0,0.25)", blur: 10, offsetX: 2, offsetY: 4 } },
  { label: "Forte", shadow: { color: "rgba(0,0,0,0.6)", blur: 20, offsetX: 4, offsetY: 8 } },
  { label: "Neon", shadow: { color: "rgba(99,102,241,0.8)", blur: 24, offsetX: 0, offsetY: 0 } },
  { label: "Dupla", shadow: { color: "rgba(0,0,0,0.4)", blur: 6, offsetX: 3, offsetY: 3 } },
  { label: "Interna", shadow: { color: "rgba(0,0,0,0.5)", blur: 8, offsetX: -2, offsetY: -2 } },
];

export function EffectsPanel({ fabricCanvas, selectionVersion }: EffectsPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);

  // Shadow state
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowOpacity, setShadowOpacity] = useState(40);
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOffsetX, setShadowOffsetX] = useState(2);
  const [shadowOffsetY, setShadowOffsetY] = useState(4);

  // Stroke state
  const [strokeEnabled, setStrokeEnabled] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeDash, setStrokeDash] = useState<StrokeDashArray>(null);

  // Opacity
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    void selectionVersion;
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();

    queueMicrotask(() => {
      setActive(obj ?? null);
      if (!obj) return;

      // Load shadow
      if (obj.shadow) {
        setShadowEnabled(true);
        const sc = obj.shadow.color ?? "rgba(0,0,0,0.4)";
        const parsed = parseRgba(sc);
        setShadowColor(parsed.hex);
        setShadowOpacity(Math.round(parsed.alpha * 100));
        setShadowBlur(obj.shadow.blur ?? 10);
        setShadowOffsetX(obj.shadow.offsetX ?? 2);
        setShadowOffsetY(obj.shadow.offsetY ?? 4);
      } else {
        setShadowEnabled(false);
        setShadowColor("#000000");
        setShadowOpacity(40);
        setShadowBlur(10);
        setShadowOffsetX(2);
        setShadowOffsetY(4);
      }

      // Load stroke
      if (obj.stroke && obj.strokeWidth > 0) {
        setStrokeEnabled(true);
        setStrokeColor(obj.stroke);
        setStrokeWidth(obj.strokeWidth ?? 2);
        setStrokeDash(obj.strokeDashArray ?? null);
      } else {
        setStrokeEnabled(false);
        setStrokeColor("#ffffff");
        setStrokeWidth(2);
        setStrokeDash(null);
      }

      // Load opacity
      setOpacity(Math.round((obj.opacity ?? 1) * 100));
    });
  }, [selectionVersion, fabricCanvas]);

  const applyShadow = useCallback(() => {
    if (!active) return;
    if (!shadowEnabled) {
      active.set({ shadow: null });
    } else {
      const alpha = shadowOpacity / 100;
      const hex = shadowColor;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      active.set({
        shadow: {
          color: `rgba(${r},${g},${b},${alpha})`,
          blur: shadowBlur,
          offsetX: shadowOffsetX,
          offsetY: shadowOffsetY,
        },
      });
    }
    fabricCanvas.requestRenderAll();
  }, [active, fabricCanvas, shadowEnabled, shadowColor, shadowOpacity, shadowBlur, shadowOffsetX, shadowOffsetY]);

  const applyStroke = useCallback(() => {
    if (!active) return;
    if (!strokeEnabled) {
      active.set({ stroke: null, strokeWidth: 0, strokeDashArray: null });
    } else {
      active.set({
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray: strokeDash,
      });
    }
    fabricCanvas.requestRenderAll();
  }, [active, fabricCanvas, strokeEnabled, strokeColor, strokeWidth, strokeDash]);

  const applyOpacity = useCallback((val: number) => {
    if (!active) return;
    active.set({ opacity: val / 100 });
    fabricCanvas.requestRenderAll();
  }, [active, fabricCanvas]);

  const applyShadowPreset = useCallback(async (preset: typeof SHADOW_PRESETS[0]) => {
    if (!active) return;
    if (!preset.shadow) {
      active.set({ shadow: null });
      setShadowEnabled(false);
    } else {
      const fabric = await import("fabric").then((m) => m.fabric);
      active.set({ shadow: new fabric.Shadow(preset.shadow) });
      setShadowEnabled(true);
      const parsed = parseRgba(preset.shadow.color);
      setShadowColor(parsed.hex);
      setShadowOpacity(Math.round(parsed.alpha * 100));
      setShadowBlur(preset.shadow.blur);
      setShadowOffsetX(preset.shadow.offsetX);
      setShadowOffsetY(preset.shadow.offsetY);
    }
    fabricCanvas.requestRenderAll();
    toast.success(preset.label === "Nenhuma" ? "Sombra removida" : `Sombra "${preset.label}" aplicada`);
  }, [active, fabricCanvas]);

  if (!active) {
    return (
      <div className="p-3 text-[11px] text-zinc-500 text-center pt-8">
        Selecione um elemento para editar efeitos
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <h3 className="text-sm font-semibold text-foreground">Efeitos</h3>

      {/* Opacity */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-300">Opacidade</span>
          <span className="text-[11px] text-zinc-400 tabular-nums">{opacity}%</span>
        </div>
        <Slider
          min={0} max={100} step={1}
          value={[opacity]}
          onValueChange={(val) => { const v = (val as number[])[0]; setOpacity(v); applyOpacity(v); }}
        />
      </div>

      {/* Shadow section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-300 font-medium">Sombra</span>
          <button
            role="switch"
            aria-checked={shadowEnabled}
            onClick={() => {
              const next = !shadowEnabled;
              setShadowEnabled(next);
              if (!next) { active.set({ shadow: null }); fabricCanvas.requestRenderAll(); }
            }}
            className={`w-9 h-5 rounded-full transition-colors ${shadowEnabled ? "bg-primary" : "bg-muted"} relative`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${shadowEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Shadow presets */}
        <div className="flex gap-1 flex-wrap">
          {SHADOW_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyShadowPreset(p)}
              className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {shadowEnabled && (
          <div className="flex flex-col gap-2 pl-1">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-400 w-12">Cor</label>
              <input
                type="color"
                value={shadowColor}
                onChange={(e) => { setShadowColor(e.target.value); }}
                onBlur={applyShadow}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/10"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400">Opacidade</span>
                  <span className="text-[10px] text-zinc-500">{shadowOpacity}%</span>
                </div>
                <Slider min={0} max={100} step={1} value={[shadowOpacity]}
                  onValueChange={(val) => { setShadowOpacity((val as number[])[0]); }}
                  onPointerUp={applyShadow}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-400 w-12">Blur</label>
              <Slider className="flex-1" min={0} max={60} step={1} value={[shadowBlur]}
                onValueChange={(val) => { setShadowBlur((val as number[])[0]); }}
                onPointerUp={applyShadow}
              />
              <span className="text-[10px] text-zinc-500 w-6 text-right tabular-nums">{shadowBlur}</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-400 w-12">Offset X</label>
              <Slider className="flex-1" min={-40} max={40} step={1} value={[shadowOffsetX]}
                onValueChange={(val) => { setShadowOffsetX((val as number[])[0]); }}
                onPointerUp={applyShadow}
              />
              <span className="text-[10px] text-zinc-500 w-6 text-right tabular-nums">{shadowOffsetX}</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-400 w-12">Offset Y</label>
              <Slider className="flex-1" min={-40} max={40} step={1} value={[shadowOffsetY]}
                onValueChange={(val) => { setShadowOffsetY((val as number[])[0]); }}
                onPointerUp={applyShadow}
              />
              <span className="text-[10px] text-zinc-500 w-6 text-right tabular-nums">{shadowOffsetY}</span>
            </div>

            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={applyShadow}>
              Aplicar Sombra
            </Button>
          </div>
        )}
      </div>

      {/* Stroke section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-300 font-medium">Borda</span>
          <button
            role="switch"
            aria-checked={strokeEnabled}
            onClick={() => {
              const next = !strokeEnabled;
              setStrokeEnabled(next);
              if (!next) { active.set({ stroke: null, strokeWidth: 0 }); fabricCanvas.requestRenderAll(); }
            }}
            className={`w-9 h-5 rounded-full transition-colors ${strokeEnabled ? "bg-primary" : "bg-muted"} relative`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${strokeEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>

        {strokeEnabled && (
          <div className="flex flex-col gap-2 pl-1">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-400 w-12">Cor</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => { setStrokeColor(e.target.value); }}
                onBlur={applyStroke}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/10"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-400 w-12">Largura</label>
              <Slider className="flex-1" min={1} max={20} step={1} value={[strokeWidth]}
                onValueChange={(val) => { setStrokeWidth((val as number[])[0]); }}
                onPointerUp={applyStroke}
              />
              <span className="text-[10px] text-zinc-500 w-6 text-right tabular-nums">{strokeWidth}</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-400">Estilo</label>
              <div className="flex gap-1 flex-wrap">
                {STROKE_PRESETS.map((p) => {
                  const isActive = JSON.stringify(strokeDash) === JSON.stringify(p.dash);
                  return (
                    <button
                      key={p.label}
                      onClick={() => { setStrokeDash(p.dash); setTimeout(applyStroke, 0); }}
                      className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                        isActive
                          ? "border-primary/60 bg-primary/10 text-white"
                          : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={applyStroke}>
              Aplicar Borda
            </Button>
          </div>
        )}
      </div>

      {/* Clip Mask section */}
      <div className="border-t border-zinc-800 pt-3">
        <ClipMaskPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
      </div>
    </div>
  );
}

function parseRgba(color: string): { hex: string; alpha: number } {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    const r = parseInt(m[1]).toString(16).padStart(2, "0");
    const g = parseInt(m[2]).toString(16).padStart(2, "0");
    const b = parseInt(m[3]).toString(16).padStart(2, "0");
    return { hex: `#${r}${g}${b}`, alpha: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  }
  if (color.startsWith("#")) return { hex: color.slice(0, 7), alpha: 1 };
  return { hex: "#000000", alpha: 0.4 };
}
