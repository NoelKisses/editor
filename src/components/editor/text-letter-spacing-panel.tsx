"use client";

import { useCallback, useEffect, useState } from "react";
import { ALargeSmall, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TextLetterSpacingPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

const CHAR_SPACING_PRESETS = [-100, -50, 0, 50, 100, 200, 400];
const LINE_HEIGHT_PRESETS = [0.8, 1.0, 1.2, 1.5, 1.8, 2.0, 2.5];

export function TextLetterSpacingPanel({ fabricCanvas, selectionVersion }: TextLetterSpacingPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [charSpacing, setCharSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.16);
  const [wordSpacing, setWordSpacing] = useState(0);
  const [textIndent, setTextIndent] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = ["i-text", "textbox", "text"].includes(obj?.type ?? "");
      setHasText(isText);
      if (isText) {
        setCharSpacing(obj.charSpacing ?? 0);
        setLineHeight(obj.lineHeight ?? 1.16);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meta = (obj as any).data?.letterPanel ?? {};
        setWordSpacing(meta.wordSpacing ?? 0);
        setTextIndent(meta.textIndent ?? 0);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const applyProp = useCallback((props: Record<string, unknown>) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set(props);
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const applyMeta = useCallback((meta: Record<string, number>) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.data = { ...(obj.data ?? {}), letterPanel: { ...(obj.data?.letterPanel ?? {}), ...meta } } as any;
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const handleCharSpacing = useCallback((val: number) => {
    setCharSpacing(val);
    applyProp({ charSpacing: val });
  }, [applyProp]);

  const handleLineHeight = useCallback((val: number) => {
    setLineHeight(val);
    applyProp({ lineHeight: val });
  }, [applyProp]);

  const handleWordSpacing = useCallback((val: number) => {
    setWordSpacing(val);
    applyMeta({ wordSpacing: val });
  }, [applyMeta]);

  const handleTextIndent = useCallback((val: number) => {
    setTextIndent(val);
    applyMeta({ textIndent: val });
  }, [applyMeta]);

  const resetAll = useCallback(() => {
    setCharSpacing(0);
    setLineHeight(1.16);
    setWordSpacing(0);
    setTextIndent(0);
    applyProp({ charSpacing: 0, lineHeight: 1.16 });
    applyMeta({ wordSpacing: 0, textIndent: 0 });
    toast.success("Espaçamento redefinido");
  }, [applyProp, applyMeta]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <ALargeSmall className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Espaçamento de Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ALargeSmall className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para ajustar o espaçamento</p>
        </div>
      ) : (
        <>
          {/* Char spacing */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Espaço entre letras</span>
              <span className="text-[9px] tabular-nums font-mono">{charSpacing}</span>
            </div>
            <input
              type="range"
              min={-200}
              max={800}
              step={10}
              value={charSpacing}
              onChange={e => handleCharSpacing(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
            <div className="flex flex-wrap gap-1">
              {CHAR_SPACING_PRESETS.map(v => (
                <button
                  key={v}
                  onClick={() => handleCharSpacing(v)}
                  className={`flex-1 py-1 rounded border text-[8px] transition-colors ${charSpacing === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {v > 0 ? `+${v}` : v}
                </button>
              ))}
            </div>
          </div>

          {/* Line height */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Altura da linha</span>
              <span className="text-[9px] tabular-nums font-mono">{lineHeight.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.05}
              value={lineHeight}
              onChange={e => handleLineHeight(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
            <div className="flex flex-wrap gap-1">
              {LINE_HEIGHT_PRESETS.map(v => (
                <button
                  key={v}
                  onClick={() => handleLineHeight(v)}
                  className={`flex-1 py-1 rounded border text-[8px] transition-colors ${Math.abs(lineHeight - v) < 0.02 ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {v}×
                </button>
              ))}
            </div>
          </div>

          {/* Word spacing (metadata) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espaço entre palavras</span>
              <span className="text-[9px] tabular-nums">{wordSpacing}px</span>
            </div>
            <input
              type="range"
              min={-20}
              max={100}
              step={1}
              value={wordSpacing}
              onChange={e => handleWordSpacing(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>

          {/* Text indent */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Recuo do parágrafo</span>
              <span className="text-[9px] tabular-nums">{textIndent}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={120}
              step={4}
              value={textIndent}
              onChange={e => handleTextIndent(Number(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>

          {/* Preview */}
          <div className="p-3 rounded bg-muted/30 border border-border/50">
            <p
              className="text-[11px]"
              style={{
                letterSpacing: `${charSpacing / 1000}em`,
                lineHeight,
                wordSpacing: `${wordSpacing}px`,
                textIndent: `${textIndent}px`,
              }}
            >
              The quick brown fox jumps over the lazy dog. Texto de exemplo para visualizar o espaçamento.
            </p>
          </div>

          {/* Reset */}
          <button
            onClick={resetAll}
            className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 hover:text-primary transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Redefinir tudo
          </button>
        </>
      )}
    </div>
  );
}
