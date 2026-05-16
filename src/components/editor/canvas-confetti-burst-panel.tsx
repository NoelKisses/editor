"use client";

import { useEffect, useRef, useState } from "react";
import { PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PALETTES: Record<string, string[]> = {
  Festa: ["#ff0000", "#ff8800", "#ffff00", "#ff69b4", "#a020f0"],
  Pastel: ["#ffd1dc", "#add8e6", "#e6e6fa", "#98ff98", "#ffdab9"],
  Neon: ["#00f0ff", "#ff00ff", "#ffff00", "#00ff00", "#ff0080"],
  Ouro: ["#ffd700", "#ffaa00", "#ff8800", "#ffbb44", "#ffd966"],
  Monocromático: ["#000000", "#333333", "#777777", "#bbbbbb", "#ffffff"],
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface CanvasConfettiBurstPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasConfettiBurstPanel({ fabricCanvas }: CanvasConfettiBurstPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const [particleCount, setParticleCount] = useState<number>(60);
  const [origin, setOrigin] = useState<"center" | "top" | "custom">("center");
  const [customX, setCustomX] = useState<number>(50);
  const [customY, setCustomY] = useState<number>(50);
  const [spread, setSpread] = useState<number>(200);
  const [particleSize, setParticleSize] = useState<number>(8);
  const [palette, setPalette] = useState<string>("Festa");
  const [shapeVariety, setShapeVariety] = useState<boolean>(true);
  const [randomRotation, setRandomRotation] = useState<boolean>(true);

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

  const getOriginPoint = (canvasWidth: number, canvasHeight: number) => {
    if (origin === "center") {
      return { x: canvasWidth / 2, y: canvasHeight / 2 };
    }
    if (origin === "top") {
      return { x: canvasWidth / 2, y: 0 };
    }
    return {
      x: (customX / 100) * canvasWidth,
      y: (customY / 100) * canvasHeight,
    };
  };

  const handleExplode = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const colors = PALETTES[palette];
      const width = canvas.getWidth();
      const height = canvas.getHeight();
      const originPoint = getOriginPoint(width, height);

      for (let i = 0; i < particleCount; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = randomInRange(0, Math.PI * 2);
        const distance = randomInRange(0, spread);
        const px = originPoint.x + Math.cos(angle) * distance;
        const py = originPoint.y + Math.sin(angle) * distance;
        const size = randomInRange(particleSize * 0.6, particleSize * 1.4);
        const rotation = randomRotation ? randomInRange(0, 360) : 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let shape: any;

        if (shapeVariety) {
          const variant = Math.floor(Math.random() * 3);
          if (variant === 0) {
            shape = new f.Rect({
              left: px,
              top: py,
              width: size,
              height: size,
              fill: color,
              angle: rotation,
              originX: "center",
              originY: "center",
            });
          } else if (variant === 1) {
            shape = new f.Circle({
              left: px,
              top: py,
              radius: size / 2,
              fill: color,
              angle: rotation,
              originX: "center",
              originY: "center",
            });
          } else {
            shape = new f.Triangle({
              left: px,
              top: py,
              width: size,
              height: size,
              fill: color,
              angle: rotation,
              originX: "center",
              originY: "center",
            });
          }
        } else {
          shape = new f.Rect({
            left: px,
            top: py,
            width: size,
            height: size,
            fill: color,
            angle: rotation,
            originX: "center",
            originY: "center",
          });
        }

        shape.data = { confetti: true };
        canvas.add(shape);
      }

      canvas.renderAll();
      toast.success(`${particleCount} confetes explodiram!`);
    });
  };

  const handleAnimateFall = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pieces: { obj: any; vx: number; vy: number }[] = canvas
      .getObjects()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((o: any) => o.data && o.data.confetti === true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((o: any) => ({
        obj: o,
        vx: randomInRange(-2, 2),
        vy: randomInRange(-5, -1),
      }));

    if (pieces.length === 0) {
      toast.error("Nenhum confete para animar");
      return;
    }

    const canvasHeight = canvas.getHeight();

    const step = () => {
      let allBelow = true;
      for (const p of pieces) {
        p.vy += 0.2;
        p.obj.left += p.vx;
        p.obj.top += p.vy;
        if (p.obj.top < canvasHeight) {
          allBelow = false;
        }
      }
      canvas.renderAll();
      if (!allBelow) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        toast.success("Animação concluída");
      }
    };

    rafRef.current = requestAnimationFrame(step);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = canvas.getObjects().filter((o: any) => o.data && o.data.confetti === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    canvas.renderAll();
    toast.success(`${toRemove.length} confetes removidos`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <PartyPopper className="h-5 w-5" />
        <h3 className="text-base font-semibold">Explosão de Confete</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Quantidade de Partículas: {particleCount}
        </label>
        <input
          type="range"
          min={10}
          max={200}
          step={1}
          value={particleCount}
          onChange={(e) => setParticleCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Origem</label>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={origin === "center" ? "default" : "outline"}
            onClick={() => setOrigin("center")}
          >
            Centro
          </Button>
          <Button
            size="sm"
            variant={origin === "top" ? "default" : "outline"}
            onClick={() => setOrigin("top")}
          >
            Topo
          </Button>
          <Button
            size="sm"
            variant={origin === "custom" ? "default" : "outline"}
            onClick={() => setOrigin("custom")}
          >
            Posição Custom
          </Button>
        </div>
        {origin === "custom" && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs">X %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={customX}
                onChange={(e) => setCustomX(Number(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs">Y %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={customY}
                onChange={(e) => setCustomY(Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Raio de Dispersão: {spread}px
        </label>
        <input
          type="range"
          min={50}
          max={500}
          step={1}
          value={spread}
          onChange={(e) => setSpread(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Tamanho da Partícula: {particleSize}px
        </label>
        <input
          type="range"
          min={3}
          max={20}
          step={1}
          value={particleSize}
          onChange={(e) => setParticleSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Paleta de Cores</label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PALETTES).map((name) => (
            <Button
              key={name}
              size="sm"
              variant={palette === name ? "default" : "outline"}
              onClick={() => setPalette(name)}
            >
              {name}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 mt-2">
          {PALETTES[palette].map((c, idx) => (
            <div
              key={idx}
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="shape-variety"
          type="checkbox"
          checked={shapeVariety}
          onChange={(e) => setShapeVariety(e.target.checked)}
        />
        <label htmlFor="shape-variety" className="text-sm font-medium">
          Variedade de Formas
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="random-rotation"
          type="checkbox"
          checked={randomRotation}
          onChange={(e) => setRandomRotation(e.target.checked)}
        />
        <label htmlFor="random-rotation" className="text-sm font-medium">
          Rotação Aleatória
        </label>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleExplode}>Explodir Confete!</Button>
        <Button variant="outline" onClick={handleAnimateFall}>
          Animar Queda
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Limpar Confete
        </Button>
      </div>
    </div>
  );
}
