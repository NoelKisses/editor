"use client";

import { useEffect, useRef, useState } from "react";
import { Spline } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CurveShape =
  | "arc-top"
  | "arc-bottom"
  | "circle"
  | "wave"
  | "spiral"
  | "straight";

interface CharPosition {
  x: number;
  y: number;
  rot: number;
}

function computeArcPositions(
  text: string,
  radius: number,
  startAngle: number,
  spacing: number,
  faceOut: boolean,
  arcSpan: number = 180,
  cx: number = 0,
  cy: number = 0,
  reverse: boolean = false,
): CharPosition[] {
  const positions: CharPosition[] = [];
  const total = text.length;
  if (total === 0) return positions;
  const charAngle = (arcSpan / total) * spacing;
  for (let i = 0; i < total; i++) {
    const idx = reverse ? total - 1 - i : i;
    const angleDeg = startAngle + idx * charAngle;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = cx + radius * Math.cos(angleRad);
    const y = cy + radius * Math.sin(angleRad);
    const rot = faceOut ? angleDeg + 90 : angleDeg - 90;
    positions.push({ x, y, rot });
  }
  return positions;
}

function computeWavePositions(
  text: string,
  baseY: number,
  spacing: number,
  baseX: number = 0,
): CharPosition[] {
  const positions: CharPosition[] = [];
  for (let i = 0; i < text.length; i++) {
    const x = baseX + i * spacing;
    const y = baseY + Math.sin(i * 0.5) * 30;
    const slope = Math.cos(i * 0.5) * 30 * 0.5;
    const rot = (Math.atan2(slope, spacing) * 180) / Math.PI;
    positions.push({ x, y, rot });
  }
  return positions;
}

function computeSpiralPositions(
  text: string,
  cx: number,
  cy: number,
  startR: number,
): CharPosition[] {
  const positions: CharPosition[] = [];
  for (let i = 0; i < text.length; i++) {
    const r = startR + i * 5;
    const angleDeg = i * 25;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = cx + r * Math.cos(angleRad);
    const y = cy + r * Math.sin(angleRad);
    const rot = angleDeg + 90;
    positions.push({ x, y, rot });
  }
  return positions;
}

function computeStraightPositions(
  text: string,
  baseX: number,
  baseY: number,
  spacing: number,
): CharPosition[] {
  const positions: CharPosition[] = [];
  for (let i = 0; i < text.length; i++) {
    positions.push({ x: baseX + i * spacing, y: baseY, rot: 0 });
  }
  return positions;
}

interface TextCurveArcAdvancedPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextCurveArcAdvancedPanel({
  fabricCanvas,
}: TextCurveArcAdvancedPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [text, setText] = useState("TEXTO EM ARCO");
  const [shape, setShape] = useState<CurveShape>("arc-top");
  const [radius, setRadius] = useState(150);
  const [fontSize, setFontSize] = useState(32);
  const [spacingFactor, setSpacingFactor] = useState(1);
  const [startAngle, setStartAngle] = useState(180);
  const [reverse, setReverse] = useState(false);
  const [color, setColor] = useState("#000000");
  const [fontWeight, setFontWeight] = useState("bold");
  const [fontFamily, setFontFamily] = useState("Impact");

  useEffect(() => {
    queueMicrotask(() => {
      canvasRef.current = fabricCanvas;
    });
  }, [fabricCanvas]);

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não está pronto");
      return;
    }
    if (!text.trim()) {
      toast.error("Digite algum texto");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      if (!f) {
        toast.error("Fabric.js não disponível");
        return;
      }

      const cx = canvas.getWidth ? canvas.getWidth() / 2 : 400;
      const cy = canvas.getHeight ? canvas.getHeight() / 2 : 300;

      let positions: CharPosition[] = [];
      const spacingPx = fontSize * 0.7 * spacingFactor;

      switch (shape) {
        case "arc-top":
          positions = computeArcPositions(
            text,
            radius,
            startAngle,
            spacingFactor,
            true,
            180,
            0,
            0,
            reverse,
          );
          break;
        case "arc-bottom":
          positions = computeArcPositions(
            text,
            radius,
            0,
            spacingFactor,
            false,
            180,
            0,
            0,
            reverse,
          );
          break;
        case "circle":
          positions = computeArcPositions(
            text,
            radius,
            startAngle,
            spacingFactor,
            true,
            360,
            0,
            0,
            reverse,
          );
          break;
        case "wave":
          positions = computeWavePositions(
            text,
            0,
            spacingPx,
            -(text.length * spacingPx) / 2,
          );
          break;
        case "spiral":
          positions = computeSpiralPositions(text, 0, 0, 20);
          break;
        case "straight":
          positions = computeStraightPositions(
            text,
            -(text.length * spacingPx) / 2,
            0,
            spacingPx,
          );
          break;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chars: any[] = [];
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const pos = positions[i];
        if (!pos) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const iText = new f.IText(ch, {
          left: pos.x,
          top: pos.y,
          fontSize,
          fill: color,
          fontFamily,
          fontWeight,
          originX: "center",
          originY: "center",
          angle: pos.rot,
          selectable: true,
        });
        chars.push(iText);
      }

      if (chars.length === 0) {
        toast.error("Nenhum caractere para inserir");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const group = new f.Group(chars, {
        left: cx,
        top: cy,
        originX: "center",
        originY: "center",
        data: { curveArcText: true },
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      toast.success("Texto em curva inserido");
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não está pronto");
      return;
    }
    const objects = canvas.getObjects();
    let removed = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((obj: any) => {
      if (obj?.data?.curveArcText === true) {
        canvas.remove(obj);
        removed++;
      }
    });
    canvas.requestRenderAll();
    if (removed > 0) {
      toast.success(`${removed} texto(s) removido(s)`);
    } else {
      toast.info("Nenhum texto em curva encontrado");
    }
  };

  const shapeButtons: Array<{ id: CurveShape; label: string }> = [
    { id: "arc-top", label: "Arco Superior" },
    { id: "arc-bottom", label: "Arco Inferior" },
    { id: "circle", label: "Círculo Completo" },
    { id: "wave", label: "Onda" },
    { id: "spiral", label: "Espiral" },
    { id: "straight", label: "Reto" },
  ];

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Spline className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Texto em Curva (Arco)</h3>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Texto</label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="TEXTO EM ARCO"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Formato da Curva</label>
        <div className="grid grid-cols-2 gap-2">
          {shapeButtons.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant={shape === s.id ? "default" : "outline"}
              size="sm"
              onClick={() => setShape(s.id)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Raio: {radius}px
        </label>
        <input
          type="range"
          min={50}
          max={400}
          step={1}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Tamanho da Fonte: {fontSize}px
        </label>
        <input
          type="range"
          min={12}
          max={72}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Espaçamento: {spacingFactor.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.05}
          value={spacingFactor}
          onChange={(e) => setSpacingFactor(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Ângulo Inicial: {startAngle}°
        </label>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={startAngle}
          onChange={(e) => setStartAngle(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="curve-arc-reverse"
          checked={reverse}
          onChange={(e) => setReverse(e.target.checked)}
        />
        <label htmlFor="curve-arc-reverse" className="text-xs font-medium">
          Inverter direção
        </label>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Cor</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-full cursor-pointer rounded border"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Peso da Fonte</label>
        <select
          value={fontWeight}
          onChange={(e) => setFontWeight(e.target.value)}
          className="h-9 w-full rounded border px-2 text-sm"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="900">Black (900)</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Família da Fonte</label>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="h-9 w-full rounded border px-2 text-sm"
        >
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Impact">Impact</option>
          <option value="Bebas Neue">Bebas Neue</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>

      <div className="space-y-2 pt-2">
        <Button type="button" className="w-full" onClick={handleInsert}>
          Inserir Texto em Curva
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleRemove}
        >
          Remover Curvas
        </Button>
      </div>
    </div>
  );
}
