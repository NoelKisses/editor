"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Replace } from "lucide-react";
import { toast } from "sonner";

interface ColorReplacePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion?: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function parseColor(color: string): string | null {
  if (!color) return null;
  if (color.startsWith("#")) return color.toLowerCase();
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return rgbToHex(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
  return null;
}

function extractCanvasColors(fabricCanvas: unknown): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvas = fabricCanvas as any;
  const colors = new Set<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processObj = (obj: any) => {
    if (!obj) return;
    const fill = parseColor(typeof obj.fill === "string" ? obj.fill : "");
    const stroke = parseColor(typeof obj.stroke === "string" ? obj.stroke : "");
    if (fill && fill !== "#000000" && fill !== "#ffffff") colors.add(fill);
    if (stroke && stroke !== "#000000") colors.add(stroke);
    if (obj._objects) obj._objects.forEach(processObj);
  };

  canvas?.getObjects?.()?.forEach(processObj);
  return Array.from(colors).slice(0, 20);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function replaceColorInCanvas(fabricCanvas: any, fromColor: string, toColor: string): number {
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processObj = (obj: any) => {
    const fill = parseColor(typeof obj.fill === "string" ? obj.fill : "");
    const stroke = parseColor(typeof obj.stroke === "string" ? obj.stroke : "");
    if (fill === fromColor.toLowerCase()) { obj.set({ fill: toColor }); count++; }
    if (stroke === fromColor.toLowerCase()) { obj.set({ stroke: toColor }); count++; }
    if (obj._objects) obj._objects.forEach(processObj);
  };
  fabricCanvas?.getObjects?.()?.forEach(processObj);
  fabricCanvas?.requestRenderAll?.();
  return count;
}

export function ColorReplacePanel({ fabricCanvas, selectionVersion }: ColorReplacePanelProps) {
  const [colors, setColors] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [replacement, setReplacement] = useState("#ffffff");

  void selectionVersion;

  const scan = useCallback(() => {
    if (!fabricCanvas) return;
    const found = extractCanvasColors(fabricCanvas);
    setColors(found);
    if (found.length > 0) setSelected(found[0]);
  }, [fabricCanvas]);

  useEffect(() => {
    queueMicrotask(scan);
  }, [scan]);

  const handleReplace = useCallback(() => {
    if (!selected || !fabricCanvas) return;
    const count = replaceColorInCanvas(fabricCanvas, selected, replacement);
    if (count > 0) {
      toast.success(`${count} propriedade(s) substituída(s)`);
      scan();
    } else {
      toast("Nenhum objeto encontrado com essa cor");
    }
  }, [selected, replacement, fabricCanvas, scan]);

  if (colors.length === 0) {
    return (
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Substituir Cor</span>
          <button onClick={scan} className="text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground/60 text-center py-4">
          Nenhuma cor detectada no canvas
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Substituir Cor Global</span>
        <button onClick={scan} title="Reescanear cores" className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">Cores no canvas — selecione para substituir</p>
        <div className="flex flex-wrap gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setSelected(c)}
              title={c}
              className={`w-7 h-7 rounded-md border-2 transition-all ${selected === c ? "border-primary scale-110 shadow-lg" : "border-transparent hover:border-primary/50"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md border border-border" style={{ backgroundColor: selected }} />
            <span className="text-[10px] text-muted-foreground font-mono">{selected}</span>
            <span className="text-muted-foreground/40 text-xs">→</span>
            <div className="relative w-8 h-8">
              <div className="w-8 h-8 rounded-md border border-border" style={{ backgroundColor: replacement }} />
              <input
                type="color"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">{replacement}</span>
          </div>

          <button
            onClick={handleReplace}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs transition-colors"
          >
            <Replace className="w-3 h-3" />
            Substituir em todo canvas
          </button>
        </div>
      )}
    </div>
  );
}
