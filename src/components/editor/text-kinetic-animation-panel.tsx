"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard, Play, Square, Check } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = any;

type AnimationType =
  | "wave"
  | "bounce"
  | "typewriter"
  | "fade-in"
  | "slide-up"
  | "shake";

type Direction = "ltr" | "rtl";

interface KineticConfig {
  type: AnimationType;
  speed: number;
  loop: boolean;
  direction: Direction;
}

type AnimateLettersConfig = KineticConfig;

const ANIMATION_TYPES: { value: AnimationType; label: string }[] = [
  { value: "wave", label: "Onda" },
  { value: "bounce", label: "Pulo" },
  { value: "typewriter", label: "Máquina" },
  { value: "fade-in", label: "Aparece" },
  { value: "slide-up", label: "Sobe" },
  { value: "shake", label: "Vibra" },
];

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

function clearAnimRef(animRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  if (animRef.current !== null) {
    clearTimeout(animRef.current);
    animRef.current = null;
  }
}

function scheduleChain(
  tasks: Array<() => void>,
  speed: number,
  animRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onDone: () => void,
) {
  let idx = 0;
  function next() {
    if (idx >= tasks.length) {
      onDone();
      return;
    }
    tasks[idx]();
    idx++;
    animRef.current = setTimeout(next, speed);
  }
  next();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function animateTypewriter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: AnyObj,
  config: AnimateLettersConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasRef: React.MutableRefObject<AnyObj>,
  animRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onDone: () => void,
) {
  const fullText: string = obj._kineticOriginalText ?? obj.text ?? "";
  const letters = fullText.split("");
  const ordered = config.direction === "rtl" ? [...letters].reverse() : letters;

  const tasks = ordered.map((_: string, i: number) => () => {
    const revealed = config.direction === "rtl"
      ? fullText.slice(fullText.length - i - 1)
      : fullText.slice(0, i + 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set({ text: revealed });
    const cv = canvasRef.current;
    if (cv) cv.requestRenderAll();
  });

  scheduleChain(tasks, config.speed, animRef, onDone);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function animateWave(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: AnyObj,
  config: AnimateLettersConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasRef: React.MutableRefObject<AnyObj>,
  animRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onDone: () => void,
) {
  const startTop: number = obj._kineticOriginalTop ?? obj.top ?? 0;
  const totalLetters = (obj.text ?? "").length;
  const amplitude = 12;
  const ticksPerLetter = 8;
  const totalTicks = totalLetters * ticksPerLetter;

  const indices =
    config.direction === "rtl"
      ? Array.from({ length: totalTicks }, (_, i) => totalTicks - 1 - i)
      : Array.from({ length: totalTicks }, (_, i) => i);

  const tasks = indices.map((tick: number) => () => {
    const offset = Math.sin((tick / ticksPerLetter) * Math.PI) * amplitude;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set({ top: startTop + offset });
    const cv = canvasRef.current;
    if (cv) cv.requestRenderAll();
  });

  scheduleChain(tasks, Math.max(16, Math.floor(config.speed / totalTicks)), animRef, () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set({ top: startTop });
    const cv = canvasRef.current;
    if (cv) cv.requestRenderAll();
    onDone();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function animateBounce(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: AnyObj,
  config: AnimateLettersConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasRef: React.MutableRefObject<AnyObj>,
  animRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onDone: () => void,
) {
  const startScaleX: number = obj._kineticOriginalScaleX ?? obj.scaleX ?? 1;
  const startScaleY: number = obj._kineticOriginalScaleY ?? obj.scaleY ?? 1;
  const totalLetters = Math.max(1, (obj.text ?? "").length);
  const steps = [0, 0.6, 1.2, 0.9, 1.05, 1.0];
  const tasks: Array<() => void> = [];

  const letterIndices =
    config.direction === "rtl"
      ? Array.from({ length: totalLetters }, (_, i) => totalLetters - 1 - i)
      : Array.from({ length: totalLetters }, (_, i) => i);

  letterIndices.forEach(() => {
    steps.forEach((scale) => {
      tasks.push(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        obj.set({ scaleX: startScaleX * scale, scaleY: startScaleY * scale });
        const cv = canvasRef.current;
        if (cv) cv.requestRenderAll();
      });
    });
  });

  scheduleChain(tasks, Math.max(16, Math.floor(config.speed / tasks.length)), animRef, () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set({ scaleX: startScaleX, scaleY: startScaleY });
    const cv = canvasRef.current;
    if (cv) cv.requestRenderAll();
    onDone();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function animateFadeIn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: AnyObj,
  config: AnimateLettersConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasRef: React.MutableRefObject<AnyObj>,
  animRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onDone: () => void,
) {
  const steps = 20;
  const stepDelay = Math.max(16, Math.floor(config.speed / steps));
  const indices =
    config.direction === "rtl"
      ? Array.from({ length: steps }, (_, i) => steps - 1 - i)
      : Array.from({ length: steps }, (_, i) => i);

  const tasks = indices.map((i: number) => () => {
    const opacity = (i + 1) / steps;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set({ opacity });
    const cv = canvasRef.current;
    if (cv) cv.requestRenderAll();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj.set({ opacity: 0 });
  const cv = canvasRef.current;
  if (cv) cv.requestRenderAll();

  scheduleChain(tasks, stepDelay, animRef, () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set({ opacity: 1 });
    const cv2 = canvasRef.current;
    if (cv2) cv2.requestRenderAll();
    onDone();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function animateSlideUp(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: AnyObj,
  config: AnimateLettersConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasRef: React.MutableRefObject<AnyObj>,
  animRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onDone: () => void,
) {
  const startTop: number = obj._kineticOriginalTop ?? obj.top ?? 0;
  const offsetStart = 20;
  const steps = 16;
  const stepDelay = Math.max(16, Math.floor(config.speed / steps));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj.set({ top: startTop + offsetStart });
  const cv0 = canvasRef.current;
  if (cv0) cv0.requestRenderAll();

  const indices =
    config.direction === "rtl"
      ? Array.from({ length: steps }, (_, i) => steps - 1 - i)
      : Array.from({ length: steps }, (_, i) => i);

  const tasks = indices.map((i: number) => () => {
    const progress = (i + 1) / steps;
    const eased = 1 - Math.pow(1 - progress, 3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set({ top: startTop + offsetStart * (1 - eased) });
    const cv = canvasRef.current;
    if (cv) cv.requestRenderAll();
  });

  scheduleChain(tasks, stepDelay, animRef, () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set({ top: startTop });
    const cv = canvasRef.current;
    if (cv) cv.requestRenderAll();
    onDone();
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function animateShake(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: AnyObj,
  config: AnimateLettersConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasRef: React.MutableRefObject<AnyObj>,
  animRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onDone: () => void,
) {
  const startLeft: number = obj._kineticOriginalLeft ?? obj.left ?? 0;
  const shakeOffsets = [6, -6, 4, -4, 2, -2, 0];
  const totalLetters = Math.max(1, (obj.text ?? "").length);
  const tasks: Array<() => void> = [];

  const letterIndices =
    config.direction === "rtl"
      ? Array.from({ length: totalLetters }, (_, i) => totalLetters - 1 - i)
      : Array.from({ length: totalLetters }, (_, i) => i);

  letterIndices.forEach(() => {
    shakeOffsets.forEach((offsetX) => {
      tasks.push(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        obj.set({ left: startLeft + offsetX });
        const cv = canvasRef.current;
        if (cv) cv.requestRenderAll();
      });
    });
  });

  scheduleChain(tasks, Math.max(16, Math.floor(config.speed / tasks.length)), animRef, () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set({ left: startLeft });
    const cv = canvasRef.current;
    if (cv) cv.requestRenderAll();
    onDone();
  });
}

// ---------------------------------------------------------------------------
// Main module-level animateLetters function
// ---------------------------------------------------------------------------

function animateLetters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: AnyObj,
  config: AnimateLettersConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasRef: React.MutableRefObject<AnyObj>,
  animRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  onDone: () => void,
) {
  clearAnimRef(animRef);

  // Snapshot originals once
  if (obj._kineticOriginalText === undefined) obj._kineticOriginalText = obj.text ?? "";
  if (obj._kineticOriginalTop === undefined) obj._kineticOriginalTop = obj.top ?? 0;
  if (obj._kineticOriginalLeft === undefined) obj._kineticOriginalLeft = obj.left ?? 0;
  if (obj._kineticOriginalScaleX === undefined) obj._kineticOriginalScaleX = obj.scaleX ?? 1;
  if (obj._kineticOriginalScaleY === undefined) obj._kineticOriginalScaleY = obj.scaleY ?? 1;

  switch (config.type) {
    case "typewriter":
      animateTypewriter(obj, config, canvasRef, animRef, onDone);
      break;
    case "wave":
      animateWave(obj, config, canvasRef, animRef, onDone);
      break;
    case "bounce":
      animateBounce(obj, config, canvasRef, animRef, onDone);
      break;
    case "fade-in":
      animateFadeIn(obj, config, canvasRef, animRef, onDone);
      break;
    case "slide-up":
      animateSlideUp(obj, config, canvasRef, animRef, onDone);
      break;
    case "shake":
      animateShake(obj, config, canvasRef, animRef, onDone);
      break;
    default:
      onDone();
  }
}

function resetObjectToOriginal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: AnyObj,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasRef: React.MutableRefObject<AnyObj>,
) {
  if (!obj) return;
  if (obj._kineticOriginalText !== undefined) obj.set({ text: obj._kineticOriginalText });
  if (obj._kineticOriginalTop !== undefined) obj.set({ top: obj._kineticOriginalTop });
  if (obj._kineticOriginalLeft !== undefined) obj.set({ left: obj._kineticOriginalLeft });
  if (obj._kineticOriginalScaleX !== undefined) obj.set({ scaleX: obj._kineticOriginalScaleX });
  if (obj._kineticOriginalScaleY !== undefined) obj.set({ scaleY: obj._kineticOriginalScaleY });
  obj.set({ opacity: 1 });

  // Clear snapshots
  delete obj._kineticOriginalText;
  delete obj._kineticOriginalTop;
  delete obj._kineticOriginalLeft;
  delete obj._kineticOriginalScaleX;
  delete obj._kineticOriginalScaleY;

  const cv = canvasRef.current;
  if (cv) cv.requestRenderAll();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TextKineticAnimationPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

export function TextKineticAnimationPanel({
  fabricCanvas,
  selectionVersion,
}: TextKineticAnimationPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configRef = useRef<KineticConfig>({
    type: "wave",
    speed: 400,
    loop: false,
    direction: "ltr",
  });

  const [hasText, setHasText] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [config, setConfig] = useState<KineticConfig>({
    type: "wave",
    speed: 400,
    loop: false,
    direction: "ltr",
  });

  // Keep ref in sync with config
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Sync canvasRef without triggering render
  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // Detect text selection
  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText =
        !!obj &&
        (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox");
      setHasText(isText);
    });
  }, [fabricCanvas, selectionVersion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnimRef(animRef);
    };
  }, []);

  function getActiveTextObj() {
    const cv = canvasRef.current;
    if (!cv) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (
      !obj ||
      (obj.type !== "i-text" && obj.type !== "text" && obj.type !== "textbox")
    ) {
      return null;
    }
    return obj;
  }

  function runAnimation(loopOverride?: boolean) {
    const obj = getActiveTextObj();
    if (!obj) {
      toast.error("Selecione um objeto de texto primeiro.");
      return;
    }

    const cfg: AnimateLettersConfig = {
      ...configRef.current,
      loop: loopOverride !== undefined ? loopOverride : configRef.current.loop,
    };

    setIsAnimating(true);

    const handleDone = () => {
      if (cfg.loop) {
        // Restart after a small pause
        animRef.current = setTimeout(() => {
          resetObjectToOriginal(obj, canvasRef);
          runAnimationInternal(obj, cfg, handleDone);
        }, Math.max(100, cfg.speed));
      } else {
        setIsAnimating(false);
      }
    };

    runAnimationInternal(obj, cfg, handleDone);
  }

  function runAnimationInternal(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj: AnyObj,
    cfg: AnimateLettersConfig,
    onDone: () => void,
  ) {
    animateLetters(obj, cfg, canvasRef, animRef, onDone);
  }

  function handleStart() {
    runAnimation();
    toast.success("Animação iniciada!");
  }

  function handleStop() {
    clearAnimRef(animRef);
    const obj = getActiveTextObj();
    if (obj) {
      resetObjectToOriginal(obj, canvasRef);
    }
    setIsAnimating(false);
    toast.success("Animação parada.");
  }

  function handleApply() {
    runAnimation(false);
    toast.success("Animação aplicada (one-shot).");
  }

  const directionApplicable = config.type === "wave" || config.type === "bounce";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clapperboard className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-semibold">Animação Cinética de Texto</span>
      </div>

      {/* No selection warning */}
      {!hasText && (
        <p className="rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          Selecione um objeto de texto (IText / Textbox) para aplicar animações.
        </p>
      )}

      {/* Animation type grid */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Tipo de Animação</p>
        <div className="grid grid-cols-3 gap-2">
          {ANIMATION_TYPES.map((anim) => (
            <button
              key={anim.value}
              onClick={() => setConfig((c) => ({ ...c, type: anim.value }))}
              className={`flex items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors ${
                config.type === anim.value
                  ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {config.type === anim.value && <Check className="h-3 w-3 shrink-0" />}
              {anim.label}
            </button>
          ))}
        </div>
      </div>

      {/* Speed slider */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            Velocidade por letra
          </label>
          <span className="text-xs text-muted-foreground">{config.speed}ms</span>
        </div>
        <input
          type="range"
          min={100}
          max={2000}
          step={50}
          value={config.speed}
          onChange={(e) =>
            setConfig((c) => ({ ...c, speed: Number(e.target.value) }))
          }
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>100ms</span>
          <span>2000ms</span>
        </div>
      </div>

      {/* Direction (wave / bounce only) */}
      {directionApplicable && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Direção</p>
          <div className="flex gap-2">
            {(
              [
                { value: "ltr", label: "Esq → Dir" },
                { value: "rtl", label: "Dir → Esq" },
              ] as { value: Direction; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setConfig((c) => ({ ...c, direction: opt.value }))}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                  config.direction === opt.value
                    ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loop checkbox */}
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={config.loop}
          onChange={(e) => setConfig((c) => ({ ...c, loop: e.target.checked }))}
          className="accent-purple-500"
        />
        <span className="text-muted-foreground">Repetir (loop)</span>
      </label>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            disabled={!hasText || isAnimating}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-purple-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            Iniciar
          </button>
          <button
            onClick={handleStop}
            disabled={!hasText && !isAnimating}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Square className="h-3.5 w-3.5" />
            Parar
          </button>
        </div>
        <button
          onClick={handleApply}
          disabled={!hasText || isAnimating}
          className="flex items-center justify-center gap-1.5 rounded-md border border-purple-500 px-3 py-2 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-purple-900/20"
        >
          <Check className="h-3.5 w-3.5" />
          Aplicar (one-shot)
        </button>
      </div>

      {/* Status */}
      {isAnimating && (
        <p className="text-center text-[10px] text-purple-500 animate-pulse">
          Animando...
        </p>
      )}
    </div>
  );
}
