"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Frame } from "lucide-react";
import { toast } from "sonner";

interface CanvasFrameMockupPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type FrameStyle =
  | "simples"
  | "duplo"
  | "polaroid"
  | "sombra"
  | "arredondado"
  | "vintage"
  | "neon"
  | "notebook";

interface FrameOption {
  style: FrameStyle;
  label: string;
  usesRadius: boolean;
  usesShadow: boolean;
}

const FRAME_OPTIONS: FrameOption[] = [
  { style: "simples", label: "Simples", usesRadius: false, usesShadow: false },
  { style: "duplo", label: "Duplo", usesRadius: false, usesShadow: false },
  { style: "polaroid", label: "Polaroid", usesRadius: false, usesShadow: false },
  { style: "sombra", label: "Sombra", usesRadius: false, usesShadow: true },
  { style: "arredondado", label: "Arredondado", usesRadius: true, usesShadow: false },
  { style: "vintage", label: "Vintage", usesRadius: false, usesShadow: false },
  { style: "neon", label: "Neon", usesRadius: false, usesShadow: false },
  { style: "notebook", label: "Notebook", usesRadius: false, usesShadow: false },
];

function buildFrameObjects(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  style: FrameStyle,
  canvasWidth: number,
  canvasHeight: number,
  frameColor: string,
  frameWidth: number,
  cornerRadius: number,
  enableShadow: boolean,
  padding: number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = [];

  const frameTag = { frameMockup: true, frameStyle: style };

  if (style === "simples") {
    const rect = new f.Rect({
      left: padding,
      top: padding,
      width: canvasWidth - padding * 2,
      height: canvasHeight - padding * 2,
      fill: "transparent",
      stroke: frameColor,
      strokeWidth: frameWidth,
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: frameTag as any,
    });
    objects.push(rect);
  } else if (style === "duplo") {
    const gap = frameWidth + 4;
    const outer = new f.Rect({
      left: padding,
      top: padding,
      width: canvasWidth - padding * 2,
      height: canvasHeight - padding * 2,
      fill: "transparent",
      stroke: frameColor,
      strokeWidth: frameWidth,
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    const inner = new f.Rect({
      left: padding + gap,
      top: padding + gap,
      width: canvasWidth - padding * 2 - gap * 2,
      height: canvasHeight - padding * 2 - gap * 2,
      fill: "transparent",
      stroke: frameColor,
      strokeWidth: Math.max(1, frameWidth - 2),
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    objects.push(outer, inner);
  } else if (style === "polaroid") {
    const bottomHeavy = frameWidth * 4;
    const outerRect = new f.Rect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: canvasHeight,
      fill: "#ffffff",
      stroke: "#cccccc",
      strokeWidth: 1,
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    const imageArea = new f.Rect({
      left: frameWidth,
      top: frameWidth,
      width: canvasWidth - frameWidth * 2,
      height: canvasHeight - frameWidth * 2 - bottomHeavy,
      fill: "transparent",
      stroke: "#dddddd",
      strokeWidth: 1,
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    const label = new f.Text("Polaroid", {
      left: canvasWidth / 2,
      top: canvasHeight - bottomHeavy / 2,
      fontSize: Math.max(12, bottomHeavy / 2),
      fontFamily: "Georgia, serif",
      fill: "#888888",
      originX: "center",
      originY: "center",
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    objects.push(outerRect, imageArea, label);
  } else if (style === "sombra") {
    const shadow = enableShadow
      ? new f.Shadow({ color: "rgba(0,0,0,0.5)", blur: 20, offsetX: 6, offsetY: 6 })
      : null;
    const rect = new f.Rect({
      left: padding,
      top: padding,
      width: canvasWidth - padding * 2,
      height: canvasHeight - padding * 2,
      fill: "transparent",
      stroke: frameColor,
      strokeWidth: frameWidth,
      shadow: shadow,
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    objects.push(rect);
  } else if (style === "arredondado") {
    const rect = new f.Rect({
      left: padding,
      top: padding,
      width: canvasWidth - padding * 2,
      height: canvasHeight - padding * 2,
      rx: cornerRadius,
      ry: cornerRadius,
      fill: "transparent",
      stroke: frameColor,
      strokeWidth: frameWidth,
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    objects.push(rect);
  } else if (style === "vintage") {
    const outer = new f.Rect({
      left: padding,
      top: padding,
      width: canvasWidth - padding * 2,
      height: canvasHeight - padding * 2,
      fill: "transparent",
      stroke: frameColor,
      strokeWidth: frameWidth,
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    const inset = frameWidth + 6;
    const deco = new f.Rect({
      left: padding + inset,
      top: padding + inset,
      width: canvasWidth - padding * 2 - inset * 2,
      height: canvasHeight - padding * 2 - inset * 2,
      fill: "transparent",
      stroke: frameColor,
      strokeWidth: Math.max(1, Math.floor(frameWidth / 2)),
      strokeDashArray: [6, 4],
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    objects.push(outer, deco);
  } else if (style === "neon") {
    const neonShadow = new f.Shadow({
      color: frameColor,
      blur: 20,
      offsetX: 0,
      offsetY: 0,
    });
    const rect = new f.Rect({
      left: padding,
      top: padding,
      width: canvasWidth - padding * 2,
      height: canvasHeight - padding * 2,
      fill: "transparent",
      stroke: frameColor,
      strokeWidth: frameWidth,
      shadow: neonShadow,
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    objects.push(rect);
  } else if (style === "notebook") {
    const rect = new f.Rect({
      left: padding + frameWidth * 2,
      top: padding,
      width: canvasWidth - padding * 2 - frameWidth * 2,
      height: canvasHeight - padding * 2,
      fill: "transparent",
      stroke: frameColor,
      strokeWidth: frameWidth,
      selectable: true,
      evented: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { ...frameTag } as any,
    });
    objects.push(rect);

    const dotCount = Math.floor((canvasHeight - padding * 2) / 24);
    const dotRadius = Math.max(3, frameWidth / 2);
    const dotX = padding + dotRadius + 2;
    for (let i = 0; i < dotCount; i++) {
      const dotY = padding + 12 + i * 24;
      const dot = new f.Circle({
        left: dotX,
        top: dotY,
        radius: dotRadius,
        fill: frameColor,
        originX: "center",
        originY: "center",
        selectable: true,
        evented: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { ...frameTag } as any,
      });
      objects.push(dot);
    }
  }

  return objects;
}

export function CanvasFrameMockupPanel({ fabricCanvas }: CanvasFrameMockupPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const [selectedStyle, setSelectedStyle] = useState<FrameStyle>("simples");
  const [frameColor, setFrameColor] = useState("#000000");
  const [frameWidth, setFrameWidth] = useState(8);
  const [cornerRadius, setCornerRadius] = useState(12);
  const [enableShadow, setEnableShadow] = useState(true);
  const [padding, setPadding] = useState(0);

  const currentFrameOption = FRAME_OPTIONS.find((o) => o.style === selectedStyle)!;

  const handleApplyFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      const w = canvas.getWidth ? canvas.getWidth() : canvas.width ?? 800;
      const h = canvas.getHeight ? canvas.getHeight() : canvas.height ?? 600;

      const newObjects = buildFrameObjects(
        f,
        selectedStyle,
        w,
        h,
        frameColor,
        frameWidth,
        cornerRadius,
        enableShadow,
        padding
      );

      newObjects.forEach((obj) => canvas.add(obj));
      canvas.renderAll();
      toast.success(`Frame "${currentFrameOption.label}" aplicado!`);
    }).catch(() => {
      toast.error("Erro ao carregar Fabric.js");
    });
  }, [selectedStyle, frameColor, frameWidth, cornerRadius, enableShadow, padding, currentFrameOption]);

  const handleRemoveFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = canvas.getObjects ? canvas.getObjects() : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objects.filter((obj: any) => obj.data && obj.data.frameMockup === true);
    toRemove.forEach((obj) => canvas.remove(obj));
    canvas.renderAll();
    toast.success(`${toRemove.length} objeto(s) de frame removido(s)`);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Frame className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold text-sm">Frame &amp; Moldura</span>
      </div>

      {/* Frame style grid 2x4 */}
      <div>
        <span className="text-xs text-muted-foreground mb-2 block">Estilo</span>
        <div className="grid grid-cols-2 gap-2">
          {FRAME_OPTIONS.map((opt) => (
            <button
              key={opt.style}
              onClick={() => setSelectedStyle(opt.style)}
              className={[
                "rounded border px-2 py-2 text-xs font-medium transition-colors",
                selectedStyle === opt.style
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame color */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-24 shrink-0">Cor do frame</span>
        <input
          type="color"
          value={frameColor}
          onChange={(e) => setFrameColor(e.target.value)}
          className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
        />
        <span className="text-xs text-muted-foreground font-mono">{frameColor}</span>
      </div>

      {/* Frame width slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Espessura</span>
          <span className="text-xs text-muted-foreground">{frameWidth}px</span>
        </div>
        <input
          type="range"
          min={4}
          max={40}
          value={frameWidth}
          onChange={(e) => setFrameWidth(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Corner radius slider — only for arredondado */}
      {currentFrameOption.usesRadius && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Raio dos cantos</span>
            <span className="text-xs text-muted-foreground">{cornerRadius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            value={cornerRadius}
            onChange={(e) => setCornerRadius(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      )}

      {/* Shadow toggle — only for shadow-based styles */}
      {currentFrameOption.usesShadow && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="frame-shadow-toggle"
            checked={enableShadow}
            onChange={(e) => setEnableShadow(e.target.checked)}
            className="accent-primary"
          />
          <span className="text-xs text-muted-foreground" onClick={() => setEnableShadow((v) => !v)} style={{ cursor: "pointer" }}>
            Ativar sombra
          </span>
        </div>
      )}

      {/* Padding slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Espaçamento interno</span>
          <span className="text-xs text-muted-foreground">{padding}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={80}
          value={padding}
          onChange={(e) => setPadding(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Action buttons */}
      <button
        onClick={handleApplyFrame}
        className="w-full rounded bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Aplicar Frame
      </button>
      <button
        onClick={handleRemoveFrame}
        className="w-full rounded border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
      >
        Remover Frame
      </button>
    </div>
  );
}
