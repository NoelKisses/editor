"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextBalloonCalloutPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type TailPosition = "bottom-right" | "bottom-left" | "top-left" | "top-right";

type ShapeKind =
  | "pill"
  | "rounded-square"
  | "circle"
  | "hexagon"
  | "starburst"
  | "message";

interface BuildOptions {
  width: number;
  height: number;
  tail: TailPosition;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

// ---------- Module-level helpers ----------

function tailAnchor(
  width: number,
  height: number,
  tail: TailPosition,
): { x: number; y: number; tx: number; ty: number } {
  // Returns anchor point on shape edge and tip coordinates of the tail.
  const offset = 30;
  switch (tail) {
    case "bottom-right":
      return {
        x: width * 0.75,
        y: height,
        tx: width * 0.9 + offset,
        ty: height + offset + 10,
      };
    case "bottom-left":
      return {
        x: width * 0.25,
        y: height,
        tx: width * 0.1 - offset,
        ty: height + offset + 10,
      };
    case "top-left":
      return {
        x: width * 0.25,
        y: 0,
        tx: width * 0.1 - offset,
        ty: -offset - 10,
      };
    case "top-right":
      return {
        x: width * 0.75,
        y: 0,
        tx: width * 0.9 + offset,
        ty: -offset - 10,
      };
  }
}

function tailBaseOffsets(
  tail: TailPosition,
  width: number,
  height: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const baseWidth = 24;
  switch (tail) {
    case "bottom-right":
      return {
        x1: width * 0.75 - baseWidth / 2,
        y1: height,
        x2: width * 0.75 + baseWidth / 2,
        y2: height,
      };
    case "bottom-left":
      return {
        x1: width * 0.25 - baseWidth / 2,
        y1: height,
        x2: width * 0.25 + baseWidth / 2,
        y2: height,
      };
    case "top-left":
      return {
        x1: width * 0.25 - baseWidth / 2,
        y1: 0,
        x2: width * 0.25 + baseWidth / 2,
        y2: 0,
      };
    case "top-right":
      return {
        x1: width * 0.75 - baseWidth / 2,
        y1: 0,
        x2: width * 0.75 + baseWidth / 2,
        y2: 0,
      };
  }
}

function buildPillPath(opts: BuildOptions): string {
  const { width, height, tail } = opts;
  const r = height / 2;
  const tip = tailAnchor(width, height, tail);
  const base = tailBaseOffsets(tail, width, height);

  // Pill outline with point integrated
  // Start top-left arc -> top edge -> top-right arc -> right side -> bottom-right arc -> bottom edge -> bottom-left arc -> close
  // We inject the tail along the appropriate edge.
  if (tail === "bottom-right" || tail === "bottom-left") {
    return `M ${r} 0 L ${width - r} 0 A ${r} ${r} 0 0 1 ${width - r} ${height} L ${base.x2} ${height} L ${tip.tx} ${tip.ty} L ${base.x1} ${height} L ${r} ${height} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  }
  return `M ${r} 0 L ${base.x1} 0 L ${tip.tx} ${tip.ty} L ${base.x2} 0 L ${width - r} 0 A ${r} ${r} 0 0 1 ${width - r} ${height} L ${r} ${height} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

function buildRoundedSquarePath(opts: BuildOptions): string {
  const { width, height, tail } = opts;
  const r = 24;
  const tip = tailAnchor(width, height, tail);
  const base = tailBaseOffsets(tail, width, height);

  if (tail === "bottom-right" || tail === "bottom-left") {
    return `M ${r} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} L ${base.x2} ${height} L ${tip.tx} ${tip.ty} L ${base.x1} ${height} L ${r} ${height} Q 0 ${height} 0 ${height - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
  }
  return `M ${r} 0 L ${base.x1} 0 L ${tip.tx} ${tip.ty} L ${base.x2} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} L ${r} ${height} Q 0 ${height} 0 ${height - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
}

function buildCirclePath(opts: BuildOptions): string {
  const { width, height, tail } = opts;
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;
  const tip = tailAnchor(width, height, tail);

  // Approximate ellipse via two arcs, then attach a triangle tail
  // We draw the ellipse and add the tail as a separate path segment.
  // Using two arcs to form the ellipse.
  let baseAngle1 = 0;
  let baseAngle2 = 0;
  switch (tail) {
    case "bottom-right":
      baseAngle1 = Math.PI * 0.15;
      baseAngle2 = Math.PI * 0.45;
      break;
    case "bottom-left":
      baseAngle1 = Math.PI * 0.55;
      baseAngle2 = Math.PI * 0.85;
      break;
    case "top-left":
      baseAngle1 = Math.PI * 1.15;
      baseAngle2 = Math.PI * 1.45;
      break;
    case "top-right":
      baseAngle1 = Math.PI * 1.55;
      baseAngle2 = Math.PI * 1.85;
      break;
  }

  const p1x = cx + rx * Math.cos(baseAngle1);
  const p1y = cy + ry * Math.sin(baseAngle1);
  const p2x = cx + rx * Math.cos(baseAngle2);
  const p2y = cy + ry * Math.sin(baseAngle2);

  // Start at top of ellipse, draw around, but insert tail between p1 and p2.
  return `M ${cx} 0 A ${rx} ${ry} 0 0 1 ${p1x} ${p1y} L ${tip.tx} ${tip.ty} L ${p2x} ${p2y} A ${rx} ${ry} 0 0 1 ${cx} ${height} A ${rx} ${ry} 0 0 1 ${cx} 0 Z`;
}

function buildHexagonPath(opts: BuildOptions): string {
  const { width, height, tail } = opts;
  const tip = tailAnchor(width, height, tail);
  const inset = width * 0.15;

  // Hex points (clockwise from top-left)
  const points = [
    { x: inset, y: 0 },
    { x: width - inset, y: 0 },
    { x: width, y: height / 2 },
    { x: width - inset, y: height },
    { x: inset, y: height },
    { x: 0, y: height / 2 },
  ];

  // Insert tail at appropriate edge by injecting two extra vertices
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const isBottomEdge = prev.y === height && curr.y === height;
    const isTopEdge = prev.y === 0 && curr.y === 0;
    const wantBottom = tail === "bottom-right" || tail === "bottom-left";
    const wantTop = tail === "top-left" || tail === "top-right";

    if ((isBottomEdge && wantBottom) || (isTopEdge && wantTop)) {
      const base = tailBaseOffsets(tail, width, height);
      path += ` L ${base.x1} ${prev.y} L ${tip.tx} ${tip.ty} L ${base.x2} ${prev.y}`;
    }
    path += ` L ${curr.x} ${curr.y}`;
  }
  path += " Z";
  return path;
}

function buildStarburstPath(opts: BuildOptions): string {
  const { width, height, tail } = opts;
  const cx = width / 2;
  const cy = height / 2;
  const outerRx = width / 2;
  const outerRy = height / 2;
  const innerRx = outerRx * 0.78;
  const innerRy = outerRy * 0.78;
  const spikes = 16;
  const tip = tailAnchor(width, height, tail);

  let path = "";
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const rx = isOuter ? outerRx : innerRx;
    const ry = isOuter ? outerRy : innerRy;
    pts.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
  }

  // Insert tail near appropriate spike
  let insertIdx = 0;
  switch (tail) {
    case "bottom-right":
      insertIdx = Math.floor(spikes * 2 * 0.3);
      break;
    case "bottom-left":
      insertIdx = Math.floor(spikes * 2 * 0.7);
      break;
    case "top-left":
      insertIdx = Math.floor(spikes * 2 * 0.85);
      break;
    case "top-right":
      insertIdx = Math.floor(spikes * 2 * 0.15);
      break;
  }

  path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    if (i === insertIdx) {
      path += ` L ${tip.tx} ${tip.ty}`;
    }
    path += ` L ${pts[i].x} ${pts[i].y}`;
  }
  path += " Z";
  return path;
}

function buildMessagePath(opts: BuildOptions): string {
  const { width, height, tail } = opts;
  const r = 18;
  const tailW = 18;
  const tailH = 22;

  // SMS-style bubble with a curvy tail near bottom corner
  switch (tail) {
    case "bottom-right":
      return `M ${r} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} L ${width - r - tailW * 2} ${height} Q ${width - r - tailW} ${height + tailH * 0.4} ${width - r} ${height + tailH} Q ${width - r - tailW * 1.5} ${height + tailH * 0.2} ${width - r - tailW * 2.5} ${height} L ${r} ${height} Q 0 ${height} 0 ${height - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
    case "bottom-left":
      return `M ${r} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} L ${r + tailW * 2.5} ${height} Q ${r + tailW * 1.5} ${height + tailH * 0.2} ${r} ${height + tailH} Q ${r + tailW} ${height + tailH * 0.4} ${r + tailW * 2} ${height} L ${r} ${height} Q 0 ${height} 0 ${height - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
    case "top-left":
      return `M ${r} 0 L ${r + tailW * 2} 0 Q ${r + tailW} ${-tailH * 0.4} ${r} ${-tailH} Q ${r + tailW * 1.5} ${-tailH * 0.2} ${r + tailW * 2.5} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} L ${r} ${height} Q 0 ${height} 0 ${height - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
    case "top-right":
      return `M ${r} 0 L ${width - r - tailW * 2.5} 0 Q ${width - r - tailW * 1.5} ${-tailH * 0.2} ${width - r} ${-tailH} Q ${width - r - tailW} ${-tailH * 0.4} ${width - r - tailW * 2} 0 L ${width - r} 0 Q ${width} 0 ${width} ${r} L ${width} ${height - r} Q ${width} ${height} ${width - r} ${height} L ${r} ${height} Q 0 ${height} 0 ${height - r} L 0 ${r} Q 0 0 ${r} 0 Z`;
  }
}

function buildShapePath(kind: ShapeKind, opts: BuildOptions): string {
  switch (kind) {
    case "pill":
      return buildPillPath(opts);
    case "rounded-square":
      return buildRoundedSquarePath(opts);
    case "circle":
      return buildCirclePath(opts);
    case "hexagon":
      return buildHexagonPath(opts);
    case "starburst":
      return buildStarburstPath(opts);
    case "message":
      return buildMessagePath(opts);
  }
}

function shapeHeightFor(kind: ShapeKind, width: number): number {
  switch (kind) {
    case "pill":
      return Math.max(60, width * 0.32);
    case "circle":
      return width * 0.7;
    case "starburst":
      return width;
    case "hexagon":
      return width * 0.6;
    case "message":
      return Math.max(80, width * 0.45);
    case "rounded-square":
    default:
      return Math.max(90, width * 0.5);
  }
}

const SHAPES: { kind: ShapeKind; label: string }[] = [
  { kind: "pill", label: "Retângulo Pílula" },
  { kind: "rounded-square", label: "Quadrado Suave" },
  { kind: "circle", label: "Círculo" },
  { kind: "hexagon", label: "Hexágono" },
  { kind: "starburst", label: "Estrela Burst" },
  { kind: "message", label: "Mensagem" },
];

const TAILS: { value: TailPosition; label: string }[] = [
  { value: "bottom-right", label: "↘ Inf. Direita" },
  { value: "bottom-left", label: "↙ Inf. Esquerda" },
  { value: "top-left", label: "↖ Sup. Esquerda" },
  { value: "top-right", label: "↗ Sup. Direita" },
];

// ---------- Component ----------

export function TextBalloonCalloutPanel({
  fabricCanvas,
}: TextBalloonCalloutPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [shape, setShape] = useState<ShapeKind>("pill");
  const [text, setText] = useState("Veja isso!");
  const [tail, setTail] = useState<TailPosition>("bottom-right");
  const [bgColor, setBgColor] = useState("#facc15");
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [borderColor, setBorderColor] = useState("#1a1a1a");
  const [borderWidth, setBorderWidth] = useState(2);
  const [fontSize, setFontSize] = useState(20);
  const [bold, setBold] = useState(true);
  const [width, setWidth] = useState(240);

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
      const f = (m as any).fabric as any;
      if (!f) {
        toast.error("Falha ao carregar Fabric.js");
        return;
      }

      const h = shapeHeightFor(shape, width);
      const opts: BuildOptions = {
        width,
        height: h,
        tail,
        fill: bgColor,
        stroke: borderColor,
        strokeWidth: borderWidth,
      };

      const pathStr = buildShapePath(shape, opts);
      const shapeObj = new f.Path(pathStr, {
        fill: bgColor,
        stroke: borderColor,
        strokeWidth: borderWidth,
        strokeLineJoin: "round",
        strokeLineCap: "round",
        originX: "left",
        originY: "top",
      });

      const itext = new f.IText(text, {
        fontSize,
        fill: textColor,
        fontWeight: bold ? "bold" : "normal",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        originX: "center",
        originY: "center",
        left: width / 2,
        top: h / 2,
        width: width * 0.85,
      });

      const group = new f.Group([shapeObj, itext], {
        left: (canvas.getWidth?.() ?? 800) / 2,
        top: (canvas.getHeight?.() ?? 600) / 2,
        originX: "center",
        originY: "center",
        data: { balloonCallout: true },
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll?.();
      toast.success("Callout adicionado");
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const objects = canvas.getObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objects.filter((o: any) => o?.data?.balloonCallout === true);
    if (toRemove.length === 0) {
      toast.info("Nenhum callout para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll?.();
    toast.success(`${toRemove.length} callout(s) removido(s)`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-base font-semibold">Callout & Balão de Diálogo</h3>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">Formato</span>
        <div className="grid grid-cols-2 gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.kind}
              type="button"
              onClick={() => setShape(s.kind)}
              className={`rounded border px-3 py-2 text-xs transition ${
                shape === s.kind
                  ? "border-blue-500 bg-blue-50 font-semibold"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium">Texto</span>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Veja isso!"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">Posição da Ponta</span>
        <div className="grid grid-cols-2 gap-2">
          {TAILS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTail(t.value)}
              className={`rounded border px-3 py-2 text-xs transition ${
                tail === t.value
                  ? "border-blue-500 bg-blue-50 font-semibold"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className="mb-1 block text-xs font-medium">Fundo</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border border-gray-300"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium">Texto</span>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border border-gray-300"
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium">Borda</span>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border border-gray-300"
          />
        </div>
      </div>

      <div>
        <span className="mb-1 flex justify-between text-sm font-medium">
          <span>Espessura da Borda</span>
          <span className="text-xs text-gray-500">{borderWidth}px</span>
        </span>
        <input
          type="range"
          min={0}
          max={6}
          step={1}
          value={borderWidth}
          onChange={(e) => setBorderWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <span className="mb-1 flex justify-between text-sm font-medium">
          <span>Tamanho da Fonte</span>
          <span className="text-xs text-gray-500">{fontSize}px</span>
        </span>
        <input
          type="range"
          min={12}
          max={48}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <span className="mb-1 flex justify-between text-sm font-medium">
          <span>Largura</span>
          <span className="text-xs text-gray-500">{width}px</span>
        </span>
        <input
          type="range"
          min={100}
          max={500}
          step={10}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={bold}
          onChange={(e) => setBold(e.target.checked)}
          className="h-4 w-4 cursor-pointer"
        />
        <span>Negrito</span>
      </label>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleAdd} className="w-full">
          Adicionar Callout
        </Button>
        <Button
          onClick={handleRemove}
          variant="outline"
          className="w-full"
        >
          Remover Callouts
        </Button>
      </div>
    </div>
  );
}
