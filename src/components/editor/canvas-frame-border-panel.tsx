"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Frame, Trash2, SquareDashed } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = any;

interface CanvasFrameBorderPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type FrameType =
  | "none"
  | "solid"
  | "dashed"
  | "dotted"
  | "double"
  | "groove"
  | "ridge"
  | "ornament-1"
  | "ornament-2"
  | "ornament-3"
  | "photo-frame"
  | "polaroid";

const FRAME_TYPES: { id: FrameType; label: string }[] = [
  { id: "none", label: "None" },
  { id: "solid", label: "Solid" },
  { id: "dashed", label: "Dashed" },
  { id: "dotted", label: "Dotted" },
  { id: "double", label: "Double" },
  { id: "groove", label: "Groove" },
  { id: "ridge", label: "Ridge" },
  { id: "ornament-1", label: "Orn 1" },
  { id: "ornament-2", label: "Orn 2" },
  { id: "ornament-3", label: "Orn 3" },
  { id: "photo-frame", label: "Photo" },
  { id: "polaroid", label: "Polaroid" },
];

const ORNAMENT_PATHS: Record<string, string> = {
  "ornament-1":
    "M0,0 C5,-5 15,-5 20,0 C25,5 25,15 20,20 C15,25 5,25 0,20 C-5,15 -5,5 0,0Z",
  "ornament-2":
    "M10,0 L12,8 L20,8 L14,13 L16,21 L10,16 L4,21 L6,13 L0,8 L8,8Z",
  "ornament-3":
    "M0,10 Q5,0 10,10 Q15,20 20,10 Q15,0 10,10 Q5,20 0,10Z",
};

function buildStrokeDashArray(type: FrameType, width: number): number[] | null {
  if (type === "dashed") return [width * 4, width * 2];
  if (type === "dotted") return [width, width * 2];
  return null;
}

function removeExistingFrame(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any
): void {
  const frameId: string | undefined = target.__frameObjectId;
  if (!frameId) return;
  const objs: AnyObj[] = canvas.getObjects();
  const toRemove = objs.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (o: any) => o.__frameId === frameId
  );
  toRemove.forEach((o: AnyObj) => canvas.remove(o));
  delete target.__frameObjectId;
}

export function CanvasFrameBorderPanel({
  fabricCanvas,
  selectionVersion,
}: CanvasFrameBorderPanelProps) {
  const canvasRef = useRef<AnyObj>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeObj, setActiveObj] = useState<any>(null);
  const [frameType, setFrameType] = useState<FrameType>("solid");
  const [frameWidth, setFrameWidth] = useState(4);
  const [frameColor, setFrameColor] = useState("#000000");
  const [frameRadius, setFrameRadius] = useState(0);
  const [frameOpacity, setFrameOpacity] = useState(100);
  const [innerGlow, setInnerGlow] = useState(false);
  const [glowColor, setGlowColor] = useState("#ffffff");
  const [glowBlur, setGlowBlur] = useState(10);
  const [polaroidCaption, setPolaroidCaption] = useState("Caption");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _sv = selectionVersion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      queueMicrotask(() => setActiveObj(null));
      return;
    }
    const obj = canvas.getActiveObject();
    queueMicrotask(() => setActiveObj(obj ?? null));
  }, [selectionVersion, fabricCanvas]);

  const applyFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const target: AnyObj = canvas.getActiveObject();
    if (!target) {
      toast.error("Nenhum objeto selecionado");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabric = m.fabric as any;

      removeExistingFrame(canvas, target);

      if (frameType === "none") {
        canvas.requestRenderAll();
        toast.success("Frame removido");
        return;
      }

      const scaleX: number = target.scaleX ?? 1;
      const scaleY: number = target.scaleY ?? 1;
      const w: number = (target.width ?? 100) * scaleX;
      const h: number = (target.height ?? 100) * scaleY;
      const left: number = target.left ?? 0;
      const top: number = target.top ?? 0;
      const angle: number = target.angle ?? 0;

      const frameId = `frame_${Date.now()}`;
      const padding = frameWidth;

      const baseOpts = {
        left: left - padding,
        top: top - padding,
        width: w + padding * 2,
        height: h + padding * 2,
        rx: frameRadius,
        ry: frameRadius,
        fill: "transparent",
        stroke: frameColor,
        strokeWidth: frameWidth,
        opacity: frameOpacity / 100,
        angle,
        selectable: false,
        evented: false,
        originX: "left",
        originY: "top",
        __frameId: frameId,
      };

      const addShadow = (rect: AnyObj) => {
        if (innerGlow) {
          rect.set({
            shadow: new fabric.Shadow({
              color: glowColor,
              blur: glowBlur,
              offsetX: 0,
              offsetY: 0,
            }),
          });
        }
      };

      if (frameType === "solid") {
        const rect = new fabric.Rect(baseOpts);
        addShadow(rect);
        canvas.add(rect);
        canvas.sendToBack(rect);
        target.__frameObjectId = frameId;

      } else if (frameType === "dashed" || frameType === "dotted") {
        const dashArray = buildStrokeDashArray(frameType, frameWidth);
        const rect = new fabric.Rect({ ...baseOpts, strokeDashArray: dashArray });
        addShadow(rect);
        canvas.add(rect);
        canvas.sendToBack(rect);
        target.__frameObjectId = frameId;

      } else if (frameType === "double") {
        const outer = new fabric.Rect({ ...baseOpts, __frameId: frameId });
        const inner = new fabric.Rect({
          ...baseOpts,
          left: left - Math.max(1, padding / 2),
          top: top - Math.max(1, padding / 2),
          width: w + Math.max(1, padding / 2) * 2,
          height: h + Math.max(1, padding / 2) * 2,
          strokeWidth: Math.max(1, frameWidth / 2),
          __frameId: frameId,
        });
        addShadow(outer);
        canvas.add(outer);
        canvas.add(inner);
        canvas.sendToBack(inner);
        canvas.sendToBack(outer);
        target.__frameObjectId = frameId;

      } else if (frameType === "groove" || frameType === "ridge") {
        const lighter = frameType === "groove" ? "#ffffff55" : "#00000055";
        const darker = frameType === "groove" ? "#00000055" : "#ffffff55";
        const r1 = new fabric.Rect({ ...baseOpts, stroke: darker, __frameId: frameId });
        const r2 = new fabric.Rect({
          ...baseOpts,
          left: left - padding + 2,
          top: top - padding + 2,
          stroke: lighter,
          strokeWidth: Math.max(1, frameWidth - 2),
          __frameId: frameId,
        });
        canvas.add(r1);
        canvas.add(r2);
        canvas.sendToBack(r2);
        canvas.sendToBack(r1);
        target.__frameObjectId = frameId;

      } else if (
        frameType === "ornament-1" ||
        frameType === "ornament-2" ||
        frameType === "ornament-3"
      ) {
        const rect = new fabric.Rect({ ...baseOpts, __frameId: frameId });
        addShadow(rect);
        canvas.add(rect);
        canvas.sendToBack(rect);

        const pathData = ORNAMENT_PATHS[frameType];
        const corners = [
          { dx: 0, dy: 0, flipX: false, flipY: false },
          { dx: w + padding * 2, dy: 0, flipX: true, flipY: false },
          { dx: 0, dy: h + padding * 2, flipX: false, flipY: true },
          { dx: w + padding * 2, dy: h + padding * 2, flipX: true, flipY: true },
        ];
        corners.forEach(({ dx, dy, flipX, flipY }) => {
          const corner = new fabric.Path(pathData, {
            left: left - padding + dx,
            top: top - padding + dy,
            fill: frameColor,
            opacity: frameOpacity / 100,
            scaleX: flipX ? -1 : 1,
            scaleY: flipY ? -1 : 1,
            selectable: false,
            evented: false,
            angle,
            __frameId: frameId,
          });
          canvas.add(corner);
        });
        target.__frameObjectId = frameId;

      } else if (frameType === "photo-frame") {
        const outer = new fabric.Rect({
          ...baseOpts,
          fill: frameColor,
          stroke: "transparent",
          strokeWidth: 0,
          __frameId: frameId,
        });
        const inner = new fabric.Rect({
          left: left - 2,
          top: top - 2,
          width: w + 4,
          height: h + 4,
          rx: Math.max(0, frameRadius - 2),
          ry: Math.max(0, frameRadius - 2),
          fill: "#ffffff",
          stroke: "transparent",
          strokeWidth: 0,
          opacity: frameOpacity / 100,
          angle,
          selectable: false,
          evented: false,
          __frameId: frameId,
        });
        addShadow(outer);
        canvas.add(outer);
        canvas.add(inner);
        canvas.sendToBack(inner);
        canvas.sendToBack(outer);
        target.__frameObjectId = frameId;

      } else if (frameType === "polaroid") {
        const bottomExtra = Math.max(40, frameWidth * 8);
        const polaroidRect = new fabric.Rect({
          left: left - padding,
          top: top - padding,
          width: w + padding * 2,
          height: h + padding * 2 + bottomExtra,
          rx: frameRadius,
          ry: frameRadius,
          fill: "#ffffff",
          stroke: "#dddddd",
          strokeWidth: 1,
          opacity: frameOpacity / 100,
          angle,
          selectable: false,
          evented: false,
          __frameId: frameId,
        });
        addShadow(polaroidRect);

        const captionText = new fabric.Text(polaroidCaption, {
          left: left,
          top: top + h + padding + 6,
          fontSize: 12,
          fill: "#333333",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          originX: "center",
          width: w,
          angle,
          selectable: false,
          evented: false,
          __frameId: frameId,
        });

        canvas.add(polaroidRect);
        canvas.add(captionText);
        canvas.sendToBack(captionText);
        canvas.sendToBack(polaroidRect);
        target.__frameObjectId = frameId;
      }

      canvas.requestRenderAll();
      toast.success("Frame aplicado");
    });
  }, [
    frameType,
    frameWidth,
    frameColor,
    frameRadius,
    frameOpacity,
    innerGlow,
    glowColor,
    glowBlur,
    polaroidCaption,
  ]);

  const handleRemoveFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const target: AnyObj = canvas.getActiveObject();
    if (!target) {
      toast.error("Nenhum objeto selecionado");
      return;
    }
    removeExistingFrame(canvas, target);
    canvas.requestRenderAll();
    toast.success("Frame removido");
  }, []);

  if (!activeObj) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-[9px] text-zinc-400">
        <SquareDashed className="w-5 h-5 opacity-40" />
        <span>Selecione um objeto no canvas</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 text-zinc-200">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Frame className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400">
          Frame / Border
        </span>
      </div>

      {/* Frame type grid */}
      <div>
        <p className="text-[8px] text-zinc-500 mb-1.5 uppercase tracking-wider">Tipo</p>
        <div className="grid grid-cols-4 gap-1">
          {FRAME_TYPES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFrameType(id)}
              className={`rounded px-1 py-1 text-[7px] font-medium transition-colors ${
                frameType === id
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {frameType !== "none" && (
        <>
          {/* Frame Width */}
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Largura</p>
              <span className="text-[8px] text-zinc-400">{frameWidth}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              value={frameWidth}
              onChange={(e) => setFrameWidth(Number(e.target.value))}
              className="w-full h-1 accent-blue-500"
            />
          </div>

          {/* Frame Color */}
          <div className="flex items-center justify-between">
            <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Cor</p>
            <input
              type="color"
              value={frameColor}
              onChange={(e) => setFrameColor(e.target.value)}
              className="w-7 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>

          {/* Frame Radius */}
          {!["ornament-1", "ornament-2", "ornament-3"].includes(frameType) && (
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Raio</p>
                <span className="text-[8px] text-zinc-400">{frameRadius}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                value={frameRadius}
                onChange={(e) => setFrameRadius(Number(e.target.value))}
                className="w-full h-1 accent-blue-500"
              />
            </div>
          )}

          {/* Frame Opacity */}
          <div>
            <div className="flex justify-between mb-1">
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Opacidade</p>
              <span className="text-[8px] text-zinc-400">{frameOpacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={frameOpacity}
              onChange={(e) => setFrameOpacity(Number(e.target.value))}
              className="w-full h-1 accent-blue-500"
            />
          </div>

          {/* Inner Glow */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={innerGlow}
                onChange={(e) => setInnerGlow(e.target.checked)}
                className="accent-blue-500 w-3 h-3"
              />
              <span className="text-[8px] text-zinc-400 uppercase tracking-wider">Inner Glow</span>
            </label>
            {innerGlow && (
              <div className="flex flex-col gap-1.5 pl-4">
                <div className="flex items-center justify-between">
                  <p className="text-[8px] text-zinc-500">Cor Glow</p>
                  <input
                    type="color"
                    value={glowColor}
                    onChange={(e) => setGlowColor(e.target.value)}
                    className="w-7 h-5 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-[8px] text-zinc-500">Blur</p>
                    <span className="text-[8px] text-zinc-400">{glowBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={glowBlur}
                    onChange={(e) => setGlowBlur(Number(e.target.value))}
                    className="w-full h-1 accent-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Polaroid caption */}
          {frameType === "polaroid" && (
            <div>
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider mb-1">Legenda</p>
              <input
                type="text"
                value={polaroidCaption}
                onChange={(e) => setPolaroidCaption(e.target.value)}
                placeholder="Caption..."
                className="w-full rounded bg-zinc-800 px-2 py-1 text-[9px] text-zinc-200 border border-zinc-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={applyFrame}
          className="flex-1 flex items-center justify-center gap-1 rounded bg-blue-600 hover:bg-blue-500 py-1.5 text-[9px] font-medium transition-colors"
        >
          <Frame className="w-3 h-3" />
          Aplicar Frame
        </button>
        <button
          onClick={handleRemoveFrame}
          title="Remover frame"
          className="rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 transition-colors"
        >
          <Trash2 className="w-3 h-3 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
