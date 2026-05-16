"use client";

import { useEffect, useRef, useState } from "react";
import { Wallpaper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PatternType =
  | "dots"
  | "diagonal"
  | "checker"
  | "triangles"
  | "hexagonal"
  | "waves"
  | "crosses"
  | "herringbone";

interface PatternOption {
  id: PatternType;
  label: string;
}

const PATTERN_OPTIONS: PatternOption[] = [
  { id: "dots", label: "Bolinhas" },
  { id: "diagonal", label: "Listras Diagonais" },
  { id: "checker", label: "Quadriculado" },
  { id: "triangles", label: "Triângulos" },
  { id: "hexagonal", label: "Hexagonal" },
  { id: "waves", label: "Ondas" },
  { id: "crosses", label: "Cruzes" },
  { id: "herringbone", label: "Espiga" },
];

function createTileCanvas(size: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  return { canvas, ctx };
}

function fillBackground(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
}

function buildDotsTile(
  size: number,
  color1: string,
  color2: string,
  strokeWidth: number,
): HTMLCanvasElement {
  const { canvas, ctx } = createTileCanvas(size);
  fillBackground(ctx, size, color1);
  ctx.fillStyle = color2;
  const radius = Math.max(1, strokeWidth);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
  ctx.fill();
  // corner dots for seamless tiling
  for (const [cx, cy] of [
    [0, 0],
    [size, 0],
    [0, size],
    [size, size],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

function buildDiagonalStripesTile(
  size: number,
  color1: string,
  color2: string,
  strokeWidth: number,
): HTMLCanvasElement {
  const { canvas, ctx } = createTileCanvas(size);
  fillBackground(ctx, size, color1);
  ctx.strokeStyle = color2;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.moveTo(-1, size + 1);
  ctx.lineTo(size + 1, -1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-1, 1);
  ctx.lineTo(1, -1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size - 1, size + 1);
  ctx.lineTo(size + 1, size - 1);
  ctx.stroke();
  return canvas;
}

function buildCheckerTile(
  size: number,
  color1: string,
  color2: string,
): HTMLCanvasElement {
  const { canvas, ctx } = createTileCanvas(size);
  fillBackground(ctx, size, color1);
  const half = size / 2;
  ctx.fillStyle = color2;
  ctx.fillRect(0, 0, half, half);
  ctx.fillRect(half, half, half, half);
  return canvas;
}

function buildTrianglesTile(
  size: number,
  color1: string,
  color2: string,
): HTMLCanvasElement {
  const { canvas, ctx } = createTileCanvas(size);
  fillBackground(ctx, size, color1);
  ctx.fillStyle = color2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.fill();
  return canvas;
}

function buildHexagonalTile(
  size: number,
  color1: string,
  color2: string,
  strokeWidth: number,
): HTMLCanvasElement {
  const { canvas, ctx } = createTileCanvas(size);
  fillBackground(ctx, size, color1);
  ctx.strokeStyle = color2;
  ctx.lineWidth = strokeWidth;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  return canvas;
}

function buildWavesTile(
  size: number,
  color1: string,
  color2: string,
  strokeWidth: number,
): HTMLCanvasElement {
  const { canvas, ctx } = createTileCanvas(size);
  fillBackground(ctx, size, color1);
  ctx.strokeStyle = color2;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  const midY = size / 2;
  const amp = size / 6;
  ctx.moveTo(0, midY);
  for (let x = 0; x <= size; x++) {
    const y = midY + Math.sin((x / size) * Math.PI * 2) * amp;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  return canvas;
}

function buildCrossesTile(
  size: number,
  color1: string,
  color2: string,
): HTMLCanvasElement {
  const { canvas, ctx } = createTileCanvas(size);
  fillBackground(ctx, size, color1);
  ctx.fillStyle = color2;
  const armLen = size / 3;
  const armThick = Math.max(2, size / 10);
  const cx = size / 2;
  const cy = size / 2;
  ctx.fillRect(cx - armThick / 2, cy - armLen / 2, armThick, armLen);
  ctx.fillRect(cx - armLen / 2, cy - armThick / 2, armLen, armThick);
  return canvas;
}

function buildHerringboneTile(
  size: number,
  color1: string,
  color2: string,
): HTMLCanvasElement {
  const { canvas, ctx } = createTileCanvas(size);
  fillBackground(ctx, size, color1);
  ctx.fillStyle = color2;
  const half = size / 2;
  const thick = Math.max(2, size / 8);
  // top-left: horizontal brick
  ctx.fillRect(0, half / 2 - thick / 2, half, thick);
  // top-right: vertical brick
  ctx.fillRect(half + half / 2 - thick / 2, 0, thick, half);
  // bottom-left: vertical brick
  ctx.fillRect(half / 2 - thick / 2, half, thick, half);
  // bottom-right: horizontal brick
  ctx.fillRect(half, half + half / 2 - thick / 2, half, thick);
  return canvas;
}

function buildTile(
  type: PatternType,
  size: number,
  color1: string,
  color2: string,
  strokeWidth: number,
): HTMLCanvasElement {
  switch (type) {
    case "dots":
      return buildDotsTile(size, color1, color2, strokeWidth);
    case "diagonal":
      return buildDiagonalStripesTile(size, color1, color2, strokeWidth);
    case "checker":
      return buildCheckerTile(size, color1, color2);
    case "triangles":
      return buildTrianglesTile(size, color1, color2);
    case "hexagonal":
      return buildHexagonalTile(size, color1, color2, strokeWidth);
    case "waves":
      return buildWavesTile(size, color1, color2, strokeWidth);
    case "crosses":
      return buildCrossesTile(size, color1, color2);
    case "herringbone":
      return buildHerringboneTile(size, color1, color2);
  }
}

interface CanvasNoisePatternBgPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasNoisePatternBgPanel({
  fabricCanvas,
}: CanvasNoisePatternBgPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [patternType, setPatternType] = useState<PatternType>("dots");
  const [tileSize, setTileSize] = useState<number>(30);
  const [color1, setColor1] = useState<string>("#ffffff");
  const [color2, setColor2] = useState<string>("#f3f4f6");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [opacity, setOpacity] = useState<number>(1);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        if (!f) {
          toast.error("Fabric não carregado");
          return;
        }
        const tile = buildTile(
          patternType,
          tileSize,
          color1,
          color2,
          strokeWidth,
        );
        const pattern = new f.Pattern({
          source: tile,
          repeat: "repeat",
        });
        const width =
          typeof canvas.getWidth === "function"
            ? canvas.getWidth()
            : canvas.width;
        const height =
          typeof canvas.getHeight === "function"
            ? canvas.getHeight()
            : canvas.height;
        // remove existing noise bg first
        const existing = (canvas.getObjects?.() ?? []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (obj: any) => obj?.data?.noiseBg === true,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existing.forEach((obj: any) => canvas.remove(obj));

        const rect = new f.Rect({
          left: 0,
          top: 0,
          width,
          height,
          fill: pattern,
          opacity,
          selectable: false,
          evented: false,
          data: { noiseBg: true },
        });
        canvas.add(rect);
        if (typeof canvas.sendToBack === "function") {
          canvas.sendToBack(rect);
        }
        canvas.requestRenderAll?.();
        toast.success("Padrão aplicado");
      })
      .catch(() => {
        toast.error("Falha ao carregar Fabric");
      });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const objects = canvas.getObjects?.() ?? [];
    const toRemove = objects.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj: any) => obj?.data?.noiseBg === true,
    );
    if (toRemove.length === 0) {
      toast.info("Nenhum padrão para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((obj: any) => canvas.remove(obj));
    canvas.requestRenderAll?.();
    toast.success("Padrão removido");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Wallpaper className="h-5 w-5" />
        <h3 className="text-sm font-semibold">
          Fundo de Padrão (Noise/Pattern)
        </h3>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium">Tipo de Padrão</span>
        <div className="grid grid-cols-2 gap-2">
          {PATTERN_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant={patternType === opt.id ? "default" : "outline"}
              size="sm"
              onClick={() => setPatternType(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">
          Tamanho do Tile: {tileSize}px
        </span>
        <input
          type="range"
          min={10}
          max={80}
          step={1}
          value={tileSize}
          onChange={(e) => setTileSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="mb-1 block text-xs font-medium">Cor 1</span>
          <Input
            type="color"
            value={color1}
            onChange={(e) => setColor1(e.target.value)}
            className="h-9 w-full"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium">Cor 2</span>
          <Input
            type="color"
            value={color2}
            onChange={(e) => setColor2(e.target.value)}
            className="h-9 w-full"
          />
        </div>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">
          Espessura: {strokeWidth}px
        </span>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium">
          Opacidade: {opacity.toFixed(2)}
        </span>
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleApply}>
          Aplicar Padrão
        </Button>
        <Button type="button" variant="outline" onClick={handleRemove}>
          Remover Padrão
        </Button>
      </div>
    </div>
  );
}
