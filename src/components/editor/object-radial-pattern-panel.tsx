"use client";

import { useEffect, useRef, useState } from "react";
import { Disc } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectRadialPatternPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clonePromise(obj: any, props: Record<string, unknown>): Promise<any> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.clone((cloned: any) => {
      if (props && typeof props === "object") {
        Object.assign(cloned, props);
      }
      resolve(cloned);
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectCenter(obj: any): { x: number; y: number } {
  if (!obj) return { x: 0, y: 0 };
  if (typeof obj.getCenterPoint === "function") {
    const c = obj.getCenterPoint();
    return { x: c.x, y: c.y };
  }
  const left = obj.left ?? 0;
  const top = obj.top ?? 0;
  const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
  const height = (obj.height ?? 0) * (obj.scaleY ?? 1);
  const originX = obj.originX === "center" ? 0 : 0.5;
  const originY = obj.originY === "center" ? 0 : 0.5;
  return {
    x: left + width * originX,
    y: top + height * originY,
  };
}

export function ObjectRadialPatternPanel({
  fabricCanvas,
}: ObjectRadialPatternPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [count, setCount] = useState<number>(8);
  const [radius, setRadius] = useState<number>(150);
  const [rotationOffset, setRotationOffset] = useState<number>(0);
  const [scaleStep, setScaleStep] = useState<number>(1);
  const [rotateClones, setRotateClones] = useState<boolean>(true);
  const [mirrorAlternates, setMirrorAlternates] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  useEffect(() => {
    queueMicrotask(() => {
      canvasRef.current = fabricCanvas;
    });
  }, [fabricCanvas]);

  const applyRadialPattern = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObject();
    if (!active) {
      toast.error("Selecione um objeto primeiro");
      return;
    }

    setIsApplying(true);

    import("fabric")
      .then(async (m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        if (!f) {
          toast.error("Fabric não carregado");
          setIsApplying(false);
          return;
        }

        const center = getObjectCenter(active);
        const parentId =
          active.id ?? active.name ?? `obj-${Date.now()}`;
        const rotationOffsetRad = (rotationOffset * Math.PI) / 180;
        const total = Math.max(3, Math.min(24, Math.floor(count)));

        try {
          for (let i = 0; i < total; i++) {
            const angle = (2 * Math.PI * i) / total + rotationOffsetRad;
            const clonePos = {
              x: center.x + Math.cos(angle) * radius,
              y: center.y + Math.sin(angle) * radius,
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cloned: any = await clonePromise(active, {});

            cloned.left = clonePos.x;
            cloned.top = clonePos.y;
            cloned.originX = "center";
            cloned.originY = "center";

            if (rotateClones) {
              cloned.angle = (angle * 180) / Math.PI + 90;
            }

            const factor = Math.pow(scaleStep, i);
            cloned.scaleX = (active.scaleX ?? 1) * factor;
            cloned.scaleY = (active.scaleY ?? 1) * factor;

            if (mirrorAlternates && i % 2 === 1) {
              cloned.flipX = true;
            }

            cloned.data = {
              ...(cloned.data ?? {}),
              radialPatternClone: true,
              parentId,
            };

            canvas.add(cloned);
          }

          canvas.requestRenderAll();
          toast.success(`${total} cópias aplicadas em padrão radial`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          toast.error(`Falha ao aplicar padrão: ${msg}`);
        } finally {
          setIsApplying(false);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Erro ao carregar fabric: ${msg}`);
        setIsApplying(false);
      });
  };

  const clearPattern = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = canvas.getObjects?.() ?? [];
    const toRemove = objects.filter(
      (o) => o?.data?.radialPatternClone === true,
    );
    toRemove.forEach((o) => canvas.remove(o));
    canvas.requestRenderAll?.();
    toast.success(`${toRemove.length} cópias removidas`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Disc className="h-5 w-5" />
        <h3 className="text-base font-semibold">
          Padrão Radial / Caleidoscópio
        </h3>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="radial-count"
          className="flex items-center justify-between text-sm"
        >
          <span>Quantidade de cópias</span>
          <span className="text-muted-foreground">{count}</span>
        </label>
        <input
          id="radial-count"
          type="range"
          min={3}
          max={24}
          step={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="radial-radius"
          className="flex items-center justify-between text-sm"
        >
          <span>Raio (px)</span>
          <span className="text-muted-foreground">{radius}</span>
        </label>
        <input
          id="radial-radius"
          type="range"
          min={30}
          max={400}
          step={1}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="radial-rotation-offset"
          className="flex items-center justify-between text-sm"
        >
          <span>Offset de rotação (°)</span>
          <span className="text-muted-foreground">{rotationOffset}</span>
        </label>
        <input
          id="radial-rotation-offset"
          type="range"
          min={0}
          max={360}
          step={1}
          value={rotationOffset}
          onChange={(e) => setRotationOffset(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="radial-scale-step"
          className="flex items-center justify-between text-sm"
        >
          <span>Passo de escala</span>
          <span className="text-muted-foreground">
            {scaleStep.toFixed(2)}
          </span>
        </label>
        <Input
          id="radial-scale-step"
          type="number"
          min={0.5}
          max={1.5}
          step={0.01}
          value={scaleStep}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) {
              setScaleStep(Math.min(1.5, Math.max(0.5, v)));
            }
          }}
        />
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.01}
          value={scaleStep}
          onChange={(e) => setScaleStep(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={rotateClones}
          onChange={(e) => setRotateClones(e.target.checked)}
        />
        <span>Rotacionar cópias para fora</span>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mirrorAlternates}
          onChange={(e) => setMirrorAlternates(e.target.checked)}
        />
        <span>Espelhar cópias alternadas</span>
      </label>

      <div className="flex flex-col gap-2">
        <Button onClick={applyRadialPattern} disabled={isApplying}>
          {isApplying ? "Aplicando..." : "Aplicar Padrão Radial"}
        </Button>
        <Button variant="outline" onClick={clearPattern}>
          Limpar Padrão
        </Button>
      </div>
    </div>
  );
}
