"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Scissors,
  CopyPlus,
  Trash2,
  BringToFront,
  SendToBack,
  FlipHorizontal2,
  Lock,
  Unlock,
  Group,
  Ungroup,
  AlignCenter,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface FloatingToolbarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ToolbarPos {
  x: number;
  y: number;
}

export function FloatingToolbar({ fabricCanvas, selectionVersion }: FloatingToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<ToolbarPos>({ x: 0, y: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeObj, setActiveObj] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clipboardRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion;

  const updatePosition = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { setVisible(false); setActiveObj(null); return; }

    const bound = obj.getBoundingRect(true);
    const vpt = fabricCanvas.viewportTransform as number[];
    const zoom = fabricCanvas.getZoom();
    const canvasEl = fabricCanvas.upperCanvasEl as HTMLElement;
    const rect = canvasEl?.getBoundingClientRect();
    if (!rect) return;

    // Position toolbar above the selection
    const cx = rect.left + (bound.left * zoom + vpt[4]);
    const cy = rect.top + (bound.top * zoom + vpt[5]);
    const cw = bound.width * zoom;

    setPos({ x: cx + cw / 2, y: cy - 8 });
    setVisible(true);
    setActiveObj(obj);
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const update = () => queueMicrotask(updatePosition);
    const hide = () => { setVisible(false); setActiveObj(null); };

    fabricCanvas.on("selection:created", update);
    fabricCanvas.on("selection:updated", update);
    fabricCanvas.on("selection:cleared", hide);
    fabricCanvas.on("object:moving", update);
    fabricCanvas.on("object:scaling", update);
    fabricCanvas.on("object:rotating", update);
    fabricCanvas.on("viewport:transform", update);

    return () => {
      fabricCanvas.off("selection:created", update);
      fabricCanvas.off("selection:updated", update);
      fabricCanvas.off("selection:cleared", hide);
      fabricCanvas.off("object:moving", update);
      fabricCanvas.off("object:scaling", update);
      fabricCanvas.off("object:rotating", update);
      fabricCanvas.off("viewport:transform", update);
    };
  }, [fabricCanvas, updatePosition]);

  const handleCopy = useCallback(() => {
    if (!activeObj) return;
    activeObj.clone((cloned: unknown) => {
      clipboardRef.current = cloned;
      toast.success("Copiado");
    });
  }, [activeObj]);

  const handleCut = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    activeObj.clone((cloned: unknown) => { clipboardRef.current = cloned; });
    fabricCanvas.remove(activeObj);
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
    toast.success("Recortado");
  }, [activeObj, fabricCanvas]);

  const handleDuplicate = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeObj.clone((cloned: any) => {
      cloned.set({ left: (activeObj.left ?? 0) + 20, top: (activeObj.top ?? 0) + 20 });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.requestRenderAll();
      toast.success("Duplicado");
    });
  }, [activeObj, fabricCanvas]);

  const handleDelete = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    if (Array.isArray(activeObj._objects)) {
      activeObj._objects.forEach((o: unknown) => fabricCanvas.remove(o));
    } else {
      fabricCanvas.remove(activeObj);
    }
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
    toast.success("Removido");
  }, [activeObj, fabricCanvas]);

  const handleBringForward = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    fabricCanvas.bringForward(activeObj);
    fabricCanvas.requestRenderAll();
    toast.success("Para frente");
  }, [activeObj, fabricCanvas]);

  const handleSendBackward = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    fabricCanvas.sendBackwards(activeObj);
    fabricCanvas.requestRenderAll();
    toast.success("Para trás");
  }, [activeObj, fabricCanvas]);

  const handleBringToFront = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    fabricCanvas.bringToFront(activeObj);
    fabricCanvas.requestRenderAll();
    toast.success("Trazer para frente");
  }, [activeObj, fabricCanvas]);

  const handleSendToBack = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    fabricCanvas.sendToBack(activeObj);
    fabricCanvas.requestRenderAll();
    toast.success("Enviar para trás");
  }, [activeObj, fabricCanvas]);

  const handleFlipH = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    activeObj.set({ flipX: !activeObj.flipX });
    fabricCanvas.requestRenderAll();
  }, [activeObj, fabricCanvas]);

  const handleLockToggle = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    const locked = activeObj.lockMovementX;
    activeObj.set({
      lockMovementX: !locked,
      lockMovementY: !locked,
      lockScalingX: !locked,
      lockScalingY: !locked,
      lockRotation: !locked,
      selectable: locked,
      evented: true,
      hasControls: locked,
    });
    fabricCanvas.requestRenderAll();
    toast.success(locked ? "Desbloqueado" : "Bloqueado");
  }, [activeObj, fabricCanvas]);

  const handleGroupToggle = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    if (activeObj.type === "activeSelection") {
      const group = activeObj.toGroup();
      fabricCanvas.setActiveObject(group);
      fabricCanvas.requestRenderAll();
      toast.success("Agrupado");
    } else if (activeObj.type === "group") {
      const items = activeObj.toActiveSelection();
      fabricCanvas.setActiveObject(items);
      fabricCanvas.requestRenderAll();
      toast.success("Desagrupado");
    }
  }, [activeObj, fabricCanvas]);

  const handleCenter = useCallback(() => {
    if (!activeObj || !fabricCanvas) return;
    const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();
    const ow = activeObj.getScaledWidth?.() ?? activeObj.width ?? 0;
    const oh = activeObj.getScaledHeight?.() ?? activeObj.height ?? 0;
    activeObj.set({ left: (cw - ow) / 2, top: (ch - oh) / 2 });
    activeObj.setCoords();
    fabricCanvas.requestRenderAll();
    toast.success("Centralizado");
  }, [activeObj, fabricCanvas]);

  if (!visible || !activeObj) return null;

  const isGroup = activeObj.type === "group";
  const isSelection = activeObj.type === "activeSelection";
  const isLocked = !!activeObj.lockMovementX;

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="flex items-center gap-0.5 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-1 py-0.5">
        {/* Copy */}
        <button
          onClick={handleCopy}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Copiar (Ctrl+C)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Cut */}
        <button
          onClick={handleCut}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Recortar (Ctrl+X)"
        >
          <Scissors className="w-3.5 h-3.5" />
        </button>

        {/* Duplicate */}
        <button
          onClick={handleDuplicate}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Duplicar (Ctrl+D)"
        >
          <CopyPlus className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Bring Forward */}
        <button
          onClick={handleBringForward}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Trazer para frente"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        {/* Send Backward */}
        <button
          onClick={handleSendBackward}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Enviar para trás"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Bring to Front */}
        <button
          onClick={handleBringToFront}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Trazer para frente de tudo"
        >
          <BringToFront className="w-3.5 h-3.5" />
        </button>

        {/* Send to Back */}
        <button
          onClick={handleSendToBack}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Enviar para trás de tudo"
        >
          <SendToBack className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Flip H */}
        <button
          onClick={handleFlipH}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Espelhar horizontalmente"
        >
          <FlipHorizontal2 className="w-3.5 h-3.5" />
        </button>

        {/* Center */}
        <button
          onClick={handleCenter}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Centralizar no canvas (Ctrl+M)"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>

        {/* Lock/Unlock */}
        <button
          onClick={handleLockToggle}
          className={`flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 transition-colors ${isLocked ? "text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
          title={isLocked ? "Desbloquear" : "Bloquear"}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {/* Group/Ungroup */}
        {(isGroup || isSelection) && (
          <button
            onClick={handleGroupToggle}
            className="flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
            title={isGroup ? "Desagrupar" : "Agrupar"}
          >
            {isGroup ? <Ungroup className="w-3.5 h-3.5" /> : <Group className="w-3.5 h-3.5" />}
          </button>
        )}

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
          title="Excluir (Delete)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
