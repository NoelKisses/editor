"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RAINBOW_PRESETS: Record<string, string[]> = {
  "Arco-Íris": ["#ff0000", "#ff8000", "#ffff00", "#00ff00", "#0000ff", "#8000ff"],
  Sunset: ["#ffff00", "#ff8000", "#ff0080", "#8000ff"],
  Oceano: ["#00ffff", "#0080ff", "#000080"],
  Floresta: ["#90ee90", "#008000", "#004d00"],
  Fogo: ["#ffff00", "#ff8000", "#ff0000", "#8b0000"],
  Pastel: ["#ffb6c1", "#e6e6fa", "#add8e6", "#98ff98"],
  Neon: ["#ff10f0", "#10a8ff", "#39ff14"],
  Metálico: ["#c0c0c0", "#ffd700", "#c0c0c0"],
};

type DirectionKey = "horizontal" | "vertical" | "diagonal-br" | "diagonal-bl";

interface DirectionOption {
  key: DirectionKey;
  label: string;
}

const DIRECTIONS: DirectionOption[] = [
  { key: "horizontal", label: "Horizontal" },
  { key: "vertical", label: "Vertical" },
  { key: "diagonal-br", label: "Diagonal ↘" },
  { key: "diagonal-bl", label: "Diagonal ↙" },
];

const TEXT_TYPES = ["text", "i-text", "textbox"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedTextObjects(canvas: any): any[] {
  if (!canvas) return [];
  const active = canvas.getActiveObjects?.() ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return active.filter((o: any) => TEXT_TYPES.includes(o?.type));
}

function distributeColors(palette: string[], stops: number): string[] {
  if (palette.length === 0) return [];
  if (stops <= 1) return [palette[0]];
  const result: string[] = [];
  for (let i = 0; i < stops; i++) {
    const t = i / (stops - 1);
    const idx = t * (palette.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) {
      result.push(palette[lo]);
    } else {
      // Pick nearest color for discrete stops
      const frac = idx - lo;
      result.push(frac < 0.5 ? palette[lo] : palette[hi]);
    }
  }
  return result;
}

function buildColorStops(colors: string[]): Array<{ offset: number; color: string }> {
  if (colors.length === 0) return [];
  if (colors.length === 1) {
    return [
      { offset: 0, color: colors[0] },
      { offset: 1, color: colors[0] },
    ];
  }
  return colors.map((color, i) => ({
    offset: i / (colors.length - 1),
    color,
  }));
}

function getCoordsForDirection(
  width: number,
  height: number,
  direction: DirectionKey,
  reverse: boolean
): { x1: number; y1: number; x2: number; y2: number } {
  let coords = { x1: 0, y1: 0, x2: width, y2: 0 };
  switch (direction) {
    case "horizontal":
      coords = { x1: 0, y1: 0, x2: width, y2: 0 };
      break;
    case "vertical":
      coords = { x1: 0, y1: 0, x2: 0, y2: height };
      break;
    case "diagonal-br":
      coords = { x1: 0, y1: 0, x2: width, y2: height };
      break;
    case "diagonal-bl":
      coords = { x1: width, y1: 0, x2: 0, y2: height };
      break;
  }
  if (reverse) {
    return { x1: coords.x2, y1: coords.y2, x2: coords.x1, y2: coords.y1 };
  }
  return coords;
}

interface TextRainbowGradientPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextRainbowGradientPanel({ fabricCanvas }: TextRainbowGradientPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("Arco-Íris");
  const [direction, setDirection] = useState<DirectionKey>("horizontal");
  const [stops, setStops] = useState<number>(5);
  const [reverse, setReverse] = useState<boolean>(false);
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [customColors, setCustomColors] = useState<string[]>([
    "#ff0000",
    "#ffff00",
    "#00ff00",
    "#0000ff",
    "#8000ff",
  ]);
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    const canvas = fabricCanvas;
    if (!canvas) return;

    const updateSelection = () => {
      const selected = getSelectedTextObjects(canvas).length > 0;
      queueMicrotask(() => setHasSelection(selected));
    };

    updateSelection();
    canvas.on?.("selection:created", updateSelection);
    canvas.on?.("selection:updated", updateSelection);
    canvas.on?.("selection:cleared", updateSelection);

    return () => {
      canvas.off?.("selection:created", updateSelection);
      canvas.off?.("selection:updated", updateSelection);
      canvas.off?.("selection:cleared", updateSelection);
    };
  }, [fabricCanvas]);

  const getActivePalette = (): string[] => {
    if (customMode) return customColors;
    return RAINBOW_PRESETS[selectedPreset] ?? RAINBOW_PRESETS["Arco-Íris"];
  };

  const applyGradient = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const targets = getSelectedTextObjects(canvas);
    if (targets.length === 0) {
      toast.error("Selecione um texto primeiro");
      return;
    }

    const palette = getActivePalette();
    if (palette.length === 0) {
      toast.error("Paleta vazia");
      return;
    }

    const effectiveStops = Math.min(Math.max(stops, 2), 8);
    const colors = distributeColors(palette, effectiveStops);
    const colorStops = buildColorStops(colors);

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        if (!f?.Gradient) {
          toast.error("Fabric Gradient indisponível");
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targets.forEach((obj: any) => {
          const width = obj.width ?? 100;
          const height = obj.height ?? 100;
          const coords = getCoordsForDirection(width, height, direction, reverse);
          const gradient = new f.Gradient({
            type: "linear",
            coords,
            colorStops,
          });
          obj.set("fill", gradient);
          obj.dirty = true;
        });

        canvas.requestRenderAll?.();
        toast.success(`Gradiente aplicado a ${targets.length} texto(s)`);
      })
      .catch((err) => {
        toast.error(`Erro ao carregar Fabric: ${err?.message ?? err}`);
      });
  };

  const removeGradient = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const targets = getSelectedTextObjects(canvas);
    if (targets.length === 0) {
      toast.error("Selecione um texto primeiro");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targets.forEach((obj: any) => {
      obj.set("fill", "#000000");
      obj.dirty = true;
    });
    canvas.requestRenderAll?.();
    toast.success("Gradiente removido");
  };

  const updateCustomColor = (index: number, color: string) => {
    setCustomColors((prev) => {
      const next = [...prev];
      next[index] = color;
      return next;
    });
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Gradiente Arco-Íris</h3>
      </div>

      {!customMode ? (
        <div>
          <label className="text-xs font-medium block mb-2">Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(RAINBOW_PRESETS).map((name) => {
              const palette = RAINBOW_PRESETS[name];
              const isActive = selectedPreset === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedPreset(name)}
                  className={`rounded border p-2 text-xs text-left transition-colors ${
                    isActive
                      ? "border-primary ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium mb-1">{name}</div>
                  <div
                    className="h-3 w-full rounded"
                    style={{
                      background: `linear-gradient(to right, ${palette.join(", ")})`,
                    }}
                  />
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => setCustomMode(true)}
          >
            Custom Cores
          </Button>
        </div>
      ) : (
        <div>
          <label className="text-xs font-medium block mb-2">Cores Personalizadas</label>
          <div className="space-y-2">
            {customColors.map((color, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs w-12">Cor {i + 1}</span>
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => updateCustomColor(i, e.target.value)}
                  className="h-8 w-16 p-1"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => updateCustomColor(i, e.target.value)}
                  className="h-8 flex-1 text-xs"
                />
              </div>
            ))}
          </div>
          <div
            className="h-3 w-full rounded mt-2"
            style={{
              background: `linear-gradient(to right, ${customColors.join(", ")})`,
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => setCustomMode(false)}
          >
            Voltar aos Presets
          </Button>
        </div>
      )}

      <div>
        <label className="text-xs font-medium block mb-2">Direção</label>
        <div className="grid grid-cols-2 gap-2">
          {DIRECTIONS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDirection(d.key)}
              className={`rounded border p-2 text-xs transition-colors ${
                direction === d.key
                  ? "border-primary ring-2 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium block mb-2">
          Stops: {stops}
        </label>
        <input
          type="range"
          min={3}
          max={8}
          step={1}
          value={stops}
          onChange={(e) => setStops(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rainbow-reverse"
          checked={reverse}
          onChange={(e) => setReverse(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="rainbow-reverse" className="text-xs font-medium">
          Inverter direção
        </label>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          className="w-full"
          onClick={applyGradient}
          disabled={!hasSelection}
        >
          Aplicar Gradiente
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={removeGradient}
          disabled={!hasSelection}
        >
          Remover Gradiente
        </Button>
      </div>
    </div>
  );
}
