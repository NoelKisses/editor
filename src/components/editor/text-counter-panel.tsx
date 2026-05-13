"use client";

import { useCallback, useEffect, useState } from "react";
import { Hash, RefreshCw } from "lucide-react";

interface TextCounterPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface TextStats {
  chars: number;
  charsNoSpaces: number;
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  avgWordLength: number;
  longestWord: string;
  readingTime: string;
}

function analyzeText(text: string): TextStats {
  const trimmed = text.trim();
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const words = trimmed ? trimmed.split(/\s+/).filter(w => w.length > 0) : [];
  const lines = text.split(/\n/).length;
  const sentences = trimmed ? (trimmed.match(/[.!?]+/g) ?? []).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(p => p.trim()).length || 1 : 0;

  const wordLengths = words.map(w => w.replace(/[^a-zA-ZÀ-ú]/g, "").length);
  const avgWordLength = words.length > 0 ? wordLengths.reduce((a, b) => a + b, 0) / words.length : 0;
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "");

  const wordsPerMinute = 200;
  const totalMinutes = words.length / wordsPerMinute;
  const readingTime = totalMinutes < 1
    ? `${Math.ceil(totalMinutes * 60)}s`
    : `${Math.floor(totalMinutes)}m ${Math.round((totalMinutes % 1) * 60)}s`;

  return {
    chars,
    charsNoSpaces,
    words: words.length,
    lines,
    sentences,
    paragraphs,
    avgWordLength: parseFloat(avgWordLength.toFixed(1)),
    longestWord: longestWord.substring(0, 20),
    readingTime: words.length === 0 ? "0s" : readingTime,
  };
}

const EMPTY_STATS: TextStats = {
  chars: 0, charsNoSpaces: 0, words: 0, lines: 0,
  sentences: 0, paragraphs: 0, avgWordLength: 0,
  longestWord: "", readingTime: "0s",
};

function StatRow({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-2 py-1 rounded ${highlight ? "bg-destructive/10 border border-destructive/30" : "bg-muted/10 border border-border"}`}>
      <span className={`text-[8px] ${highlight ? "text-destructive" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-[9px] tabular-nums font-medium ${highlight ? "text-destructive" : ""}`}>{value}</span>
    </div>
  );
}

export function TextCounterPanel({ fabricCanvas, selectionVersion }: TextCounterPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [stats, setStats] = useState<TextStats>(EMPTY_STATS);
  const [allTextStats, setAllTextStats] = useState<TextStats>(EMPTY_STATS);
  const [showAll, setShowAll] = useState(false);
  const [charLimit, setCharLimit] = useState(0);
  const [wordLimit, setWordLimit] = useState(0);

  const analyzeObject = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    const isText = !!obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text");
    setHasText(isText);
    if (isText) {
      setStats(analyzeText(obj.text ?? ""));
    } else {
      setStats(EMPTY_STATS);
    }

    // All text objects on canvas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allTexts: string[] = fabricCanvas.getObjects().filter((o: any) =>
      o.type === "textbox" || o.type === "text" || o.type === "i-text"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).map((o: any) => o.text ?? "");
    setAllTextStats(analyzeText(allTexts.join(" ")));
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => { analyzeObject(); });
  }, [fabricCanvas, selectionVersion, analyzeObject]);

  const displayed = showAll ? allTextStats : stats;
  const overCharLimit = charLimit > 0 && displayed.chars > charLimit;
  const overWordLimit = wordLimit > 0 && displayed.words > wordLimit;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Hash className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Contador de Texto</span>
      </div>

      {/* Scope toggle */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={() => setShowAll(false)}
          className={`py-1 rounded border text-[8px] transition-colors ${!showAll ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
          Selecionado
        </button>
        <button onClick={() => setShowAll(true)}
          className={`py-1 rounded border text-[8px] transition-colors ${showAll ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
          Todo Canvas
        </button>
      </div>

      {!hasText && !showAll ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Hash className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para ver estatísticas</p>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="flex flex-col gap-1">
            <StatRow label="Caracteres (total)" value={displayed.chars} highlight={overCharLimit} />
            <StatRow label="Caracteres (s/ espaço)" value={displayed.charsNoSpaces} />
            <StatRow label="Palavras" value={displayed.words} highlight={overWordLimit} />
            <StatRow label="Linhas" value={displayed.lines} />
            <StatRow label="Sentenças" value={displayed.sentences} />
            <StatRow label="Parágrafos" value={displayed.paragraphs} />
            <StatRow label="Média letras/palavra" value={displayed.avgWordLength} />
            <StatRow label="Palavra mais longa" value={displayed.longestWord || "—"} />
            <StatRow label="Tempo de leitura" value={displayed.readingTime} />
          </div>

          {/* Limits */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Limites</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-muted-foreground">Máx. caracteres</span>
                <input type="number" min={0} value={charLimit} onChange={e => setCharLimit(Number(e.target.value))}
                  placeholder="0 = sem limite"
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[8px] focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-muted-foreground">Máx. palavras</span>
                <input type="number" min={0} value={wordLimit} onChange={e => setWordLimit(Number(e.target.value))}
                  placeholder="0 = sem limite"
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-[8px] focus:outline-none focus:border-primary" />
              </div>
            </div>
            {charLimit > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-muted-foreground">Restam</span>
                <span className={`text-[9px] tabular-nums font-medium ${overCharLimit ? "text-destructive" : "text-green-500"}`}>
                  {charLimit - displayed.chars} chars
                </span>
              </div>
            )}
          </div>

          <button onClick={analyzeObject}
            className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors">
            <RefreshCw className="w-3 h-3" /> Atualizar
          </button>
        </>
      )}
    </div>
  );
}
