"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasLensFlarePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const POSITION_PRESETS: Record<Position, { x: number; y: number; label: string }> = {
  "top-left": { x: 20, y: 20, label: "Sup. Esq." },
  "top-right": { x: 80, y: 20, label: "Sup. Dir." },
  "bottom-left": { x: 20, y: 80, label: "Inf. Esq." },
  "bottom-right": { x: 80, y: 80, label: "Inf. Dir." },
};

const FLARE_TYPES = {
  sol: { main: "#fff4cc", secondary: "#ffaa44", label: "Sol" },
  estudio: { main: "#ffffff", secondary: "#cce6ff", label: "Estúdio" },
  cinema: { main: "#aaccff", secondary: "#3366ff", label: "Cinema" },
} as const;

type FlareType = keyof typeof FLARE_TYPES;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flareGradientFill(f: any, color: string, radius: number, intensity: number) {
  return new f.Gradient({
    type: "radial",
    coords: {
      x1: radius,
      y1: radius,
      r1: 0,
      x2: radius,
      y2: radius,
      r2: radius,
    },
    colorStops: [
      { offset: 0, color, opacity: intensity },
      { offset: 0.4, color, opacity: intensity * 0.5 },
      { offset: 1, color, opacity: 0 },
    ],
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CanvasLensFlarePanel({ fabricCanvas }: CanvasLensFlarePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [posX, setPosX] = useState<number>(20);
  const [posY, setPosY] = useState<number>(20);
  const [mainColor, setMainColor] = useState<string>("#fff4cc");
  const [secondaryColor, setSecondaryColor] = useState<string>("#ffaa44");
  const [mainSize, setMainSize] = useState<number>(120);
  const [flareCount, setFlareCount] = useState<number>(5);
  const [intensity, setIntensity] = useState<number>(0.7);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const applyPreset = (position: Position) => {
    const preset = POSITION_PRESETS[position];
    setPosX(preset.x);
    setPosY(preset.y);
  };

  const applyFlareType = (type: FlareType) => {
    const preset = FLARE_TYPES[type];
    setMainColor(preset.main);
    setSecondaryColor(preset.secondary);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        if (!f) {
          toast.error("Falha ao carregar Fabric.js");
          return;
        }

        const canvasW = canvas.getWidth();
        const canvasH = canvas.getHeight();
        const originX = (posX / 100) * canvasW;
        const originY = (posY / 100) * canvasH;
        const oppositeX = canvasW - originX;
        const oppositeY = canvasH - originY;

        const mainRadius = mainSize / 2;
        const mainFlare = new f.Circle({
          left: originX - mainRadius,
          top: originY - mainRadius,
          radius: mainRadius,
          fill: flareGradientFill(f, mainColor, mainRadius, intensity),
          selectable: false,
          evented: false,
          data: { lensFlare: true },
        });
        canvas.add(mainFlare);

        for (let i = 0; i < flareCount; i++) {
          const t = (i + 1) / (flareCount + 1);
          const cx = originX + (oppositeX - originX) * t;
          const cy = originY + (oppositeY - originY) * t;
          const color = i % 2 === 0 ? secondaryColor : mainColor;
          const sizeFactor = 0.3 + Math.random() * 0.4;
          const radius = (mainSize * sizeFactor) / 2;
          const opacity = intensity * (0.3 + Math.random() * 0.4);

          const secondary = new f.Circle({
            left: cx - radius,
            top: cy - radius,
            radius,
            fill: hexToRgba(color, opacity),
            selectable: false,
            evented: false,
            opacity: 0.8,
            data: { lensFlare: true },
          });
          canvas.add(secondary);
        }

        canvas.renderAll();
        queueMicrotask(() => {
          toast.success("Lens flare aplicado");
        });
      })
      .catch(() => {
        toast.error("Erro ao carregar Fabric.js");
      });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((o: any) => o?.data?.lensFlare === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((o: any) => canvas.remove(o));
    canvas.renderAll();
    toast.success(`${objects.length} flare(s) removido(s)`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Sparkle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Lens Flare</h3>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Tipo de Flare</span>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(FLARE_TYPES) as FlareType[]).map((type) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => applyFlareType(type)}
            >
              {FLARE_TYPES[type].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Posição</span>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(POSITION_PRESETS) as Position[]).map((pos) => (
            <Button
              key={pos}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(pos)}
            >
              {POSITION_PRESETS[pos].label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs">X (%)</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={posX}
              onChange={(e) => setPosX(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs">Y (%)</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={posY}
              onChange={(e) => setPosY(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-xs font-medium">Cor Principal</span>
          <input
            type="color"
            value={mainColor}
            onChange={(e) => setMainColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium">Cor Secundária</span>
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">
          Tamanho do Flare Principal: {mainSize}px
        </span>
        <input
          type="range"
          min={50}
          max={300}
          step={1}
          value={mainSize}
          onChange={(e) => setMainSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">
          Número de Flares Secundários: {flareCount}
        </span>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={flareCount}
          onChange={(e) => setFlareCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">
          Intensidade: {intensity.toFixed(2)}
        </span>
        <input
          type="range"
          min={0.2}
          max={1.0}
          step={0.05}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2 pt-2">
        <Button className="w-full" onClick={handleApply}>
          Aplicar Lens Flare
        </Button>
        <Button variant="outline" className="w-full" onClick={handleRemove}>
          Remover Flares
        </Button>
      </div>
    </div>
  );
}
