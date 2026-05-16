"use client";

import { useEffect, useRef, useState } from "react";
import { Highlighter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HighlightStyle =
  | "marca-texto"
  | "sublinhado"
  | "tachado"
  | "circulo"
  | "caixa"
  | "rabisco";

const TEXT_TYPES = ["text", "i-text", "textbox"] as const;

function buildScribblePoints(
  left: number,
  right: number,
  baselineY: number,
  amplitude: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const numPoints = 9;
  const step = (right - left) / (numPoints - 1);
  for (let i = 0; i < numPoints; i++) {
    const x = left + step * i;
    const randomOffset = (Math.random() - 0.5) * amplitude * 2;
    const y = baselineY + randomOffset;
    points.push({ x, y });
  }
  return points;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensureId(obj: any): string {
  if (!obj.data) obj.data = {};
  if (!obj.data.id) {
    obj.data.id = `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return obj.data.id as string;
}

interface TextHighlightMarkerPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextHighlightMarkerPanel({
  fabricCanvas,
}: TextHighlightMarkerPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [style, setStyle] = useState<HighlightStyle>("marca-texto");
  const [color, setColor] = useState("#ffff00");
  const [opacity, setOpacity] = useState(0.7);
  const [thickness, setThickness] = useState(10);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const applyHighlight = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active || !TEXT_TYPES.includes(active.type)) {
      toast.error("Selecione um objeto de texto");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const bbox = active.getBoundingRect();
      const parentId = ensureId(active);
      const padding = 6;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let element: any = null;

      if (style === "marca-texto") {
        element = new f.Rect({
          left: bbox.left - padding,
          top: bbox.top,
          width: bbox.width + padding * 2,
          height: bbox.height,
          fill: color,
          opacity,
          angle: -2,
          selectable: true,
          evented: true,
        });
      } else if (style === "sublinhado") {
        const y = bbox.top + bbox.height + offset;
        element = new f.Line(
          [bbox.left, y, bbox.left + bbox.width, y],
          {
            stroke: color,
            strokeWidth: thickness,
            opacity,
            selectable: true,
            evented: true,
          },
        );
      } else if (style === "tachado") {
        const y = bbox.top + bbox.height / 2 + offset;
        element = new f.Line(
          [bbox.left, y, bbox.left + bbox.width, y],
          {
            stroke: color,
            strokeWidth: thickness,
            opacity,
            selectable: true,
            evented: true,
          },
        );
      } else if (style === "circulo") {
        element = new f.Ellipse({
          left: bbox.left - 10,
          top: bbox.top - 5,
          rx: bbox.width / 2 + 10,
          ry: bbox.height / 2 + 5,
          fill: "transparent",
          stroke: color,
          strokeWidth: thickness / 2,
          opacity,
          selectable: true,
          evented: true,
        });
      } else if (style === "caixa") {
        element = new f.Rect({
          left: bbox.left - padding,
          top: bbox.top - padding,
          width: bbox.width + padding * 2,
          height: bbox.height + padding * 2,
          fill: "transparent",
          stroke: color,
          strokeWidth: 3,
          opacity,
          selectable: true,
          evented: true,
        });
      } else if (style === "rabisco") {
        const baselineY = bbox.top + bbox.height + offset + thickness / 2;
        const pts = buildScribblePoints(
          bbox.left,
          bbox.left + bbox.width,
          baselineY,
          Math.max(2, thickness / 2),
        );
        element = new f.Polyline(pts, {
          stroke: color,
          strokeWidth: thickness,
          fill: "transparent",
          opacity,
          selectable: true,
          evented: true,
        });
      }

      if (!element) {
        toast.error("Estilo inválido");
        return;
      }

      element.data = { highlightMarker: true, parentId };
      canvas.add(element);
      if (typeof canvas.sendBackwards === "function") {
        canvas.sendBackwards(element);
      } else if (typeof element.sendBackwards === "function") {
        element.sendBackwards();
      }
      canvas.requestRenderAll();
      toast.success("Marca aplicada");
    });
  };

  const removeMarkers = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const all = canvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markers = all.filter((o: any) => o.data?.highlightMarker === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markers.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${markers.length} marca(s) removida(s)`);
  };

  const styleButtons: Array<{ id: HighlightStyle; label: string }> = [
    { id: "marca-texto", label: "Marca-texto" },
    { id: "sublinhado", label: "Sublinhado" },
    { id: "tachado", label: "Tachado" },
    { id: "circulo", label: "Círculo" },
    { id: "caixa", label: "Caixa" },
    { id: "rabisco", label: "Rabisco" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Highlighter className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Marca-texto / Highlight</h3>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium">Estilo</span>
        <div className="grid grid-cols-2 gap-2">
          {styleButtons.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant={style === s.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStyle(s.id)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">Cor do destaque</span>
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">
          Opacidade: {opacity.toFixed(2)}
        </span>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">Espessura: {thickness}px</span>
        <input
          type="range"
          min={2}
          max={20}
          step={1}
          value={thickness}
          onChange={(e) => setThickness(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">Offset Y: {offset}px</span>
        <input
          type="range"
          min={-10}
          max={10}
          step={1}
          value={offset}
          onChange={(e) => setOffset(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={applyHighlight}>
          Aplicar Marca
        </Button>
        <Button type="button" variant="outline" onClick={removeMarkers}>
          Remover Marcas
        </Button>
      </div>
    </div>
  );
}
