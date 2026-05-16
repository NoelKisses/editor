"use client";

import { useEffect, useRef, useState } from "react";
import { CaseSensitive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MixedMode =
  | "alt-word"
  | "alt-char"
  | "first-big"
  | "last-word"
  | "random-underline"
  | "alt-bold";

const TEXT_TYPES = ["text", "i-text", "textbox"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAlternatingWordStyles(
  text: string,
  primary: string,
  accent: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<number, Record<number, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles: Record<number, Record<number, any>> = {};
  const lines = text.split("\n");
  lines.forEach((line, lineIndex) => {
    styles[lineIndex] = {};
    let charIndex = 0;
    let wordIndex = 0;
    const parts = line.split(/(\s+)/);
    for (const part of parts) {
      if (part.length === 0) continue;
      const isWhitespace = /^\s+$/.test(part);
      if (!isWhitespace) {
        const color = wordIndex % 2 === 0 ? primary : accent;
        for (let i = 0; i < part.length; i++) {
          styles[lineIndex][charIndex + i] = { fill: color };
        }
        wordIndex++;
      }
      charIndex += part.length;
    }
  });
  return styles;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAlternatingCharStyles(
  text: string,
  primary: string,
  accent: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<number, Record<number, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles: Record<number, Record<number, any>> = {};
  const lines = text.split("\n");
  lines.forEach((line, lineIndex) => {
    styles[lineIndex] = {};
    let visibleIndex = 0;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (/\s/.test(ch)) continue;
      const color = visibleIndex % 2 === 0 ? primary : accent;
      styles[lineIndex][i] = { fill: color };
      visibleIndex++;
    }
  });
  return styles;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFirstCharBigStyles(
  text: string,
  color: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<number, Record<number, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles: Record<number, Record<number, any>> = {};
  const lines = text.split("\n");
  lines.forEach((line, lineIndex) => {
    styles[lineIndex] = {};
    if (line.length > 0) {
      styles[lineIndex][0] = {
        fill: color,
        fontSize: 96,
        fontWeight: "bold",
      };
    }
  });
  return styles;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLastWordStyles(
  text: string,
  primary: string,
  accent: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<number, Record<number, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles: Record<number, Record<number, any>> = {};
  const lines = text.split("\n");
  lines.forEach((line, lineIndex) => {
    styles[lineIndex] = {};
    const match = line.match(/(\S+)\s*$/);
    if (!match) return;
    const lastWord = match[1];
    const start = line.lastIndexOf(lastWord);
    for (let i = 0; i < line.length; i++) {
      const inLast = i >= start && i < start + lastWord.length;
      styles[lineIndex][i] = {
        fill: inLast ? accent : primary,
        fontWeight: inLast ? "bold" : "normal",
      };
    }
  });
  return styles;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRandomUnderlineStyles(
  text: string,
  primary: string,
  accent: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<number, Record<number, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles: Record<number, Record<number, any>> = {};
  const lines = text.split("\n");
  lines.forEach((line, lineIndex) => {
    styles[lineIndex] = {};
    let charIndex = 0;
    const parts = line.split(/(\s+)/);
    for (const part of parts) {
      if (part.length === 0) continue;
      const isWhitespace = /^\s+$/.test(part);
      if (!isWhitespace) {
        const underline = Math.random() < 0.4;
        const color = underline ? accent : primary;
        for (let i = 0; i < part.length; i++) {
          styles[lineIndex][charIndex + i] = {
            fill: color,
            underline,
          };
        }
      }
      charIndex += part.length;
    }
  });
  return styles;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAlternatingBoldStyles(
  text: string,
  primary: string,
  accent: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<number, Record<number, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styles: Record<number, Record<number, any>> = {};
  const lines = text.split("\n");
  lines.forEach((line, lineIndex) => {
    styles[lineIndex] = {};
    let charIndex = 0;
    let wordIndex = 0;
    const parts = line.split(/(\s+)/);
    for (const part of parts) {
      if (part.length === 0) continue;
      const isWhitespace = /^\s+$/.test(part);
      if (!isWhitespace) {
        const bold = wordIndex % 2 === 0;
        for (let i = 0; i < part.length; i++) {
          styles[lineIndex][charIndex + i] = {
            fill: bold ? accent : primary,
            fontWeight: bold ? "bold" : "normal",
          };
        }
        wordIndex++;
      }
      charIndex += part.length;
    }
  });
  return styles;
}

interface TextMixedStylePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextMixedStylePanel({ fabricCanvas }: TextMixedStylePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [mode, setMode] = useState<MixedMode>("alt-word");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [accentColor, setAccentColor] = useState("#ef4444");
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const update = () => {
      const active = fabricCanvas.getActiveObjects?.() ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasText = active.some((o: any) => TEXT_TYPES.includes(o?.type));
      queueMicrotask(() => setHasSelection(hasText));
    };

    fabricCanvas.on?.("selection:created", update);
    fabricCanvas.on?.("selection:updated", update);
    fabricCanvas.on?.("selection:cleared", update);
    update();

    return () => {
      fabricCanvas.off?.("selection:created", update);
      fabricCanvas.off?.("selection:updated", update);
      fabricCanvas.off?.("selection:cleared", update);
    };
  }, [fabricCanvas]);

  const applyMixedStyle = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selected = (canvas.getActiveObjects?.() ?? []).filter((o: any) =>
      TEXT_TYPES.includes(o?.type),
    );

    if (selected.length === 0) {
      toast.error("Selecione ao menos um texto");
      return;
    }

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric ?? (m as any);
        void f;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selected.forEach((obj: any) => {
          const text: string = obj.text ?? "";
          if (!text) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let styles: Record<number, Record<number, any>> = {};

          switch (mode) {
            case "alt-word":
              styles = buildAlternatingWordStyles(text, primaryColor, accentColor);
              break;
            case "alt-char":
              styles = buildAlternatingCharStyles(text, primaryColor, accentColor);
              break;
            case "first-big":
              styles = buildFirstCharBigStyles(text, accentColor);
              break;
            case "last-word":
              styles = buildLastWordStyles(text, primaryColor, accentColor);
              break;
            case "random-underline":
              styles = buildRandomUnderlineStyles(text, primaryColor, accentColor);
              break;
            case "alt-bold":
              styles = buildAlternatingBoldStyles(text, primaryColor, accentColor);
              break;
          }

          obj.styles = styles;
          obj.set({ dirty: true });
        });

        canvas.requestRenderAll?.();
        toast.success("Estilo misto aplicado");
      })
      .catch(() => {
        toast.error("Falha ao carregar Fabric.js");
      });
  };

  const resetStyle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selected = (canvas.getActiveObjects?.() ?? []).filter((o: any) =>
      TEXT_TYPES.includes(o?.type),
    );

    if (selected.length === 0) {
      toast.error("Selecione ao menos um texto");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selected.forEach((obj: any) => {
      obj.styles = {};
      obj.set({ dirty: true });
    });

    canvas.requestRenderAll?.();
    toast.success("Estilo resetado");
  };

  const modes: { id: MixedMode; label: string }[] = [
    { id: "alt-word", label: "Alternado Por Palavra" },
    { id: "alt-char", label: "Alternado Por Letra" },
    { id: "first-big", label: "Primeira Maiúscula" },
    { id: "last-word", label: "Última Maiúscula" },
    { id: "random-underline", label: "Sublinhado Aleatório" },
    { id: "alt-bold", label: "Negrito Alternado" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <CaseSensitive className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Estilo Misto / Multi-Word</h3>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Modo de Estilo
        </span>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((m) => (
            <Button
              key={m.id}
              type="button"
              variant={mode === m.id ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m.id)}
              className="h-auto whitespace-normal py-2 text-xs"
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Cor Primária
        </span>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-9 w-14 cursor-pointer p-1"
          />
          <Input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-9 flex-1 font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Cor de Destaque
        </span>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-9 w-14 cursor-pointer p-1"
          />
          <Input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-9 flex-1 font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={applyMixedStyle}
          disabled={!hasSelection}
          className="w-full"
        >
          Aplicar Estilo Misto
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={resetStyle}
          disabled={!hasSelection}
          className="w-full"
        >
          Resetar Estilo
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Dica: funciona melhor com Textbox/IText que suportam estilos por
        caractere.
      </p>
    </div>
  );
}
