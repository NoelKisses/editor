"use client";

import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ObjectBatchEditPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type FilterType = "all" | "images" | "texts" | "shapes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedObjects(canvas: any): any[] {
  if (!canvas) return [];
  const active = canvas.getActiveObjects?.();
  if (Array.isArray(active) && active.length > 0) return active;
  const single = canvas.getActiveObject?.();
  return single ? [single] : [];
}

function filterByType(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects: any[],
  filterType: FilterType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  if (filterType === "all") return objects;
  return objects.filter((obj) => {
    const type = String(obj?.type ?? "").toLowerCase();
    if (filterType === "texts") {
      return type === "text" || type === "i-text" || type === "textbox";
    }
    if (filterType === "images") {
      return type === "image";
    }
    if (filterType === "shapes") {
      return (
        type === "rect" ||
        type === "circle" ||
        type === "polygon" ||
        type === "path"
      );
    }
    return false;
  });
}

function applyTransform(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (obj: any) => void,
): void {
  objects.forEach((obj) => {
    try {
      transform(obj);
      obj.setCoords?.();
    } catch {
      // skip on per-object failures
    }
  });
}

export function ObjectBatchEditPanel({
  fabricCanvas,
}: ObjectBatchEditPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterType, setFilterType] = useState<FilterType>("all");

  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotationDelta, setRotationDelta] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
    if (!fabricCanvas) {
      queueMicrotask(() => setSelectedCount(0));
      return;
    }

    const update = () => {
      const count = getSelectedObjects(fabricCanvas).length;
      queueMicrotask(() => setSelectedCount(count));
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

  const getTargets = (minCount = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return null;
    }
    const selected = getSelectedObjects(canvas);
    const filtered = filterByType(selected, filterType);
    if (filtered.length < minCount) {
      toast.error(
        minCount > 1
          ? `Selecione ao menos ${minCount} objetos`
          : "Selecione ao menos 1 objeto",
      );
      return null;
    }
    return { canvas, objects: filtered };
  };

  const handleApplyScale = () => {
    const ctx = getTargets(1);
    if (!ctx) return;
    applyTransform(ctx.objects, (obj) => {
      const baseX = obj.scaleX ?? 1;
      const baseY = obj.scaleY ?? 1;
      obj.set?.("scaleX", baseX * scaleX);
      obj.set?.("scaleY", baseY * scaleY);
    });
    ctx.canvas.requestRenderAll?.();
    toast.success(`Escala aplicada em ${ctx.objects.length} objeto(s)`);
  };

  const handleMoveBy = () => {
    const ctx = getTargets(1);
    if (!ctx) return;
    applyTransform(ctx.objects, (obj) => {
      obj.set?.("left", (obj.left ?? 0) + offsetX);
      obj.set?.("top", (obj.top ?? 0) + offsetY);
    });
    ctx.canvas.requestRenderAll?.();
    toast.success(`Movido ${ctx.objects.length} objeto(s)`);
  };

  const handleAddRotation = () => {
    const ctx = getTargets(1);
    if (!ctx) return;
    applyTransform(ctx.objects, (obj) => {
      obj.set?.("angle", (obj.angle ?? 0) + rotationDelta);
    });
    ctx.canvas.requestRenderAll?.();
    toast.success(`Rotação adicionada em ${ctx.objects.length} objeto(s)`);
  };

  const handleResetRotation = () => {
    const ctx = getTargets(1);
    if (!ctx) return;
    applyTransform(ctx.objects, (obj) => {
      obj.set?.("angle", 0);
    });
    ctx.canvas.requestRenderAll?.();
    toast.success(`Rotação resetada em ${ctx.objects.length} objeto(s)`);
  };

  const handleApplyOpacity = () => {
    const ctx = getTargets(1);
    if (!ctx) return;
    applyTransform(ctx.objects, (obj) => {
      obj.set?.("opacity", opacity);
    });
    ctx.canvas.requestRenderAll?.();
    toast.success(`Opacidade aplicada em ${ctx.objects.length} objeto(s)`);
  };

  const handleDistributeH = () => {
    const ctx = getTargets(2);
    if (!ctx) return;
    const sorted = [...ctx.objects].sort(
      (a, b) => (a.left ?? 0) - (b.left ?? 0),
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const startX = first.left ?? 0;
    const endX = last.left ?? 0;
    const step = (endX - startX) / (sorted.length - 1);
    sorted.forEach((obj, idx) => {
      obj.set?.("left", startX + step * idx);
      obj.setCoords?.();
    });
    ctx.canvas.requestRenderAll?.();
    toast.success("Distribuídos horizontalmente");
  };

  const handleDistributeV = () => {
    const ctx = getTargets(2);
    if (!ctx) return;
    const sorted = [...ctx.objects].sort(
      (a, b) => (a.top ?? 0) - (b.top ?? 0),
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const startY = first.top ?? 0;
    const endY = last.top ?? 0;
    const step = (endY - startY) / (sorted.length - 1);
    sorted.forEach((obj, idx) => {
      obj.set?.("top", startY + step * idx);
      obj.setCoords?.();
    });
    ctx.canvas.requestRenderAll?.();
    toast.success("Distribuídos verticalmente");
  };

  const handleResetAll = () => {
    const ctx = getTargets(1);
    if (!ctx) return;
    applyTransform(ctx.objects, (obj) => {
      obj.set?.("scaleX", 1);
      obj.set?.("scaleY", 1);
      obj.set?.("angle", 0);
      obj.set?.("opacity", 1);
    });
    ctx.canvas.requestRenderAll?.();
    toast.success(`Resetados ${ctx.objects.length} objeto(s)`);
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "images", label: "Imagens" },
    { value: "texts", label: "Textos" },
    { value: "shapes", label: "Formas" },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          <h3 className="text-sm font-semibold">Edição em Lote</h3>
        </div>
        <Badge variant="secondary">{selectedCount} selecionado(s)</Badge>
      </div>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Tamanho
        </h4>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Scale X</span>
            <span>{scaleX.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.1}
            value={scaleX}
            onChange={(e) => setScaleX(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Scale Y</span>
            <span>{scaleY.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.1}
            value={scaleY}
            onChange={(e) => setScaleY(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <Button size="sm" className="w-full" onClick={handleApplyScale}>
          Aplicar Escala
        </Button>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Posição
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs">Offset X</span>
            <Input
              type="number"
              value={offsetX}
              onChange={(e) => setOffsetX(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs">Offset Y</span>
            <Input
              type="number"
              value={offsetY}
              onChange={(e) => setOffsetY(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <Button size="sm" className="w-full" onClick={handleMoveBy}>
          Mover Por
        </Button>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Rotação
        </h4>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Delta</span>
            <span>{rotationDelta}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotationDelta}
            onChange={(e) => setRotationDelta(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={handleAddRotation}>
            Adicionar Rotação
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetRotation}>
            Resetar Rotação
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Visual
        </h4>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Opacidade</span>
            <span>{opacity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <Button size="sm" className="w-full" onClick={handleApplyOpacity}>
          Aplicar Opacidade
        </Button>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Filtro Tipo
        </h4>
        <div className="grid grid-cols-4 gap-1">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={filterType === opt.value ? "default" : "outline"}
              onClick={() => setFilterType(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Ações em Massa
        </h4>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleDistributeH}
        >
          Distribuir H Igualmente
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleDistributeV}
        >
          Distribuir V Igualmente
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="w-full"
          onClick={handleResetAll}
        >
          Resetar Todos
        </Button>
      </section>
    </div>
  );
}
