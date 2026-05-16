"use client";

import { useEffect, useRef, useState } from "react";
import { Grid3X3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasGridOverlayAdvancedPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type OverlayType =
  | "thirds"
  | "golden"
  | "diagonals"
  | "cross"
  | "quadrant"
  | "dense";

type LineTuple = [number, number, number, number];

function buildRuleOfThirdsLines(w: number, h: number): Array<LineTuple> {
  const lines: Array<LineTuple> = [];
  const v1 = w / 3;
  const v2 = (2 * w) / 3;
  const h1 = h / 3;
  const h2 = (2 * h) / 3;
  lines.push([v1, 0, v1, h]);
  lines.push([v2, 0, v2, h]);
  lines.push([0, h1, w, h1]);
  lines.push([0, h2, w, h2]);
  return lines;
}

function buildGoldenRatioLines(w: number, h: number): Array<LineTuple> {
  const phi = 1.618;
  const lines: Array<LineTuple> = [];
  const vx1 = w / phi;
  const vx2 = w - w / phi;
  const hy1 = h / phi;
  const hy2 = h - h / phi;
  lines.push([vx1, 0, vx1, h]);
  lines.push([vx2, 0, vx2, h]);
  lines.push([0, hy1, w, hy1]);
  lines.push([0, hy2, w, hy2]);
  // Spiral approximation via diagonal anchors
  lines.push([0, 0, vx1, hy1]);
  lines.push([w, h, vx2, hy2]);
  return lines;
}

function buildDiagonalsLines(w: number, h: number): Array<LineTuple> {
  return [
    [0, 0, w, h],
    [w, 0, 0, h],
  ];
}

function buildCrossLines(w: number, h: number): Array<LineTuple> {
  return [
    [w / 2, 0, w / 2, h],
    [0, h / 2, w, h / 2],
  ];
}

function buildQuadrantLines(w: number, h: number): Array<LineTuple> {
  return [
    [w / 2, 0, w / 2, h],
    [0, h / 2, w, h / 2],
  ];
}

function buildDenseGridLines(
  w: number,
  h: number,
  divisions: number,
): Array<LineTuple> {
  const lines: Array<LineTuple> = [];
  for (let i = 1; i < divisions; i++) {
    const x = (w * i) / divisions;
    lines.push([x, 0, x, h]);
  }
  for (let j = 1; j < divisions; j++) {
    const y = (h * j) / divisions;
    lines.push([0, y, w, y]);
  }
  return lines;
}

function computeLines(
  type: OverlayType,
  w: number,
  h: number,
): Array<LineTuple> {
  switch (type) {
    case "thirds":
      return buildRuleOfThirdsLines(w, h);
    case "golden":
      return buildGoldenRatioLines(w, h);
    case "diagonals":
      return buildDiagonalsLines(w, h);
    case "cross":
      return buildCrossLines(w, h);
    case "quadrant":
      return buildQuadrantLines(w, h);
    case "dense":
      return buildDenseGridLines(w, h, 6);
    default:
      return [];
  }
}

const OVERLAY_OPTIONS: Array<{ type: OverlayType; label: string }> = [
  { type: "thirds", label: "Regra dos Terços" },
  { type: "golden", label: "Proporção Áurea" },
  { type: "diagonals", label: "Diagonais" },
  { type: "cross", label: "Cruz Central" },
  { type: "quadrant", label: "Quadrante" },
  { type: "dense", label: "Grade Densa" },
];

export function CanvasGridOverlayAdvancedPanel({
  fabricCanvas,
}: CanvasGridOverlayAdvancedPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedType, setSelectedType] = useState<OverlayType>("thirds");
  const [color, setColor] = useState<string>("#ff0080");
  const [opacity, setOpacity] = useState<number>(0.5);
  const [lineWidth, setLineWidth] = useState<number>(1);
  const [dashed, setDashed] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleAddOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não está disponível");
      return;
    }

    const w = canvas.getWidth?.() ?? 0;
    const h = canvas.getHeight?.() ?? 0;

    if (!w || !h) {
      toast.error("Dimensões do canvas inválidas");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric ?? (m as any);
      const lines = computeLines(selectedType, w, h);

      lines.forEach((coords) => {
        const line = new f.Line(coords, {
          stroke: color,
          strokeWidth: lineWidth,
          opacity: opacity,
          strokeDashArray: dashed ? [5, 5] : undefined,
          selectable: false,
          evented: false,
          data: { gridOverlay: true },
        });
        canvas.add(line);
      });

      canvas.renderAll?.();
      toast.success("Sobreposição adicionada");
    }).catch(() => {
      toast.error("Falha ao carregar Fabric");
    });
  };

  const handleClearOverlays = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não está disponível");
      return;
    }

    const objects = canvas.getObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objects.filter((obj: any) => obj?.data?.gridOverlay === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((obj: any) => canvas.remove(obj));
    canvas.renderAll?.();
    toast.success("Sobreposições removidas");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Grid3X3 className="h-5 w-5" />
        <h3 className="text-sm font-semibold">
          Sobreposições / Guias Avançadas
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {OVERLAY_OPTIONS.map((opt) => (
          <Button
            key={opt.type}
            variant={selectedType === opt.type ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(opt.type)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">Cor da Linha</span>
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-16 p-1"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Opacidade</span>
            <span className="text-xs text-muted-foreground">
              {opacity.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Espessura</span>
            <span className="text-xs text-muted-foreground">{lineWidth}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={dashed}
            onChange={(e) => setDashed(e.target.checked)}
          />
          Linha tracejada
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={handleAddOverlay} size="sm">
          Adicionar Sobreposição
        </Button>
        <Button onClick={handleClearOverlays} size="sm" variant="outline">
          Limpar Sobreposições
        </Button>
      </div>
    </div>
  );
}
