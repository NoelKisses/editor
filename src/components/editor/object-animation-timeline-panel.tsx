"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type EasingKind = "linear" | "easeIn" | "easeOut" | "easeInOut";
type AnimatableProperty = "left" | "top" | "angle" | "opacity" | "scaleX" | "scaleY";

function easeLinear(t: number): number {
  return t;
}

function easeIn(t: number): number {
  return t * t;
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getEasingFn(kind: EasingKind): (t: number) => number {
  switch (kind) {
    case "linear":
      return easeLinear;
    case "easeIn":
      return easeIn;
    case "easeOut":
      return easeOut;
    case "easeInOut":
      return easeInOut;
    default:
      return easeLinear;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActiveObject(canvas: any): any | null {
  if (!canvas || typeof canvas.getActiveObject !== "function") return null;
  return canvas.getActiveObject() ?? null;
}

interface ObjectAnimationTimelinePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function ObjectAnimationTimelinePanel({ fabricCanvas }: ObjectAnimationTimelinePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const directionRef = useRef<1 | -1>(1);

  const [property, setProperty] = useState<AnimatableProperty>("left");
  const [startValue, setStartValue] = useState<number>(0);
  const [endValue, setEndValue] = useState<number>(100);
  const [duration, setDuration] = useState<number>(1000);
  const [easing, setEasing] = useState<EasingKind>("linear");
  const [loop, setLoop] = useState<boolean>(false);
  const [reverse, setReverse] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Latest values refs (so RAF loop reads current settings without restart)
  const propertyRef = useRef<AnimatableProperty>(property);
  const startValueRef = useRef<number>(startValue);
  const endValueRef = useRef<number>(endValue);
  const durationRef = useRef<number>(duration);
  const easingRef = useRef<EasingKind>(easing);
  const loopRef = useRef<boolean>(loop);
  const reverseRef = useRef<boolean>(reverse);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetRef = useRef<any>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    propertyRef.current = property;
  }, [property]);

  useEffect(() => {
    startValueRef.current = startValue;
  }, [startValue]);

  useEffect(() => {
    endValueRef.current = endValue;
  }, [endValue]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    easingRef.current = easing;
  }, [easing]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    reverseRef.current = reverse;
  }, [reverse]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    targetRef.current = null;
    directionRef.current = 1;
    setIsPlaying(false);
  };

  const animate = (now: number) => {
    const canvas = canvasRef.current;
    const obj = targetRef.current;
    if (!canvas || !obj) {
      stopAnimation();
      return;
    }

    const dur = Math.max(1, durationRef.current);
    const elapsed = now - startTimeRef.current;
    let progress = elapsed / dur;
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;

    const easeFn = getEasingFn(easingRef.current);
    const eased = easeFn(progress);

    const from = directionRef.current === 1 ? startValueRef.current : endValueRef.current;
    const to = directionRef.current === 1 ? endValueRef.current : startValueRef.current;
    const value = from + (to - from) * eased;

    try {
      obj.set(propertyRef.current, value);
      if (typeof obj.setCoords === "function") {
        obj.setCoords();
      }
      if (typeof canvas.requestRenderAll === "function") {
        canvas.requestRenderAll();
      }
    } catch {
      stopAnimation();
      return;
    }

    if (progress >= 1) {
      if (reverseRef.current && directionRef.current === 1) {
        directionRef.current = -1;
        // eslint-disable-next-line react-hooks/purity
        startTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      if (loopRef.current) {
        directionRef.current = 1;
        // eslint-disable-next-line react-hooks/purity
        startTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      stopAnimation();
      return;
    }

    rafRef.current = requestAnimationFrame(animate);
  };

  const handlePlay = () => {
    const canvas = canvasRef.current;
    const obj = getActiveObject(canvas);
    if (!obj) {
      toast.error("Nenhum objeto selecionado");
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    targetRef.current = obj;
    directionRef.current = 1;
    startTimeRef.current = performance.now();
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(animate);
  };

  const handleStop = () => {
    stopAnimation();
  };

  const handleCaptureStart = () => {
    const canvas = canvasRef.current;
    const obj = getActiveObject(canvas);
    if (!obj) {
      toast.error("Nenhum objeto selecionado");
      return;
    }
    const current = Number(obj.get?.(property) ?? obj[property] ?? 0);
    if (Number.isFinite(current)) {
      setStartValue(current);
      toast.success(`Inicio capturado: ${current}`);
    }
  };

  const handleCaptureEnd = () => {
    const canvas = canvasRef.current;
    const obj = getActiveObject(canvas);
    if (!obj) {
      toast.error("Nenhum objeto selecionado");
      return;
    }
    const current = Number(obj.get?.(property) ?? obj[property] ?? 0);
    if (Number.isFinite(current)) {
      setEndValue(current);
      toast.success(`Fim capturado: ${current}`);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Linha do Tempo de Animação</h3>
        </div>
        <Badge variant={isPlaying ? "default" : "secondary"}>
          {isPlaying ? "Reproduzindo" : "Parado"}
        </Badge>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="anim-property">
          Propriedade
        </label>
        <select
          id="anim-property"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={property}
          onChange={(e) => setProperty(e.target.value as AnimatableProperty)}
        >
          <option value="left">left</option>
          <option value="top">top</option>
          <option value="angle">angle</option>
          <option value="opacity">opacity</option>
          <option value="scaleX">scaleX</option>
          <option value="scaleY">scaleY</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="anim-start">
            Inicio
          </label>
          <Input
            id="anim-start"
            type="number"
            value={startValue}
            onChange={(e) => setStartValue(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="anim-end">
            Fim
          </label>
          <Input
            id="anim-end"
            type="number"
            value={endValue}
            onChange={(e) => setEndValue(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleCaptureStart}>
          Capturar Inicio
        </Button>
        <Button variant="outline" size="sm" onClick={handleCaptureEnd}>
          Capturar Fim
        </Button>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="anim-duration">
          Duração (ms)
        </label>
        <Input
          id="anim-duration"
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="anim-easing">
          Easing
        </label>
        <select
          id="anim-easing"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={easing}
          onChange={(e) => setEasing(e.target.value as EasingKind)}
        >
          <option value="linear">linear</option>
          <option value="easeIn">easeIn</option>
          <option value="easeOut">easeOut</option>
          <option value="easeInOut">easeInOut</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
          />
          Loop
        </label>
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={reverse}
            onChange={(e) => setReverse(e.target.checked)}
          />
          Reverso
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" onClick={handlePlay} disabled={isPlaying}>
          Reproduzir
        </Button>
        <Button size="sm" variant="destructive" onClick={handleStop} disabled={!isPlaying}>
          Parar
        </Button>
      </div>
    </div>
  );
}
