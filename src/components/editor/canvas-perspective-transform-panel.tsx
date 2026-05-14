"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PerspectiveConfig {
  tlX: number;
  tlY: number;
  trX: number;
  trY: number;
  blX: number;
  blY: number;
  brX: number;
  brY: number;
}

interface CanvasPerspectiveTransformPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type PresetKey =
  | "none"
  | "frontal"
  | "lateral"
  | "top-tilt"
  | "bottom-tilt"
  | "trapezoid";

interface Preset {
  label: string;
  key: PresetKey;
  config: PerspectiveConfig;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: PerspectiveConfig = {
  tlX: 0,
  tlY: 0,
  trX: 0,
  trY: 0,
  blX: 0,
  blY: 0,
  brX: 0,
  brY: 0,
};

const PRESETS: Preset[] = [
  {
    key: "none",
    label: "Nenhum",
    config: { ...DEFAULT_CONFIG },
  },
  {
    key: "frontal",
    label: "Perspectiva frontal",
    config: { tlX: -20, tlY: -20, trX: 20, trY: -20, blX: -20, blY: 20, brX: 20, brY: 20 },
  },
  {
    key: "lateral",
    label: "Perspectiva lateral",
    config: { tlX: 30, tlY: -10, trX: 0, trY: -10, blX: 30, blY: 10, brX: 0, brY: 10 },
  },
  {
    key: "top-tilt",
    label: "Inclinação cima",
    config: { tlX: -15, tlY: -30, trX: 15, trY: -30, blX: 0, blY: 0, brX: 0, brY: 0 },
  },
  {
    key: "bottom-tilt",
    label: "Inclinação baixo",
    config: { tlX: 0, tlY: 0, trX: 0, trY: 0, blX: -15, blY: 30, brX: 15, brY: 30 },
  },
  {
    key: "trapezoid",
    label: "Trapézio",
    config: { tlX: 20, tlY: 0, trX: -20, trY: 0, blX: 0, blY: 0, brX: 0, brY: 0 },
  },
];

const SLIDER_FIELDS: Array<{
  key: keyof PerspectiveConfig;
  label: string;
}> = [
  { key: "tlX", label: "Superior Esq X" },
  { key: "tlY", label: "Superior Esq Y" },
  { key: "trX", label: "Superior Dir X" },
  { key: "trY", label: "Superior Dir Y" },
  { key: "blX", label: "Inferior Esq X" },
  { key: "blY", label: "Inferior Esq Y" },
  { key: "brX", label: "Inferior Dir X" },
  { key: "brY", label: "Inferior Dir Y" },
];

// ─── Module-level helpers ─────────────────────────────────────────────────────

function buildTransformMatrix(config: PerspectiveConfig): {
  skewX: number;
  skewY: number;
  scaleX: number;
  scaleY: number;
} {
  const { tlX, tlY, trX, trY, blX, blY, brX, brY } = config;

  // Derive skew from horizontal asymmetry between corners
  const horizontalSkew = ((trX - tlX) + (brX - blX)) / 2;
  const verticalSkew = ((blY - tlY) + (brY - trY)) / 2;

  // Derive scale modulation from convergence / divergence
  const widthTop = 100 + trX - tlX;
  const widthBottom = 100 + brX - blX;
  const scaleX = Math.max(0.1, (widthTop + widthBottom) / 200);

  const heightLeft = 100 + blY - tlY;
  const heightRight = 100 + brY - trY;
  const scaleY = Math.max(0.1, (heightLeft + heightRight) / 200);

  return {
    skewX: horizontalSkew * 0.3,
    skewY: verticalSkew * 0.3,
    scaleX,
    scaleY,
  };
}

function deriveCSSAngles(config: PerspectiveConfig): {
  rotateX: number;
  rotateY: number;
} {
  const { tlY, trY, blY, brY, tlX, trX, blX, brX } = config;
  const avgTopY = (tlY + trY) / 2;
  const avgBottomY = (blY + brY) / 2;
  const rotateX = (avgTopY - avgBottomY) * 0.15;

  const avgLeftX = (tlX + blX) / 2;
  const avgRightX = (trX + brX) / 2;
  const rotateY = (avgRightX - avgLeftX) * 0.15;

  return { rotateX, rotateY };
}

function configsAreEqual(a: PerspectiveConfig, b: PerspectiveConfig): boolean {
  return (
    a.tlX === b.tlX &&
    a.tlY === b.tlY &&
    a.trX === b.trX &&
    a.trY === b.trY &&
    a.blX === b.blX &&
    a.blY === b.blY &&
    a.brX === b.brX &&
    a.brY === b.brY
  );
}

function isDefaultConfig(config: PerspectiveConfig): boolean {
  return configsAreEqual(config, DEFAULT_CONFIG);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
        <span className="text-[9px] tabular-nums font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={-100}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 accent-primary"
      />
    </div>
  );
}

function CSSPreview({ config }: { config: PerspectiveConfig }) {
  const { rotateX, rotateY } = deriveCSSAngles(config);
  const style: React.CSSProperties = {
    transform: `perspective(200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    transition: "transform 0.15s ease",
  };

  return (
    <div className="flex flex-col items-center gap-1 mt-1">
      <span className="text-[9px] text-muted-foreground">Pré-visualização CSS</span>
      <div className="flex items-center justify-center w-full h-14 bg-muted/30 rounded">
        <div
          style={style}
          className="w-16 h-10 rounded bg-primary/60 border border-primary/30 flex items-center justify-center"
        >
          <span className="text-[8px] text-primary-foreground font-bold select-none">
            Objeto
          </span>
        </div>
      </div>
      <span className="text-[8px] text-muted-foreground/70 font-mono">
        rotateX({rotateX.toFixed(1)}°) rotateY({rotateY.toFixed(1)}°)
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CanvasPerspectiveTransformPanel({
  fabricCanvas,
  selectionVersion,
}: CanvasPerspectiveTransformPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [config, setConfig] = useState<PerspectiveConfig>({ ...DEFAULT_CONFIG });
  const [activePreset, setActivePreset] = useState<PresetKey>("none");
  const [hasSelection, setHasSelection] = useState(false);

  // Sync canvas ref
  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // Read config from selected object when selection changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = canvas.getActiveObject?.();
      if (!obj) {
        setHasSelection(false);
        setConfig({ ...DEFAULT_CONFIG });
        setActivePreset("none");
        return;
      }
      setHasSelection(true);
      if (obj.__perspectiveConfig) {
        const saved: PerspectiveConfig = obj.__perspectiveConfig;
        setConfig({ ...saved });
        // Identify matching preset
        const match = PRESETS.find((p) => configsAreEqual(p.config, saved));
        setActivePreset(match ? match.key : "none");
      } else {
        setConfig({ ...DEFAULT_CONFIG });
        setActivePreset("none");
      }
    });
  }, [selectionVersion]);

  // Apply transform to fabric object
  const applyTransform = useCallback(
    (nextConfig: PerspectiveConfig) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = canvas.getActiveObject?.();
      if (!obj) {
        toast.error("Nenhum objeto selecionado.");
        return;
      }

      import("fabric").then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _f = m.fabric as any;
        void _f; // imported for side-effects / version compat

        const { skewX, skewY, scaleX, scaleY } = buildTransformMatrix(nextConfig);

        obj.set({ skewX, skewY, scaleX, scaleY });
        obj.__perspectiveConfig = { ...nextConfig };

        obj.setCoords?.();
        canvas.requestRenderAll?.();

        toast.success("Perspectiva aplicada.");
      }).catch(() => {
        toast.error("Erro ao aplicar perspectiva.");
      });
    },
    []
  );

  const handleSliderChange = useCallback(
    (key: keyof PerspectiveConfig, value: number) => {
      setConfig((prev) => {
        const next = { ...prev, [key]: value };
        setActivePreset(
          PRESETS.find((p) => configsAreEqual(p.config, next))?.key ?? "none"
        );
        return next;
      });
    },
    []
  );

  const handleApply = useCallback(() => {
    applyTransform(config);
  }, [applyTransform, config]);

  const handlePreset = useCallback(
    (preset: Preset) => {
      setActivePreset(preset.key);
      setConfig({ ...preset.config });
    },
    []
  );

  const handleReset = useCallback(() => {
    const next = { ...DEFAULT_CONFIG };
    setConfig(next);
    setActivePreset("none");

    const canvas = canvasRef.current;
    if (!canvas) return;

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const _f = m.fabric as any;
      void _f;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = canvas.getActiveObject?.();
      if (!obj) return;

      obj.set({ skewX: 0, skewY: 0, scaleX: 1, scaleY: 1 });
      delete obj.__perspectiveConfig;
      obj.setCoords?.();
      canvas.requestRenderAll?.();
      toast.success("Perspectiva resetada.");
    }).catch(() => {
      toast.error("Erro ao resetar perspectiva.");
    });
  }, []);

  const isDefault = isDefaultConfig(config);

  return (
    <div className="flex flex-col gap-3 p-3 select-none">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Maximize2 className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold leading-none">
          Transformação em Perspectiva
        </span>
      </div>

      {!hasSelection && (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          Selecione um objeto para aplicar perspectiva.
        </p>
      )}

      {hasSelection && (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Presets
            </span>
            <div className="grid grid-cols-3 gap-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePreset(preset)}
                  className={`text-[9px] px-1.5 py-1 rounded border transition-colors truncate ${
                    activePreset === preset.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 border-border hover:bg-muted/70 text-foreground"
                  }`}
                  title={preset.label}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Corner Sliders */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Cantos
            </span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {SLIDER_FIELDS.map(({ key, label }) => (
                <SliderRow
                  key={key}
                  label={label}
                  value={config[key]}
                  onChange={(v) => handleSliderChange(key, v)}
                />
              ))}
            </div>
          </div>

          {/* CSS Preview */}
          <CSSPreview config={config} />

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleApply}
              className="flex-1 text-[11px] font-medium py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Aplicar
            </button>
            <button
              onClick={handleReset}
              disabled={isDefault}
              className="flex-1 text-[11px] font-medium py-1.5 rounded border border-border hover:bg-muted/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Resetar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
