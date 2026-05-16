"use client";

import { useEffect, useRef, useState } from "react";
import { Disc } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasSnowGlobePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

function computeGlobePosition(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  position: string,
): { x: number; y: number } {
  const w = canvas?.getWidth?.() ?? 800;
  const h = canvas?.getHeight?.() ?? 600;
  switch (position) {
    case "top-left":
      return { x: w * 0.25, y: h * 0.25 };
    case "top-right":
      return { x: w * 0.75, y: h * 0.25 };
    case "bottom-left":
      return { x: w * 0.25, y: h * 0.75 };
    case "bottom-right":
      return { x: w * 0.75, y: h * 0.75 };
    case "center":
    default:
      return { x: w * 0.5, y: h * 0.5 };
  }
}

function generateSnowParticles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  cx: number,
  cy: number,
  radius: number,
  count: number,
  color: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const particles: any[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (radius - 6);
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    const size = 1.5 + Math.random() * 2.5;
    const particle = new f.Circle({
      left: px - size,
      top: py - size,
      radius: size,
      fill: color,
      opacity: 0.7 + Math.random() * 0.3,
      selectable: false,
      evented: false,
      data: { snowGlobe: true, snowParticle: true, speed: 0.5 + Math.random() * 1.5 },
    });
    particles.push(particle);
  }
  return particles;
}

export function CanvasSnowGlobePanel({ fabricCanvas }: CanvasSnowGlobePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const animatingRef = useRef<boolean>(false);
  const speedRef = useRef<number>(2);

  const [position, setPosition] = useState<string>("center");
  const [radius, setRadius] = useState<number>(150);
  const [borderColor, setBorderColor] = useState<string>("#4a5568");
  const [borderWidth, setBorderWidth] = useState<number>(6);
  const [baseColor, setBaseColor] = useState<string>("#2d3748");
  const [showBase, setShowBase] = useState<boolean>(true);
  const [snowCount, setSnowCount] = useState<number>(30);
  const [snowColor, setSnowColor] = useState<string>("#ffffff");
  const [bgColor, setBgColor] = useState<string>("#1e3a8a");
  const [animate, setAnimate] = useState<boolean>(false);
  const [animSpeed, setAnimSpeed] = useState<number>(2);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    speedRef.current = animSpeed;
  }, [animSpeed]);

  const startAnimation = () => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas || !animatingRef.current) return;
      const objects = canvas.getObjects?.() ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const groups = objects.filter((o: any) => o?.data?.snowGlobe === true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      groups.forEach((group: any) => {
        const cx = (group.left ?? 0) + (group.width ?? 0) / 2;
        const cy = (group.top ?? 0) + (group.height ?? 0) / 2;
        const r = group.data?.globeRadius ?? 150;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = group.getObjects?.() ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items.forEach((item: any) => {
          if (item?.data?.snowParticle === true) {
            const sp = (item.data?.speed ?? 1) * speedRef.current;
            item.top = (item.top ?? 0) + sp;
            // particle local coordinates inside group: wrap when below circle
            const localCenterY = (item.top ?? 0) + (item.radius ?? 1);
            if (localCenterY > r) {
              item.top = -r - (item.radius ?? 1);
            }
            item.setCoords?.();
          }
        });
        group.dirty = true;
        // Suppress unused
        void cx;
        void cy;
      });
      canvas.requestRenderAll?.();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopAnimation = () => {
    animatingRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    if (animate) {
      startAnimation();
    } else {
      stopAnimation();
    }
    return () => {
      stopAnimation();
    };
  }, [animate]);

  useEffect(() => {
    return () => {
      animatingRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const handleCreate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      if (!f) {
        toast.error("Fabric não carregado");
        return;
      }
      const { x, y } = computeGlobePosition(canvas, position);

      // Sky circle (inside background) — slightly smaller than globe
      const skyRadius = radius - borderWidth;
      const sky = new f.Circle({
        left: -skyRadius,
        top: -skyRadius,
        radius: skyRadius,
        fill: bgColor,
        selectable: false,
        evented: false,
      });

      // Globe outline (the glass circle)
      const globe = new f.Circle({
        left: -radius,
        top: -radius,
        radius: radius,
        fill: "transparent",
        stroke: borderColor,
        strokeWidth: borderWidth,
        selectable: false,
        evented: false,
      });

      // Snow particles relative to group center (0,0)
      const particles = generateSnowParticles(f, 0, 0, skyRadius, snowCount, snowColor);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elements: any[] = [sky, ...particles, globe];

      if (showBase) {
        const baseW = radius * 1.6;
        const baseH = radius * 0.35;
        const base = new f.Rect({
          left: -baseW / 2,
          top: radius - borderWidth / 2,
          width: baseW,
          height: baseH,
          fill: baseColor,
          rx: 8,
          ry: 8,
          selectable: false,
          evented: false,
        });
        elements.push(base);
      }

      const group = new f.Group(elements, {
        left: x - radius,
        top: y - radius,
        selectable: true,
        evented: true,
        data: { snowGlobe: true, globeRadius: radius },
      });

      canvas.add(group);
      canvas.setActiveObject?.(group);
      canvas.requestRenderAll?.();
      toast.success("Globo de neve criado");
    }).catch(() => {
      toast.error("Erro ao carregar Fabric");
    });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    stopAnimation();
    queueMicrotask(() => setAnimate(false));
    const objects = canvas.getObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objects.filter((o: any) => o?.data?.snowGlobe === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove?.(o));
    canvas.requestRenderAll?.();
    toast.success("Globos removidos");
  };

  const positions: { id: string; label: string }[] = [
    { id: "top-left", label: "TL" },
    { id: "top-right", label: "TR" },
    { id: "center", label: "C" },
    { id: "bottom-left", label: "BL" },
    { id: "bottom-right", label: "BR" },
  ];

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Disc className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Globo de Neve / Cena Encapsulada</h3>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Posição do Globo</label>
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant={position === "top-left" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("top-left")}
          >
            TL
          </Button>
          <div />
          <Button
            variant={position === "top-right" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("top-right")}
          >
            TR
          </Button>
          <div />
          <Button
            variant={position === "center" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("center")}
          >
            C
          </Button>
          <div />
          <Button
            variant={position === "bottom-left" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("bottom-left")}
          >
            BL
          </Button>
          <div />
          <Button
            variant={position === "bottom-right" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("bottom-right")}
          >
            BR
          </Button>
        </div>
        {/* Hidden full list for accessibility/future use */}
        <div className="sr-only">
          {positions.map((p) => p.label).join(",")}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Raio do Círculo: {radius}px</label>
        <input
          type="range"
          min={50}
          max={300}
          step={1}
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Cor da Borda</label>
        <Input
          type="color"
          value={borderColor}
          onChange={(e) => setBorderColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Espessura da Borda: {borderWidth}px</label>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={borderWidth}
          onChange={(e) => setBorderWidth(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Cor da Base</label>
        <Input
          type="color"
          value={baseColor}
          onChange={(e) => setBaseColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={showBase}
          onChange={(e) => setShowBase(e.target.checked)}
        />
        Mostrar Base
      </label>

      <div className="space-y-1">
        <label className="text-xs font-medium">Quantidade de Neve: {snowCount}</label>
        <input
          type="range"
          min={10}
          max={80}
          step={1}
          value={snowCount}
          onChange={(e) => setSnowCount(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Cor da Neve</label>
        <Input
          type="color"
          value={snowColor}
          onChange={(e) => setSnowColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Cor do Céu (interior)</label>
        <Input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <Button onClick={handleCreate} className="w-full" size="sm">
        Criar Globo de Neve
      </Button>

      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={animate}
          onChange={(e) => setAnimate(e.target.checked)}
        />
        Animar Neve
      </label>

      <div className="space-y-1">
        <label className="text-xs font-medium">Velocidade da Animação: {animSpeed}</label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={animSpeed}
          onChange={(e) => setAnimSpeed(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <Button onClick={handleClear} variant="outline" className="w-full" size="sm">
        Limpar Globo
      </Button>
    </div>
  );
}
