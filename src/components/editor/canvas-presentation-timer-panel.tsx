"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sunrise, Play, Square, RotateCcw, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface CanvasPresentationTimerPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface SlideTimer {
  id: string;
  label: string;
  duration: number;
  elapsed: number;
  status: "pending" | "running" | "done";
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function CanvasPresentationTimerPanel({ fabricCanvas }: CanvasPresentationTimerPanelProps) {
  const [slides, setSlides] = useState<SlideTimer[]>([
    { id: "s1", label: "Slide 1", duration: 60, elapsed: 0, status: "pending" },
    { id: "s2", label: "Slide 2", duration: 60, elapsed: 0, status: "pending" },
    { id: "s3", label: "Slide 3", duration: 60, elapsed: 0, status: "pending" },
  ]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [newLabel, setNewLabel] = useState("");
  const [newDuration, setNewDuration] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const start = useCallback(() => {
    if (isRunning || currentIdx >= slides.length) return;
    setIsRunning(true);
    setSlides(prev => prev.map((s, i) => i === currentIdx ? { ...s, status: "running" } : s));

    intervalRef.current = setInterval(() => {
      setTotalElapsed(t => t + 1);
      setSlides(prev => {
        const next = [...prev];
        const cur = next[currentIdx];
        if (!cur) return prev;
        cur.elapsed += 1;
        if (cur.elapsed >= cur.duration) {
          cur.status = "done";
          cur.elapsed = cur.duration;
        }
        return next;
      });
    }, 1000);
  }, [isRunning, currentIdx, slides.length]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const nextSlide = useCallback(() => {
    if (currentIdx >= slides.length - 1) {
      stop();
      toast.success("Apresentação concluída!");
      return;
    }
    setSlides(prev => prev.map((s, i) => {
      if (i === currentIdx) return { ...s, status: "done" };
      if (i === currentIdx + 1) return { ...s, status: isRunning ? "running" : "pending" };
      return s;
    }));
    setCurrentIdx(prev => prev + 1);
    toast.success(`Avançando para slide ${currentIdx + 2}`);
  }, [currentIdx, slides.length, stop, isRunning]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setCurrentIdx(0);
    setTotalElapsed(0);
    setSlides(prev => prev.map(s => ({ ...s, elapsed: 0, status: "pending" })));
  }, [clearTimer]);

  const addSlide = useCallback(() => {
    const label = newLabel.trim() || `Slide ${slides.length + 1}`;
    setSlides(prev => [...prev, { id: `s${Date.now()}`, label, duration: newDuration, elapsed: 0, status: "pending" }]);
    setNewLabel("");
    toast.success(`"${label}" adicionado`);
  }, [newLabel, newDuration, slides.length]);

  const removeSlide = useCallback((id: string) => {
    setSlides(prev => prev.filter(s => s.id !== id));
  }, []);

  const showOnCanvas = useCallback(() => {
    if (!fabricCanvas) return;

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const cur = slides[currentIdx];
      if (!cur) return;

      // Remove old timer text
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const old = fabricCanvas.getObjects().filter((o: any) => o.data?.__presTimer__);
      old.forEach((o: unknown) => fabricCanvas.remove(o));

      const remaining = Math.max(0, cur.duration - cur.elapsed);
      const text = new f.Text(`${cur.label}  ${formatTime(remaining)}`, {
        left: 10,
        top: 10,
        fontSize: 20,
        fill: remaining < 10 ? "#ef4444" : "#22c55e",
        fontFamily: "monospace",
        fontWeight: "bold",
        selectable: true,
        data: { __presTimer__: true },
      });
      fabricCanvas.add(text);
      fabricCanvas.requestRenderAll();
    });
  }, [fabricCanvas, slides, currentIdx]);

  // Auto-advance when current slide time expires
  useEffect(() => {
    if (!isRunning) return;
    const cur = slides[currentIdx];
    if (cur && cur.elapsed >= cur.duration) {
      queueMicrotask(() => {
        if (currentIdx < slides.length - 1) {
          nextSlide();
        } else {
          stop();
          toast.success("Apresentação concluída!");
        }
      });
    }
  }, [slides, currentIdx, isRunning, nextSlide, stop]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const totalDuration = slides.reduce((acc, s) => acc + s.duration, 0);
  const cur = slides[currentIdx];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Sunrise className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Timer de Apresentação</span>
      </div>

      {/* Current slide */}
      <div className="p-3 rounded border border-primary/30 bg-primary/5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-medium text-primary">{cur?.label ?? "—"}</span>
          <span className="text-[8px] text-muted-foreground">{currentIdx + 1}/{slides.length}</span>
        </div>
        <div className="text-2xl font-mono font-bold text-center tabular-nums">
          {cur ? formatTime(Math.max(0, cur.duration - cur.elapsed)) : "00:00"}
        </div>
        {cur && (
          <div className="mt-1 h-1 bg-border rounded overflow-hidden">
            <div className="h-full bg-primary rounded transition-all"
              style={{ width: `${Math.min(100, (cur.elapsed / cur.duration) * 100)}%` }} />
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[8px] text-muted-foreground">Total: {formatTime(totalElapsed)} / {formatTime(totalDuration)}</span>
        <button onClick={showOnCanvas}
          className="text-[7px] text-primary hover:underline">Mostrar no canvas</button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-1">
        <button onClick={reset}
          className="flex items-center justify-center gap-0.5 py-2 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>
        <button onClick={isRunning ? stop : start}
          className={`flex items-center justify-center gap-0.5 py-2 rounded border text-[8px] font-medium transition-colors ${isRunning ? "border-destructive text-destructive hover:bg-destructive/10" : "border-primary text-primary hover:bg-primary/10"}`}>
          {isRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button onClick={nextSlide}
          className="flex items-center justify-center gap-0.5 py-2 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Slide list */}
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {slides.map((s, i) => (
          <div key={s.id}
            className={`flex items-center gap-2 px-2 py-1 rounded border text-[8px] transition-colors ${i === currentIdx ? "border-primary bg-primary/5" : "border-border"}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.status === "done" ? "bg-green-500" : s.status === "running" ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
            <span className="flex-1 truncate">{s.label}</span>
            <span className="tabular-nums text-muted-foreground">{formatTime(s.duration)}</span>
            <button onClick={() => removeSlide(s.id)} className="text-muted-foreground/50 hover:text-destructive">×</button>
          </div>
        ))}
      </div>

      {/* Add slide */}
      <div className="flex flex-col gap-1 p-2 rounded border border-border bg-muted/10">
        <span className="text-[9px] text-muted-foreground">Adicionar slide</span>
        <div className="grid grid-cols-2 gap-1">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="Nome do slide"
            className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
          <input type="number" min={5} max={600} value={newDuration} onChange={e => setNewDuration(Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
        </div>
        <button onClick={addSlide}
          className="py-1 rounded border border-primary text-primary text-[8px] hover:bg-primary/10 transition-colors">
          + Adicionar
        </button>
      </div>
    </div>
  );
}
