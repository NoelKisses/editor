"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ObjectColorSwatchPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type ApplyMode = "fill" | "stroke" | "both";

const PALETTES: Record<string, string[]> = {
  Material: [
    "#F44336",
    "#E91E63",
    "#9C27B0",
    "#3F51B5",
    "#2196F3",
    "#009688",
    "#4CAF50",
    "#FF9800",
  ],
  Pastel: [
    "#FFD1DC",
    "#FFE5B4",
    "#FFF5BA",
    "#BFFCC6",
    "#C4F0F0",
    "#C9C9FF",
    "#E0BBE4",
    "#FEC8D8",
  ],
  Vibrante: [
    "#FF006E",
    "#FB5607",
    "#FFBE0B",
    "#8338EC",
    "#3A86FF",
    "#00F5D4",
    "#FF4D6D",
    "#39FF14",
  ],
  Terra: [
    "#7C5E3C",
    "#A0522D",
    "#8B4513",
    "#C19A6B",
    "#9C7A4A",
    "#6F4E37",
    "#B08968",
    "#5C4033",
  ],
  "Pôr-do-sol": [
    "#FF6B6B",
    "#FF8E53",
    "#FFB347",
    "#FFD166",
    "#F97068",
    "#EF476F",
    "#C9184A",
    "#7B2CBF",
  ],
  Oceano: [
    "#03045E",
    "#023E8A",
    "#0077B6",
    "#0096C7",
    "#00B4D8",
    "#48CAE4",
    "#90E0EF",
    "#CAF0F8",
  ],
  Vintage: [
    "#704214",
    "#8B7355",
    "#A89F91",
    "#C2B280",
    "#D2B48C",
    "#967117",
    "#665D1E",
    "#4B3621",
  ],
  Mono: [
    "#000000",
    "#1F1F1F",
    "#3D3D3D",
    "#5C5C5C",
    "#7A7A7A",
    "#999999",
    "#BFBFBF",
    "#FFFFFF",
  ],
};

const PALETTE_NAMES = Object.keys(PALETTES);

function applyColorToObjects(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  color: string,
  mode: ApplyMode,
): number {
  if (!canvas) return 0;
  const objects = canvas.getActiveObjects?.() ?? [];
  if (!objects.length) return 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects.forEach((obj: any) => {
    if (mode === "fill" || mode === "both") {
      obj.set("fill", color);
    }
    if (mode === "stroke" || mode === "both") {
      obj.set("stroke", color);
      if (!obj.strokeWidth || obj.strokeWidth === 0) {
        obj.set("strokeWidth", 1);
      }
    }
    obj.setCoords?.();
  });
  canvas.requestRenderAll?.();
  return objects.length;
}

function clearObjectColors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
): number {
  if (!canvas) return 0;
  const objects = canvas.getActiveObjects?.() ?? [];
  if (!objects.length) return 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects.forEach((obj: any) => {
    obj.set("fill", "#000000");
    obj.set("stroke", "");
    obj.set("strokeWidth", 0);
    obj.setCoords?.();
  });
  canvas.requestRenderAll?.();
  return objects.length;
}

function isValidHex(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim());
}

export function ObjectColorSwatchPanel({
  fabricCanvas,
}: ObjectColorSwatchPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [activePalette, setActivePalette] = useState<string>(PALETTE_NAMES[0]);
  const [applyMode, setApplyMode] = useState<ApplyMode>("fill");
  const [customColor, setCustomColor] = useState<string>("#FF6B6B");
  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const pushRecent = (color: string) => {
    queueMicrotask(() => {
      setRecentColors((prev) => {
        const filtered = prev.filter(
          (c) => c.toLowerCase() !== color.toLowerCase(),
        );
        return [color, ...filtered].slice(0, 5);
      });
    });
  };

  const handleApplyColor = (color: string) => {
    const canvas = canvasRef.current;
    const count = applyColorToObjects(canvas, color, applyMode);
    if (count === 0) {
      toast.warning("Selecione um ou mais objetos no canvas");
      return;
    }
    pushRecent(color);
    const modeLabel =
      applyMode === "fill"
        ? "preenchimento"
        : applyMode === "stroke"
          ? "contorno"
          : "preenchimento e contorno";
    toast.success(`Cor ${color} aplicada (${modeLabel}) a ${count} objeto(s)`);
  };

  const handleApplyCustom = () => {
    const value = customColor.trim();
    if (!isValidHex(value)) {
      toast.error("Cor hexadecimal inválida (ex: #FF6B6B)");
      return;
    }
    handleApplyColor(value);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const count = clearObjectColors(canvas);
    if (count === 0) {
      toast.warning("Selecione um ou mais objetos no canvas");
      return;
    }
    toast.success(`Cores resetadas em ${count} objeto(s)`);
  };

  const colors = PALETTES[activePalette] ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">Paleta de Cores Rápida</h3>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Paletas
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {activePalette}
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {PALETTE_NAMES.map((name) => (
            <Button
              key={name}
              size="sm"
              variant={name === activePalette ? "default" : "outline"}
              className="h-7 px-2 text-[11px]"
              onClick={() => setActivePalette(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium text-muted-foreground">
          Cores ({activePalette})
        </span>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color, idx) => (
            <button
              key={`${color}-${idx}`}
              type="button"
              aria-label={`Aplicar cor ${color}`}
              onClick={() => handleApplyColor(color)}
              className="h-10 w-full rounded-md border border-border shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium text-muted-foreground">
          Modo de Aplicação
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            size="sm"
            variant={applyMode === "fill" ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setApplyMode("fill")}
          >
            Preenchimento
          </Button>
          <Button
            size="sm"
            variant={applyMode === "stroke" ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setApplyMode("stroke")}
          >
            Contorno
          </Button>
          <Button
            size="sm"
            variant={applyMode === "both" ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setApplyMode("both")}
          >
            Ambos
          </Button>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium text-muted-foreground">
          Cor Customizada
        </span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={isValidHex(customColor) ? customColor : "#000000"}
            onChange={(e) => setCustomColor(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent"
            aria-label="Selecionar cor"
          />
          <Input
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#FF6B6B"
            className="h-9 flex-1 text-xs"
          />
          <Button
            size="sm"
            className="h-9 text-xs"
            onClick={handleApplyCustom}
          >
            Aplicar Customizada
          </Button>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium text-muted-foreground">
          Cores Recentes
        </span>
        {recentColors.length === 0 ? (
          <p className="text-[11px] italic text-muted-foreground">
            Nenhuma cor aplicada ainda
          </p>
        ) : (
          <div className="flex items-center gap-2">
            {recentColors.map((color, idx) => (
              <button
                key={`${color}-${idx}`}
                type="button"
                aria-label={`Reaplicar cor ${color}`}
                onClick={() => handleApplyColor(color)}
                className="h-8 w-8 rounded-md border border-border shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={handleClear}
      >
        Limpar Cores
      </Button>
    </div>
  );
}
