"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Timer, Play, Square, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasCountdownTimerPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface TimerConfig {
  hours: number;
  minutes: number;
  seconds: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  format: "hms" | "ms" | "s" | "custom";
  customFormat: string;
  posX: number;
  posY: number;
  showLabel: boolean;
  label: string;
  countUp: boolean;
}

const DEFAULT_CONFIG: TimerConfig = {
  hours: 0,
  minutes: 5,
  seconds: 0,
  fontSize: 48,
  color: "#ffffff",
  fontFamily: "Arial",
  format: "ms",
  customFormat: "",
  posX: 100,
  posY: 60,
  showLabel: false,
  label: "Tempo restante:",
  countUp: false,
};

const FONT_OPTIONS = ["Arial", "Impact", "Georgia", "Courier New", "Verdana", "Trebuchet MS"];

function formatTime(totalSecs: number, fmt: TimerConfig["format"], custom: string): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (fmt === "hms") return `${pad(h)}:${pad(m)}:${pad(s)}`;
  if (fmt === "ms") return `${pad(m)}:${pad(s)}`;
  if (fmt === "s") return `${totalSecs}s`;
  if (fmt === "custom" && custom) {
    return custom
      .replace("{h}", pad(h))
      .replace("{m}", pad(m))
      .replace("{s}", pad(s))
      .replace("{total}", String(totalSecs));
  }
  return `${pad(m)}:${pad(s)}`;
}

export function CanvasCountdownTimerPanel({ fabricCanvas }: CanvasCountdownTimerPanelProps) {
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timerTextRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labelTextRef = useRef<any>(null);
  const canvasRef = useRef<unknown>(null);
  const configRef = useRef(config);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const totalInitial = config.hours * 3600 + config.minutes * 60 + config.seconds;

  const set = useCallback(<K extends keyof TimerConfig>(key: K, val: TimerConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }, []);

  const insertTimerText = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const cfg = configRef.current;
      const total = cfg.hours * 3600 + cfg.minutes * 60 + cfg.seconds;
      const displaySecs = cfg.countUp ? 0 : total;

      if (timerTextRef.current) {
        cv.remove(timerTextRef.current);
      }
      if (labelTextRef.current) {
        cv.remove(labelTextRef.current);
      }

      if (cfg.showLabel) {
        const lbl = new f.IText(cfg.label, {
          left: cfg.posX,
          top: cfg.posY,
          fontSize: Math.round(cfg.fontSize * 0.4),
          fontFamily: cfg.fontFamily,
          fill: cfg.color,
          data: { timerLabel: true },
        });
        cv.add(lbl);
        labelTextRef.current = lbl;
      }

      const txt = new f.IText(formatTime(displaySecs, cfg.format, cfg.customFormat), {
        left: cfg.posX,
        top: cfg.posY + (cfg.showLabel ? Math.round(cfg.fontSize * 0.5) : 0),
        fontSize: cfg.fontSize,
        fontFamily: cfg.fontFamily,
        fill: cfg.color,
        fontWeight: "bold",
        data: { timerText: true },
      });
      cv.add(txt);
      timerTextRef.current = txt;
      cv.requestRenderAll();
      toast.success("Texto do timer inserido no canvas");
    });
  }, []);

  const startTimer = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }
    if (!timerTextRef.current) {
      toast.error("Insira o timer no canvas primeiro");
      return;
    }

    setRunning(true);
    setElapsed(0);

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        const cfg = configRef.current;
        const total = cfg.hours * 3600 + cfg.minutes * 60 + cfg.seconds;
        const displaySecs = cfg.countUp ? next : Math.max(0, total - next);
        const timeStr = formatTime(displaySecs, cfg.format, cfg.customFormat);

        if (timerTextRef.current) {
          timerTextRef.current.set({ text: timeStr });
          cv.requestRenderAll();
        }

        if (!cfg.countUp && displaySecs <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          toast.success("Timer finalizado!");
          return next;
        }

        return next;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    toast.success("Timer pausado");
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setElapsed(0);
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv || !timerTextRef.current) return;
    const cfg = configRef.current;
    const total = cfg.hours * 3600 + cfg.minutes * 60 + cfg.seconds;
    const displaySecs = cfg.countUp ? 0 : total;
    timerTextRef.current.set({ text: formatTime(displaySecs, cfg.format, cfg.customFormat) });
    cv.requestRenderAll();
    toast.success("Timer resetado");
  }, [stopTimer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const displayPreview = formatTime(
    config.countUp ? elapsed : Math.max(0, totalInitial - elapsed),
    config.format,
    config.customFormat
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Timer Countdown</span>
      </div>

      {/* Live display */}
      <div className="flex items-center justify-center p-3 rounded border border-border bg-black">
        <span
          className="font-bold select-none tabular-nums"
          style={{ color: config.color, fontFamily: config.fontFamily, fontSize: Math.min(config.fontSize, 32) }}
        >
          {displayPreview}
        </span>
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Duração</span>
        <div className="grid grid-cols-3 gap-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] text-muted-foreground">Horas</span>
            <input type="number" min={0} max={23} value={config.hours}
              onChange={(e) => set("hours", Number(e.target.value))}
              className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] text-muted-foreground">Min</span>
            <input type="number" min={0} max={59} value={config.minutes}
              onChange={(e) => set("minutes", Number(e.target.value))}
              className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] text-muted-foreground">Seg</span>
            <input type="number" min={0} max={59} value={config.seconds}
              onChange={(e) => set("seconds", Number(e.target.value))}
              className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      {/* Format */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Formato</span>
        <div className="grid grid-cols-4 gap-1">
          {(["hms", "ms", "s", "custom"] as TimerConfig["format"][]).map((f) => (
            <button key={f} onClick={() => set("format", f)}
              className={`py-0.5 rounded border text-[7px] uppercase transition-colors ${
                config.format === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}>
              {f}
            </button>
          ))}
        </div>
        {config.format === "custom" && (
          <input type="text" value={config.customFormat} placeholder="{m}:{s} restantes"
            onChange={(e) => set("customFormat", e.target.value)}
            className="bg-muted/50 border border-border rounded px-2 py-0.5 text-[8px] focus:outline-none focus:border-primary mt-1" />
        )}
      </div>

      {/* Mode */}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" checked={config.countUp}
          onChange={(e) => set("countUp", e.target.checked)}
          className="w-3 h-3 accent-primary" />
        <span className="text-[8px] text-muted-foreground">Modo progressivo (count up)</span>
      </label>

      {/* Style */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Fonte</span>
          <select value={config.fontFamily} onChange={(e) => set("fontFamily", e.target.value)}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary">
            {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Cor</span>
          <div className="flex items-center gap-1">
            <input type="color" value={config.color} onChange={(e) => set("color", e.target.value)}
              className="w-6 h-5 rounded border border-border cursor-pointer" />
            <span className="text-[7px] font-mono text-muted-foreground">{config.color}</span>
          </div>
        </div>
      </div>

      {/* Size + position */}
      <div className="grid grid-cols-3 gap-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Tamanho</span>
          <input type="number" min={12} max={200} value={config.fontSize}
            onChange={(e) => set("fontSize", Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Pos X</span>
          <input type="number" min={0} max={2000} value={config.posX}
            onChange={(e) => set("posX", Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Pos Y</span>
          <input type="number" min={0} max={2000} value={config.posY}
            onChange={(e) => set("posY", Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Label */}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" checked={config.showLabel}
          onChange={(e) => set("showLabel", e.target.checked)}
          className="w-3 h-3 accent-primary" />
        <span className="text-[8px] text-muted-foreground">Mostrar label</span>
      </label>
      {config.showLabel && (
        <input type="text" value={config.label}
          onChange={(e) => set("label", e.target.value)}
          className="bg-muted/50 border border-border rounded px-2 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
      )}

      {/* Actions */}
      <button onClick={insertTimerText}
        className="flex items-center justify-center gap-1 py-1.5 rounded border border-primary text-primary text-[8px] hover:bg-primary/10 transition-colors">
        <Plus className="w-3 h-3" /> Inserir no canvas
      </button>

      <div className="flex gap-1.5">
        {running ? (
          <button onClick={stopTimer}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-yellow-500/50 text-yellow-500 text-[9px] hover:bg-yellow-500/10 transition-colors">
            <Square className="w-3 h-3" /> Pausar
          </button>
        ) : (
          <button onClick={startTimer}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-green-500/50 text-green-500 text-[9px] hover:bg-green-500/10 transition-colors">
            <Play className="w-3 h-3" /> Iniciar
          </button>
        )}
        <button onClick={resetTimer}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Timer atualiza o texto no canvas a cada segundo em tempo real
      </p>
    </div>
  );
}
