"use client";

import { useEffect, useRef, useState } from "react";
import { Disc } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasBokehParticlesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

function randomPosition(
  canvasW: number,
  canvasH: number,
  distribution: string,
): { x: number; y: number } {
  if (distribution === "topo") {
    return {
      x: Math.random() * canvasW,
      y: Math.random() * (canvasH * 0.5),
    };
  }
  if (distribution === "diagonal") {
    const t = Math.random();
    const jitterX = (Math.random() - 0.5) * canvasW * 0.4;
    const jitterY = (Math.random() - 0.5) * canvasH * 0.4;
    return {
      x: t * canvasW + jitterX,
      y: t * canvasH + jitterY,
    };
  }
  // uniforme
  return {
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gradientFill(f: any, color: string, radius: number) {
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
      { offset: 0, color: color, opacity: 1 },
      { offset: 0.6, color: color, opacity: 0.4 },
      { offset: 1, color: color, opacity: 0 },
    ],
  });
}

export function CanvasBokehParticlesPanel({
  fabricCanvas,
}: CanvasBokehParticlesPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [count, setCount] = useState(50);
  const [minRadius, setMinRadius] = useState(10);
  const [maxRadius, setMaxRadius] = useState(50);
  const [color1, setColor1] = useState("#fff4cc");
  const [color2, setColor2] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.4);
  const [distribution, setDistribution] = useState("uniforme");
  const [glow, setGlow] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      canvasRef.current = fabricCanvas;
    });
  }, [fabricCanvas]);

  const handleAddBokeh = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      const canvasW = canvas.getWidth();
      const canvasH = canvas.getHeight();

      const safeMin = Math.min(minRadius, maxRadius);
      const safeMax = Math.max(minRadius, maxRadius);

      for (let i = 0; i < count; i++) {
        const pos = randomPosition(canvasW, canvasH, distribution);
        const radius = safeMin + Math.random() * (safeMax - safeMin);
        const chosenColor = Math.random() < 0.5 ? color1 : color2;
        const opacityJitter = (Math.random() - 0.5) * 0.4;
        const finalOpacity = Math.max(
          0.05,
          Math.min(1, opacity + opacityJitter),
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const circleOpts: any = {
          left: pos.x - radius,
          top: pos.y - radius,
          radius,
          opacity: finalOpacity,
          selectable: false,
          evented: false,
          data: { bokeh: true },
        };

        if (glow) {
          circleOpts.shadow = new f.Shadow({
            color: chosenColor,
            blur: radius * 0.8,
            offsetX: 0,
            offsetY: 0,
          });
        }

        const circle = new f.Circle(circleOpts);
        circle.set("fill", gradientFill(f, chosenColor, radius));
        canvas.add(circle);
      }

      canvas.renderAll();
      toast.success(`${count} partículas bokeh adicionadas`);
    });
  };

  const handleRemoveBokeh = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((obj: any) => {
      return obj.data && obj.data.bokeh === true;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((obj: any) => canvas.remove(obj));
    canvas.renderAll();
    toast.success(`${objects.length} partículas bokeh removidas`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Disc className="h-5 w-5" />
        <h3 className="text-base font-semibold">Partículas Bokeh</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Quantidade: {count}
        </label>
        <input
          type="range"
          min={10}
          max={150}
          step={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Raio mínimo: {minRadius}px
        </label>
        <input
          type="range"
          min={5}
          max={40}
          step={1}
          value={minRadius}
          onChange={(e) => setMinRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Raio máximo: {maxRadius}px
        </label>
        <input
          type="range"
          min={15}
          max={100}
          step={1}
          value={maxRadius}
          onChange={(e) => setMaxRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cor 1</label>
        <Input
          type="color"
          value={color1}
          onChange={(e) => setColor1(e.target.value)}
          className="h-10 w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cor 2</label>
        <Input
          type="color"
          value={color2}
          onChange={(e) => setColor2(e.target.value)}
          className="h-10 w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Opacidade: {opacity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.1}
          max={0.8}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Distribuição</label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={distribution === "uniforme" ? "default" : "outline"}
            size="sm"
            onClick={() => setDistribution("uniforme")}
          >
            Uniforme
          </Button>
          <Button
            type="button"
            variant={distribution === "topo" ? "default" : "outline"}
            size="sm"
            onClick={() => setDistribution("topo")}
          >
            Topo
          </Button>
          <Button
            type="button"
            variant={distribution === "diagonal" ? "default" : "outline"}
            size="sm"
            onClick={() => setDistribution("diagonal")}
          >
            Diagonal
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="bokeh-glow"
          type="checkbox"
          checked={glow}
          onChange={(e) => setGlow(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="bokeh-glow" className="text-sm font-medium">
          Brilho (glow)
        </label>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={handleAddBokeh}>
          Adicionar Bokeh
        </Button>
        <Button type="button" variant="outline" onClick={handleRemoveBokeh}>
          Remover Bokeh
        </Button>
      </div>
    </div>
  );
}
