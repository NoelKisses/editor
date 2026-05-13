"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, Unlock, Eye, EyeOff, Group, Ungroup, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ObjectLockPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

export function ObjectLockPanel({ fabricCanvas, selectionVersion }: ObjectLockPanelProps) {
  const [locked, setLocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isGroup, setIsGroup] = useState(false);
  const [isSelection, setIsSelection] = useState(false);
  const [hasObject, setHasObject] = useState(false);
  const [objectName, setObjectName] = useState("");
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) {
      queueMicrotask(() => {
        setHasObject(false);
        setLocked(false);
        setVisible(true);
        setIsGroup(false);
        setIsSelection(false);
        setObjectName("");
      });
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    queueMicrotask(() => {
      setHasObject(true);
      setLocked(!o.selectable || o.evented === false);
      setVisible(o.visible !== false);
      setIsGroup(o.type === "group");
      setIsSelection(o.type === "activeSelection");
      setObjectName(o.data?.name ?? o.type ?? "objeto");
    });
  }, [fabricCanvas, selectionVersion]);

  const getActive = () => fabricCanvas?.getActiveObject();

  const handleToggleLock = useCallback(() => {
    const obj = getActive();
    if (!obj || !fabricCanvas) return;
    const newLocked = !locked;
    obj.set({
      selectable: !newLocked,
      evented: !newLocked,
      lockMovementX: newLocked,
      lockMovementY: newLocked,
      lockRotation: newLocked,
      lockScalingX: newLocked,
      lockScalingY: newLocked,
      hasControls: !newLocked,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj as any).data = { ...((obj as any).data ?? {}), locked: newLocked };
    setLocked(newLocked);
    fabricCanvas.requestRenderAll();
    toast.success(newLocked ? "Objeto bloqueado" : "Objeto desbloqueado");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, fabricCanvas]);

  const handleToggleVisible = useCallback(() => {
    const obj = getActive();
    if (!obj || !fabricCanvas) return;
    const newVisible = !visible;
    obj.set({ visible: newVisible });
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
    setVisible(newVisible);
    toast.success(newVisible ? "Objeto visível" : "Objeto oculto");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, fabricCanvas]);

  const handleGroup = useCallback(async () => {
    const obj = getActive();
    if (!obj || !fabricCanvas) return;
    if (obj.type === "activeSelection") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const group = (obj as any).toGroup();
      fabricCanvas.setActiveObject(group);
      fabricCanvas.requestRenderAll();
      toast.success("Elementos agrupados");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const handleUngroup = useCallback(() => {
    const obj = getActive();
    if (!obj || !fabricCanvas || obj.type !== "group") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sel = (obj as any).toActiveSelection();
    fabricCanvas.setActiveObject(sel);
    fabricCanvas.requestRenderAll();
    toast.success("Grupo desfeito");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const handleBringForward = useCallback(() => {
    const obj = getActive();
    if (!obj || !fabricCanvas) return;
    fabricCanvas.bringForward(obj);
    fabricCanvas.requestRenderAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const handleSendBackward = useCallback(() => {
    const obj = getActive();
    if (!obj || !fabricCanvas) return;
    fabricCanvas.sendBackwards(obj);
    fabricCanvas.requestRenderAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const handleBringToFront = useCallback(() => {
    const obj = getActive();
    if (!obj || !fabricCanvas) return;
    fabricCanvas.bringToFront(obj);
    fabricCanvas.requestRenderAll();
    toast.success("Enviado para frente");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const handleSendToBack = useCallback(() => {
    const obj = getActive();
    if (!obj || !fabricCanvas) return;
    fabricCanvas.sendToBack(obj);
    fabricCanvas.requestRenderAll();
    toast.success("Enviado para o fundo");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const handleDuplicate = useCallback(() => {
    const obj = getActive();
    if (!obj || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.clone((cloned: any) => {
      cloned.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.requestRenderAll();
      toast.success("Duplicado");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const handleDelete = useCallback(() => {
    const obj = getActive();
    if (!obj || !fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    if (Array.isArray(o._objects)) {
      o._objects.forEach((child: unknown) => fabricCanvas.remove(child));
    } else {
      fabricCanvas.remove(obj);
    }
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
    toast.success("Removido");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const handleSaveName = useCallback(() => {
    const obj = getActive();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj as any).data = { ...((obj as any).data ?? {}), name: objectName };
    setEditingName(false);
    toast.success("Nome salvo");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectName, fabricCanvas]);

  if (!hasObject) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Lock className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground">Selecione um objeto para gerenciar bloqueio, visibilidade e ordenação</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Objeto</span>
      </div>

      {/* Object name */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nome</span>
        {editingName ? (
          <div className="flex gap-1">
            <input
              autoFocus
              value={objectName}
              onChange={(e) => setObjectName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
              className="flex-1 text-[11px] bg-background border border-primary/50 rounded px-2 py-1 outline-none"
            />
            <button onClick={handleSaveName} className="text-[9px] px-2 py-1 bg-primary text-primary-foreground rounded">OK</button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-left text-[11px] px-2 py-1.5 rounded border border-border hover:border-primary/40 text-foreground capitalize"
          >
            {objectName || "clique para nomear..."}
          </button>
        )}
      </div>

      {/* Lock + Visibility */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleToggleLock}
          className={`flex items-center justify-center gap-1.5 py-2 rounded border text-[10px] font-medium transition-all ${locked ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "border-border text-muted-foreground hover:border-primary/30"}`}
        >
          {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          {locked ? "Bloqueado" : "Bloquear"}
        </button>
        <button
          onClick={handleToggleVisible}
          className={`flex items-center justify-center gap-1.5 py-2 rounded border text-[10px] font-medium transition-all ${!visible ? "bg-muted/50 border-border text-muted-foreground" : "border-border text-muted-foreground hover:border-primary/30"}`}
        >
          {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {visible ? "Visível" : "Oculto"}
        </button>
      </div>

      {/* Group / Ungroup */}
      {(isGroup || isSelection) && (
        <div className="grid grid-cols-2 gap-2">
          {isSelection && (
            <button onClick={handleGroup} className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary/30 text-primary text-[10px] hover:bg-primary/10 transition-colors">
              <Group className="w-3.5 h-3.5" />
              Agrupar
            </button>
          )}
          {isGroup && (
            <button onClick={handleUngroup} className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors">
              <Ungroup className="w-3.5 h-3.5" />
              Desagrupar
            </button>
          )}
        </div>
      )}

      {/* Z-order */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ordem (Z-index)</span>
        <div className="grid grid-cols-4 gap-1">
          <button onClick={handleBringToFront} title="Trazer para frente" className="flex items-center justify-center py-2 rounded border border-border hover:border-primary/40 transition-colors">
            <ChevronsUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={handleBringForward} title="Avançar uma camada" className="flex items-center justify-center py-2 rounded border border-border hover:border-primary/40 transition-colors">
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={handleSendBackward} title="Recuar uma camada" className="flex items-center justify-center py-2 rounded border border-border hover:border-primary/40 transition-colors">
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={handleSendToBack} title="Enviar para o fundo" className="flex items-center justify-center py-2 rounded border border-border hover:border-primary/40 transition-colors">
            <ChevronsDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <span className="text-center text-[8px] text-muted-foreground/60">Frente</span>
          <span className="text-center text-[8px] text-muted-foreground/60">Avançar</span>
          <span className="text-center text-[8px] text-muted-foreground/60">Recuar</span>
          <span className="text-center text-[8px] text-muted-foreground/60">Fundo</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 pt-1 border-t border-border">
        <button
          onClick={handleDuplicate}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 hover:text-foreground transition-colors"
        >
          <Copy className="w-3 h-3" />
          Duplicar
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded border border-red-500/20 text-red-400 text-[10px] hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Remover
        </button>
      </div>
    </div>
  );
}
