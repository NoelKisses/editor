"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pipette, Copy, Palette, Layers } from "lucide-react";
import { toast } from "sonner";

interface CanvasColorPaletteExtractorPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface PaletteColor {
  hex: string;
}

// ─── Module-level helpers ──────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function samplePixelsGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number
): [number, number, number][] {
  const stepX = Math.max(1, Math.floor(width / gridSize));
  const stepY = Math.max(1, Math.floor(height / gridSize));
  const pixels: [number, number, number][] = [];

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const data = ctx.getImageData(x, y, 1, 1).data;
      if (data[3] < 128) continue; // skip transparent
      pixels.push([data[0], data[1], data[2]]);
    }
  }

  return pixels;
}

function clusterColors(
  pixels: [number, number, number][],
  maxColors: number,
  tolerance: number
): PaletteColor[] {
  const clusters: { r: number; g: number; b: number; count: number }[] = [];

  for (const [r, g, b] of pixels) {
    let merged = false;
    for (const cluster of clusters) {
      if (colorDistance(r, g, b, cluster.r, cluster.g, cluster.b) < tolerance) {
        // Update centroid incrementally
        const n = cluster.count + 1;
        cluster.r = Math.round((cluster.r * cluster.count + r) / n);
        cluster.g = Math.round((cluster.g * cluster.count + g) / n);
        cluster.b = Math.round((cluster.b * cluster.count + b) / n);
        cluster.count = n;
        merged = true;
        break;
      }
    }
    if (!merged) {
      clusters.push({ r, g, b, count: 1 });
    }
  }

  return clusters
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)
    .map((c) => ({ hex: rgbToHex(c.r, c.g, c.b) }));
}

function buildCssCustomProperties(colors: PaletteColor[]): string {
  const lines = colors
    .map((c, i) => `  --palette-color-${i + 1}: ${c.hex};`)
    .join("\n");
  return `:root {\n${lines}\n}`;
}

function getSelectedImageElement(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any
): HTMLImageElement | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = canvas?.getActiveObject?.();
  if (!obj || obj.type !== "image") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = (obj as any).getElement?.();
  if (!(el instanceof HTMLImageElement)) return null;
  return el;
}

// ─── Component ────────────────────────────────────────────────────────────

export function CanvasColorPaletteExtractorPanel({
  fabricCanvas,
  selectionVersion,
}: CanvasColorPaletteExtractorPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [colorCount, setColorCount] = useState(8);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hasImageSelected, setHasImageSelected] = useState(false);

  // Track whether an image is currently selected
  useEffect(() => {
    const fc = canvasRef.current;
    if (!fc) {
      queueMicrotask(() => setHasImageSelected(false));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fc.getActiveObject?.();
    queueMicrotask(() => setHasImageSelected(!!obj && obj.type === "image"));
  }, [selectionVersion, fabricCanvas]);

  const handleExtract = useCallback(() => {
    const fc = canvasRef.current;
    if (!fc) return;

    const imgEl = getSelectedImageElement(fc);
    if (!imgEl) {
      toast.error("Selecione uma imagem no canvas");
      return;
    }

    setIsExtracting(true);

    const offscreen = document.createElement("canvas");
    const maxDim = 300;
    const naturalW = imgEl.naturalWidth || imgEl.width || maxDim;
    const naturalH = imgEl.naturalHeight || imgEl.height || maxDim;
    const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
    offscreen.width = Math.max(1, Math.round(naturalW * scale));
    offscreen.height = Math.max(1, Math.round(naturalH * scale));

    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      setIsExtracting(false);
      toast.error("Erro ao criar contexto offscreen");
      return;
    }

    try {
      ctx.drawImage(imgEl, 0, 0, offscreen.width, offscreen.height);
      const pixels = samplePixelsGrid(ctx, offscreen.width, offscreen.height, 40);

      if (pixels.length === 0) {
        toast.error("Não foi possível amostrar pixels da imagem");
        setIsExtracting(false);
        return;
      }

      const extracted = clusterColors(pixels, colorCount, 30);
      setPalette(extracted);
      setIsExtracting(false);
      toast.success(`${extracted.length} cores extraídas`);
    } catch {
      setIsExtracting(false);
      toast.error("Erro ao extrair paleta");
    }
  }, [colorCount]);

  const handleCopyHex = useCallback((hex: string) => {
    navigator.clipboard
      .writeText(hex)
      .then(() => toast.success(`${hex} copiado`))
      .catch(() => toast.error("Falha ao copiar"));
  }, []);

  const handleApplyToObject = useCallback((hex: string) => {
    const fc = canvasRef.current;
    if (!fc) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fc.getActiveObject?.();
    if (!obj) {
      toast.error("Selecione um objeto no canvas");
      return;
    }
    obj.set({ fill: hex });
    fc.requestRenderAll?.();
    toast.success("Cor aplicada ao objeto");
  }, []);

  const handleCopyCss = useCallback(() => {
    if (palette.length === 0) return;
    const css = buildCssCustomProperties(palette);
    navigator.clipboard
      .writeText(css)
      .then(() => toast.success("CSS custom properties copiado"))
      .catch(() => toast.error("Falha ao copiar CSS"));
  }, [palette]);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Pipette className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold">Extrator de Paleta</span>
      </div>

      {/* Empty state */}
      {!hasImageSelected && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Layers className="w-7 h-7 text-muted-foreground/30" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Sem imagem selecionada.
            <br />
            Selecione uma imagem no canvas para extrair sua paleta de cores.
          </p>
        </div>
      )}

      {/* Controls — visible only when image selected */}
      {hasImageSelected && (
        <>
          {/* Color count slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                Número de cores
              </span>
              <span className="text-[9px] font-mono text-primary">{colorCount}</span>
            </div>
            <input
              type="range"
              min={4}
              max={12}
              step={1}
              value={colorCount}
              onChange={(e) => setColorCount(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
            <div className="flex justify-between">
              <span className="text-[8px] text-muted-foreground">4</span>
              <span className="text-[8px] text-muted-foreground">12</span>
            </div>
          </div>

          {/* Extract button */}
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {isExtracting ? (
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Palette className="w-3 h-3" />
            )}
            Extrair Paleta
          </button>
        </>
      )}

      {/* Palette swatches */}
      {palette.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              Paleta extraída
            </span>
            <button
              onClick={handleCopyCss}
              className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/70 transition-colors"
              title="Copiar paleta como CSS custom properties"
            >
              <Copy className="w-2.5 h-2.5" />
              Copiar CSS
            </button>
          </div>

          {/* Color strip */}
          <div className="flex rounded overflow-hidden h-6">
            {palette.map((c, i) => (
              <div
                key={i}
                title={c.hex}
                style={{ background: c.hex, flex: 1 }}
                className="min-w-[8px]"
              />
            ))}
          </div>

          {/* Swatches grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {palette.map((c, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-0.5 group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleApplyToObject(c.hex)}
              >
                <div
                  className="w-full aspect-square rounded border border-border/50 relative"
                  style={{ background: c.hex }}
                >
                  {/* Copy button overlay */}
                  <button
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyHex(c.hex);
                    }}
                    title={`Copiar ${c.hex}`}
                  >
                    <Copy className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
                {/* Hex label on hover */}
                <span
                  className={`text-[7px] font-mono leading-none transition-opacity ${
                    hoveredIndex === i
                      ? "opacity-100 text-foreground"
                      : "opacity-0"
                  }`}
                >
                  {c.hex}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[8px] text-muted-foreground/60 text-center leading-relaxed">
            Clique no swatch para aplicar ao objeto selecionado.
            <br />
            Passe o mouse para ver o hex.
          </p>
        </>
      )}
    </div>
  );
}
