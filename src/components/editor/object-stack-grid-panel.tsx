"use client";

import { useCallback, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ObjectStackGridPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type DistributionMode = "identical" | "rotation" | "scale-down" | "fade";

const DISTRIBUTION_MODES: { value: DistributionMode; label: string }[] = [
  { value: "identical", label: "Identical" },
  { value: "rotation", label: "Rotation" },
  { value: "scale-down", label: "Scale Down" },
  { value: "fade", label: "Fade" },
];

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjWidth(obj: any): number {
  return (obj?.width ?? 0) * (obj?.scaleX ?? 1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjHeight(obj: any): number {
  return (obj?.height ?? 0) * (obj?.scaleY ?? 1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clonePromise(obj: any): Promise<any> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.clone((cloned: any) => resolve(cloned));
  });
}

function applyDistribution(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cloned: any,
  mode: DistributionMode,
  index: number,
) {
  switch (mode) {
    case "rotation":
      cloned.set({ angle: (cloned.angle ?? 0) + 5 * index });
      break;
    case "scale-down": {
      const factor = Math.pow(0.95, index);
      cloned.set({
        scaleX: (cloned.scaleX ?? 1) * factor,
        scaleY: (cloned.scaleY ?? 1) * factor,
      });
      break;
    }
    case "fade": {
      const opacity = Math.pow(0.95, index) * (cloned.opacity ?? 1);
      cloned.set({ opacity });
      break;
    }
    case "identical":
    default:
      break;
  }
}

export function ObjectStackGridPanel({ fabricCanvas }: ObjectStackGridPanelProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [gapX, setGapX] = useState(20);
  const [gapY, setGapY] = useState(20);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [mode, setMode] = useState<DistributionMode>("identical");

  const totalClones = Math.max(0, rows * cols - 1);

  const captureSelectedPosition = useCallback(() => {
    if (!fabricCanvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const obj = fabricCanvas.getActiveObject();
    if (!obj) {
      toast.error("Nenhum objeto selecionado");
      return;
    }
    setStartX(Math.round(obj.left ?? 0));
    setStartY(Math.round(obj.top ?? 0));
    toast.success("Posição capturada");
  }, [fabricCanvas]);

  const generateGrid = useCallback(async () => {
    if (!fabricCanvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const obj = fabricCanvas.getActiveObject();
    if (!obj) {
      toast.error("Selecione um objeto");
      return;
    }

    const objWidth = getObjWidth(obj);
    const objHeight = getObjHeight(obj);

    try {
      let created = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (row === 0 && col === 0) continue;
          const i = row * cols + col;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cloned: any = await clonePromise(obj);
          cloned.set({
            left: startX + col * (objWidth + gapX),
            top: startY + row * (objHeight + gapY),
          });
          applyDistribution(cloned, mode, i);
          cloned.data = { ...(cloned.data ?? {}), stackGridClone: true, gridIndex: i };
          fabricCanvas.add(cloned);
          created++;
        }
      }
      fabricCanvas.requestRenderAll();
      toast.success(`${created} clones criados`);
    } catch (err) {
      toast.error(`Falha ao gerar grade: ${(err as Error).message}`);
    }
  }, [fabricCanvas, rows, cols, gapX, gapY, startX, startY, mode]);

  const clearClones = useCallback(() => {
    if (!fabricCanvas) {
      toast.error("Canvas indisponível");
      return;
    }
    // Use dynamic fabric import for parity with other panels
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      void f;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all = fabricCanvas.getObjects() as any[];
      const toRemove = all.filter((o) => o?.data?.stackGridClone === true);
      toRemove.forEach((o) => fabricCanvas.remove(o));
      fabricCanvas.requestRenderAll();
      toast.success(`${toRemove.length} clones removidos`);
    });
  }, [fabricCanvas]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-4 w-4" />
        <h3 className="font-semibold text-sm">Stack & Grid de Objetos</h3>
        <Badge variant="secondary" className="ml-auto">
          {totalClones} clones
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Linhas</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={rows}
            onChange={(e) => setRows(clamp(parseInt(e.target.value, 10), 1, 10))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Colunas</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={cols}
            onChange={(e) => setCols(clamp(parseInt(e.target.value, 10), 1, 10))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Gap X</span>
            <span>{gapX}px</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={gapX}
            onChange={(e) => setGapX(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Gap Y</span>
            <span>{gapY}px</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={gapY}
            onChange={(e) => setGapY(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Start X</label>
          <Input
            type="number"
            value={startX}
            onChange={(e) => setStartX(parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Start Y</label>
          <Input
            type="number"
            value={startY}
            onChange={(e) => setStartY(parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Distribuição</label>
        <div className="grid grid-cols-2 gap-1">
          {DISTRIBUTION_MODES.map((m) => (
            <Button
              key={m.value}
              type="button"
              variant={mode === m.value ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" size="sm" onClick={captureSelectedPosition}>
          Capturar Posição
        </Button>
        <Button type="button" size="sm" onClick={generateGrid}>
          Gerar Grade
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={clearClones}>
          Limpar Clones
        </Button>
      </div>
    </div>
  );
}
