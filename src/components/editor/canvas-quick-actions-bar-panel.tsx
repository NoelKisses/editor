"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Zap,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CanvasQuickActionsBarPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActiveObjects(canvas: any): any[] {
  if (!canvas) return [];
  const active = canvas.getActiveObjects?.() ?? [];
  return Array.isArray(active) ? active : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function offsetObject(obj: any, delta = 20): void {
  if (!obj) return;
  obj.set({
    left: (obj.left ?? 0) + delta,
    top: (obj.top ?? 0) + delta,
    evented: true,
  });
  obj.setCoords?.();
}

export function CanvasQuickActionsBarPanel({
  fabricCanvas,
}: CanvasQuickActionsBarPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clipboardRef = useRef<any>(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [hasClipboard, setHasClipboard] = useState(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
    if (!fabricCanvas) return;

    const updateSelection = () => {
      queueMicrotask(() => {
        setSelectionCount(getActiveObjects(fabricCanvas).length);
      });
    };

    fabricCanvas.on?.("selection:created", updateSelection);
    fabricCanvas.on?.("selection:updated", updateSelection);
    fabricCanvas.on?.("selection:cleared", updateSelection);

    updateSelection();

    return () => {
      fabricCanvas.off?.("selection:created", updateSelection);
      fabricCanvas.off?.("selection:updated", updateSelection);
      fabricCanvas.off?.("selection:cleared", updateSelection);
    };
  }, [fabricCanvas]);

  const hasSelection = selectionCount > 0;

  const handleCopy = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    const source = objs[0];
    if (!source?.clone) {
      toast.error("Não foi possível copiar");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    source.clone((cloned: any) => {
      clipboardRef.current = cloned;
      setHasClipboard(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cloned.clone((dup: any) => {
        offsetObject(dup, 20);
        canvas.add(dup);
        canvas.setActiveObject?.(dup);
        canvas.requestRenderAll?.();
        toast.success("Copiado");
      });
    });
  };

  const handlePaste = () => {
    const canvas = canvasRef.current;
    const clip = clipboardRef.current;
    if (!canvas || !clip?.clone) {
      toast.error("Clipboard vazio");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clip.clone((cloned: any) => {
      offsetObject(cloned, 20);
      canvas.add(cloned);
      canvas.setActiveObject?.(cloned);
      canvas.requestRenderAll?.();
      toast.success("Colado");
    });
  };

  const handleDuplicate = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    const source = objs[0];
    if (!source?.clone) {
      toast.error("Não foi possível duplicar");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    source.clone((cloned: any) => {
      offsetObject(cloned, 20);
      canvas.add(cloned);
      canvas.setActiveObject?.(cloned);
      canvas.requestRenderAll?.();
      toast.success("Duplicado");
    });
  };

  const handleDelete = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((obj: any) => canvas.remove(obj));
    canvas.discardActiveObject?.();
    canvas.requestRenderAll?.();
    toast.success("Removido");
  };

  const handleBringToFront = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((obj: any) => canvas.bringToFront?.(obj));
    canvas.requestRenderAll?.();
    toast.success("Trazido para frente");
  };

  const handleSendToBack = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((obj: any) => canvas.sendToBack?.(obj));
    canvas.requestRenderAll?.();
    toast.success("Enviado para o fundo");
  };

  const handleBringForward = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((obj: any) => canvas.bringForward?.(obj));
    canvas.requestRenderAll?.();
    toast.success("Avançou 1 camada");
  };

  const handleSendBackwards = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((obj: any) => canvas.sendBackwards?.(obj));
    canvas.requestRenderAll?.();
    toast.success("Recuou 1 camada");
  };

  const handleFlipH = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((obj: any) => obj.set?.("flipX", !obj.flipX));
    canvas.requestRenderAll?.();
    toast.success("Invertido horizontal");
  };

  const handleFlipV = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((obj: any) => obj.set?.("flipY", !obj.flipY));
    canvas.requestRenderAll?.();
    toast.success("Invertido vertical");
  };

  const handleLock = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((obj: any) =>
      obj.set?.({
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
      })
    );
    canvas.requestRenderAll?.();
    toast.success("Bloqueado");
  };

  const handleUnlock = () => {
    const canvas = canvasRef.current;
    const objs = getActiveObjects(canvas);
    if (!canvas || objs.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((obj: any) =>
      obj.set?.({
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
      })
    );
    canvas.requestRenderAll?.();
    toast.success("Desbloqueado");
  };

  const actions = useMemo(() => [
    {
      key: "copy",
      label: "Copiar",
      icon: Copy,
      onClick: handleCopy,
      disabled: !hasSelection,
    },
    {
      key: "paste",
      label: "Colar",
      icon: ClipboardPaste,
      onClick: handlePaste,
      disabled: !hasClipboard,
    },
    {
      key: "duplicate",
      label: "Duplicar",
      icon: CopyPlus,
      onClick: handleDuplicate,
      disabled: !hasSelection,
    },
    {
      key: "delete",
      label: "Deletar",
      icon: Trash2,
      onClick: handleDelete,
      disabled: !hasSelection,
    },
    {
      key: "bring-front",
      label: "Trazer Frente",
      icon: ArrowUp,
      onClick: handleBringToFront,
      disabled: !hasSelection,
    },
    {
      key: "send-back",
      label: "Enviar Fundo",
      icon: ArrowDown,
      onClick: handleSendToBack,
      disabled: !hasSelection,
    },
    {
      key: "bring-forward",
      label: "Trazer +1",
      icon: ChevronUp,
      onClick: handleBringForward,
      disabled: !hasSelection,
    },
    {
      key: "send-backwards",
      label: "Enviar -1",
      icon: ChevronDown,
      onClick: handleSendBackwards,
      disabled: !hasSelection,
    },
    {
      key: "flip-h",
      label: "Flip H",
      icon: FlipHorizontal,
      onClick: handleFlipH,
      disabled: !hasSelection,
    },
    {
      key: "flip-v",
      label: "Flip V",
      icon: FlipVertical,
      onClick: handleFlipV,
      disabled: !hasSelection,
    },
    {
      key: "lock",
      label: "Bloquear",
      icon: Lock,
      onClick: handleLock,
      disabled: !hasSelection,
    },
    {
      key: "unlock",
      label: "Desbloquear",
      icon: Unlock,
      onClick: handleUnlock,
      disabled: !hasSelection,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [hasSelection, hasClipboard]);

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-semibold">Ações Rápidas</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {selectionCount} selecionado{selectionCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* eslint-disable-next-line react-hooks/refs */}
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.key}
              variant="outline"
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex h-auto flex-col items-center gap-1 py-2"
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] leading-tight">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
