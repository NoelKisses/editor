"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
} from "lucide-react";
import { toast } from "sonner";

interface ObjectAlignDistributePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

export function ObjectAlignDistributePanel({ fabricCanvas, selectionVersion }: ObjectAlignDistributePanelProps) {
  const [hasSelection, setHasSelection] = useState(false);
  const [hasMultiple, setHasMultiple] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const has = !!obj;
      const multi = obj?.type === "activeSelection" && obj._objects?.length > 1;
      setHasSelection(has);
      setHasMultiple(multi);
    });
  }, [fabricCanvas, selectionVersion]);

  const getActiveObjects = useCallback(() => {
    if (!fabricCanvas) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) return [];
    if (obj.type === "activeSelection") return obj._objects ?? [];
    return [obj];
  }, [fabricCanvas]);

  const alignToCanvas = useCallback((direction: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    const cw = fabricCanvas.width ?? 800;
    const ch = fabricCanvas.height ?? 600;
    const bw = obj.getBoundingRect().width;
    const bh = obj.getBoundingRect().height;

    switch (direction) {
      case "left": obj.set({ left: 0 }); break;
      case "center-h": obj.set({ left: (cw - bw) / 2 }); break;
      case "right": obj.set({ left: cw - bw }); break;
      case "top": obj.set({ top: 0 }); break;
      case "center-v": obj.set({ top: (ch - bh) / 2 }); break;
      case "bottom": obj.set({ top: ch - bh }); break;
    }
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Alinhado");
  }, [fabricCanvas]);

  const distributeObjects = useCallback((axis: "h" | "v") => {
    const objs = getActiveObjects();
    if (objs.length < 3) { toast.error("Selecione 3 ou mais objetos"); return; }

    if (axis === "h") {
      const sorted = [...objs].sort((a: { left: number }, b: { left: number }) => a.left - b.left);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const first: any = sorted[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const last: any = sorted[sorted.length - 1];
      const totalW = last.left + last.getScaledWidth() - first.left;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sumW = objs.reduce((acc: number, o: any) => acc + o.getScaledWidth(), 0);
      const gap = (totalW - sumW) / (objs.length - 1);
      let cursor = first.left;
      for (const o of sorted) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (o as any).set({ left: cursor });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (o as any).setCoords();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cursor += (o as any).getScaledWidth() + gap;
      }
    } else {
      const sorted = [...objs].sort((a: { top: number }, b: { top: number }) => a.top - b.top);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const first: any = sorted[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const last: any = sorted[sorted.length - 1];
      const totalH = last.top + last.getScaledHeight() - first.top;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sumH = objs.reduce((acc: number, o: any) => acc + o.getScaledHeight(), 0);
      const gap = (totalH - sumH) / (objs.length - 1);
      let cursor = first.top;
      for (const o of sorted) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (o as any).set({ top: cursor });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (o as any).setCoords();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cursor += (o as any).getScaledHeight() + gap;
      }
    }

    fabricCanvas.requestRenderAll();
    toast.success(`Distribuído ${axis === "h" ? "horizontalmente" : "verticalmente"}`);
  }, [getActiveObjects, fabricCanvas]);

  const ALIGN_BUTTONS = [
    { icon: AlignHorizontalJustifyStart, label: "Esq", action: () => alignToCanvas("left"), title: "Alinhar à esquerda" },
    { icon: AlignCenterHorizontal, label: "Centro H", action: () => alignToCanvas("center-h"), title: "Centralizar horizontalmente" },
    { icon: AlignHorizontalJustifyEnd, label: "Dir", action: () => alignToCanvas("right"), title: "Alinhar à direita" },
    { icon: AlignVerticalJustifyStart, label: "Topo", action: () => alignToCanvas("top"), title: "Alinhar ao topo" },
    { icon: AlignCenterVertical, label: "Centro V", action: () => alignToCanvas("center-v"), title: "Centralizar verticalmente" },
    { icon: AlignVerticalJustifyEnd, label: "Base", action: () => alignToCanvas("bottom"), title: "Alinhar à base" },
  ];

  const DISTRIBUTE_BUTTONS = [
    { icon: AlignHorizontalSpaceBetween, label: "Horizontal", action: () => distributeObjects("h"), title: "Distribuir horizontalmente" },
    { icon: AlignVerticalSpaceBetween, label: "Vertical", action: () => distributeObjects("v"), title: "Distribuir verticalmente" },
    { icon: AlignHorizontalDistributeCenter, label: "Centros H", action: () => distributeObjects("h"), title: "Alinhar centros horizontais" },
    { icon: AlignVerticalDistributeCenter, label: "Centros V", action: () => distributeObjects("v"), title: "Alinhar centros verticais" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <AlignCenterHorizontal className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Alinhar e Distribuir</span>
      </div>

      {!hasSelection ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <AlignCenterHorizontal className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um ou mais objetos</p>
        </div>
      ) : (
        <>
          {/* Align to canvas */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhar ao Canvas</span>
            <div className="grid grid-cols-3 gap-1">
              {ALIGN_BUTTONS.map(({ icon: Icon, label, action, title }) => (
                <button
                  key={label}
                  onClick={action}
                  title={title}
                  className="flex flex-col items-center gap-1 py-2 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[7px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Distribute */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Distribuir</span>
              {!hasMultiple && <span className="text-[8px] text-amber-500">Selecione 3+ objetos</span>}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {DISTRIBUTE_BUTTONS.map(({ icon: Icon, label, action, title }) => (
                <button
                  key={label}
                  onClick={action}
                  title={title}
                  disabled={!hasMultiple}
                  className="flex flex-col items-center gap-1 py-2 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[7px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick center */}
          <button
            onClick={() => { alignToCanvas("center-h"); alignToCanvas("center-v"); }}
            className="py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
          >
            Centralizar no Canvas
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Selecione múltiplos objetos com Shift+Click
          </p>
        </>
      )}
    </div>
  );
}
