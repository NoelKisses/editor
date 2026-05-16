"use client";

import { useEffect, useRef, useState } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BurstStyle =
  | "saleTag"
  | "seloStamp"
  | "explosao"
  | "mira"
  | "diamantes"
  | "margarida";

const BURST_STYLES: { id: BurstStyle; label: string }[] = [
  { id: "saleTag", label: "Sale Tag" },
  { id: "seloStamp", label: "Selo Stamp" },
  { id: "explosao", label: "Explosão" },
  { id: "mira", label: "Mira" },
  { id: "diamantes", label: "Diamantes" },
  { id: "margarida", label: "Margarida" },
];

function salePointsArray(
  spikes: number,
  outerR: number,
  innerR: number,
  cx: number,
  cy: number,
): number[] {
  const points: number[] = [];
  const total = spikes * 2;
  const step = (Math.PI * 2) / total;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    points.push(cx + Math.cos(angle) * r);
    points.push(cy + Math.sin(angle) * r);
  }
  return points;
}

function irregularStarPoints(
  spikes: number,
  outerR: number,
  innerR: number,
  cx: number,
  cy: number,
  jitter: number,
): number[] {
  const points: number[] = [];
  const total = spikes * 2;
  const step = (Math.PI * 2) / total;
  for (let i = 0; i < total; i++) {
    const baseR = i % 2 === 0 ? outerR : innerR;
    const variance = 1 + (Math.random() * 2 - 1) * jitter;
    const r = baseR * variance;
    const angle = i * step - Math.PI / 2;
    points.push(cx + Math.cos(angle) * r);
    points.push(cy + Math.sin(angle) * r);
  }
  return points;
}

function serratedCirclePoints(
  teeth: number,
  outerR: number,
  innerR: number,
  cx: number,
  cy: number,
): number[] {
  const points: number[] = [];
  const total = teeth * 2;
  const step = (Math.PI * 2) / total;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    points.push(cx + Math.cos(angle) * r);
    points.push(cy + Math.sin(angle) * r);
  }
  return points;
}

interface CanvasBurstRadialPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasBurstRadialPanel({
  fabricCanvas,
}: CanvasBurstRadialPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [style, setStyle] = useState<BurstStyle>("saleTag");
  const [centerText, setCenterText] = useState("50% OFF");
  const [bgColor, setBgColor] = useState("#ef4444");
  const [textColor, setTextColor] = useState("#ffffff");
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [borderWidth, setBorderWidth] = useState(3);
  const [burstSize, setBurstSize] = useState(180);
  const [spikeCount, setSpikeCount] = useState(12);
  const [innerRatio, setInnerRatio] = useState(0.6);
  const [rotation, setRotation] = useState(0);
  const [fontSize, setFontSize] = useState(22);
  const [bold, setBold] = useState(true);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleAdd = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;

      const outerR = burstSize / 2;
      const innerR = outerR * innerRatio;
      const cx = outerR;
      const cy = outerR;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shapes: any[] = [];

      if (style === "saleTag") {
        const pts = salePointsArray(spikeCount, outerR, innerR, cx, cy);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const polyPts = [];
        for (let i = 0; i < pts.length; i += 2) {
          polyPts.push({ x: pts[i], y: pts[i + 1] });
        }
        const poly = new f.Polygon(polyPts, {
          fill: bgColor,
          stroke: borderColor,
          strokeWidth: borderWidth,
          originX: "left",
          originY: "top",
        });
        shapes.push(poly);
      } else if (style === "seloStamp") {
        const teeth = Math.max(spikeCount, 16);
        const pts = serratedCirclePoints(
          teeth,
          outerR,
          outerR * 0.9,
          cx,
          cy,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const polyPts = [];
        for (let i = 0; i < pts.length; i += 2) {
          polyPts.push({ x: pts[i], y: pts[i + 1] });
        }
        const poly = new f.Polygon(polyPts, {
          fill: bgColor,
          stroke: borderColor,
          strokeWidth: borderWidth,
          originX: "left",
          originY: "top",
        });
        shapes.push(poly);
      } else if (style === "explosao") {
        const pts = irregularStarPoints(
          spikeCount,
          outerR,
          innerR,
          cx,
          cy,
          0.2,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const polyPts = [];
        for (let i = 0; i < pts.length; i += 2) {
          polyPts.push({ x: pts[i], y: pts[i + 1] });
        }
        const poly = new f.Polygon(polyPts, {
          fill: bgColor,
          stroke: borderColor,
          strokeWidth: borderWidth,
          originX: "left",
          originY: "top",
        });
        shapes.push(poly);
      } else if (style === "mira") {
        const c1 = new f.Circle({
          radius: outerR,
          fill: bgColor,
          stroke: borderColor,
          strokeWidth: borderWidth,
          left: 0,
          top: 0,
          originX: "left",
          originY: "top",
        });
        const c2 = new f.Circle({
          radius: outerR * 0.7,
          fill: borderColor,
          stroke: bgColor,
          strokeWidth: borderWidth,
          left: outerR * 0.3,
          top: outerR * 0.3,
          originX: "left",
          originY: "top",
        });
        const c3 = new f.Circle({
          radius: outerR * 0.4,
          fill: bgColor,
          stroke: borderColor,
          strokeWidth: borderWidth,
          left: outerR * 0.6,
          top: outerR * 0.6,
          originX: "left",
          originY: "top",
        });
        shapes.push(c1, c2, c3);
      } else if (style === "diamantes") {
        const longR = outerR;
        const shortR = innerR * 0.6;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const polyPts: { x: number; y: number }[] = [];
        const angles = [
          -Math.PI / 2,
          0,
          Math.PI / 2,
          Math.PI,
        ];
        for (let i = 0; i < 4; i++) {
          const a = angles[i];
          polyPts.push({
            x: cx + Math.cos(a) * longR,
            y: cy + Math.sin(a) * longR,
          });
          const aMid = a + Math.PI / 4;
          polyPts.push({
            x: cx + Math.cos(aMid) * shortR,
            y: cy + Math.sin(aMid) * shortR,
          });
        }
        const poly = new f.Polygon(polyPts, {
          fill: bgColor,
          stroke: borderColor,
          strokeWidth: borderWidth,
          originX: "left",
          originY: "top",
        });
        shapes.push(poly);
      } else if (style === "margarida") {
        const petals = 8;
        const petalRx = outerR * 0.5;
        const petalRy = outerR * 0.25;
        for (let i = 0; i < petals; i++) {
          const a = (i / petals) * Math.PI * 2;
          const px = cx + Math.cos(a) * (outerR * 0.45) - petalRx;
          const py = cy + Math.sin(a) * (outerR * 0.45) - petalRy;
          const ellipse = new f.Ellipse({
            rx: petalRx,
            ry: petalRy,
            fill: bgColor,
            stroke: borderColor,
            strokeWidth: borderWidth,
            left: px,
            top: py,
            angle: (a * 180) / Math.PI,
            originX: "left",
            originY: "top",
          });
          shapes.push(ellipse);
        }
        const centerCircle = new f.Circle({
          radius: outerR * 0.35,
          fill: bgColor,
          stroke: borderColor,
          strokeWidth: borderWidth,
          left: cx - outerR * 0.35,
          top: cy - outerR * 0.35,
          originX: "left",
          originY: "top",
        });
        shapes.push(centerCircle);
      }

      const text = new f.IText(centerText, {
        fontSize,
        fill: textColor,
        fontWeight: bold ? "bold" : "normal",
        originX: "center",
        originY: "center",
        left: cx,
        top: cy,
        textAlign: "center",
      });
      shapes.push(text);

      const group = new f.Group(shapes, {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: "center",
        originY: "center",
        angle: rotation,
        data: { burstRadial: true },
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      toast.success("Burst adicionado");
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((o: any) => o?.data?.burstRadial === true);
    objects.forEach((o: unknown) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${objects.length} burst(s) removido(s)`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        <h3 className="font-semibold">Burst Radial / Explosão</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estilo</label>
        <div className="grid grid-cols-2 gap-2">
          {BURST_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`rounded border px-2 py-1 text-xs ${
                style === s.id
                  ? "border-blue-500 bg-blue-500/20"
                  : "border-gray-600"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Texto Central</label>
        <Input
          value={centerText}
          onChange={(e) => setCenterText(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs">Fundo</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-8 w-full rounded border"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs">Texto</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="h-8 w-full rounded border"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs">Borda</label>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="h-8 w-full rounded border"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs">Espessura Borda: {borderWidth}px</label>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={borderWidth}
          onChange={(e) => setBorderWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs">Tamanho: {burstSize}px</label>
        <input
          type="range"
          min={80}
          max={400}
          step={1}
          value={burstSize}
          onChange={(e) => setBurstSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs">Pontas: {spikeCount}</label>
        <input
          type="range"
          min={4}
          max={24}
          step={1}
          value={spikeCount}
          onChange={(e) => setSpikeCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs">Raio Interno: {innerRatio.toFixed(2)}</label>
        <input
          type="range"
          min={0.3}
          max={0.9}
          step={0.05}
          value={innerRatio}
          onChange={(e) => setInnerRatio(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs">Rotação: {rotation}°</label>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs">Tamanho Fonte: {fontSize}px</label>
        <input
          type="range"
          min={10}
          max={48}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={bold}
          onChange={(e) => setBold(e.target.checked)}
        />
        Negrito
      </label>

      <div className="flex flex-col gap-2">
        <Button onClick={handleAdd}>Adicionar Burst</Button>
        <Button variant="outline" onClick={handleRemove}>
          Remover Bursts
        </Button>
      </div>
    </div>
  );
}
