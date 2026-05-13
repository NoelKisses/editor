"use client";

import { useCallback, useState } from "react";
import { Pipette, Copy } from "lucide-react";
import { toast } from "sonner";

interface ColorPickerEyedropperProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function getColorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) {
  return Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);
}

function extractDominantColors(imageData: ImageData, count = 8): string[] {
  const data = imageData.data;
  const colorMap: Map<string, number> = new Map();

  // Sample every 8 pixels for performance
  for (let i = 0; i < data.length; i += 32) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue; // skip transparent
    // Quantize to reduce unique colors
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const key = rgbToHex(qr, qg, qb);
    colorMap.set(key, (colorMap.get(key) ?? 0) + 1);
  }

  // Sort by frequency
  const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);

  // Pick diverse colors (skip similar ones)
  const picked: string[] = [];
  for (const [hex] of sorted) {
    if (picked.length >= count) break;
    const rgb = hexToRgb(hex);
    const isTooSimilar = picked.some((h) => getColorDistance(hexToRgb(h), rgb) < 40);
    if (!isTooSimilar) picked.push(hex);
  }

  return picked;
}

export function ColorPickerEyedropper({ fabricCanvas, selectionVersion }: ColorPickerEyedropperProps) {
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  void selectionVersion;

  const extractColors = useCallback(() => {
    if (!fabricCanvas) return;
    setLoading(true);

    const offscreen = document.createElement("canvas");
    offscreen.width = fabricCanvas.getWidth();
    offscreen.height = fabricCanvas.getHeight();
    const ctx = offscreen.getContext("2d");
    if (!ctx) { setLoading(false); return; }

    // Draw canvas content to offscreen
    const dataURL = fabricCanvas.toDataURL({ format: "png", multiplier: 0.3 });
    const img = new window.Image();
    img.onload = () => {
      const small = document.createElement("canvas");
      small.width = img.width;
      small.height = img.height;
      const sCtx = small.getContext("2d");
      if (!sCtx) { setLoading(false); return; }
      sCtx.drawImage(img, 0, 0);
      const imageData = sCtx.getImageData(0, 0, small.width, small.height);
      const extracted = extractDominantColors(imageData, 12);
      setColors(extracted);
      setLoading(false);
      if (extracted.length === 0) {
        toast("Nenhuma cor detectada — adicione elementos ao canvas");
      }
    };
    img.onerror = () => setLoading(false);
    img.src = dataURL;
  }, [fabricCanvas]);

  const applyToSelected = useCallback((color: string) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) {
      toast("Selecione um elemento para aplicar a cor");
      return;
    }
    obj.set({ fill: color });
    fabricCanvas.requestRenderAll();
    toast.success("Cor aplicada");
  }, [fabricCanvas]);

  const copyColor = useCallback((color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(color).catch(() => {});
    toast.success(`${color} copiado`);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Pipette className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Extrair Cores</span>
      </div>

      <button
        onClick={extractColors}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-md border border-border hover:border-primary/50 bg-background text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
      >
        <Pipette className="w-3.5 h-3.5" />
        {loading ? "Extraindo..." : "Extrair cores do canvas"}
      </button>

      {colors.length > 0 && (
        <>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {colors.length} cores detectadas
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {colors.map((color) => (
              <div key={color} className="group relative">
                <button
                  onClick={() => applyToSelected(color)}
                  className="w-full aspect-square rounded-md border border-border hover:border-primary/50 hover:scale-110 transition-all shadow-sm"
                  style={{ backgroundColor: color }}
                  title={`Aplicar ${color} ao elemento selecionado`}
                />
                <button
                  onClick={(e) => copyColor(color, e)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-card border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copiar hex"
                >
                  <Copy className="w-2 h-2 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-center">
            Clique para aplicar ao elemento selecionado
          </p>
        </>
      )}
    </div>
  );
}
