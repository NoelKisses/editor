"use client";

import { useEffect, useRef, useState } from "react";
import { Box } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Object3DExtrudePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface PresetDirection {
  label: string;
  symbol: string;
  offsetX: number;
  offsetY: number;
}

const PRESET_DIRECTIONS: PresetDirection[] = [
  { label: "Bottom-Right", symbol: "↘", offsetX: 2, offsetY: 2 },
  { label: "Bottom-Left", symbol: "↙", offsetX: -2, offsetY: 2 },
  { label: "Top-Right", symbol: "↗", offsetX: 2, offsetY: -2 },
  { label: "Top-Left", symbol: "↖", offsetX: -2, offsetY: -2 },
];

function generateParentId(): string {
  return `extrude-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function computeLayerOpacity(
  index: number,
  total: number,
  baseOpacity: number,
  gradient: boolean,
): number {
  if (!gradient) return baseOpacity;
  if (total <= 1) return baseOpacity;
  const t = index / Math.max(total - 1, 1);
  const min = 0.1;
  return baseOpacity - (baseOpacity - min) * t;
}

export function Object3DExtrudePanel({ fabricCanvas }: Object3DExtrudePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [depth, setDepth] = useState(8);
  const [offsetX, setOffsetX] = useState(2);
  const [offsetY, setOffsetY] = useState(2);
  const [color, setColor] = useState("#888888");
  const [gradient, setGradient] = useState(true);
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const update = () => {
      const obj = fabricCanvas.getActiveObject?.();
      queueMicrotask(() => setHasSelection(Boolean(obj)));
    };
    update();
    fabricCanvas.on?.("selection:created", update);
    fabricCanvas.on?.("selection:updated", update);
    fabricCanvas.on?.("selection:cleared", update);
    return () => {
      fabricCanvas.off?.("selection:created", update);
      fabricCanvas.off?.("selection:updated", update);
      fabricCanvas.off?.("selection:cleared", update);
    };
  }, [fabricCanvas]);

  const applyPreset = (preset: PresetDirection) => {
    setOffsetX(preset.offsetX);
    setOffsetY(preset.offsetY);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original: any = canvas.getActiveObject?.();
    if (!original) {
      toast.error("Selecione um objeto primeiro");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      if (!f) {
        toast.error("Fabric não disponível");
        return;
      }

      const parentId = generateParentId();
      const baseOpacity =
        typeof original.opacity === "number" ? original.opacity : 1;
      const baseLeft = original.left ?? 0;
      const baseTop = original.top ?? 0;

      let pending = depth;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layers: any[] = [];

      for (let i = depth; i >= 1; i--) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        original.clone((cloned: any) => {
          cloned.set({
            left: baseLeft + offsetX * i,
            top: baseTop + offsetY * i,
            fill: color,
            opacity: computeLayerOpacity(i - 1, depth, baseOpacity, gradient),
            selectable: false,
            evented: false,
          });
          cloned.data = { extrudeLayer: true, parentId };
          layers.push(cloned);
          pending -= 1;
          if (pending === 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            layers.forEach((l: any) => {
              canvas.add(l);
              canvas.sendToBack(l);
            });
            original.data = { ...(original.data ?? {}), extrudeOriginal: true, parentId };
            canvas.bringToFront(original);
            canvas.requestRenderAll?.();
            toast.success(`Extrusão aplicada com ${depth} camadas`);
          }
        });
      }
    });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = canvas.getObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objects.filter((o: any) => o?.data?.extrudeLayer === true);
    if (toRemove.length === 0) {
      toast.info("Nenhuma camada de extrusão para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll?.();
    toast.success(`${toRemove.length} camadas removidas`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Box className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Extrusão 3D</h3>
      </div>

      {!hasSelection && (
        <Badge variant="secondary">Selecione um objeto para aplicar</Badge>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Profundidade (camadas)</span>
          <span className="text-sm font-mono">{depth}</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Offset X</span>
          <span className="text-sm font-mono">{offsetX}</span>
        </div>
        <input
          type="range"
          min={-10}
          max={10}
          step={1}
          value={offsetX}
          onChange={(e) => setOffsetX(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Offset Y</span>
          <span className="text-sm font-mono">{offsetY}</span>
        </div>
        <input
          type="range"
          min={-10}
          max={10}
          step={1}
          value={offsetY}
          onChange={(e) => setOffsetY(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm">Cor da extrusão</span>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 p-1"
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={gradient}
          onChange={(e) => setGradient(e.target.checked)}
        />
        <span className="text-sm">Gradiente de opacidade</span>
      </label>

      <div className="space-y-2">
        <span className="text-sm">Direções predefinidas</span>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_DIRECTIONS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              <span className="mr-2 text-base">{preset.symbol}</span>
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Button onClick={handleApply} className="w-full" disabled={!hasSelection}>
          Aplicar Extrusão
        </Button>
        <Button onClick={handleRemove} variant="outline" className="w-full">
          Remover Extrusão
        </Button>
      </div>
    </div>
  );
}
