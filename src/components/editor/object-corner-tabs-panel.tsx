"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ObjectCornerTabsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type Corner = "tl" | "tr" | "bl" | "br";
type ShapeStyle = "triangle" | "rect" | "circle" | "star" | "serrated" | "label";

interface BuilderOptions {
  size: number;
  bgColor: string;
  textColor: string;
  fontSize: number;
  bold: boolean;
  text: string;
  corner: Corner;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTriangleTab(f: any, opts: BuilderOptions): any[] {
  const { size, bgColor, textColor, fontSize, bold, text, corner } = opts;
  let points: { x: number; y: number }[] = [];
  let textAngle = -45;
  let textOffset = { x: size / 2, y: size / 2 };

  if (corner === "tl") {
    points = [{ x: 0, y: 0 }, { x: size, y: 0 }, { x: 0, y: size }];
    textAngle = -45;
    textOffset = { x: size * 0.3, y: size * 0.3 };
  } else if (corner === "tr") {
    points = [{ x: 0, y: 0 }, { x: size, y: 0 }, { x: size, y: size }];
    textAngle = 45;
    textOffset = { x: size * 0.7, y: size * 0.3 };
  } else if (corner === "bl") {
    points = [{ x: 0, y: 0 }, { x: 0, y: size }, { x: size, y: size }];
    textAngle = 45;
    textOffset = { x: size * 0.3, y: size * 0.7 };
  } else {
    points = [{ x: size, y: 0 }, { x: size, y: size }, { x: 0, y: size }];
    textAngle = -45;
    textOffset = { x: size * 0.7, y: size * 0.7 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polygon = new f.Polygon(points, {
    fill: bgColor,
    left: 0,
    top: 0,
    selectable: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = new f.IText(text, {
    left: textOffset.x,
    top: textOffset.y,
    fill: textColor,
    fontSize,
    fontWeight: bold ? "bold" : "normal",
    angle: textAngle,
    originX: "center",
    originY: "center",
    selectable: false,
  });

  return [polygon, label];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRectTab(f: any, opts: BuilderOptions): any[] {
  const { size, bgColor, textColor, fontSize, bold, text } = opts;
  const width = size;
  const height = Math.max(20, fontSize + 12);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rect = new f.Rect({
    width,
    height,
    fill: bgColor,
    left: 0,
    top: 0,
    selectable: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = new f.IText(text, {
    left: width / 2,
    top: height / 2,
    fill: textColor,
    fontSize,
    fontWeight: bold ? "bold" : "normal",
    originX: "center",
    originY: "center",
    selectable: false,
  });

  return [rect, label];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCircleTab(f: any, opts: BuilderOptions): any[] {
  const { size, bgColor, textColor, fontSize, bold, text } = opts;
  const radius = size / 2;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circle = new f.Circle({
    radius,
    fill: bgColor,
    left: 0,
    top: 0,
    selectable: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = new f.IText(text, {
    left: radius,
    top: radius,
    fill: textColor,
    fontSize,
    fontWeight: bold ? "bold" : "normal",
    originX: "center",
    originY: "center",
    selectable: false,
  });

  return [circle, label];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStarTab(f: any, opts: BuilderOptions): any[] {
  const { size, bgColor, textColor, fontSize, bold, text } = opts;
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2;
  const inner = outer * 0.45;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const star = new f.Polygon(points, {
    fill: bgColor,
    left: 0,
    top: 0,
    selectable: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = new f.IText(text, {
    left: cx,
    top: cy,
    fill: textColor,
    fontSize,
    fontWeight: bold ? "bold" : "normal",
    originX: "center",
    originY: "center",
    selectable: false,
  });

  return [star, label];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSerratedTab(f: any, opts: BuilderOptions): any[] {
  const { size, bgColor, textColor, fontSize, bold, text } = opts;
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2;
  const inner = outer * 0.85;
  const teeth = 16;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / teeth) * i - Math.PI / 2;
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stamp = new f.Polygon(points, {
    fill: bgColor,
    left: 0,
    top: 0,
    selectable: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = new f.IText(text, {
    left: cx,
    top: cy,
    fill: textColor,
    fontSize,
    fontWeight: bold ? "bold" : "normal",
    originX: "center",
    originY: "center",
    selectable: false,
  });

  return [stamp, label];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLabelTab(f: any, opts: BuilderOptions): any[] {
  const { size, bgColor, textColor, fontSize, bold, text } = opts;
  const width = size;
  const height = Math.max(24, fontSize + 14);
  const r = height / 2;
  const pointW = height * 0.5;

  // Pill with triangular point on the right side
  const pathD = [
    `M ${r} 0`,
    `L ${width - pointW} 0`,
    `L ${width} ${height / 2}`,
    `L ${width - pointW} ${height}`,
    `L ${r} ${height}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    `Z`,
  ].join(" ");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const path = new f.Path(pathD, {
    fill: bgColor,
    left: 0,
    top: 0,
    selectable: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = new f.IText(text, {
    left: (width - pointW) / 2 + r / 2,
    top: height / 2,
    fill: textColor,
    fontSize,
    fontWeight: bold ? "bold" : "normal",
    originX: "center",
    originY: "center",
    selectable: false,
  });

  return [path, label];
}

function computePosition(
  bounds: { left: number; top: number; width: number; height: number },
  corner: Corner,
  size: number,
): { left: number; top: number } {
  const { left, top, width, height } = bounds;
  switch (corner) {
    case "tl":
      return { left, top };
    case "tr":
      return { left: left + width - size, top };
    case "bl":
      return { left, top: top + height - size };
    case "br":
      return { left: left + width - size, top: top + height - size };
  }
}

export function ObjectCornerTabsPanel({ fabricCanvas }: ObjectCornerTabsPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [text, setText] = useState("NOVO");
  const [corner, setCorner] = useState<Corner>("tr");
  const [bgColor, setBgColor] = useState("#ef4444");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(14);
  const [bold, setBold] = useState(true);
  const [size, setSize] = useState(80);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const addTab = useCallback(
    (style: ShapeStyle) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error("Canvas indisponível");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target: any = canvas.getActiveObject();
      if (!target) {
        toast.error("Selecione um objeto primeiro");
        return;
      }

      const bounds = target.getBoundingRect
        ? target.getBoundingRect(true, true)
        : {
            left: target.left ?? 0,
            top: target.top ?? 0,
            width: (target.width ?? 0) * (target.scaleX ?? 1),
            height: (target.height ?? 0) * (target.scaleY ?? 1),
          };

      const pos = computePosition(bounds, corner, size);
      const opts: BuilderOptions = {
        size,
        bgColor,
        textColor,
        fontSize,
        bold,
        text: text || "NOVO",
        corner,
      };

      import("fabric")
        .then((m) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const f = (m as any).fabric as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let parts: any[] = [];
          if (style === "triangle") parts = buildTriangleTab(f, opts);
          else if (style === "rect") parts = buildRectTab(f, opts);
          else if (style === "circle") parts = buildCircleTab(f, opts);
          else if (style === "star") parts = buildStarTab(f, opts);
          else if (style === "serrated") parts = buildSerratedTab(f, opts);
          else if (style === "label") parts = buildLabelTab(f, opts);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const group = new f.Group(parts, {
            left: pos.left,
            top: pos.top,
            data: { cornerTab: true },
          });

          canvas.add(group);
          canvas.setActiveObject(group);
          canvas.requestRenderAll();
          toast.success("Etiqueta adicionada");
        })
        .catch(() => {
          toast.error("Falha ao carregar Fabric");
        });
    },
    [corner, size, bgColor, textColor, fontSize, bold, text],
  );

  const removeAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all: any[] = canvas.getObjects();
    const toRemove = all.filter((o) => o?.data?.cornerTab === true);
    if (toRemove.length === 0) {
      toast.info("Nenhuma etiqueta para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${toRemove.length} etiqueta(s) removida(s)`);
  }, []);

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Etiquetas de Canto</h3>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Texto</label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="NOVO"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Posição</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={corner === "tl" ? "default" : "outline"}
            size="sm"
            onClick={() => setCorner("tl")}
          >
            ↖ Sup. Esq.
          </Button>
          <Button
            type="button"
            variant={corner === "tr" ? "default" : "outline"}
            size="sm"
            onClick={() => setCorner("tr")}
          >
            ↗ Sup. Dir.
          </Button>
          <Button
            type="button"
            variant={corner === "bl" ? "default" : "outline"}
            size="sm"
            onClick={() => setCorner("bl")}
          >
            ↙ Inf. Esq.
          </Button>
          <Button
            type="button"
            variant={corner === "br" ? "default" : "outline"}
            size="sm"
            onClick={() => setCorner("br")}
          >
            ↘ Inf. Dir.
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Estilo</label>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addTab("triangle")}>
            Triângulo Diagonal
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addTab("rect")}>
            Faixa Retangular
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addTab("circle")}>
            Círculo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addTab("star")}>
            Estrela
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addTab("serrated")}>
            Selo Serrilhado
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addTab("label")}>
            Etiqueta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Cor de Fundo</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-8 w-full cursor-pointer rounded border"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Cor do Texto</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="h-8 w-full cursor-pointer rounded border"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          Tamanho da Fonte: {fontSize}px
        </label>
        <input
          type="range"
          min={10}
          max={32}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="cornertab-bold"
          type="checkbox"
          checked={bold}
          onChange={(e) => setBold(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="cornertab-bold" className="text-xs text-muted-foreground">
          Negrito
        </label>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          Tamanho da Etiqueta: {size}px
        </label>
        <input
          type="range"
          min={40}
          max={200}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" size="sm" onClick={() => addTab("rect")}>
          Adicionar Etiqueta
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={removeAll}>
          Remover Etiquetas
        </Button>
      </div>
    </div>
  );
}
