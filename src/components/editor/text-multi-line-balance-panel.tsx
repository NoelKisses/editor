"use client";

import { useEffect, useRef, useState } from "react";
import { AlignCenterHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BalanceMode = "equilibrado" | "piramide" | "piramide-inv";

function splitWordsIntoLines(
  words: string[],
  targetCharsPerLine: number,
): string[] {
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length === 0) {
      current = word;
      continue;
    }
    const candidate = current + " " + word;
    if (candidate.length <= targetCharsPerLine) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}

function balanceText(text: string, lines: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;
  if (lines <= 1) return words.join(" ");

  const totalChars = words.join(" ").length;
  const targetCharsPerLine = Math.max(1, Math.ceil(totalChars / lines));

  const result = splitWordsIntoLines(words, targetCharsPerLine);

  // If we produced fewer than the requested lines, try a slightly tighter target
  if (result.length < lines && words.length >= lines) {
    let tighter = targetCharsPerLine;
    let attempt = result;
    while (attempt.length < lines && tighter > 1) {
      tighter -= 1;
      attempt = splitWordsIntoLines(words, tighter);
    }
    return attempt.join("\n");
  }

  return result.join("\n");
}

function pyramidText(text: string, lines: number, inverse: boolean): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;
  if (lines <= 1) return words.join(" ");

  // Build weights: pyramid grows 1..lines, inverse shrinks lines..1
  const weights: number[] = [];
  for (let i = 0; i < lines; i += 1) {
    weights.push(inverse ? lines - i : i + 1);
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const totalChars = words.join(" ").length;

  const targets = weights.map((w) =>
    Math.max(1, Math.round((w / totalWeight) * totalChars)),
  );

  const result: string[] = [];
  let wordIdx = 0;

  for (let lineIdx = 0; lineIdx < lines; lineIdx += 1) {
    const target = targets[lineIdx];
    const isLast = lineIdx === lines - 1;
    let current = "";

    while (wordIdx < words.length) {
      const word = words[wordIdx];
      if (current.length === 0) {
        current = word;
        wordIdx += 1;
        continue;
      }
      const candidate = current + " " + word;
      if (isLast || candidate.length <= target) {
        current = candidate;
        wordIdx += 1;
      } else {
        break;
      }
    }

    if (current.length > 0) {
      result.push(current);
    }
  }

  // If any words remain (last line target too small), append them to last line
  if (wordIdx < words.length) {
    const remaining = words.slice(wordIdx).join(" ");
    if (result.length === 0) {
      result.push(remaining);
    } else {
      result[result.length - 1] = result[result.length - 1] + " " + remaining;
    }
  }

  return result.join("\n");
}

function getObjectId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
): string {
  if (!obj) return "unknown";
  if (typeof obj.id === "string") return obj.id;
  if (!obj.__balanceId) {
    obj.__balanceId = `obj-${Math.random().toString(36).slice(2, 10)}`;
  }
  return obj.__balanceId as string;
}

interface TextMultiLineBalancePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextMultiLineBalancePanel({
  fabricCanvas,
}: TextMultiLineBalancePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const originalsRef = useRef<Map<string, string>>(new Map());

  const [targetLines, setTargetLines] = useState<number>(2);
  const [mode, setMode] = useState<BalanceMode>("equilibrado");
  const [autoWrap, setAutoWrap] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectionCount, setSelectionCount] = useState<number>(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    const canvas = fabricCanvas;
    if (!canvas) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateSelection = (): void => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const active = canvas.getActiveObjects?.() ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const texts = active.filter((o: any) =>
        ["text", "i-text", "textbox"].includes(o?.type),
      );
      queueMicrotask(() => {
        setSelectionCount(texts.length);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const first = texts[0] as any;
        setSelectedText(first?.text ?? "");
      });
    };

    canvas.on?.("selection:created", updateSelection);
    canvas.on?.("selection:updated", updateSelection);
    canvas.on?.("selection:cleared", updateSelection);
    canvas.on?.("text:changed", updateSelection);

    updateSelection();

    return () => {
      canvas.off?.("selection:created", updateSelection);
      canvas.off?.("selection:updated", updateSelection);
      canvas.off?.("selection:cleared", updateSelection);
      canvas.off?.("text:changed", updateSelection);
    };
  }, [fabricCanvas]);

  const applyMode = (text: string): string => {
    if (mode === "equilibrado") return balanceText(text, targetLines);
    if (mode === "piramide") return pyramidText(text, targetLines, false);
    return pyramidText(text, targetLines, true);
  };

  const getSelectedTexts = (): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any[] => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active = canvas.getActiveObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return active.filter((o: any) =>
      ["text", "i-text", "textbox"].includes(o?.type),
    );
  };

  const handleRebalance = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const texts = getSelectedTexts();
    if (texts.length === 0) {
      toast.error("Selecione um texto");
      return;
    }

    for (const obj of texts) {
      const id = getObjectId(obj);
      if (!originalsRef.current.has(id)) {
        originalsRef.current.set(id, obj.text ?? "");
      }
      const rebalanced = applyMode(obj.text ?? "");
      obj.set?.("text", rebalanced);
      if (typeof obj.text === "string") {
        obj.text = rebalanced;
      }
    }
    canvas.requestRenderAll?.();
    toast.success(`Texto rebalanceado (${texts.length})`);
  };

  const handleRestore = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const texts = getSelectedTexts();
    if (texts.length === 0) {
      toast.error("Selecione um texto");
      return;
    }
    let restored = 0;
    for (const obj of texts) {
      const id = getObjectId(obj);
      const original = originalsRef.current.get(id);
      if (original !== undefined) {
        obj.set?.("text", original);
        obj.text = original;
        restored += 1;
      }
    }
    canvas.requestRenderAll?.();
    if (restored === 0) {
      toast.info("Nenhum texto original armazenado");
    } else {
      toast.success(`${restored} texto(s) restaurado(s)`);
    }
  };

  const handleAutoShrink = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const texts = getSelectedTexts();
    if (texts.length === 0) {
      toast.error("Selecione um texto");
      return;
    }
    const canvasWidth = canvas.getWidth?.() ?? 800;
    let shrunk = 0;
    for (const obj of texts) {
      let width = obj.width ?? 0;
      let fontSize = obj.fontSize ?? 16;
      let guard = 0;
      while (width > canvasWidth && fontSize > 6 && guard < 200) {
        fontSize -= 1;
        obj.set?.("fontSize", fontSize);
        obj.fontSize = fontSize;
        // Recalc width if available
        if (typeof obj._recalcTextDimensions === "function") {
          obj._recalcTextDimensions();
        }
        width = obj.width ?? width;
        guard += 1;
      }
      if (guard > 0) shrunk += 1;
    }
    canvas.requestRenderAll?.();
    if (shrunk === 0) {
      toast.info("Texto já cabe no canvas");
    } else {
      toast.success(`${shrunk} texto(s) ajustado(s)`);
    }
  };

  const previewText = selectedText ? applyMode(selectedText) : "";
  const charCount = selectedText.length;
  const lineCount = selectedText ? selectedText.split("\n").length : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <AlignCenterHorizontal className="h-5 w-5" />
        <h3 className="text-base font-semibold">Balanceamento de Linhas</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-md border p-2 text-xs">
        <div>
          <div className="text-muted-foreground">Selecionados</div>
          <div className="font-medium">{selectionCount}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Caracteres</div>
          <div className="font-medium">{charCount}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Linhas atuais</div>
          <div className="font-medium">{lineCount}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Linhas alvo</div>
          <div className="font-medium">{targetLines}</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="target-lines-slider"
          className="text-sm font-medium"
        >
          Linhas alvo: {targetLines}
        </label>
        <input
          id="target-lines-slider"
          type="range"
          min={2}
          max={6}
          step={1}
          value={targetLines}
          onChange={(e) => setTargetLines(Number(e.target.value))}
          className="w-full"
        />
        <Input
          type="number"
          min={2}
          max={6}
          value={targetLines}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) {
              setTargetLines(Math.min(6, Math.max(2, v)));
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Modo de balanceamento</span>
        <div className="grid grid-cols-3 gap-1">
          <Button
            type="button"
            variant={mode === "equilibrado" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("equilibrado")}
          >
            Equilibrado
          </Button>
          <Button
            type="button"
            variant={mode === "piramide" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("piramide")}
          >
            Pirâmide
          </Button>
          <Button
            type="button"
            variant={mode === "piramide-inv" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("piramide-inv")}
          >
            Pirâmide Inv.
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Pré-visualização</span>
        <pre className="min-h-[60px] whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-xs">
          {previewText || "Selecione um texto para pré-visualizar."}
        </pre>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleRebalance}>
          Rebalancear Texto
        </Button>
        <Button type="button" variant="outline" onClick={handleRestore}>
          Restaurar Original
        </Button>
        <Button type="button" variant="outline" onClick={handleAutoShrink}>
          Auto-Encolher
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoWrap}
          onChange={(e) => setAutoWrap(e.target.checked)}
        />
        <span>Auto-Quebrar Texto (em breve)</span>
      </label>
    </div>
  );
}
