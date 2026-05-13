"use client";

import { useCallback, useEffect, useState } from "react";
import { Clapperboard, Plus, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

interface ObjectPositionAnimationPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface Keyframe {
  id: string;
  frame: number;
  x: number;
  y: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

const EASING_OPTIONS = ["linear", "easeIn", "easeOut", "easeInOut"] as const;
type Easing = typeof EASING_OPTIONS[number];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function applyEasing(t: number, easing: Easing): number {
  switch (easing) {
    case "easeIn": return t * t;
    case "easeOut": return t * (2 - t);
    case "easeInOut": return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    default: return t;
  }
}

export function ObjectPositionAnimationPanel({ fabricCanvas, selectionVersion }: ObjectPositionAnimationPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [totalFrames, setTotalFrames] = useState(30);
  const [fps, setFps] = useState(12);
  const [easing, setEasing] = useState<Easing>("linear");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj && obj.type !== "activeSelection");
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && obj.type !== "activeSelection" ? obj : null;
  }, [fabricCanvas]);

  const captureKeyframe = useCallback((frame: number) => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    const kf: Keyframe = {
      id: `kf-${Date.now()}`,
      frame,
      x: Math.round(obj.left ?? 0),
      y: Math.round(obj.top ?? 0),
      angle: Math.round(obj.angle ?? 0),
      scaleX: parseFloat((obj.scaleX ?? 1).toFixed(2)),
      scaleY: parseFloat((obj.scaleY ?? 1).toFixed(2)),
      opacity: parseFloat((obj.opacity ?? 1).toFixed(2)),
    };

    setKeyframes(prev => {
      const filtered = prev.filter(k => k.frame !== frame);
      return [...filtered, kf].sort((a, b) => a.frame - b.frame);
    });
    toast.success(`Keyframe no frame ${frame} capturado`);
  }, [getObject]);

  const removeKeyframe = useCallback((id: string) => {
    setKeyframes(prev => prev.filter(k => k.id !== id));
    toast.success("Keyframe removido");
  }, []);

  const goToFrame = useCallback((frame: number) => {
    const obj = getObject();
    if (!obj || keyframes.length < 2) return;

    const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
    const before = sorted.filter(k => k.frame <= frame).pop();
    const after = sorted.find(k => k.frame > frame);

    if (!before && after) {
      obj.set({ left: after.x, top: after.y, angle: after.angle, scaleX: after.scaleX, scaleY: after.scaleY, opacity: after.opacity });
    } else if (before && !after) {
      obj.set({ left: before.x, top: before.y, angle: before.angle, scaleX: before.scaleX, scaleY: before.scaleY, opacity: before.opacity });
    } else if (before && after) {
      const range = after.frame - before.frame;
      const rawT = range === 0 ? 0 : (frame - before.frame) / range;
      const t = applyEasing(rawT, easing);
      obj.set({
        left: lerp(before.x, after.x, t),
        top: lerp(before.y, after.y, t),
        angle: lerp(before.angle, after.angle, t),
        scaleX: lerp(before.scaleX, after.scaleX, t),
        scaleY: lerp(before.scaleY, after.scaleY, t),
        opacity: lerp(before.opacity, after.opacity, t),
      });
    }

    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setCurrentFrame(frame);
  }, [getObject, keyframes, easing, fabricCanvas]);

  const playAnimation = useCallback(() => {
    if (keyframes.length < 2) { toast.error("Adicione pelo menos 2 keyframes"); return; }
    setIsPlaying(true);
    let f = 0;
    const interval = setInterval(() => {
      goToFrame(f);
      f++;
      if (f > totalFrames) {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 1000 / fps);
  }, [keyframes, totalFrames, fps, goToFrame]);

  const clearAll = useCallback(() => {
    setKeyframes([]);
    toast.success("Keyframes limpos");
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Clapperboard className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Animação por Keyframes</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Clapperboard className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para animar</p>
        </div>
      ) : (
        <>
          {/* Config */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Total Frames</span>
                <span className="text-[9px] tabular-nums">{totalFrames}</span>
              </div>
              <input type="range" min={10} max={120} step={5} value={totalFrames}
                onChange={e => setTotalFrames(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">FPS</span>
                <span className="text-[9px] tabular-nums">{fps}</span>
              </div>
              <input type="range" min={1} max={30} step={1} value={fps}
                onChange={e => setFps(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
          </div>

          {/* Easing */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Interpolação</span>
            <div className="grid grid-cols-2 gap-1">
              {EASING_OPTIONS.map(e => (
                <button key={e} onClick={() => setEasing(e)}
                  className={`py-1 rounded border text-[8px] transition-colors ${easing === e ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Frame scrubber */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Frame Atual</span>
              <span className="text-[9px] tabular-nums">{currentFrame}</span>
            </div>
            <input type="range" min={0} max={totalFrames} step={1} value={currentFrame}
              onChange={e => { setCurrentFrame(Number(e.target.value)); goToFrame(Number(e.target.value)); }}
              className="w-full accent-primary h-1" />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => captureKeyframe(currentFrame)}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-primary text-primary text-[9px] hover:bg-primary/10 transition-colors">
              <Plus className="w-3 h-3" /> Capturar
            </button>
            <button onClick={playAnimation} disabled={isPlaying}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-green-500 text-green-500 text-[9px] hover:bg-green-500/10 transition-colors disabled:opacity-40">
              <Play className="w-3 h-3" /> {isPlaying ? "Tocando…" : "Reproduzir"}
            </button>
          </div>

          {/* Keyframes list */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Keyframes ({keyframes.length})
              </span>
              {keyframes.length > 0 && (
                <button onClick={clearAll} className="text-[8px] text-destructive hover:underline">Limpar</button>
              )}
            </div>
            {keyframes.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-2">Nenhum keyframe adicionado</p>
            ) : (
              <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                {keyframes.map(kf => (
                  <div key={kf.id}
                    className="flex items-center gap-2 px-2 py-1 rounded border border-border hover:border-primary/20 cursor-pointer"
                    onClick={() => { setCurrentFrame(kf.frame); goToFrame(kf.frame); }}>
                    <span className="text-[8px] text-primary w-10 flex-shrink-0">F{kf.frame}</span>
                    <span className="flex-1 text-[7px] text-muted-foreground truncate">
                      x:{kf.x} y:{kf.y} r:{kf.angle}° op:{kf.opacity}
                    </span>
                    <button onClick={e => { e.stopPropagation(); removeKeyframe(kf.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Posicione o objeto, avance o frame e capture para criar a animação
          </p>
        </>
      )}
    </div>
  );
}
