"use client";

import { useCallback, useEffect, useState } from "react";
import { Clipboard, Copy, Scissors, ClipboardPaste, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editor-store";

interface ClipboardPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface HistoryEntry {
  id: number;
  label: string;
  type: string;
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
}

let historyIdCounter = 1;

function typeLabel(type: string): string {
  const m: Record<string, string> = {
    "i-text": "Texto", textbox: "Texto", text: "Texto",
    rect: "Retângulo", circle: "Círculo", ellipse: "Elipse",
    image: "Imagem", group: "Grupo", path: "Caminho",
    line: "Linha", triangle: "Triângulo", activeSelection: "Seleção",
  };
  return m[type] ?? type;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s atrás`;
  if (s < 3600) return `${Math.floor(s / 60)}m atrás`;
  return `${Math.floor(s / 3600)}h atrás`;
}

export function ClipboardPanel({ fabricCanvas, selectionVersion }: ClipboardPanelProps) {
  const [hasSelection, setHasSelection] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { clipboard, setClipboard } = useEditorStore();

  useEffect(() => {
    void selectionVersion;
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      const obj = fabricCanvas.getActiveObject();
      setHasSelection(!!obj);
    });
  }, [fabricCanvas, selectionVersion]);

  const copy = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto para copiar"); return; }

    obj.clone((cloned: unknown) => {
      setClipboard(cloned);
      const entry: HistoryEntry = {
        id: historyIdCounter++,
        label: typeLabel(obj.type ?? ""),
        type: obj.type ?? "unknown",
        timestamp: Date.now(),
        json: cloned,
      };
      setHistory(prev => [entry, ...prev].slice(0, 10));
      toast.success("Copiado");
    });
  }, [fabricCanvas, setClipboard]);

  const cut = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto para recortar"); return; }

    obj.clone((cloned: unknown) => {
      setClipboard(cloned);
      const entry: HistoryEntry = {
        id: historyIdCounter++,
        label: `✂ ${typeLabel(obj.type ?? "")}`,
        type: obj.type ?? "unknown",
        timestamp: Date.now(),
        json: cloned,
      };
      setHistory(prev => [entry, ...prev].slice(0, 10));
      fabricCanvas.remove(obj);
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
      toast.success("Recortado");
    });
  }, [fabricCanvas, setClipboard]);

  const paste = useCallback((sourceJson?: unknown) => {
    if (!fabricCanvas) return;
    const src = sourceJson ?? clipboard;
    if (!src) { toast.error("Nada para colar"); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (src as any).clone((cloned: any) => {
      fabricCanvas.discardActiveObject();
      cloned.set({
        left: (cloned.left ?? 0) + 15,
        top: (cloned.top ?? 0) + 15,
        evented: true,
      });
      if (cloned.type === "activeSelection") {
        cloned.canvas = fabricCanvas;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cloned.forEachObject((obj: any) => fabricCanvas.add(obj));
        cloned.setCoords();
      } else {
        fabricCanvas.add(cloned);
      }
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.requestRenderAll();
      toast.success("Colado");
    });
  }, [fabricCanvas, clipboard]);

  const duplicate = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto para duplicar"); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.clone((cloned: any) => {
      cloned.set({ left: (cloned.left ?? 0) + 15, top: (cloned.top ?? 0) + 15 });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.requestRenderAll();
      toast.success("Duplicado");
    });
  }, [fabricCanvas]);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    if (obj.type === "activeSelection") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).forEachObject((o: any) => fabricCanvas.remove(o));
      fabricCanvas.discardActiveObject();
    } else {
      fabricCanvas.remove(obj);
    }
    fabricCanvas.requestRenderAll();
    toast.success("Excluído");
  }, [fabricCanvas]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    toast.success("Histórico limpo");
  }, []);

  const ACTIONS = [
    { label: "Copiar", icon: Copy, shortcut: "⌘C", action: copy, requires: "selection" },
    { label: "Recortar", icon: Scissors, shortcut: "⌘X", action: cut, requires: "selection" },
    { label: "Colar", icon: ClipboardPaste, shortcut: "⌘V", action: () => paste(), requires: "clipboard" },
    { label: "Duplicar", icon: RotateCcw, shortcut: "⌘D", action: duplicate, requires: "selection" },
    { label: "Excluir", icon: Trash2, shortcut: "Del", action: deleteSelected, requires: "selection" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Clipboard className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Área de Transferência</span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-1">
        {ACTIONS.map(({ label, icon: Icon, shortcut, action, requires }) => {
          const disabled = requires === "selection" ? !hasSelection : requires === "clipboard" ? !clipboard : false;
          return (
            <button
              key={label}
              onClick={action}
              disabled={disabled}
              className="flex items-center justify-between px-3 py-2 rounded border border-border text-[10px] hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
            >
              <span className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
              <kbd className="text-[8px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{shortcut}</kbd>
            </button>
          );
        })}
      </div>

      {/* History */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Histórico (últimas 10 cópias)</span>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-[8px] text-muted-foreground/60 hover:text-destructive transition-colors">
              Limpar
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-3 opacity-60">Nenhum item copiado ainda</p>
        ) : (
          <div className="flex flex-col gap-1">
            {history.map(entry => (
              <button
                key={entry.id}
                onClick={() => paste(entry.json)}
                className="flex items-center justify-between px-2 py-1.5 rounded border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ClipboardPaste className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary flex-shrink-0" />
                  <span className="text-[9px] truncate">{entry.label}</span>
                </div>
                <span className="text-[8px] text-muted-foreground/50 flex-shrink-0 ml-2">{timeAgo(entry.timestamp)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Clique em um item do histórico para colá-lo no canvas
      </p>
    </div>
  );
}
