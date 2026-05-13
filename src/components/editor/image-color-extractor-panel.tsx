"use client";

import { useCallback, useRef, useState } from "react";
import { Pipette, ImageIcon, Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface ImageColorExtractorPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface ExtractedColor {
  hex: string;
  count: number;
  percentage: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function extractDominantColors(imageData: ImageData, maxColors = 12): ExtractedColor[] {
  const data = imageData.data;
  const colorMap = new Map<string, number>();
  const step = Math.max(1, Math.floor(data.length / (4 * 5000))); // Sample max 5000 pixels

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue; // Skip transparent
    // Quantize to reduce similar colors (round to nearest 16)
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const key = rgbToHex(qr, qg, qb);
    colorMap.set(key, (colorMap.get(key) ?? 0) + 1);
  }

  // Sort by frequency
  const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);

  // Cluster similar colors
  const clusters: { hex: string; count: number }[] = [];
  for (const [hex, count] of sorted) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    let merged = false;
    for (const cluster of clusters) {
      const cr = parseInt(cluster.hex.slice(1, 3), 16);
      const cg = parseInt(cluster.hex.slice(3, 5), 16);
      const cb = parseInt(cluster.hex.slice(5, 7), 16);
      if (colorDistance(r, g, b, cr, cg, cb) < 40) {
        cluster.count += count;
        merged = true;
        break;
      }
    }
    if (!merged) {
      clusters.push({ hex, count });
      if (clusters.length >= maxColors * 2) break;
    }
  }

  const total = clusters.reduce((s, c) => s + c.count, 0);
  return clusters
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)
    .map(c => ({ hex: c.hex, count: c.count, percentage: Math.round((c.count / total) * 100) }));
}

export function ImageColorExtractorPanel({ fabricCanvas }: ImageColorExtractorPanelProps) {
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [source, setSource] = useState<"selection" | "upload">("selection");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractFromCanvas = useCallback(async () => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj || obj.type !== "image") {
      toast.error("Selecione uma imagem no canvas");
      return;
    }
    setIsExtracting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgEl: HTMLImageElement = (obj as any).getElement?.();
      if (!imgEl) { toast.error("Não foi possível acessar a imagem"); return; }

      const canvas = document.createElement("canvas");
      canvas.width = Math.min(imgEl.naturalWidth || imgEl.width, 400);
      canvas.height = Math.min(imgEl.naturalHeight || imgEl.height, 400);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const extracted = extractDominantColors(imageData);
      setColors(extracted);
      toast.success(`${extracted.length} cores extraídas`);
    } catch {
      toast.error("Erro ao extrair cores");
    } finally {
      setIsExtracting(false);
    }
  }, [fabricCanvas]);

  const extractFromFile = useCallback((file: File) => {
    setIsExtracting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(img.width, 400);
        canvas.height = Math.min(img.height, 400);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const extracted = extractDominantColors(imageData);
        setColors(extracted);
        setIsExtracting(false);
        toast.success(`${extracted.length} cores extraídas`);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const applyColorToSelected = useCallback((color: string) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    obj.set({ fill: color });
    fabricCanvas.requestRenderAll();
    toast.success("Cor aplicada");
  }, [fabricCanvas]);

  const copyHex = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex).then(() => toast.success(`${hex} copiado`)).catch(() => {});
  }, []);

  const applyAllToObjects = useCallback(() => {
    if (!fabricCanvas || !colors.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = fabricCanvas.getObjects().filter((o: any) => o.type !== "image");
    if (!objects.length) { toast.error("Nenhum objeto colorível no canvas"); return; }
    objects.forEach((obj, i) => {
      obj.set({ fill: colors[i % colors.length].hex });
    });
    fabricCanvas.requestRenderAll();
    toast.success("Paleta aplicada ao canvas");
  }, [fabricCanvas, colors]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Pipette className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Extrair Paleta da Imagem</span>
      </div>

      {/* Source selector */}
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={() => setSource("selection")}
          className={`flex items-center justify-center gap-1.5 py-2 rounded border text-[10px] transition-colors ${source === "selection" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
        >
          <ImageIcon className="w-3 h-3" /> Do Canvas
        </button>
        <button
          onClick={() => setSource("upload")}
          className={`flex items-center justify-center gap-1.5 py-2 rounded border text-[10px] transition-colors ${source === "upload" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
        >
          <Pipette className="w-3 h-3" /> Upload
        </button>
      </div>

      {source === "selection" ? (
        <button
          onClick={extractFromCanvas}
          disabled={isExtracting}
          className="flex items-center justify-center gap-2 py-2.5 rounded border border-primary text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          {isExtracting ? (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          Extrair da Imagem Selecionada
        </button>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) extractFromFile(f); }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            className="flex items-center justify-center gap-2 py-2.5 rounded border border-primary text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {isExtracting ? (
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Pipette className="w-3.5 h-3.5" />
            )}
            Selecionar Imagem
          </button>
        </>
      )}

      {/* Extracted colors */}
      {colors.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cores dominantes</span>
            <button
              onClick={applyAllToObjects}
              className="text-[9px] text-primary hover:text-primary/70 transition-colors"
            >
              Aplicar ao canvas
            </button>
          </div>

          {/* Color strip */}
          <div className="flex rounded overflow-hidden h-8">
            {colors.map((c, i) => (
              <button
                key={i}
                onClick={() => applyColorToSelected(c.hex)}
                title={`${c.hex} — ${c.percentage}%`}
                style={{ background: c.hex, flex: c.percentage }}
                className="hover:opacity-80 transition-opacity min-w-[8px]"
              />
            ))}
          </div>

          {/* Color list */}
          <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
            {colors.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-1.5 rounded border border-border hover:border-primary/30 transition-colors group cursor-pointer"
                onClick={() => applyColorToSelected(c.hex)}
              >
                <div
                  className="w-6 h-6 rounded-sm border border-border/50 flex-shrink-0"
                  style={{ background: c.hex }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-mono">{c.hex}</p>
                  <p className="text-[8px] text-muted-foreground">{c.percentage}%</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); copyHex(c.hex); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copiar"
                >
                  <Copy className="w-2.5 h-2.5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-[8px] text-muted-foreground/60 text-center">
            Clique para aplicar ao objeto selecionado
          </p>
        </>
      )}

      {colors.length === 0 && !isExtracting && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Pipette className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem no canvas ou faça upload para extrair as cores dominantes</p>
        </div>
      )}
    </div>
  );
}
