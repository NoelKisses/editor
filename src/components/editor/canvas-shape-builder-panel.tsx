"use client";

import { useEffect, useRef, useState } from "react";
import { Shapes } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasShapeBuilderPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type ShapeId =
  | "star5"
  | "star6"
  | "hexagon"
  | "octagon"
  | "heart"
  | "arrowRight"
  | "arrowUp"
  | "lightning"
  | "diamond"
  | "pentagon"
  | "cross"
  | "stamp";

interface ShapeOption {
  id: ShapeId;
  label: string;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { id: "star5", label: "Estrela 5pts" },
  { id: "star6", label: "Estrela 6pts" },
  { id: "hexagon", label: "Hexágono" },
  { id: "octagon", label: "Octógono" },
  { id: "heart", label: "Coração" },
  { id: "arrowRight", label: "Seta →" },
  { id: "arrowUp", label: "Seta ↑" },
  { id: "lightning", label: "Raio" },
  { id: "diamond", label: "Diamante" },
  { id: "pentagon", label: "Pentágono" },
  { id: "cross", label: "Cruz" },
  { id: "stamp", label: "Selo" },
];

// Module-level pure helpers
function starPoints(
  numPoints: number,
  outerR: number,
  innerR: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const step = Math.PI / numPoints;
  for (let i = 0; i < numPoints * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  return points;
}

function regularPolygonPoints(
  sides: number,
  radius: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const step = (2 * Math.PI) / sides;
  for (let i = 0; i < sides; i++) {
    const angle = i * step - Math.PI / 2;
    points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  }
  return points;
}

function serratedCirclePoints(
  teeth: number,
  outerR: number,
  innerR: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const total = teeth * 2;
  const step = (2 * Math.PI) / total;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  return points;
}

function diamondPoints(radius: number): Array<{ x: number; y: number }> {
  return [
    { x: 0, y: -radius },
    { x: radius, y: 0 },
    { x: 0, y: radius },
    { x: -radius, y: 0 },
  ];
}

// Path strings (designed in a 100x100 box, centered approximations)
const HEART_PATH =
  "M 50 90 C 20 65, 0 45, 0 25 C 0 10, 12 0, 25 0 C 35 0, 45 6, 50 18 C 55 6, 65 0, 75 0 C 88 0, 100 10, 100 25 C 100 45, 80 65, 50 90 Z";
const ARROW_RIGHT_PATH =
  "M 0 35 L 60 35 L 60 15 L 100 50 L 60 85 L 60 65 L 0 65 Z";
const ARROW_UP_PATH =
  "M 35 100 L 35 40 L 15 40 L 50 0 L 85 40 L 65 40 L 65 100 Z";
const LIGHTNING_PATH = "M 55 0 L 15 55 L 45 55 L 35 100 L 85 40 L 55 40 L 70 0 Z";
const CROSS_PATH =
  "M 35 0 L 65 0 L 65 35 L 100 35 L 100 65 L 65 65 L 65 100 L 35 100 L 35 65 L 0 65 L 0 35 L 35 35 Z";

function getShapeFactory(id: ShapeId) {
  return id;
}

export function CanvasShapeBuilderPanel({
  fabricCanvas,
}: CanvasShapeBuilderPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedShape, setSelectedShape] = useState<ShapeId>("star5");
  const [fillColor, setFillColor] = useState<string>("#3b82f6");
  const [strokeColor, setStrokeColor] = useState<string>("#1e40af");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [size, setSize] = useState<number>(150);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleInsert = () => {
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

        const centerX = canvas.getWidth() / 2;
        const centerY = canvas.getHeight() / 2;
        const scale = size / 100;
        const radius = size / 2;

        const baseOptions = {
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center",
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let shape: any = null;

        switch (getShapeFactory(selectedShape)) {
          case "star5":
            shape = new f.Polygon(
              starPoints(5, radius, radius * 0.4),
              baseOptions,
            );
            break;
          case "star6":
            shape = new f.Polygon(
              starPoints(6, radius, radius * 0.5),
              baseOptions,
            );
            break;
          case "hexagon":
            shape = new f.Polygon(regularPolygonPoints(6, radius), baseOptions);
            break;
          case "octagon":
            shape = new f.Polygon(regularPolygonPoints(8, radius), baseOptions);
            break;
          case "pentagon":
            shape = new f.Polygon(regularPolygonPoints(5, radius), baseOptions);
            break;
          case "diamond":
            shape = new f.Polygon(diamondPoints(radius), baseOptions);
            break;
          case "stamp":
            shape = new f.Polygon(
              serratedCirclePoints(16, radius, radius * 0.85),
              baseOptions,
            );
            break;
          case "heart":
            shape = new f.Path(HEART_PATH, {
              ...baseOptions,
              scaleX: scale,
              scaleY: scale,
            });
            break;
          case "arrowRight":
            shape = new f.Path(ARROW_RIGHT_PATH, {
              ...baseOptions,
              scaleX: scale,
              scaleY: scale,
            });
            break;
          case "arrowUp":
            shape = new f.Path(ARROW_UP_PATH, {
              ...baseOptions,
              scaleX: scale,
              scaleY: scale,
            });
            break;
          case "lightning":
            shape = new f.Path(LIGHTNING_PATH, {
              ...baseOptions,
              scaleX: scale,
              scaleY: scale,
            });
            break;
          case "cross":
            shape = new f.Path(CROSS_PATH, {
              ...baseOptions,
              scaleX: scale,
              scaleY: scale,
            });
            break;
          default:
            shape = null;
        }

        if (!shape) {
          toast.error("Forma inválida");
          return;
        }

        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.requestRenderAll();
        toast.success("Forma inserida");
      })
      .catch(() => {
        toast.error("Erro ao carregar fabric");
      });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Shapes className="h-5 w-5" />
        <h3 className="text-base font-semibold">Construtor de Formas</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SHAPE_OPTIONS.map((opt) => (
          <Button
            key={opt.id}
            type="button"
            variant={selectedShape === opt.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedShape(opt.id)}
            className="text-xs"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">Cor de preenchimento</span>
          <Input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="h-8 w-16 p-1"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">Cor da borda</span>
          <Input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="h-8 w-16 p-1"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">Espessura da borda</span>
            <span className="text-xs text-muted-foreground">{strokeWidth}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">Tamanho</span>
            <span className="text-xs text-muted-foreground">{size}</span>
          </div>
          <input
            type="range"
            min={50}
            max={300}
            step={1}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <Button type="button" onClick={handleInsert} className="w-full">
        Inserir Forma
      </Button>
    </div>
  );
}
