"use client";

import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectTrailMotionPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type TrailStyle = "Linhas" | "Manchas" | "Setas" | "Velocidade";

function directionVector(dir: string): { dx: number; dy: number } {
  const inv = 1 / Math.sqrt(2);
  switch (dir) {
    case "N":
      return { dx: 0, dy: -1 };
    case "NE":
      return { dx: inv, dy: -inv };
    case "E":
      return { dx: 1, dy: 0 };
    case "SE":
      return { dx: inv, dy: inv };
    case "S":
      return { dx: 0, dy: 1 };
    case "SW":
      return { dx: -inv, dy: inv };
    case "W":
      return { dx: -1, dy: 0 };
    case "NW":
      return { dx: -inv, dy: -inv };
    default:
      return { dx: 0, dy: 0 };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function objectColor(obj: any): string {
  if (!obj) return "#3b82f6";
  if (typeof obj.fill === "string" && obj.fill) return obj.fill;
  if (typeof obj.stroke === "string" && obj.stroke) return obj.stroke;
  return "#3b82f6";
}

const DIRECTIONS: (string | null)[] = [
  "NW",
  "N",
  "NE",
  "W",
  null,
  "E",
  "SW",
  "S",
  "SE",
];

export function ObjectTrailMotionPanel({ fabricCanvas }: ObjectTrailMotionPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [style, setStyle] = useState<TrailStyle>("Linhas");
  const [direction, setDirection] = useState<string>("W");
  const [length, setLength] = useState<number>(8);
  const [spacing, setSpacing] = useState<number>(15);
  const [opacityFade, setOpacityFade] = useState<number>(0.5);
  const [colorFollow, setColorFollow] = useState<boolean>(true);
  const [customColor, setCustomColor] = useState<string>("#3b82f6");
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
    if (!fabricCanvas) return;

    const update = () => {
      const obj = fabricCanvas.getActiveObject?.();
      queueMicrotask(() => setHasSelection(!!obj));
    };

    update();
    fabricCanvas.on?.("selection:created", update);
    fabricCanvas.on?.("selection:updated", update);
    fabricCanvas.on?.("selection:cleared", update);

    return () => {
      fabricCanvas.off?.("selection:created", update);
      fabricCanvas.off?.("selection:updated", update);
      fabricCanvas.off?.("selection:cleared", update);
    };
  }, [fabricCanvas]);

  const applyTrail = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const obj = canvas.getActiveObject?.();
    if (!obj) {
      toast.error("Selecione um objeto primeiro");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      if (!f) {
        toast.error("Fabric não disponível");
        return;
      }

      const { dx, dy } = directionVector(direction);
      const objX = obj.left ?? 0;
      const objY = obj.top ?? 0;
      const objW = (obj.width ?? 40) * (obj.scaleX ?? 1);
      const objH = (obj.height ?? 40) * (obj.scaleY ?? 1);
      const baseColor = colorFollow ? objectColor(obj) : customColor;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parentId = (obj as any).id ?? `obj-${Date.now()}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).id = parentId;

      for (let i = 1; i <= length; i++) {
        const x = objX - dx * spacing * i;
        const y = objY - dy * spacing * i;
        const op = Math.max(0.02, 1 - (i / length) * (1 - opacityFade));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let segment: any = null;

        if (style === "Linhas") {
          const len = Math.max(objW, objH) * 0.6;
          const x2 = x + dx * len * 0.5;
          const y2 = y + dy * len * 0.5;
          segment = new f.Line([x, y, x2, y2], {
            stroke: baseColor,
            strokeWidth: 2,
            opacity: op,
            selectable: false,
            evented: false,
          });
        } else if (style === "Manchas") {
          const radius = Math.max(4, Math.min(objW, objH) * 0.25);
          segment = new f.Circle({
            left: x,
            top: y,
            radius,
            fill: baseColor,
            opacity: op,
            selectable: false,
            evented: false,
          });
        } else if (style === "Setas") {
          const size = Math.max(6, Math.min(objW, objH) * 0.3);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          segment = new f.Polygon(
            [
              { x: 0, y: -size / 2 },
              { x: size, y: 0 },
              { x: 0, y: size / 2 },
            ],
            {
              left: x,
              top: y,
              fill: baseColor,
              opacity: op,
              angle,
              selectable: false,
              evented: false,
            },
          );
        } else if (style === "Velocidade") {
          const w = Math.max(8, objW * (1 - i / (length + 2)));
          const h = Math.max(2, objH * 0.15);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          segment = new f.Rect({
            left: x,
            top: y,
            width: w,
            height: h,
            fill: baseColor,
            opacity: op,
            angle,
            selectable: false,
            evented: false,
          });
        }

        if (segment) {
          segment.data = { trailMotion: true, parentId };
          canvas.add(segment);
          segment.sendToBack?.();
        }
      }

      canvas.renderAll?.();
      toast.success(`Rastro "${style}" aplicado`);
    });
  };

  const removeTrails = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trails = objects.filter((o: any) => o?.data?.trailMotion === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trails.forEach((t: any) => canvas.remove(t));
    canvas.renderAll?.();
    toast.success(`${trails.length} rastro(s) removido(s)`);
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Rastro de Movimento</h3>
      </div>

      {!hasSelection && (
        <div className="rounded border border-dashed p-2 text-xs text-muted-foreground">
          Selecione um objeto no canvas para aplicar o rastro.
        </div>
      )}

      <div className="space-y-2">
        <span className="text-xs font-medium">Estilo</span>
        <div className="grid grid-cols-2 gap-2">
          {(["Linhas", "Manchas", "Setas", "Velocidade"] as TrailStyle[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={style === s ? "default" : "outline"}
              onClick={() => setStyle(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Direção</span>
        <div className="grid grid-cols-3 gap-1">
          {DIRECTIONS.map((d, idx) =>
            d === null ? (
              <div key={`empty-${idx}`} />
            ) : (
              <Button
                key={d}
                size="sm"
                variant={direction === d ? "default" : "outline"}
                onClick={() => setDirection(d)}
              >
                {d}
              </Button>
            ),
          )}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Comprimento ({length} segmentos)</span>
        <input
          type="range"
          min={3}
          max={20}
          step={1}
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Espaçamento ({spacing}px)</span>
        <input
          type="range"
          min={5}
          max={40}
          step={1}
          value={spacing}
          onChange={(e) => setSpacing(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">
          Fade de Opacidade ({opacityFade.toFixed(2)})
        </span>
        <input
          type="range"
          min={0.05}
          max={0.95}
          step={0.05}
          value={opacityFade}
          onChange={(e) => setOpacityFade(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="trail-color-follow"
          type="checkbox"
          checked={colorFollow}
          onChange={(e) => setColorFollow(e.target.checked)}
        />
        <label htmlFor="trail-color-follow" className="text-xs">
          Seguir cor do objeto
        </label>
      </div>

      {!colorFollow && (
        <div className="space-y-1">
          <span className="text-xs font-medium">Cor personalizada</span>
          <Input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="h-9 w-full"
          />
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={applyTrail} disabled={!hasSelection}>
          Aplicar Rastro
        </Button>
        <Button variant="outline" onClick={removeTrails}>
          Remover Rastros
        </Button>
      </div>
    </div>
  );
}
