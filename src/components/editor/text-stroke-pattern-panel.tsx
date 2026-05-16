"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StrokePattern =
  | "solid"
  | "dashed"
  | "dotted"
  | "dashdot"
  | "double"
  | "wave";

type FillMode = "stroke-only" | "stroke-fill" | "invert";

interface PatternDefinition {
  id: StrokePattern;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dashArray: any;
}

const PATTERNS: PatternDefinition[] = [
  { id: "solid", label: "Sólido", dashArray: null },
  { id: "dashed", label: "Tracejado", dashArray: [10, 5] },
  { id: "dotted", label: "Pontilhado", dashArray: [2, 4] },
  { id: "dashdot", label: "Traço-Ponto", dashArray: [10, 4, 2, 4] },
  { id: "double", label: "Duplo", dashArray: null },
  { id: "wave", label: "Onda", dashArray: [3, 2] },
];

const TEXT_TYPES = ["text", "i-text", "textbox"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTextObject(obj: any): boolean {
  return !!obj && TEXT_TYPES.includes(obj.type);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedTextObjects(canvas: any): any[] {
  if (!canvas) return [];
  const active = canvas.getActiveObjects?.() ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return active.filter((o: any) => isTextObject(o));
}

function getContrastColor(hex: string): string {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}

interface TextStrokePatternPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextStrokePatternPanel({
  fabricCanvas,
}: TextStrokePatternPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [pattern, setPattern] = useState<StrokePattern>("solid");
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [fillMode, setFillMode] = useState<FillMode>("stroke-only");
  const [glow, setGlow] = useState<boolean>(false);
  const [paintFirstStroke, setPaintFirstStroke] = useState<boolean>(false);
  const [strokeUniform, setStrokeUniform] = useState<boolean>(true);
  const [sharpMiter, setSharpMiter] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  function applyPattern() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    const targets = getSelectedTextObjects(canvas);
    if (targets.length === 0) {
      toast.error("Selecione ao menos um texto");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const def = PATTERNS.find((p) => p.id === pattern) ?? PATTERNS[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targets.forEach((obj: any) => {
        const originalFill = obj.fill ?? "#ffffff";

        obj.set({
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: def.dashArray,
          strokeUniform: strokeUniform,
          strokeLineJoin: sharpMiter ? "miter" : "round",
          strokeMiterLimit: sharpMiter ? 20 : 4,
          paintFirst: paintFirstStroke ? "stroke" : "fill",
        });

        if (fillMode === "stroke-only") {
          obj.set({ fill: "transparent" });
        } else if (fillMode === "stroke-fill") {
          obj.set({ fill: originalFill });
        } else if (fillMode === "invert") {
          obj.set({ fill: strokeColor, stroke: originalFill });
        }

        if (glow) {
          obj.set({
            shadow: new f.Shadow({
              color: strokeColor,
              blur: 15,
              offsetX: 0,
              offsetY: 0,
            }),
          });
        } else {
          obj.set({ shadow: null });
        }

        if (pattern === "double") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          obj.clone((cloned: any) => {
            const contrast = getContrastColor(strokeColor);
            cloned.set({
              left: obj.left,
              top: obj.top,
              stroke: contrast,
              strokeWidth: Math.max(1, strokeWidth / 2),
              strokeDashArray: null,
              fill:
                fillMode === "stroke-only" ? "transparent" : obj.fill,
              selectable: true,
              evented: true,
            });
            canvas.add(cloned);
            canvas.bringToFront(cloned);
          });
        }

        obj.setCoords?.();
      });

      canvas.requestRenderAll?.();
      toast.success(`Padrão "${def.label}" aplicado`);
    });
  }

  function resetStroke() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    const targets = getSelectedTextObjects(canvas);
    if (targets.length === 0) {
      toast.error("Selecione ao menos um texto");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targets.forEach((obj: any) => {
      obj.set({
        stroke: null,
        strokeWidth: 0,
        strokeDashArray: null,
        shadow: null,
        paintFirst: "fill",
        strokeUniform: false,
        strokeLineJoin: "round",
        strokeMiterLimit: 4,
      });
      if (!obj.fill || obj.fill === "transparent") {
        obj.set({ fill: "#ffffff" });
      }
      obj.setCoords?.();
    });

    canvas.requestRenderAll?.();
    toast.success("Contorno resetado");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Pencil className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Padrão de Contorno</h3>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Padrão
        </span>
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant={pattern === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => setPattern(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Cor do Contorno
        </span>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="h-9 w-14 cursor-pointer p-1"
          />
          <Input
            type="text"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="h-9 flex-1"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Espessura
          </span>
          <span className="text-xs tabular-nums">{strokeWidth}px</span>
        </div>
        <input
          type="range"
          min={1}
          max={15}
          step={1}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Modo de Preenchimento
        </span>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="fill-mode"
              checked={fillMode === "stroke-only"}
              onChange={() => setFillMode("stroke-only")}
            />
            Apenas Contorno
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="fill-mode"
              checked={fillMode === "stroke-fill"}
              onChange={() => setFillMode("stroke-fill")}
            />
            Contorno + Preenchimento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="fill-mode"
              checked={fillMode === "invert"}
              onChange={() => setFillMode("invert")}
            />
            Inverter
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Modificadores
        </span>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={glow}
              onChange={(e) => setGlow(e.target.checked)}
            />
            Glow
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={paintFirstStroke}
              onChange={(e) => setPaintFirstStroke(e.target.checked)}
            />
            Outline atrás
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={strokeUniform}
              onChange={(e) => setStrokeUniform(e.target.checked)}
            />
            Stroke Uniforme
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sharpMiter}
              onChange={(e) => setSharpMiter(e.target.checked)}
            />
            Cantos Afiados
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={applyPattern}>
          Aplicar Padrão
        </Button>
        <Button type="button" variant="outline" onClick={resetStroke}>
          Resetar Contorno
        </Button>
      </div>
    </div>
  );
}
