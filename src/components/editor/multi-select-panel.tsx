"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Trash2, Copy, Group } from "lucide-react";
import { toast } from "sonner";

interface MultiSelectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

export function MultiSelectPanel({ fabricCanvas, selectionVersion }: MultiSelectPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selection, setSelection] = useState<any>(null);
  const [count, setCount] = useState(0);
  const [fillColor, setFillColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(100);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion;

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj || obj.type !== "activeSelection") {
        setSelection(null);
        setCount(0);
        return;
      }
      setSelection(obj);
      setCount(obj._objects?.length ?? 0);
      // Use first object's fill as reference color
      const firstFill = obj._objects?.[0]?.fill;
      if (typeof firstFill === "string") setFillColor(firstFill);
      setOpacity(Math.round((obj.opacity ?? 1) * 100));
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const applyToAll = useCallback((props: Record<string, unknown>) => {
    if (!selection || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selection._objects?.forEach((obj: any) => {
      obj.set(props);
    });
    fabricCanvas.requestRenderAll();
  }, [selection, fabricCanvas]);

  const handleGroup = useCallback(() => {
    if (!selection || !fabricCanvas) return;
    const group = selection.toGroup();
    fabricCanvas.setActiveObject(group);
    fabricCanvas.requestRenderAll();
    toast.success(`${count} elementos agrupados`);
  }, [selection, fabricCanvas, count]);

  const handleDuplicate = useCallback(() => {
    if (!selection || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selection.clone((cloned: any) => {
      cloned.set({ left: (selection.left ?? 0) + 20, top: (selection.top ?? 0) + 20 });
      fabricCanvas.discardActiveObject();
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.requestRenderAll();
      toast.success(`${count} elementos duplicados`);
    });
  }, [selection, fabricCanvas, count]);

  const handleDelete = useCallback(() => {
    if (!selection || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selection._objects?.forEach((obj: any) => fabricCanvas.remove(obj));
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
    toast.success(`${count} elementos removidos`);
  }, [selection, fabricCanvas, count]);

  const handleAlignLeft = useCallback(() => {
    if (!selection || !fabricCanvas) return;
    const leftmost = Math.min(...(selection._objects ?? []).map((o: { left?: number }) => o.left ?? 0));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selection._objects?.forEach((obj: any) => { obj.set({ left: leftmost }); obj.setCoords?.(); });
    fabricCanvas.requestRenderAll();
  }, [selection, fabricCanvas]);

  const handleAlignCenter = useCallback(() => {
    if (!selection || !fabricCanvas) return;
    const cx = (selection.left ?? 0) + (selection.getScaledWidth?.() ?? 0) / 2;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selection._objects?.forEach((obj: any) => {
      obj.set({ left: cx - (obj.getScaledWidth?.() ?? obj.width ?? 0) / 2 });
      obj.setCoords?.();
    });
    fabricCanvas.requestRenderAll();
  }, [selection, fabricCanvas]);

  const handleAlignRight = useCallback(() => {
    if (!selection || !fabricCanvas) return;
    const rightmost = Math.max(...(selection._objects ?? []).map((o: { left?: number; width?: number; scaleX?: number }) => (o.left ?? 0) + (o.width ?? 0) * (o.scaleX ?? 1)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selection._objects?.forEach((obj: any) => {
      obj.set({ left: rightmost - (obj.getScaledWidth?.() ?? obj.width ?? 0) });
      obj.setCoords?.();
    });
    fabricCanvas.requestRenderAll();
  }, [selection, fabricCanvas]);

  const handleDistributeH = useCallback(() => {
    if (!selection || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = [...(selection._objects ?? [])].sort((a, b) => (a.left ?? 0) - (b.left ?? 0));
    if (objs.length < 2) return;
    const first = objs[0].left ?? 0;
    const last = (objs[objs.length - 1].left ?? 0) + (objs[objs.length - 1].getScaledWidth?.() ?? 0);
    const totalW = objs.reduce((s, o) => s + (o.getScaledWidth?.() ?? o.width ?? 0), 0);
    const gap = (last - first - totalW) / (objs.length - 1);
    let x = first;
    objs.forEach((obj) => {
      obj.set({ left: x });
      obj.setCoords?.();
      x += (obj.getScaledWidth?.() ?? obj.width ?? 0) + gap;
    });
    fabricCanvas.requestRenderAll();
    toast.success("Distribuído horizontalmente");
  }, [selection, fabricCanvas]);

  if (!selection || count < 2) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pr-2 border-r border-border">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">{count}</span>
          <span>selecionados</span>
        </div>

        {/* Cor em massa */}
        <div className="flex items-center gap-1.5 px-2 border-r border-border">
          <span className="text-[9px] text-muted-foreground">Cor:</span>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => {
              setFillColor(e.target.value);
              applyToAll({ fill: e.target.value });
            }}
            className="w-6 h-6 rounded cursor-pointer border border-border"
          />
        </div>

        {/* Opacidade em massa */}
        <div className="flex items-center gap-1.5 px-2 border-r border-border">
          <span className="text-[9px] text-muted-foreground">Opac:</span>
          <input
            type="number"
            value={opacity}
            min={0}
            max={100}
            onChange={(e) => {
              const v = Number(e.target.value);
              setOpacity(v);
              applyToAll({ opacity: v / 100 });
            }}
            className="w-10 text-[10px] bg-background border border-border rounded px-1 py-0.5 tabular-nums"
          />
          <span className="text-[9px] text-muted-foreground">%</span>
        </div>

        {/* Align */}
        <div className="flex items-center gap-0.5 px-2 border-r border-border">
          <button onClick={handleAlignLeft} className="w-6 h-6 rounded hover:bg-accent/50 flex items-center justify-center text-[10px] text-muted-foreground hover:text-foreground" title="Alinhar à esquerda">⇤</button>
          <button onClick={handleAlignCenter} className="w-6 h-6 rounded hover:bg-accent/50 flex items-center justify-center text-[10px] text-muted-foreground hover:text-foreground" title="Centralizar">↔</button>
          <button onClick={handleAlignRight} className="w-6 h-6 rounded hover:bg-accent/50 flex items-center justify-center text-[10px] text-muted-foreground hover:text-foreground" title="Alinhar à direita">⇥</button>
          <button onClick={handleDistributeH} className="w-6 h-6 rounded hover:bg-accent/50 flex items-center justify-center text-[10px] text-muted-foreground hover:text-foreground" title="Distribuir horizontalmente">⁝⁝⁝</button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 pl-1">
          <button onClick={handleGroup} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground" title="Agrupar (Ctrl+G)">
            <Group className="w-3 h-3" /> Agrupar
          </button>
          <button onClick={handleDuplicate} className="w-6 h-6 rounded hover:bg-accent/50 flex items-center justify-center text-muted-foreground hover:text-foreground" title="Duplicar seleção">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={handleDelete} className="w-6 h-6 rounded hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive" title="Excluir seleção">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
