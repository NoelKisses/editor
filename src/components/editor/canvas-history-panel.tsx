"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { History, Undo2, Redo2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasHistoryPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface HistoryEntry {
  id: string;
  label: string;
  timestamp: number;
  snapshot: string;
}

function describeChange(prev: string, next: string): string {
  try {
    const p = JSON.parse(prev);
    const n = JSON.parse(next);
    const pObjs = p.objects ?? [];
    const nObjs = n.objects ?? [];
    if (nObjs.length > pObjs.length) return "Objeto adicionado";
    if (nObjs.length < pObjs.length) return "Objeto removido";
    return "Objeto modificado";
  } catch {
    return "Alteração";
  }
}

const MAX_HISTORY = 30;

export function CanvasHistoryPanel({ fabricCanvas }: CanvasHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isRestoring = useRef(false);
  const lastSnapshot = useRef<string>("");

  const captureSnapshot = useCallback((): string => {
    if (!fabricCanvas) return "";
    return JSON.stringify(fabricCanvas.toJSON());
  }, [fabricCanvas]);

  const addEntry = useCallback((label: string) => {
    const snapshot = captureSnapshot();
    if (snapshot === lastSnapshot.current) return;
    lastSnapshot.current = snapshot;

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      timestamp: Date.now(),
      snapshot,
    };

    setHistory(prev => {
      const trimmed = prev.slice(0, MAX_HISTORY - 1);
      return [entry, ...trimmed];
    });
    setCurrentIndex(0);
  }, [captureSnapshot]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onModified = (e: any) => {
      if (isRestoring.current) return;
      const snap = captureSnapshot();
      const label = e.target ? describeChange(lastSnapshot.current || "{}", snap) : "Alteração";
      addEntry(label);
    };

    const onAdded = () => { if (!isRestoring.current) addEntry("Objeto adicionado"); };
    const onRemoved = () => { if (!isRestoring.current) addEntry("Objeto removido"); };

    fabricCanvas.on("object:modified", onModified);
    fabricCanvas.on("object:added", onAdded);
    fabricCanvas.on("object:removed", onRemoved);

    // Capture initial state
    queueMicrotask(() => {
      const initial = captureSnapshot();
      if (initial) {
        lastSnapshot.current = initial;
        setHistory([{
          id: "initial",
          label: "Estado inicial",
          timestamp: Date.now(),
          snapshot: initial,
        }]);
        setCurrentIndex(0);
      }
    });

    return () => {
      fabricCanvas.off("object:modified", onModified);
      fabricCanvas.off("object:added", onAdded);
      fabricCanvas.off("object:removed", onRemoved);
    };
  }, [fabricCanvas, addEntry, captureSnapshot]);

  const restoreEntry = useCallback((entry: HistoryEntry, index: number) => {
    if (!fabricCanvas) return;
    isRestoring.current = true;
    fabricCanvas.loadFromJSON(entry.snapshot, () => {
      fabricCanvas.requestRenderAll();
      lastSnapshot.current = entry.snapshot;
      setCurrentIndex(index);
      isRestoring.current = false;
      toast.success(`Restaurado: ${entry.label}`);
    });
  }, [fabricCanvas]);

  const undo = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= history.length) { toast.error("Nada para desfazer"); return; }
    restoreEntry(history[nextIndex], nextIndex);
  }, [currentIndex, history, restoreEntry]);

  const redo = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) { toast.error("Nada para refazer"); return; }
    restoreEntry(history[prevIndex], prevIndex);
  }, [currentIndex, history, restoreEntry]);

  const clearHistory = useCallback(() => {
    const current = history[currentIndex];
    if (!current) return;
    setHistory([current]);
    setCurrentIndex(0);
    toast.success("Histórico limpo");
  }, [history, currentIndex]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  };

  const canUndo = currentIndex < history.length - 1;
  const canRedo = currentIndex > 0;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Histórico</span>
      </div>

      {/* Undo/Redo buttons */}
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center justify-center gap-1 py-2 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-3 h-3" /> Desfazer
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center justify-center gap-1 py-2 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Redo2 className="w-3 h-3" /> Refazer
        </button>
      </div>

      {/* History list */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Histórico ({history.length}/{MAX_HISTORY})
          </span>
          <button onClick={clearHistory} title="Limpar histórico"
            className="text-muted-foreground hover:text-destructive transition-colors">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma ação registrada</p>
        ) : (
          <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
            {history.map((entry, i) => (
              <button
                key={entry.id}
                onClick={() => restoreEntry(entry, i)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-colors ${i === currentIndex ? "border-primary bg-primary/10" : "border-border hover:border-primary/20 hover:bg-muted/30"} ${i > currentIndex ? "opacity-40" : ""}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === currentIndex ? "bg-primary" : i < currentIndex ? "bg-muted-foreground/40" : "bg-muted-foreground/20"}`} />
                <span className="flex-1 text-[9px] truncate">{entry.label}</span>
                <span className="text-[7px] text-muted-foreground flex-shrink-0">{formatTime(entry.timestamp)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Máx. {MAX_HISTORY} estados · Ctrl+Z desfaz · Ctrl+Y refaz
      </p>
    </div>
  );
}
