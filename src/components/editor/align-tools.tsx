"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
} from "lucide-react";
import { toast } from "sonner";

interface AlignToolsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function AlignTools({ fabricCanvas }: AlignToolsProps) {
  const align = useCallback(
    (direction: string) => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const active: any = fabricCanvas.getActiveObject();
      if (!active) {
        toast.error("Selecione um elemento primeiro");
        return;
      }

      const canvasW: number = fabricCanvas.getWidth() / (fabricCanvas.getZoom() || 1);
      const canvasH: number = fabricCanvas.getHeight() / (fabricCanvas.getZoom() || 1);
      const bounding = active.getBoundingRect(true);

      switch (direction) {
        case "left":
          active.set({ left: 0 });
          break;
        case "center-h":
          active.set({ left: canvasW / 2 - bounding.width / 2 });
          break;
        case "right":
          active.set({ left: canvasW - bounding.width });
          break;
        case "top":
          active.set({ top: 0 });
          break;
        case "middle-v":
          active.set({ top: canvasH / 2 - bounding.height / 2 });
          break;
        case "bottom":
          active.set({ top: canvasH - bounding.height });
          break;
        case "center-canvas":
          active.set({
            left: canvasW / 2 - bounding.width / 2,
            top: canvasH / 2 - bounding.height / 2,
          });
          break;
      }
      active.setCoords();
      fabricCanvas.requestRenderAll();
    },
    [fabricCanvas]
  );

  const distribute = useCallback(
    (axis: "h" | "v") => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const active: any = fabricCanvas.getActiveObject();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objs: any[] = active?._objects ?? (active ? [active] : fabricCanvas.getObjects());
      if (objs.length < 3) {
        toast.error("Selecione ao menos 3 elementos para distribuir");
        return;
      }

      if (axis === "h") {
        const sorted = [...objs].sort((a, b) => a.left - b.left);
        const first = sorted[0].left;
        const last = sorted[sorted.length - 1].left + sorted[sorted.length - 1].getScaledWidth();
        const totalW = sorted.reduce((s: number, o: { getScaledWidth: () => number }) => s + o.getScaledWidth(), 0);
        const gap = (last - first - totalW) / (sorted.length - 1);
        let cursor = first;
        sorted.forEach((o) => {
          o.set({ left: cursor });
          o.setCoords();
          cursor += o.getScaledWidth() + gap;
        });
      } else {
        const sorted = [...objs].sort((a, b) => a.top - b.top);
        const first = sorted[0].top;
        const last = sorted[sorted.length - 1].top + sorted[sorted.length - 1].getScaledHeight();
        const totalH = sorted.reduce((s: number, o: { getScaledHeight: () => number }) => s + o.getScaledHeight(), 0);
        const gap = (last - first - totalH) / (sorted.length - 1);
        let cursor = first;
        sorted.forEach((o) => {
          o.set({ top: cursor });
          o.setCoords();
          cursor += o.getScaledHeight() + gap;
        });
      }
      fabricCanvas.requestRenderAll();
      toast.success("Distribuído com espaçamento igual");
    },
    [fabricCanvas]
  );

  const BTN = "h-7 w-7 p-0";

  return (
    <div className="flex flex-col gap-3 pt-2">
      <h3 className="text-sm font-semibold text-foreground">Alinhamento</h3>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Horizontal</span>
        <div className="flex gap-1 flex-wrap">
          <Button size="icon" variant="outline" className={BTN} onClick={() => align("left")} title="Alinhar à esquerda">
            <AlignStartVertical className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="outline" className={BTN} onClick={() => align("center-h")} title="Centralizar horizontalmente">
            <AlignCenterVertical className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="outline" className={BTN} onClick={() => align("right")} title="Alinhar à direita">
            <AlignEndVertical className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="outline" className={BTN} onClick={() => distribute("h")} title="Distribuir horizontalmente">
            <AlignHorizontalSpaceAround className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Vertical</span>
        <div className="flex gap-1 flex-wrap">
          <Button size="icon" variant="outline" className={BTN} onClick={() => align("top")} title="Alinhar ao topo">
            <AlignStartHorizontal className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="outline" className={BTN} onClick={() => align("middle-v")} title="Centralizar verticalmente">
            <AlignCenterHorizontal className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="outline" className={BTN} onClick={() => align("bottom")} title="Alinhar à base">
            <AlignEndHorizontal className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="outline" className={BTN} onClick={() => distribute("v")} title="Distribuir verticalmente">
            <AlignVerticalSpaceAround className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">No Canvas</span>
        <div className="flex gap-1 flex-wrap">
          <Button size="icon" variant="outline" className={BTN} onClick={() => align("center-canvas")} title="Centralizar no canvas">
            <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="outline" className={BTN} onClick={() => align("center-h")} title="Centralizar horizontalmente no canvas">
            <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
