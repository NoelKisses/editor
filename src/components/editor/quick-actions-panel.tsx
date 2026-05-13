"use client";

import { useCallback } from "react";
import {
  Copy, Scissors, Clipboard, Trash2, Group, Ungroup,
  FlipHorizontal, FlipVertical, RotateCcw, RotateCw,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
} from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editor-store";

interface QuickActionsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

function ActionBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 p-2 rounded border transition-colors ${danger ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
    >
      <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      <span className="text-[7px] leading-tight text-center">{label}</span>
    </button>
  );
}

export function QuickActionsPanel({ fabricCanvas, selectionVersion }: QuickActionsPanelProps) {
  void selectionVersion;
  const { clipboard, setClipboard } = useEditorStore();

  const copy = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    obj.clone((cloned: unknown) => {
      setClipboard(cloned);
      toast.success("Copiado");
    });
  }, [fabricCanvas, setClipboard]);

  const cut = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    obj.clone((cloned: unknown) => { setClipboard(cloned); });
    fabricCanvas.remove(obj);
    fabricCanvas.requestRenderAll();
    toast.success("Recortado");
  }, [fabricCanvas, setClipboard]);

  const paste = useCallback(() => {
    if (!fabricCanvas || !clipboard) { toast.error("Clipboard vazio"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (clipboard as any).clone((cloned: any) => {
      fabricCanvas.discardActiveObject();
      cloned.set({
        left: ((clipboard as { left?: number }).left ?? 0) + 15,
        top: ((clipboard as { top?: number }).top ?? 0) + 15,
        evented: true,
      });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.requestRenderAll();
      toast.success("Colado");
    });
  }, [fabricCanvas, clipboard]);

  const duplicate = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.clone((cloned: any) => {
      cloned.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.requestRenderAll();
      toast.success("Duplicado (Ctrl+D)");
    });
  }, [fabricCanvas]);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    fabricCanvas.remove(obj);
    fabricCanvas.requestRenderAll();
    toast.success("Removido");
  }, [fabricCanvas]);

  const group = useCallback(() => {
    if (!fabricCanvas) return;
    const sel = fabricCanvas.getActiveObject();
    if (!sel || sel.type !== "activeSelection") { toast.error("Selecione múltiplos objetos"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grp = (sel as any).toGroup();
    fabricCanvas.setActiveObject(grp);
    fabricCanvas.requestRenderAll();
    toast.success("Agrupado");
  }, [fabricCanvas]);

  const ungroup = useCallback(() => {
    if (!fabricCanvas) return;
    const sel = fabricCanvas.getActiveObject();
    if (!sel || sel.type !== "group") { toast.error("Selecione um grupo"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (sel as any).toActiveSelection();
    fabricCanvas.setActiveObject(items);
    fabricCanvas.requestRenderAll();
    toast.success("Desagrupado");
  }, [fabricCanvas]);

  const flipH = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ flipX: !obj.flipX });
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const flipV = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ flipY: !obj.flipY });
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const rotate = useCallback((deg: number) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ angle: ((obj.angle ?? 0) + deg) % 360 });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const bringForward = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    fabricCanvas.bringForward(obj);
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const sendBackward = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    fabricCanvas.sendBackwards(obj);
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const bringToFront = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    fabricCanvas.bringToFront(obj);
    fabricCanvas.requestRenderAll();
    toast.success("Movido para frente");
  }, [fabricCanvas]);

  const sendToBack = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    fabricCanvas.sendToBack(obj);
    fabricCanvas.requestRenderAll();
    toast.success("Movido para o fundo");
  }, [fabricCanvas]);

  const selectAll = useCallback(async () => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then(m => m.fabric);
    fabricCanvas.discardActiveObject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = fabricCanvas.getObjects() as any[];
    if (!objs.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sel = new (fabric as any).ActiveSelection(objs, { canvas: fabricCanvas });
    fabricCanvas.setActiveObject(sel);
    fabricCanvas.requestRenderAll();
    toast.success(`${objs.length} objetos selecionados`);
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Copy className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Ações Rápidas</span>
      </div>

      {/* Clipboard */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Clipboard</span>
        <div className="grid grid-cols-4 gap-1">
          <ActionBtn icon={<Copy className="w-3.5 h-3.5" />} label="Copiar" onClick={copy} />
          <ActionBtn icon={<Scissors className="w-3.5 h-3.5" />} label="Recortar" onClick={cut} />
          <ActionBtn icon={<Clipboard className="w-3.5 h-3.5" />} label="Colar" onClick={paste} />
          <ActionBtn icon={<Copy className="w-3.5 h-3.5" />} label="Duplicar" onClick={duplicate} />
        </div>
        {clipboard && (
          <p className="text-[8px] text-primary/70 text-center">✓ Clipboard com conteúdo</p>
        )}
      </div>

      {/* Transform */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Transformar</span>
        <div className="grid grid-cols-4 gap-1">
          <ActionBtn icon={<FlipHorizontal className="w-3.5 h-3.5" />} label="Espelhar H" onClick={flipH} />
          <ActionBtn icon={<FlipVertical className="w-3.5 h-3.5" />} label="Espelhar V" onClick={flipV} />
          <ActionBtn icon={<RotateCcw className="w-3.5 h-3.5" />} label="-90°" onClick={() => rotate(-90)} />
          <ActionBtn icon={<RotateCw className="w-3.5 h-3.5" />} label="+90°" onClick={() => rotate(90)} />
        </div>
      </div>

      {/* Order */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ordem das camadas</span>
        <div className="grid grid-cols-4 gap-1">
          <ActionBtn icon={<ChevronsUp className="w-3.5 h-3.5" />} label="Frente" onClick={bringToFront} />
          <ActionBtn icon={<ArrowUp className="w-3.5 h-3.5" />} label="Avançar" onClick={bringForward} />
          <ActionBtn icon={<ArrowDown className="w-3.5 h-3.5" />} label="Recuar" onClick={sendBackward} />
          <ActionBtn icon={<ChevronsDown className="w-3.5 h-3.5" />} label="Fundo" onClick={sendToBack} />
        </div>
      </div>

      {/* Group */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Agrupamento</span>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={group}
            className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Group className="w-3 h-3" /> Agrupar
          </button>
          <button
            onClick={ungroup}
            className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Ungroup className="w-3 h-3" /> Desagrupar
          </button>
        </div>
        <button
          onClick={selectAll}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/40 hover:text-primary transition-colors"
        >
          Selecionar Tudo (Ctrl+A)
        </button>
      </div>

      {/* Delete */}
      <ActionBtn icon={<Trash2 className="w-3.5 h-3.5" />} label="Excluir objeto" onClick={deleteSelected} danger />
    </div>
  );
}
