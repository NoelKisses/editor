"use client";

import { useEffect, useRef, useState } from "react";
import { AlignCenter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ObjectArrangeDistributePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBounds(obj: any): { left: number; top: number; right: number; bottom: number; width: number; height: number } {
  const left = obj.left ?? 0;
  const top = obj.top ?? 0;
  const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
  const height = (obj.height ?? 0) * (obj.scaleY ?? 1);
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function alignObjects(objects: any[], mode: string): void {
  if (!objects || objects.length < 2) return;
  const bounds = objects.map(getBounds);

  if (mode === "left") {
    const minLeft = Math.min(...bounds.map((b) => b.left));
    objects.forEach((obj) => {
      obj.set("left", minLeft);
    });
  } else if (mode === "right") {
    const maxRight = Math.max(...bounds.map((b) => b.right));
    objects.forEach((obj, i) => {
      obj.set("left", maxRight - bounds[i].width);
    });
  } else if (mode === "centerH") {
    const minLeft = Math.min(...bounds.map((b) => b.left));
    const maxRight = Math.max(...bounds.map((b) => b.right));
    const centerX = (minLeft + maxRight) / 2;
    objects.forEach((obj, i) => {
      obj.set("left", centerX - bounds[i].width / 2);
    });
  } else if (mode === "top") {
    const minTop = Math.min(...bounds.map((b) => b.top));
    objects.forEach((obj) => {
      obj.set("top", minTop);
    });
  } else if (mode === "bottom") {
    const maxBottom = Math.max(...bounds.map((b) => b.bottom));
    objects.forEach((obj, i) => {
      obj.set("top", maxBottom - bounds[i].height);
    });
  } else if (mode === "centerV") {
    const minTop = Math.min(...bounds.map((b) => b.top));
    const maxBottom = Math.max(...bounds.map((b) => b.bottom));
    const centerY = (minTop + maxBottom) / 2;
    objects.forEach((obj, i) => {
      obj.set("top", centerY - bounds[i].height / 2);
    });
  }

  objects.forEach((obj) => obj.setCoords?.());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function distributeObjects(objects: any[], axis: "x" | "y"): void {
  if (!objects || objects.length < 3) {
    // Need at least 3 to distribute meaningfully; for 2 we'll just leave as is
    if (!objects || objects.length < 2) return;
  }

  const sorted = [...objects].sort((a, b) => {
    const ba = getBounds(a);
    const bb = getBounds(b);
    return axis === "x" ? ba.left - bb.left : ba.top - bb.top;
  });

  const first = getBounds(sorted[0]);
  const last = getBounds(sorted[sorted.length - 1]);

  if (axis === "x") {
    const totalWidth = sorted.reduce((sum, obj) => sum + getBounds(obj).width, 0);
    const spanStart = first.left;
    const spanEnd = last.right;
    const totalSpan = spanEnd - spanStart;
    const gap = (totalSpan - totalWidth) / Math.max(1, sorted.length - 1);

    let cursor = spanStart;
    sorted.forEach((obj, i) => {
      const b = getBounds(obj);
      if (i === 0) {
        cursor = b.left + b.width + gap;
        return;
      }
      if (i === sorted.length - 1) {
        return;
      }
      obj.set("left", cursor);
      cursor += b.width + gap;
    });
  } else {
    const totalHeight = sorted.reduce((sum, obj) => sum + getBounds(obj).height, 0);
    const spanStart = first.top;
    const spanEnd = last.bottom;
    const totalSpan = spanEnd - spanStart;
    const gap = (totalSpan - totalHeight) / Math.max(1, sorted.length - 1);

    let cursor = spanStart;
    sorted.forEach((obj, i) => {
      const b = getBounds(obj);
      if (i === 0) {
        cursor = b.top + b.height + gap;
        return;
      }
      if (i === sorted.length - 1) {
        return;
      }
      obj.set("top", cursor);
      cursor += b.height + gap;
    });
  }

  sorted.forEach((obj) => obj.setCoords?.());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function equalizeDimensions(objects: any[], dim: "width" | "height" | "both"): void {
  if (!objects || objects.length < 2) return;
  const bounds = objects.map(getBounds);
  const maxWidth = Math.max(...bounds.map((b) => b.width));
  const maxHeight = Math.max(...bounds.map((b) => b.height));

  objects.forEach((obj) => {
    const baseW = obj.width ?? 0;
    const baseH = obj.height ?? 0;
    if (dim === "width" || dim === "both") {
      if (baseW > 0) obj.set("scaleX", maxWidth / baseW);
    }
    if (dim === "height" || dim === "both") {
      if (baseH > 0) obj.set("scaleY", maxHeight / baseH);
    }
    obj.setCoords?.();
  });
}

export function ObjectArrangeDistributePanel({ fabricCanvas }: ObjectArrangeDistributePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    const canvas = fabricCanvas;
    if (!canvas) return;

    const updateCount = () => {
      const objs = canvas.getActiveObjects?.() ?? [];
      queueMicrotask(() => setSelectedCount(objs.length));
    };

    updateCount();

    canvas.on?.("selection:created", updateCount);
    canvas.on?.("selection:updated", updateCount);
    canvas.on?.("selection:cleared", updateCount);

    return () => {
      canvas.off?.("selection:created", updateCount);
      canvas.off?.("selection:updated", updateCount);
      canvas.off?.("selection:cleared", updateCount);
    };
  }, [fabricCanvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSelected = (): any[] => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    return canvas.getActiveObjects?.() ?? [];
  };

  const handleAlign = (mode: string) => {
    const objects = getSelected();
    if (objects.length < 2) {
      toast.error("Selecione 2 ou mais objetos para alinhar");
      return;
    }
    alignObjects(objects, mode);
    canvasRef.current?.requestRenderAll?.();
    toast.success("Objetos alinhados");
  };

  const handleDistribute = (axis: "x" | "y") => {
    const objects = getSelected();
    if (objects.length < 2) {
      toast.error("Selecione 2 ou mais objetos para distribuir");
      return;
    }
    distributeObjects(objects, axis);
    canvasRef.current?.requestRenderAll?.();
    toast.success("Objetos distribuídos");
  };

  const handleEqualize = (dim: "width" | "height" | "both") => {
    const objects = getSelected();
    if (objects.length < 2) {
      toast.error("Selecione 2 ou mais objetos para equalizar");
      return;
    }
    equalizeDimensions(objects, dim);
    canvasRef.current?.requestRenderAll?.();
    toast.success("Dimensões equalizadas");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlignCenter className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Arranjar & Distribuir</h3>
        </div>
        <Badge variant="secondary">{selectedCount} selecionado(s)</Badge>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Alinhar</p>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => handleAlign("left")}>
            ⬅ Esquerda
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAlign("centerH")}>
            ⬄ Centro H
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAlign("right")}>
            ➡ Direita
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAlign("top")}>
            ⬆ Topo
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAlign("centerV")}>
            ⇕ Centro V
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAlign("bottom")}>
            ⬇ Base
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Distribuir</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => handleDistribute("x")}>
            ⇔ Horizontal
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDistribute("y")}>
            ⇕ Vertical
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Equalizar dimensões</p>
        <div className="grid grid-cols-1 gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEqualize("width")}>
            Mesma largura
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleEqualize("height")}>
            Mesma altura
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleEqualize("both")}>
            Mesmo tamanho
          </Button>
        </div>
      </div>
    </div>
  );
}
