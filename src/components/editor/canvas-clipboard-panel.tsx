"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardCopy, ClipboardPaste, Scissors, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface CanvasClipboardPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

export function CanvasClipboardPanel({ fabricCanvas, selectionVersion }: CanvasClipboardPanelProps) {
  const [hasSelection, setHasSelection] = useState(false);
  const [clipCount, setClipCount] = useState(0);
  const [pasteOffset, setPasteOffset] = useState(20);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clipboardRef = useRef<any[]>([]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      const sel = fabricCanvas.getActiveObject() ?? fabricCanvas.getActiveObjects?.();
      const count = Array.isArray(sel) ? sel.length : (sel ? 1 : 0);
      setHasSelection(count > 0);
    });
  }, [fabricCanvas, selectionVersion]);

  const getSelected = useCallback((): unknown[] => {
    if (!fabricCanvas) return [];
    const active = fabricCanvas.getActiveObject();
    if (!active) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((active as any).type === "activeSelection") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (active as any).getObjects();
    }
    return [active];
  }, [fabricCanvas]);

  const copyObjects = useCallback(() => {
    const objs = getSelected();
    if (objs.length === 0) { toast.error("Nenhum objeto selecionado"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const clones: unknown[] = [];
      let done = 0;
      objs.forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any).clone((clone: unknown) => {
          clones.push(clone);
          done++;
          if (done === objs.length) {
            clipboardRef.current = clones;
            setClipCount(clones.length);
            toast.success(`${clones.length} objeto(s) copiado(s)`);
          }
        }, f.Object.prototype.stateProperties);
      });
    });
  }, [getSelected]);

  const cutObjects = useCallback(() => {
    const objs = getSelected();
    if (objs.length === 0) { toast.error("Nenhum objeto selecionado"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const clones: unknown[] = [];
      let done = 0;
      objs.forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any).clone((clone: unknown) => {
          clones.push(clone);
          done++;
          if (done === objs.length) {
            clipboardRef.current = clones;
            setClipCount(clones.length);
            objs.forEach(o => fabricCanvas.remove(o));
            fabricCanvas.discardActiveObject();
            fabricCanvas.requestRenderAll();
            toast.success(`${clones.length} objeto(s) recortado(s)`);
          }
        }, f.Object.prototype.stateProperties);
      });
    });
  }, [getSelected, fabricCanvas]);

  const pasteObjects = useCallback(() => {
    if (clipboardRef.current.length === 0) { toast.error("Área de transferência vazia"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const newClones: unknown[] = [];
      let done = 0;
      const originals = clipboardRef.current;

      originals.forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any).clone((clone: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const c = clone as any;
          c.set({
            left: c.left + pasteOffset,
            top: c.top + pasteOffset,
            evented: true,
          });
          fabricCanvas.add(c);
          newClones.push(c);
          done++;

          if (done === originals.length) {
            if (newClones.length === 1) {
              fabricCanvas.setActiveObject(newClones[0]);
            } else {
              const sel = new f.ActiveSelection(newClones, { canvas: fabricCanvas });
              fabricCanvas.setActiveObject(sel);
            }
            clipboardRef.current = newClones;
            fabricCanvas.requestRenderAll();
            toast.success(`${newClones.length} objeto(s) colado(s)`);
          }
        }, f.Object.prototype.stateProperties);
      });
    });
  }, [fabricCanvas, pasteOffset]);

  const deleteSelected = useCallback(() => {
    const objs = getSelected();
    if (objs.length === 0) { toast.error("Nenhum objeto selecionado"); return; }
    objs.forEach(o => fabricCanvas.remove(o));
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
    toast.success(`${objs.length} objeto(s) excluído(s)`);
  }, [getSelected, fabricCanvas]);

  const duplicateObjects = useCallback(() => {
    const objs = getSelected();
    if (objs.length === 0) { toast.error("Nenhum objeto selecionado"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const dupes: unknown[] = [];
      let done = 0;

      objs.forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any).clone((clone: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const c = clone as any;
          c.set({ left: c.left + pasteOffset, top: c.top + pasteOffset });
          fabricCanvas.add(c);
          dupes.push(c);
          done++;
          if (done === objs.length) {
            if (dupes.length === 1) {
              fabricCanvas.setActiveObject(dupes[0]);
            } else {
              const sel = new f.ActiveSelection(dupes, { canvas: fabricCanvas });
              fabricCanvas.setActiveObject(sel);
            }
            fabricCanvas.requestRenderAll();
            toast.success(`${dupes.length} objeto(s) duplicado(s)`);
          }
        }, f.Object.prototype.stateProperties);
      });
    });
  }, [getSelected, fabricCanvas, pasteOffset]);

  const selectAll = useCallback(() => {
    if (!fabricCanvas) return;
    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const all = fabricCanvas.getObjects();
      if (all.length === 0) { toast.error("Canvas vazio"); return; }
      const sel = new f.ActiveSelection(all, { canvas: fabricCanvas });
      fabricCanvas.setActiveObject(sel);
      fabricCanvas.requestRenderAll();
      toast.success(`${all.length} objetos selecionados`);
    });
  }, [fabricCanvas]);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvas) return;
    const count = fabricCanvas.getObjects().length;
    fabricCanvas.clear();
    fabricCanvas.requestRenderAll();
    toast.success(`Canvas limpo (${count} objeto(s) removido(s))`);
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <ClipboardCopy className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Área de Transferência</span>
      </div>

      {/* Clipboard status */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded border border-border bg-muted/10">
        <span className="text-[9px] text-muted-foreground">Na área de transferência</span>
        <span className={`text-[9px] font-mono tabular-nums ${clipCount > 0 ? "text-primary" : "text-muted-foreground/40"}`}>
          {clipCount} objeto(s)
        </span>
      </div>

      {/* Paste offset */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Deslocamento ao colar</span>
          <span className="text-[9px] tabular-nums">{pasteOffset}px</span>
        </div>
        <input type="range" min={0} max={100} step={5} value={pasteOffset}
          onChange={e => setPasteOffset(Number(e.target.value))} className="w-full accent-primary h-1" />
      </div>

      {/* Main actions */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={copyObjects} disabled={!hasSelection}
          className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <ClipboardCopy className="w-3 h-3" /> Copiar
        </button>
        <button onClick={cutObjects} disabled={!hasSelection}
          className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Scissors className="w-3 h-3" /> Recortar
        </button>
        <button onClick={pasteObjects} disabled={clipCount === 0}
          className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <ClipboardPaste className="w-3 h-3" /> Colar
        </button>
        <button onClick={duplicateObjects} disabled={!hasSelection}
          className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Copy className="w-3 h-3" /> Duplicar
        </button>
      </div>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={selectAll}
          className="py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
          Selecionar tudo
        </button>
        <button onClick={deleteSelected} disabled={!hasSelection}
          className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Trash2 className="w-3 h-3" /> Excluir
        </button>
      </div>

      {/* Danger zone */}
      <div className="p-2 rounded border border-destructive/20 bg-destructive/5">
        <span className="text-[8px] text-destructive/70">Zona de perigo</span>
        <button onClick={clearCanvas}
          className="w-full mt-1 py-1.5 rounded border border-destructive/30 text-destructive text-[8px] hover:bg-destructive/10 transition-colors">
          Limpar canvas inteiro
        </button>
      </div>
    </div>
  );
}
