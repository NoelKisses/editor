"use client";

import { useEffect, useRef, useState } from "react";
import { Move, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ObjectBatchPositionPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function moveObjectsBy(objs: any[], dx: number, dy: number): void {
  objs.forEach((obj) => {
    obj.set({
      left: (obj.left ?? 0) + dx,
      top: (obj.top ?? 0) + dy,
    });
    obj.setCoords();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function alignObjectsToCanvas(objs: any[], canvas: any, mode: string): void {
  if (!canvas) return;
  const cw = canvas.getWidth?.() ?? canvas.width ?? 0;
  const ch = canvas.getHeight?.() ?? canvas.height ?? 0;
  objs.forEach((obj) => {
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    switch (mode) {
      case "left":
        obj.set({ left: 0 });
        break;
      case "centerH":
        obj.set({ left: cw / 2 - w / 2 });
        break;
      case "right":
        obj.set({ left: cw - w });
        break;
      case "top":
        obj.set({ top: 0 });
        break;
      case "centerV":
        obj.set({ top: ch / 2 - h / 2 });
        break;
      case "bottom":
        obj.set({ top: ch - h });
        break;
    }
    obj.setCoords();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function distributeObjects(objs: any[], axis: "x" | "y"): void {
  if (objs.length < 3) return;
  const sorted = [...objs].sort((a, b) =>
    axis === "x" ? (a.left ?? 0) - (b.left ?? 0) : (a.top ?? 0) - (b.top ?? 0)
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (axis === "x") {
    const start = first.left ?? 0;
    const end = last.left ?? 0;
    const step = (end - start) / (sorted.length - 1);
    sorted.forEach((obj, i) => {
      obj.set({ left: start + step * i });
      obj.setCoords();
    });
  } else {
    const start = first.top ?? 0;
    const end = last.top ?? 0;
    const step = (end - start) / (sorted.length - 1);
    sorted.forEach((obj, i) => {
      obj.set({ top: start + step * i });
      obj.setCoords();
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stackObjectsInColumn(objs: any[], canvas: any): void {
  if (!canvas) return;
  const cw = canvas.getWidth?.() ?? canvas.width ?? 0;
  let y = 0;
  objs.forEach((obj) => {
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    obj.set({ left: cw / 2 - w / 2, top: y });
    obj.setCoords();
    y += h + 8;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBoundingBox(objs: any[]): { left: number; top: number; right: number; bottom: number } {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  objs.forEach((obj) => {
    const l = obj.left ?? 0;
    const t = obj.top ?? 0;
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    if (l < left) left = l;
    if (t < top) top = t;
    if (l + w > right) right = l + w;
    if (t + h > bottom) bottom = t + h;
  });
  return { left, top, right, bottom };
}

export function ObjectBatchPositionPanel({ fabricCanvas }: ObjectBatchPositionPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<any[]>([]);
  const [absX, setAbsX] = useState<number>(0);
  const [absY, setAbsY] = useState<number>(0);
  const [step, setStep] = useState<number>(10);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const updateSelection = () => {
      const active = fabricCanvas.getActiveObjects?.() ?? [];
      queueMicrotask(() => setSelected(active));
    };
    updateSelection();
    fabricCanvas.on?.("selection:created", updateSelection);
    fabricCanvas.on?.("selection:updated", updateSelection);
    fabricCanvas.on?.("selection:cleared", updateSelection);
    return () => {
      fabricCanvas.off?.("selection:created", updateSelection);
      fabricCanvas.off?.("selection:updated", updateSelection);
      fabricCanvas.off?.("selection:cleared", updateSelection);
    };
  }, [fabricCanvas]);

  const ensureSelection = (): boolean => {
    if (!fabricCanvas) {
      toast.error("Canvas indisponível");
      return false;
    }
    if (selected.length === 0) {
      toast.error("Selecione ao menos um objeto");
      return false;
    }
    return true;
  };

  const handleSetAbsolutePosition = () => {
    if (!ensureSelection()) return;
    const box = getBoundingBox(selected);
    const dx = absX - box.left;
    const dy = absY - box.top;
    moveObjectsBy(selected, dx, dy);
    fabricCanvas.requestRenderAll();
    toast.success(`Posição definida (${absX}, ${absY})`);
  };

  const handleDirection = (dx: number, dy: number) => {
    if (!ensureSelection()) return;
    moveObjectsBy(selected, dx * step, dy * step);
    fabricCanvas.requestRenderAll();
  };

  const handleAlign = (mode: string) => {
    if (!ensureSelection()) return;
    alignObjectsToCanvas(selected, fabricCanvas, mode);
    fabricCanvas.requestRenderAll();
    toast.success(`Alinhado: ${mode}`);
  };

  const handleDistribute = (axis: "x" | "y") => {
    if (!ensureSelection()) return;
    if (selected.length < 3) {
      toast.error("Selecione 3+ objetos para distribuir");
      return;
    }
    distributeObjects(selected, axis);
    fabricCanvas.requestRenderAll();
    toast.success(`Distribuído em ${axis.toUpperCase()}`);
  };

  const handleCenterGroup = () => {
    if (!ensureSelection()) return;
    const cw = fabricCanvas.getWidth?.() ?? fabricCanvas.width ?? 0;
    const ch = fabricCanvas.getHeight?.() ?? fabricCanvas.height ?? 0;
    const box = getBoundingBox(selected);
    const bw = box.right - box.left;
    const bh = box.bottom - box.top;
    const dx = cw / 2 - bw / 2 - box.left;
    const dy = ch / 2 - bh / 2 - box.top;
    moveObjectsBy(selected, dx, dy);
    fabricCanvas.requestRenderAll();
    toast.success("Grupo centralizado");
  };

  const handleResetOrigin = () => {
    if (!ensureSelection()) return;
    const first = selected[0];
    first.set({ left: 0, top: 0 });
    first.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Origem resetada (0, 0)");
  };

  const handleStackColumn = () => {
    if (!ensureSelection()) return;
    stackObjectsInColumn(selected, fabricCanvas);
    fabricCanvas.requestRenderAll();
    toast.success("Empilhado em coluna");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Move className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Posicionamento em Lote</h3>
        </div>
        <Badge variant="secondary">{selected.length} sel.</Badge>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Coordenadas Absolutas</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs">X</span>
            <Input
              type="number"
              value={absX}
              onChange={(e) => setAbsX(Number(e.target.value))}
            />
          </div>
          <div>
            <span className="text-xs">Y</span>
            <Input
              type="number"
              value={absY}
              onChange={(e) => setAbsY(Number(e.target.value))}
            />
          </div>
        </div>
        <Button size="sm" className="w-full" onClick={handleSetAbsolutePosition}>
          Definir Posição
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Movimento Relativo</div>
        <div>
          <span className="text-xs">Passo</span>
          <Input
            type="number"
            value={step}
            onChange={(e) => setStep(Number(e.target.value) || 0)}
          />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <Button size="sm" variant="outline" onClick={() => handleDirection(-1, -1)} aria-label="NW">
            <ArrowUpLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDirection(0, -1)} aria-label="N">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDirection(1, -1)} aria-label="NE">
            <ArrowUpRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDirection(-1, 0)} aria-label="W">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div />
          <Button size="sm" variant="outline" onClick={() => handleDirection(1, 0)} aria-label="E">
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDirection(-1, 1)} aria-label="SW">
            <ArrowDownLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDirection(0, 1)} aria-label="S">
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDirection(1, 1)} aria-label="SE">
            <ArrowDownRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Alinhamento ao Canvas</div>
        <div className="grid grid-cols-3 gap-1">
          <Button size="sm" variant="outline" onClick={() => handleAlign("left")}>
            Esquerda
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAlign("centerH")}>
            Centro H
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAlign("right")}>
            Direita
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAlign("top")}>
            Topo
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAlign("centerV")}>
            Centro V
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAlign("bottom")}>
            Base
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Distribuição Avançada</div>
        <Button size="sm" variant="outline" className="w-full" onClick={() => handleDistribute("x")}>
          Equal H Spacing
        </Button>
        <Button size="sm" variant="outline" className="w-full" onClick={() => handleDistribute("y")}>
          Equal V Spacing
        </Button>
        <Button size="sm" variant="outline" className="w-full" onClick={handleCenterGroup}>
          Centralizar Grupo
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Reset</div>
        <Button size="sm" variant="outline" className="w-full" onClick={handleResetOrigin}>
          Reset Origem (0,0)
        </Button>
        <Button size="sm" variant="outline" className="w-full" onClick={handleStackColumn}>
          Empilhar em Coluna
        </Button>
      </div>
    </div>
  );
}
