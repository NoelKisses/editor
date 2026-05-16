"use client";

import { useEffect, useRef, useState } from "react";
import { Pipette } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectColorPickerFromImagePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

function quantize(c: number, bucket: number): number {
  return Math.round(c / bucket) * bucket;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function extractDominantColors(
  imgEl: HTMLImageElement | HTMLCanvasElement,
  count: number,
  step: number,
): string[] {
  const width =
    imgEl instanceof HTMLCanvasElement ? imgEl.width : imgEl.naturalWidth || imgEl.width;
  const height =
    imgEl instanceof HTMLCanvasElement ? imgEl.height : imgEl.naturalHeight || imgEl.height;

  if (!width || !height) return [];

  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d");
  if (!ctx) return [];

  ctx.drawImage(imgEl, 0, 0, width, height);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return [];
  }

  const data = imageData.data;
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  const bucketSize = 32;
  const safeStep = Math.max(1, Math.floor(step));

  for (let y = 0; y < height; y += safeStep) {
    for (let x = 0; x < width; x += safeStep) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a < 128) continue;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const qr = quantize(r, bucketSize);
      const qg = quantize(g, bucketSize);
      const qb = quantize(b, bucketSize);
      const key = `${qr},${qg},${qb}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.r += r;
        existing.g += g;
        existing.b += b;
        existing.count += 1;
      } else {
        buckets.set(key, { r, g, b, count: 1 });
      }
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, Math.max(1, Math.min(count, 10)));
  return top.map((b) => rgbToHex(b.r / b.count, b.g / b.count, b.b / b.count));
}

export function ObjectColorPickerFromImagePanel({
  fabricCanvas,
}: ObjectColorPickerFromImagePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [colorCount, setColorCount] = useState<number>(6);
  const [samplingStep, setSamplingStep] = useState<number>(10);
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleExtract = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const obj = canvas.getActiveObject();
    if (!obj) {
      toast.error("Selecione uma imagem");
      return;
    }
    if (obj.type !== "image") {
      toast.error("O objeto selecionado não é uma imagem");
      return;
    }

    try {
      const imgEl = obj.getElement() as HTMLImageElement | HTMLCanvasElement;
      const palette = extractDominantColors(imgEl, colorCount, samplingStep);
      if (palette.length === 0) {
        toast.error("Não foi possível extrair cores");
        return;
      }
      setExtractedPalette(palette);
      toast.success(`${palette.length} cores extraídas`);
    } catch (error) {
      toast.error(
        `Erro ao extrair paleta: ${error instanceof Error ? error.message : "desconhecido"}`,
      );
    }
  };

  const handleApplyText = (hex: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) {
      toast.error("Selecione um texto");
      return;
    }
    const t = obj.type;
    if (t !== "i-text" && t !== "text" && t !== "textbox") {
      toast.error("Selecione um objeto de texto");
      return;
    }
    obj.set("fill", hex);
    canvas.requestRenderAll();
    toast.success(`Cor ${hex} aplicada ao texto`);
  };

  const handleApplyShape = (hex: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) {
      toast.error("Selecione uma forma");
      return;
    }
    const shapeTypes = ["rect", "circle", "triangle", "polygon", "ellipse", "path", "line"];
    if (!shapeTypes.includes(obj.type)) {
      toast.error("Selecione uma forma");
      return;
    }
    obj.set("fill", hex);
    canvas.requestRenderAll();
    toast.success(`Cor ${hex} aplicada à forma`);
  };

  const handleCopy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      toast.success(`${hex} copiado`);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const handleClear = () => {
    setExtractedPalette([]);
    toast.success("Paleta limpa");
  };

  const handleExport = async () => {
    if (extractedPalette.length === 0) {
      toast.error("Nenhuma paleta para exportar");
      return;
    }
    try {
      await navigator.clipboard.writeText(extractedPalette.join(", "));
      toast.success("Paleta exportada");
    } catch {
      toast.error("Falha ao exportar");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Pipette className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Conta-gotas de Imagem</h3>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="color-count" className="text-xs font-medium">
          Número de cores: {colorCount}
        </label>
        <Input
          id="color-count"
          type="range"
          min={3}
          max={10}
          step={1}
          value={colorCount}
          onChange={(e) => setColorCount(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="sampling-step" className="text-xs font-medium">
          Qualidade de amostragem: {samplingStep}
        </label>
        <Input
          id="sampling-step"
          type="range"
          min={1}
          max={20}
          step={1}
          value={samplingStep}
          onChange={(e) => setSamplingStep(Number(e.target.value))}
        />
        <p className="text-[10px] text-muted-foreground">
          Menor = mais preciso, porém mais lento
        </p>
      </div>

      <Button onClick={handleExtract} size="sm" className="w-full">
        Extrair Paleta
      </Button>

      {extractedPalette.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {extractedPalette.slice(0, 10).map((hex, idx) => (
              <div key={`${hex}-${idx}`} className="flex flex-col items-center gap-1">
                <div
                  className="h-10 w-10 rounded border border-border"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
                <span className="text-[10px] font-mono">{hex}</span>
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => handleApplyText(hex)}
                  >
                    Texto
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => handleApplyShape(hex)}
                  >
                    Forma
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => handleCopy(hex)}
                  >
                    Cópia
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleClear} size="sm" variant="outline" className="flex-1">
              Limpar Paleta
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline" className="flex-1">
              Exportar Paleta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
