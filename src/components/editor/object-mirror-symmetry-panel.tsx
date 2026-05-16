"use client";

import { useEffect, useRef, useState } from "react";
import { FlipHorizontal2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectMirrorSymmetryPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

// Module-level helpers

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cloneObject(obj: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      if (!obj || typeof obj.clone !== "function") {
        reject(new Error("Objeto não suporta clone"));
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.clone((cloned: any) => {
        if (!cloned) {
          reject(new Error("Falha ao clonar objeto"));
          return;
        }
        resolve(cloned);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyMirror(obj: any, mode: string): void {
  if (!obj) return;
  switch (mode) {
    case "horizontal":
      obj.set("flipX", !obj.flipX);
      break;
    case "vertical":
      obj.set("flipY", !obj.flipY);
      break;
    case "both":
      obj.set("flipX", !obj.flipX);
      obj.set("flipY", !obj.flipY);
      break;
    case "diagonal":
      obj.set("angle", ((obj.angle || 0) + 90) % 360);
      obj.set("flipX", !obj.flipX);
      break;
    default:
      break;
  }
  if (typeof obj.setCoords === "function") {
    obj.setCoords();
  }
}

function computeMirrorPosition(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  direction: string,
  distance: number
): { left: number; top: number } {
  const left = typeof obj?.left === "number" ? obj.left : 0;
  const top = typeof obj?.top === "number" ? obj.top : 0;
  const width =
    (typeof obj?.width === "number" ? obj.width : 0) *
    (typeof obj?.scaleX === "number" ? obj.scaleX : 1);
  const height =
    (typeof obj?.height === "number" ? obj.height : 0) *
    (typeof obj?.scaleY === "number" ? obj.scaleY : 1);

  switch (direction) {
    case "right":
      return { left: left + width + distance, top };
    case "left":
      return { left: left - width - distance, top };
    case "down":
      return { left, top: top + height + distance };
    case "up":
      return { left, top: top - height - distance };
    default:
      return { left, top };
  }
}

function computeRadialPositions(
  pivot: { x: number; y: number },
  radius: number,
  count: number
): Array<{ x: number; y: number; angle: number }> {
  const positions: Array<{ x: number; y: number; angle: number }> = [];
  const safeCount = Math.max(1, Math.floor(count));
  const step = (Math.PI * 2) / safeCount;
  for (let i = 0; i < safeCount; i++) {
    const angle = step * i;
    positions.push({
      x: pivot.x + Math.cos(angle) * radius,
      y: pivot.y + Math.sin(angle) * radius,
      angle: (angle * 180) / Math.PI,
    });
  }
  return positions;
}

export function ObjectMirrorSymmetryPanel({
  fabricCanvas,
}: ObjectMirrorSymmetryPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [mirrorMode, setMirrorMode] = useState<"horizontal" | "vertical" | "both" | "diagonal">(
    "horizontal"
  );
  const [applyMode, setApplyMode] = useState<"inPlace" | "clone">("inPlace");
  const [offsetDistance, setOffsetDistance] = useState<number>(50);
  const [clonePosition, setClonePosition] = useState<"right" | "left" | "down" | "up">("right");
  const [symmetryCount, setSymmetryCount] = useState<number>(6);
  const [pivotX, setPivotX] = useState<number>(0);
  const [pivotY, setPivotY] = useState<number>(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
    if (fabricCanvas) {
      const cx = (fabricCanvas.getWidth?.() ?? 800) / 2;
      const cy = (fabricCanvas.getHeight?.() ?? 600) / 2;
      queueMicrotask(() => {
        setPivotX(cx);
        setPivotY(cy);
      });
    }
  }, [fabricCanvas]);

  const handleApplyMirror = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObject?.();
    if (!active) {
      toast.error("Selecione um objeto");
      return;
    }

    try {
      if (applyMode === "inPlace") {
        applyMirror(active, mirrorMode);
        canvas.requestRenderAll?.();
        toast.success("Espelhamento aplicado");
      } else {
        const cloned = await cloneObject(active);
        applyMirror(cloned, mirrorMode);
        const pos = computeMirrorPosition(active, clonePosition, offsetDistance);
        cloned.set({ left: pos.left, top: pos.top });
        cloned.data = { ...(cloned.data || {}), mirrorClone: true };
        if (typeof cloned.setCoords === "function") cloned.setCoords();
        canvas.add(cloned);
        canvas.setActiveObject?.(cloned);
        canvas.requestRenderAll?.();
        toast.success("Cópia espelhada criada");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao espelhar: ${msg}`);
    }
  };

  const handleRadialSymmetry = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObject?.();
    if (!active) {
      toast.error("Selecione um objeto");
      return;
    }

    try {
      const mod = await import("fabric");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (mod as any).fabric as any;
      if (!f) {
        toast.error("Fabric não disponível");
        return;
      }

      const dx = (active.left ?? 0) - pivotX;
      const dy = (active.top ?? 0) - pivotY;
      const radius = Math.sqrt(dx * dx + dy * dy) || 100;
      const positions = computeRadialPositions(
        { x: pivotX, y: pivotY },
        radius,
        symmetryCount
      );

      const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      const originalAngle = active.angle || 0;

      for (let i = 1; i < positions.length; i++) {
        const p = positions[i];
        // eslint-disable-next-line no-await-in-loop
        const cloned = await cloneObject(active);
        cloned.set({
          left: p.x,
          top: p.y,
          angle: originalAngle + (p.angle - baseAngle),
        });
        cloned.data = { ...(cloned.data || {}), mirrorClone: true };
        if (typeof cloned.setCoords === "function") cloned.setCoords();
        canvas.add(cloned);
      }

      canvas.requestRenderAll?.();
      toast.success(`Simetria radial com ${symmetryCount} cópias criada`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro na simetria: ${msg}`);
    }
  };

  const handleClearMirrors = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    try {
      const objects = canvas.getObjects?.() ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toRemove = objects.filter((o: any) => o?.data?.mirrorClone === true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toRemove.forEach((o: any) => canvas.remove(o));
      canvas.discardActiveObject?.();
      canvas.requestRenderAll?.();
      toast.success(`${toRemove.length} espelhamento(s) removido(s)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao limpar: ${msg}`);
    }
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <FlipHorizontal2 className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Espelhamento & Simetria</h3>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Tipo de Espelhamento</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mirrorMode === "horizontal" ? "default" : "outline"}
            size="sm"
            onClick={() => setMirrorMode("horizontal")}
          >
            Horizontal
          </Button>
          <Button
            type="button"
            variant={mirrorMode === "vertical" ? "default" : "outline"}
            size="sm"
            onClick={() => setMirrorMode("vertical")}
          >
            Vertical
          </Button>
          <Button
            type="button"
            variant={mirrorMode === "both" ? "default" : "outline"}
            size="sm"
            onClick={() => setMirrorMode("both")}
          >
            H + V
          </Button>
          <Button
            type="button"
            variant={mirrorMode === "diagonal" ? "default" : "outline"}
            size="sm"
            onClick={() => setMirrorMode("diagonal")}
          >
            Diagonal
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Aplicar Em</span>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="apply-mode"
              value="inPlace"
              checked={applyMode === "inPlace"}
              onChange={() => setApplyMode("inPlace")}
            />
            Apenas selecionado
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="apply-mode"
              value="clone"
              checked={applyMode === "clone"}
              onChange={() => setApplyMode("clone")}
            />
            Criar Cópia Espelhada
          </label>
        </div>
      </div>

      {applyMode === "clone" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Distância da Cópia</span>
              <span className="text-xs text-muted-foreground">{offsetDistance}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={1}
              value={offsetDistance}
              onChange={(e) => setOffsetDistance(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium">Posição da Cópia</span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={clonePosition === "right" ? "default" : "outline"}
                size="sm"
                onClick={() => setClonePosition("right")}
              >
                Direita
              </Button>
              <Button
                type="button"
                variant={clonePosition === "left" ? "default" : "outline"}
                size="sm"
                onClick={() => setClonePosition("left")}
              >
                Esquerda
              </Button>
              <Button
                type="button"
                variant={clonePosition === "down" ? "default" : "outline"}
                size="sm"
                onClick={() => setClonePosition("down")}
              >
                Baixo
              </Button>
              <Button
                type="button"
                variant={clonePosition === "up" ? "default" : "outline"}
                size="sm"
                onClick={() => setClonePosition("up")}
              >
                Cima
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button type="button" className="w-full" size="sm" onClick={handleApplyMirror}>
        Aplicar Espelhamento
      </Button>

      <div className="space-y-3 border-t pt-3">
        <span className="text-xs font-semibold">Simetria Radial</span>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Quantidade de Cópias</span>
            <span className="text-xs text-muted-foreground">{symmetryCount}</span>
          </div>
          <input
            type="range"
            min={3}
            max={12}
            step={1}
            value={symmetryCount}
            onChange={(e) => setSymmetryCount(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium">Pivot (Centro)</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">X</span>
              <Input
                type="number"
                value={pivotX}
                onChange={(e) => setPivotX(Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Y</span>
              <Input
                type="number"
                value={pivotY}
                onChange={(e) => setPivotY(Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          size="sm"
          onClick={handleRadialSymmetry}
        >
          Gerar Simetria Radial
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="sm"
        onClick={handleClearMirrors}
      >
        Limpar Espelhamentos
      </Button>
    </div>
  );
}
