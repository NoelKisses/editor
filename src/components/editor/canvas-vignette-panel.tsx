"use client";

import { useEffect, useRef, useState } from "react";
import { Aperture } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasVignettePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type VignetteShape = "circle" | "rectangle";

interface Preset {
  name: string;
  intensity: number;
  radius: number;
  softness: number;
  color?: string;
}

const PRESETS: Preset[] = [
  { name: "Sutil", intensity: 0.3, radius: 80, softness: 25 },
  { name: "Médio", intensity: 0.5, radius: 70, softness: 20 },
  { name: "Forte", intensity: 0.7, radius: 60, softness: 15 },
  { name: "Dramático", intensity: 0.9, radius: 50, softness: 10 },
  { name: "Vintage", intensity: 0.6, radius: 65, softness: 30, color: "#3a2a1a" },
];

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildVignetteGradient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  color: string,
  intensity: number,
  radiusPct: number,
  softnessPct: number,
  shape: VignetteShape,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);
  const innerRadius = (radiusPct / 100) * maxRadius * (1 - softnessPct / 100);
  const outerRadius = (radiusPct / 100) * maxRadius + (softnessPct / 100) * maxRadius;

  if (shape === "circle") {
    return new f.Gradient({
      type: "radial",
      gradientUnits: "pixels",
      coords: {
        x1: cx,
        y1: cy,
        r1: Math.max(0, innerRadius),
        x2: cx,
        y2: cy,
        r2: Math.max(outerRadius, innerRadius + 1),
      },
      colorStops: [
        { offset: 0, color: hexToRgba(color, 0) },
        { offset: 0.6, color: hexToRgba(color, intensity * 0.3) },
        { offset: 1, color: hexToRgba(color, intensity) },
      ],
    });
  }

  return new f.Gradient({
    type: "linear",
    gradientUnits: "pixels",
    coords: { x1: 0, y1: 0, x2: 0, y2: h },
    colorStops: [
      { offset: 0, color: hexToRgba(color, intensity) },
      { offset: softnessPct / 200 + 0.15, color: hexToRgba(color, 0) },
      { offset: 1 - (softnessPct / 200 + 0.15), color: hexToRgba(color, 0) },
      { offset: 1, color: hexToRgba(color, intensity) },
    ],
  });
}

export function CanvasVignettePanel({ fabricCanvas }: CanvasVignettePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [color, setColor] = useState<string>("#000000");
  const [intensity, setIntensity] = useState<number>(0.6);
  const [radius, setRadius] = useState<number>(70);
  const [softness, setSoftness] = useState<number>(20);
  const [shape, setShape] = useState<VignetteShape>("circle");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const removeExistingVignette = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvas: any,
  ): number => {
    if (!canvas) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((o: any) => o?.data?.vignette === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((o: any) => canvas.remove(o));
    return objects.length;
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
          toast.error("Fabric não disponível");
          return;
        }
        removeExistingVignette(canvas);
        const w = canvas.getWidth();
        const h = canvas.getHeight();
        const rect = new f.Rect({
          left: 0,
          top: 0,
          width: w,
          height: h,
          selectable: false,
          evented: false,
          data: { vignette: true },
        });
        const gradient = buildVignetteGradient(
          f,
          w,
          h,
          color,
          intensity,
          radius,
          softness,
          shape,
        );
        rect.set("fill", gradient);
        canvas.add(rect);
        canvas.renderAll();
        toast.success("Vinheta aplicada");
      })
      .catch(() => {
        toast.error("Erro ao carregar fabric");
      });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const removed = removeExistingVignette(canvas);
    canvas.renderAll();
    if (removed > 0) {
      toast.success("Vinheta removida");
    } else {
      toast.info("Nenhuma vinheta encontrada");
    }
  };

  const applyPreset = (preset: Preset) => {
    setIntensity(preset.intensity);
    setRadius(preset.radius);
    setSoftness(preset.softness);
    if (preset.color) {
      setColor(preset.color);
    }
    toast.success(`Preset "${preset.name}" aplicado`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Aperture className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Vinheta</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vignette-color">
          Cor
        </label>
        <Input
          id="vignette-color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vignette-intensity">
          Intensidade: {intensity.toFixed(2)}
        </label>
        <input
          id="vignette-intensity"
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vignette-radius">
          Raio: {radius}%
        </label>
        <input
          id="vignette-radius"
          type="range"
          min={30}
          max={100}
          step={1}
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vignette-softness">
          Suavidade: {softness}%
        </label>
        <input
          id="vignette-softness"
          type="range"
          min={0}
          max={50}
          step={1}
          value={softness}
          onChange={(e) => setSoftness(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Formato</label>
        <div className="flex gap-2">
          <Button
            variant={shape === "circle" ? "default" : "outline"}
            size="sm"
            onClick={() => setShape("circle")}
            className="flex-1"
          >
            Círculo
          </Button>
          <Button
            variant={shape === "rectangle" ? "default" : "outline"}
            size="sm"
            onClick={() => setShape("rectangle")}
            className="flex-1"
          >
            Retângulo
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Presets</label>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="flex-1"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleApply} className="w-full">
          Aplicar Vinheta
        </Button>
        <Button onClick={handleRemove} variant="outline" className="w-full">
          Remover Vinheta
        </Button>
      </div>
    </div>
  );
}
