"use client";

import { useEffect, useRef, useState } from "react";
import { AlignVerticalJustifyCenter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StackMode = "stacked" | "diagonal-down" | "diagonal-up" | "wave";

interface Position {
  x: number;
  y: number;
  rot: number;
}

function generateStackId(): string {
  return `stack-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function computePositions(
  text: string,
  mode: StackMode,
  fontSize: number,
  spacing: number,
): Position[] {
  const positions: Position[] = [];
  const chars = Array.from(text);
  const step = fontSize + spacing;

  for (let i = 0; i < chars.length; i++) {
    let x = 0;
    let y = 0;

    switch (mode) {
      case "stacked":
        x = 0;
        y = i * step;
        break;
      case "diagonal-down":
        x = i * (fontSize * 0.6);
        y = i * step;
        break;
      case "diagonal-up":
        x = i * (fontSize * 0.6);
        y = -i * step;
        break;
      case "wave":
        x = i * (fontSize * 0.8);
        y = Math.sin(i * 0.5) * 20;
        break;
      default:
        x = 0;
        y = i * step;
        break;
    }

    positions.push({ x, y, rot: 0 });
  }

  return positions;
}

interface TextVerticalStackPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextVerticalStackPanel({ fabricCanvas }: TextVerticalStackPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [text, setText] = useState("EDITOR");
  const [fontSize, setFontSize] = useState(60);
  const [spacing, setSpacing] = useState(10);
  const [fontFamily, setFontFamily] = useState("Impact");
  const [fontWeight, setFontWeight] = useState("bold");
  const [color, setColor] = useState("#000000");
  const [mode, setMode] = useState<StackMode>("stacked");
  const [rotation, setRotation] = useState(0);
  const [alternateRotation, setAlternateRotation] = useState(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleInsertStack = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    if (!text || text.length === 0) {
      toast.error("Digite um texto para empilhar");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const positions = computePositions(text, mode, fontSize, spacing);
      const chars = Array.from(text);
      const stackId = generateStackId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = [];

      for (let i = 0; i < chars.length; i++) {
        const pos = positions[i];
        let rot = rotation;
        if (alternateRotation) {
          rot = i % 2 === 0 ? rotation : -rotation;
        }

        const itext = new f.IText(chars[i], {
          left: pos.x,
          top: pos.y,
          fontSize,
          fontFamily,
          fontWeight,
          fill: color,
          originX: "center",
          originY: "center",
          angle: rot,
          data: { verticalStack: true, stackId },
        });

        items.push(itext);
      }

      const group = new f.Group(items, {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: "center",
        originY: "center",
        data: { verticalStack: true, stackId },
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      toast.success("Texto empilhado inserido");
    });
  };

  const handleRemoveStacks = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const objects = canvas.getObjects();
    let removed = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.slice().forEach((obj: any) => {
      if (obj?.data?.verticalStack === true) {
        canvas.remove(obj);
        removed++;
      }
    });
    canvas.requestRenderAll();
    if (removed > 0) {
      toast.success(`${removed} elemento(s) removido(s)`);
    } else {
      toast.info("Nenhum texto empilhado encontrado");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <AlignVerticalJustifyCenter className="h-5 w-5" />
        <h3 className="text-base font-semibold">Texto Vertical Empilhado</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vstack-text">
          Texto
        </label>
        <Input
          id="vstack-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="EDITOR"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vstack-fontsize">
          Tamanho da fonte: {fontSize}px
        </label>
        <input
          id="vstack-fontsize"
          type="range"
          min={20}
          max={120}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vstack-spacing">
          Espaçamento entre letras: {spacing}px
        </label>
        <input
          id="vstack-spacing"
          type="range"
          min={-20}
          max={60}
          value={spacing}
          onChange={(e) => setSpacing(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vstack-fontfamily">
          Família da fonte
        </label>
        <select
          id="vstack-fontfamily"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="Impact">Impact</option>
          <option value="Bebas Neue">Bebas Neue</option>
          <option value="Anton">Anton</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vstack-fontweight">
          Peso da fonte
        </label>
        <select
          id="vstack-fontweight"
          value={fontWeight}
          onChange={(e) => setFontWeight(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="900">Black (900)</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vstack-color">
          Cor
        </label>
        <input
          id="vstack-color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-full cursor-pointer rounded-md border border-input bg-background"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Modo de empilhamento</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "stacked" ? "default" : "outline"}
            onClick={() => setMode("stacked")}
          >
            Empilhado
          </Button>
          <Button
            type="button"
            variant={mode === "diagonal-down" ? "default" : "outline"}
            onClick={() => setMode("diagonal-down")}
          >
            Diagonal ↘
          </Button>
          <Button
            type="button"
            variant={mode === "diagonal-up" ? "default" : "outline"}
            onClick={() => setMode("diagonal-up")}
          >
            Diagonal ↗
          </Button>
          <Button
            type="button"
            variant={mode === "wave" ? "default" : "outline"}
            onClick={() => setMode("wave")}
          >
            Onda
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="vstack-rotation">
          Rotação das letras: {rotation}°
        </label>
        <input
          id="vstack-rotation"
          type="range"
          min={-180}
          max={180}
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="vstack-alternate"
          type="checkbox"
          checked={alternateRotation}
          onChange={(e) => setAlternateRotation(e.target.checked)}
          className="h-4 w-4"
        />
        <label className="text-sm font-medium" htmlFor="vstack-alternate">
          Alternar rotação (+/-)
        </label>
      </div>

      <div className="space-y-2 pt-2">
        <Button type="button" className="w-full" onClick={handleInsertStack}>
          Inserir Texto Empilhado
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleRemoveStacks}
        >
          Remover Empilhados
        </Button>
      </div>
    </div>
  );
}
