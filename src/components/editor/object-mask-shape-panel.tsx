"use client";

import { useEffect, useRef, useState } from "react";
import { Crop } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCircleMask(f: any, cx: number, cy: number, radius: number): any {
  return new f.Circle({
    left: cx - radius,
    top: cy - radius,
    radius,
    originX: "left",
    originY: "top",
    absolutePositioned: true,
  });
}

function buildPolygonMask(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  cx: number,
  cy: number,
  sides: number,
  radius: number,
  rotation: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const points = [];
  const angleStep = (Math.PI * 2) / sides;
  const rotRad = (rotation * Math.PI) / 180;
  for (let i = 0; i < sides; i++) {
    const a = i * angleStep - Math.PI / 2 + rotRad;
    points.push({
      x: cx + Math.cos(a) * radius,
      y: cy + Math.sin(a) * radius,
    });
  }
  return new f.Polygon(points, {
    originX: "left",
    originY: "top",
    absolutePositioned: true,
  });
}

function buildStarMask(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
  rotation: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const pts = [];
  const step = Math.PI / points;
  const rotRad = (rotation * Math.PI) / 180;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2 + rotRad;
    pts.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
    });
  }
  return new f.Polygon(pts, {
    originX: "left",
    originY: "top",
    absolutePositioned: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHeartMask(f: any, cx: number, cy: number, size: number): any {
  const s = size / 100;
  // Heart path, base coords roughly 100x100, then scaled and translated
  const path = `M 50,90 C 20,70 0,45 0,25 C 0,10 10,0 25,0 C 35,0 45,5 50,15 C 55,5 65,0 75,0 C 90,0 100,10 100,25 C 100,45 80,70 50,90 Z`;
  const heart = new f.Path(path, {
    originX: "left",
    originY: "top",
    absolutePositioned: true,
  });
  heart.scale(s);
  heart.set({
    left: cx - 50 * s,
    top: cy - 45 * s,
  });
  return heart;
}

function buildDiamondMask(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const half = size / 2;
  const rotRad = (rotation * Math.PI) / 180;
  const raw = [
    { x: 0, y: -half },
    { x: half, y: 0 },
    { x: 0, y: half },
    { x: -half, y: 0 },
  ];
  const points = raw.map((p) => ({
    x: cx + p.x * Math.cos(rotRad) - p.y * Math.sin(rotRad),
    y: cy + p.x * Math.sin(rotRad) + p.y * Math.cos(rotRad),
  }));
  return new f.Polygon(points, {
    originX: "left",
    originY: "top",
    absolutePositioned: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCustomCurveMask(f: any, cx: number, cy: number, size: number): any {
  const s = size / 100;
  // Free-form curve, blob-like shape on 100x100
  const path = `M 50,5 C 75,10 95,25 95,50 C 95,75 75,95 50,95 C 25,95 5,75 5,50 C 5,25 25,10 50,5 Z`;
  const curve = new f.Path(path, {
    originX: "left",
    originY: "top",
    absolutePositioned: true,
  });
  curve.scale(s);
  curve.set({
    left: cx - 50 * s,
    top: cy - 50 * s,
  });
  return curve;
}

type MaskShape =
  | "circle"
  | "square"
  | "hexagon"
  | "star"
  | "triangle"
  | "heart"
  | "diamond"
  | "custom";

interface ObjectMaskShapePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function ObjectMaskShapePanel({ fabricCanvas }: ObjectMaskShapePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [shape, setShape] = useState<MaskShape>("circle");
  const [maskSize, setMaskSize] = useState<number>(80);
  const [maskRotation, setMaskRotation] = useState<number>(0);
  const [padding, setPadding] = useState<number>(0);

  useEffect(() => {
    queueMicrotask(() => {
      canvasRef.current = fabricCanvas;
    });
  }, [fabricCanvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildMaskForImage(f: any, img: any, type: MaskShape) {
    const bbox = img.getBoundingRect(true, true);
    const cx = bbox.left + bbox.width / 2;
    const cy = bbox.top + bbox.height / 2;
    const baseSize =
      (Math.min(bbox.width, bbox.height) * maskSize) / 100 - padding * 2;
    const radius = baseSize / 2;

    switch (type) {
      case "circle":
        return buildCircleMask(f, cx, cy, radius);
      case "square":
        return buildPolygonMask(f, cx, cy, 4, radius, 45 + maskRotation);
      case "hexagon":
        return buildPolygonMask(f, cx, cy, 6, radius, maskRotation);
      case "triangle":
        return buildPolygonMask(f, cx, cy, 3, radius, maskRotation);
      case "star":
        return buildStarMask(f, cx, cy, radius, radius * 0.5, 5, maskRotation);
      case "heart":
        return buildHeartMask(f, cx, cy, baseSize);
      case "diamond":
        return buildDiamondMask(f, cx, cy, baseSize, maskRotation);
      case "custom":
        return buildCustomCurveMask(f, cx, cy, baseSize);
      default:
        return buildCircleMask(f, cx, cy, radius);
    }
  }

  function applyMask() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active || active.type !== "image") {
      toast.error("Selecione uma imagem");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      const mask = buildMaskForImage(f, active, shape);
      active.set({
        clipPath: mask,
        data: { ...(active.data || {}), maskShape: shape },
      });
      canvas.requestRenderAll();
      toast.success(`Máscara ${shape} aplicada`);
    });
  }

  function removeMask() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active || active.type !== "image") {
      toast.error("Selecione uma imagem");
      return;
    }
    active.set({ clipPath: null });
    const nextData = { ...(active.data || {}) };
    delete nextData.maskShape;
    active.set({ data: nextData });
    canvas.requestRenderAll();
    toast.success("Máscara removida");
  }

  function applyToMultiple() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const active = canvas.getActiveObjects?.() || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = active.filter((o: any) => o.type === "image");
    if (images.length === 0) {
      toast.error("Selecione múltiplas imagens");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      images.forEach((img: any) => {
        const mask = buildMaskForImage(f, img, shape);
        img.set({
          clipPath: mask,
          data: { ...(img.data || {}), maskShape: shape },
        });
      });
      canvas.requestRenderAll();
      toast.success(`Máscara aplicada a ${images.length} imagens`);
    });
  }

  const shapes: { id: MaskShape; label: string }[] = [
    { id: "circle", label: "Círculo" },
    { id: "square", label: "Quadrado" },
    { id: "hexagon", label: "Hexágono" },
    { id: "star", label: "Estrela" },
    { id: "triangle", label: "Triângulo" },
    { id: "heart", label: "Coração" },
    { id: "diamond", label: "Diamante" },
    { id: "custom", label: "Custom Path" },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Crop className="h-5 w-5" />
        <h3 className="text-base font-semibold">Máscara em Forma</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {shapes.map((s) => (
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

      <div className="space-y-2">
        <label className="text-sm font-medium block" htmlFor="mask-size">
          Tamanho da Máscara: {maskSize}%
        </label>
        <input
          id="mask-size"
          type="range"
          min={50}
          max={100}
          value={maskSize}
          onChange={(e) => setMaskSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium block" htmlFor="mask-rotation">
          Rotação: {maskRotation}°
        </label>
        <input
          id="mask-rotation"
          type="range"
          min={0}
          max={360}
          value={maskRotation}
          onChange={(e) => setMaskRotation(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium block" htmlFor="mask-padding">
          Padding: {padding}px
        </label>
        <input
          id="mask-padding"
          type="range"
          min={0}
          max={40}
          value={padding}
          onChange={(e) => setPadding(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={applyMask} className="w-full">
          Aplicar Máscara
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={removeMask}
          className="w-full"
        >
          Remover Máscara
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={applyToMultiple}
          className="w-full"
        >
          Aplicar a Múltiplas Imagens
        </Button>
      </div>
    </div>
  );
}
