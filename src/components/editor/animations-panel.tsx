"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Zap } from "lucide-react";
import { toast } from "sonner";

interface AnimationsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type AnimationType = "none" | "fadeIn" | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "zoomIn" | "zoomOut" | "bounceIn" | "rotateIn" | "flipX" | "flipY";

const ANIMATIONS: { value: AnimationType; label: string; icon: string; description: string }[] = [
  { value: "none", label: "Nenhuma", icon: "○", description: "Sem animação" },
  { value: "fadeIn", label: "Fade In", icon: "◐", description: "Aparece gradualmente" },
  { value: "slideLeft", label: "Slide Esq.", icon: "←", description: "Desliza da esquerda" },
  { value: "slideRight", label: "Slide Dir.", icon: "→", description: "Desliza da direita" },
  { value: "slideUp", label: "Slide Cima", icon: "↑", description: "Desliza de baixo" },
  { value: "slideDown", label: "Slide Baixo", icon: "↓", description: "Desliza de cima" },
  { value: "zoomIn", label: "Zoom In", icon: "⊕", description: "Cresce até o tamanho" },
  { value: "zoomOut", label: "Zoom Out", icon: "⊖", description: "Encolhe até o lugar" },
  { value: "bounceIn", label: "Bounce", icon: "⬤", description: "Salta ao aparecer" },
  { value: "rotateIn", label: "Rotacionar", icon: "↺", description: "Gira ao aparecer" },
  { value: "flipX", label: "Flip H", icon: "⇄", description: "Vira horizontalmente" },
  { value: "flipY", label: "Flip V", icon: "⇅", description: "Vira verticalmente" },
];

const DURATIONS = [0.3, 0.5, 0.8, 1.0, 1.5, 2.0];
const EASINGS = [
  { value: "linear", label: "Linear" },
  { value: "easeIn", label: "Ease In" },
  { value: "easeOut", label: "Ease Out" },
  { value: "easeInOut", label: "Ease In Out" },
  { value: "easeInBack", label: "Bounce In" },
  { value: "easeOutElastic", label: "Elástico" },
];

export function AnimationsPanel({ fabricCanvas, selectionVersion }: AnimationsPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [animation, setAnimation] = useState<AnimationType>("none");
  const [duration, setDuration] = useState(0.5);
  const [easing, setEasing] = useState("easeOut");
  const [delay, setDelay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion;

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setActive(null); return; }
      setActive(obj);
      const animData = obj.data?.animation;
      if (animData) {
        setAnimation(animData.type ?? "none");
        setDuration(animData.duration ?? 0.5);
        setEasing(animData.easing ?? "easeOut");
        setDelay(animData.delay ?? 0);
      } else {
        setAnimation("none");
        setDuration(0.5);
        setEasing("easeOut");
        setDelay(0);
      }
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const saveAnimation = useCallback((type: AnimationType, dur: number, eas: string, del: number) => {
    if (!active || !fabricCanvas) return;
    active.set({
      data: {
        ...(active.data ?? {}),
        animation: type === "none" ? null : { type, duration: dur, easing: eas, delay: del },
      },
    });
    fabricCanvas.requestRenderAll();
  }, [active, fabricCanvas]);

  const previewAnimation = useCallback(async () => {
    if (!active || !fabricCanvas || animation === "none" || isPlaying) return;
    setIsPlaying(true);

    const origLeft = active.left;
    const origTop = active.top;
    const origOpacity = active.opacity ?? 1;
    const origScaleX = active.scaleX ?? 1;
    const origScaleY = active.scaleY ?? 1;
    const origAngle = active.angle ?? 0;
    const ms = duration * 1000;

    const restore = () => {
      active.set({
        left: origLeft, top: origTop,
        opacity: origOpacity, scaleX: origScaleX, scaleY: origScaleY,
        angle: origAngle, flipX: active.flipX, flipY: active.flipY,
      });
      active.setCoords?.();
      fabricCanvas.requestRenderAll();
      setIsPlaying(false);
    };

    const { fabric } = await import("fabric").then((m) => m);

    const animateProp = (props: Record<string, number>, fromProps: Record<string, number>) => {
      active.set(fromProps);
      fabricCanvas.requestRenderAll();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fabric as any).util.animate({
        startValue: 0,
        endValue: 1,
        duration: ms,
        onChange: (v: number) => {
          const interpolated: Record<string, number> = {};
          for (const key of Object.keys(props)) {
            const from = fromProps[key] ?? (active[key] as number);
            const to = props[key];
            interpolated[key] = from + (to - from) * v;
          }
          active.set(interpolated);
          active.setCoords?.();
          fabricCanvas.requestRenderAll();
        },
        onComplete: restore,
      });
    };

    const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();

    switch (animation) {
      case "fadeIn":
        animateProp({ opacity: origOpacity }, { opacity: 0 });
        break;
      case "slideLeft":
        animateProp({ left: origLeft }, { left: -200 });
        break;
      case "slideRight":
        animateProp({ left: origLeft }, { left: cw + 200 });
        break;
      case "slideUp":
        animateProp({ top: origTop }, { top: ch + 200 });
        break;
      case "slideDown":
        animateProp({ top: origTop }, { top: -200 });
        break;
      case "zoomIn":
        animateProp({ scaleX: origScaleX, scaleY: origScaleY }, { scaleX: 0.01, scaleY: 0.01 });
        break;
      case "zoomOut":
        animateProp({ scaleX: origScaleX, scaleY: origScaleY }, { scaleX: 3, scaleY: 3 });
        break;
      case "bounceIn":
        animateProp({ scaleX: origScaleX, scaleY: origScaleY, opacity: origOpacity }, { scaleX: 0.01, scaleY: 0.01, opacity: 0 });
        break;
      case "rotateIn":
        animateProp({ angle: origAngle, opacity: origOpacity }, { angle: origAngle - 180, opacity: 0 });
        break;
      case "flipX":
        animateProp({ scaleX: origScaleX }, { scaleX: 0.01 });
        break;
      case "flipY":
        animateProp({ scaleY: origScaleY }, { scaleY: 0.01 });
        break;
      default:
        restore();
    }

    setTimeout(restore, ms + 200);
  }, [active, fabricCanvas, animation, duration, isPlaying]);

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground px-3">
        <Zap className="w-6 h-6 opacity-30" />
        <p className="text-[11px] text-center">Selecione um elemento para adicionar animação</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Animações</span>
        {animation !== "none" && (
          <button
            onClick={previewAnimation}
            disabled={isPlaying}
            className={`ml-auto flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${isPlaying ? "opacity-50 cursor-not-allowed" : "border-primary/40 text-primary hover:bg-primary/10"}`}
          >
            <Play className="w-3 h-3" />
            {isPlaying ? "Reproduzindo..." : "Prévia"}
          </button>
        )}
      </div>

      {/* Animation grid */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo de Animação</span>
        <div className="grid grid-cols-3 gap-1.5">
          {ANIMATIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => {
                setAnimation(a.value);
                saveAnimation(a.value, duration, easing, delay);
                if (a.value !== "none") toast.success(`Animação "${a.label}" configurada`);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded border transition-all ${animation === a.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent/20"}`}
              title={a.description}
            >
              <span className="text-base leading-none">{a.icon}</span>
              <span className="text-[8px] leading-tight text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {animation !== "none" && (
        <>
          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Duração</span>
              <span className="text-[10px] tabular-nums">{duration}s</span>
            </div>
            <div className="flex gap-1">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDuration(d); saveAnimation(animation, d, easing, delay); }}
                  className={`flex-1 text-[9px] py-1 rounded border transition-colors ${duration === d ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Easing */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Curva de Animação</span>
            <select
              value={easing}
              onChange={(e) => { setEasing(e.target.value); saveAnimation(animation, duration, e.target.value, delay); }}
              className="text-[11px] bg-background border border-border rounded px-2 py-1.5 text-foreground outline-none focus:border-primary/50"
            >
              {EASINGS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Delay */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Atraso</span>
              <span className="text-[10px] tabular-nums">{delay}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={delay}
              onChange={(e) => { const v = Number(e.target.value); setDelay(v); saveAnimation(animation, duration, easing, v); }}
              className="w-full accent-primary"
            />
            <div className="flex gap-1">
              {[0, 0.5, 1, 1.5, 2].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDelay(d); saveAnimation(animation, duration, easing, d); }}
                  className={`flex-1 text-[9px] py-0.5 rounded border transition-colors ${delay === d ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border">
            <p className="text-[9px] text-muted-foreground">
              As animações são aplicadas durante o <strong className="text-foreground/70">Modo Apresentação</strong>. Use o botão &quot;Apresentar&quot; no topo para visualizar.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
