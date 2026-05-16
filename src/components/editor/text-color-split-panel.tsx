"use client";

import { useEffect, useRef, useState } from "react";
import { Replace } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextColorSplitPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const TEXT_TYPES = ["text", "i-text", "textbox"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedTexts(canvas: any): any[] {
  if (!canvas) return [];
  const active = canvas.getActiveObjects?.() ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return active.filter((o: any) => TEXT_TYPES.includes(o?.type));
}

function cloneTextWithStyle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textObj: any,
  offsetX: number,
  offsetY: number,
  fill: string,
  opacity: number,
  blendMode: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!textObj || typeof textObj.clone !== "function") {
      reject(new Error("Objeto não clonável"));
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      textObj.clone((cloned: any) => {
        try {
          cloned.set({
            left: (textObj.left ?? 0) + offsetX,
            top: (textObj.top ?? 0) + offsetY,
            fill,
            opacity,
            globalCompositeOperation: blendMode,
            selectable: true,
            evented: true,
          });
          cloned.data = {
            ...(cloned.data ?? {}),
            colorSplit: true,
            parentId: textObj.id ?? textObj.__uid ?? null,
          };
          resolve(cloned);
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

type SplitMode = "rgb" | "cmyk" | "double" | "anaglyph";

export function TextColorSplitPanel({ fabricCanvas }: TextColorSplitPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [mode, setMode] = useState<SplitMode>("rgb");
  const [offsetX, setOffsetX] = useState<number>(4);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(0.8);
  const [blendMode, setBlendMode] = useState<string>("normal");
  const [color1, setColor1] = useState<string>("#ff0066");
  const [color2, setColor2] = useState<string>("#00ccff");
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    const canvas = fabricCanvas;
    if (!canvas) return;

    const updateSelection = () => {
      const selected = getSelectedTexts(canvas);
      queueMicrotask(() => setHasSelection(selected.length > 0));
    };

    updateSelection();
    canvas.on?.("selection:created", updateSelection);
    canvas.on?.("selection:updated", updateSelection);
    canvas.on?.("selection:cleared", updateSelection);

    return () => {
      canvas.off?.("selection:created", updateSelection);
      canvas.off?.("selection:updated", updateSelection);
      canvas.off?.("selection:cleared", updateSelection);
    };
  }, [fabricCanvas]);

  const applySplit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const targets = getSelectedTexts(canvas);
    if (targets.length === 0) {
      toast.error("Selecione ao menos um texto");
      return;
    }

    try {
      await import("fabric").then(async (m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        if (!f) throw new Error("Fabric indisponível");

        for (const obj of targets) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const clones: any[] = [];

          if (mode === "rgb") {
            const layers = [
              { fill: "#ff0000", dx: -offsetX, dy: -offsetY },
              { fill: "#00ff00", dx: 0, dy: 0 },
              { fill: "#0000ff", dx: offsetX, dy: offsetY },
            ];
            for (const l of layers) {
              const c = await cloneTextWithStyle(obj, l.dx, l.dy, l.fill, opacity, blendMode);
              clones.push(c);
            }
          } else if (mode === "cmyk") {
            const layers = [
              { fill: "#00ffff", dx: -offsetX, dy: -offsetY },
              { fill: "#ff00ff", dx: offsetX, dy: -offsetY },
              { fill: "#ffff00", dx: -offsetX, dy: offsetY },
              { fill: "#000000", dx: offsetX, dy: offsetY },
            ];
            for (const l of layers) {
              const c = await cloneTextWithStyle(obj, l.dx, l.dy, l.fill, opacity, blendMode);
              clones.push(c);
            }
          } else if (mode === "double") {
            const layers = [
              { fill: color1, dx: -offsetX, dy: -offsetY },
              { fill: color2, dx: offsetX, dy: offsetY },
            ];
            for (const l of layers) {
              const c = await cloneTextWithStyle(obj, l.dx, l.dy, l.fill, opacity, blendMode);
              clones.push(c);
            }
          } else if (mode === "anaglyph") {
            const layers = [
              { fill: "#ff0000", dx: -offsetX, dy: -offsetY },
              { fill: "#00ffff", dx: offsetX, dy: offsetY },
            ];
            for (const l of layers) {
              const c = await cloneTextWithStyle(obj, l.dx, l.dy, l.fill, opacity, blendMode);
              clones.push(c);
            }
          }

          for (const c of clones) {
            canvas.add(c);
            canvas.sendBackwards?.(c);
          }
        }

        canvas.requestRenderAll?.();
      });

      toast.success("Split de cor aplicado");
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error(`Falha ao aplicar split: ${(err as any)?.message ?? "erro"}`);
    }
  };

  const removeSplit = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    try {
      const all = canvas.getObjects?.() ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toRemove = all.filter((o: any) => o?.data?.colorSplit === true);
      for (const o of toRemove) canvas.remove(o);
      canvas.requestRenderAll?.();
      toast.success(`${toRemove.length} camada(s) removida(s)`);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error(`Falha ao remover: ${(err as any)?.message ?? "erro"}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Replace className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Split de Cor (RGB/CMYK)</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={mode === "rgb" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("rgb")}
        >
          RGB Aberration
        </Button>
        <Button
          type="button"
          variant={mode === "cmyk" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("cmyk")}
        >
          CMYK Print
        </Button>
        <Button
          type="button"
          variant={mode === "double" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("double")}
        >
          Sombra Dupla
        </Button>
        <Button
          type="button"
          variant={mode === "anaglyph" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("anaglyph")}
        >
          Anáglifo
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Offset X</span>
            <span className="text-xs text-muted-foreground">{offsetX}</span>
          </div>
          <input
            type="range"
            min={-15}
            max={15}
            step={1}
            value={offsetX}
            onChange={(e) => setOffsetX(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Offset Y</span>
            <span className="text-xs text-muted-foreground">{offsetY}</span>
          </div>
          <input
            type="range"
            min={-15}
            max={15}
            step={1}
            value={offsetY}
            onChange={(e) => setOffsetY(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Opacidade</span>
            <span className="text-xs text-muted-foreground">{opacity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.3}
            max={1.0}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">Blend Mode</span>
          <select
            value={blendMode}
            onChange={(e) => setBlendMode(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="normal">normal</option>
            <option value="multiply">multiply</option>
            <option value="screen">screen</option>
            <option value="overlay">overlay</option>
            <option value="lighten">lighten</option>
            <option value="darken">darken</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium">Cores (Sombra Dupla)</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={color1}
              onChange={(e) => setColor1(e.target.value)}
              className="h-8 w-12 p-1"
            />
            <span className="text-xs text-muted-foreground">{color1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={color2}
              onChange={(e) => setColor2(e.target.value)}
              className="h-8 w-12 p-1"
            />
            <span className="text-xs text-muted-foreground">{color2}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          onClick={applySplit}
          disabled={!hasSelection}
        >
          Aplicar Split
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={removeSplit}
        >
          Remover Split
        </Button>
      </div>
    </div>
  );
}
