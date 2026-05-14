"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

export interface CanvasColorWheelPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type HarmonyType =
  | "complementar"
  | "análogo"
  | "tríade"
  | "tétrade"
  | "split-comp"
  | "monocromático";

interface HarmonyOption {
  value: HarmonyType;
  label: string;
}

const HARMONY_OPTIONS: HarmonyOption[] = [
  { value: "complementar", label: "Complementar" },
  { value: "análogo", label: "Análogo" },
  { value: "tríade", label: "Tríade" },
  { value: "tétrade", label: "Tétrade" },
  { value: "split-comp", label: "Split-comp" },
  { value: "monocromático", label: "Monocromático" },
];

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

export function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);

  const channel = (n: number): string => {
    const k = (n + h / 30) % 12;
    const value = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * value)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function generateHarmony(baseHex: string, type: HarmonyType): string[] {
  const [h, s, l] = hexToHsl(baseHex);

  switch (type) {
    case "complementar":
      return [baseHex, hslToHex((h + 180) % 360, s, l)];

    case "análogo":
      return [
        hslToHex((h - 30 + 360) % 360, s, l),
        baseHex,
        hslToHex((h + 30) % 360, s, l),
      ];

    case "tríade":
      return [
        baseHex,
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l),
      ];

    case "tétrade":
      return [
        baseHex,
        hslToHex((h + 90) % 360, s, l),
        hslToHex((h + 180) % 360, s, l),
        hslToHex((h + 270) % 360, s, l),
      ];

    case "split-comp":
      return [
        baseHex,
        hslToHex((h + 150) % 360, s, l),
        hslToHex((h + 210) % 360, s, l),
      ];

    case "monocromático": {
      const shades: string[] = [];
      const lightnessSteps = [
        Math.max(10, l - 30),
        Math.max(10, l - 15),
        l,
        Math.min(90, l + 15),
        Math.min(90, l + 30),
      ];
      for (const ls of lightnessSteps) {
        shades.push(hslToHex(h, s, ls));
      }
      return shades;
    }

    default:
      return [baseHex];
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CanvasColorWheelPanel({ fabricCanvas }: CanvasColorWheelPanelProps) {
  const canvasRef = useRef<FabricCanvas>(null);
  const [baseColor, setBaseColor] = useState("#3b82f6");
  const [hexInput, setHexInput] = useState("#3b82f6");
  const [harmonyType, setHarmonyType] = useState<HarmonyType>("complementar");
  const [palette, setPalette] = useState<string[]>(() =>
    generateHarmony("#3b82f6", "complementar")
  );

  // Sync ref without updating during render
  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // Regenerate palette whenever base color or harmony type changes
  useEffect(() => {
    queueMicrotask(() => {
      setPalette(generateHarmony(baseColor, harmonyType));
    });
  }, [baseColor, harmonyType]);

  const handleColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setBaseColor(val);
      setHexInput(val);
    },
    []
  );

  const handleHexInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setHexInput(val);
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        setBaseColor(val);
      }
    },
    []
  );

  const handleSwatchClick = useCallback((color: string) => {
    navigator.clipboard
      .writeText(color)
      .then(() => toast.success(`${color} copiado`))
      .catch(() => toast.error("Erro ao copiar"));
  }, []);

  const handleCopyAll = useCallback(() => {
    const text = palette.join(", ");
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Todas as cores copiadas"))
      .catch(() => toast.error("Erro ao copiar"));
  }, [palette]);

  const handleApplyToObject = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = canvas.getActiveObject();
    if (!obj) {
      toast.error("Selecione um objeto no canvas");
      return;
    }
    const color = palette[0];
    obj.set({ fill: color });
    canvas.requestRenderAll();
    toast.success(`Cor ${color} aplicada ao objeto`);
  }, [palette]);

  const handleApplyPaletteToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = canvas.getObjects();
    if (!objects.length) {
      toast.error("O canvas não possui objetos");
      return;
    }
    objects.forEach((obj, i) => {
      if (obj.type !== "image") {
        obj.set({ fill: palette[i % palette.length] });
      }
    });
    canvas.requestRenderAll();
    toast.success("Paleta aplicada aos objetos do canvas");
  }, [palette]);

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Roda de Cores</span>
      </div>

      {/* Base color picker */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Cor base
        </span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={baseColor}
            onChange={handleColorPickerChange}
            className="w-8 h-8 rounded border border-border cursor-pointer flex-shrink-0"
            title="Escolher cor base"
          />
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            placeholder="#3b82f6"
            maxLength={7}
            className="flex-1 text-[11px] bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary/50 font-mono"
          />
        </div>
      </div>

      {/* Harmony type selector (2×3 grid) */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Tipo de harmonia
        </span>
        <div className="grid grid-cols-2 gap-1">
          {HARMONY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setHarmonyType(opt.value)}
              className={`px-2 py-1.5 rounded border text-[10px] font-medium transition-colors ${
                harmonyType === opt.value
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border text-foreground hover:border-primary/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generated palette */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Paleta gerada{" "}
            <span className="text-primary font-semibold">{palette.length} cores</span>
          </span>
          <button
            onClick={handleCopyAll}
            className="text-[9px] text-primary hover:text-primary/70 transition-colors"
          >
            Copiar tudo
          </button>
        </div>

        {/* Swatches */}
        <div className="flex gap-1.5">
          {palette.map((color, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <button
                onClick={() => handleSwatchClick(color)}
                className="w-full h-12 rounded border border-border/50 hover:scale-105 transition-transform shadow-sm"
                style={{ background: color }}
                title={`${color} — clique para copiar`}
              />
              <span className="text-[7px] text-muted-foreground font-mono truncate w-full text-center">
                {color}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[8px] text-muted-foreground/60">
          Clique em um swatch para copiar o hex
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleApplyToObject}
          className="w-full text-[10px] font-medium py-1.5 rounded border border-border hover:bg-primary/10 hover:border-primary/50 transition-colors"
        >
          Aplicar ao objeto
        </button>
        <button
          onClick={handleApplyPaletteToCanvas}
          className="w-full text-[10px] font-medium py-1.5 rounded border border-border hover:bg-primary/10 hover:border-primary/50 transition-colors"
        >
          Aplicar paleta ao canvas
        </button>
      </div>
    </div>
  );
}
