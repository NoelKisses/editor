"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Play, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TextTypewriterPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const CURSOR_CHARS = ["|", "▌", "▍", "_", "█"];
const EASING_PRESETS = [
  { label: "Linear", fn: (t: number) => t },
  { label: "Suave", fn: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t },
  { label: "Errático", fn: (t: number) => Math.random() < 0.1 ? t * 1.3 : t },
];

export function TextTypewriterPanel({ fabricCanvas, selectionVersion }: TextTypewriterPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [charDelay, setCharDelay] = useState(80);
  const [blinkSpeed, setBlinkSpeed] = useState(500);
  const [cursorChar, setCursorChar] = useState(0);
  const [easingIdx, setEasingIdx] = useState(0);
  const [deleteAfter, setDeleteAfter] = useState(false);
  const [deleteDelay, setDeleteDelay] = useState(1500);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objRef = useRef<any>(null);
  const phaseRef = useRef<"typing" | "waiting" | "deleting">("typing");
  const charIdxRef = useRef(0);
  const showCursorRef = useRef(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeNextRef = useRef<any>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = obj && (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox");
      setHasText(isText);
      if (isText) setOriginalText(obj.text ?? "");
    });
  }, [fabricCanvas, selectionVersion]);

  const stopAnimation = useCallback(() => {
    if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = null; }
    if (blinkRef.current) { clearInterval(blinkRef.current); blinkRef.current = null; }
    setIsPlaying(false);
    setPreviewText("");
    // Restore original text on canvas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = objRef.current;
    if (obj && originalText) {
      obj.set({ text: originalText });
      fabricCanvas?.requestRenderAll();
    }
  }, [originalText, fabricCanvas]);

  const typeNext = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = objRef.current;
    if (!obj) return;

    const cursor = CURSOR_CHARS[cursorChar];
    const easing = EASING_PRESETS[easingIdx].fn;

    if (phaseRef.current === "typing") {
      if (charIdxRef.current <= originalText.length) {
        const visible = originalText.slice(0, charIdxRef.current);
        obj.set({ text: visible + cursor });
        fabricCanvas?.requestRenderAll();
        setPreviewText(visible);
        charIdxRef.current++;
        const progress = charIdxRef.current / originalText.length;
        const delay = charDelay * (1 + (1 - easing(progress)) * 0.5);
        intervalRef.current = setTimeout(() => typeNextRef.current?.(), delay);
      } else {
        phaseRef.current = "waiting";
        if (deleteAfter) {
          intervalRef.current = setTimeout(() => typeNextRef.current?.(), deleteDelay);
        } else {
          obj.set({ text: originalText });
          fabricCanvas?.requestRenderAll();
          setIsPlaying(false);
          toast.success("Animação concluída");
        }
      }
    } else if (phaseRef.current === "waiting") {
      phaseRef.current = "deleting";
      charIdxRef.current = originalText.length;
      typeNextRef.current?.();
    } else {
      if (charIdxRef.current >= 0) {
        const visible = originalText.slice(0, charIdxRef.current);
        obj.set({ text: visible + (charIdxRef.current > 0 ? cursor : "") });
        fabricCanvas?.requestRenderAll();
        setPreviewText(visible);
        charIdxRef.current--;
        intervalRef.current = setTimeout(() => typeNextRef.current?.(), charDelay * 0.7);
      } else {
        obj.set({ text: cursor });
        fabricCanvas?.requestRenderAll();
        // Loop: restart
        phaseRef.current = "typing";
        charIdxRef.current = 0;
        intervalRef.current = setTimeout(() => typeNextRef.current?.(), 400);
      }
    }
  }, [originalText, charDelay, cursorChar, easingIdx, deleteAfter, deleteDelay, fabricCanvas]);

  useEffect(() => {
    typeNextRef.current = typeNext;
  }, [typeNext]);

  const startAnimation = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj || (obj.type !== "i-text" && obj.type !== "text" && obj.type !== "textbox")) {
      toast.error("Selecione um objeto de texto"); return;
    }
    objRef.current = obj;
    phaseRef.current = "typing";
    charIdxRef.current = 0;
    setIsPlaying(true);

    // Cursor blink independent of typing
    blinkRef.current = setInterval(() => {
      showCursorRef.current = !showCursorRef.current;
    }, blinkSpeed);

    typeNext();
  }, [fabricCanvas, typeNext, blinkSpeed]);

  const applyToCanvas = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um texto"); return; }
    // Just restore text and mark done
    obj.set({ text: originalText });
    fabricCanvas.requestRenderAll();
    toast.success("Texto restaurado no canvas");
  }, [fabricCanvas, originalText]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Keyboard className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Efeito Máquina de Escrever</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Keyboard className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto no canvas</p>
        </div>
      ) : (
        <>
          {/* Text preview */}
          <div className="p-2 rounded border border-border bg-muted/10 min-h-[40px] flex items-center">
            <span className="text-[9px] font-mono text-foreground/80 break-all">
              {isPlaying ? (previewText + CURSOR_CHARS[cursorChar]) : (originalText || "—")}
            </span>
          </div>

          {/* Speed */}
          <div className="flex flex-col gap-1 p-2 rounded border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-medium">Velocidade</span>
              <span className="text-[9px] tabular-nums">{charDelay}ms/char</span>
            </div>
            <input
              type="range" min={20} max={300} step={10} value={charDelay}
              onChange={(e) => setCharDelay(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
            <div className="flex justify-between text-[7px] text-muted-foreground">
              <span>Rápido (20ms)</span>
              <span>Lento (300ms)</span>
            </div>
          </div>

          {/* Cursor */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Cursor</span>
            <div className="flex gap-1">
              {CURSOR_CHARS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setCursorChar(i)}
                  className={`flex-1 py-1 rounded border font-mono text-[11px] transition-colors ${
                    cursorChar === i ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Easing */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Ritmo de digitação</span>
            <div className="flex gap-1">
              {EASING_PRESETS.map((e, i) => (
                <button
                  key={i}
                  onClick={() => setEasingIdx(i)}
                  className={`flex-1 py-1 rounded border text-[7px] transition-colors ${
                    easingIdx === i ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delete loop */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={deleteAfter} onChange={(e) => setDeleteAfter(e.target.checked)}
                className="accent-primary w-3 h-3" />
              <span className="text-[8px]">Apagar e repetir em loop</span>
            </label>
            {deleteAfter && (
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-muted-foreground">Pausa antes de apagar</span>
                <input type="number" min={200} max={5000} step={100} value={deleteDelay}
                  onChange={(e) => setDeleteDelay(Number(e.target.value))}
                  className="w-16 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
                <span className="text-[7px] text-muted-foreground">ms</span>
              </div>
            )}
          </div>

          {/* Blink speed */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">Piscar cursor</span>
            <input type="number" min={100} max={2000} step={100} value={blinkSpeed}
              onChange={(e) => setBlinkSpeed(Number(e.target.value))}
              className="w-16 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
            <span className="text-[7px] text-muted-foreground">ms</span>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isPlaying ? (
              <button onClick={startAnimation}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
                <Play className="w-3 h-3" /> Prévia no Canvas
              </button>
            ) : (
              <button onClick={stopAnimation}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-destructive text-destructive text-[9px] font-medium hover:bg-destructive/10 transition-colors">
                <Square className="w-3 h-3" /> Parar
              </button>
            )}
            <button onClick={applyToCanvas} disabled={isPlaying}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Prévia anima diretamente no canvas · Parar restaura o texto original
          </p>
        </>
      )}
    </div>
  );
}
