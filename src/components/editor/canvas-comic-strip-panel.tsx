"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasComicStripPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface PanelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function computeStripLayout(
  style: string,
  canvasW: number,
  canvasH: number,
  gap: number
): PanelRect[] {
  const padding = gap;
  const innerW = canvasW - padding * 2;
  const innerH = canvasH - padding * 2;

  switch (style) {
    case "3h": {
      const w = (innerW - gap * 2) / 3;
      const h = innerH;
      return [
        { x: padding, y: padding, w, h },
        { x: padding + w + gap, y: padding, w, h },
        { x: padding + (w + gap) * 2, y: padding, w, h },
      ];
    }
    case "3v": {
      const w = innerW;
      const h = (innerH - gap * 2) / 3;
      return [
        { x: padding, y: padding, w, h },
        { x: padding, y: padding + h + gap, w, h },
        { x: padding, y: padding + (h + gap) * 2, w, h },
      ];
    }
    case "2x2": {
      const w = (innerW - gap) / 2;
      const h = (innerH - gap) / 2;
      return [
        { x: padding, y: padding, w, h },
        { x: padding + w + gap, y: padding, w, h },
        { x: padding, y: padding + h + gap, w, h },
        { x: padding + w + gap, y: padding + h + gap, w, h },
      ];
    }
    case "2x3": {
      const w = (innerW - gap) / 2;
      const h = (innerH - gap * 2) / 3;
      return [
        { x: padding, y: padding, w, h },
        { x: padding + w + gap, y: padding, w, h },
        { x: padding, y: padding + h + gap, w, h },
        { x: padding + w + gap, y: padding + h + gap, w, h },
        { x: padding, y: padding + (h + gap) * 2, w, h },
        { x: padding + w + gap, y: padding + (h + gap) * 2, w, h },
      ];
    }
    case "1+2": {
      const topH = (innerH - gap) * 0.55;
      const bottomH = innerH - gap - topH;
      const bottomW = (innerW - gap) / 2;
      return [
        { x: padding, y: padding, w: innerW, h: topH },
        { x: padding, y: padding + topH + gap, w: bottomW, h: bottomH },
        {
          x: padding + bottomW + gap,
          y: padding + topH + gap,
          w: bottomW,
          h: bottomH,
        },
      ];
    }
    case "splash": {
      const topH = (innerH - gap) * 0.65;
      const bottomH = innerH - gap - topH;
      const bottomW = (innerW - gap * 2) / 3;
      return [
        { x: padding, y: padding, w: innerW, h: topH },
        { x: padding, y: padding + topH + gap, w: bottomW, h: bottomH },
        {
          x: padding + bottomW + gap,
          y: padding + topH + gap,
          w: bottomW,
          h: bottomH,
        },
        {
          x: padding + (bottomW + gap) * 2,
          y: padding + topH + gap,
          w: bottomW,
          h: bottomH,
        },
      ];
    }
    default:
      return [];
  }
}

const STRIP_STYLES: Array<{ id: string; label: string }> = [
  { id: "3h", label: "3-Painel Horizontal" },
  { id: "3v", label: "3-Painel Vertical" },
  { id: "2x2", label: "2x2" },
  { id: "2x3", label: "2x3" },
  { id: "1+2", label: "1 + 2" },
  { id: "splash", label: "Splash" },
];

export function CanvasComicStripPanel({
  fabricCanvas,
}: CanvasComicStripPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [style, setStyle] = useState<string>("3h");
  const [borderWidth, setBorderWidth] = useState<number>(4);
  const [borderColor, setBorderColor] = useState<string>("#000000");
  const [gap, setGap] = useState<number>(12);
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [addNumbers, setAddNumbers] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const canvasW = canvas.getWidth();
      const canvasH = canvas.getHeight();
      const layout = computeStripLayout(style, canvasW, canvasH, gap);

      if (layout.length === 0) {
        toast.error("Layout inválido");
        return;
      }

      layout.forEach((panel, i) => {
        const rect = new f.Rect({
          left: panel.x,
          top: panel.y,
          width: panel.w,
          height: panel.h,
          fill: bgColor,
          stroke: borderColor,
          strokeWidth: borderWidth,
          strokeUniform: true,
          data: { comicStrip: true, panelIndex: i },
        });
        canvas.add(rect);

        if (addNumbers) {
          const numText = new f.IText(String(i + 1), {
            left: panel.x + 12,
            top: panel.y + 8,
            fontSize: Math.max(16, Math.min(panel.w, panel.h) * 0.12),
            fill: borderColor,
            fontWeight: "bold",
            fontFamily: "Arial",
            data: { comicStrip: true, panelIndex: i },
          });
          canvas.add(numText);
        }
      });

      canvas.requestRenderAll();
      toast.success(`Tira de HQ gerada com ${layout.length} painéis`);
    });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((obj: any) => {
      return obj.data && obj.data.comicStrip === true;
    });

    if (objects.length === 0) {
      toast.info("Nenhuma tira para remover");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((obj: any) => canvas.remove(obj));
    canvas.requestRenderAll();
    toast.success(`${objects.length} elementos removidos`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Clapperboard className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Tira de HQ / Comic Strip</h3>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Layout</span>
        <div className="grid grid-cols-2 gap-2">
          {STRIP_STYLES.map((s) => (
            <Button
              key={s.id}
              variant={style === s.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStyle(s.id)}
              className="text-xs"
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="comic-border-width">
          Largura da borda: {borderWidth}px
        </label>
        <input
          id="comic-border-width"
          type="range"
          min={2}
          max={12}
          step={1}
          value={borderWidth}
          onChange={(e) => setBorderWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="comic-border-color">
          Cor da borda
        </label>
        <Input
          id="comic-border-color"
          type="color"
          value={borderColor}
          onChange={(e) => setBorderColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="comic-gap">
          Espaço entre painéis: {gap}px
        </label>
        <input
          id="comic-gap"
          type="range"
          min={5}
          max={40}
          step={1}
          value={gap}
          onChange={(e) => setGap(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="comic-bg-color">
          Cor de fundo do painel
        </label>
        <Input
          id="comic-bg-color"
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="comic-add-numbers"
          type="checkbox"
          checked={addNumbers}
          onChange={(e) => setAddNumbers(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="comic-add-numbers" className="text-xs font-medium">
          Adicionar números nos painéis
        </label>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleGenerate} size="sm" className="w-full">
          Gerar Tira HQ
        </Button>
        <Button
          onClick={handleClear}
          size="sm"
          variant="outline"
          className="w-full"
        >
          Limpar Tira
        </Button>
      </div>
    </div>
  );
}
