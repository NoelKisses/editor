"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers3, Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CanvasObjectHierarchyPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface LayerItem {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  locked: boolean;
  selected: boolean;
  zIndex: number;
}

function getObjectLabel(obj: Record<string, unknown>, idx: number): string {
  if (obj.data && typeof obj.data === "object" && (obj.data as Record<string, unknown>).label) {
    return String((obj.data as Record<string, unknown>).label);
  }
  const type = String(obj.type ?? "object");
  const typeMap: Record<string, string> = {
    rect: "Retângulo", circle: "Círculo", triangle: "Triângulo",
    text: "Texto", "i-text": "Texto", textbox: "Caixa de texto",
    image: "Imagem", Image: "Imagem", path: "Caminho",
    line: "Linha", polygon: "Polígono", group: "Grupo",
    polyline: "Poliline", ellipse: "Elipse",
  };
  return `${typeMap[type] ?? type} ${idx + 1}`;
}

export function CanvasObjectHierarchyPanel({ fabricCanvas, selectionVersion }: CanvasObjectHierarchyPanelProps) {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refreshLayers = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = fabricCanvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active: any = fabricCanvas.getActiveObject();
    const items: LayerItem[] = objs.map((obj, i) => ({
      id: obj.__id ?? (obj.__id = `obj_${i}_${Date.now()}`),
      type: obj.type ?? "object",
      label: getObjectLabel(obj as Record<string, unknown>, i),
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      selected: active === obj,
      zIndex: i,
    })).reverse();
    setLayers(items);
    if (active) setSelectedId(active.__id ?? null);
    else setSelectedId(null);
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(refreshLayers);
  }, [fabricCanvas, selectionVersion, refreshLayers]);

  const selectLayer = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = fabricCanvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    fabricCanvas.setActiveObject(obj);
    fabricCanvas.requestRenderAll();
    setSelectedId(id);
  }, [fabricCanvas]);

  const toggleVisible = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = fabricCanvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    obj.set({ visible: !obj.visible });
    fabricCanvas.requestRenderAll();
    refreshLayers();
  }, [fabricCanvas, refreshLayers]);

  const toggleLock = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = fabricCanvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    const locked = obj.selectable === false;
    obj.set({ selectable: locked, evented: locked });
    fabricCanvas.requestRenderAll();
    refreshLayers();
    toast.success(locked ? "Objeto desbloqueado" : "Objeto bloqueado");
  }, [fabricCanvas, refreshLayers]);

  const moveUp = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = fabricCanvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    fabricCanvas.bringForward(obj);
    fabricCanvas.requestRenderAll();
    refreshLayers();
  }, [fabricCanvas, refreshLayers]);

  const moveDown = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = fabricCanvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    fabricCanvas.sendBackwards(obj);
    fabricCanvas.requestRenderAll();
    refreshLayers();
  }, [fabricCanvas, refreshLayers]);

  const removeLayer = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = fabricCanvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    fabricCanvas.remove(obj);
    fabricCanvas.requestRenderAll();
    refreshLayers();
    toast.success("Objeto removido");
  }, [fabricCanvas, refreshLayers]);

  const bringToFront = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = fabricCanvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    fabricCanvas.bringToFront(obj);
    fabricCanvas.requestRenderAll();
    refreshLayers();
    toast.success("Objeto ao topo");
  }, [fabricCanvas, refreshLayers]);

  const sendToBack = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = fabricCanvas.getObjects().find((o: any) => o.__id === id);
    if (!obj) return;
    fabricCanvas.sendToBack(obj);
    fabricCanvas.requestRenderAll();
    refreshLayers();
    toast.success("Objeto ao fundo");
  }, [fabricCanvas, refreshLayers]);

  const TYPE_COLORS: Record<string, string> = {
    text: "bg-blue-500/20 text-blue-400",
    "i-text": "bg-blue-500/20 text-blue-400",
    textbox: "bg-blue-500/20 text-blue-400",
    image: "bg-green-500/20 text-green-400",
    Image: "bg-green-500/20 text-green-400",
    rect: "bg-orange-500/20 text-orange-400",
    circle: "bg-purple-500/20 text-purple-400",
    group: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Hierarquia de Objetos</span>
        </div>
        <button onClick={refreshLayers}
          className="text-[7px] text-primary hover:underline">
          Atualizar
        </button>
      </div>

      <div className="text-[8px] text-muted-foreground">
        {layers.length} objeto(s) no canvas — topo ↑ fundo ↓
      </div>

      {layers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Layers3 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Canvas vazio</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 max-h-96 overflow-y-auto">
          {layers.map((layer) => (
            <div key={layer.id}
              onClick={() => selectLayer(layer.id)}
              className={`flex items-center gap-1 px-1.5 py-1 rounded border cursor-pointer transition-colors ${layer.selected ? "border-primary bg-primary/5" : "border-border hover:border-border/80 hover:bg-muted/20"} ${!layer.visible ? "opacity-40" : ""}`}>

              {/* Type badge */}
              <span className={`text-[6px] px-1 rounded flex-shrink-0 ${TYPE_COLORS[layer.type] ?? "bg-muted text-muted-foreground"}`}>
                {layer.type.slice(0, 4)}
              </span>

              {/* Label */}
              <span className="flex-1 text-[8px] truncate text-foreground/80">
                {layer.label}
              </span>

              {/* Controls */}
              <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => toggleVisible(layer.id)} title={layer.visible ? "Ocultar" : "Mostrar"}
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  {layer.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                </button>
                <button onClick={() => toggleLock(layer.id)} title={layer.locked ? "Desbloquear" : "Bloquear"}
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  {layer.locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                </button>
                <button onClick={() => moveUp(layer.id)} title="Subir"
                  className="w-4 h-5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <ChevronUp className="w-2.5 h-2.5" />
                </button>
                <button onClick={() => moveDown(layer.id)} title="Descer"
                  className="w-4 h-5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                <button onClick={() => removeLayer(layer.id)} title="Remover"
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected object actions */}
      {selectedId && (
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => bringToFront(selectedId)}
            className="flex-1 py-1 rounded border border-border text-muted-foreground text-[7px] hover:border-primary/30 hover:text-primary transition-colors">
            Ao topo
          </button>
          <button onClick={() => sendToBack(selectedId)}
            className="flex-1 py-1 rounded border border-border text-muted-foreground text-[7px] hover:border-primary/30 hover:text-primary transition-colors">
            Ao fundo
          </button>
          <button onClick={() => removeLayer(selectedId)}
            className="flex-1 py-1 rounded border border-border text-muted-foreground text-[7px] hover:border-destructive/30 hover:text-destructive transition-colors">
            Excluir
          </button>
        </div>
      )}

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Clique para selecionar · ↑↓ reordena · olho oculta
      </p>
    </div>
  );
}
