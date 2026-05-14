"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Timer, Play, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasTimerPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type TimerMode = "stopwatch" | "countdown";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CanvasTimerPanel({ fabricCanvas }: CanvasTimerPanelProps) {
  const [mode, setMode] = useState<TimerMode>("stopwatch");
  const [elapsed, setElapsed] = useState(0);
  const [countdownFrom, setCountdownFrom] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [showOnCanvas, setShowOnCanvas] = useState(false);
  const [timerColor, setTimerColor] = useState("#ffffff");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textObjRef = useRef<any>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateCanvasText = useCallback((seconds: number) => {
    if (!fabricCanvas || !showOnCanvas) return;

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      if (textObjRef.current) {
        textObjRef.current.set({ text: formatTime(seconds), fill: timerColor });
        fabricCanvas.requestRenderAll();
      } else {
        const text = new f.Text(formatTime(seconds), {
          left: 20,
          top: 20,
          fontSize: 32,
          fill: timerColor,
          fontFamily: "monospace",
          fontWeight: "bold",
          selectable: true,
          data: { __timer__: true },
        });
        textObjRef.current = text;
        fabricCanvas.add(text);
        fabricCanvas.requestRenderAll();
      }
    });
  }, [fabricCanvas, showOnCanvas, timerColor]);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = mode === "stopwatch" ? prev + 1 : prev - 1;

        if (mode === "countdown" && next <= 0) {
          clearTimer();
          setIsRunning(false);
          toast.success("Tempo esgotado!");
          return 0;
        }

        return next;
      });
    }, 1000);

    toast.success(mode === "stopwatch" ? "Cronômetro iniciado" : "Contagem regressiva iniciada");
  }, [isRunning, mode, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setElapsed(mode === "countdown" ? countdownFrom : 0);

    if (textObjRef.current && fabricCanvas) {
      textObjRef.current.set({ text: formatTime(mode === "countdown" ? countdownFrom : 0) });
      fabricCanvas.requestRenderAll();
    }
  }, [clearTimer, mode, countdownFrom, fabricCanvas]);

  useEffect(() => {
    updateCanvasText(elapsed);
  }, [elapsed, updateCanvasText]);

  useEffect(() => {
    queueMicrotask(() => {
      if (mode === "countdown") setElapsed(countdownFrom);
      else setElapsed(0);
    });
  }, [mode, countdownFrom]);

  const removeFromCanvas = useCallback(() => {
    if (!fabricCanvas || !textObjRef.current) return;
    fabricCanvas.remove(textObjRef.current);
    fabricCanvas.requestRenderAll();
    textObjRef.current = null;
    setShowOnCanvas(false);
    toast.success("Timer removido do canvas");
  }, [fabricCanvas]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const display = mode === "countdown" ? elapsed : elapsed;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Timer / Cronômetro</span>
      </div>

      {/* Mode */}
      <div className="grid grid-cols-2 gap-1">
        {(["stopwatch", "countdown"] as TimerMode[]).map(m => (
          <button key={m} onClick={() => { if (!isRunning) setMode(m); }}
            className={`py-1.5 rounded border text-[9px] transition-colors ${mode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
            {m === "stopwatch" ? "Cronômetro" : "Regressiva"}
          </button>
        ))}
      </div>

      {/* Display */}
      <div className="flex items-center justify-center py-4 bg-muted/30 rounded border border-border">
        <span className="font-mono text-3xl font-bold tabular-nums">{formatTime(display)}</span>
      </div>

      {/* Countdown from */}
      {mode === "countdown" && !isRunning && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-muted-foreground">Duração (segundos)</span>
          <input type="number" min={5} max={3600} value={countdownFrom}
            onChange={e => { setCountdownFrom(Number(e.target.value)); setElapsed(Number(e.target.value)); }}
            className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-3 gap-1">
        <button onClick={reset}
          className="flex items-center justify-center gap-0.5 py-2 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <button onClick={isRunning ? stop : start}
          className={`flex items-center justify-center gap-0.5 py-2 rounded border text-[8px] font-medium col-span-2 transition-colors ${isRunning ? "border-destructive text-destructive hover:bg-destructive/10" : "border-primary text-primary hover:bg-primary/10"}`}>
          {isRunning ? <><Square className="w-3 h-3" /> Parar</> : <><Play className="w-3 h-3" /> Iniciar</>}
        </button>
      </div>

      {/* Canvas options */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">No Canvas</span>

        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground">Cor do texto</span>
          <input type="color" value={timerColor} onChange={e => setTimerColor(e.target.value)}
            className="w-7 h-6 rounded border border-border cursor-pointer" />
        </div>

        <div className="grid grid-cols-2 gap-1">
          <button onClick={() => setShowOnCanvas(true)}
            className={`py-1.5 rounded border text-[8px] transition-colors ${showOnCanvas ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
            Mostrar no canvas
          </button>
          <button onClick={removeFromCanvas}
            className="py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors">
            Remover
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="flex items-center justify-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[8px] text-primary">{mode === "stopwatch" ? "Cronômetro rodando" : "Contagem em andamento"}</span>
        </div>
      )}
    </div>
  );
}
