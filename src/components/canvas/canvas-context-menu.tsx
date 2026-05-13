"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Clipboard,
  Scissors,
  CopyPlus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  FlipHorizontal2,
  FlipVertical2,
  Lock,
  Unlock,
  Crop,
  Group,
  Ungroup,
  AlignCenter,
  MousePointer2,
} from "lucide-react";
import { CropImageDialog } from "@/components/editor/crop-image-dialog";
import { useEditorStore } from "@/store/editor-store";

interface CanvasContextMenuProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface MenuPosition {
  x: number;
  y: number;
}

export function CanvasContextMenu({ fabricCanvas }: CanvasContextMenuProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<MenuPosition>({ x: 0, y: 0 });
  const [cropOpen, setCropOpen] = useState(false);
  const { clipboard, setClipboard } = useEditorStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clipboardRef = useRef<any>(null);
  useEffect(() => { clipboardRef.current = clipboard; }, [clipboard]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [targetObj, setTargetObj] = useState<any>(null);

  useEffect(() => {
    if (!fabricCanvas) return;

    const canvasEl = fabricCanvas.upperCanvasEl as HTMLElement | undefined;
    if (!canvasEl) return;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const obj = fabricCanvas.getActiveObject();
      setTargetObj(obj ?? null);
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };

    canvasEl.addEventListener("contextmenu", onContextMenu);
    return () => canvasEl.removeEventListener("contextmenu", onContextMenu);
  }, [fabricCanvas]);

  useEffect(() => {
    const close = () => setVisible(false);
    window.addEventListener("click", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", close);
    };
  }, []);

  const act = useCallback(
    (fn: () => void) => {
      fn();
      setVisible(false);
    },
    []
  );

  const handleCopy = () =>
    act(() => {
      if (!targetObj) return;
      targetObj.clone((cloned: unknown) => {
        clipboardRef.current = cloned;
        setClipboard(cloned);
      });
      toast.success("Copiado");
    });

  const handleCut = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      targetObj.clone((cloned: unknown) => {
        clipboardRef.current = cloned;
        setClipboard(cloned);
      });
      fabricCanvas.remove(targetObj);
      fabricCanvas.requestRenderAll();
      toast.success("Recortado");
    });

  const handlePaste = () =>
    act(() => {
      const cb = clipboardRef.current;
      if (!fabricCanvas || !cb) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cb.clone((newObj: any) => {
        fabricCanvas.discardActiveObject();
        newObj.set({
          left: (cb.left ?? 0) + 15,
          top: (cb.top ?? 0) + 15,
          evented: true,
        });
        cb.left += 15;
        cb.top += 15;
        fabricCanvas.add(newObj);
        fabricCanvas.setActiveObject(newObj);
        fabricCanvas.requestRenderAll();
      });
      toast.success("Colado");
    });

  const handleDuplicate = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targetObj.clone((cloned: any) => {
        cloned.set({ left: (targetObj.left ?? 0) + 20, top: (targetObj.top ?? 0) + 20 });
        fabricCanvas.add(cloned);
        fabricCanvas.setActiveObject(cloned);
        fabricCanvas.requestRenderAll();
      });
      toast.success("Duplicado");
    });

  const handleDelete = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      fabricCanvas.remove(targetObj);
      fabricCanvas.requestRenderAll();
      toast.success("Removido");
    });

  const handleBringToFront = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      fabricCanvas.bringToFront(targetObj);
      fabricCanvas.requestRenderAll();
    });

  const handleSendToBack = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      fabricCanvas.sendToBack(targetObj);
      fabricCanvas.requestRenderAll();
    });

  const handleBringForward = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      fabricCanvas.bringForward(targetObj);
      fabricCanvas.requestRenderAll();
    });

  const handleSendBackward = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      fabricCanvas.sendBackwards(targetObj);
      fabricCanvas.requestRenderAll();
    });

  const handleFlipH = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      targetObj.set({ flipX: !targetObj.flipX });
      fabricCanvas.requestRenderAll();
    });

  const handleFlipV = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      targetObj.set({ flipY: !targetObj.flipY });
      fabricCanvas.requestRenderAll();
    });

  const handleLock = () =>
    act(() => {
      if (!targetObj || !fabricCanvas) return;
      const locked = !targetObj.lockMovementX;
      targetObj.set({
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked,
        selectable: !locked,
        evented: true,
      });
      fabricCanvas.requestRenderAll();
      toast.success(locked ? "Objeto bloqueado" : "Objeto desbloqueado");
    });

  const handleCrop = () => {
    if (!targetObj || targetObj.type !== "image") return;
    setVisible(false);
    setCropOpen(true);
  };

  const handleCenterOnCanvas = () =>
    act(async () => {
      if (!targetObj || !fabricCanvas) return;
      const { fabric } = await import("fabric");
      void fabric;
      const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
      const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();
      const ow = targetObj.getScaledWidth?.() ?? targetObj.width ?? 0;
      const oh = targetObj.getScaledHeight?.() ?? targetObj.height ?? 0;
      targetObj.set({ left: (cw - ow) / 2, top: (ch - oh) / 2 });
      fabricCanvas.requestRenderAll();
      toast.success("Centralizado no canvas");
    });

  const handleSelectAll = () =>
    act(() => {
      if (!fabricCanvas) return;
      fabricCanvas.discardActiveObject();
      const objs = fabricCanvas.getObjects().filter((o: { selectable?: boolean }) => o.selectable !== false);
      if (!objs.length) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { fabric } = { fabric: (window as any).__fabric };
      if (fabric) {
        const sel = new fabric.ActiveSelection(objs, { canvas: fabricCanvas });
        fabricCanvas.setActiveObject(sel);
      } else {
        import("fabric").then(({ fabric: f }) => {
          const sel = new f.ActiveSelection(objs, { canvas: fabricCanvas });
          fabricCanvas.setActiveObject(sel);
          fabricCanvas.requestRenderAll();
        });
      }
      fabricCanvas.requestRenderAll();
    });

  const handleGroup = () =>
    act(async () => {
      if (!fabricCanvas) return;
      const active = fabricCanvas.getActiveObject();
      if (!active || active.type !== "activeSelection") {
        toast.error("Selecione múltiplos objetos para agrupar (Shift+clique)");
        return;
      }
      const { fabric } = await import("fabric");
      const items = active.getObjects();
      const group = new fabric.Group(items, {
        left: active.left,
        top: active.top,
        originX: "left",
        originY: "top",
      });
      fabricCanvas.discardActiveObject();
      items.forEach((obj: object) => fabricCanvas.remove(obj));
      fabricCanvas.add(group);
      fabricCanvas.setActiveObject(group);
      fabricCanvas.requestRenderAll();
      toast.success("Agrupado");
    });

  const handleUngroup = () =>
    act(async () => {
      if (!targetObj || !fabricCanvas) return;
      if (targetObj.type !== "group") {
        toast.error("Selecione um grupo para desagrupar");
        return;
      }
      const { fabric } = await import("fabric");
      void fabric;
      const items = targetObj.getObjects();
      targetObj.forEachObject((obj: object) => {
        targetObj.removeWithUpdate(obj);
        fabricCanvas.add(obj);
      });
      fabricCanvas.remove(targetObj);
      fabricCanvas.discardActiveObject();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sel = new (await import("fabric")).fabric.ActiveSelection(items as any[], { canvas: fabricCanvas });
      fabricCanvas.setActiveObject(sel);
      fabricCanvas.requestRenderAll();
      toast.success("Desagrupado");
    });

  if (!visible && !cropOpen) return null;

  const hasObj = !!targetObj;
  const isLocked = hasObj && targetObj.lockMovementX;
  const isImage = hasObj && targetObj.type === "image";
  const isGroup = hasObj && targetObj.type === "group";
  const isMultiSelection = hasObj && targetObj.type === "activeSelection";

  return (
    <>
      {visible && (
        <div
          className="fixed z-[9999] bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[180px] text-sm"
          style={{ left: pos.x, top: pos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Global actions (no object needed) */}
          <MenuItem icon={<MousePointer2 className="w-3.5 h-3.5" />} label="Selecionar tudo" shortcut="Ctrl+A" onClick={handleSelectAll} />

          <Divider />

          {/* Clipboard */}
          <MenuItem icon={<Copy className="w-3.5 h-3.5" />} label="Copiar" shortcut="Ctrl+C" onClick={handleCopy} disabled={!hasObj} />
          <MenuItem icon={<Scissors className="w-3.5 h-3.5" />} label="Recortar" shortcut="Ctrl+X" onClick={handleCut} disabled={!hasObj} />
          <MenuItem icon={<Clipboard className="w-3.5 h-3.5" />} label="Colar" shortcut="Ctrl+V" onClick={handlePaste} />
          <MenuItem icon={<CopyPlus className="w-3.5 h-3.5" />} label="Duplicar" shortcut="Ctrl+D" onClick={handleDuplicate} disabled={!hasObj} />

          <Divider />

          {/* Image specific */}
          {isImage && (
            <>
              <MenuItem icon={<Crop className="w-3.5 h-3.5" />} label="Recortar imagem" onClick={handleCrop} />
              <Divider />
            </>
          )}

          {/* Order */}
          <MenuItem icon={<ChevronsUp className="w-3.5 h-3.5" />} label="Trazer para frente" onClick={handleBringToFront} disabled={!hasObj} />
          <MenuItem icon={<ChevronUp className="w-3.5 h-3.5" />} label="Avançar camada" onClick={handleBringForward} disabled={!hasObj} />
          <MenuItem icon={<ChevronDown className="w-3.5 h-3.5" />} label="Recuar camada" onClick={handleSendBackward} disabled={!hasObj} />
          <MenuItem icon={<ChevronsDown className="w-3.5 h-3.5" />} label="Enviar para trás" onClick={handleSendToBack} disabled={!hasObj} />

          <Divider />

          {/* Flip */}
          <MenuItem icon={<FlipHorizontal2 className="w-3.5 h-3.5" />} label="Espelhar Horizontal" onClick={handleFlipH} disabled={!hasObj} />
          <MenuItem icon={<FlipVertical2 className="w-3.5 h-3.5" />} label="Espelhar Vertical" onClick={handleFlipV} disabled={!hasObj} />

          <Divider />

          {/* Center on canvas */}
          <MenuItem icon={<AlignCenter className="w-3.5 h-3.5" />} label="Centralizar no canvas" onClick={handleCenterOnCanvas} disabled={!hasObj} />

          <Divider />

          {/* Group / Ungroup */}
          {isMultiSelection && (
            <MenuItem icon={<Group className="w-3.5 h-3.5" />} label="Agrupar" shortcut="Ctrl+G" onClick={handleGroup} />
          )}
          {isGroup && (
            <MenuItem icon={<Ungroup className="w-3.5 h-3.5" />} label="Desagrupar" shortcut="Ctrl+Shift+G" onClick={handleUngroup} />
          )}
          {(isMultiSelection || isGroup) && <Divider />}

          {/* Lock */}
          <MenuItem
            icon={isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            label={isLocked ? "Desbloquear" : "Bloquear"}
            onClick={handleLock}
            disabled={!hasObj}
          />

          <Divider />

          {/* Delete */}
          <MenuItem
            icon={<Trash2 className="w-3.5 h-3.5 text-destructive" />}
            label="Deletar"
            shortcut="Del"
            onClick={handleDelete}
            disabled={!hasObj}
            danger
          />
        </div>
      )}

      {cropOpen && targetObj && (
        <CropImageDialog
          open={cropOpen}
          onClose={() => setCropOpen(false)}
          fabricCanvas={fabricCanvas}
          imageObject={targetObj}
        />
      )}
    </>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors text-left
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-accent cursor-pointer"}
        ${danger ? "text-destructive" : "text-foreground"}
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[10px] text-muted-foreground ml-auto">{shortcut}</span>}
    </button>
  );
}

function Divider() {
  return <div className="my-1 border-t border-border" />;
}
