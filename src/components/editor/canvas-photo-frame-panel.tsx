"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasPhotoFramePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface BBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPolaroidFrame(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  bbox: BBox,
  color: string,
  thickness: number,
  bottomMultiplier: number,
  caption: string,
  captionFont: string,
  showCaption: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const bottomThickness = thickness * bottomMultiplier;
  const outerWidth = bbox.width + thickness * 2;
  const outerHeight = bbox.height + thickness + bottomThickness;

  const background = new f.Rect({
    left: bbox.left - thickness,
    top: bbox.top - thickness,
    width: outerWidth,
    height: outerHeight,
    fill: color,
    stroke: "#dddddd",
    strokeWidth: 1,
    shadow: "rgba(0,0,0,0.3) 4px 4px 12px",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [background];

  if (showCaption && caption.trim().length > 0) {
    const captionText = new f.Text(caption, {
      left: bbox.left + bbox.width / 2,
      top: bbox.top + bbox.height + bottomThickness / 2,
      fontFamily: captionFont,
      fontSize: Math.max(16, bottomThickness * 0.45),
      fill: "#222222",
      originX: "center",
      originY: "center",
    });
    elements.push(captionText);
  }

  return elements;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDecorativeCornersFrame(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  bbox: BBox,
  color: string,
  thickness: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const border = new f.Rect({
    left: bbox.left - thickness,
    top: bbox.top - thickness,
    width: bbox.width + thickness * 2,
    height: bbox.height + thickness * 2,
    fill: "transparent",
    stroke: color,
    strokeWidth: thickness / 4,
  });

  const cornerSize = thickness * 1.5;
  const positions = [
    { left: bbox.left - thickness, top: bbox.top - thickness },
    { left: bbox.left + bbox.width + thickness - cornerSize, top: bbox.top - thickness },
    { left: bbox.left - thickness, top: bbox.top + bbox.height + thickness - cornerSize },
    {
      left: bbox.left + bbox.width + thickness - cornerSize,
      top: bbox.top + bbox.height + thickness - cornerSize,
    },
  ];

  const corners = positions.map(
    (p) =>
      new f.Rect({
        left: p.left,
        top: p.top,
        width: cornerSize,
        height: cornerSize,
        fill: color,
        stroke: "#000000",
        strokeWidth: 1,
      }),
  );

  return [border, ...corners];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFilmStripFrame(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  bbox: BBox,
  thickness: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const color = "#111111";
  const outerWidth = bbox.width + thickness * 2;
  const outerHeight = bbox.height + thickness * 2;

  const background = new f.Rect({
    left: bbox.left - thickness,
    top: bbox.top - thickness,
    width: outerWidth,
    height: outerHeight,
    fill: color,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [background];

  const holeSize = thickness * 0.5;
  const holeSpacing = thickness * 1.2;
  const holeCount = Math.max(3, Math.floor(bbox.width / holeSpacing));
  const startX = bbox.left + (bbox.width - holeCount * holeSpacing) / 2 + holeSpacing / 2;

  for (let i = 0; i < holeCount; i++) {
    const x = startX + i * holeSpacing;
    const topHole = new f.Rect({
      left: x - holeSize / 2,
      top: bbox.top - thickness + (thickness - holeSize) / 2,
      width: holeSize,
      height: holeSize,
      fill: "#ffffff",
      rx: 2,
      ry: 2,
    });
    const bottomHole = new f.Rect({
      left: x - holeSize / 2,
      top: bbox.top + bbox.height + (thickness - holeSize) / 2,
      width: holeSize,
      height: holeSize,
      fill: "#ffffff",
      rx: 2,
      ry: 2,
    });
    elements.push(topHole, bottomHole);
  }

  return elements;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildVintageFrame(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  bbox: BBox,
  color: string,
  thickness: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const fill = color === "#ffffff" ? "#e8d8b8" : color;
  const background = new f.Rect({
    left: bbox.left - thickness,
    top: bbox.top - thickness,
    width: bbox.width + thickness * 2,
    height: bbox.height + thickness * 2,
    fill,
    rx: thickness * 0.6,
    ry: thickness * 0.6,
    stroke: "#8b6f47",
    strokeWidth: 2,
    shadow: "rgba(101,67,33,0.4) 3px 3px 8px",
  });
  return [background];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildModernFrame(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  bbox: BBox,
  color: string,
  thickness: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const thin = Math.max(4, thickness / 3);
  const background = new f.Rect({
    left: bbox.left - thin,
    top: bbox.top - thin,
    width: bbox.width + thin * 2,
    height: bbox.height + thin * 2,
    fill: color,
    shadow: "rgba(0,0,0,0.2) 2px 4px 10px",
  });
  return [background];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildGradientFrame(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  bbox: BBox,
  thickness: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const background = new f.Rect({
    left: bbox.left - thickness,
    top: bbox.top - thickness,
    width: bbox.width + thickness * 2,
    height: bbox.height + thickness * 2,
    fill: new f.Gradient({
      type: "linear",
      coords: { x1: 0, y1: 0, x2: bbox.width + thickness * 2, y2: bbox.height + thickness * 2 },
      colorStops: [
        { offset: 0, color: "#ff6ec4" },
        { offset: 0.5, color: "#7873f5" },
        { offset: 1, color: "#42e695" },
      ],
    }),
  });
  return [background];
}

type FrameStyle = "polaroid" | "decorative" | "film" | "vintage" | "modern" | "gradient";

export function CanvasPhotoFramePanel({ fabricCanvas }: CanvasPhotoFramePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [frameColor, setFrameColor] = useState("#ffffff");
  const [thickness, setThickness] = useState(30);
  const [bottomMultiplier, setBottomMultiplier] = useState(2);
  const [caption, setCaption] = useState("Memórias");
  const [showCaption, setShowCaption] = useState(true);
  const [captionFont, setCaptionFont] = useState("Caveat");

  useEffect(() => {
    queueMicrotask(() => {
      canvasRef.current = fabricCanvas;
    });
  }, [fabricCanvas]);

  const applyFrame = (style: FrameStyle) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== "image") {
      toast.error("Selecione uma imagem primeiro");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      const bbox: BBox = {
        left: obj.left ?? 0,
        top: obj.top ?? 0,
        width: (obj.width ?? 0) * (obj.scaleX ?? 1),
        height: (obj.height ?? 0) * (obj.scaleY ?? 1),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let elements: any[] = [];
      switch (style) {
        case "polaroid":
          elements = buildPolaroidFrame(
            f,
            bbox,
            frameColor,
            thickness,
            bottomMultiplier,
            caption,
            captionFont,
            showCaption,
          );
          break;
        case "decorative":
          elements = buildDecorativeCornersFrame(f, bbox, frameColor, thickness);
          break;
        case "film":
          elements = buildFilmStripFrame(f, bbox, thickness);
          break;
        case "vintage":
          elements = buildVintageFrame(f, bbox, frameColor, thickness);
          break;
        case "modern":
          elements = buildModernFrame(f, bbox, frameColor, thickness);
          break;
        case "gradient":
          elements = buildGradientFrame(f, bbox, thickness);
          break;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parentId = (obj as any).id ?? `img-${Date.now()}`;
      elements.forEach((el) => {
        el.data = { photoFrame: true, parentId };
        el.selectable = true;
        canvas.add(el);
        canvas.sendToBack(el);
      });
      // Ensure image stays on top of frame backgrounds
      canvas.bringToFront(obj);
      canvas.requestRenderAll();
      toast.success("Moldura aplicada");
    });
  };

  const removeFrames = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((o: any) => o?.data?.photoFrame === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${objects.length} moldura(s) removida(s)`);
  };

  const styles: { id: FrameStyle; label: string }[] = [
    { id: "polaroid", label: "Polaroid" },
    { id: "decorative", label: "Cantos Decorados" },
    { id: "film", label: "Película Filme" },
    { id: "vintage", label: "Vintage" },
    { id: "modern", label: "Moderno" },
    { id: "gradient", label: "Gradiente" },
  ];

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Moldura Fotográfica</h3>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Cor da Moldura</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={frameColor}
            onChange={(e) => setFrameColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border"
          />
          <Input
            value={frameColor}
            onChange={(e) => setFrameColor(e.target.value)}
            className="h-8 flex-1 text-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Espessura: {thickness}px</span>
        <input
          type="range"
          min={10}
          max={80}
          value={thickness}
          onChange={(e) => setThickness(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">
          Multiplicador Inferior (Polaroid): {bottomMultiplier}x
        </span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.1}
          value={bottomMultiplier}
          onChange={(e) => setBottomMultiplier(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Legenda (Polaroid)</span>
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="h-8 text-xs"
        />
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showCaption}
            onChange={(e) => setShowCaption(e.target.checked)}
          />
          Mostrar legenda
        </label>
        <select
          value={captionFont}
          onChange={(e) => setCaptionFont(e.target.value)}
          className="h-8 w-full rounded border px-2 text-xs"
        >
          <option value="Caveat">Caveat</option>
          <option value="Pacifico">Pacifico</option>
          <option value="Indie Flower">Indie Flower</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Estilo da Moldura</span>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyFrame(s.id)}
              className="text-xs"
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => applyFrame("polaroid")}
          className="w-full"
          size="sm"
        >
          Aplicar Moldura
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={removeFrames}
          className="w-full"
          size="sm"
        >
          Remover Molduras
        </Button>
      </div>
    </div>
  );
}
