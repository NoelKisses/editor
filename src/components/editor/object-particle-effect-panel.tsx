"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Play, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ObjectParticleEffectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type ParticleStyle = "confetti" | "stars" | "dots" | "sparks" | "snowflakes";

interface ParticleConfig {
  style: ParticleStyle;
  count: number;
  spread: number;
  size: number;
  colors: string[];
  duration: number;
  gravity: number;
  spin: boolean;
}

const DEFAULT_CONFIG: ParticleConfig = {
  style: "confetti",
  count: 60,
  spread: 120,
  size: 8,
  colors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff"],
  duration: 3000,
  gravity: 0.3,
  spin: true,
};

const STYLE_OPTIONS: { value: ParticleStyle; label: string; char: string }[] = [
  { value: "confetti", label: "Confetti", char: "▬" },
  { value: "stars", label: "Estrelas", char: "★" },
  { value: "dots", label: "Pontos", char: "●" },
  { value: "sparks", label: "Faíscas", char: "✦" },
  { value: "snowflakes", label: "Neve", char: "❄" },
];

const PALETTE_PRESETS: { label: string; colors: string[] }[] = [
  { label: "Arco-Íris", colors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff"] },
  { label: "Ouro", colors: ["#ffd700", "#ffb300", "#fff3b0", "#c8a400", "#ffe566"] },
  { label: "Neon", colors: ["#00ffff", "#ff00ff", "#00ff44", "#ff6600", "#ffffff"] },
  { label: "Pastel", colors: ["#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff"] },
  { label: "Escuro", colors: ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#533483"] },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  color: string;
  size: number;
  life: number;
}

function createParticles(
  originX: number,
  originY: number,
  config: ParticleConfig
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < config.count; i++) {
    const angle = (Math.random() * 360 * Math.PI) / 180;
    const speed = 1 + Math.random() * (config.spread / 30);
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 8,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      size: config.size * (0.6 + Math.random() * 0.8),
      life: 1,
    });
  }
  return particles;
}

function getParticleChar(style: ParticleStyle): string {
  const map: Record<ParticleStyle, string> = {
    confetti: "▬", stars: "★", dots: "●", sparks: "✦", snowflakes: "❄",
  };
  return map[style];
}

export function ObjectParticleEffectPanel({ fabricCanvas, selectionVersion }: ObjectParticleEffectPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [config, setConfig] = useState<ParticleConfig>(DEFAULT_CONFIG);
  const [running, setRunning] = useState(false);
  const animRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const particleObjectsRef = useRef<any[]>([]);
  const canvasRef = useRef<unknown>(null);
  const configRef = useRef(config);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj && obj.type !== "activeSelection");
    });
  }, [fabricCanvas, selectionVersion]);

  const set = useCallback(<K extends keyof ParticleConfig>(key: K, val: ParticleConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }, []);

  const clearParticles = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    particleObjectsRef.current.forEach((o) => cv.remove(o));
    particleObjectsRef.current = [];
    cv.requestRenderAll();
  }, []);

  const stopEffect = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setRunning(false);
    clearParticles();
  }, [clearParticles]);

  const startEffect = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    stopEffect();
    setRunning(true);

    const originX = (obj.left ?? 0) + (obj.getScaledWidth?.() ?? 0) / 2;
    const originY = (obj.top ?? 0) + (obj.getScaledHeight?.() ?? 0) / 2;
    const cfg = configRef.current;
    const particles = createParticles(originX, originY, cfg);
    const start = performance.now();

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const char = getParticleChar(cfg.style);

      const fabricParticles = particles.map((p) => {
        const txt = new f.IText(char, {
          left: p.x,
          top: p.y,
          fontSize: p.size,
          fill: p.color,
          selectable: false,
          evented: false,
          data: { particle: true },
        });
        cv.add(txt);
        return { fab: txt, data: p };
      });

      particleObjectsRef.current = fabricParticles.map((fp) => fp.fab);

      const animate = (now: number) => {
        const elapsed = now - start;
        if (elapsed > cfg.duration) {
          stopEffect();
          return;
        }

        fabricParticles.forEach(({ fab, data }) => {
          data.vy += cfg.gravity;
          data.x += data.vx;
          data.y += data.vy;
          data.life = 1 - elapsed / cfg.duration;
          if (cfg.spin) data.angle += data.spin;

          fab.set({
            left: data.x,
            top: data.y,
            angle: data.angle,
            opacity: data.life,
          });
        });

        cv.requestRenderAll();
        animRef.current = requestAnimationFrame(animate);
      };

      animRef.current = requestAnimationFrame(animate);
    });

    toast.success(`Efeito de partículas iniciado (${cfg.duration / 1000}s)`);
  }, [stopEffect]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      clearParticles();
    };
  }, [clearParticles]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Efeito de Partículas</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto no canvas</p>
        </div>
      ) : (
        <>
          {/* Style */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Tipo de partícula</span>
            <div className="grid grid-cols-5 gap-1">
              {STYLE_OPTIONS.map((s) => (
                <button key={s.value} onClick={() => set("style", s.value)}
                  className={`flex flex-col items-center gap-0.5 py-1.5 rounded border text-[7px] transition-colors ${
                    config.style === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}>
                  <span className="text-[12px]">{s.char}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Palette presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Paleta de cores</span>
            <div className="grid grid-cols-3 gap-1">
              {PALETTE_PRESETS.map((p) => (
                <button key={p.label} onClick={() => set("colors", p.colors)}
                  className="flex items-center gap-1 py-1 px-1.5 rounded border border-border text-[7px] text-muted-foreground hover:border-primary/30 transition-colors">
                  <div className="flex gap-0.5">
                    {p.colors.slice(0, 3).map((c, i) => (
                      <div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-16">Quantidade</span>
              <input type="range" min={10} max={200} value={config.count}
                onChange={(e) => set("count", Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
              <span className="text-[7px] font-mono w-6">{config.count}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-16">Dispersão</span>
              <input type="range" min={20} max={300} value={config.spread}
                onChange={(e) => set("spread", Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
              <span className="text-[7px] font-mono w-6">{config.spread}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-16">Tamanho</span>
              <input type="range" min={4} max={30} value={config.size}
                onChange={(e) => set("size", Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
              <span className="text-[7px] font-mono w-6">{config.size}px</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-16">Duração</span>
              <input type="range" min={500} max={8000} step={500} value={config.duration}
                onChange={(e) => set("duration", Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
              <span className="text-[7px] font-mono w-8">{config.duration / 1000}s</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-16">Gravidade</span>
              <input type="range" min={0} max={1} step={0.05} value={config.gravity}
                onChange={(e) => set("gravity", Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
              <span className="text-[7px] font-mono w-6">{config.gravity}</span>
            </div>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={config.spin}
              onChange={(e) => set("spin", e.target.checked)}
              className="w-3 h-3 accent-primary" />
            <span className="text-[8px] text-muted-foreground">Rotação nas partículas</span>
          </label>

          <div className="flex gap-1.5">
            {running ? (
              <button onClick={stopEffect}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-yellow-500/50 text-yellow-500 text-[9px] hover:bg-yellow-500/10 transition-colors">
                <Square className="w-3 h-3" /> Parar
              </button>
            ) : (
              <button onClick={startEffect}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
                <Play className="w-3 h-3" /> Disparar efeito
              </button>
            )}
            <button onClick={clearParticles}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Partículas usam requestAnimationFrame · surgem no centro do objeto
          </p>
        </>
      )}
    </div>
  );
}
