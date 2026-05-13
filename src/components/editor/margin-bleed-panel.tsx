"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ruler, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface MarginBleedPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface MarginConfig {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  bleed: number;
  showMargin: boolean;
  showBleed: boolean;
  showSafeZone: boolean;
  safeZone: number;
}

const DEFAULT_CONFIG: MarginConfig = {
  marginTop: 40,
  marginRight: 40,
  marginBottom: 40,
  marginLeft: 40,
  bleed: 10,
  showMargin: true,
  showBleed: false,
  showSafeZone: false,
  safeZone: 20,
};

const PRESETS: { name: string; config: Partial<MarginConfig> }[] = [
  { name: "Sem margens", config: { marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 } },
  { name: "Pequena (20px)", config: { marginTop: 20, marginRight: 20, marginBottom: 20, marginLeft: 20 } },
  { name: "Padrão (40px)", config: { marginTop: 40, marginRight: 40, marginBottom: 40, marginLeft: 40 } },
  { name: "Impressão A4", config: { marginTop: 57, marginRight: 57, marginBottom: 57, marginLeft: 57, bleed: 10 } },
  { name: "Post Instagram", config: { marginTop: 60, marginRight: 60, marginBottom: 60, marginLeft: 60 } },
];

function SliderRow({ label, field, config, update, min = 0, max = 200 }: {
  label: string;
  field: keyof MarginConfig;
  config: MarginConfig;
  update: (patch: Partial<MarginConfig>) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground">{label}</span>
        <span className="text-[9px] tabular-nums">{config[field] as number}px</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={config[field] as number}
        onChange={e => update({ [field]: Number(e.target.value) })}
        className="w-full accent-primary h-1"
      />
    </div>
  );
}

function ToggleRow({ label, field, color, config, update }: {
  label: string;
  field: keyof MarginConfig;
  color: string;
  config: MarginConfig;
  update: (patch: Partial<MarginConfig>) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm border" style={{ borderColor: color, borderStyle: "dashed" }} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <button
        onClick={() => update({ [field]: !config[field] })}
        className={`relative w-8 h-4 rounded-full transition-colors ${config[field] ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${config[field] ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function MarginBleedPanel({ fabricCanvas }: MarginBleedPanelProps) {
  const [config, setConfig] = useState<MarginConfig>(DEFAULT_CONFIG);
  const [linked, setLinked] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayRef = useRef<any[]>([]);

  const removeOverlays = useCallback(() => {
    if (!fabricCanvas) return;
    overlayRef.current.forEach(r => {
      try { fabricCanvas.remove(r); } catch { /* ignore */ }
    });
    overlayRef.current = [];
  }, [fabricCanvas]);

  const drawOverlays = useCallback((cfg: MarginConfig) => {
    if (!fabricCanvas) return;
    removeOverlays();

    import("fabric").then(m => {
      const fabric = m.fabric;
      const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
      const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rects: any[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const makeGuide = (opts: any) => {
        const r = new fabric.Rect({
          ...opts,
          selectable: false,
          evented: false,
          excludeFromExport: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { isGuideOverlay: true } as any,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fabricCanvas.add(r as any);
        rects.push(r);
      };

      if (cfg.showBleed && cfg.bleed > 0) {
        const b = cfg.bleed;
        makeGuide({ left: -b, top: -b, width: cw + b * 2, height: ch + b * 2, fill: "transparent", stroke: "#ef4444", strokeWidth: 1, strokeDashArray: [4, 4] });
      }

      if (cfg.showMargin) {
        const { marginTop: mt, marginRight: mr, marginBottom: mb, marginLeft: ml } = cfg;
        makeGuide({ left: ml, top: mt, width: cw - ml - mr, height: ch - mt - mb, fill: "transparent", stroke: "#3b82f6", strokeWidth: 1, strokeDashArray: [5, 3] });
      }

      if (cfg.showSafeZone && cfg.safeZone > 0) {
        const s = cfg.safeZone;
        makeGuide({ left: s, top: s, width: cw - s * 2, height: ch - s * 2, fill: "transparent", stroke: "#22c55e", strokeWidth: 1, strokeDashArray: [3, 3] });
      }

      overlayRef.current = rects;
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, removeOverlays]);

  // Redraw when config changes
  useEffect(() => {
    drawOverlays(config);
    return removeOverlays;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const update = useCallback((patch: Partial<MarginConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      if (linked && ("marginTop" in patch || "marginRight" in patch || "marginBottom" in patch || "marginLeft" in patch)) {
        const val = patch.marginTop ?? patch.marginRight ?? patch.marginBottom ?? patch.marginLeft ?? prev.marginTop;
        next.marginTop = val;
        next.marginRight = val;
        next.marginBottom = val;
        next.marginLeft = val;
      }
      return next;
    });
  }, [linked]);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setConfig(prev => ({ ...prev, ...preset.config }));
    toast.success(`Preset "${preset.name}" aplicado`);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Ruler className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Margens e Sangria</span>
      </div>

      {/* Visibility toggles */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Visibilidade</span>
        <ToggleRow label="Margem (azul)" field="showMargin" color="#3b82f6" config={config} update={update} />
        <ToggleRow label="Sangria (vermelho)" field="showBleed" color="#ef4444" config={config} update={update} />
        <ToggleRow label="Zona segura (verde)" field="showSafeZone" color="#22c55e" config={config} update={update} />
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="text-[9px] px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Margin controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Margens</span>
          <button
            onClick={() => setLinked(v => !v)}
            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${linked ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
          >
            {linked ? "Vinculado" : "Individual"}
          </button>
        </div>
        {linked ? (
          <SliderRow label="Todas as margens" field="marginTop" config={config} update={update} />
        ) : (
          <>
            <SliderRow label="Topo" field="marginTop" config={config} update={update} />
            <SliderRow label="Direita" field="marginRight" config={config} update={update} />
            <SliderRow label="Base" field="marginBottom" config={config} update={update} />
            <SliderRow label="Esquerda" field="marginLeft" config={config} update={update} />
          </>
        )}
      </div>

      {/* Bleed */}
      {config.showBleed && (
        <div className="flex flex-col gap-1">
          <SliderRow label="Sangria" field="bleed" min={0} max={50} config={config} update={update} />
        </div>
      )}

      {/* Safe zone */}
      {config.showSafeZone && (
        <div className="flex flex-col gap-1">
          <SliderRow label="Zona segura" field="safeZone" min={0} max={100} config={config} update={update} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={() => drawOverlays(config)}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded border border-primary text-primary text-[10px] hover:bg-primary/10 transition-colors"
        >
          <Eye className="w-3 h-3" /> Redesenhar
        </button>
        <button
          onClick={() => { removeOverlays(); toast.success("Guias removidas"); }}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors"
        >
          <EyeOff className="w-3 h-3" /> Remover
        </button>
      </div>
    </div>
  );
}
