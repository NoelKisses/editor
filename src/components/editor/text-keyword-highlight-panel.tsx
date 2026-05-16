"use client";

import { useEffect, useRef, useState } from "react";
import { Highlighter, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TextKeywordHighlightPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const TEXT_TYPES = ["text", "i-text", "textbox"];

function findKeywordOccurrences(
  text: string,
  keyword: string,
  caseSensitive: boolean,
): Array<{ lineIndex: number; charStart: number; charEnd: number }> {
  const occurrences: Array<{
    lineIndex: number;
    charStart: number;
    charEnd: number;
  }> = [];
  if (!keyword || keyword.length === 0) return occurrences;

  const lines = text.split("\n");
  const needle = caseSensitive ? keyword : keyword.toLowerCase();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const haystack = caseSensitive ? line : line.toLowerCase();
    let startIndex = 0;
    while (startIndex <= haystack.length - needle.length) {
      const foundAt = haystack.indexOf(needle, startIndex);
      if (foundAt === -1) break;
      occurrences.push({
        lineIndex,
        charStart: foundAt,
        charEnd: foundAt + keyword.length,
      });
      startIndex = foundAt + needle.length;
    }
  }

  return occurrences;
}

function getStyleForEffect(
  effect: string,
  highlightColor: string,
  bgColor: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  switch (effect) {
    case "bold":
      return { fontWeight: "bold" };
    case "color":
      return { fill: highlightColor };
    case "underline":
      return { underline: true };
    case "italic":
      return { fontStyle: "italic" };
    case "background":
      return { textBackgroundColor: bgColor };
    case "all":
      return {
        fontWeight: "bold",
        fill: highlightColor,
        underline: true,
        fontStyle: "italic",
        textBackgroundColor: bgColor,
      };
    default:
      return {};
  }
}

const EFFECT_BUTTONS: Array<{ id: string; label: string }> = [
  { id: "bold", label: "Negrito" },
  { id: "color", label: "Cor Diferente" },
  { id: "underline", label: "Sublinhado" },
  { id: "italic", label: "Itálico" },
  { id: "background", label: "Background" },
  { id: "all", label: "Tudo" },
];

export function TextKeywordHighlightPanel({
  fabricCanvas,
}: TextKeywordHighlightPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [highlightColor, setHighlightColor] = useState("#ef4444");
  const [bgColor, setBgColor] = useState("#fef08a");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [totalMatches, setTotalMatches] = useState<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      canvasRef.current = fabricCanvas;
    });
  }, [fabricCanvas]);

  function handleAddKeyword() {
    const trimmed = keywordInput.trim();
    if (!trimmed) {
      toast.error("Digite uma palavra-chave");
      return;
    }
    if (keywords.includes(trimmed)) {
      toast.error("Palavra-chave já adicionada");
      return;
    }
    setKeywords((prev) => [...prev, trimmed]);
    setKeywordInput("");
    toast.success(`Palavra "${trimmed}" adicionada`);
  }

  function handleRemoveKeyword(kw: string) {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getSelectedTextObjects(): any[] {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const active = canvas.getActiveObjects?.() ?? [];
    if (active.length === 0) {
      const single = canvas.getActiveObject?.();
      if (single) return [single];
      return [];
    }
    return active;
  }

  function handleApplyHighlights(effect: string) {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (keywords.length === 0) {
      toast.error("Adicione ao menos uma palavra-chave");
      return;
    }

    const selected = getSelectedTextObjects().filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj: any) => obj && TEXT_TYPES.includes(obj.type),
    );

    if (selected.length === 0) {
      toast.error("Selecione um objeto de texto");
      return;
    }

    const styleToApply = getStyleForEffect(effect, highlightColor, bgColor);
    let matchCount = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selected.forEach((obj: any) => {
      const text: string = obj.text ?? "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const styles: Record<string, Record<string, any>> = obj.styles ?? {};

      for (const keyword of keywords) {
        const occurrences = findKeywordOccurrences(
          text,
          keyword,
          caseSensitive,
        );
        matchCount += occurrences.length;

        for (const occ of occurrences) {
          if (!styles[occ.lineIndex]) {
            styles[occ.lineIndex] = {};
          }
          for (let c = occ.charStart; c < occ.charEnd; c++) {
            styles[occ.lineIndex][c] = {
              ...(styles[occ.lineIndex][c] ?? {}),
              ...styleToApply,
            };
          }
        }
      }

      obj.styles = styles;
      obj.dirty = true;
    });

    canvas.requestRenderAll?.();
    setTotalMatches(matchCount);

    if (matchCount === 0) {
      toast.warning("Nenhuma ocorrência encontrada");
    } else {
      toast.success(`${matchCount} ocorrência(s) destacada(s)`);
    }
  }

  function handleClearHighlights() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    const selected = getSelectedTextObjects().filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj: any) => obj && TEXT_TYPES.includes(obj.type),
    );

    if (selected.length === 0) {
      toast.error("Selecione um objeto de texto");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selected.forEach((obj: any) => {
      obj.styles = {};
      obj.dirty = true;
    });

    canvas.requestRenderAll?.();
    setTotalMatches(null);
    toast.success("Destaques removidos");
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Highlighter className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Destacar Palavras-Chave</h3>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Palavra-chave</label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddKeyword();
              }
            }}
            placeholder="Digite uma palavra"
          />
          <Button onClick={handleAddKeyword} type="button">
            Adicionar Palavra
          </Button>
        </div>
      </div>

      {keywords.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Palavras adicionadas ({keywords.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <Badge
                key={kw}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remover ${kw}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Cor de destaque</label>
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => setHighlightColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Cor de fundo</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="case-sensitive-toggle"
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
          className="h-4 w-4 cursor-pointer"
        />
        <label
          htmlFor="case-sensitive-toggle"
          className="cursor-pointer text-sm font-medium"
        >
          Case-sensitive (diferenciar maiúsculas/minúsculas)
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Efeito de destaque</label>
        <div className="grid grid-cols-2 gap-2">
          {EFFECT_BUTTONS.map((eff) => (
            <Button
              key={eff.id}
              variant="outline"
              type="button"
              onClick={() => handleApplyHighlights(eff.id)}
            >
              {eff.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="default"
          className="flex-1"
          onClick={() => handleApplyHighlights("all")}
        >
          Aplicar Destaques
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="flex-1"
          onClick={handleClearHighlights}
        >
          Limpar Destaques
        </Button>
      </div>

      {totalMatches !== null && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <span className="font-medium">Estatísticas:</span>{" "}
          {totalMatches} ocorrência(s) encontrada(s) na última aplicação.
        </div>
      )}
    </div>
  );
}
