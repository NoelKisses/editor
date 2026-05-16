"use client";

import { useEffect, useRef, useState } from "react";
import { Grid2X2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasDotGridBgPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type GridStyle = "dots" | "lines" | "bullet" | "engineering";

function buildDotsTile(
  spacing: number,
  color: string,
  bgColor: string,
  dotSize: number,
): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = spacing;
  tile.height = spacing;
  const ctx = tile.getContext("2d");
  if (!ctx) return tile;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, spacing, spacing);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(spacing / 2, spacing / 2, Math.max(0.5, dotSize / 2), 0, Math.PI * 2);
  ctx.fill();
  return tile;
}

function buildLinesTile(
  spacing: number,
  color: string,
  bgColor: string,
  lineWidth: number,
): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = spacing;
  tile.height = spacing;
  const ctx = tile.getContext("2d");
  if (!ctx) return tile;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, spacing, spacing);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(spacing, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, spacing);
  ctx.stroke();
  return tile;
}

function buildBulletJournalTile(
  spacing: number,
  color: string,
  bgColor: string,
  dotSize: number,
): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = spacing;
  tile.height = spacing;
  const ctx = tile.getContext("2d");
  if (!ctx) return tile;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, spacing, spacing);
  ctx.fillStyle = color;
  const r = Math.max(0.5, dotSize / 2);
  const corners: Array<[number, number]> = [
    [0, 0],
    [spacing, 0],
    [0, spacing],
    [spacing, spacing],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return tile;
}

function buildEngineeringTile(
  spacing: number,
  color: string,
  bgColor: string,
  lineWidth: number,
  majorEvery: number,
): HTMLCanvasElement {
  const size = spacing * majorEvery;
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;
  const ctx = tile.getContext("2d");
  if (!ctx) return tile;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  for (let i = 0; i <= majorEvery; i++) {
    const p = i * spacing;
    if (i === 0 || i === majorEvery) continue;
    ctx.beginPath();
    ctx.moveTo(p + 0.5, 0);
    ctx.lineTo(p + 0.5, size);
    ctx.moveTo(0, p + 0.5);
    ctx.lineTo(size, p + 0.5);
    ctx.stroke();
  }
  ctx.lineWidth = lineWidth * 2;
  ctx.beginPath();
  ctx.moveTo(0.5, 0);
  ctx.lineTo(0.5, size);
  ctx.moveTo(0, 0.5);
  ctx.lineTo(size, 0.5);
  ctx.stroke();
  return tile;
}

export function CanvasDotGridBgPanel({ fabricCanvas }: CanvasDotGridBgPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [style, setStyle] = useState<GridStyle>("dots");
  const [spacing, setSpacing] = useState(25);
  const [color, setColor] = useState("#d1d5db");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(1);
  const [majorEvery, setMajorEvery] = useState(5);
  const [opacity, setOpacity] = useState(0.4);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const applyGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      let tile: HTMLCanvasElement;
      const dotSize = Math.max(1, lineWidth * 1.5);
      if (style === "dots") {
        tile = buildDotsTile(spacing, color, bgColor, dotSize);
      } else if (style === "lines") {
        tile = buildLinesTile(spacing, color, bgColor, lineWidth);
      } else if (style === "bullet") {
        tile = buildBulletJournalTile(spacing, color, bgColor, dotSize);
      } else {
        tile = buildEngineeringTile(spacing, color, bgColor, lineWidth, majorEvery);
      }

      // Remove previous grid
      const existing = canvas.getObjects().filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (o: any) => o?.data?.dotGridBg === true,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existing.forEach((o: any) => canvas.remove(o));

      const pattern = new f.Pattern({
        source: tile,
        repeat: "repeat",
      });

      const w = canvas.getWidth();
      const h = canvas.getHeight();
      const rect = new f.Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        fill: pattern,
        selectable: false,
        evented: false,
        opacity,
        data: { dotGridBg: true },
      });

      canvas.add(rect);
      canvas.sendToBack(rect);
      canvas.requestRenderAll();
      toast.success("Grade aplicada");
    }).catch(() => {
      toast.error("Falha ao carregar fabric");
    });
  };

  const removeGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const existing = canvas.getObjects().filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o: any) => o?.data?.dotGridBg === true,
    );
    if (existing.length === 0) {
      toast.info("Nenhuma grade para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existing.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success("Grade removida");
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <Grid2X2 className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Grade de Pontos / Bullet Journal</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={style === "dots" ? "default" : "outline"}
          size="sm"
          onClick={() => setStyle("dots")}
        >
          Pontos
        </Button>
        <Button
          type="button"
          variant={style === "lines" ? "default" : "outline"}
          size="sm"
          onClick={() => setStyle("lines")}
        >
          Linhas
        </Button>
        <Button
          type="button"
          variant={style === "bullet" ? "default" : "outline"}
          size="sm"
          onClick={() => setStyle("bullet")}
        >
          Bullet Journal
        </Button>
        <Button
          type="button"
          variant={style === "engineering" ? "default" : "outline"}
          size="sm"
          onClick={() => setStyle("engineering")}
        >
          Engenharia
        </Button>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Espaçamento: {spacing}px</label>
        <input
          type="range"
          min={10}
          max={80}
          step={1}
          value={spacing}
          onChange={(e) => setSpacing(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Cor da grade</label>
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Cor de fundo</label>
        <Input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Espessura: {lineWidth.toFixed(1)}
        </label>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.5}
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Linhas maiores a cada: {majorEvery}
        </label>
        <input
          type="range"
          min={2}
          max={10}
          step={1}
          value={majorEvery}
          onChange={(e) => setMajorEvery(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">
          Opacidade: {opacity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Button type="button" size="sm" onClick={applyGrid}>
          Aplicar Grade
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={removeGrid}>
          Remover Grade
        </Button>
      </div>
    </div>
  );
}
