"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Unlock, Trash2, GripVertical, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricObj = any;

interface Layer {
  id: string;
  label: string;
  type: string;
  visible: boolean;
  locked: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any;
}

interface LayersPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

function getLabel(obj: FabricObj, index: number): string {
  if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
    const text: string = obj.text ?? "";
    return text.length > 18 ? text.slice(0, 18) + "…" : text || `Texto ${index + 1}`;
  }
  if (obj.type === "image") return `Imagem ${index + 1}`;
  if (obj.type === "group") return `Grupo ${index + 1}`;
  const typeMap: Record<string, string> = {
    rect: "Retângulo",
    circle: "Círculo",
    ellipse: "Elipse",
    triangle: "Triângulo",
    polygon: "Polígono",
    line: "Linha",
    path: "Caminho",
  };
  return `${typeMap[obj.type] ?? obj.type} ${index + 1}`;
}

export function LayersPanel({ fabricCanvas, selectionVersion }: LayersPanelProps) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const dragIndexRef = useRef<number | null>(null);

  const syncLayers = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = fabricCanvas.getObjects();
    // Reverse so top layer is first
    const synced: Layer[] = [...objs]
      .map((obj, i) => ({
        id: obj.__id ?? (obj.__id = `layer-${Date.now()}-${i}`),
        label: getLabel(obj, i),
        type: obj.type,
        visible: obj.visible !== false,
        locked: !obj.selectable,
        obj,
      }))
      .reverse();
    setLayers(synced);
  }, [fabricCanvas]);

  useEffect(() => {
    queueMicrotask(syncLayers);
  }, [syncLayers, selectionVersion]);

  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.on("object:added", syncLayers);
    fabricCanvas.on("object:removed", syncLayers);
    fabricCanvas.on("object:modified", syncLayers);
    return () => {
      fabricCanvas.off("object:added", syncLayers);
      fabricCanvas.off("object:removed", syncLayers);
      fabricCanvas.off("object:modified", syncLayers);
    };
  }, [fabricCanvas, syncLayers]);

  const selectLayer = useCallback(
    (obj: FabricObj) => {
      if (!fabricCanvas) return;
      fabricCanvas.setActiveObject(obj);
      fabricCanvas.requestRenderAll();
    },
    [fabricCanvas]
  );

  const toggleVisibility = useCallback(
    (obj: FabricObj, e: React.MouseEvent) => {
      e.stopPropagation();
      obj.set({ visible: !obj.visible });
      fabricCanvas.requestRenderAll();
      syncLayers();
    },
    [fabricCanvas, syncLayers]
  );

  const toggleLock = useCallback(
    (obj: FabricObj, e: React.MouseEvent) => {
      e.stopPropagation();
      const locked = !obj.selectable;
      obj.set({
        selectable: locked,
        evented: locked,
        lockMovementX: !locked,
        lockMovementY: !locked,
        lockScalingX: !locked,
        lockScalingY: !locked,
        lockRotation: !locked,
        hasControls: locked,
      });
      if (!locked && fabricCanvas.getActiveObject() === obj) {
        fabricCanvas.discardActiveObject();
      }
      fabricCanvas.requestRenderAll();
      syncLayers();
    },
    [fabricCanvas, syncLayers]
  );

  const deleteLayer = useCallback(
    (obj: FabricObj, e: React.MouseEvent) => {
      e.stopPropagation();
      fabricCanvas.remove(obj);
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
      syncLayers();
    },
    [fabricCanvas, syncLayers]
  );

  // Drag-and-drop reorder
  const onDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;

    const fromIndex = dragIndexRef.current;
    const toIndex = index;

    // layers array is reversed (top first), canvas objs are bottom first
    const totalObjs = fabricCanvas.getObjects().length;
    const fromCanvasIndex = totalObjs - 1 - fromIndex;
    const toCanvasIndex = totalObjs - 1 - toIndex;

    const objs = fabricCanvas.getObjects();
    const moving = objs[fromCanvasIndex];
    fabricCanvas.moveTo(moving, toCanvasIndex);
    fabricCanvas.requestRenderAll();
    dragIndexRef.current = toIndex;
    syncLayers();
  };

  const onDragEnd = () => {
    dragIndexRef.current = null;
  };

  const activeObj = fabricCanvas?.getActiveObject();

  if (!fabricCanvas) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground px-4">
        <Layers className="w-8 h-8 opacity-20" />
        <p className="text-xs">Selecione um template para ver as camadas</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 pt-2 px-2 pb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {layers.length} camada{layers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {layers.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Adicione elementos ao canvas
        </p>
      )}

      <div className="flex flex-col gap-0.5">
        {layers.map((layer, index) => {
          const isActive = activeObj === layer.obj;
          return (
            <div
              key={layer.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              onClick={() => selectLayer(layer.obj)}
              className={cn(
                "flex items-center gap-1.5 px-1.5 py-1.5 rounded-md cursor-pointer select-none group transition-colors",
                isActive
                  ? "bg-primary/15 border border-primary/30"
                  : "hover:bg-accent/50 border border-transparent"
              )}
            >
              {/* Drag handle */}
              <GripVertical className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 cursor-grab" />

              {/* Type icon */}
              <span className="text-[10px] text-muted-foreground/60 w-4 shrink-0">
                {layer.type === "i-text" || layer.type === "text" || layer.type === "textbox"
                  ? "T"
                  : layer.type === "image"
                  ? "🖼"
                  : layer.type === "group"
                  ? "G"
                  : "◼"}
              </span>

              {/* Label */}
              <span
                className={cn(
                  "flex-1 text-xs truncate",
                  isActive ? "text-foreground font-medium" : "text-foreground/80"
                )}
              >
                {layer.label}
              </span>

              {/* Actions (show on hover or active) */}
              <div className={cn("flex items-center gap-0.5 transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                <button
                  onClick={(e) => toggleVisibility(layer.obj, e)}
                  className="p-0.5 rounded hover:bg-accent"
                  title={layer.visible ? "Ocultar" : "Mostrar"}
                >
                  {layer.visible ? (
                    <Eye className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground/40" />
                  )}
                </button>
                <button
                  onClick={(e) => toggleLock(layer.obj, e)}
                  className="p-0.5 rounded hover:bg-accent"
                  title={layer.locked ? "Desbloquear" : "Bloquear"}
                >
                  {layer.locked ? (
                    <Lock className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Unlock className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={(e) => deleteLayer(layer.obj, e)}
                  className="p-0.5 rounded hover:bg-destructive/20"
                  title="Remover"
                >
                  <Trash2 className="w-3 h-3 text-destructive/60 hover:text-destructive" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
