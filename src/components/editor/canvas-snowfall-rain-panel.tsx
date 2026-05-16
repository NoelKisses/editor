"use client";

import { useEffect, useRef, useState } from "react";
import { Snowflake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WeatherMode = "snow" | "rain" | "petals";

const DEFAULT_COLORS: Record<WeatherMode, string> = {
  snow: "#ffffff",
  rain: "#aaccff",
  petals: "#ff66aa",
};

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createParticle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  mode: WeatherMode,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any;

  if (mode === "snow") {
    obj = new f.Circle({
      left: x,
      top: y,
      radius: size,
      fill: color,
      opacity,
      shadow: new f.Shadow({
        color: color,
        blur: size * 2,
        offsetX: 0,
        offsetY: 0,
      }),
      originX: "center",
      originY: "center",
    });
  } else if (mode === "rain") {
    const length = size * 4;
    obj = new f.Line([0, 0, 2, length], {
      left: x,
      top: y,
      stroke: color,
      strokeWidth: Math.max(1, Math.floor(size / 2)),
      opacity,
      originX: "center",
      originY: "center",
      angle: 10,
    });
  } else {
    // petals - 5-point flower-like polygon
    const points: { x: number; y: number }[] = [];
    const petalCount = 5;
    for (let i = 0; i < petalCount * 2; i++) {
      const angle = (i / (petalCount * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? size : size * 0.4;
      points.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    obj = new f.Polygon(points, {
      left: x,
      top: y,
      fill: color,
      opacity,
      originX: "center",
      originY: "center",
      angle: Math.random() * 360,
    });
  }

  const vx = randomBetween(-0.5, 0.5);
  const vy =
    mode === "rain"
      ? randomBetween(4, 7)
      : mode === "snow"
        ? randomBetween(0.5, 1.5)
        : randomBetween(0.8, 2);

  obj.data = {
    weatherParticle: true,
    vx,
    vy,
    rotation: mode === "petals" ? randomBetween(-3, 3) : 0,
  };
  obj.selectable = false;
  obj.evented = false;

  return obj;
}

interface CanvasSnowfallRainPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasSnowfallRainPanel({
  fabricCanvas,
}: CanvasSnowfallRainPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const particlesRef = useRef<any[]>([]);

  const [mode, setMode] = useState<WeatherMode>("snow");
  const [count, setCount] = useState<number>(80);
  const [speed, setSpeed] = useState<number>(2);
  const [size, setSize] = useState<number>(4);
  const [color, setColor] = useState<string>(DEFAULT_COLORS.snow);
  const [wind, setWind] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(0.8);
  const [autoFall, setAutoFall] = useState<boolean>(true);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const handleModeChange = (newMode: WeatherMode) => {
    setMode(newMode);
    setColor(DEFAULT_COLORS[newMode]);
  };

  const startAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const width = canvas.getWidth();
    const height = canvas.getHeight();

    const tick = () => {
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p || !p.data) continue;
        const newLeft = (p.left ?? 0) + (p.data.vx + wind);
        const newTop = (p.top ?? 0) + p.data.vy * speed;

        let finalLeft = newLeft;
        let finalTop = newTop;

        if (finalTop > height + 10) {
          finalTop = -10;
          finalLeft = Math.random() * width;
        }
        if (finalLeft > width + 10) {
          finalLeft = -10;
        } else if (finalLeft < -10) {
          finalLeft = width + 10;
        }

        p.set({ left: finalLeft, top: finalTop });
        if (p.data.rotation && typeof p.angle === "number") {
          p.set({ angle: p.angle + p.data.rotation });
        }
      }
      canvas.requestRenderAll();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    queueMicrotask(() => setIsAnimating(true));
  };

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsAnimating(false);
    toast.info("Animação parada");
  };

  const handleStart = () => {
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
          toast.error("Falha ao carregar Fabric");
          return;
        }

        const width = canvas.getWidth();
        const height = canvas.getHeight();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newParticles: any[] = [];

        for (let i = 0; i < count; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const p = createParticle(f, mode, x, y, size, color, opacity);
          canvas.add(p);
          newParticles.push(p);
        }

        particlesRef.current = [...particlesRef.current, ...newParticles];
        canvas.requestRenderAll();
        toast.success(`${count} partículas criadas`);

        if (autoFall) {
          startAnimation();
        }
      })
      .catch(() => {
        toast.error("Erro ao importar Fabric");
      });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const objects = canvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objects.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o: any) => o?.data?.weatherParticle === true
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    particlesRef.current = [];
    canvas.requestRenderAll();
    setIsAnimating(false);
    toast.success("Partículas removidas");
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Snowflake className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Neve & Chuva</h3>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Modo</span>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={mode === "snow" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("snow")}
          >
            Neve
          </Button>
          <Button
            type="button"
            variant={mode === "rain" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("rain")}
          >
            Chuva
          </Button>
          <Button
            type="button"
            variant={mode === "petals" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("petals")}
          >
            Pétalas
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Quantidade</span>
          <span>{count}</span>
        </div>
        <input
          type="range"
          min={20}
          max={200}
          step={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Velocidade</span>
          <span>{speed.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={5}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Tamanho</span>
          <span>{size}</span>
        </div>
        <input
          type="range"
          min={2}
          max={10}
          step={1}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Cor</span>
        <div className="flex gap-2 items-center">
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-16 p-1"
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 flex-1"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Vento</span>
          <span>{wind.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={-3}
          max={3}
          step={0.1}
          value={wind}
          onChange={(e) => setWind(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Opacidade</span>
          <span>{opacity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.3}
          max={1.0}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={autoFall}
          onChange={(e) => setAutoFall(e.target.checked)}
        />
        <span>Auto-fall (animar automaticamente)</span>
      </label>

      <div className="space-y-2 pt-2">
        <Button
          type="button"
          onClick={handleStart}
          className="w-full"
          size="sm"
        >
          Iniciar Particulas
        </Button>
        <Button
          type="button"
          onClick={stopAnimation}
          variant="outline"
          className="w-full"
          size="sm"
          disabled={!isAnimating}
        >
          Parar Animação
        </Button>
        <Button
          type="button"
          onClick={handleClear}
          variant="destructive"
          className="w-full"
          size="sm"
        >
          Limpar Particulas
        </Button>
      </div>
    </div>
  );
}
