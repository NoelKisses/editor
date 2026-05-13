"use client";

import { useCallback, useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface GradientPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ColorStop {
  offset: number;
  color: string;
}

const PRESET_GRADIENTS: { label: string; stops: ColorStop[]; angle: number }[] = [
  // Natureza
  { label: "Pôr do Sol",  stops: [{ offset: 0, color: "#ff6b35" }, { offset: 1, color: "#f7c59f" }], angle: 135 },
  { label: "Oceano",      stops: [{ offset: 0, color: "#0575e6" }, { offset: 1, color: "#021b79" }], angle: 135 },
  { label: "Aurora",      stops: [{ offset: 0, color: "#00c6ff" }, { offset: 0.5, color: "#a855f7" }, { offset: 1, color: "#ec4899" }], angle: 135 },
  { label: "Floresta",    stops: [{ offset: 0, color: "#11998e" }, { offset: 1, color: "#38ef7d" }], angle: 135 },
  // Intensos
  { label: "Fogo",        stops: [{ offset: 0, color: "#f12711" }, { offset: 1, color: "#f5af19" }], angle: 90 },
  { label: "Neon",        stops: [{ offset: 0, color: "#00f260" }, { offset: 1, color: "#0575e6" }], angle: 135 },
  { label: "Elétrico",    stops: [{ offset: 0, color: "#ff0099" }, { offset: 1, color: "#493240" }], angle: 135 },
  { label: "Plasma",      stops: [{ offset: 0, color: "#9b27af" }, { offset: 0.5, color: "#e91e63" }, { offset: 1, color: "#ff5722" }], angle: 90 },
  // Escuros
  { label: "Noite",       stops: [{ offset: 0, color: "#0f0c29" }, { offset: 0.5, color: "#302b63" }, { offset: 1, color: "#24243e" }], angle: 135 },
  { label: "Obsidiana",   stops: [{ offset: 0, color: "#1a1a2e" }, { offset: 1, color: "#16213e" }], angle: 135 },
  { label: "Carvão",      stops: [{ offset: 0, color: "#232526" }, { offset: 1, color: "#414345" }], angle: 135 },
  { label: "Abismo",      stops: [{ offset: 0, color: "#000000" }, { offset: 1, color: "#434343" }], angle: 135 },
  // Pastel
  { label: "Rosa",        stops: [{ offset: 0, color: "#f953c6" }, { offset: 1, color: "#b91d73" }], angle: 135 },
  { label: "Pêssego",     stops: [{ offset: 0, color: "#ffb347" }, { offset: 1, color: "#ffcc02" }], angle: 135 },
  { label: "Lavanda",     stops: [{ offset: 0, color: "#c471f5" }, { offset: 1, color: "#fa71cd" }], angle: 135 },
  { label: "Menta",       stops: [{ offset: 0, color: "#a8edea" }, { offset: 1, color: "#fed6e3" }], angle: 135 },
  // Metálicos
  { label: "Prata",       stops: [{ offset: 0, color: "#bdc3c7" }, { offset: 1, color: "#2c3e50" }], angle: 135 },
  { label: "Ouro",        stops: [{ offset: 0, color: "#f7971e" }, { offset: 1, color: "#ffd200" }], angle: 135 },
  { label: "Bronze",      stops: [{ offset: 0, color: "#c97b3c" }, { offset: 0.5, color: "#e8a951" }, { offset: 1, color: "#c97b3c" }], angle: 135 },
  { label: "Titânio",     stops: [{ offset: 0, color: "#283048" }, { offset: 1, color: "#859398" }], angle: 135 },
  // YouTube
  { label: "YT Vermelho", stops: [{ offset: 0, color: "#ff0000" }, { offset: 1, color: "#cc0000" }], angle: 135 },
  { label: "YT Dark",     stops: [{ offset: 0, color: "#1a1a1a" }, { offset: 1, color: "#ff0000" }], angle: 135 },
  { label: "Viral",       stops: [{ offset: 0, color: "#fc466b" }, { offset: 1, color: "#3f5efb" }], angle: 135 },
  { label: "Trending",    stops: [{ offset: 0, color: "#11998e" }, { offset: 1, color: "#38ef7d" }], angle: 45 },
];

function angleToCoords(angle: number): { x1: number; y1: number; x2: number; y2: number } {
  const rad = ((angle - 90) * Math.PI) / 180;
  const x1 = 0.5 - Math.cos(rad) * 0.5;
  const y1 = 0.5 - Math.sin(rad) * 0.5;
  const x2 = 0.5 + Math.cos(rad) * 0.5;
  const y2 = 0.5 + Math.sin(rad) * 0.5;
  return { x1, y1, x2, y2 };
}

export function GradientPanel({ fabricCanvas, selectionVersion }: GradientPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [gradientType, setGradientType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<ColorStop[]>([
    { offset: 0, color: "#6366f1" },
    { offset: 1, color: "#ec4899" },
  ]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject() ?? null;
    queueMicrotask(() => setActive(obj));
  }, [fabricCanvas, selectionVersion]);

  const buildGradient = useCallback(
    async (customStops?: ColorStop[], customAngle?: number, customType?: "linear" | "radial") => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) {
        toast.error("Selecione um elemento no canvas primeiro");
        return;
      }

      const { fabric } = await import("fabric");
      const useStops = customStops ?? stops;
      const useAngle = customAngle ?? angle;
      const useType = customType ?? gradientType;

      const w: number = obj.width ?? 200;
      const h: number = obj.height ?? 200;

      const colorStops = useStops.map((s) => ({ offset: s.offset, color: s.color }));

      let gradient: unknown;
      if (useType === "linear") {
        const { x1, y1, x2, y2 } = angleToCoords(useAngle);
        gradient = new fabric.Gradient({
          type: "linear",
          gradientUnits: "percentage",
          coords: { x1: x1 * 100, y1: y1 * 100, x2: x2 * 100, y2: y2 * 100 },
          colorStops,
        });
      } else {
        gradient = new fabric.Gradient({
          type: "radial",
          gradientUnits: "percentage",
          coords: { x1: 50, y1: 50, x2: 50, y2: 50, r1: 0, r2: Math.max(w, h) / 2 },
          colorStops,
        });
      }

      obj.set({ fill: gradient });
      fabricCanvas.requestRenderAll();
      toast.success("Gradiente aplicado");
    },
    [fabricCanvas, stops, angle, gradientType]
  );

  const removeGradient = useCallback(async () => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ fill: "#6366f1" });
    fabricCanvas.requestRenderAll();
    toast.success("Gradiente removido");
  }, [fabricCanvas]);

  const addStop = () => {
    if (stops.length >= 5) return;
    const prevOffset = stops.length >= 2 ? stops[stops.length - 2].offset : 0;
    const mid = (stops[stops.length - 1].offset + prevOffset) / 2;
    setStops([...stops, { offset: Math.round(mid * 100) / 100, color: "#ffffff" }].sort((a, b) => a.offset - b.offset));
  };

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((_, i) => i !== idx));
  };

  const updateStop = (idx: number, key: keyof ColorStop, value: string | number) => {
    const updated = stops.map((s, i) => i === idx ? { ...s, [key]: value } : s);
    setStops(updated.sort((a, b) => a.offset - b.offset));
  };

  // CSS preview
  const previewGradient = `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})`;

  return (
    <div className="flex flex-col gap-4 pt-2 px-3 pb-3">
      <h3 className="text-sm font-semibold text-foreground">Gradiente</h3>

      {!active && (
        <p className="text-xs text-muted-foreground">Selecione um elemento no canvas para aplicar gradiente.</p>
      )}

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Presets</span>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESET_GRADIENTS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setStops(preset.stops);
                setAngle(preset.angle);
                setGradientType("linear");
                buildGradient(preset.stops, preset.angle, "linear");
              }}
              className="flex flex-col items-center gap-1 rounded border border-border hover:border-primary/50 overflow-hidden transition-colors"
              title={preset.label}
            >
              <div
                className="w-full h-8"
                style={{ background: `linear-gradient(${preset.angle}deg, ${preset.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(", ")})` }}
              />
              <span className="text-[9px] text-muted-foreground pb-1">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setGradientType("linear")}
          className={`flex-1 text-xs py-1.5 rounded border transition-colors ${gradientType === "linear" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent/50"}`}
        >
          Linear
        </button>
        <button
          onClick={() => setGradientType("radial")}
          className={`flex-1 text-xs py-1.5 rounded border transition-colors ${gradientType === "radial" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent/50"}`}
        >
          Radial
        </button>
      </div>

      {/* Angle (linear only) */}
      {gradientType === "linear" && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Ângulo</span>
            <span className="text-xs tabular-nums">{angle}°</span>
          </div>
          <Slider value={[angle]} min={0} max={360} step={5} onValueChange={(v) => setAngle((v as number[])[0])} />
        </div>
      )}

      {/* Preview */}
      <div className="h-8 rounded border border-border" style={{ background: previewGradient }} />

      {/* Color stops */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Cores</span>
          <button onClick={addStop} className="text-muted-foreground hover:text-foreground p-0.5" title="Adicionar cor">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {stops.map((stop, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(idx, "color", e.target.value)}
              className="w-7 h-7 rounded border border-border p-0 bg-transparent cursor-pointer flex-shrink-0"
            />
            <Slider
              value={[stop.offset * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => updateStop(idx, "offset", (v as number[])[0] / 100)}
              className="flex-1"
            />
            <span className="text-[10px] tabular-nums w-7">{Math.round(stop.offset * 100)}%</span>
            <button onClick={() => removeStop(idx)} className="text-muted-foreground hover:text-destructive" title="Remover">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Apply / Remove */}
      <div className="flex gap-1.5">
        <Button size="sm" className="flex-1 text-xs h-8" onClick={() => buildGradient()}>
          Aplicar
        </Button>
        <Button size="sm" variant="outline" className="text-xs h-8 px-3" onClick={removeGradient} title="Remover gradiente">
          Remover
        </Button>
      </div>
    </div>
  );
}
