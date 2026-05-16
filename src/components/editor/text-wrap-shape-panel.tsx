"use client";

import { useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextWrapShapePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface TileChar {
  x: number;
  y: number;
  char: string;
}

const SHAPE_PRESETS = [
  { id: "circle", label: "Círculo" },
  { id: "square", label: "Quadrado" },
  { id: "triangle", label: "Triângulo" },
  { id: "heart", label: "Coração" },
  { id: "star", label: "Estrela" },
  { id: "hexagon", label: "Hexágono" },
] as const;

function tileCharacters(
  text: string,
  bbox: { width: number; height: number },
  fontSize: number,
  charSpacing: number,
  lineHeight: number,
): TileChar[] {
  const result: TileChar[] = [];
  if (!text || text.length === 0) {
    return result;
  }
  const stepY = Math.max(1, fontSize + lineHeight);
  const stepX = Math.max(1, fontSize * 0.6 + charSpacing);
  let index = 0;
  for (let y = 0; y < bbox.height; y += stepY) {
    for (let x = 0; x < bbox.width; x += stepX) {
      const char = text[index % text.length];
      result.push({ x, y, char });
      index += 1;
    }
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cloneShapeAsClipPath(shape: any, fabricNS: any): any {
  const cloned = new fabricNS.Path(shape.path ?? "", {
    left: -(shape.width ?? 0) / 2,
    top: -(shape.height ?? 0) / 2,
    fill: "#000",
    absolutePositioned: false,
  });
  if (shape.type === "rect") {
    return new fabricNS.Rect({
      width: shape.width,
      height: shape.height,
      left: -(shape.width ?? 0) / 2,
      top: -(shape.height ?? 0) / 2,
      absolutePositioned: false,
    });
  }
  if (shape.type === "circle") {
    return new fabricNS.Circle({
      radius: shape.radius,
      left: -(shape.radius ?? 0),
      top: -(shape.radius ?? 0),
      absolutePositioned: false,
    });
  }
  if (shape.type === "triangle") {
    return new fabricNS.Triangle({
      width: shape.width,
      height: shape.height,
      left: -(shape.width ?? 0) / 2,
      top: -(shape.height ?? 0) / 2,
      absolutePositioned: false,
    });
  }
  return cloned;
}

export function TextWrapShapePanel({ fabricCanvas }: TextWrapShapePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [text, setText] = useState("AMOR");
  const [fontSize, setFontSize] = useState(16);
  const [letterSpacing, setLetterSpacing] = useState(2);
  const [fontWeight, setFontWeight] = useState<"normal" | "bold" | "900">(
    "bold",
  );
  const [color, setColor] = useState("#000000");
  const [selectedShape, setSelectedShape] = useState<string>("circle");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildTextGroup = (shape: any, fabricNS: any) => {
    const bbox = {
      width: shape.width * (shape.scaleX ?? 1),
      height: shape.height * (shape.scaleY ?? 1),
    };
    const tiles = tileCharacters(text, bbox, fontSize, letterSpacing, 2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chars: any[] = tiles.map(
      (t) =>
        new fabricNS.IText(t.char, {
          left: t.x,
          top: t.y,
          fontSize,
          fontWeight,
          fill: color,
          selectable: false,
          evented: false,
          data: { textWrapShape: true, shapeId: shape.__uid ?? null },
        }),
    );

    const group = new fabricNS.Group(chars, {
      left: shape.left,
      top: shape.top,
      originX: shape.originX ?? "left",
      originY: shape.originY ?? "top",
      data: { textWrapShape: true, shapeId: shape.__uid ?? null },
    });

    const clip = cloneShapeAsClipPath(shape, fabricNS);
    group.clipPath = clip;
    return group;
  };

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active) {
      toast.error("Selecione uma forma primeiro");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      try {
        const group = buildTextGroup(active, f);
        canvas.add(group);
        canvas.requestRenderAll();
        toast.success("Texto em forma gerado");
      } catch (err) {
        toast.error(
          `Falha ao gerar: ${err instanceof Error ? err.message : "erro"}`,
        );
      }
    });
  };

  const handleApplyClip = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active) {
      toast.error("Selecione uma forma primeiro");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      try {
        const group = buildTextGroup(active, f);
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        toast.success("Clip aplicado");
      } catch (err) {
        toast.error(
          `Falha ao aplicar clip: ${err instanceof Error ? err.message : "erro"}`,
        );
      }
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((o: any) => {
      return o?.data?.textWrapShape === true;
    });
    if (objects.length === 0) {
      toast.info("Nenhum texto em forma encontrado");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${objects.length} objeto(s) removido(s)`);
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Texto em Forma</h3>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium">Forma base</span>
        <div className="grid grid-cols-2 gap-2">
          {SHAPE_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant={selectedShape === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedShape(preset.id)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">Texto</span>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="AMOR"
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">
          Tamanho da fonte: {fontSize}px
        </span>
        <input
          type="range"
          min={8}
          max={32}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">
          Espaçamento: {letterSpacing}px
        </span>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">Peso da fonte</span>
        <select
          value={fontWeight}
          onChange={(e) =>
            setFontWeight(e.target.value as "normal" | "bold" | "900")
          }
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
        >
          <option value="normal">Normal</option>
          <option value="bold">Negrito</option>
          <option value="900">Extra Bold (900)</option>
        </select>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">Cor</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-full cursor-pointer rounded border border-input"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleGenerate}>
          Gerar Texto em Forma
        </Button>
        <Button type="button" variant="outline" onClick={handleApplyClip}>
          Aplicar Clip ao Selecionado
        </Button>
        <Button type="button" variant="destructive" onClick={handleRemove}>
          Remover Texto em Forma
        </Button>
      </div>
    </div>
  );
}
