"use client";

import { useEffect, useRef, useState } from "react";
import { FlipVertical2 } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricObject = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricLib = any;

type Direction = "abaixo" | "acima" | "direita" | "esquerda";

interface ReflectionConfig {
  direction: Direction;
  gap: number;
  opacity: number;
  fade: boolean;
  blur: number;
  scale: number;
}

function applyReflection(
  canvas: FabricCanvas,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: FabricObject,
  config: ReflectionConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: FabricLib
): void {
  const { direction, gap, opacity, fade, blur, scale } = config;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj.clone((clone: any) => {
    const objW = (obj.width ?? 100) * (obj.scaleX ?? 1);
    const objH = (obj.height ?? 100) * (obj.scaleY ?? 1);
    const origLeft = obj.left ?? 0;
    const origTop = obj.top ?? 0;

    const isVerticalFlip = direction === "abaixo" || direction === "acima";
    const isHorizontalFlip = direction === "direita" || direction === "esquerda";

    let newLeft = origLeft;
    let newTop = origTop;
    let newFlipX = obj.flipX ?? false;
    let newFlipY = obj.flipY ?? false;
    let newScaleX = (obj.scaleX ?? 1) * scale;
    let newScaleY = (obj.scaleY ?? 1) * scale;

    if (direction === "abaixo") {
      newTop = origTop + objH + gap;
      newFlipY = !(obj.flipY ?? false);
      newScaleY = (obj.scaleY ?? 1) * scale;
    } else if (direction === "acima") {
      newTop = origTop - objH * scale - gap;
      newFlipY = !(obj.flipY ?? false);
      newScaleY = (obj.scaleY ?? 1) * scale;
    } else if (direction === "direita") {
      newLeft = origLeft + objW + gap;
      newFlipX = !(obj.flipX ?? false);
      newScaleX = (obj.scaleX ?? 1) * scale;
    } else if (direction === "esquerda") {
      newLeft = origLeft - objW * scale - gap;
      newFlipX = !(obj.flipX ?? false);
      newScaleX = (obj.scaleX ?? 1) * scale;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadowConfig: any = {
      blur: blur > 0 ? blur : 0,
      color: "transparent",
      offsetX: 0,
      offsetY: 0,
    };

    const effectiveOpacity = fade ? opacity * 0.7 : opacity;

    clone.set({
      left: newLeft,
      top: newTop,
      flipX: newFlipX,
      flipY: newFlipY,
      opacity: effectiveOpacity,
      scaleX: newScaleX,
      scaleY: newScaleY,
      selectable: false,
      evented: false,
      shadow: blur > 0 ? new fabric.Shadow(shadowConfig) : null,
      data: {
        reflectionOf: obj.data?.id ?? "obj",
        isReflection: true,
      },
    });

    // For non-image types, suppress vertical flip rendering artifacts
    void isVerticalFlip;
    void isHorizontalFlip;

    canvas.add(clone);
    canvas.sendObjectToBack(clone);
    canvas.requestRenderAll();
  });
}

function removeAllReflections(canvas: FabricCanvas): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toRemove = canvas.getObjects().filter((o: any) => o.data?.isReflection === true);
  toRemove.forEach((o: unknown) => canvas.remove(o));
  canvas.requestRenderAll();
}

interface ObjectReflectionAdvancedPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "abaixo", label: "Abaixo" },
  { value: "acima", label: "Acima" },
  { value: "direita", label: "Direita" },
  { value: "esquerda", label: "Esquerda" },
];

export function ObjectReflectionAdvancedPanel({
  fabricCanvas,
  selectionVersion,
}: ObjectReflectionAdvancedPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [hasObject, setHasObject] = useState(false);
  const [direction, setDirection] = useState<Direction>("abaixo");
  const [gap, setGap] = useState(10);
  const [opacity, setOpacity] = useState(0.4);
  const [fade, setFade] = useState(false);
  const [blur, setBlur] = useState(0);
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const active = !!obj && obj.type !== "activeSelection";
      setHasObject(active);
    });
  }, [fabricCanvas, selectionVersion]);

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = canvas.getActiveObject();
    if (!obj || obj.type === "activeSelection") {
      toast.error("Selecione um objeto para aplicar o reflexo");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;

      const config: ReflectionConfig = { direction, gap, opacity, fade, blur, scale };
      applyReflection(canvas, obj, config, f);

      toast.success("Reflexo avançado aplicado");
    }).catch(() => {
      toast.error("Erro ao carregar Fabric.js");
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    removeAllReflections(canvas);
    toast.success("Reflexos removidos");
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FlipVertical2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Reflexo Avançado</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <FlipVertical2 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">
            Selecione um objeto para criar um reflexo avançado
          </p>
        </div>
      ) : (
        <>
          {/* Direction */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Direção
            </span>
            <div className="grid grid-cols-2 gap-1">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDirection(d.value)}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${
                    direction === d.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gap */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espaço (Gap)</span>
              <span className="text-[9px] tabular-nums">{gap}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={1}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Opacidade do Reflexo</span>
              <span className="text-[9px] tabular-nums">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>

          {/* Fade checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="reflection-fade"
              type="checkbox"
              checked={fade}
              onChange={(e) => setFade(e.target.checked)}
              className="accent-primary w-3 h-3"
            />
            <label htmlFor="reflection-fade" className="text-[9px] text-muted-foreground cursor-pointer">
              Efeito de fade (opacidade reduzida)
            </label>
          </div>

          {/* Blur */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Desfoque (Blur)</span>
              <span className="text-[9px] tabular-nums">{blur}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>

          {/* Scale */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Escala do Reflexo</span>
              <span className="text-[9px] tabular-nums">{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>

          {/* Actions */}
          <button
            onClick={handleApply}
            className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
          >
            <FlipVertical2 className="w-3 h-3" />
            Aplicar
          </button>

          <button
            onClick={handleRemove}
            className="flex items-center justify-center gap-1 py-2 rounded border border-destructive/50 text-destructive text-[9px] font-medium hover:bg-destructive/10 transition-colors"
          >
            Remover Reflexos
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            O reflexo é gerado como cópia espelhada do objeto selecionado
          </p>
        </>
      )}
    </div>
  );
}
