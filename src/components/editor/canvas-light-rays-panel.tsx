"use client";

import { useEffect, useRef, useState } from "react";
import { Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasLightRaysPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type OriginPosition = "top-left" | "top-right" | "top-center" | "center";

const POSITION_OPTIONS: { value: OriginPosition; label: string; icon: string }[] = [
  { value: "top-left", label: "Top-Left", icon: "↖" },
  { value: "top-right", label: "Top-Right", icon: "↗" },
  { value: "top-center", label: "Top-Center", icon: "↑" },
  { value: "center", label: "Center", icon: "⊙" },
];

function computeOrigin(
  position: OriginPosition,
  width: number,
  height: number,
): { x: number; y: number; startAngle: number } {
  switch (position) {
    case "top-left":
      return { x: 0, y: 0, startAngle: Math.PI / 4 };
    case "top-right":
      return { x: width, y: 0, startAngle: (3 * Math.PI) / 4 };
    case "top-center":
      return { x: width / 2, y: 0, startAngle: Math.PI / 2 };
    case "center":
    default:
      return { x: width / 2, y: height / 2, startAngle: 0 };
  }
}

function buildRayPoints(
  originX: number,
  originY: number,
  angle: number,
  length: number,
  thickness: number,
): { x: number; y: number }[] {
  const endX = originX + length * Math.cos(angle);
  const endY = originY + length * Math.sin(angle);
  const perpX = -Math.sin(angle) * thickness;
  const perpY = Math.cos(angle) * thickness;
  return [
    { x: originX, y: originY },
    { x: endX + perpX, y: endY + perpY },
    { x: endX - perpX, y: endY - perpY },
  ];
}

export function CanvasLightRaysPanel({ fabricCanvas }: CanvasLightRaysPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const rafHandleRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rayObjectsRef = useRef<any[]>([]);
  const animationStateRef = useRef<{ angleOffset: number; pulse: number }>({
    angleOffset: 0,
    pulse: 0,
  });

  const [position, setPosition] = useState<OriginPosition>("top-center");
  const [rayCount, setRayCount] = useState(12);
  const [rayLength, setRayLength] = useState(400);
  const [spreadAngle, setSpreadAngle] = useState(60);
  const [rayColor, setRayColor] = useState("#ffffaa");
  const [opacity, setOpacity] = useState(0.3);
  const [animated, setAnimated] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    return () => {
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }
    };
  }, []);

  const removeRays = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponivel");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((obj: any) => obj?.data?.lightRay === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((obj: any) => canvas.remove(obj));
    rayObjectsRef.current = [];
    canvas.requestRenderAll();
    if (rafHandleRef.current !== null) {
      cancelAnimationFrame(rafHandleRef.current);
      rafHandleRef.current = null;
    }
  };

  const applyRays = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponivel");
      return;
    }

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        if (!f) {
          toast.error("Fabric nao carregado");
          return;
        }

        // Remove previous rays
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = canvas.getObjects().filter((obj: any) => obj?.data?.lightRay === true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existing.forEach((obj: any) => canvas.remove(obj));

        if (rafHandleRef.current !== null) {
          cancelAnimationFrame(rafHandleRef.current);
          rafHandleRef.current = null;
        }

        const width = canvas.getWidth?.() ?? canvas.width ?? 1280;
        const height = canvas.getHeight?.() ?? canvas.height ?? 720;
        const { x: originX, y: originY, startAngle } = computeOrigin(position, width, height);
        const spreadRad = (spreadAngle * Math.PI) / 180;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const created: any[] = [];

        for (let i = 0; i < rayCount; i += 1) {
          const t = rayCount === 1 ? 0.5 : i / (rayCount - 1);
          const angle = startAngle + spreadRad * t - spreadRad / 2;
          const pts = buildRayPoints(originX, originY, angle, rayLength, 2);
          const rayOpacity = opacity * (1 - (i / rayCount) * 0.5);

          const polygon = new f.Polygon(pts, {
            fill: rayColor,
            opacity: rayOpacity,
            selectable: false,
            evented: false,
            objectCaching: false,
            originX: "left",
            originY: "top",
          });
          polygon.data = { lightRay: true, baseAngle: angle, baseOpacity: rayOpacity, index: i };
          canvas.add(polygon);
          created.push(polygon);
        }

        rayObjectsRef.current = created;
        canvas.requestRenderAll();
        toast.success(`${rayCount} raios aplicados`);

        if (animated) {
          animationStateRef.current = { angleOffset: 0, pulse: 0 };
          const step = () => {
            const c = canvasRef.current;
            if (!c) return;
            animationStateRef.current.angleOffset += 0.005 * animationSpeed;
            animationStateRef.current.pulse += 0.03 * animationSpeed;
            const offset = animationStateRef.current.angleOffset;
            const pulse = Math.sin(animationStateRef.current.pulse) * 0.15 + 1;

            rayObjectsRef.current.forEach((poly, idx) => {
              const baseAngle = poly?.data?.baseAngle ?? 0;
              const baseOpacity = poly?.data?.baseOpacity ?? opacity;
              const newAngle = baseAngle + offset;
              const newPts = buildRayPoints(originX, originY, newAngle, rayLength, 2);
              poly.set({
                points: newPts,
                opacity: Math.max(0, Math.min(1, baseOpacity * pulse)),
              });
              poly.dirty = true;
              void idx;
            });
            c.requestRenderAll();
            rafHandleRef.current = requestAnimationFrame(step);
          };
          rafHandleRef.current = requestAnimationFrame(step);
        }
      })
      .catch(() => {
        toast.error("Erro ao carregar Fabric");
      });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Raios de Luz</h3>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Origem</label>
        <div className="grid grid-cols-2 gap-2">
          {POSITION_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={position === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPosition(opt.value)}
              className="justify-start"
            >
              <span className="mr-2">{opt.icon}</span>
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex justify-between text-xs font-medium">
          <span>Quantidade de raios</span>
          <span>{rayCount}</span>
        </label>
        <input
          type="range"
          min={5}
          max={30}
          step={1}
          value={rayCount}
          onChange={(e) => setRayCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="flex justify-between text-xs font-medium">
          <span>Comprimento (px)</span>
          <span>{rayLength}</span>
        </label>
        <input
          type="range"
          min={100}
          max={800}
          step={10}
          value={rayLength}
          onChange={(e) => setRayLength(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="flex justify-between text-xs font-medium">
          <span>Angulo de dispersao</span>
          <span>{spreadAngle}&deg;</span>
        </label>
        <input
          type="range"
          min={10}
          max={180}
          step={1}
          value={spreadAngle}
          onChange={(e) => setSpreadAngle(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Cor</label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={rayColor}
            onChange={(e) => setRayColor(e.target.value)}
            className="h-9 w-16 p-1"
          />
          <Input
            type="text"
            value={rayColor}
            onChange={(e) => setRayColor(e.target.value)}
            className="h-9 flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex justify-between text-xs font-medium">
          <span>Opacidade</span>
          <span>{opacity.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="light-rays-animate"
          type="checkbox"
          checked={animated}
          onChange={(e) => setAnimated(e.target.checked)}
        />
        <label htmlFor="light-rays-animate" className="text-xs font-medium">
          Animar raios
        </label>
      </div>

      {animated && (
        <div className="space-y-2">
          <label className="flex justify-between text-xs font-medium">
            <span>Velocidade da animacao</span>
            <span>{animationSpeed.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.1}
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" onClick={applyRays} className="flex-1">
          Aplicar Raios
        </Button>
        <Button type="button" variant="outline" onClick={removeRays} className="flex-1">
          Remover Raios
        </Button>
      </div>
    </div>
  );
}
