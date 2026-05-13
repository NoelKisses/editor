"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { History, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface VisualHistoryPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface HistoryEntry {
  id: string;
  label: string;
  timestamp: number;
  thumbnail: string;
  json: string;
}

const MAX_HISTORY = 30;

export function VisualHistoryPanel({ fabricCanvas, selectionVersion }: VisualHistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [tracking, setTracking] = useState(true);
  const lastJsonRef = useRef<string>("");
  const isRestoringRef = useRef(false);

  const captureEntry = useCallback((label: string) => {
    if (!fabricCanvas || isRestoringRef.current) return;
    try {
      const json = JSON.stringify(fabricCanvas.toJSON(["data", "name"]));
      if (json === lastJsonRef.current) return;
      lastJsonRef.current = json;
      const thumbnail = fabricCanvas.toDataURL({ format: "jpeg", quality: 0.25, multiplier: 0.15 });
      const entry: HistoryEntry = {
        id: `h-${Date.now()}`,
        label,
        timestamp: Date.now(),
        thumbnail,
        json,
      };
      setEntries(prev => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY);
        return next;
      });
      setCurrentIndex(0);
    } catch { /* ignore */ }
  }, [fabricCanvas]);

  // Track canvas changes
  useEffect(() => {
    if (!fabricCanvas || !tracking) return;
    const onModified = () => captureEntry("Modificação");
    const onAdded = () => captureEntry("Objeto adicionado");
    const onRemoved = () => captureEntry("Objeto removido");
    fabricCanvas.on("object:modified", onModified);
    fabricCanvas.on("object:added", onAdded);
    fabricCanvas.on("object:removed", onRemoved);
    return () => {
      fabricCanvas.off("object:modified", onModified);
      fabricCanvas.off("object:added", onAdded);
      fabricCanvas.off("object:removed", onRemoved);
    };
  }, [fabricCanvas, tracking, captureEntry]);

  // Capture initial state when canvas ready
  useEffect(() => {
    void selectionVersion;
    if (fabricCanvas && entries.length === 0) {
      queueMicrotask(() => captureEntry("Estado inicial"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas]);

  const restoreEntry = useCallback((entry: HistoryEntry, index: number) => {
    if (!fabricCanvas) return;
    isRestoringRef.current = true;
    fabricCanvas.loadFromJSON(JSON.parse(entry.json), () => {
      fabricCanvas.requestRenderAll();
      setCurrentIndex(index);
      isRestoringRef.current = false;
      toast.success(`Restaurado: ${entry.label}`);
    });
  }, [fabricCanvas]);

  const clearHistory = useCallback(() => {
    setEntries([]);
    setCurrentIndex(-1);
    lastJsonRef.current = "";
    toast.success("Histórico limpo");
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Histórico Visual</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTracking(v => !v)}
            className={`relative w-8 h-4 rounded-full transition-colors ${tracking ? "bg-primary" : "bg-muted"}`}
            title={tracking ? "Pausar gravação" : "Retomar gravação"}
          >
            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${tracking ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
          {entries.length > 0 && (
            <button onClick={clearHistory} className="text-[9px] text-muted-foreground hover:text-red-400 transition-colors" title="Limpar histórico">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        <span>{entries.length}/{MAX_HISTORY} estados</span>
        <span className={`flex items-center gap-0.5 ${tracking ? "text-green-500" : "text-yellow-500"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${tracking ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
          {tracking ? "Gravando" : "Pausado"}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <History className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Nenhuma ação registrada ainda</p>
          <p className="text-[9px] text-muted-foreground/60">O histórico é capturado automaticamente</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-0.5">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              onClick={() => restoreEntry(entry, index)}
              className={`flex items-center gap-2 p-1.5 rounded border transition-colors cursor-pointer ${index === currentIndex ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
            >
              {/* Index badge */}
              <span className={`text-[8px] w-4 h-4 rounded flex items-center justify-center flex-shrink-0 font-mono ${index === currentIndex ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                {entries.length - index}
              </span>

              {/* Thumbnail */}
              {entry.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.thumbnail} alt={entry.label} className="w-12 h-8 object-cover rounded-sm border border-border/50 flex-shrink-0" />
              ) : (
                <div className="w-12 h-8 bg-muted rounded-sm flex-shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-medium truncate ${index === currentIndex ? "text-primary" : ""}`}>{entry.label}</p>
                <p className="text-[8px] text-muted-foreground">{formatTime(entry.timestamp)}</p>
              </div>

              {/* Restore icon */}
              {index !== currentIndex && (
                <RotateCcw className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <p className="text-[8px] text-muted-foreground/60 text-center">
          Clique em um estado para restaurar o canvas
        </p>
      )}
    </div>
  );
}
