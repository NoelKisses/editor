"use client";

import { useEffect, useRef, useState } from "react";
import { BoxSelect } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectIsoExtrudePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

function darkenColor(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(normalized, 16);
  if (Number.isNaN(num)) return hex;
  const factor = Math.max(0, Math.min(100, amount)) / 100;
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.round(r * (1 - factor)));
  g = Math.max(0, Math.round(g * (1 - factor)));
  b = Math.max(0, Math.round(b * (1 - factor)));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function computeIsoOffset(
  depth: number,
  angleDeg: number,
): { dx: number; dy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = depth * Math.cos(rad);
  const dy = -depth * Math.sin(rad);
  return { dx, dy };
}

export function ObjectIsoExtrudePanel({
  fabricCanvas,
}: ObjectIsoExtrudePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [depth, setDepth] = useState<number>(40);
  const [angleDeg, setAngleDeg] = useState<number>(30);
  const [sideColor, setSideColor] = useState<string>("#888888");
  const [topColor, setTopColor] = useState<string>("#aaaaaa");
  const [shading, setShading] = useState<boolean>(true);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active) {
      toast.error("Selecione um objeto");
      return;
    }
    if (active.type !== "rect") {
      toast.error("Apenas objetos retangulares (Rect) são suportados");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric ?? m;
      const rect = active;
      const left = rect.left ?? 0;
      const top = rect.top ?? 0;
      const width = (rect.width ?? 0) * (rect.scaleX ?? 1);
      const height = (rect.height ?? 0) * (rect.scaleY ?? 1);
      const fillColor =
        typeof rect.fill === "string" && rect.fill ? rect.fill : "#cccccc";

      const { dx, dy } = computeIsoOffset(depth, angleDeg);

      const tl = { x: left, y: top };
      const tr = { x: left + width, y: top };
      const br = { x: left + width, y: top + height };

      const topPoints = [
        { x: tl.x, y: tl.y },
        { x: tr.x, y: tr.y },
        { x: tr.x + dx, y: tr.y + dy },
        { x: tl.x + dx, y: tl.y + dy },
      ];

      const sidePoints = [
        { x: tr.x, y: tr.y },
        { x: br.x, y: br.y },
        { x: br.x + dx, y: br.y + dy },
        { x: tr.x + dx, y: tr.y + dy },
      ];

      const finalTopFill = topColor || fillColor;
      const finalSideFill = shading
        ? darkenColor(fillColor, 20)
        : sideColor;

      const topFace = new f.Polygon(topPoints, {
        fill: finalTopFill,
        selectable: true,
        objectCaching: false,
        data: { isoExtrude: true, parentLeft: rect.left },
      });

      const sideFace = new f.Polygon(sidePoints, {
        fill: finalSideFill,
        selectable: true,
        objectCaching: false,
        data: { isoExtrude: true, parentLeft: rect.left },
      });

      canvas.add(topFace);
      canvas.add(sideFace);
      canvas.sendToBack(sideFace);
      canvas.sendToBack(topFace);
      if (typeof rect.bringToFront === "function") {
        rect.bringToFront();
      }
      canvas.requestRenderAll();
      toast.success("Extrusão isométrica aplicada");
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const objs = canvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objs.filter((o: any) => o?.data?.isoExtrude === true);
    if (toRemove.length === 0) {
      toast.info("Nenhuma extrusão encontrada");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${toRemove.length} extrusão(ões) removida(s)`);
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <BoxSelect className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Extrusão Isométrica</h3>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Profundidade: {depth}px</span>
        <Input
          type="range"
          min={10}
          max={100}
          step={1}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Ângulo</span>
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant={angleDeg === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setAngleDeg(30)}
          >
            30° (Clássico)
          </Button>
          <Button
            variant={angleDeg === 45 ? "default" : "outline"}
            size="sm"
            onClick={() => setAngleDeg(45)}
          >
            45° (Cabinet)
          </Button>
          <Button
            variant={angleDeg === 60 ? "default" : "outline"}
            size="sm"
            onClick={() => setAngleDeg(60)}
          >
            60° (Cavalier)
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Cor da face lateral</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={sideColor}
            onChange={(e) => setSideColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border"
          />
          <Input
            type="text"
            value={sideColor}
            onChange={(e) => setSideColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">Cor da face superior</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={topColor}
            onChange={(e) => setTopColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border"
          />
          <Input
            type="text"
            value={topColor}
            onChange={(e) => setTopColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={shading}
          onChange={(e) => setShading(e.target.checked)}
        />
        Sombreamento automático (escurece face lateral 20%)
      </label>

      <div className="flex flex-col gap-2 pt-1">
        <Button onClick={handleApply} size="sm">
          Aplicar Extrusão Iso
        </Button>
        <Button onClick={handleRemove} size="sm" variant="outline">
          Remover Extrusões
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Funciona apenas em objetos do tipo Retângulo (Rect).
      </p>
    </div>
  );
}
