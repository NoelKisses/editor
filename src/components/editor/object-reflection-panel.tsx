"use client";

import { useCallback, useEffect, useState } from "react";
import { FlipVertical2, X } from "lucide-react";
import { toast } from "sonner";

interface ObjectReflectionPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type ReflectionAxis = "horizontal" | "vertical" | "both";

const REFLECTION_KEY = "__reflection__";

export function ObjectReflectionPanel({ fabricCanvas, selectionVersion }: ObjectReflectionPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [hasReflection, setHasReflection] = useState(false);
  const [axis, setAxis] = useState<ReflectionAxis>("horizontal");
  const [offset, setOffset] = useState(10);
  const [fadeAmount, setFadeAmount] = useState(0.4);
  const [reflectionScale, setReflectionScale] = useState(0.5);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const has = !!obj && obj.type !== "activeSelection";
      setHasObject(has);
      if (has) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = fabricCanvas.getObjects().find((o: any) => o.data?.[REFLECTION_KEY] === obj.data?.id || o.data?.[REFLECTION_KEY] === obj.type);
        setHasReflection(!!existing);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && obj.type !== "activeSelection" ? obj : null;
  }, [fabricCanvas]);

  const removeReflection = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = fabricCanvas.getObjects().filter((o: any) => o.data?.[REFLECTION_KEY]);
    toRemove.forEach((o: unknown) => fabricCanvas.remove(o));
    fabricCanvas.requestRenderAll();
    setHasReflection(false);
    toast.success("Reflexo removido");
  }, [fabricCanvas]);

  const applyReflection = useCallback(() => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    removeReflection();

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const objJSON = obj.toObject();
      const objId = obj.data?.id ?? obj.type;

      const createReflection = (flipX: boolean, flipY: boolean, dx: number, dy: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clone = new (f[obj.type.charAt(0).toUpperCase() + obj.type.slice(1)] as any)(objJSON, {});
        // For images/textboxes use fromObject pattern
        const w = (obj.width ?? 100) * (obj.scaleX ?? 1);
        const h = (obj.height ?? 100) * (obj.scaleY ?? 1);

        clone.set({
          left: (obj.left ?? 0) + dx,
          top: (obj.top ?? 0) + dy,
          flipX: flipX ? !obj.flipX : obj.flipX,
          flipY: flipY ? !obj.flipY : obj.flipY,
          opacity: obj.opacity * fadeAmount,
          scaleX: obj.scaleX * (flipX ? reflectionScale : 1),
          scaleY: obj.scaleY * (flipY ? reflectionScale : 1),
          selectable: false,
          evented: false,
          data: { [REFLECTION_KEY]: objId },
        });

        // Gradient overlay for fade effect
        const gradient = new f.Gradient({
          type: "linear",
          gradientUnits: "percentage",
          coords: flipY ? { x1: 0, y1: 0, x2: 0, y2: 1 } : { x1: 0, y1: 0, x2: 1, y2: 0 },
          colorStops: [
            { offset: 0, color: `rgba(0,0,0,${fadeAmount})` },
            { offset: 1, color: "rgba(0,0,0,0)" },
          ],
        });

        void w; void h; void gradient;

        fabricCanvas.add(clone);
        fabricCanvas.sendObjectToBack(clone);
      };

      const objW = (obj.width ?? 100) * (obj.scaleX ?? 1);
      const objH = (obj.height ?? 100) * (obj.scaleY ?? 1);

      if (axis === "horizontal" || axis === "both") {
        createReflection(false, true, 0, objH + offset);
      }
      if (axis === "vertical" || axis === "both") {
        createReflection(true, false, objW + offset, 0);
      }

      fabricCanvas.requestRenderAll();
      setHasReflection(true);
      toast.success(`Reflexo ${axis} aplicado`);
    });
  }, [getObject, removeReflection, axis, offset, fadeAmount, reflectionScale, fabricCanvas]);

  const AXES: { value: ReflectionAxis; label: string }[] = [
    { value: "horizontal", label: "Horizontal" },
    { value: "vertical", label: "Vertical" },
    { value: "both", label: "Ambos" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <FlipVertical2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Reflexo do Objeto</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <FlipVertical2 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para criar reflexo</p>
        </div>
      ) : (
        <>
          {hasReflection && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded border border-primary/30 bg-primary/5">
              <span className="text-[9px] text-primary">Reflexo ativo</span>
              <button onClick={removeReflection}
                className="flex items-center gap-0.5 text-[8px] text-destructive hover:underline">
                <X className="w-2.5 h-2.5" /> Remover
              </button>
            </div>
          )}

          {/* Axis */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Direção</span>
            <div className="grid grid-cols-3 gap-1">
              {AXES.map(a => (
                <button key={a.value} onClick={() => setAxis(a.value)}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${axis === a.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Offset */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Distância</span>
              <span className="text-[9px] tabular-nums">{offset}px</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={offset}
              onChange={e => setOffset(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Fade */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Opacidade do Reflexo</span>
              <span className="text-[9px] tabular-nums">{Math.round(fadeAmount * 100)}%</span>
            </div>
            <input type="range" min={0.05} max={1} step={0.05} value={fadeAmount}
              onChange={e => setFadeAmount(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Scale */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Escala do Reflexo</span>
              <span className="text-[9px] tabular-nums">{Math.round(reflectionScale * 100)}%</span>
            </div>
            <input type="range" min={0.1} max={1} step={0.05} value={reflectionScale}
              onChange={e => setReflectionScale(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          <button onClick={applyReflection}
            className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
            <FlipVertical2 className="w-3 h-3" /> Aplicar Reflexo
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            O reflexo é gerado como uma cópia espelhada com opacidade reduzida
          </p>
        </>
      )}
    </div>
  );
}
