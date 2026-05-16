"use client";

import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DashPreset = "tracejado" | "pontilhado" | "ondulado" | "customizado";

const DASH_PRESETS: Record<Exclude<DashPreset, "customizado">, number[]> = {
  tracejado: [10, 5],
  pontilhado: [2, 4],
  ondulado: [8, 3, 2, 3],
};

const PRESET_LABELS: Record<DashPreset, string> = {
  tracejado: "Tracejado",
  pontilhado: "Pontilhado",
  ondulado: "Ondulado",
  customizado: "Customizado",
};

function buildDashArray(
  preset: DashPreset,
  customDash: number,
  customGap: number,
): number[] {
  if (preset === "customizado") {
    return [Math.max(1, customDash), Math.max(1, customGap)];
  }
  return DASH_PRESETS[preset];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedObjects(fabricCanvas: any): any[] {
  if (!fabricCanvas) return [];
  const active = fabricCanvas.getActiveObjects?.();
  if (Array.isArray(active) && active.length > 0) return active;
  const single = fabricCanvas.getActiveObject?.();
  return single ? [single] : [];
}

interface ObjectStrokeDashAnimPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function ObjectStrokeDashAnimPanel({
  fabricCanvas,
}: ObjectStrokeDashAnimPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animatedObjectsRef = useRef<any[]>([]);
  const speedRef = useRef<number>(1);
  const directionRef = useRef<1 | -1>(1);

  const [preset, setPreset] = useState<DashPreset>("tracejado");
  const [customDash, setCustomDash] = useState<number>(10);
  const [customGap, setCustomGap] = useState<number>(5);
  const [speed, setSpeed] = useState<number>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    queueMicrotask(() => setIsAnimating(false));
  };

  const tick = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      rafRef.current = null;
      return;
    }
    const objs = animatedObjectsRef.current;
    const step = speedRef.current * directionRef.current;
    for (const obj of objs) {
      const current =
        typeof obj.strokeDashOffset === "number" ? obj.strokeDashOffset : 0;
      const next = current - step;
      if (typeof obj.set === "function") {
        obj.set("strokeDashOffset", next);
      } else {
        obj.strokeDashOffset = next;
      }
    }
    if (typeof canvas.requestRenderAll === "function") {
      canvas.requestRenderAll();
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleStart = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const selected = getSelectedObjects(canvas);
    if (selected.length === 0) {
      toast.error("Selecione ao menos um objeto");
      return;
    }
    const dashArray = buildDashArray(preset, customDash, customGap);
    for (const obj of selected) {
      const data =
        obj.data && typeof obj.data === "object" ? { ...obj.data } : {};
      data.marchingAnts = true;
      if (typeof obj.set === "function") {
        obj.set({
          strokeDashArray: dashArray,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashOffset:
            typeof obj.strokeDashOffset === "number"
              ? obj.strokeDashOffset
              : 0,
          data,
        });
      } else {
        obj.strokeDashArray = dashArray;
        obj.stroke = strokeColor;
        obj.strokeWidth = strokeWidth;
        obj.strokeDashOffset =
          typeof obj.strokeDashOffset === "number" ? obj.strokeDashOffset : 0;
        obj.data = data;
      }
    }
    animatedObjectsRef.current = selected;
    if (typeof canvas.requestRenderAll === "function") {
      canvas.requestRenderAll();
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
    setIsAnimating(true);
    toast.success(`Animação iniciada em ${selected.length} objeto(s)`);
  };

  const handleStop = () => {
    stopAnimation();
    toast.info("Animação parada");
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    stopAnimation();
    const tagged = animatedObjectsRef.current.length
      ? animatedObjectsRef.current
      : getSelectedObjects(canvas);
    let count = 0;
    for (const obj of tagged) {
      if (obj?.data?.marchingAnts) {
        const data = { ...obj.data };
        delete data.marchingAnts;
        if (typeof obj.set === "function") {
          obj.set({ strokeDashArray: null, strokeDashOffset: 0, data });
        } else {
          obj.strokeDashArray = null;
          obj.strokeDashOffset = 0;
          obj.data = data;
        }
        count += 1;
      }
    }
    animatedObjectsRef.current = [];
    if (typeof canvas.requestRenderAll === "function") {
      canvas.requestRenderAll();
    }
    if (count > 0) {
      toast.success(`Padrão removido de ${count} objeto(s)`);
    } else {
      toast.info("Nenhum objeto com padrão para limpar");
    }
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <h3 className="text-sm font-semibold">
            Stroke Dash Animado (Marching Ants)
          </h3>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isAnimating
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {isAnimating ? "Animando" : "Parado"}
        </span>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Padrão</span>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PRESET_LABELS) as DashPreset[]).map((p) => (
            <Button
              key={p}
              type="button"
              variant={preset === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPreset(p)}
            >
              {PRESET_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {preset === "customizado" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs font-medium">Dash</span>
            <Input
              type="number"
              min={1}
              value={customDash}
              onChange={(e) =>
                setCustomDash(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium">Gap</span>
            <Input
              type="number"
              min={1}
              value={customGap}
              onChange={(e) =>
                setCustomGap(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Velocidade</span>
          <span className="text-xs text-muted-foreground">
            {speed.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Direção</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={direction === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => setDirection(1)}
          >
            Frente →
          </Button>
          <Button
            type="button"
            variant={direction === -1 ? "default" : "outline"}
            size="sm"
            onClick={() => setDirection(-1)}
          >
            Trás ←
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Cor do Stroke</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border"
          />
          <Input
            type="text"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Espessura</span>
          <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2 pt-2">
        <Button
          type="button"
          className="w-full"
          onClick={handleStart}
          disabled={isAnimating}
        >
          Iniciar Animação
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleStop}
          disabled={!isAnimating}
        >
          Parar Animação
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleClear}
        >
          Limpar Padrão
        </Button>
      </div>
    </div>
  );
}
