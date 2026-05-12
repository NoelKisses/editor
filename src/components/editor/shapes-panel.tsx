"use client";

import { useCallback } from "react";
import { toast } from "sonner";

interface ShapesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const SHAPES = [
  {
    id: "rect",
    label: "Retângulo",
    svg: (
      <svg viewBox="0 0 40 30" className="w-full h-full">
        <rect x="2" y="2" width="36" height="26" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "square",
    label: "Quadrado",
    svg: (
      <svg viewBox="0 0 30 30" className="w-full h-full">
        <rect x="2" y="2" width="26" height="26" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "circle",
    label: "Círculo",
    svg: (
      <svg viewBox="0 0 30 30" className="w-full h-full">
        <circle cx="15" cy="15" r="13" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "ellipse",
    label: "Elipse",
    svg: (
      <svg viewBox="0 0 40 28" className="w-full h-full">
        <ellipse cx="20" cy="14" rx="18" ry="12" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "triangle",
    label: "Triângulo",
    svg: (
      <svg viewBox="0 0 30 28" className="w-full h-full">
        <polygon points="15,2 28,26 2,26" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "triangle-down",
    label: "Triângulo ▼",
    svg: (
      <svg viewBox="0 0 30 28" className="w-full h-full">
        <polygon points="2,2 28,2 15,26" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "star",
    label: "Estrela",
    svg: (
      <svg viewBox="0 0 30 30" className="w-full h-full">
        <polygon
          points="15,2 18.5,11 28,11 20.5,16.5 23.5,26 15,21 6.5,26 9.5,16.5 2,11 11.5,11"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "diamond",
    label: "Losango",
    svg: (
      <svg viewBox="0 0 30 30" className="w-full h-full">
        <polygon points="15,2 28,15 15,28 2,15" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "hexagon",
    label: "Hexágono",
    svg: (
      <svg viewBox="0 0 30 30" className="w-full h-full">
        <polygon points="15,2 27,8.5 27,21.5 15,28 3,21.5 3,8.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "line",
    label: "Linha",
    svg: (
      <svg viewBox="0 0 40 10" className="w-full h-full">
        <line x1="2" y1="5" x2="38" y2="5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "arrow-right",
    label: "Seta →",
    svg: (
      <svg viewBox="0 0 40 14" className="w-full h-full">
        <line x1="2" y1="7" x2="30" y2="7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <polyline points="22,2 32,7 22,12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "arrow-double",
    label: "Seta ↔",
    svg: (
      <svg viewBox="0 0 40 14" className="w-full h-full">
        <line x1="8" y1="7" x2="32" y2="7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <polyline points="16,2 6,7 16,12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="24,2 34,7 24,12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const STAR_POINTS = (cx: number, cy: number, outerR: number, innerR: number, points: number) => {
  const pts: number[][] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts.flat();
};

export function ShapesPanel({ fabricCanvas }: ShapesPanelProps) {
  const addShape = useCallback(
    async (shapeId: string) => {
      if (!fabricCanvas) return;
      const { fabric } = await import("fabric");

      const cx = fabricCanvas.getWidth() / 2;
      const cy = fabricCanvas.getHeight() / 2;
      const fill = "#6366f1";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let shape: any;

      switch (shapeId) {
        case "rect":
          shape = new fabric.Rect({ left: cx - 100, top: cy - 60, width: 200, height: 120, fill, rx: 4, ry: 4 });
          break;
        case "square":
          shape = new fabric.Rect({ left: cx - 70, top: cy - 70, width: 140, height: 140, fill, rx: 4, ry: 4 });
          break;
        case "circle":
          shape = new fabric.Circle({ left: cx - 70, top: cy - 70, radius: 70, fill });
          break;
        case "ellipse":
          shape = new fabric.Ellipse({ left: cx - 110, top: cy - 60, rx: 110, ry: 60, fill });
          break;
        case "triangle":
          shape = new fabric.Triangle({ left: cx - 70, top: cy - 70, width: 140, height: 140, fill });
          break;
        case "triangle-down": {
          const pts = [{ x: 0, y: 0 }, { x: 140, y: 0 }, { x: 70, y: 140 }];
          shape = new fabric.Polygon(pts, { left: cx - 70, top: cy - 70, fill });
          break;
        }
        case "star": {
          const starPts = STAR_POINTS(0, 0, 70, 30, 5);
          const pts = [];
          for (let i = 0; i < starPts.length; i += 2) pts.push({ x: starPts[i], y: starPts[i + 1] });
          shape = new fabric.Polygon(pts, { left: cx - 70, top: cy - 70, fill });
          break;
        }
        case "diamond": {
          const pts = [{ x: 70, y: 0 }, { x: 140, y: 70 }, { x: 70, y: 140 }, { x: 0, y: 70 }];
          shape = new fabric.Polygon(pts, { left: cx - 70, top: cy - 70, fill });
          break;
        }
        case "hexagon": {
          const pts = [];
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3 - Math.PI / 6;
            pts.push({ x: 70 + 70 * Math.cos(a), y: 70 + 70 * Math.sin(a) });
          }
          shape = new fabric.Polygon(pts, { left: cx - 70, top: cy - 70, fill });
          break;
        }
        case "line":
          shape = new fabric.Line([0, 0, 200, 0], {
            left: cx - 100, top: cy,
            stroke: fill, strokeWidth: 4, strokeLineCap: "round",
          });
          break;
        case "arrow-right": {
          const group = [
            new fabric.Line([0, 5, 160, 5], { stroke: fill, strokeWidth: 4, strokeLineCap: "round" }),
            new fabric.Triangle({ left: 140, top: -4, width: 24, height: 24, fill, angle: 90 }),
          ];
          shape = new fabric.Group(group, { left: cx - 90, top: cy - 12 });
          break;
        }
        case "arrow-double": {
          const group = [
            new fabric.Line([20, 5, 160, 5], { stroke: fill, strokeWidth: 4, strokeLineCap: "round" }),
            new fabric.Triangle({ left: 140, top: -4, width: 24, height: 24, fill, angle: 90 }),
            new fabric.Triangle({ left: 16, top: -4, width: 24, height: 24, fill, angle: -90 }),
          ];
          shape = new fabric.Group(group, { left: cx - 90, top: cy - 12 });
          break;
        }
        default:
          return;
      }

      fabricCanvas.add(shape);
      fabricCanvas.setActiveObject(shape);
      fabricCanvas.requestRenderAll();
      toast.success(`${SHAPES.find((s) => s.id === shapeId)?.label ?? "Forma"} adicionada`);
    },
    [fabricCanvas]
  );

  return (
    <div className="flex flex-col gap-3 pt-2">
      <h3 className="text-sm font-semibold text-foreground">Formas</h3>
      <div className="grid grid-cols-3 gap-2">
        {SHAPES.map((shape) => (
          <button
            key={shape.id}
            onClick={() => addShape(shape.id)}
            disabled={!fabricCanvas}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-foreground/70 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title={shape.label}
          >
            <div className="w-8 h-8 flex items-center justify-center">{shape.svg}</div>
            <span className="text-[10px] text-center leading-tight">{shape.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
