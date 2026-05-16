"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type IsolateMode = "keep" | "invert";

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function rgbDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function applyIsolation(
  imageData: ImageData,
  target: RGB,
  tolerance: number,
  mode: IsolateMode,
): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = rgbDistance(r, g, b, target.r, target.g, target.b);
    const shouldGray =
      mode === "keep" ? dist > tolerance : dist < tolerance;
    if (shouldGray) {
      const avg = Math.round((r + g + b) / 3);
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedImage(fabricCanvas: any): any | null {
  if (!fabricCanvas) return null;
  const active = fabricCanvas.getActiveObject();
  if (active && active.type === "image") return active;
  return null;
}

interface ImageColorIsolatePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function ImageColorIsolatePanel({
  fabricCanvas,
}: ImageColorIsolatePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [targetColor, setTargetColor] = useState<string>("#ff0000");
  const [tolerance, setTolerance] = useState<number>(30);
  const [mode, setMode] = useState<IsolateMode>("keep");
  const [hasImage, setHasImage] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalsRef = useRef<Map<any, HTMLImageElement | HTMLCanvasElement>>(
    new Map(),
  );

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const updateSelection = () => {
      const img = getSelectedImage(fabricCanvas);
      queueMicrotask(() => setHasImage(!!img));
    };

    updateSelection();

    fabricCanvas.on("selection:created", updateSelection);
    fabricCanvas.on("selection:updated", updateSelection);
    fabricCanvas.on("selection:cleared", updateSelection);

    return () => {
      fabricCanvas.off("selection:created", updateSelection);
      fabricCanvas.off("selection:updated", updateSelection);
      fabricCanvas.off("selection:cleared", updateSelection);
    };
  }, [fabricCanvas]);

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const obj = getSelectedImage(canvas);
    if (!obj) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }

    try {
      const el = obj.getElement() as
        | HTMLImageElement
        | HTMLCanvasElement;

      if (!originalsRef.current.has(obj)) {
        originalsRef.current.set(obj, el);
      }

      const width =
        (el as HTMLImageElement).naturalWidth ||
        (el as HTMLCanvasElement).width;
      const height =
        (el as HTMLImageElement).naturalHeight ||
        (el as HTMLCanvasElement).height;

      if (!width || !height) {
        toast.error("Dimensões da imagem inválidas");
        return;
      }

      const off = document.createElement("canvas");
      off.width = width;
      off.height = height;
      const ctx = off.getContext("2d");
      if (!ctx) {
        toast.error("Falha ao criar contexto 2D");
        return;
      }
      ctx.drawImage(el, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      const target = hexToRgb(targetColor);
      applyIsolation(imageData, target, tolerance, mode);

      const out = document.createElement("canvas");
      out.width = width;
      out.height = height;
      const outCtx = out.getContext("2d");
      if (!outCtx) {
        toast.error("Falha ao criar contexto de saída");
        return;
      }
      outCtx.putImageData(imageData, 0, 0);

      obj.setElement(out);
      canvas.requestRenderAll();
      toast.success("Isolamento de cor aplicado");
    } catch (error) {
      console.error("Error in apply isolation:", error);
      toast.error(
        `Falha ao aplicar isolamento: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      );
    }
  };

  const handleRestore = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const obj = getSelectedImage(canvas);
    if (!obj) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }
    const original = originalsRef.current.get(obj);
    if (!original) {
      toast.error("Nenhum estado original salvo para esta imagem");
      return;
    }
    try {
      obj.setElement(original);
      canvas.requestRenderAll();
      toast.success("Imagem restaurada");
    } catch (error) {
      console.error("Error in restore:", error);
      toast.error(
        `Falha ao restaurar: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4" />
        <span className="font-semibold">Isolar Cor</span>
      </div>

      {!hasImage && (
        <div className="text-sm text-muted-foreground">
          Selecione uma imagem para isolar uma cor.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm">Cor alvo</span>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={targetColor}
            onChange={(e) => setTargetColor(e.target.value)}
            className="h-10 w-16 p-1"
          />
          <Input
            type="text"
            value={targetColor}
            onChange={(e) => setTargetColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Tolerância</span>
          <span className="text-xs text-muted-foreground">{tolerance}</span>
        </div>
        <input
          type="range"
          min={5}
          max={80}
          step={1}
          value={tolerance}
          onChange={(e) => setTolerance(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm">Modo</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "keep" ? "default" : "outline"}
            onClick={() => setMode("keep")}
            size="sm"
          >
            Manter cor / Desaturar resto
          </Button>
          <Button
            type="button"
            variant={mode === "invert" ? "default" : "outline"}
            onClick={() => setMode("invert")}
            size="sm"
          >
            Inverter (remover cor)
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleApply}
          disabled={!hasImage}
          className="flex-1"
        >
          Aplicar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRestore}
          disabled={!hasImage}
          className="flex-1"
        >
          Restaurar
        </Button>
      </div>
    </div>
  );
}
