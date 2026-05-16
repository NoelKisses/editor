"use client";

import { useEffect, useRef, useState } from "react";
import { Scissors } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectCutoutShadowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type CutoutStyle = "smooth" | "ragged" | "cardstock" | "sticker";

function generateRaggedPolygon(
  bbox: { left: number; top: number; width: number; height: number },
  jitter: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const { left, top, width, height } = bbox;
  const steps = 8;

  // top edge
  for (let i = 0; i < steps; i++) {
    const x = left + (width * i) / steps + (Math.random() * 2 - 1) * jitter;
    const y = top + (Math.random() * 2 - 1) * jitter;
    points.push({ x, y });
  }
  // right edge
  for (let i = 0; i < steps; i++) {
    const x = left + width + (Math.random() * 2 - 1) * jitter;
    const y = top + (height * i) / steps + (Math.random() * 2 - 1) * jitter;
    points.push({ x, y });
  }
  // bottom edge
  for (let i = steps; i > 0; i--) {
    const x = left + (width * i) / steps + (Math.random() * 2 - 1) * jitter;
    const y = top + height + (Math.random() * 2 - 1) * jitter;
    points.push({ x, y });
  }
  // left edge
  for (let i = steps; i > 0; i--) {
    const x = left + (Math.random() * 2 - 1) * jitter;
    const y = top + (height * i) / steps + (Math.random() * 2 - 1) * jitter;
    points.push({ x, y });
  }

  return points;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectId(obj: any): string {
  if (!obj.__cutoutId) {
    obj.__cutoutId = `cutout-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  return obj.__cutoutId as string;
}

interface OriginalState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shadow: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stroke: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  strokeWidth: any;
}

export function ObjectCutoutShadowPanel({ fabricCanvas }: ObjectCutoutShadowPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalStatesRef = useRef<Map<any, OriginalState>>(new Map());

  const [style, setStyle] = useState<CutoutStyle>("smooth");
  const [shadowColor, setShadowColor] = useState<string>("#000000");
  const [opacity, setOpacity] = useState<number>(0.4);
  const [blur, setBlur] = useState<number>(8);
  const [offsetX, setOffsetX] = useState<number>(5);
  const [offsetY, setOffsetY] = useState<number>(5);
  const [borderWidth, setBorderWidth] = useState<number>(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function applyCutout() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const target = canvas.getActiveObject();
    if (!target) {
      toast.error("Selecione um objeto primeiro");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      if (!f) {
        toast.error("Fabric.js indisponível");
        return;
      }

      const parentId = getObjectId(target);

      // store original state once
      if (!originalStatesRef.current.has(target)) {
        originalStatesRef.current.set(target, {
          shadow: target.shadow ?? null,
          stroke: target.stroke ?? "",
          strokeWidth: target.strokeWidth ?? 0,
        });
      }

      // remove previous cutout extras for this parent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const previous = canvas.getObjects().filter((o: any) => o.data?.cutoutShadow === true && o.data?.parentId === parentId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      previous.forEach((o: any) => canvas.remove(o));

      const shadowRgba = hexToRgba(shadowColor, opacity);

      if (style === "smooth") {
        target.set(
          "shadow",
          new f.Shadow({
            color: shadowRgba,
            blur,
            offsetX,
            offsetY,
          }),
        );
      } else if (style === "ragged") {
        const bbox = target.getBoundingRect(true, true);
        const points = generateRaggedPolygon(
          { left: bbox.left + offsetX, top: bbox.top + offsetY, width: bbox.width, height: bbox.height },
          5,
        );
        const poly = new f.Polygon(points, {
          fill: shadowRgba,
          selectable: false,
          evented: false,
          data: { cutoutShadow: true, parentId },
        });
        canvas.add(poly);
        poly.moveTo(canvas.getObjects().indexOf(target));
        target.set(
          "shadow",
          new f.Shadow({ color: shadowRgba, blur: Math.max(2, blur / 2), offsetX: 0, offsetY: 0 }),
        );
      } else if (style === "cardstock") {
        for (let i = 1; i <= 3; i++) {
          const layer = new f.Rect({
            left: target.left + offsetX * i,
            top: target.top + offsetY * i,
            width: (target.width ?? 100) * (target.scaleX ?? 1),
            height: (target.height ?? 100) * (target.scaleY ?? 1),
            fill: hexToRgba(shadowColor, opacity / i),
            selectable: false,
            evented: false,
            data: { cutoutShadow: true, parentId },
          });
          canvas.add(layer);
          layer.moveTo(canvas.getObjects().indexOf(target));
        }
        target.set(
          "shadow",
          new f.Shadow({ color: shadowRgba, blur, offsetX, offsetY }),
        );
      } else if (style === "sticker") {
        target.set({
          stroke: "#ffffff",
          strokeWidth: borderWidth,
        });
        target.set(
          "shadow",
          new f.Shadow({
            color: shadowRgba,
            blur: blur + 4,
            offsetX,
            offsetY,
          }),
        );
      }

      canvas.requestRenderAll();
      queueMicrotask(() => {
        toast.success("Cutout aplicado");
      });
    }).catch(() => {
      toast.error("Falha ao carregar fabric");
    });
  }

  function removeCutout() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }

    // remove all cutout shadow auxiliary objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extras = canvas.getObjects().filter((o: any) => o.data?.cutoutShadow === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extras.forEach((o: any) => canvas.remove(o));

    // restore originals
    originalStatesRef.current.forEach((orig, obj) => {
      obj.set({
        shadow: null,
        stroke: orig.stroke ?? "",
        strokeWidth: orig.strokeWidth ?? 0,
      });
    });
    originalStatesRef.current.clear();

    canvas.requestRenderAll();
    queueMicrotask(() => {
      toast.success("Cutout removido");
    });
  }

  const styleButtons: Array<{ id: CutoutStyle; label: string }> = [
    { id: "smooth", label: "Papel Liso" },
    { id: "ragged", label: "Papel Rasgado" },
    { id: "cardstock", label: "Cartolina" },
    { id: "sticker", label: "Adesivo (Sticker)" },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Scissors className="h-5 w-5" />
        <h3 className="text-base font-semibold">Sombra de Recorte (Cutout)</h3>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">Estilo de Recorte</span>
        <div className="grid grid-cols-2 gap-2">
          {styleButtons.map((b) => (
            <Button
              key={b.id}
              variant={style === b.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStyle(b.id)}
            >
              {b.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium">Cor da Sombra</span>
        <Input
          type="color"
          value={shadowColor}
          onChange={(e) => setShadowColor(e.target.value)}
          className="h-10 w-full cursor-pointer"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Opacidade</span>
          <span className="text-xs text-muted-foreground">{opacity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Blur</span>
          <span className="text-xs text-muted-foreground">{blur}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={blur}
          onChange={(e) => setBlur(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Offset X</span>
          <span className="text-xs text-muted-foreground">{offsetX}px</span>
        </div>
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={offsetX}
          onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Offset Y</span>
          <span className="text-xs text-muted-foreground">{offsetY}px</span>
        </div>
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={offsetY}
          onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Borda Branca (Sticker)</span>
          <span className="text-xs text-muted-foreground">{borderWidth}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={borderWidth}
          onChange={(e) => setBorderWidth(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={applyCutout}>Aplicar Cutout</Button>
        <Button variant="outline" onClick={removeCutout}>
          Remover Cutout
        </Button>
      </div>
    </div>
  );
}
