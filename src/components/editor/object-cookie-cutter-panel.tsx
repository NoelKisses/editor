"use client";

import { useEffect, useRef, useState } from "react";
import { Scissors } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStarCutter(f: any, cx: number, cy: number, size: number, rotation: number): any {
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.4;
  const points: { x: number; y: number }[] = [];
  const numPoints = 5;
  for (let i = 0; i < numPoints * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / numPoints) * i - Math.PI / 2;
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  return new f.Polygon(points, {
    left: cx - outerRadius,
    top: cy - outerRadius,
    originX: "left",
    originY: "top",
    angle: rotation,
    absolutePositioned: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCircleCutter(f: any, cx: number, cy: number, size: number): any {
  const radius = size / 2;
  return new f.Circle({
    left: cx - radius,
    top: cy - radius,
    radius,
    originX: "left",
    originY: "top",
    absolutePositioned: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHeartCutter(f: any, cx: number, cy: number, size: number, rotation: number): any {
  const s = size / 100;
  const path = `M 50 90 C 20 70 0 50 0 30 C 0 10 15 0 30 0 C 40 0 50 10 50 20 C 50 10 60 0 70 0 C 85 0 100 10 100 30 C 100 50 80 70 50 90 Z`;
  const heart = new f.Path(path, {
    left: cx - 50 * s,
    top: cy - 45 * s,
    originX: "left",
    originY: "top",
    scaleX: s,
    scaleY: s,
    angle: rotation,
    absolutePositioned: true,
  });
  return heart;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDiamondCutter(f: any, cx: number, cy: number, size: number, rotation: number): any {
  const half = size / 2;
  const points = [
    { x: cx, y: cy - half },
    { x: cx + half, y: cy },
    { x: cx, y: cy + half },
    { x: cx - half, y: cy },
  ];
  return new f.Polygon(points, {
    left: cx - half,
    top: cy - half,
    originX: "left",
    originY: "top",
    angle: rotation,
    absolutePositioned: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHexagonCutter(f: any, cx: number, cy: number, size: number, rotation: number): any {
  const radius = size / 2;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return new f.Polygon(points, {
    left: cx - radius,
    top: cy - radius,
    originX: "left",
    originY: "top",
    angle: rotation,
    absolutePositioned: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCrossCutter(f: any, cx: number, cy: number, size: number, rotation: number): any {
  const half = size / 2;
  const third = size / 6;
  const points = [
    { x: cx - third, y: cy - half },
    { x: cx + third, y: cy - half },
    { x: cx + third, y: cy - third },
    { x: cx + half, y: cy - third },
    { x: cx + half, y: cy + third },
    { x: cx + third, y: cy + third },
    { x: cx + third, y: cy + half },
    { x: cx - third, y: cy + half },
    { x: cx - third, y: cy + third },
    { x: cx - half, y: cy + third },
    { x: cx - half, y: cy - third },
    { x: cx - third, y: cy - third },
  ];
  return new f.Polygon(points, {
    left: cx - half,
    top: cy - half,
    originX: "left",
    originY: "top",
    angle: rotation,
    absolutePositioned: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTriangleCutter(f: any, cx: number, cy: number, size: number, rotation: number): any {
  const half = size / 2;
  return new f.Triangle({
    left: cx - half,
    top: cy - half,
    width: size,
    height: size,
    originX: "left",
    originY: "top",
    angle: rotation,
    absolutePositioned: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWaveCutter(f: any, cx: number, cy: number, size: number): any {
  const half = size / 2;
  const waves = 4;
  const waveHeight = size / 10;
  const step = size / (waves * 2);
  const points: { x: number; y: number }[] = [];

  // Top wavy edge
  points.push({ x: cx - half, y: cy - half });
  for (let i = 0; i <= waves * 2; i++) {
    const x = cx - half + i * step;
    const y = cy - half + (i % 2 === 0 ? 0 : -waveHeight);
    points.push({ x, y });
  }
  points.push({ x: cx + half, y: cy - half });
  // Right side
  points.push({ x: cx + half, y: cy + half });
  // Bottom wavy edge
  for (let i = waves * 2; i >= 0; i--) {
    const x = cx - half + i * step;
    const y = cy + half + (i % 2 === 0 ? 0 : waveHeight);
    points.push({ x, y });
  }
  points.push({ x: cx - half, y: cy + half });

  return new f.Polygon(points, {
    left: cx - half,
    top: cy - half,
    originX: "left",
    originY: "top",
    absolutePositioned: true,
  });
}

type ShapeKey =
  | "star"
  | "circle"
  | "heart"
  | "diamond"
  | "hexagon"
  | "cross"
  | "triangle"
  | "wave";

const SHAPES: { key: ShapeKey; label: string }[] = [
  { key: "star", label: "Estrela" },
  { key: "circle", label: "Círculo" },
  { key: "heart", label: "Coração" },
  { key: "diamond", label: "Diamante" },
  { key: "hexagon", label: "Hexágono" },
  { key: "cross", label: "Cruz" },
  { key: "triangle", label: "Triângulo" },
  { key: "wave", label: "Onda" },
];

type CutMode = "keep" | "remove";

interface ObjectCookieCutterPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function ObjectCookieCutterPanel({ fabricCanvas }: ObjectCookieCutterPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [shape, setShape] = useState<ShapeKey>("star");
  const [cutMode, setCutMode] = useState<CutMode>("keep");
  const [size, setSize] = useState<number>(150);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const bounds = obj.getBoundingRect ? obj.getBoundingRect() : null;
    if (bounds) {
      queueMicrotask(() => {
        setPosX(Math.round(bounds.left + bounds.width / 2));
        setPosY(Math.round(bounds.top + bounds.height / 2));
      });
    }
  }, [fabricCanvas]);

  const centerOnObject = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const obj = canvas.getActiveObject();
    if (!obj) {
      toast.error("Selecione um objeto primeiro");
      return;
    }
    const bounds = obj.getBoundingRect();
    setPosX(Math.round(bounds.left + bounds.width / 2));
    setPosY(Math.round(bounds.top + bounds.height / 2));
    toast.success("Centralizado no objeto");
  };

  const applyCut = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const obj = canvas.getActiveObject();
    if (!obj) {
      toast.error("Selecione um objeto primeiro");
      return;
    }
    if (!["image", "rect", "group"].includes(obj.type)) {
      toast.error("Tipo de objeto não suportado");
      return;
    }

    const bounds = obj.getBoundingRect();
    const cutterSize = (Math.min(bounds.width, bounds.height) * size) / 100;

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let clip: any = null;

      switch (shape) {
        case "star":
          clip = buildStarCutter(f, posX, posY, cutterSize, rotation);
          break;
        case "circle":
          clip = buildCircleCutter(f, posX, posY, cutterSize);
          break;
        case "heart":
          clip = buildHeartCutter(f, posX, posY, cutterSize, rotation);
          break;
        case "diamond":
          clip = buildDiamondCutter(f, posX, posY, cutterSize, rotation);
          break;
        case "hexagon":
          clip = buildHexagonCutter(f, posX, posY, cutterSize, rotation);
          break;
        case "cross":
          clip = buildCrossCutter(f, posX, posY, cutterSize, rotation);
          break;
        case "triangle":
          clip = buildTriangleCutter(f, posX, posY, cutterSize, rotation);
          break;
        case "wave":
          clip = buildWaveCutter(f, posX, posY, cutterSize);
          break;
      }

      if (!clip) {
        toast.error("Falha ao criar cortador");
        return;
      }

      clip.absolutePositioned = true;
      if (cutMode === "remove") {
        clip.inverted = true;
      }

      obj.clipPath = clip;
      obj.data = { ...(obj.data || {}), cookieCut: true };
      canvas.requestRenderAll();
      toast.success("Corte aplicado");
    }).catch(() => {
      toast.error("Erro ao carregar Fabric.js");
    });
  };

  const restore = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const obj = canvas.getActiveObject();
    if (!obj) {
      toast.error("Selecione um objeto primeiro");
      return;
    }
    obj.clipPath = null;
    if (obj.data) {
      obj.data = { ...obj.data, cookieCut: false };
    }
    canvas.requestRenderAll();
    toast.success("Forma original restaurada");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Scissors className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Cortador de Cookies (Boolean)</h3>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Forma do Cortador</span>
        <div className="grid grid-cols-2 gap-2">
          {SHAPES.map((s) => (
            <Button
              key={s.key}
              variant={shape === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => setShape(s.key)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Modo de Corte</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={cutMode === "keep" ? "default" : "outline"}
            size="sm"
            onClick={() => setCutMode("keep")}
          >
            Manter Forma
          </Button>
          <Button
            variant={cutMode === "remove" ? "default" : "outline"}
            size="sm"
            onClick={() => setCutMode("remove")}
          >
            Remover Forma
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="cutter-size">
          Tamanho do Cortador: {size}%
        </label>
        <input
          id="cutter-size"
          type="range"
          min={50}
          max={300}
          step={1}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Posição</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="pos-x">X</label>
            <Input
              id="pos-x"
              type="number"
              value={posX}
              onChange={(e) => setPosX(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="pos-y">Y</label>
            <Input
              id="pos-y"
              type="number"
              value={posY}
              onChange={(e) => setPosY(Number(e.target.value))}
            />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={centerOnObject} className="w-full">
          Centralizar no Objeto
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="cutter-rotation">
          Rotação: {rotation}°
        </label>
        <input
          id="cutter-rotation"
          type="range"
          min={0}
          max={360}
          step={1}
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2 pt-2">
        <Button onClick={applyCut} className="w-full" size="sm">
          Aplicar Corte
        </Button>
        <Button onClick={restore} variant="outline" className="w-full" size="sm">
          Restaurar
        </Button>
      </div>
    </div>
  );
}
