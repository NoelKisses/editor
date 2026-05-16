"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasCelebrationFireworksPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type FireworkType = "radial" | "waterfall" | "star" | "multi";
type OriginPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

function computeOrigin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  position: string
): { x: number; y: number } {
  if (!canvas) return { x: 0, y: 0 };
  const w = typeof canvas.getWidth === "function" ? canvas.getWidth() : 800;
  const h = typeof canvas.getHeight === "function" ? canvas.getHeight() : 600;
  const margin = 40;
  switch (position) {
    case "top-left":
      return { x: margin, y: margin };
    case "top-right":
      return { x: w - margin, y: margin };
    case "bottom-left":
      return { x: margin, y: h - margin };
    case "bottom-right":
      return { x: w - margin, y: h - margin };
    case "center":
    default:
      return { x: w / 2, y: h / 2 };
  }
}

function buildStarPolygon(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  cx: number,
  cy: number,
  points: number,
  outerR: number,
  innerR: number,
  color: string
) {
  const coords: { x: number; y: number }[] = [];
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    coords.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return new f.Polygon(coords, {
    left: cx,
    top: cy,
    fill: color,
    originX: "center",
    originY: "center",
    selectable: true,
  });
}

export function CanvasCelebrationFireworksPanel({
  fabricCanvas,
}: CanvasCelebrationFireworksPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);

  const [type, setType] = useState<FireworkType>("radial");
  const [position, setPosition] = useState<OriginPosition>("center");
  const [color, setColor] = useState("#ffd700");
  const [secondaryColor, setSecondaryColor] = useState("#ff6600");
  const [particleCount, setParticleCount] = useState(30);
  const [reachRadius, setReachRadius] = useState(200);
  const [particleSize, setParticleSize] = useState(4);
  const [animate, setAnimate] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(5);

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

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      toast.info("Animação interrompida");
    }
  };

  const clearFireworks = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = (canvas.getObjects() as any[]) || [];
    const toRemove = objects.filter((o) => o?.data?.firework === true);
    toRemove.forEach((o) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${toRemove.length} elemento(s) removido(s)`);
  };

  const launchFireworks = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      if (!f) {
        toast.error("Fabric não pôde ser carregado");
        return;
      }

      const origin = computeOrigin(canvas, position);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created: any[] = [];

      if (type === "radial") {
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.2;
          const distance = reachRadius * (0.7 + Math.random() * 0.3);
          const useSecondary = Math.random() > 0.5;
          const p = new f.Circle({
            left: origin.x,
            top: origin.y,
            radius: particleSize,
            fill: useSecondary ? secondaryColor : color,
            originX: "center",
            originY: "center",
            selectable: true,
            opacity: 1,
          });
          p.data = {
            firework: true,
            angle,
            distance,
            startX: origin.x,
            startY: origin.y,
          };
          canvas.add(p);
          created.push(p);
        }
      } else if (type === "waterfall") {
        for (let i = 0; i < particleCount; i++) {
          const spreadX = (Math.random() - 0.5) * reachRadius;
          const distance = reachRadius * (0.5 + Math.random() * 0.5);
          const useSecondary = Math.random() > 0.5;
          const p = new f.Circle({
            left: origin.x + spreadX,
            top: origin.y,
            radius: particleSize,
            fill: useSecondary ? secondaryColor : color,
            originX: "center",
            originY: "center",
            selectable: true,
            opacity: 1,
          });
          // angle pointing down with slight spread
          const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
          p.data = {
            firework: true,
            angle,
            distance,
            startX: origin.x + spreadX,
            startY: origin.y,
          };
          canvas.add(p);
          created.push(p);
        }
      } else if (type === "star") {
        const star = buildStarPolygon(
          f,
          origin.x,
          origin.y,
          5,
          reachRadius / 4,
          reachRadius / 9,
          color
        );
        star.data = {
          firework: true,
          angle: 0,
          distance: 0,
          startX: origin.x,
          startY: origin.y,
        };
        canvas.add(star);
        created.push(star);

        const rayCount = 8;
        for (let i = 0; i < rayCount; i++) {
          const angle = (Math.PI * 2 * i) / rayCount;
          const len = reachRadius / 2;
          const x2 = origin.x + Math.cos(angle) * len;
          const y2 = origin.y + Math.sin(angle) * len;
          const ray = new f.Line(
            [origin.x, origin.y, x2, y2],
            {
              stroke: secondaryColor,
              strokeWidth: 2,
              selectable: true,
              opacity: 1,
            }
          );
          ray.data = {
            firework: true,
            angle,
            distance: len,
            startX: origin.x,
            startY: origin.y,
          };
          canvas.add(ray);
          created.push(ray);
        }
      } else if (type === "multi") {
        const w = typeof canvas.getWidth === "function" ? canvas.getWidth() : 800;
        const h = typeof canvas.getHeight === "function" ? canvas.getHeight() : 600;
        const positions = [
          { x: w * 0.25, y: h * 0.35 },
          { x: w * 0.5, y: h * 0.25 },
          { x: w * 0.75, y: h * 0.4 },
        ];
        const perBurst = Math.max(5, Math.floor(particleCount / 3));
        const smallReach = reachRadius * 0.5;
        positions.forEach((pos, idx) => {
          for (let i = 0; i < perBurst; i++) {
            const angle = (Math.PI * 2 * i) / perBurst + (Math.random() - 0.5) * 0.2;
            const distance = smallReach * (0.7 + Math.random() * 0.3);
            const useSecondary = idx % 2 === 1;
            const p = new f.Circle({
              left: pos.x,
              top: pos.y,
              radius: particleSize,
              fill: useSecondary ? secondaryColor : color,
              originX: "center",
              originY: "center",
              selectable: true,
              opacity: 1,
            });
            p.data = {
              firework: true,
              angle,
              distance,
              startX: pos.x,
              startY: pos.y,
            };
            canvas.add(p);
            created.push(p);
          }
        });
      }

      canvas.requestRenderAll();

      if (animate && created.length > 0) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        const baseDuration = 1000;
        const speedFactor = Math.max(0.2, animationSpeed / 5);
        const duration = baseDuration / speedFactor;
        const startTime = performance.now();

        const step = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);

          created.forEach((obj) => {
            const data = obj.data || {};
            const angle: number = data.angle ?? 0;
            const distance: number = data.distance ?? 0;
            const sx: number = data.startX ?? 0;
            const sy: number = data.startY ?? 0;

            if (typeof obj.set === "function") {
              if (obj.type === "line") {
                // For lines, move endpoint outward
                const nx2 = sx + Math.cos(angle) * distance * progress;
                const ny2 = sy + Math.sin(angle) * distance * progress;
                obj.set({ x2: nx2, y2: ny2, opacity: 1 - progress * 0.8 });
              } else {
                const nx = sx + Math.cos(angle) * distance * progress;
                const ny = sy + Math.sin(angle) * distance * progress;
                obj.set({
                  left: nx,
                  top: ny,
                  opacity: 1 - progress * 0.9,
                });
              }
              if (typeof obj.setCoords === "function") obj.setCoords();
            }
          });

          canvas.requestRenderAll();

          if (progress < 1) {
            rafRef.current = requestAnimationFrame(step);
          } else {
            rafRef.current = null;
            queueMicrotask(() => {
              toast.success("Animação concluída");
            });
          }
        };

        rafRef.current = requestAnimationFrame(step);
      }

      queueMicrotask(() => {
        toast.success(`${created.length} elemento(s) disparado(s)`);
      });
    }).catch(() => {
      toast.error("Erro ao carregar fabric");
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        <h3 className="text-base font-semibold">Fogos & Celebração</h3>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Tipo de Fogo</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={type === "radial" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("radial")}
          >
            Explosão Radial
          </Button>
          <Button
            variant={type === "waterfall" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("waterfall")}
          >
            Cachoeira
          </Button>
          <Button
            variant={type === "star" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("star")}
          >
            Estrela Brilhante
          </Button>
          <Button
            variant={type === "multi" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("multi")}
          >
            Faísca Múltipla
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Posição de Origem</span>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={position === "top-left" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("top-left")}
          >
            ↖
          </Button>
          <div />
          <Button
            variant={position === "top-right" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("top-right")}
          >
            ↗
          </Button>
          <div />
          <Button
            variant={position === "center" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("center")}
          >
            ●
          </Button>
          <div />
          <Button
            variant={position === "bottom-left" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("bottom-left")}
          >
            ↙
          </Button>
          <div />
          <Button
            variant={position === "bottom-right" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("bottom-right")}
          >
            ↘
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-sm font-medium">Cor Primária</span>
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-full p-1"
          />
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium">Cor Secundária</span>
          <Input
            type="color"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            className="h-10 w-full p-1"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quantidade de Partículas</span>
          <span className="text-xs text-muted-foreground">{particleCount}</span>
        </div>
        <input
          type="range"
          min={10}
          max={80}
          step={1}
          value={particleCount}
          onChange={(e) => setParticleCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Raio de Alcance</span>
          <span className="text-xs text-muted-foreground">{reachRadius}px</span>
        </div>
        <input
          type="range"
          min={50}
          max={400}
          step={1}
          value={reachRadius}
          onChange={(e) => setReachRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tamanho da Partícula</span>
          <span className="text-xs text-muted-foreground">{particleSize}px</span>
        </div>
        <input
          type="range"
          min={2}
          max={10}
          step={1}
          value={particleSize}
          onChange={(e) => setParticleSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="animate-fireworks"
          checked={animate}
          onChange={(e) => setAnimate(e.target.checked)}
        />
        <label htmlFor="animate-fireworks" className="text-sm font-medium">
          Animar Explosão
        </label>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Velocidade da Animação</span>
          <span className="text-xs text-muted-foreground">{animationSpeed}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(Number(e.target.value))}
          className="w-full"
          disabled={!animate}
        />
      </div>

      <div className="space-y-2 pt-2">
        <Button className="w-full" onClick={launchFireworks}>
          Disparar Fogos
        </Button>
        <Button className="w-full" variant="outline" onClick={stopAnimation}>
          Parar Animação
        </Button>
        <Button className="w-full" variant="outline" onClick={clearFireworks}>
          Limpar Fogos
        </Button>
      </div>
    </div>
  );
}
