"use client";

import { useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectRaysBurstPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type RayStyle = "triangle" | "line" | "trapezoid" | "alternated";

function triangleRayPoints(
  cx: number,
  cy: number,
  angle: number,
  inner: number,
  outer: number,
  width: number,
): { x: number; y: number }[] {
  const halfW = width / 2;
  const perp = angle + Math.PI / 2;
  const baseCx = cx + Math.cos(angle) * inner;
  const baseCy = cy + Math.sin(angle) * inner;
  const tipX = cx + Math.cos(angle) * outer;
  const tipY = cy + Math.sin(angle) * outer;
  const b1x = baseCx + Math.cos(perp) * halfW;
  const b1y = baseCy + Math.sin(perp) * halfW;
  const b2x = baseCx - Math.cos(perp) * halfW;
  const b2y = baseCy - Math.sin(perp) * halfW;
  return [
    { x: tipX, y: tipY },
    { x: b1x, y: b1y },
    { x: b2x, y: b2y },
  ];
}

function trapezoidRayPoints(
  cx: number,
  cy: number,
  angle: number,
  inner: number,
  outer: number,
  baseWidth: number,
  tipWidth: number,
): { x: number; y: number }[] {
  const perp = angle + Math.PI / 2;
  const halfBase = baseWidth / 2;
  const halfTip = tipWidth / 2;
  const baseCx = cx + Math.cos(angle) * inner;
  const baseCy = cy + Math.sin(angle) * inner;
  const tipCx = cx + Math.cos(angle) * outer;
  const tipCy = cy + Math.sin(angle) * outer;
  return [
    { x: baseCx + Math.cos(perp) * halfBase, y: baseCy + Math.sin(perp) * halfBase },
    { x: tipCx + Math.cos(perp) * halfTip, y: tipCy + Math.sin(perp) * halfTip },
    { x: tipCx - Math.cos(perp) * halfTip, y: tipCy - Math.sin(perp) * halfTip },
    { x: baseCx - Math.cos(perp) * halfBase, y: baseCy - Math.sin(perp) * halfBase },
  ];
}

function getObjectCenter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
): { x: number; y: number } {
  if (obj && typeof obj.getCenterPoint === "function") {
    const c = obj.getCenterPoint();
    return { x: c.x, y: c.y };
  }
  const left = obj?.left ?? 0;
  const top = obj?.top ?? 0;
  const width = obj?.width ?? 0;
  const height = obj?.height ?? 0;
  const scaleX = obj?.scaleX ?? 1;
  const scaleY = obj?.scaleY ?? 1;
  return { x: left + (width * scaleX) / 2, y: top + (height * scaleY) / 2 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectId(obj: any): string {
  if (!obj) return "unknown";
  if (obj.id) return String(obj.id);
  if (!obj.__raysParentId) {
    obj.__raysParentId = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  return obj.__raysParentId;
}

export function ObjectRaysBurstPanel({ fabricCanvas }: ObjectRaysBurstPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [count, setCount] = useState(16);
  const [innerRadius, setInnerRadius] = useState(50);
  const [outerRadius, setOuterRadius] = useState(150);
  const [rayWidth, setRayWidth] = useState(12);
  const [color, setColor] = useState("#ffcc00");
  const [style, setStyle] = useState<RayStyle>("triangle");
  const [variation, setVariation] = useState(20);
  const [rotationOffset, setRotationOffset] = useState(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleAddBurst = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active) {
      toast.error("Selecione um objeto primeiro");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("fabric").then((m: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const center = getObjectCenter(active);
      const parentId = getObjectId(active);
      const rotationOffsetRad = (rotationOffset * Math.PI) / 180;
      const baseLength = outerRadius - innerRadius;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created: any[] = [];

      for (let i = 0; i < count; i += 1) {
        const angle = (2 * Math.PI * i) / count + rotationOffsetRad;
        const variationFactor = 1 + (Math.random() * 2 - 1) * (variation / 100);
        const rayLength = Math.max(1, baseLength * variationFactor);
        const effectiveOuter = innerRadius + rayLength;

        let currentStyle: RayStyle = style;
        if (style === "alternated") {
          currentStyle = i % 2 === 0 ? "triangle" : "line";
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let shape: any = null;

        if (currentStyle === "triangle") {
          const pts = triangleRayPoints(
            center.x,
            center.y,
            angle,
            innerRadius,
            effectiveOuter,
            rayWidth,
          );
          shape = new f.Polygon(pts, {
            fill: color,
            stroke: null,
            originX: "left",
            originY: "top",
            selectable: true,
            objectCaching: false,
          });
        } else if (currentStyle === "line") {
          const x1 = center.x + Math.cos(angle) * innerRadius;
          const y1 = center.y + Math.sin(angle) * innerRadius;
          const x2 = center.x + Math.cos(angle) * effectiveOuter;
          const y2 = center.y + Math.sin(angle) * effectiveOuter;
          shape = new f.Line([x1, y1, x2, y2], {
            stroke: color,
            strokeWidth: rayWidth,
            strokeLineCap: "round",
            selectable: true,
            objectCaching: false,
          });
        } else if (currentStyle === "trapezoid") {
          const tipWidth = Math.max(2, rayWidth * 0.4);
          const pts = trapezoidRayPoints(
            center.x,
            center.y,
            angle,
            innerRadius,
            effectiveOuter,
            rayWidth,
            tipWidth,
          );
          shape = new f.Polygon(pts, {
            fill: color,
            stroke: null,
            originX: "left",
            originY: "top",
            selectable: true,
            objectCaching: false,
          });
        }

        if (shape) {
          shape.data = { raysBurst: true, parentId };
          canvas.add(shape);
          created.push(shape);
        }
      }

      // Send burst behind original object
      created.forEach((shape) => {
        if (typeof canvas.sendBackwards === "function") {
          for (let k = 0; k < created.length + 1; k += 1) {
            canvas.sendBackwards(shape);
          }
        }
      });

      canvas.requestRenderAll();
      toast.success(`${created.length} raios adicionados`);
    });
  };

  const handleRemoveBursts = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((o: any) => o?.data?.raysBurst === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${objects.length} raios removidos`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Raios Decorativos (Burst)</h3>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Quantidade de raios: {count}
        </label>
        <input
          type="range"
          min={6}
          max={60}
          step={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Raio interno: {innerRadius}px
        </label>
        <input
          type="range"
          min={10}
          max={200}
          step={1}
          value={innerRadius}
          onChange={(e) => setInnerRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Raio externo: {outerRadius}px
        </label>
        <input
          type="range"
          min={50}
          max={400}
          step={1}
          value={outerRadius}
          onChange={(e) => setOuterRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Largura do raio: {rayWidth}px
        </label>
        <input
          type="range"
          min={4}
          max={40}
          step={1}
          value={rayWidth}
          onChange={(e) => setRayWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Cor</label>
        <div className="flex items-center gap-2">
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

      <div className="space-y-2">
        <label className="text-xs font-medium">Estilo</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={style === "triangle" ? "default" : "outline"}
            size="sm"
            onClick={() => setStyle("triangle")}
          >
            Triângulos
          </Button>
          <Button
            type="button"
            variant={style === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setStyle("line")}
          >
            Linhas
          </Button>
          <Button
            type="button"
            variant={style === "trapezoid" ? "default" : "outline"}
            size="sm"
            onClick={() => setStyle("trapezoid")}
          >
            Trapézios
          </Button>
          <Button
            type="button"
            variant={style === "alternated" ? "default" : "outline"}
            size="sm"
            onClick={() => setStyle("alternated")}
          >
            Alternados
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Variação: {variation}%
        </label>
        <input
          type="range"
          min={0}
          max={50}
          step={1}
          value={variation}
          onChange={(e) => setVariation(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Rotação: {rotationOffset}°
        </label>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={rotationOffset}
          onChange={(e) => setRotationOffset(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={handleAddBurst} className="w-full">
          Adicionar Burst
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRemoveBursts}
          className="w-full"
        >
          Remover Bursts
        </Button>
      </div>
    </div>
  );
}
