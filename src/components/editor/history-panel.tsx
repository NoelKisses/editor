"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock } from "lucide-react";

interface HistoryEntry {
  thumbnail: string;
  json: string;
  timestamp: number;
  label: string;
}

interface HistoryPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const MAX_HISTORY = 30;

export function HistoryPanel({ fabricCanvas, selectionVersion }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringRef = useRef(false);
  const lastJsonRef = useRef<string>("");

  const captureSnapshot = useCallback(() => {
    if (!fabricCanvas || isRestoringRef.current) return;

    const json = JSON.stringify(fabricCanvas.toJSON());
    // Skip if nothing changed
    if (json === lastJsonRef.current) return;
    lastJsonRef.current = json;

    const thumbnail = fabricCanvas.toDataURL({
      format: "jpeg",
      quality: 0.4,
      multiplier: Math.min(160 / fabricCanvas.getWidth(), 90 / fabricCanvas.getHeight()),
    });

    const entry: HistoryEntry = {
      thumbnail,
      json,
      timestamp: Date.now(),
      label: `Estado ${Date.now()}`,
    };

    setEntries((prev) => {
      const newEntries = [...prev.slice(0, MAX_HISTORY - 1), entry];
      setCurrentIndex(newEntries.length - 1);
      return newEntries;
    });
  }, [fabricCanvas]);

  // Debounced capture on canvas modifications
  useEffect(() => {
    if (!fabricCanvas) return;

    const debouncedCapture = () => {
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = setTimeout(captureSnapshot, 500);
    };

    fabricCanvas.on("object:added", debouncedCapture);
    fabricCanvas.on("object:modified", debouncedCapture);
    fabricCanvas.on("object:removed", debouncedCapture);

    return () => {
      fabricCanvas.off("object:added", debouncedCapture);
      fabricCanvas.off("object:modified", debouncedCapture);
      fabricCanvas.off("object:removed", debouncedCapture);
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    };
  }, [fabricCanvas, captureSnapshot]);

  // Capture on selection/property changes
  useEffect(() => {
    if (selectionVersion > 0) {
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = setTimeout(captureSnapshot, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionVersion]);

  const restoreSnapshot = useCallback(
    async (entry: HistoryEntry, index: number) => {
      if (!fabricCanvas) return;
      isRestoringRef.current = true;

      await new Promise<void>((resolve) => {
        fabricCanvas.loadFromJSON(entry.json, () => {
          fabricCanvas.requestRenderAll();
          resolve();
        });
      });

      lastJsonRef.current = entry.json;
      setCurrentIndex(index);
      isRestoringRef.current = false;
    },
    [fabricCanvas]
  );

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  if (!fabricCanvas) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground px-4 text-center gap-2">
        <Clock className="w-6 h-6 opacity-20" />
        <p className="text-xs">Selecione um template para ativar o histórico</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-2 px-2 pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Histórico
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">{entries.length}/{MAX_HISTORY}</span>
      </div>

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          As alterações aparecerão aqui automaticamente
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {[...entries].reverse().map((entry, reversedIdx) => {
          const idx = entries.length - 1 - reversedIdx;
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={entry.timestamp}
              className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors ${
                isCurrent
                  ? "bg-primary/15 border border-primary/30"
                  : "hover:bg-accent/50 border border-transparent"
              }`}
              onClick={() => restoreSnapshot(entry, idx)}
            >
              {/* Thumbnail */}
              <div className="w-16 h-9 rounded overflow-hidden bg-zinc-800 flex-shrink-0 border border-border/50">
                {entry.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.thumbnail}
                    alt={`Estado ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className={`text-[10px] font-medium truncate ${isCurrent ? "text-primary" : "text-foreground/80"}`}>
                  Estado {idx + 1}
                  {isCurrent && " ·  atual"}
                </span>
                <span className="text-[9px] text-muted-foreground">{formatTime(entry.timestamp)}</span>
              </div>

              {/* Restore button */}
              {!isCurrent && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 opacity-60 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); restoreSnapshot(entry, idx); }}
                  title="Restaurar este estado"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
